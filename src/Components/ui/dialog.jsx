import React, { useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { X } from 'lucide-react'

export const Dialog = ({ open, onOpenChange, children }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 max-h-[90vh] max-w-4xl w-full mx-auto overflow-auto">
        {children}
      </div>
    </div>
  )
}

export const DialogContent = ({ children, className = '' }) => (
  <Card className={`shadow-2xl ${className}`}>
    {children}
  </Card>
)

export const DialogHeader = ({ children }) => (
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
    {children}
  </CardHeader>
)

export const DialogTitle = ({ children, className = '' }) => (
  <CardTitle className={`text-xl font-semibold ${className}`}>
    {children}
  </CardTitle>
)

export const DialogDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
)

export const DialogBody = ({ children }) => (
  <CardContent className="space-y-4">
    {children}
  </CardContent>
)

export const DialogFooter = ({ children, className = '' }) => (
  <div className={`flex justify-end gap-2 pt-4 border-t ${className}`}>
    {children}
  </div>
)

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