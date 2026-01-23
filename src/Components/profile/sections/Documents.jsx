import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '@/redux/store'
import { Button } from '@/Components/ui/button'
import { Card } from '@/Components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { FileText, Download, Trash2, Upload, MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu'
import apiClient from '@/lib/apiClient'

export default function Documents() {
  const { user } = useSelector(selectAuth)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    visibility: 'private',
    description: ''
  })

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/documents')
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!formData.name || !formData.url) {
      alert('Please provide document name and URL')
      return
    }

    try {
      // For now, we'll use a simple URL-based upload
      // In production, you'd use actual file upload with FormData
      const mockFile = {
        originalname: formData.name,
        mimetype: 'application/pdf',
        size: 0,
        path: formData.url
      }

      const formPayload = new FormData()
      formPayload.append('description', formData.description)
      formPayload.append('visibility', formData.visibility)
      
      // Note: This is a simplified version. In production, you'd handle actual file uploads
      const response = await apiClient.post('/documents', {
        name: formData.name,
        storagePath: formData.url,
        visibility: formData.visibility,
        description: formData.description,
        mimeType: 'application/pdf',
        size: 0
      })

      setDocuments([response.data, ...documents])
      setUploadOpen(false)
      setFormData({ name: '', url: '', visibility: 'private', description: '' })
    } catch (error) {
      console.error('Failed to upload document:', error)
      alert('Failed to upload document')
    }
  }

  const handleDelete = async (documentId) => {
    if (!confirm('Delete this document?')) return

    try {
      await apiClient.delete(`/documents/${documentId}`)
      setDocuments(documents.filter(d => d.id !== documentId))
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Failed to delete document')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType) => {
    return <FileText className="h-10 w-10 text-muted-foreground" />
  }

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading documents...</div>
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <Button onClick={() => setUploadOpen(true)} className="w-full">
        <Upload className="h-4 w-4 mr-2" /> Upload Document
      </Button>

      {/* Documents grid */}
      {documents.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No documents uploaded yet. Upload your first document!
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map(doc => (
            <Card key={doc.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(doc.mimeType)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                    <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{doc.visibility}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href={doc.storagePath} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" /> Download
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(doc.id)} 
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {doc.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Document Name</Label>
              <Input
                placeholder="Resume.pdf"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Document URL</Label>
              <Input
                type="url"
                placeholder="https://example.com/document.pdf"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Note: In production, you'd upload files directly. For now, provide a URL.
              </p>
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description of the document"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Visibility</Label>
              <Select 
                value={formData.visibility} 
                onValueChange={(val) => setFormData({ ...formData, visibility: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (Only me)</SelectItem>
                  <SelectItem value="connections">Connections</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
