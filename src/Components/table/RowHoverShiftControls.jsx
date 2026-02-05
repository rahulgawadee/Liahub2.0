import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export default function RowHoverShiftControls({
  onLeft,
  onRight,
  showLeft = true,
  showRight = true,
  disabledLeft = false,
  disabledRight = false,
  className = '',
  size = 'sm',
}) {
  const { isDark } = useTheme()
  const buttonSize = size === 'md' ? 'h-8 w-8' : 'h-6 w-6'

  return (
    <div className={`flex items-center gap-1 ${className}`.trim()}>
      {showLeft ? (
        <button
          type="button"
          onClick={onLeft}
          disabled={disabledLeft || !onLeft}
          aria-label="Move left"
          title="Move left"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.9)' : '#000000',
            color: isDark ? '#000000' : '#FFFFFF'
          }}
          className={`${buttonSize} inline-flex cursor-pointer items-center justify-center rounded-full shadow-sm opacity-0 transition-all group-hover:opacity-100 disabled:cursor-default disabled:pointer-events-none disabled:opacity-0`}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#1f2937'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.9)' : '#000000'
          }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {showRight ? (
        <button
          type="button"
          onClick={onRight}
          disabled={disabledRight || !onRight}
          aria-label="Move right"
          title="Move right"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.9)' : '#000000',
            color: isDark ? '#000000' : '#FFFFFF'
          }}
          className={`${buttonSize} inline-flex cursor-pointer items-center justify-center rounded-full shadow-sm opacity-0 transition-all group-hover:opacity-100 disabled:cursor-default disabled:pointer-events-none disabled:opacity-0`}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#1f2937'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.9)' : '#000000'
          }}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}
