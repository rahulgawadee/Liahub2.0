import React from 'react'
import { cn } from '../../lib/utils'
import { useTheme } from '@/hooks/useTheme'

export const Card = ({ className='', ...props }) => {
  const { isDark } = useTheme()
  return <div className={cn(`rounded-xl shadow p-6 space-y-4 transition-colors duration-300 ${isDark ? 'bg-black border border-gray-800 text-white' : 'bg-white border border-gray-200 text-black'}`, className)} {...props} />
}

export const CardHeader = ({ className='', ...props }) => <div className={cn('space-y-1', className)} {...props} />

export const CardTitle = ({ className='', ...props }) => {
  const { isDark } = useTheme()
  return <h3 className={cn(`text-2xl font-semibold leading-none tracking-tight transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`, className)} {...props} />
}

export const CardDescription = ({ className='', ...props }) => {
  const { isDark } = useTheme()
  return <p className={cn(`text-sm transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`, className)} {...props} />
}

export const CardContent = ({ className='', ...props }) => <div className={cn('pt-4 space-y-4', className)} {...props} />

export const CardFooter = ({ className='', ...props }) => <div className={cn('flex items-center gap-2 pt-2', className)} {...props} />

export const CardAction = ({ className='', ...props }) => <div className={cn('absolute top-4 right-4', className)} {...props} />
