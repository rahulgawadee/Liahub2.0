import React from 'react'
import { cn } from '../../lib/utils'

export const Card = ({ className='', ...props }) => <div className={cn('rounded-xl  bg-card text-card-foreground shadow p-6 space-y-4', className)} {...props} />
export const CardHeader = ({ className='', ...props }) => <div className={cn('space-y-1', className)} {...props} />
export const CardTitle = ({ className='', ...props }) => <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
export const CardDescription = ({ className='', ...props }) => <p className={cn('text-sm text-muted-foreground', className)} {...props} />
export const CardContent = ({ className='', ...props }) => <div className={cn('pt-4 space-y-4', className)} {...props} />
export const CardFooter = ({ className='', ...props }) => <div className={cn('flex items-center gap-2 pt-2', className)} {...props} />
export const CardAction = ({ className='', ...props }) => <div className={cn('absolute top-4 right-4', className)} {...props} />
