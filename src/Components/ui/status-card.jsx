import React from 'react'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from './card'
import { Button } from './button'

// Reusable centered feedback card for success/info states
export function StatusCard({ title, description, actionLabel = 'Close', onDismiss, icon: Icon = CheckCircle, className = '', children }) {
  const { isDark } = useTheme()
  return (
    <Card className={cn('w-full max-w-md text-center relative', className)}>
      <div className="flex justify-center mb-3">
        <Icon className={`h-10 w-10 transition-colors duration-300 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} aria-hidden="true" />
      </div>
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description ? <CardDescription className={`text-base leading-relaxed transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{description}</CardDescription> : null}
      </CardHeader>
      {children}
      {onDismiss ? (
        <CardFooter className="justify-center pt-2">
          <Button type="button" onClick={onDismiss} className="px-6">
            {actionLabel}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}

export default StatusCard
