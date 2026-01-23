import React from 'react'
import { Button } from '@/Components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'
import { cn } from '@/lib/utils'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { Mail, Phone, MapPin, ShieldCheck, Lock, Clock, UserPlus, MessageSquare, Check, X } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUtils'

const PRIVATE_LABEL = 'Private • Connect to view'

const maskEmail = (value = '') => {
  return PRIVATE_LABEL
}

const maskPhone = (value = '') => {
  return PRIVATE_LABEL
}

const maskLocation = (value = '') => {
  return PRIVATE_LABEL
}

export default function EmployerCard({
  employer,
  status = 'none',
  onConnect,
  onVisitProfile,
  onAccept,
  onDecline,
  onMessage,
  className = '',
}) {
  if (!employer) return null

  const { displayName, subtitle, isCompanyUser } = React.useMemo(() => {
    return getDisplayNameWithSubtitle(employer)
  }, [employer])

  const isConnected = status === 'connected'
  const isPending = status === 'pending'
  const isIncoming = status === 'incoming'

  const emailDisplay = isConnected ? employer.contact?.email || '—' : maskEmail(employer.contact?.email)
  const phoneDisplay = isConnected ? employer.contact?.phone || '—' : maskPhone(employer.contact?.phone)
  const locationDisplay = isConnected ? employer.location || '—' : maskLocation(employer.location)

  const handleVisit = () => onVisitProfile?.(employer)

  return (
    <div className={cn('group rounded-2xl bg-card shadow-sm p-4 sm:p-5 flex flex-col md:flex-row items-start gap-4 sm:gap-6 transition-all hover:shadow-md', className)}>
      <div className="flex-1 flex items-start gap-4 sm:gap-5 min-w-0 w-full">
        <button type="button" onClick={handleVisit} className="outline-none flex-shrink-0 transition-transform hover:scale-105">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-background shadow-sm">
            <AvatarImage src={employer.avatarUrl ? getImageUrl(employer.avatarUrl) : undefined} alt={employer.name} className="object-cover" />
            <AvatarFallback className="text-lg bg-primary/5">{employer.name?.charAt(0) || 'C'}</AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
             <button
              type="button"
              onClick={handleVisit}
              className="font-bold text-lg sm:text-xl text-foreground text-left hover:text-primary transition-colors truncate"
            >
              {displayName}
            </button>
            {isCompanyUser && subtitle && (
              <div className="text-sm sm:text-base text-muted-foreground">{subtitle}</div>
            )}
          </div>
          
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2.5 text-muted-foreground group/item">
              <div className="p-1.5 rounded-md bg-muted/50 group-hover/item:bg-primary/10 transition-colors">
                 <Mail className="h-4 w-4" />
              </div>
              <div className="truncate font-medium">{emailDisplay}</div>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground group/item">
               <div className="p-1.5 rounded-md bg-muted/50 group-hover/item:bg-primary/10 transition-colors">
                  <Phone className="h-4 w-4" />
               </div>
              <div className="truncate font-medium">{phoneDisplay}</div>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground group/item">
               <div className="p-1.5 rounded-md bg-muted/50 group-hover/item:bg-primary/10 transition-colors">
                  <MapPin className="h-4 w-4" />
               </div>
              <div className="truncate font-medium">{locationDisplay}</div>
            </div>
          </div>

          <div className="mt-4">
            {!isConnected ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                <span>Connect to view full profile details</span>
                </div>
            ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-xs font-medium text-emerald-600 border border-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Connected</span>
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-row md:flex-col items-center justify-start gap-3 w-full md:w-auto mt-2 md:mt-0 pl-14 sm:pl-0 md:pl-0">
        {isConnected ? (
          <Button variant="default" size="md" onClick={() => onMessage?.(employer)} className="w-full md:w-32 gap-2 shadow-sm">
            <MessageSquare className="h-4 w-4" />
            Message
          </Button>
        ) : isPending ? (
          <Button variant="outline" size="md" disabled className="w-full md:w-32 gap-2">
            <Clock className="h-4 w-4" />
            Pending
          </Button>
        ) : isIncoming ? (
          <div className="flex flex-col gap-2 w-full md:w-32">
            <Button size="sm" onClick={() => onAccept?.(employer)} className="w-full gap-2">
              <Check className="h-4 w-4" />
              Accept
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDecline?.(employer)} className="w-full gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
              <X className="h-4 w-4" />
              Decline
            </Button>
          </div>
        ) : (
          <Button size="md" onClick={() => onConnect?.(employer)} className="w-full md:w-32 gap-2 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
            <UserPlus className="h-4.5 w-4.5" />
            Connect
          </Button>
        )}
      </div>
    </div>
  )
}

