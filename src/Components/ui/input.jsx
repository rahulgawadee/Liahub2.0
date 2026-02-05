import React from 'react'
import { cn } from '../../lib/utils'
import { useTheme } from '@/hooks/useTheme'

export const Input = React.forwardRef(({ className='', type='text', ...props }, ref) => {
  const { isDark } = useTheme()
  return <input ref={ref} type={type} className={cn(`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300 
    ${isDark 
      ? 'border-gray-600 bg-black text-white placeholder:text-gray-500 focus-visible:border-gray-400 focus-visible:ring-gray-700 [-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_black_inset] [-webkit-autofill]:[-webkit-text-fill-color:white]' 
      : 'border-gray-300 bg-white text-black placeholder:text-gray-500 focus-visible:border-black focus-visible:ring-gray-200 [-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_white_inset] [-webkit-autofill]:[-webkit-text-fill-color:black]'
    }`, className)} {...props} />
})
Input.displayName = 'Input'
