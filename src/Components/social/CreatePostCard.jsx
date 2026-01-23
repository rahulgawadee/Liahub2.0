import React, { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar'
import { Button } from '@/Components/ui/button'
import { Card, CardContent } from '@/Components/ui/card'
import { Textarea } from '@/Components/ui/textarea'
import { Image as ImageIcon, FileText, X, Loader2 } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUtils'

export default function CreatePostCard({ user, onCreatePost, onFileUpload }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      const newFiles = await onFileUpload(files)
      setUploadedFiles(prev => [...prev, ...newFiles])
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && uploadedFiles.length === 0) return

    setSubmitting(true)
    try {
      await onCreatePost(content, uploadedFiles)
      setContent('')
      setUploadedFiles([])
      setIsExpanded(false)
    } catch (error) {
      console.error('Post creation failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const renderFilePreview = (file, index) => {
    if (file.type === 'image') {
      return (
        <div key={index} className="relative group">
          <img 
            src={file.url} 
            alt={file.filename} 
            className="h-32 w-32 object-cover rounded-xl shadow-md border-2 border-border group-hover:border-primary transition-all" 
          />
          <button
            onClick={() => removeFile(index)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg hover:scale-110 transition-transform"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    } else if (file.type === 'pdf') {
      return (
        <div key={index} className="relative flex items-center gap-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-3 rounded-xl border-l-4 border-red-500 shadow-sm">
          <FileText className="h-10 w-10 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{file.filename}</p>
            <p className="text-xs text-muted-foreground">PDF Document</p>
          </div>
          <button
            onClick={() => removeFile(index)}
            className="text-red-500 hover:text-red-600 flex-shrink-0 hover:scale-110 transition-transform"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )
    }
  }

  return (
    <Card className="mb-6 shadow-md border-0">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-primary/10">
            <AvatarImage src={getImageUrl(user?.media?.avatar)} />
            <AvatarFallback />
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {!isExpanded ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-left px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground transition-all font-medium border border-border/50 hover:border-border"
              >
                What's on your mind, {user?.name?.first}?
              </button>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="Share your thoughts, ideas, or updates..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none border-2 focus-visible:ring-2 focus-visible:ring-primary px-4 py-3 text-base"
                  autoFocus
                />
                
                {/* File Previews */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-xl">
                    {uploadedFiles.map((file, idx) => renderFilePreview(file, idx))}
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full gap-2 flex-1 sm:flex-initial"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span className="font-medium">Photo</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full gap-2 flex-1 sm:flex-initial"
                    >
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">PDF</span>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsExpanded(false)
                        setContent('')
                        setUploadedFiles([])
                      }}
                      className="rounded-full px-6 flex-1 sm:flex-initial"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={submitting || uploading || (!content.trim() && uploadedFiles.length === 0)}
                      className="rounded-full bg-primary hover:bg-primary/90 font-semibold px-8 shadow-md hover:shadow-lg transition-all flex-1 sm:flex-initial"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
