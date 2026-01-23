import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export default function TypeaheadInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  className,
  icon,
  ...rest
}) {
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => {
    const v = (value || '').toLowerCase()
    if (!v) return suggestions.slice(0, 6)
    return suggestions.filter(s => s.toLowerCase().includes(v)).slice(0, 8)
  }, [value, suggestions])

  return (
    <div className={cn('relative w-full', className)}>
      <div className="flex items-center gap-3 border border-gray-700 rounded-lg px-4 py-3 bg-gray-900/50 text-gray-100 focus-within:border-blue-500 focus-within:bg-gray-900 transition-all">
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
        <input
          className="bg-transparent outline-none w-full placeholder-gray-500 text-sm"
          value={value}
          onChange={(e) => { onChange?.(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(()=>setOpen(false), 120)}
          placeholder={placeholder}
          {...rest}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 backdrop-blur text-gray-100 shadow-2xl overflow-hidden">
          {/* Make suggestions list scrollable when long */}
          <div className="max-h-52 overflow-auto">
            {filtered.map((s) => (
              <button
                key={s}
                className="w-full text-left px-4 py-3 hover:bg-blue-500/10 border-b border-gray-800 last:border-b-0 transition-colors text-sm"
                onMouseDown={(e)=>e.preventDefault()}
                onClick={() => { onChange?.(s); setOpen(false) }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
