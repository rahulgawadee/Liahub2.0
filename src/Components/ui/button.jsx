import React from 'react'
import { cn } from '../../lib/utils'
import { useTheme } from '@/hooks/useTheme'

export const Button = ({ className, variant = 'default', size = 'md', ...props }) => {
  const { isDark } = useTheme()
  const base = 'inline-flex items-center justify-center rounded-full font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none'
  
  const variants = {
    default: isDark 
      ? 'bg-white text-black hover:bg-gray-100' 
      : 'bg-black text-white hover:bg-gray-900',
    outline: isDark 
      ? 'bg-transparent border border-gray-600 text-white hover:bg-gray-900' 
      : 'bg-transparent border border-gray-400 text-black hover:bg-gray-100',
    link: isDark 
      ? 'text-blue-400 underline-offset-4 hover:underline hover:text-blue-300' 
      : 'text-blue-600 underline-offset-4 hover:underline hover:text-blue-700',
    ghost: isDark 
      ? 'hover:bg-gray-900 hover:text-white' 
      : 'hover:bg-gray-100 hover:text-black'
  }
  
  const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6 text-lg' }
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
}
