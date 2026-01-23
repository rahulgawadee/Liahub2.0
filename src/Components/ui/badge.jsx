import React from 'react'
import { cn } from '@/lib/utils'

const toneMap = {
  default: 'bg-slate-800/80 text-slate-200 border border-slate-700',
  accent: 'bg-blue-900/70 text-blue-100 border border-blue-500/40',
  success: 'bg-emerald-900/70 text-emerald-100 border border-emerald-500/40',
  warning: 'bg-amber-900/70 text-amber-100 border border-amber-500/40',
  danger: 'bg-rose-900/70 text-rose-100 border border-rose-500/40',
}

export function Badge({ tone = 'default', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
        toneMap[tone] || toneMap.default,
        className,
      )}
    >
      {children}
    </span>
  )
}

export default Badge
