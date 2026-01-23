import React from 'react'

export default function FolderList({ folders, selected, onSelect }) {
  return (
    <div className="space-y-2">
      {folders.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelect(f.name)}
          aria-pressed={selected === f.name}
          className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors ${selected === f.name ? 'bg-white text-black' : 'text-white/90 bg-transparent border border-muted-foreground/10'}`}
        >
          <span className="truncate">{f.name}</span>
          <span className="text-xs text-muted-foreground">({f.files?.length || 0})</span>
        </button>
      ))}
    </div>
  )
}
