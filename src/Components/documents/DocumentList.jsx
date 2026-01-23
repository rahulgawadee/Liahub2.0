import React from 'react'
import { FileText, Trash2 } from 'lucide-react'

export default function DocumentList({ files = [], onOpen, onRemove }) {
  if (!files.length) return <div className="text-sm text-muted-foreground">No documents in this folder.</div>

  return (
    <div>
      {/* horizontal scroll row of tiles */}
      <div className="flex gap-4 overflow-x-auto py-2">
        {files.map((f) => (
          <div key={f.id} className="min-w-[120px] max-w-[140px] flex-shrink-0">
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => onOpen(f)} className="w-24 h-24 rounded-lg bg-muted/5 border border-muted-foreground/10 flex items-center justify-center hover:bg-muted/20 transition-colors">
                <FileText className="w-8 h-8 text-white" />
              </button>
              <div className="text-center mt-1">
                <div className="text-sm font-medium truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">{(f.size && `${(f.size/1024).toFixed(1)} KB`) || ''}</div>
              </div>
              <div className="mt-2">
                <button onClick={() => onRemove(f.id)} className="text-muted-foreground p-1 rounded-md hover:bg-muted/80"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
