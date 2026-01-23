import React from 'react'

export default function DocumentViewModal({ file, onClose }) {
  if (!file) return null

  const url = file.blobUrl || null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="mx-auto w-full max-w-3xl space-y-4 rounded-3xl bg-black p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{file.name}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground">×</button>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Size: {(file.size && `${(file.size/1024).toFixed(1)} KB`) || '—'}</div>
          {url ? (
            <div>
              <iframe title={file.name} src={url} className="w-full h-[60vh] border rounded-md" />
              <div className="mt-2 text-right">
                <a href={url} download={file.name} className="text-sm text-primary">Download</a>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Preview not available for this file type.</div>
          )}
        </div>
      </div>
    </div>
  )
}
