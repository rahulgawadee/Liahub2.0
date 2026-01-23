import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/Components/ui/button'

export default function SignaturePad({ onSave, initialSignature = null, disabled = false }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setHasDrawn(true)
      }
      img.src = initialSignature
    }
  }, [initialSignature])

  const startDrawing = (e) => {
    if (disabled) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e) => {
    if (!isDrawing || disabled) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    const signatureData = canvas.toDataURL('image/png')
    onSave(signatureData)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className={`w-full border-2 ${disabled ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed' : 'border-gray-600 bg-gray-900 cursor-crosshair'} rounded-lg`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-500 text-sm">
            Sign here using your mouse or touchscreen
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={clearSignature}
          disabled={!hasDrawn || disabled}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          type="button"
          onClick={saveSignature}
          disabled={!hasDrawn || disabled}
          className="flex-1"
        >
          Save Signature
        </Button>
      </div>
    </div>
  )
}
