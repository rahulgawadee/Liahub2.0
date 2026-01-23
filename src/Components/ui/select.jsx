import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

export const Select = ({ children, value, onValueChange, onChange, className = '' }) => {
  const [open, setOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)
  const ref = useRef(null)

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
      <SelectTrigger onClick={() => setOpen(!open)} className={className}>
        <SelectValue value={selectedValue} />
      </SelectTrigger>
      {open && (
        <SelectContent>
          {React.Children.map(children, (child) =>
            React.cloneElement(child, { onSelect: handleSelect })
          )}
        </SelectContent>
      )}
    </div>
  )
}

export const SelectTrigger = ({ children, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      // Make dropdown trigger clearly visible: gray background and white text
      'flex h-10 w-full items-center justify-between rounded-md border border-gray-600 bg-background px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
)

export const SelectValue = ({ value, placeholder = 'Select...' }) => {
  const displayValue = value || placeholder
  return <span className="truncate">{displayValue}</span>
}

export const SelectContent = ({ children, className = '' }) => (
  <div className={cn(
    // Dropdown content should also be gray with white text
    'absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-600 bg-background p-1 text-white shadow-md',
    className
  )}>
    {children}
  </div>
)

export const SelectItem = ({ children, value, onSelect, className = '' }) => (
  <button
    type="button"
    onClick={() => onSelect?.(value)}
    className={cn(
      // Make items readable on gray background
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-600 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
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
