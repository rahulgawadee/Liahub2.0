import React from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

export function Skeleton({ className, ...props }) {
  const { isDark } = useTheme()
  return (
    <div
      className={cn(
        `animate-pulse rounded-md transition-colors duration-300 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`,
        className
      )}
      {...props}
    />
  )
}
