import React from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { Button } from '@/Components/ui/button'
import { Card, CardContent } from '@/Components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'
import { Badge } from '@/Components/ui/badge'
import { Separator } from '@/Components/ui/separator'
import { 
  MessageCircle, 
  UserPlus, 
  UserCheck, 
  UserMinus, 
  Check, 
  X,
  Clock,
  MapPin,
  Briefcase
} from 'lucide-react'
import { getImageUrl } from '@/lib/imageUtils'

export default function UserCard({
  user,
  onView,
  onConnect,
  onMessage,
  connected = false,
  pending = false,
  className = '',
  badge = null,
  follower = false,

  following = false,
  onFollowBack,
  bare = false,
  onAccept,
  onDecline,
  onFollow,
  onUnfollow,
  followDisabled = false,
  unfollowDisabled = false,
  showConnect = true,
  selected = false,
  onSelect,
}) {
  const navigate = useNavigate()
  const followHandler = onFollow || onFollowBack

  if (!user) return null

  const { displayName, subtitle, isCompanyUser } = React.useMemo(() => {
    return getDisplayNameWithSubtitle(user)
  }, [user])

  const roleLabel = React.useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : []
    const roleMap = {
      education_manager: 'Education Manager',
      student: 'Student',
      freelancer: 'Freelancer',
      job_seeker: 'Job Seeker',
    }
    const nonGenericRole = roles.find(
      (role) => !['user'].includes(role) && !role.includes('company') && !role.includes('school') && !role.includes('university'),
    )
    if (!nonGenericRole) return null
    return roleMap[nonGenericRole] || nonGenericRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }, [user?.roles])

  const orgLabel = React.useMemo(() => {
    return user?.companyProfile?.companyName || user?.schoolProfile?.schoolName || user?.universityProfile?.universityName || null
  }, [user])

  const contactPersonLabel = React.useMemo(() => {
    if (!isCompanyUser) return null
    if (subtitle && subtitle.trim()) return subtitle
    if (user?.companyProfile?.contactPerson) return user.companyProfile.contactPerson
    if (typeof user?.name === 'string' && user.name.trim()) return user.name
    if (user?.name && typeof user.name === 'object') {
      const parts = [user.name.first, user.name.last].filter(Boolean)
      if (parts.length) return parts.join(' ')
    }
    return null
  }, [isCompanyUser, subtitle, user])

  const showOrgLine = React.useMemo(() => {
    if (!orgLabel) return false
    if (!isCompanyUser) return true
    return orgLabel !== displayName
  }, [orgLabel, isCompanyUser, displayName])

  const orgTypeLabel = React.useMemo(() => {
    if (user?.companyProfile?.companyName) return 'Company'
    if (user?.schoolProfile?.schoolName) return 'School'
    if (user?.universityProfile?.universityName) return 'University'
    const roles = Array.isArray(user?.roles) ? user.roles : []
    if (roles.some((role) => role.startsWith('company_'))) return 'Company'
    if (roles.some((role) => role.startsWith('school_'))) return 'School'
    if (roles.some((role) => role.startsWith('university_'))) return 'University'
    return null
  }, [user])

  const employmentLabel = React.useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : []
    const roleMap = {
      company_employer: 'Employer',
      company_hiring_manager: 'Hiring Manager',
      company_founder: 'Founder',
      company_ceo: 'CEO',
      school_admin: 'School Admin',
      school_representative: 'School Rep',
      university_admin: 'University Admin',
      university_representative: 'University Rep',
    }
    const match = roles.find((role) => roleMap[role])
    return match ? roleMap[match] : null
  }, [user?.roles])

  const handleCardClick = () => {
    if (!onSelect) return
    onSelect(user)
  }

  const handleNavigateProfile = (event) => {
    event.stopPropagation()
    if (onView) {
      const handled = onView(user)
      if (handled) return
    }
    navigate(`/view/profile/${user.id}`)
  }

  const handleMessage = (event) => {
    event.stopPropagation()
    onMessage?.(user)
  }

  const handleConnect = (event) => {
    event.stopPropagation()
    onConnect?.(user)
  }

  const handleAccept = (event) => {
    event.stopPropagation()
    onAccept?.(user)
  }

  const handleDecline = (event) => {
    event.stopPropagation()
    onDecline?.(user)
  }

  const handleFollow = (event) => {
    event.stopPropagation()
    followHandler?.(user)
  }

  const handleUnfollow = (event) => {
    event.stopPropagation()
    onUnfollow?.(user)
  }

  const renderConnectAction = () => {
    if (!showConnect) return null

    if (onAccept || onDecline) {
      return (
        <div className="flex gap-2 w-full">
          <Button size="sm" onClick={handleAccept} className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 hover:scale-105 text-white text-xs sm:text-sm cursor-pointer transition-all shadow-sm hover:shadow-md">
            <Check className="h-3.5 w-3.5" />
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={handleDecline} className="flex-1 gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:scale-105 text-xs sm:text-sm cursor-pointer transition-all">
            <X className="h-3.5 w-3.5" />
            Decline
          </Button>
        </div>
      )
    }

    if (connected) {
      return (
        <Button size="sm" onClick={handleMessage} className="w-full gap-2 cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-md">
          <MessageCircle className="h-4 w-4" />
          Message
        </Button>
      )
    }

    if (pending) {
      return (
        <Button size="sm" variant="outline" disabled className="w-full gap-2">
          <Clock className="h-4 w-4" />
          Pending
        </Button>
      )
    }

    return (
      <Button size="sm" onClick={handleConnect} className="w-full gap-2 cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-md">
        <UserPlus className="h-4 w-4" />
        Connect
      </Button>
    )
  }

  const cardClasses = cn(
    bare ? 'flex items-start gap-4' : '',
    selected && !bare ? 'ring-2 ring-primary/60' : null,
    onSelect && !bare ? 'cursor-pointer' : null,
    className,
  )

  const canFollow = !following && Boolean(followHandler)
  const canUnfollow = following && Boolean(onUnfollow)

  if (bare) {
    return (
      <div className={cn('flex items-center gap-4 px-2 py-3', cardClasses)} onClick={handleCardClick}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={getImageUrl(user.avatarUrl)} alt={user.name} />
          <AvatarFallback />
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <button className="font-semibold text-foreground truncate hover:underline" onClick={handleNavigateProfile}>
              {displayName}
            </button>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {roleLabel && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {roleLabel}
                </Badge>
              )}
              {employmentLabel && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {employmentLabel}
                </Badge>
              )}
              {orgLabel && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {orgLabel}
                </Badge>
              )}
              {orgTypeLabel && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {orgTypeLabel}
                </Badge>
              )}
            </div>
          </div>
          {showOrgLine && (
            <div className="text-xs text-muted-foreground truncate">{orgLabel}</div>
          )}
          {contactPersonLabel && (
            <div className="text-xs text-muted-foreground truncate">{contactPersonLabel}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {renderConnectAction()}
          {canFollow && (
            <Button size="sm" variant="outline" onClick={handleFollow} disabled={followDisabled}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Follow
            </Button>
          )}
          {canUnfollow && (
            <Button size="sm" variant="ghost" onClick={handleUnfollow} disabled={unfollowDisabled}>
              <UserMinus className="h-4 w-4 mr-1.5" />
              Unfollow
            </Button>
          )}
          {following && !canUnfollow && (
            <Button size="sm" variant="ghost" disabled>
              <UserCheck className="h-4 w-4 mr-1.5" />
              Following
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('group rounded-2xl bg-card shadow-sm p-4 sm:p-5 transition-all hover:shadow-md', className)} onClick={handleCardClick}>
      <div className="flex flex-col lg:flex-row items-start gap-4 w-full">
        <div className="flex-1 flex items-start gap-3 sm:gap-4 min-w-0 w-full">
        <button type="button" onClick={handleNavigateProfile} className="outline-none flex-shrink-0 transition-transform hover:scale-105">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-background shadow-sm">
            <AvatarImage src={getImageUrl(user.avatarUrl)} alt={user.name} className="object-cover" />
            <AvatarFallback className="text-lg bg-primary/5">{user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={handleNavigateProfile}
              className="font-bold text-lg sm:text-xl text-foreground text-left hover:text-primary transition-colors truncate"
            >
              {displayName}
            </button>
            {isCompanyUser && subtitle && (
              <div className="text-sm sm:text-base text-muted-foreground">{subtitle}</div>
            )}
            {!isCompanyUser && user.organizationName && (
              <div className="text-sm text-muted-foreground">{user.organizationName}</div>
            )}
          </div>
          
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {user.title && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span className="font-medium">{user.title}</span>
              </div>
            )}
            {user.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{user.location}</span>
              </div>
            )}
          </div>
          
          <div className="mt-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {badge && <Badge variant="default" className="shrink-0">{badge}</Badge>}
            {follower && <Badge variant="secondary" className="text-xs shrink-0">Follower</Badge>}
            {isCompanyUser && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                {user.companyProfile?.companyName ? 'Company' : user.schoolProfile?.schoolName ? 'School' : 'Organization'}
              </Badge>
            )}
            {!isCompanyUser && user.roles && user.roles.length > 0 && (
              <>
                {user.roles.filter(role => !['user'].includes(role)).slice(0, 2).map((role) => (
                  <Badge key={role} variant="outline" className="text-xs capitalize shrink-0">
                    {role.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </>
            )}
          </div>
          
          {user.skills?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {user.skills.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{user.skills.length - 4}
                </Badge>
              )}
            </div>
          ) : null}
        </div>
        </div>

        <div className="flex flex-col gap-2 w-full lg:w-auto lg:min-w-[160px] shrink-0">
          {renderConnectAction()}
          {canFollow && (
            <Button size="sm" variant="outline" onClick={handleFollow} disabled={followDisabled} className="w-full gap-1.5 cursor-pointer hover:scale-105 hover:border-primary/50 hover:bg-primary/5 transition-all">
              <UserPlus className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Follow</span>
            </Button>
          )}
          {canUnfollow && (
            <Button size="sm" variant="ghost" onClick={handleUnfollow} disabled={unfollowDisabled} className="w-full gap-1.5 cursor-pointer hover:scale-105 hover:bg-destructive/10 hover:text-destructive transition-all">
              <UserMinus className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Unfollow</span>
            </Button>
          )}
          {following && !canUnfollow && (
            <Button size="sm" variant="ghost" disabled className="w-full gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Following</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
