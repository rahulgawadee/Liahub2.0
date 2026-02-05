import React from 'react'
import { cn } from '../../lib/utils'
import { useTheme } from '@/hooks/useTheme'

export function EntityTabs({ active, entities, onSelect, disabled = false }) {
  const { isDark } = useTheme()
  if (!entities?.length) return null

  return (
    <div className="flex items-center justify-center w-full px-2 sm:px-0">
      <div
        role="tablist"
        aria-label="Select account type"
        className={cn(
          'inline-flex gap-0.5 sm:gap-1 p-1 rounded-full border w-full sm:w-auto justify-between sm:justify-center transition-colors duration-300',
          isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-300',
          disabled && 'opacity-50 pointer-events-none'
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
              style={isActive ? {
                backgroundColor: isDark ? 'white' : 'black',
                color: isDark ? 'black' : 'white'
              } : {}}
              className={cn(
                'flex-1 sm:flex-initial px-2 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-full font-semibold transition-all duration-300 ease-out capitalize text-[11px] sm:text-sm whitespace-nowrap',
                !isActive && (isDark
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
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
