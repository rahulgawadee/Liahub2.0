import React from 'react'
import { cn } from '@/lib/utils'
import { Mail, Phone } from 'lucide-react'

const PRIVATE_LABEL = 'Private • Connect to view'

const maskEmail = (value = '') => {
  return PRIVATE_LABEL
}

const maskPhone = (value = '') => {
  return PRIVATE_LABEL
}

// Reusable contact information display component
export default function ProfileView({
  user,
  status,
  className = '',
}) {
  if (!user) return null
  
  const isConnected = status === 'connected'
  const emailDisplay = isConnected ? user.contact?.email || '—' : maskEmail(user.contact?.email)
  const phoneDisplay = isConnected ? user.contact?.phone || '—' : maskPhone(user.contact?.phone)

  return (
    <div className={cn('rounded-xl bg-card shadow-sm p-6', className)}>
      <div className="text-sm font-semibold uppercase text-muted-foreground mb-4">Contact Information</div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="text-sm">
            <div className="text-xs text-muted-foreground mb-0.5">Email</div>
            <span className="font-mono">{emailDisplay}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="text-sm">
            <div className="text-xs text-muted-foreground mb-0.5">Phone</div>
            <span className="font-mono">{phoneDisplay}</span>
          </div>
        </div>
      </div>
      
      {isConnected ? (
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          ✓ You're connected - Full contact details visible
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          🔒 Connect to see full contact details
        </div>
      )}
    </div>
  )
}
