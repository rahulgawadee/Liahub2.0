import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

export default function TypeaheadInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  className,
  icon,
  ...rest
}) {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => {
    const v = (value || '').toLowerCase()
    if (!v) return suggestions.slice(0, 6)
    return suggestions.filter(s => s.toLowerCase().includes(v)).slice(0, 8)
  }, [value, suggestions])

  return (
    <div className={cn('relative w-full', className)}>
      <div className={`flex items-center gap-3 border rounded-lg px-4 py-3 focus-within:border-blue-500 transition-all duration-300 ${
        isDark 
          ? 'border-gray-700 bg-gray-900/50 text-gray-100 focus-within:bg-gray-900'
          : 'border-gray-300 bg-white text-black focus-within:bg-gray-50'
      }`}>
        {icon && <span className={`flex-shrink-0 transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>{icon}</span>}
        <input
          className={`bg-transparent outline-none w-full text-sm transition-colors duration-300 ${
            isDark ? 'placeholder-gray-500' : 'placeholder-gray-400'
          }`}
          value={value}
          onChange={(e) => { onChange?.(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(()=>setOpen(false), 120)}
          placeholder={placeholder}
          {...rest}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className={`absolute z-20 mt-2 w-full rounded-lg border backdrop-blur shadow-2xl overflow-hidden transition-colors duration-300 ${
          isDark 
            ? 'border-gray-700 bg-gray-900 text-gray-100'
            : 'border-gray-300 bg-white text-black'
        }`}>
          {/* Make suggestions list scrollable when long */}
          <div className="max-h-52 overflow-auto">
            {filtered.map((s) => (
              <button
                key={s}
                className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors text-sm ${
                  isDark
                    ? 'hover:bg-blue-500/10 border-gray-800'
                    : 'hover:bg-blue-50 border-gray-200'
                }`}
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
