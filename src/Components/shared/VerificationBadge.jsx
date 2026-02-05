import React from 'react'
import { CheckCircle } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export default function VerificationBadge({ verified = false, size = 'md', className = '' }) {
  const { isDark } = useTheme()
  if (!verified) return null

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full transition-colors duration-300 ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'} text-xs font-medium ${className}`}
      title="Verified - Contract Signed"
    >
      <CheckCircle className={sizeClasses[size]} />
      <span>Verified</span>
    </div>
  )
}
