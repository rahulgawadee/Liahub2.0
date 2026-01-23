import React from 'react'
import { cn } from '../../lib/utils'

export function EntityTabs({ active, entities, onSelect, disabled = false }) {
  if (!entities?.length) return null

  return (
    <div className="flex items-center justify-center">
      <div
        role="tablist"
        aria-label="Select account type"
        className={cn(
          'inline-flex rounded-lg bg-[#202020] p-1 text-sm shadow-inner',
          disabled && 'opacity-70 pointer-events-none'
        )}
      >
        {entities.map(({ key, label }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-disabled={disabled}
              onClick={() => {
                if (!disabled) onSelect?.(key)
              }}
              className={cn(
                'px-4 sm:px-5 py-1.5 rounded-md transition-all duration-200 ease-in-out capitalize font-medium',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
