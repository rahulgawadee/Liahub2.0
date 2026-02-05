import React from 'react'
import { useTheme } from '@/hooks/useTheme'
import {
  MapPin,
  Clock,
  Users,
  BriefcaseBusiness,
  Building2,
  Bookmark,
  GraduationCap,
  Sparkles,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  Lightbulb,
  Gift,
} from 'lucide-react'
import { Badge } from '@/Components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'
import { cn } from '@/lib/utils'
import JobApplicationModal from '@/Components/jobs/JobApplicationModal'

const nameInitials = ['AL', 'JS', 'MK', 'PR', 'SN', 'DL', 'CH', 'KR', 'LM', 'TP']

const hashString = (value) => {
  const str = String(value ?? '')
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

const buildAvatarEntries = (seed, count = 4) => {
  const base = hashString(seed)
  return Array.from({ length: count }, (_, idx) => {
    const initials = nameInitials[(base + idx) % nameInitials.length]
    return {
      src: null, // No fallback image URL - use profile icon instead
      initials,
    }
  })
}

const getAvatarEntries = (item, count = 4) => {
  if (Array.isArray(item?.avatarUrls) && item.avatarUrls.length) {
    return item.avatarUrls.slice(0, count).map((src, idx) => ({
      src,
      initials: nameInitials[idx % nameInitials.length],
    }))
  }
  return buildAvatarEntries(item?.avatarSeed || item?.id || item?.company || 'liahub', count)
}

const buildChipList = (item) => {
  const pool = [
    item?.employmentType,
    item?.locationType,
    item?.seniority,
    ...(item?.labels || []),
    ...(item?.tags || []),
  ]
  return [...new Set(pool.filter(Boolean))].slice(0, 8)
}

const formatHiringNote = (note, openings) => {
  if (note) return note
  if (!openings) return 'Actively hiring'
  const suffix = openings === 1 ? 'candidate' : 'candidates'
  return `Hiring for ${openings} ${suffix}`
}

const salaryLabel = (item, variant) => {
  if (variant === 'lia') return 'No salary'
  return item?.salary || item?.stipend || 'Salary not disclosed'
}

const ListPanel = ({ items = [], selectedId, onSelect, variant }) => {
  if (items.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center text-white/50">
        No results found
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto border-r border-slate-900/60">
      {items.map((item) => {
        const chips = buildChipList(item)
        const salaryText = salaryLabel(item, variant)
        const postedOn = item?.postedOn || '—'
        const applicants = item?.applicants ?? 0
        const openings = item?.openings ?? null
        const hiringNote = formatHiringNote(item?.hiringStatus, openings)
        const avatars = getAvatarEntries(item, 4)
        const isActive = selectedId === item?.id

        return (
          <button
            key={item?.id}
            type="button"
            onClick={() => onSelect?.(item?.id)}
            className={cn(
              'relative block w-full border-b border-slate-900/60 bg-slate-950/40 p-5 text-left transition-all duration-200',
              isActive
                ? 'border-l-4 border-l-blue-500 bg-slate-900/70 shadow-lg'
                : 'border-l-4 border-l-transparent hover:bg-slate-900/50',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-semibold text-white">{item?.title}</p>
                  {/* Show application status if this is an applied job */}
                  {item?.applicationData?.applicationStatus && (
                    <Badge 
                      className={cn(
                        "text-xs",
                        item.applicationData.applicationStatus === 'applied' && "bg-blue-500 text-white",
                        item.applicationData.applicationStatus === 'under_review' && "bg-yellow-500 text-white",
                        item.applicationData.applicationStatus === 'interview' && "bg-purple-500 text-white",
                        item.applicationData.applicationStatus === 'offer_sent' && "bg-green-500 text-white",
                        item.applicationData.applicationStatus === 'selected' && "bg-blue-600 text-white",
                        item.applicationData.applicationStatus === 'hired' && "bg-blue-600 text-white",
                        item.applicationData.applicationStatus === 'rejected' && "bg-red-500 text-white",
                      )}
                    >
                      {item.applicationData.applicationStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  )}
                  {/* Show offer pending badge */}
                  {item?.applicationData?.offerLetter?.sentOn && 
                   !item?.applicationData?.offerLetter?.acceptedOn && 
                   item?.applicationData?.applicationStatus !== 'rejected' && (
                    <Badge className="bg-green-500 text-white animate-pulse">
                      Offer Pending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Building2 className="h-4 w-4 text-white/50" />
                  <span>{item?.company}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <MapPin className="h-3.5 w-3.5 text-white/40" />
                  <span>{item?.location}</span>
                  {/* Show applied date if available */}
                  {item?.applicationData?.appliedDate && (
                    <>
                      <span className="text-white/40">•</span>
                      <span>Applied {new Date(item.applicationData.appliedDate).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end justify-start gap-1 text-xs text-white/60">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  {postedOn}
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-white/70">
                  <BriefcaseBusiness className="h-3.5 w-3.5 text-blue-400" />
                  {salaryText}
                </span>
                {/* Show profile match score if available */}
                {item?.applicationData?.profileScore && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-blue-400">
                    Match: {item.applicationData.profileScore}%
                  </span>
                )}
              </div>
            </div>

            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((chip, idx) => (
                  <Badge key={`${item?.id}-${chip}`} tone={idx === 0 ? 'accent' : 'default'}>
                    {chip}
                  </Badge>
                ))}
              </div>
            )}

            {/* Only show applicant info for browsing jobs, not applied jobs */}
            {!item?.applicationData && (
              <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                <div className="flex items-center gap-3">
                  {applicants > 0 && (
                    <>
                      <div className="flex -space-x-2">
                        {avatars.map((avatar, idx) => (
                          <Avatar
                            key={`${item?.id}-avatar-${idx}`}
                            className="h-8 w-8 border-2 border-slate-950 bg-slate-800 text-[10px]"
                          >
                            <AvatarImage src={avatar.src} alt={`Applicant ${idx + 1}`} />
                            <AvatarFallback />
                          </Avatar>
                        ))}
                      </div>
                      <span>{applicants} applicants</span>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <span className="block text-white/70">{hiringNote}</span>
                  {openings ? <span className="text-white/40">Openings: {openings}</span> : null}
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, isDark }) => (
  <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-900 bg-slate-950/60' : 'border-gray-200 bg-white'}`}>
    <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
      <Icon className="h-4 w-4 text-blue-400" />
      {label}
    </div>
    <div className={`mt-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{value}</div>
  </div>
)

const ListSection = ({ icon: Icon, title, items }) => {
  if (!items || items.length === 0) return null
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-white/70">
        {items.map((entry, idx) => (
          <li key={`${title}-${idx}`} className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-400/80" />
            <span>{entry}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const DetailPanel = ({ item, variant, onToggleApplied, onToggleWishlist }) => {
  const [showApplicationModal, setShowApplicationModal] = React.useState(false)

  // Debug logging
  React.useEffect(() => {
    if (item) {
      console.log('🎯 DetailPanel received item:', item)
      console.log('🎯 Description value:', item.description)
      console.log('🎯 Description type:', typeof item.description)
      console.log('🎯 Description length:', item.description?.length)
    }
  }, [item])

  if (!item) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center text-white/40">
        Select a posting to view details
      </div>
    )
  }

  const chips = buildChipList(item)
  const salaryText = salaryLabel(item, variant)
  const postedOn = item?.postedOn || '—'
  const applicants = item?.applicants ?? 0
  const openings = item?.openings ?? 1
  const hiringNote = formatHiringNote(item?.hiringStatus, openings)
  const avatars = getAvatarEntries(item, 5)
  const duration = item?.duration
  const mentor = item?.mentor
  const deadline = item?.applicationDeadline

  const responsibilities = item?.responsibilities || []
  const requirements =
    variant === 'lia' ? item?.learningGoals || item?.requirements || [] : item?.requirements || []
  const benefits = variant === 'lia' ? item?.support || item?.benefits || [] : item?.benefits || []

  const stats = [
    { icon: Users, label: 'Applicants', value: `${applicants}` },
    { icon: Sparkles, label: 'Openings', value: `${openings}` },
    { icon: CalendarDays, label: 'Posted', value: postedOn },
    { icon: BriefcaseBusiness, label: variant === 'lia' ? 'Compensation' : 'Salary', value: salaryText },
  ]

  if (variant === 'lia') {
    stats.push(
      { icon: GraduationCap, label: 'Duration', value: duration || '12 weeks' },
      { icon: ClipboardList, label: 'Mentor', value: mentor || 'Assigned mentor' },
      { icon: Clock, label: 'Deadline', value: deadline || 'Open until filled' },
    )
  } else {
    stats.push({ icon: ClipboardList, label: 'Seniority', value: item?.seniority || '—' })
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">{item?.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/70">
              <Building2 className="h-4 w-4 text-blue-400" />
              <span>{item?.company}</span>
              <span className="text-white/40">•</span>
              <MapPin className="h-4 w-4 text-blue-400" />
              <span>{item?.location}</span>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip, idx) => (
                <Badge key={`${item?.id}-detail-chip-${chip}`} tone={idx === 0 ? 'accent' : 'default'}>
                  {chip}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={onToggleWishlist}
            className={cn(
              'rounded-full border p-2 transition-all',
              item?.wishlisted
                ? 'bg-red-500/20 text-red-500 border-red-500 hover:bg-red-500/30'
                : 'bg-slate-900 text-white/60 border-slate-800 hover:bg-slate-800',
            )}
            title={item?.wishlisted ? 'Remove from saved' : 'Save posting'}
          >
            <Bookmark className="h-5 w-5" fill={item?.wishlisted ? 'currentColor' : 'none'} />
          </button>
          <div className="text-right text-sm text-white/60">
            <p className="font-semibold text-white">{salaryText}</p>
            <p>Posted {postedOn}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={`${item?.id}-${stat.label}`} icon={stat.icon} label={stat.label} value={stat.value} />
        ))}
      </div>

      {/* Application Status Section - Only show if this is an applied job */}
      {item?.applicationData && (
        <div className="mt-6 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-r from-blue-950/40 to-purple-950/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
            Your Application
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-950/60 rounded-lg p-4">
              <p className="text-xs text-white/60 mb-1">Application Status</p>
              <Badge 
                className={cn(
                  "text-sm font-semibold",
                  item.applicationData.applicationStatus === 'applied' && "bg-blue-500 text-white",
                  item.applicationData.applicationStatus === 'under_review' && "bg-yellow-500 text-white",
                  item.applicationData.applicationStatus === 'interview' && "bg-purple-500 text-white",
                  item.applicationData.applicationStatus === 'offer_sent' && "bg-green-500 text-white",
                  item.applicationData.applicationStatus === 'selected' && "bg-blue-600 text-white",
                  item.applicationData.applicationStatus === 'hired' && "bg-blue-600 text-white",
                  item.applicationData.applicationStatus === 'rejected' && "bg-red-500 text-white",
                )}
              >
                {item.applicationData.stage || item.applicationData.applicationStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            
            <div className="bg-slate-950/60 rounded-lg p-4">
              <p className="text-xs text-white/60 mb-1">Applied On</p>
              <p className="text-sm font-semibold text-white">
                {new Date(item.applicationData.appliedDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            {item.applicationData.profileScore && (
              <div className="bg-blue-950/60 rounded-lg p-4">
                <p className="text-xs text-blue-400 mb-1">Profile Match</p>
                <p className="text-2xl font-bold text-blue-400">
                  {item.applicationData.profileScore}%
                </p>
              </div>
            )}
          </div>

          {/* Offer Letter Section */}
          {item.applicationData.offerLetter?.sentOn && (
            <div className="mt-4 p-4 bg-green-950/60 border-2 border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-400 flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Offer Letter Received
                </h4>
                {item.applicationData.offerLetter.acceptedOn ? (
                  <Badge className="bg-green-600 text-white">Accepted</Badge>
                ) : (
                  <Badge className="bg-yellow-600 text-white animate-pulse">Pending</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-white/60">Start Date</p>
                  <p className="text-white font-semibold">
                    {new Date(item.applicationData.offerLetter.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Compensation</p>
                  <p className="text-white font-semibold">{item.applicationData.offerLetter.compensation}</p>
                </div>
              </div>

              {item.applicationData.offerLetter.pdfUrl && (
                <button
                  onClick={() => window.open(item.applicationData.offerLetter.pdfUrl, '_blank')}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
                >
                  <ClipboardList className="h-4 w-4" />
                  Download Offer Letter PDF
                </button>
              )}

              {!item.applicationData.offerLetter.acceptedOn && (
                <p className="mt-3 text-xs text-green-300">
                  🎉 Congratulations! Review the offer details and take action from My Applications page.
                </p>
              )}

              {item.applicationData.offerLetter.acceptedOn && (
                <p className="mt-3 text-xs text-green-300">
                  ✅ You accepted this offer on {new Date(item.applicationData.offerLetter.acceptedOn).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Only show hiring info when NOT viewing an applied job */}
      {!item?.applicationData && (
        <div className="mt-6 rounded-2xl border border-slate-900 bg-slate-950/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/70">
            <div className="space-y-1">
              <p className="font-semibold text-white">{hiringNote}</p>
            </div>
            {applicants > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-end">
                  <div className="flex -space-x-2">
                    {avatars.map((avatar, idx) => (
                      <Avatar
                        key={`${item?.id}-detail-avatar-${idx}`}
                        className="h-9 w-9 border-2 border-slate-950"
                      >
                        <AvatarImage src={avatar.src} alt={`Applicant ${idx + 1}`} />
                        <AvatarFallback />
                      </Avatar>
                    ))}
                  </div>
                </div>
                <span className="text-right text-xs text-white/50">{applicants} candidates exploring this role</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => item?.applied ? null : setShowApplicationModal(true)}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950',
            item?.applied
              ? 'bg-emerald-500/20 text-emerald-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600',
          )}
          disabled={item?.applied}
        >
          {item?.applied ? 'Application submitted' : 'Apply now'}
        </button>
        <span className="text-xs text-white/50">Need help? Share this role with your mentor for quick feedback.</span>
      </div>

      <section className="mt-8">
        <h3 className="text-xl font-semibold text-white">About the opportunity</h3>
        {item?.description ? (
          <p className="mt-3 text-sm leading-relaxed text-white/80 whitespace-pre-line">{item.description}</p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-white/50 italic">No description available</p>
        )}
      </section>

      <ListSection
        icon={CheckCircle2}
        title={variant === 'lia' ? 'Key activities' : 'Key responsibilities'}
        items={responsibilities}
      />
      <ListSection
        icon={Lightbulb}
        title={variant === 'lia' ? 'Learning outcomes' : 'What you bring'}
        items={requirements}
      />
      <ListSection
        icon={Gift}
        title={variant === 'lia' ? 'Support provided' : 'Benefits & perks'}
        items={benefits}
      />

      {/* Job Application Modal */}
      <JobApplicationModal
        open={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        job={item}
      />
    </div>
  )
}

export default function ResultsLayout({
  items = [],
  selectedId,
  onSelect,
  onToggleApplied,
  onToggleWishlist,
  variant = 'job',
  renderDetail,
}) {
  const selected = items.find((i) => i.id === selectedId)

  return (
    <div className="mt-4 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-900 bg-slate-950/40 text-white shadow-xl">
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <div className="md:w-1/2 md:flex-shrink-0">
          <ListPanel items={items} selectedId={selectedId} onSelect={onSelect} variant={variant} />
        </div>
        <div className="flex-1 min-h-0">
          {renderDetail ? (
            renderDetail(selected)
          ) : (
            <DetailPanel
              item={selected}
              variant={variant}
              onToggleApplied={() => onToggleApplied?.(selected?.id)}
              onToggleWishlist={() => onToggleWishlist?.(selected?.id)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
