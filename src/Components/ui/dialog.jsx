import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { X } from 'lucide-react'

export const Dialog = ({ open, onOpenChange, children, allowOverflow = false }) => {
  const { isDark } = useTheme()
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div className={`relative z-[10000] max-h-[90vh] max-w-4xl w-full mx-auto ${allowOverflow ? 'overflow-visible' : 'overflow-auto'}`}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export const DialogContent = ({ children, className = '' }) => (
  <Card className={`shadow-2xl transition-colors duration-300 ${className}`}>
    {children}
  </Card>
)

export const DialogHeader = ({ children }) => (
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
    {children}
  </CardHeader>
)

export const DialogTitle = ({ children, className = '' }) => (
  <CardTitle className={`text-xl font-semibold transition-colors duration-300 ${className}`}>
    {children}
  </CardTitle>
)

export const DialogDescription = ({ children, className = '' }) => (
  <p className={`text-sm transition-colors duration-300 ${className}`}>
    {children}
  </p>
)

export const DialogBody = ({ children }) => (
  <CardContent className="space-y-4">
    {children}
  </CardContent>
)

export const DialogFooter = ({ children, className = '' }) => {
  const { isDark } = useTheme()
  return (
    <div className={`flex justify-end gap-2 pt-4 border-t transition-colors duration-300 ${isDark ? 'border-gray-800' : 'border-gray-200'} ${className}`}>
      {children}
    </div>
  )
}

export const DialogClose = ({ onClick }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className="h-8 w-8 p-0 rounded-full hover:bg-muted"
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </Button>
)