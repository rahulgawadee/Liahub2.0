import React from 'react'
import { useTheme } from '@/hooks/useTheme'

export const Separator = ({ orientation='horizontal', className='' }) => {
  const { isDark } = useTheme()
  const dimensions = orientation==='vertical'? 'w-px h-full':'h-px w-full'
  const bgColor = isDark ? 'bg-gray-800' : 'bg-gray-200'
  return <div className={`${dimensions} ${bgColor} transition-colors duration-300 ${className}`} />
}
