import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectAuth } from '@/redux/store'
import { 
  fetchMyLIAs,
  fetchMyLIAApplications,
  applyToLIA,
  selectLiaSummaries,
  selectMyLIAApplications
} from '@/redux/slices/lia/liaApplicationsSlice'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import {
  MapPin,
  Clock,
  Briefcase,
  Building2,
  Bookmark,
  BookmarkCheck,
  Users,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Globe,
  Tag,
  ArrowRight,
  FileCheck,
  TrendingUp,
  Mail,
  PartyPopper,
  Download,
  FileText,
  GraduationCap,
  List,
  Heart,
  Trophy
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getImageUrl } from '@/lib/imageUtils'
import { toast } from 'sonner'
import LiaApplicationModal from '@/Components/lia/LiaApplicationModal'
import { useTheme } from '@/hooks/useTheme'

const formatTimeAgo = (date) => {
  const now = new Date()
  const postDate = new Date(date)
  const diffInDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

const getStatusColor = (status) => {
  const colors = {
    applied: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    under_review: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    interview: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    selected: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    offer_sent: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-semibold',
    offer_accepted: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 font-bold',
    placed: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-bold',
    rejected: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    withdrawn: 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  }
  return colors[status] || colors.applied
}

const getStatusIcon = (status) => {
  if (['placed', 'offer_accepted', 'offer_sent'].includes(status)) {
    return <CheckCircle2 className="h-4 w-4" />
  }
  if (['rejected', 'withdrawn'].includes(status)) {
    return <XCircle className="h-4 w-4" />
  }
  if (status === 'interview') {
    return <TrendingUp className="h-4 w-4" />
  }
  return <Clock className="h-4 w-4" />
}

// Normalise backend status strings so the UI stays consistent across sources
const normalizeApplicationStatus = (status) => {
  if (!status) return 'applied'

  const normalised = status
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')

  const statusMap = {
    in_review: 'under_review',
    reviewing: 'under_review',
    review: 'under_review',
    interview_scheduled: 'interview',
    interview_stage: 'interview',
    final_interview: 'interview',
    offer: 'offer_sent',
    offer_sent_student: 'offer_sent',
    offer_sent_to_student: 'offer_sent',
    offerletter_sent: 'offer_sent',
    offer_letter_sent: 'offer_sent',
    offer_shared: 'offer_sent',
    selected_student: 'selected',
    accepted: 'offer_accepted',
    offeraccepted: 'offer_accepted',
    offer_accepted: 'offer_accepted',
    offeracceptedstudent: 'offer_accepted',
    hired_student: 'hired',
    placement_confirmed: 'placed',
    placed_student: 'placed',
    withdraw: 'withdrawn',
    withdrawn_application: 'withdrawn',
    declined: 'rejected',
    rejected_student: 'rejected',
  }

  return statusMap[normalised] || normalised
}

const normalizeOfferLetter = (offerLetter, fallbackStatus) => {
  if (!offerLetter) return null

  const normalizedStatus = normalizeApplicationStatus(offerLetter.status || fallbackStatus)
  const acceptedStatuses = new Set(['offer_accepted', 'placed', 'hired', 'accepted'])
  const pendingStatuses = new Set(['offer_sent', 'offer-sent', 'sent'])

  const rawDocumentUrl =
    offerLetter.pdfUrl ||
    offerLetter.documentUrl ||
    offerLetter.documentURL ||
    offerLetter.url ||
    offerLetter.fileUrl ||
    offerLetter.file?.url ||
    offerLetter.attachmentUrl ||
    null
  const documentUrl = rawDocumentUrl ? getImageUrl(rawDocumentUrl) : null
  const sentOn =
    offerLetter.sentOn ||
    offerLetter.sent_at ||
    offerLetter.sentAt ||
    offerLetter.createdAt ||
    offerLetter.updatedAt ||
    null
  const acceptedOn =
    offerLetter.acceptedOn ||
    offerLetter.accepted_at ||
    offerLetter.acceptedAt ||
    (acceptedStatuses.has(normalizedStatus) ? offerLetter.updatedAt : null) ||
    null

  let status = normalizedStatus
  if (acceptedStatuses.has(normalizedStatus)) {
    status = 'accepted'
  } else if (pendingStatuses.has(normalizedStatus)) {
    status = 'sent'
  }

  return {
    ...offerLetter,
    status,
    sentOn,
    startDate: offerLetter.startDate || offerLetter.start_at || offerLetter.start || null,
    duration: offerLetter.duration || offerLetter.durationText || offerLetter.tenure || null,
    message: offerLetter.message || offerLetter.note || offerLetter.description || null,
    documentUrl,
    pdfUrl: documentUrl || offerLetter.pdfUrl || rawDocumentUrl,
    originalDocumentUrl: rawDocumentUrl,
    acceptedOn,
  }
}

const getOfferLetterDownloadUrl = (offerLetter) => {
  if (!offerLetter) return null
  const candidateUrl =
    offerLetter.pdfUrl ||
    offerLetter.documentUrl ||
    offerLetter.originalDocumentUrl ||
    offerLetter.url ||
    offerLetter.fileUrl ||
    offerLetter.file?.url ||
    null
  if (!candidateUrl) return null
  return getImageUrl(candidateUrl)
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const BACKEND_BASE_URL = API_BASE_URL.replace('/api/v1', '')

const LIACard = ({ lia, onView, onToggleWishlist, onQuickApply, isSelected, isDark }) => {
  const isDeadlinePassed = lia.deadline && new Date(lia.deadline) < new Date()
  const isHiringStopped = lia.status === 'hiring_stopped' || lia.status === 'closed'
  
  // Safe organization access
  const organizationName = typeof lia.organization === 'object' 
    ? lia.organization?.name 
    : lia.company || lia.organization || 'Company'
  const organizationLogo = typeof lia.organization === 'object' 
    ? lia.organization?.logo 
    : null

  return (
    <div 
      className={`rounded-xl p-6 transition-all cursor-pointer border-2 ${
        isDark ? 'bg-[#0a0a0a]' : 'bg-white'
      } ${
        isSelected 
          ? `ring-2 ring-purple-600 border-purple-600 shadow-lg ${isDark ? 'bg-purple-950/30' : 'bg-purple-50'}` 
          : 'hover:shadow-lg border-transparent'
      }`}
      onClick={() => onView(lia)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {organizationLogo ? (
              <img 
                src={getImageUrl(organizationLogo)} 
                alt={organizationName}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-black'}`}>{lia.title}</h3>
              <Badge variant="secondary" className={`text-xs ${isDark ? 'bg-purple-950 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                <GraduationCap className="h-3 w-3 mr-1" />
                LIA
              </Badge>
            </div>
            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{organizationName}</p>
            <div className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {lia.location}
              </span>
              {lia.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {lia.duration}
                </span>
              )}
              {lia.locationType && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {lia.locationType}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleWishlist(lia)
          }}
          className={`p-2 rounded-full hover:bg-muted transition-colors ${
            lia.wishlisted ? 'text-yellow-500' : (isDark ? 'text-gray-400' : 'text-gray-600')
          }`}
        >
          <Bookmark className="h-5 w-5" fill={lia.wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      {lia.tags && lia.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {lia.tags.slice(0, 5).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Status Badges - Show if applied */}
      {lia.applied && (
        <div className="flex flex-wrap gap-2 pt-3 border-t">
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Applied
          </Badge>
          
          {lia.applicationStatus && (
            <Badge variant="outline" className={getStatusColor(lia.applicationStatus)}>
              {getStatusIcon(lia.applicationStatus)}
              <span className="ml-1">{lia.applicationStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </Badge>
          )}
          
          {/* Offer Letter Badge - Most Prominent */}
          {lia.offerLetter && lia.offerLetter.sentOn && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 animate-pulse">
              <PartyPopper className="h-3 w-3 mr-1" />
              Offer Letter Received!
            </Badge>
          )}
          
          {/* Accepted Offer Badge */}
          {lia.offerLetter && lia.offerLetter.status === 'accepted' && (
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Offer Accepted
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            {lia.applicants || 0} applicants
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatTimeAgo(lia.postedOn || lia.createdAt)}
          </span>
        </div>

        {!lia.applied && !isDeadlinePassed && !isHiringStopped ? (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onQuickApply(lia)
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Apply
          </Button>
        ) : !lia.applied && (isDeadlinePassed || isHiringStopped) ? (
          <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {isHiringStopped ? 'Placement Stopped' : 'Deadline Passed'}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}

const ApplicationCard = ({ application, onClick, isDark }) => {
  const lia = application.lia
  const hasOffer = application.offerLetter && application.offerLetter.sentOn
  const offerPending = hasOffer && !application.offerLetter?.acceptedOn

  // Safe organization access
  const organizationName = typeof lia?.organization === 'object' 
    ? lia.organization?.name 
    : lia?.company || lia?.organization || 'Company'
  const organizationLogo = typeof lia?.organization === 'object' 
    ? lia.organization?.logo 
    : null

  return (
    <div 
      className={`border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer relative ${isDark ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'}`}
      onClick={() => onClick(application)}
    >
      {offerPending && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-green-500 text-white animate-pulse">
            <Mail className="h-3 w-3 mr-1" />
            Offer Pending
          </Badge>
        </div>
      )}
      
      <div className="flex items-start gap-4 mb-4">
        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          {organizationLogo ? (
            <img 
              src={getImageUrl(organizationLogo)} 
              alt={organizationName}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-black'}`}>{lia?.title}</h3>
            <Badge variant="secondary" className={`text-xs ${isDark ? 'bg-purple-950 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
              <GraduationCap className="h-3 w-3 mr-1" />
              LIA
            </Badge>
          </div>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{organizationName}</p>
          <div className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {lia?.location}
            </span>
            {lia?.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {lia.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Applied {formatDate(application.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Badge variant="outline" className={getStatusColor(application.status)}>
          {getStatusIcon(application.status)}
          <span className="ml-1 font-medium">
            {application.stage || application.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </Badge>
        
        {application.profileScore && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Match:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {application.profileScore}%
            </span>
          </div>
        )}
      </div>

      {offerPending && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
            <PartyPopper className="h-4 w-4" />
            You have a pending offer! Click to review
          </p>
        </div>
      )}
    </div>
  )
}

const ApplicationDetails = ({ application, onClose, onAcceptOffer, isDark }) => {
  const lia = application.lia
  const [accepting, setAccepting] = useState(false)

  // Safe organization access
  const organizationName = typeof lia?.organization === 'object' 
    ? lia.organization?.name 
    : lia?.company || lia?.organization || 'Company'
  const organizationLogo = typeof lia?.organization === 'object' 
    ? lia.organization?.logo 
    : null

  const handleAcceptOffer = async () => {
    setAccepting(true)
    try {
      await apiClient.post(`/lias/applications/${application.id || application._id}/accept-offer`)
      toast.success('🎉 Congratulations! Offer accepted successfully!')
      onAcceptOffer()
      onClose()
    } catch (error) {
      console.error('Failed to accept offer:', error)
      toast.error(error.response?.data?.message || 'Failed to accept offer')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full max-w-3xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between z-10 ${isDark ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Application Details</h2>
          <button onClick={onClose} className={`text-2xl ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* LIA Info */}
          <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
            <div className="h-16 w-16 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
              {organizationLogo ? (
                <img 
                  src={getImageUrl(organizationLogo)} 
                  alt={organizationName}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-black'}`}>{lia?.title}</h3>
                <Badge variant="secondary" className={`${isDark ? 'bg-purple-950 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                  <GraduationCap className="h-4 w-4 mr-1" />
                  LIA
                </Badge>
              </div>
              <p className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{organizationName}</p>
              <div className={`flex flex-wrap gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {lia?.location}
                </span>
                {lia?.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {lia.duration}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Application Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Current Status</p>
              <Badge variant="outline" className={`${getStatusColor(application.status)} text-sm`}>
                {getStatusIcon(application.status)}
                <span className="ml-1 font-medium">
                  {application.stage || application.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </Badge>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Applied On</p>
              <p className="font-semibold">{formatDate(application.createdAt)}</p>
            </div>

            {application.profileScore && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">Profile Match</p>
                <p className="font-bold text-2xl text-purple-600 dark:text-purple-400">
                  {application.profileScore}%
                </p>
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Last Updated</p>
              <p className="font-semibold">{formatDate(application.updatedAt)}</p>
            </div>
          </div>

          {/* Offer Letter Details */}
          {application.offerLetter && application.offerLetter.sentOn && (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-300 dark:border-green-700 rounded-xl shadow-lg space-y-4">
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-xl text-green-700 dark:text-green-400 flex items-center gap-2">
                  <Mail className="h-6 w-6" />
                  Offer Letter Received
                </h4>
                {application.offerLetter.acceptedOn ? (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accepted
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-600 text-white">
                    <Clock className="h-4 w-4 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                  <p className="font-semibold text-lg">{formatDate(application.offerLetter.startDate)}</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">LIA Duration</p>
                  <p className="font-semibold text-lg">{application.offerLetter.duration}</p>
                </div>
              </div>

              {application.offerLetter.note && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                  <p className="text-sm">{application.offerLetter.note}</p>
                </div>
              )}

              {/* PDF Download */}
              {application.offerLetter.pdfUrl && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-semibold text-blue-700 dark:text-blue-300">Offer Letter PDF</p>
                        <p className="text-xs text-muted-foreground">Official offer document</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.open(getImageUrl(application.offerLetter.pdfUrl), '_blank')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              )}

              {application.offerLetter.acceptedOn ? (
                <div className="flex items-center gap-2 p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      You accepted this offer on {formatDate(application.offerLetter.acceptedOn)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      The company has been notified. They will contact you soon!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Important:</strong> Review the offer details carefully. Once accepted, the company will be notified immediately.
                    </p>
                  </div>
                  <Button 
                    onClick={handleAcceptOffer} 
                    disabled={accepting}
                    size="lg" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Accepting Offer...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Accept Offer
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const LIADetails = ({
  lia,
  onClose,
  onToggleWishlist,
  onQuickApply,
  inlineView = false,
  onAcceptOffer,
  onDownloadOffer,
  isDark,
}) => {
  const isDeadlinePassed = lia.deadline && new Date(lia.deadline) < new Date()
  const isHiringStopped = lia.status === 'hiring_stopped' || lia.status === 'closed'
  
  // Safe organization access
  const organizationName = typeof lia.organization === 'object' 
    ? lia.organization?.name 
    : lia.company || lia.organization || 'Company'
  const organizationLogo = typeof lia.organization === 'object' 
    ? lia.organization?.logo 
    : null
  const organizationDescription = typeof lia.organization === 'object' 
    ? lia.organization?.description 
    : ''
  const offerLetterDownloadUrl = getOfferLetterDownloadUrl(lia.offerLetter)

  // Inline view (right panel) rendering
  if (inlineView) {
    return (
      <div className="space-y-6">
        {/* Header with Close */}
        <div className={`flex items-start justify-between pb-4 border-b sticky top-0 z-10 ${isDark ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{lia.title}</h2>
              <Badge variant="secondary" className={`${isDark ? 'bg-purple-950 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                <GraduationCap className="h-4 w-4 mr-1" />
                LIA
              </Badge>
            </div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{organizationName}</p>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Company Info */}
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {organizationLogo ? (
              <img 
                src={getImageUrl(organizationLogo)} 
                alt={organizationName}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl">{organizationName}</h3>
            {organizationDescription && (
              <p className="text-muted-foreground text-sm">{organizationDescription}</p>
            )}
          </div>
          <button
            onClick={() => onToggleWishlist(lia)}
            className={`p-2 rounded-full hover:bg-muted transition-colors ${
              lia.wishlisted ? 'text-yellow-500' : 'text-muted-foreground'
            }`}
          >
            <Bookmark className="h-5 w-5" fill={lia.wishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Status Badges if Applied */}
        {lia.applied && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 px-4 py-2">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Applied
            </Badge>
            {lia.applicationStatus && (
              <Badge variant="outline" className={getStatusColor(lia.applicationStatus) + ' px-4 py-2'}>
                {getStatusIcon(lia.applicationStatus)}
                <span className="ml-1">{lia.applicationStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </Badge>
            )}
            {lia.offerLetter && lia.offerLetter.sentOn && (
              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 px-4 py-2 animate-pulse">
                <PartyPopper className="h-4 w-4 mr-1" />
                Offer Letter Received!
              </Badge>
            )}
          </div>
        )}

        {/* LIA Details Grid - Compact for right panel */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Location</p>
            <p className="font-semibold flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3" />
              {lia.location}
            </p>
          </div>
          {lia.duration && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="font-semibold flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3" />
                {lia.duration}
              </p>
            </div>
          )}
          {lia.locationType && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Work Mode</p>
              <p className="font-semibold flex items-center gap-1 text-sm">
                <Globe className="h-3 w-3" />
                {lia.locationType}
              </p>
            </div>
          )}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Openings</p>
            <p className="font-semibold text-sm">{lia.openings || 1}</p>
          </div>
        </div>

        {/* Tags */}
        {lia.tags && lia.tags.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4" />
              Skills & Technologies
            </h4>
            <div className="flex flex-wrap gap-2">
              {lia.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {lia.description && (
          <div>
            <h4 className="font-semibold mb-2 text-sm">About the LIA</h4>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
              {lia.description}
            </p>
          </div>
        )}

        {/* Learning Goals */}
        {lia.learningGoals && lia.learningGoals.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-sm">Learning Goals</h4>
            <ul className="space-y-1.5">
              {lia.learningGoals.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-2 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Offer Letter Section (if applicable) */}
        {lia.offerLetter && lia.offerLetter.sentOn && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
                Offer Letter Received!
              </h3>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Sent on:</span>
                <span className="font-semibold">{formatDate(lia.offerLetter.sentOn)}</span>
              </div>
              
              {lia.offerLetter.startDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-semibold">{formatDate(lia.offerLetter.startDate)}</span>
                </div>
              )}
              
              {lia.offerLetter.message && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {lia.offerLetter.message}
                  </p>
                </div>
              )}
            </div>

            {offerLetterDownloadUrl && (
              <Button
                className="w-full mb-2 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  if (onDownloadOffer) {
                    onDownloadOffer(lia)
                  } else {
                    window.open(offerLetterDownloadUrl, '_blank', 'noopener,noreferrer')
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Offer Letter PDF
              </Button>
            )}

            {lia.offerLetter.status === 'sent' && onAcceptOffer && (
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                onClick={() => onAcceptOffer(lia)}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Accept Offer
              </Button>
            )}

            {lia.offerLetter.status === 'accepted' && (
              <div className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-700 dark:text-green-400">
                  ✅ Offer Accepted
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Congratulations! You're all set for your LIA placement.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Apply Button (if not applied) */}
        {!lia.applied && !isDeadlinePassed && !isHiringStopped && (
          <Button 
            onClick={() => onQuickApply(lia)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
            size="lg"
          >
            <Send className="h-5 w-5 mr-2" />
            Apply Now
          </Button>
        )}
      </div>
    )
  }

  // Modal view (original full-screen modal)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-card rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{lia.title}</h2>
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
              <GraduationCap className="h-4 w-4 mr-1" />
              LIA
            </Badge>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Company Info */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {organizationLogo ? (
                <img 
                  src={getImageUrl(organizationLogo)} 
                  alt={organizationName}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl">{organizationName}</h3>
              {organizationDescription && (
                <p className="text-muted-foreground">{organizationDescription}</p>
              )}
            </div>
            <button
              onClick={() => onToggleWishlist(lia)}
              className={`p-3 rounded-full hover:bg-muted transition-colors ${
                lia.wishlisted ? 'text-yellow-500' : 'text-muted-foreground'
              }`}
            >
              <Bookmark className="h-6 w-6" fill={lia.wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* LIA Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="font-semibold flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {lia.location}
              </p>
            </div>
            {lia.duration && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {lia.duration}
                </p>
              </div>
            )}
            {lia.locationType && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Work Mode</p>
                <p className="font-semibold flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {lia.locationType}
                </p>
              </div>
            )}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Openings</p>
              <p className="font-semibold">{lia.openings || 1}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Applicants</p>
              <p className="font-semibold flex items-center gap-1">
                <Users className="h-4 w-4" />
                {lia.applicants || 0}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Posted On</p>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(lia.postedOn || lia.createdAt)}
              </p>
            </div>
            {lia.mentor && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Mentor</p>
                <p className="font-semibold">
                  {typeof lia.mentor === 'object' && lia.mentor?.first && lia.mentor?.last
                    ? `${lia.mentor.first} ${lia.mentor.last}`.trim()
                    : lia.mentor || '—'}
                </p>
              </div>
            )}
            {lia.supervisor && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Supervisor</p>
                <p className="font-semibold">
                  {typeof lia.supervisor === 'object' && lia.supervisor?.first && lia.supervisor?.last
                    ? `${lia.supervisor.first} ${lia.supervisor.last}`.trim()
                    : lia.supervisor || '—'}
                </p>
              </div>
            )}
            {lia.deadline && (
              <div className={`p-4 rounded-lg ${
                isDeadlinePassed 
                  ? 'bg-red-50 dark:bg-red-950' 
                  : 'bg-blue-50 dark:bg-blue-950'
              }`}>
                <p className={`text-xs mb-1 ${
                  isDeadlinePassed 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>Application Deadline</p>
                <p className={`font-semibold ${
                  isDeadlinePassed 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {formatDate(lia.deadline)}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {lia.tags && lia.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Skills & Technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {lia.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {lia.description && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">About the LIA</h4>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {lia.description}
              </p>
            </div>
          )}

          {/* Learning Goals */}
          {lia.learningGoals && lia.learningGoals.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Learning Goals</h4>
              <ul className="space-y-2">
                {lia.learningGoals.map((goal, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support Provided */}
          {lia.support && lia.support.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Support Provided</h4>
              <ul className="space-y-2">
                {lia.support.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <ArrowRight className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsibilities */}
          {lia.responsibilities && lia.responsibilities.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Your Responsibilities</h4>
              <ul className="space-y-2">
                {lia.responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <ArrowRight className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {lia.requirements && lia.requirements.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Requirements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lia.requirements.map((req, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{req.label}</p>
                    <p className="text-sm font-medium">{req.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offer Letter Details (if sent) */}
          {lia.offerLetter && lia.offerLetter.sentOn && (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-300 dark:border-green-700 rounded-xl shadow-lg space-y-4">
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-xl text-green-700 dark:text-green-400 flex items-center gap-2">
                  <Mail className="h-6 w-6" />
                  Offer Letter Received
                </h4>
                {lia.offerLetter.acceptedOn ? (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accepted
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-600 text-white">
                    <Clock className="h-4 w-4 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                  <p className="font-semibold text-lg">{formatDate(lia.offerLetter.startDate)}</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">LIA Duration</p>
                  <p className="font-semibold text-lg">{lia.offerLetter.duration}</p>
                </div>
              </div>

              {lia.offerLetter.note && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                  <p className="text-sm">{lia.offerLetter.note}</p>
                </div>
              )}

              {/* PDF Download */}
              {offerLetterDownloadUrl && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-semibold text-blue-700 dark:text-blue-300">Offer Letter PDF</p>
                        <p className="text-xs text-muted-foreground">Official offer document</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (onDownloadOffer) {
                          onDownloadOffer(lia)
                        } else {
                          window.open(offerLetterDownloadUrl, '_blank', 'noopener,noreferrer')
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              )}

              {lia.offerLetter.acceptedOn ? (
                <div className="flex items-center gap-2 p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      You accepted this offer on {formatDate(lia.offerLetter.acceptedOn)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      The company has been notified. They will contact you soon!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Important:</strong> Review the offer details carefully. Once accepted, the company will be notified immediately.
                    </p>
                  </div>
                  <Button 
                    onClick={async () => {
                      try {
                        // Accept the offer
                        await apiClient.post(
                          `/lias/applications/${lia.applicationId}/accept-offer`,
                          {},
                          {
                            headers: { Authorization: `Bearer ${accessToken}` }
                          }
                        )
                        
                        toast.success('🎉 Offer accepted successfully!')
                        
                        // Refresh data to show updated status
                        await Promise.all([
                          dispatch(fetchMyLIAs()).unwrap(),
                          dispatch(fetchMyLIAApplications()).unwrap()
                        ])
                        
                        // Close modal
                        setSelectedLIA(null)
                        
                        toast.success('The company has been notified! 📧', { duration: 3000 })
                      } catch (error) {
                        console.error('Failed to accept offer:', error)
                        toast.error(error.response?.data?.message || 'Failed to accept offer. Please try again.')
                      }
                    }}
                    size="lg" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Accept Offer
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 border-t">
            {lia.applied ? (
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 text-base py-2 px-4">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Applied
              </Badge>
            ) : isDeadlinePassed || isHiringStopped ? (
              <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-base py-2 px-4">
                <XCircle className="h-4 w-4 mr-2" />
                {isHiringStopped ? 'Placement Stopped' : 'Deadline Passed'}
              </Badge>
            ) : (
              <Button
                onClick={() => onQuickApply(lia)}
                className="bg-purple-500 hover:bg-purple-600 px-6"
              >
                <Send className="h-4 w-4 mr-2" />
                Apply for this LIA
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentLIAs() {
  const dispatch = useDispatch()
  const { isDark } = useTheme()
  const { accessToken } = useSelector(selectAuth)
  const navigate = useNavigate()
  
  // Get LIAs from Redux store (same as Jobs system)
  const lias = useSelector(selectLiaSummaries)
  const loading = useSelector(state => state.liaApplications?.loading || false)
  
  const [selectedLIA, setSelectedLIA] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [applicationModal, setApplicationModal] = useState({ open: false, lia: null })
  const [viewMode, setViewMode] = useState('browse') // 'browse' or 'applied'
  const [statusFilter, setStatusFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [durationFilter, setDurationFilter] = useState('')
  const [appliedLiasCount, setAppliedLiasCount] = useState(0)
  const myApplications = useSelector(selectMyLIAApplications)

  const downloadOfferLetter = React.useCallback(async (liaItem) => {
    const offerLetter = liaItem?.offerLetter

    if (!offerLetter) {
      toast.error('Offer letter not available yet.')
      return
    }

    const downloadUrl = getOfferLetterDownloadUrl(offerLetter)

    if (!downloadUrl) {
      toast.error('Offer letter file not found. Please check back later.')
      return
    }

    const slugify = (value) => {
      if (!value) return 'lia-offer-letter'
      return value
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'lia-offer-letter'
    }

    const baseFileName = `${slugify(liaItem?.title)}-offer-letter`
    const fileName = baseFileName.toLowerCase().endsWith('.pdf')
      ? baseFileName
      : `${baseFileName}.pdf`

    const needsAuthenticatedFetch =
      downloadUrl.startsWith('/') ||
      downloadUrl.startsWith(BACKEND_BASE_URL) ||
      downloadUrl.includes('/uploads/')

    if (!needsAuthenticatedFetch) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
      return
    }

    let toastId
    try {
      toastId = toast.loading('Downloading offer letter...')
      const response = await apiClient.get(downloadUrl, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Offer letter downloaded', { id: toastId })
    } catch (error) {
      console.error('Failed to download offer letter:', error)
      if (toastId) {
        toast.error('Unable to download offer letter. Opening in new tab...', { id: toastId })
      }
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    }
  }, [])

  // Fetch LIAs and applications from backend
  useEffect(() => {
    if (accessToken) {
      console.log('🎓 StudentLIAs: Fetching data...')
      dispatch(fetchMyLIAs())
      dispatch(fetchMyLIAApplications())
    }
  }, [dispatch, accessToken])

  // Auto-refresh data every 30 seconds to catch status updates
  useEffect(() => {
    if (!accessToken) return

    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing LIA data...')
      dispatch(fetchMyLIAs())
      dispatch(fetchMyLIAApplications())
    }, 30000) // 30 seconds

    return () => clearInterval(refreshInterval)
  }, [dispatch, accessToken])

  // Manual refresh function
  const handleRefresh = async () => {
    try {
      toast.info('Refreshing data...')
      await Promise.all([
        dispatch(fetchMyLIAs()).unwrap(),
        dispatch(fetchMyLIAApplications()).unwrap()
      ])
      toast.success('✅ Data refreshed!')
    } catch (error) {
      console.error('Failed to refresh:', error)
      toast.error('Failed to refresh data')
    }
  }

  useEffect(() => {
    console.log('🎓 StudentLIAs: LIAs in Redux state:', lias.length)
    console.log('🎓 StudentLIAs: My Applications:', myApplications.length)
    
    // Debug: Show detailed application data
    if (myApplications.length > 0) {
      console.log('📊 DEBUGGING MY APPLICATIONS:')
      myApplications.forEach((app, idx) => {
        console.log(`Application ${idx + 1}:`, {
          id: app.id || app._id,
          liaId: app.lia?._id || app.lia?.id || app.liaId,
          status: app.status,
          hasOfferLetter: !!app.offerLetter,
          offerLetterStatus: app.offerLetter?.status,
          offerLetterSentOn: app.offerLetter?.sentOn,
          offerLetterStartDate: app.offerLetter?.startDate,
          fullOfferLetterData: app.offerLetter,
          rawApplicationData: app
        })
      })
    }
    
    // Debug: Show merged LIA data
    const appliedLias = lias.filter(l => l.applied)
    if (appliedLias.length > 0) {
      console.log('📊 DEBUGGING APPLIED LIAs:')
      appliedLias.forEach((lia, idx) => {
        console.log(`LIA ${idx + 1}:`, {
          id: lia.id || lia._id,
          title: lia.title,
          applied: lia.applied,
          applicationStatus: lia.applicationStatus,
          hasOfferLetter: !!lia.offerLetter,
          offerLetterSentOn: lia.offerLetter?.sentOn
        })
      })
    }
  }, [lias, myApplications])

  const handleToggleWishlist = async (lia) => {
    try {
      await apiClient.post(`/lias/${lia.id}/wishlist`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      
      // Refresh LIAs from Redux
      dispatch(fetchMyLIAs())
      
      toast.success(lia.wishlisted ? 'Removed from wishlist' : 'Added to wishlist')
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
      toast.error('Failed to update wishlist')
    }
  }

  const handleQuickApply = (lia) => {
    // Check if already applied - comprehensive ID matching
    const liaId = lia.id || lia._id || lia.postingId
    const hasAlreadyApplied = myApplications.some(app => {
      const appLiaId = app.lia?._id || app.lia?.id || app.lia || app.liaId
      const appLiaIdStr = appLiaId?.toString ? appLiaId.toString() : String(appLiaId || '')
      const liaIdStr = liaId?.toString ? liaId.toString() : String(liaId || '')
      return appLiaIdStr === liaIdStr
    })
    
    // Also check lia.applied from backend
    if (hasAlreadyApplied || lia.applied) {
      toast.error('You have already applied to this LIA placement')
      return
    }
    
    console.log('📝 Opening application modal for LIA:', liaId, lia.title)
    setApplicationModal({ open: true, lia })
  }

  const handleApplicationSuccess = async () => {
    console.log('🎉 Application submitted successfully!')
    
    // Close modal immediately for better UX
    setApplicationModal({ open: false, lia: null })
    
    // Show success toast
    toast.success('Application submitted successfully! ✅')
    
    // Refresh data to get updated application status
    try {
      // Fetch both in parallel for efficiency
      await Promise.all([
        dispatch(fetchMyLIAs()).unwrap(),
        dispatch(fetchMyLIAApplications()).unwrap()
      ])
      
      console.log('✅ Data refreshed after application')
      
      // Close any open details
      if (selectedLIA) {
        setSelectedLIA(null)
      }
      
      // Switch to "Applied" tab to show the new application
      setTimeout(() => {
        setViewMode('applied')
        toast.success('View your application in the Applied tab! 📋', { duration: 3000 })
      }, 500)
    } catch (error) {
      console.error('Failed to refresh data after application:', error)
      toast.error('Application submitted but failed to refresh. Please reload the page.')
    }
  }

  // Mark LIAs as applied based on myApplications and merge application data
  const liasWithApplicationStatus = lias.map(lia => {
    const liaId = lia.id || lia._id || lia.postingId

    // Find matching application
    const application = myApplications.find(app => {
      const appLiaId = app.lia?._id || app.lia?.id || app.lia || app.liaId
      const appLiaIdStr = appLiaId?.toString ? appLiaId.toString() : String(appLiaId || '')
      const liaIdStr = liaId?.toString ? liaId.toString() : String(liaId || '')
      return appLiaIdStr === liaIdStr
    })

    const backendStatus = normalizeApplicationStatus(lia.applicationStatus)
    const applicationStatus = normalizeApplicationStatus(application?.status || backendStatus)
    const mergedOfferLetter =
      normalizeOfferLetter(application?.offerLetter, applicationStatus) ||
      normalizeOfferLetter(lia.offerLetter, applicationStatus)

    const finalStatus = (() => {
      if (!applicationStatus) return backendStatus
      if (mergedOfferLetter?.status === 'accepted') {
        if (['offer_sent', 'offer_accepted'].includes(applicationStatus)) {
          return 'offer_accepted'
        }
        if (['hired', 'placed'].includes(applicationStatus)) {
          return applicationStatus
        }
      }
      return applicationStatus || backendStatus
    })()

    if (application) {
      console.log('✅ MATCHED LIA:', {
        liaTitle: lia.title,
        liaId,
        applicationStatus: finalStatus,
        rawStatus: application.status,
        hasOfferLetter: !!application.offerLetter,
        offerSentOn: mergedOfferLetter?.sentOn,
      })
    }

    return {
      ...lia,
      applied: Boolean(application) || !!lia.applied,
      applicationStatus: finalStatus,
      applicationId: application?.id || application?._id || lia.applicationId,
      offerLetter: mergedOfferLetter,
      applicationStage: application?.stage || lia.applicationStage || null,
    }
  })

  // Filter based on view mode and filters
  const getFilteredLIAs = () => {
    const searchLower = searchTerm.toLowerCase()
    
    // Start with base filtering by viewMode
    let filtered = liasWithApplicationStatus
    
    if (viewMode === 'applied') {
      // Show only applied LIAs
      filtered = filtered.filter(lia => lia.applied)
      
      // Apply status filter if set
      if (statusFilter) {
        filtered = filtered.filter(lia => lia.applicationStatus === statusFilter)
      }
    } else {
      // Browse mode - show all LIAs
      // Apply location filter if set
      if (locationFilter) {
        filtered = filtered.filter(lia => 
          lia.location?.toLowerCase().includes(locationFilter.toLowerCase())
        )
      }
      
      // Apply duration filter if set
      if (durationFilter) {
        filtered = filtered.filter(lia => 
          lia.duration?.toLowerCase().includes(durationFilter.toLowerCase())
        )
      }
    }
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(lia => {
        if (!lia) return false
        const titleMatch = lia.title?.toLowerCase().includes(searchLower)
        const orgName = typeof lia.organization === 'object' 
          ? lia.organization?.name 
          : lia.company || lia.organization || ''
        const companyMatch = orgName?.toLowerCase().includes(searchLower)
        const locationMatch = lia.location?.toLowerCase().includes(searchLower)
        const tagsMatch = lia.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        return titleMatch || companyMatch || locationMatch || tagsMatch
      })
    }
    
    return filtered
  }

  const filteredLIAs = getFilteredLIAs()
  
  const appliedCount = liasWithApplicationStatus.filter(l => l.applied).length
  const wishlistCount = liasWithApplicationStatus.filter(l => l.wishlisted).length

  // Update applied count
  useEffect(() => {
    setAppliedLiasCount(appliedCount)
  }, [appliedCount])

  // Handler for accepting offer
  const handleAcceptOffer = async (lia) => {
    try {
      await apiClient.post(`/lias/applications/${lia.applicationId}/accept-offer`)
      toast.success('🎉 Congratulations! You have accepted the offer!')
      
      // Refresh data
      await Promise.all([
        dispatch(fetchMyLIAs()).unwrap(),
        dispatch(fetchMyLIAApplications()).unwrap()
      ])
      
      // Close details panel
      setSelectedLIA(null)
    } catch (error) {
      console.error('Error accepting offer:', error)
      toast.error(error.response?.data?.message || 'Failed to accept offer')
    }
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className={`max-w-7xl mx-auto p-6 space-y-6 ${isDark ? 'text-white' : 'text-black'}`}>
              {/* Header with View Mode Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h1 className={`text-3xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <GraduationCap className="h-8 w-8 text-purple-500" />
                    LIA Opportunities
                  </h1>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <svg 
                      className="h-4 w-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                      />
                    </svg>
                    Refresh
                  </Button>
                </div>
                
                {/* View Mode Tabs */}
                <div className="flex gap-2 border-b mt-4">
                  <button
                    onClick={() => {
                      setViewMode('browse')
                      setStatusFilter('')
                      setSelectedLIA(null)
                    }}
                    className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                      viewMode === 'browse'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Browse LIAs
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('applied')
                      setSearchTerm('')
                      setSelectedLIA(null)
                    }}
                    className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                      viewMode === 'applied'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      My Applications
                      {appliedLiasCount > 0 && (
                        <Badge className="bg-purple-600 text-white">
                          {appliedLiasCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Filters and Search */}
              {viewMode === 'browse' ? (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search LIAs, companies, skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={locationFilter === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLocationFilter('')}
                    >
                      All Locations
                    </Button>
                    <Button
                      variant={durationFilter === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDurationFilter('')}
                    >
                      All Durations
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Status Filters for Applied View */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={statusFilter === '' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      All Statuses
                    </Button>
                    <Button
                      size="sm"
                      variant={statusFilter === 'under_review' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('under_review')}
                    >
                      Under Review
                    </Button>
                    <Button
                      size="sm"
                      variant={statusFilter === 'interview' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('interview')}
                    >
                      Interview
                    </Button>
                    <Button
                      size="sm"
                      variant={statusFilter === 'selected' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('selected')}
                    >
                      Selected
                    </Button>
                    <Button
                      size="sm"
                      variant={statusFilter === 'offer_sent' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('offer_sent')}
                      className="relative"
                    >
                      Offers
                      {liasWithApplicationStatus.filter(l => l.applicationStatus === 'offer_sent').length > 0 && (
                        <Badge className="ml-1 bg-green-500 text-white">
                          {liasWithApplicationStatus.filter(l => l.applicationStatus === 'offer_sent').length}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={statusFilter === 'placed' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('placed')}
                    >
                      Placed
                    </Button>
                    <Button
                      size="sm"
                      variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('rejected')}
                    >
                      Rejected
                    </Button>
                  </div>
                </div>
              )}

              {/* Split Panel Layout */}
              <div className="flex gap-6 h-[calc(100vh-280px)]">
                {/* LEFT PANEL - LIA List */}
                <div className={`${selectedLIA ? 'w-2/5' : 'w-full'} transition-all duration-300 overflow-y-auto space-y-4`}>
                  {loading ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                    </div>
                  ) : filteredLIAs.length === 0 ? (
                    <div className="text-center py-20">
                      <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No LIAs found</h3>
                      <p className="text-muted-foreground">
                        {viewMode === 'applied' 
                          ? 'You haven\'t applied to any LIAs yet' 
                          : 'Try adjusting your filters or search criteria'}
                      </p>
                      {viewMode === 'applied' && (
                        <Button 
                          onClick={() => setViewMode('browse')}
                          className="mt-4 bg-purple-600 hover:bg-purple-700"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Browse LIAs
                        </Button>
                      )}
                    </div>
                  ) : viewMode === 'applied' ? (
                    // Show ApplicationCard in applied view with full application data
                    myApplications
                      .filter(app => {
                        const liaId = app.lia?._id || app.lia?.id || app.lia || app.liaId
                        return filteredLIAs.some(lia => {
                          const filteredLiaId = lia.id || lia._id
                          return liaId?.toString() === filteredLiaId?.toString()
                        })
                      })
                      .map((application) => (
                        <ApplicationCard
                          key={application.id || application._id}
                          application={application}
                          onClick={(app) => setSelectedApplication(app)}
                          isDark={isDark}
                        />
                      ))
                  ) : (
                    // Show LIACard in browse view
                    filteredLIAs.map((lia) => (
                      <LIACard
                        key={lia.id || lia._id}
                        lia={lia}
                        onView={() => setSelectedLIA(lia)}
                        onToggleWishlist={handleToggleWishlist}
                        onQuickApply={handleQuickApply}
                        isSelected={selectedLIA && (selectedLIA.id || selectedLIA._id) === (lia.id || lia._id)}
                        isDark={isDark}
                      />
                    ))
                  )}
                </div>

                {/* RIGHT PANEL - LIA Details */}
                {selectedLIA && (
                  <div className="w-3/5 border-l pl-6 overflow-y-auto">
                    <LIADetails
                      lia={selectedLIA}
                      onClose={() => setSelectedLIA(null)}
                      onToggleWishlist={handleToggleWishlist}
                      onQuickApply={handleQuickApply}
                      onAcceptOffer={handleAcceptOffer}
                      onDownloadOffer={downloadOfferLetter}
                      inlineView={true}
                      isDark={isDark}
                    />
                  </div>
                )}
              </div>
          </div>
        </SidebarInset>
      </div>

      {/* Application Modal */}
      {applicationModal.open && (
  <LiaApplicationModal
          lia={applicationModal.lia}
          onClose={() => setApplicationModal({ open: false, lia: null })}
          onSuccess={handleApplicationSuccess}
        />
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <ApplicationDetails
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onAcceptOffer={() => {
            // Refresh applications after accepting offer
            dispatch(fetchMyLIAApplications())
            dispatch(fetchMyLIAs())
            setSelectedApplication(null)
          }}
          isDark={isDark}
        />
      )}
    </SidebarProvider>
  )
}
