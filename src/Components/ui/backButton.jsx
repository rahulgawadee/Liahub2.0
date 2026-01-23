import React from 'react'
import { cn } from '@/lib/utils'

export default function BackButton({ onClick, className='' }){
  return (
    <button onClick={onClick} aria-label="Go back" className={cn('inline-flex items-center justify-center rounded-full p-2 hover:bg-accent/60', className)}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}
