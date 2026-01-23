import React from 'react'
import { cn } from '../../lib/utils'

export const Button = ({ className, variant = 'default', size = 'md', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    default: ' bg-white text-black hover:bg-gray-100 hover:text-accent-foreground',
    outline: ' bg-white text-black hover:bg-gray-100 hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  }
  const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6 text-lg' }
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
}
