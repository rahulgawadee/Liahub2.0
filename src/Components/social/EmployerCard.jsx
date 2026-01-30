import React from 'react'
import { Button } from '@/Components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'
import { cn } from '@/lib/utils'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { MapPin, UserPlus, Clock, Check, X, Building2, Briefcase, Globe } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUtils'

export default function EmployerCard({
  employer,
  status = 'none',
  onConnect,
  onVisitProfile,
  onAccept,
  onDecline,
  className = '',
}) {
  if (!employer) return null

  const { displayName } = React.useMemo(() => {
    return getDisplayNameWithSubtitle(employer)
  }, [employer])

  const isPending = status === 'pending'
  const isIncoming = status === 'incoming'

  // Get company domain and about from companyProfile or fallback
  const companyDomain = employer.companyProfile?.companyDomain || employer.companyDomain || null
  const aboutCompany = employer.companyProfile?.aboutCompany || employer.about || employer.aboutCompany || null
  const location = employer.companyProfile?.city 
    ? `${employer.companyProfile.city}${employer.companyProfile.country ? ', ' + employer.companyProfile.country : ''}` 
    : employer.location || null
  const industry = employer.companyProfile?.industries?.[0] || null
  const website = employer.companyProfile?.website || employer.contact?.website || employer.website || null

  return (
    <div className={cn('group rounded-lg bg-background/5 p-3 hover:bg-background/10 transition-colors duration-200', className)}>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onVisitProfile?.(employer)} className="outline-none flex-shrink-0">
          <Avatar className="h-12 w-12 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <AvatarImage src={employer.avatarUrl ? getImageUrl(employer.avatarUrl) : undefined} alt={displayName} className="object-cover" />
            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-blue-600 text-white">{displayName?.charAt(0) || 'C'}</AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onVisitProfile?.(employer)} className="font-semibold text-lg text-foreground truncate block w-full text-left hover:text-primary">
                  {displayName}
                </button>
                {companyDomain && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                    <Briefcase className="h-3 w-3" />
                    {companyDomain}
                  </span>
                )}
              </div>

              {/* single-line info: about · location · industry */}
              <div className="mt-1 text-sm text-muted-foreground grid grid-cols-3 gap-4 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{aboutCompany || 'N/A'}</span>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  {location ? (
                    <>
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{location}</span>
                    </>
                  ) : (
                    <span className="truncate text-muted-foreground">&nbsp;</span>
                  )}
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  {industry ? (
                    <>
                      <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{industry}</span>
                    </>
                  ) : (
                    <span className="truncate text-muted-foreground">&nbsp;</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 ml-2">
              {isPending ? (
                <Button variant="outline" size="sm" disabled className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending
                </Button>
              ) : isIncoming ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onAccept?.(employer)} className="gap-2">
                    <Check className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDecline?.(employer)} className="gap-2">
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => onConnect?.(employer)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

