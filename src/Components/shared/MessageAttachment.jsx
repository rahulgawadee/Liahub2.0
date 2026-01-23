import React from 'react'
import { FileText, Image, FileArchive, Download, File } from 'lucide-react'
import { Button } from '../ui/button'

const getFileIcon = (mimeType) => {
  if (!mimeType) return <File className="h-5 w-5" />
  
  if (mimeType.startsWith('image/')) {
    return <Image className="h-5 w-5" />
  } else if (
    mimeType.includes('pdf') ||
    mimeType.includes('word') ||
    mimeType.includes('document')
  ) {
    return <FileText className="h-5 w-5" />
  } else if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('7z') ||
    mimeType.includes('compressed')
  ) {
    return <FileArchive className="h-5 w-5" />
  }
  return <File className="h-5 w-5" />
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const MessageAttachment = ({ attachment, className = '' }) => {
  if (!attachment) return null

  const { filename, url, mimeType, size } = attachment
  const isImage = mimeType?.startsWith('image/')

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'download'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`rounded-xl overflow-hidden bg-background/60 backdrop-blur-sm ${className}`}>
      {isImage ? (
        <div className="space-y-2">
          <img
            src={url}
            alt={filename}
            className="w-full max-h-64 sm:max-h-80 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(url, '_blank')}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2 pb-2">
            <span className="truncate flex-1">{filename}</span>
            {size && <span className="ml-2 flex-shrink-0">{formatFileSize(size)}</span>}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 sm:p-4">
          <div className="flex-shrink-0 p-2.5 sm:p-3 rounded-xl bg-primary/10 text-primary">
            {getFileIcon(mimeType)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{filename}</p>
            {size && <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(size)}</p>}
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleDownload}
            className="flex-shrink-0 rounded-full h-9 w-9 hover:bg-primary/10 hover:text-primary"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      )}
    </div>
  )
}

export default MessageAttachment
