import React from 'react'
import { cn } from '../../lib/utils'
import { useTheme } from '@/hooks/useTheme'

export const Label = ({ className='', ...props }) => {
  const { isDark } = useTheme()
  return <label className={cn(`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-800'}`, className)} {...props} />
}
