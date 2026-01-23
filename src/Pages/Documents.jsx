import React, { useRef, useState, useCallback } from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardHeader, CardTitle, CardContent } from '../Components/ui/card'
import { Button } from '../Components/ui/button'
import { Input } from '../Components/ui/input'
import { Folder, UploadCloud, FileText, Trash2, CheckCircle } from 'lucide-react'
import DocumentList from '@/Components/documents/DocumentList'
import DocumentViewModal from '@/Components/documents/DocumentViewModal'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export default function Documents(){
  const fileInputRef = useRef(null)
  const [_uploads, setUploads] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('Resumes')
  const [newFolderName, setNewFolderName] = useState('')

  const handleFiles = useCallback((files) => {
    // Open folder selection modal first, store pending files
    const list = Array.from(files).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}`,
      file: f,
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'pending',
      folder: null
    }))
    setPendingFiles(list)
    setShowFolderModal(true)
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files)
  }

  const onBrowse = () => fileInputRef.current?.click()

  const onFileInput = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files)
    e.target.value = null
  }

  // removed unused removeUpload helper

  const confirmFolderAndUpload = () => {
    const folderName = newFolderName.trim() || selectedFolder

    // ensure folder exists in state
    setFolders((fs) => {
      if (fs.find((x) => x.name === folderName)) return fs
      return [{ id: Date.now().toString(), name: folderName, files: [] }, ...fs]
    })

    // attach folder to pending files and move them to uploads
    const toAdd = pendingFiles.map((p) => ({ ...p, folder: folderName, status: 'uploading' }))
    setUploads((s) => [...toAdd, ...s])
    setPendingFiles([])
    setShowFolderModal(false)

  // add files to folder list and make folder active
  setFolders((fs) => fs.map((f) => f.name === folderName ? { ...f, files: [...(f.files||[]), ...toAdd] } : f))
  setActiveFolder(folderName)

    // mock upload progress for these new items
    toAdd.forEach((item) => {
      const interval = setInterval(() => {
        setUploads((prev) => prev.map((u) => {
          if (u.id !== item.id) return u
          const next = Math.min(100, u.progress + Math.floor(Math.random() * 20) + 10)
          return { ...u, progress: next, status: next === 100 ? 'done' : 'uploading' }
        }))
      }, 600)

      const checker = setInterval(() => {
        setUploads((prev) => {
          const found = prev.find((u) => u.id === item.id)
          if (found && found.progress >= 100) {
            clearInterval(interval)
            clearInterval(checker)
          }
          return prev
        })
      }, 500)
    })
  }

  // folders state for folder list and files
  const [foldersState, setFolders] = useState([
    { id: 'resumes', name: 'Resumes', files: [] },
    { id: 'contracts', name: 'Contracts', files: [] },
    { id: 'reports', name: 'Reports', files: [] },
    { id: 'others', name: 'Others', files: [] },
  ])

  const [activeFolder, setActiveFolder] = useState(foldersState[0].name)

  const openDocument = (file) => {
    // create blob url for preview where possible
    if (file.file) {
      try {
        const blobUrl = URL.createObjectURL(file.file)
        setViewing({ ...file, blobUrl })
      } catch {
        setViewing(file)
      }
    } else {
      setViewing(file)
    }
  }

  const [viewing, setViewing] = useState(null)

  const removeFileFromFolder = (id) => {
    setFolders((fs) => fs.map((f) => ({ ...f, files: (f.files || []).filter(x => x.id !== id) })))
    setUploads((u) => u.filter(x => x.id !== id))
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset>
          <div className="p-6 space-y-6 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 w-full">
                {/* Top controls */}
                <div className="flex gap-2 items-center">
                  <Input placeholder="Search documents..." className="flex-1" />
                  <Button variant="ghost" className="px-3">Filter</Button>
                  <input ref={fileInputRef} type="file" multiple onChange={onFileInput} className="hidden" />
                  <Button variant="ghost" onClick={onBrowse} className="flex items-center gap-2 bg-transparent">
                    <UploadCloud className="w-4 h-4 text-white" />
                    Upload
                  </Button>
                </div>

                {/* Upload / Drop area */}
                <div
                  onDragOver={(e)=>{e.preventDefault(); e.dataTransfer.dropEffect = 'copy'}}
                  onDrop={onDrop}
                  className="rounded-lg p-6 bg-muted/10 border border-muted-foreground/20 flex flex-col md:flex-row gap-6 items-center"
                >
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-lg font-medium text-muted-foreground mb-1">Upload documents</h4>
                    <p className="text-sm text-muted-foreground">Drag & drop files here or click upload. Supported: PDF, DOCX, PNG, JPG.</p>
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={onBrowse} className="bg-transparent border border-muted-foreground/20 text-white">
                        <UploadCloud className="w-5 h-5 text-white" />
                        <span className="ml-2">Select files</span>
                      </Button>
                      <Button variant="ghost" onClick={() => { setUploads([]) }} className="text-sm text-muted-foreground border border-muted-foreground/20 bg-transparent">Clear</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Uploads are stored in your account and visible across devices.</p>
                  </div>
                </div>

                {/* Single folder row with icons */}
                <div>
                  <h4 className="font-medium mb-3">Folders</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 py-2">
                    {foldersState.map((f) => (
                      <div key={f.id} className="w-full">
                        <button onClick={() => setActiveFolder(f.name)} className={`w-full h-28 rounded-lg flex flex-col items-center justify-center transition-colors px-2 ${activeFolder === f.name ? 'bg-white text-black' : 'bg-transparent text-white border border-muted-foreground/10'}`}>
                          <Folder className={`w-7 h-7 ${activeFolder === f.name ? 'text-black' : 'text-white'}`} />
                          <div className="text-xs mt-2 truncate w-full text-center">{f.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">({(f.files||[]).length})</div>
                        </button>
                      </div>
                    ))}
                    <div className="w-full">
                      <button onClick={()=> { setNewFolderName(''); setSelectedFolder(''); setShowFolderModal(true) }} className="w-full h-28 rounded-lg flex flex-col items-center justify-center bg-transparent text-white border border-dashed border-muted-foreground/20">
                        <div className="text-2xl">+</div>
                        <div className="text-xs mt-2">New folder</div>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">{activeFolder}</h5>
                    <DocumentList files={(foldersState.find(x => x.name === activeFolder)?.files) || []} onOpen={openDocument} onRemove={removeFileFromFolder} />
                  </div>
                </div>

                {/* Folder selection modal for pending files */}
                {showFolderModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="mx-auto w-full max-w-2xl space-y-6 rounded-3xl bg-black p-6 text-white shadow-2xl">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Add files to folder</h2>
                        <button
                          type="button"
                          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted/80"
                          onClick={() => { setShowFolderModal(false); setPendingFiles([]) }}
                          aria-label="Close dialog"
                        >
                          ×
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground block mb-2">Choose folder</label>
                          <div className="flex gap-2 flex-wrap">
                            {foldersState.map((ff) => (
                              <button
                                key={ff.name}
                                onClick={() => setSelectedFolder(ff.name)}
                                aria-pressed={selectedFolder === ff.name}
                                className={`px-3 py-2 rounded-md border text-sm transition-colors ${selectedFolder === ff.name ? 'bg-white text-black border-white' : 'border-muted-foreground/20 text-white/90'}`}
                              >
                                {ff.name}
                              </button>
                            ))}
                          </div>

                          <div className="mt-4">
                            <label className="text-sm text-muted-foreground block mb-1">Or create a new folder</label>
                            <input value={newFolderName} onChange={(e)=>setNewFolderName(e.target.value)} placeholder="New folder name" className="w-full rounded-xl border border-border/40 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm text-muted-foreground block mb-2">Files to upload</label>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {pendingFiles.map((p) => (
                              <div key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/5 border border-muted-foreground/10">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-white" />
                                  <div>
                                    <div className="text-sm">{p.name}</div>
                                    <div className="text-xs text-muted-foreground">{formatBytes(p.size)}</div>
                                  </div>
                                </div>
                                <div>
                                  <button onClick={()=> setPendingFiles((s)=> s.filter(x=> x.id !== p.id))} className="text-xs text-muted-foreground">Remove</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button className="px-4 py-2 rounded-md text-sm border border-muted-foreground/20 bg-transparent" onClick={() => { setShowFolderModal(false); setPendingFiles([]) }}>Cancel</button>
                        <button className="px-4 py-2 rounded-md text-sm bg-primary" onClick={confirmFolderAndUpload}>Upload to "{newFolderName.trim() || selectedFolder }"</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document viewer modal */}
                {viewing && (
                  <DocumentViewModal file={viewing} onClose={() => { if (viewing?.blobUrl) URL.revokeObjectURL(viewing.blobUrl); setViewing(null) }} />
                )}

                {/* Duplicate folders block removed (single folder row above is used) */}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
