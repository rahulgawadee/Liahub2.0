import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export const Select = ({ children, value, onValueChange, onChange, className = '' }) => {
  const [open, setOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)
  const ref = useRef(null)
  const { isDark } = useTheme()

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  useEffect(() => {
    function outside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', outside)
      return () => document.removeEventListener('mousedown', outside)
    }
  }, [open])

  const handleSelect = (val) => {
    setSelectedValue(val)
    // Call both handlers for compatibility: preferred onValueChange, but support onChange used elsewhere
    onValueChange?.(val)
    if (onChange) {
      try {
        onChange({ target: { value: val } })
      } catch (e) {
        // ignore
      }
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <SelectTrigger onClick={() => setOpen(!open)} className={className} isDark={isDark}>
        <SelectValue value={selectedValue} isDark={isDark} />
      </SelectTrigger>
      {open && (
        <SelectContent isDark={isDark}>
          {React.Children.map(children, (child) =>
            React.cloneElement(child, { onSelect: handleSelect, isDark })
          )}
        </SelectContent>
      )}
    </div>
  )
}

export const SelectTrigger = ({ children, onClick, className = '', isDark = true }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      // Make dropdown trigger clearly visible with theme support
      'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300',
      isDark ? 'border-gray-600 bg-black text-white focus:ring-gray-500' : 'border-gray-400 bg-white text-black focus:ring-gray-400',
      className
    )}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
)

export const SelectValue = ({ value, placeholder = 'Select...', isDark = true }) => {
  const displayValue = value || placeholder
  return <span className={`truncate transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{displayValue}</span>
}

export const SelectContent = ({ children, className = '', isDark = true }) => (
  <div className={cn(
    // Dropdown content with theme support
    'absolute top-full z-50 mt-1 max-h-60 min-w-[8rem] w-full overflow-y-auto rounded-md border p-1 shadow-md transition-colors duration-300',
    isDark ? 'border-gray-600 bg-black text-white' : 'border-gray-300 bg-white text-black',
    className
  )}>
    {children}
  </div>
)

export const SelectItem = ({ children, value, onSelect, className = '', isDark = true }) => (
  <button
    type="button"
    onClick={() => onSelect?.(value)}
    className={cn(
      // Make items readable with theme support
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-3 text-sm text-left outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors duration-300',
      isDark ? 'hover:bg-gray-900 hover:text-white text-white' : 'hover:bg-gray-100 hover:text-black text-black',
      className
    )}
  >
    {children}
  </button>
)

export const SelectOption = ({ value, children, className = '', onSelect }) => (
  // Use SelectItem (button) so options are interactive inside the custom dropdown
  <SelectItem value={value} onSelect={onSelect} className={className}>
    {children}
  </SelectItem>
)
