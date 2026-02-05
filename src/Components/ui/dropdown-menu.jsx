import React, { useState, useRef, useEffect, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

const DropdownMenuContext = createContext()

export const DropdownMenu = ({ children }) => {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export const DropdownMenuTrigger = ({ asChild = false, children, ...props }) => {
  const { open, setOpen } = useContext(DropdownMenuContext)
  const Comp = asChild ? 'span' : 'button'
  return (
    <Comp
      {...props}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen(!open)
        }
      }}
    >
      {children}
    </Comp>
  )
}

export const DropdownMenuContent = ({ children, side = 'right', align = 'end', className = '', sideOffset = 4 }) => {
  const { open, setOpen } = useContext(DropdownMenuContext)
  const { isDark } = useTheme()
  const ref = useRef(null)

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
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(`absolute z-50 min-w-56 rounded-lg border p-2 text-sm shadow-md transition-colors duration-300 ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`, className)}
      style={{
        top: sideOffset + 32,
        right: align === 'end' ? 0 : 'auto',
        left: align === 'start' ? 0 : 'auto'
      }}
    >
      {children}
    </div>
  )
}

export const DropdownMenuLabel = (p) => {
  const { isDark } = useTheme()
  return <div className={`px-2 py-1.5 text-xs font-medium transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} {...p} />
}

export const DropdownMenuSeparator = () => {
  const { isDark } = useTheme()
  return <div className={`my-2 h-px transition-colors duration-300 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
}

export const DropdownMenuGroup = ({ children }) => <div className="space-y-1">{children}</div>

export const DropdownMenuItem = ({ children, ...props }) => {
  const { isDark } = useTheme()
  return <button className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-left transition-colors duration-300 ${isDark ? 'text-white hover:bg-gray-900' : 'text-black hover:bg-gray-100'}`} type="button" {...props}>{children}</button>
}
