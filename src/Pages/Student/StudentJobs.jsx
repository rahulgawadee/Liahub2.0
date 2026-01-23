import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectAuth } from '@/redux/store'
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
  DollarSign,
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
  FileText
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getImageUrl } from '@/lib/imageUtils'
import { toast } from 'sonner'
import JobApplicationModal from '@/Components/jobs/JobApplicationModal'

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
    hired: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-bold',
    rejected: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    withdrawn: 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  }
  return colors[status] || colors.applied
}

const getStatusIcon = (status) => {
  if (['hired', 'offer_accepted', 'offer_sent'].includes(status)) {
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

const JobCard = ({ job, onView, onToggleWishlist, onQuickApply }) => {
  const isDeadlinePassed = job.deadline && new Date(job.deadline) < new Date()
  const isHiringStopped = job.status === 'hiring_stopped' || job.status === 'closed'

  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
         onClick={() => onView(job)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {job.organization?.logo ? (
              <img 
                src={getImageUrl(job.organization.logo)} 
                alt={job.organization.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1 truncate">{job.title}</h3>
            <p className="text-muted-foreground text-sm mb-2">{job.organization?.name}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              {job.employmentType && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {job.employmentType}
                </span>
              )}
              {job.locationType && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {job.locationType}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleWishlist(job)
          }}
          className={`p-2 rounded-full hover:bg-muted transition-colors ${
            job.wishlisted ? 'text-yellow-500' : 'text-muted-foreground'
          }`}
        >
          <Bookmark className="h-5 w-5" fill={job.wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.tags.slice(0, 5).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4 text-sm">
          {job.salary && (
            <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
              <DollarSign className="h-4 w-4" />
              {job.salary}
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            {job.applicants || 0} applicants
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatTimeAgo(job.postedOn || job.createdAt)}
          </span>
        </div>

        {job.applied ? (
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Applied
          </Badge>
        ) : isDeadlinePassed || isHiringStopped ? (
          <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {isHiringStopped ? 'Hiring Stopped' : 'Deadline Passed'}
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onQuickApply(job)
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4 mr-1" />
            Quick Apply
          </Button>
        )}
      </div>
    </div>
  )
}

const JobDetails = ({ job, onClose, onToggleWishlist, onQuickApply }) => {
  const isDeadlinePassed = job.deadline && new Date(job.deadline) < new Date()
  const isHiringStopped = job.status === 'hiring_stopped' || job.status === 'closed'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-card rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">{job.title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Company Info */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {job.organization?.logo ? (
                <img 
                  src={getImageUrl(job.organization.logo)} 
                  alt={job.organization.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl">{job.organization?.name}</h3>
              <p className="text-muted-foreground">{job.organization?.description}</p>
            </div>
            <button
              onClick={() => onToggleWishlist(job)}
              className={`p-3 rounded-full hover:bg-muted transition-colors ${
                job.wishlisted ? 'text-yellow-500' : 'text-muted-foreground'
              }`}
            >
              <Bookmark className="h-6 w-6" fill={job.wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="font-semibold flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Employment Type</p>
              <p className="font-semibold flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.employmentType || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Work Mode</p>
              <p className="font-semibold flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {job.locationType || 'N/A'}
              </p>
            </div>
            {job.salary && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Salary</p>
                <p className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </p>
              </div>
            )}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Openings</p>
              <p className="font-semibold">{job.openings || 1}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Applicants</p>
              <p className="font-semibold flex items-center gap-1">
                <Users className="h-4 w-4" />
                {job.applicants || 0}
              </p>
            </div>
            {job.seniority && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Seniority</p>
                <p className="font-semibold">{job.seniority}</p>
              </div>
            )}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Posted On</p>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(job.postedOn || job.createdAt)}
              </p>
            </div>
            {job.deadline && (
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
                  {new Date(job.deadline).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Skills & Technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">About the Role</h4>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Key Responsibilities</h4>
              <ul className="space-y-2">
                {job.responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Requirements</h4>
              <ul className="space-y-2">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {typeof req === 'string' ? req : req.label || req.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Benefits</h4>
              <ul className="space-y-2">
                {job.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application Status Notice */}
          {isHiringStopped && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Hiring has been stopped for this position
              </p>
            </div>
          )}

          {isDeadlinePassed && !isHiringStopped && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                The application deadline has passed
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {job.applied ? (
              <div className="flex-1 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  You have already applied for this position
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: <span className="font-medium">{job.applicationStatus || 'Applied'}</span>
                </p>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  size="lg"
                  onClick={() => onQuickApply(job)}
                  disabled={isDeadlinePassed || isHiringStopped}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Quick Apply
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ApplicationCard = ({ application, onClick }) => {
  const job = application.job
  const hasOffer = application.offerLetter && application.offerLetter.sentOn
  const offerPending = hasOffer && !application.offerLetter.acceptedOn

  return (
    <div 
      className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer relative"
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
          {job.organization?.logo ? (
            <img 
              src={getImageUrl(job.organization.logo)} 
              alt={job.organization.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1 truncate">{job.title}</h3>
          <p className="text-muted-foreground text-sm mb-2">{job.organization?.name}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {job.type}
            </span>
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
            <span className="font-bold text-blue-600 dark:text-blue-400">
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

const ApplicationDetails = ({ application, onClose, onAcceptOffer }) => {
  const job = application.job
  const [accepting, setAccepting] = useState(false)

  const handleAcceptOffer = async () => {
    setAccepting(true)
    try {
      await apiClient.post(`/jobs/applications/${application.id}/accept-offer`)
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
      <div className="w-full max-w-3xl bg-card rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Application Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Job Info */}
          <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
            <div className="h-16 w-16 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
              {job.organization?.logo ? (
                <img 
                  src={getImageUrl(job.organization.logo)} 
                  alt={job.organization.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl mb-1">{job.title}</h3>
              <p className="text-muted-foreground mb-2">{job.organization?.name}</p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {job.type}
                </span>
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
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Profile Match</p>
                <p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
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
                  <p className="text-xs text-muted-foreground mb-1">Compensation</p>
                  <p className="font-semibold text-lg">{application.offerLetter.compensation}</p>
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
                      onClick={() => window.open(application.offerLetter.pdfUrl, '_blank')}
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

export default function StudentJobs() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(selectAuth)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('job') // 'job', 'internship', 'lia'
  const [viewMode, setViewMode] = useState('browse') // 'browse' or 'applied'
  const [statusFilter, setStatusFilter] = useState('') // For applied view
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [applicationModal, setApplicationModal] = useState({ open: false, job: null })
  const [appliedJobsCount, setAppliedJobsCount] = useState(0)

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/jobs', {
        params: {
          type: typeFilter,
          search: searchQuery || undefined,
          status: 'open',
          page,
          limit: 20,
        }
      })

      if (response.data) {
        setJobs(response.data.items || [])
        setTotalPages(response.data.pages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/jobs/my/applications', {
        params: {
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          page,
          limit: 20,
        }
      })

      if (response.data) {
        setApplications(response.data.items || [])
        setTotalPages(response.data.pages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'browse') {
      fetchJobs()
    } else {
      fetchApplications()
    }
    fetchAppliedJobsCount()
  }, [viewMode, typeFilter, statusFilter, page])

  const fetchAppliedJobsCount = async () => {
    try {
      const response = await apiClient.get('/jobs/my/applications', {
        params: { limit: 1 }
      })
      if (response.data) {
        setAppliedJobsCount(response.data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch applied jobs count:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  const handleToggleWishlist = async (job) => {
    try {
      await apiClient.post(`/jobs/${job.id}/wishlist`)
      
      // Update local state
      setJobs(jobs.map(j => 
        j.id === job.id 
          ? { ...j, wishlisted: !j.wishlisted }
          : j
      ))
      
      if (selectedJob && selectedJob.id === job.id) {
        setSelectedJob({ ...selectedJob, wishlisted: !selectedJob.wishlisted })
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
      alert('Failed to update wishlist')
    }
  }

  const handleQuickApply = (job) => {
    // Open the application modal instead of simple confirm
    setApplicationModal({ open: true, job })
  }

  const handleApplicationSuccess = () => {
    const appliedJobTitle = applicationModal.job?.title || 'the position'
    
    // Mark the job as applied in local state
    if (applicationModal.job) {
      const updatedJobs = jobs.map(j => 
        j.id === applicationModal.job.id 
          ? { ...j, applied: true, applicationStatus: 'applied' }
          : j
      )
      setJobs(updatedJobs)
      
      // Update selected job if it's the one we applied to
      if (selectedJob && selectedJob.id === applicationModal.job.id) {
        setSelectedJob({ ...selectedJob, applied: true, applicationStatus: 'applied' })
      }
      
      // Update applied jobs count
      setAppliedJobsCount(prev => prev + 1)
    }
    
    // Close modal and job details
    setApplicationModal({ open: false, job: null })
    setSelectedJob(null)
    
    // Show success toast with action button
    toast.success(`Application submitted for ${appliedJobTitle}!`, {
      description: 'Track your application status and receive updates',
      action: {
        label: 'View Applications',
        onClick: () => navigate('/student/my-applications')
      },
      duration: 6000,
    })
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header with Tabs */}
            <div>
              <h1 className="text-3xl font-bold mb-2">Job Opportunities</h1>
              <p className="text-muted-foreground mb-4">
                Discover and apply to jobs that match your profile
              </p>
              
              {/* View Mode Tabs */}
              <div className="flex gap-2 border-b mt-4">
                <button
                  onClick={() => {
                    setViewMode('browse')
                    setPage(1)
                    setStatusFilter('')
                  }}
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                    viewMode === 'browse'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Browse Jobs
                  </div>
                </button>
                <button
                  onClick={() => {
                    setViewMode('applied')
                    setPage(1)
                    setSearchQuery('')
                  }}
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                    viewMode === 'applied'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    My Applications
                    {appliedJobsCount > 0 && (
                      <Badge className="bg-blue-600 text-white">
                        {appliedJobsCount}
                      </Badge>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* My Applications Quick Access Banner - Only show in browse mode */}
            {viewMode === 'browse' && appliedJobsCount > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <FileCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">You have {appliedJobsCount} active application{appliedJobsCount !== 1 ? 's' : ''}</h3>
                      <p className="text-sm text-muted-foreground">Track status, view offers, and manage your applications</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setViewMode('applied')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    View Applications
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Filters */}
            {viewMode === 'browse' ? (
              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <Input
                    placeholder="Search jobs, companies, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </form>
                
                <div className="flex gap-2">
                  <Button
                    variant={typeFilter === 'job' ? 'default' : 'outline'}
                    onClick={() => {
                      setTypeFilter('job')
                      setPage(1)
                    }}
                  >
                    Jobs
                  </Button>
                  <Button
                    variant={typeFilter === 'internship' ? 'default' : 'outline'}
                    onClick={() => {
                      setTypeFilter('internship')
                      setPage(1)
                    }}
                  >
                    Internships
                  </Button>
                  <Button
                    variant={typeFilter === 'lia' ? 'default' : 'outline'}
                    onClick={() => {
                      setTypeFilter('lia')
                      setPage(1)
                    }}
                  >
                    LIA
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Status Filters for Applied View */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={statusFilter === '' ? 'default' : 'outline'}
                    onClick={() => {
                      setStatusFilter('')
                      setPage(1)
                    }}
                  >
                    All Applications
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'applied' ? 'default' : 'outline'}
                    onClick={() => {
                      setStatusFilter('applied')
                      setPage(1)
                    }}
                  >
                    Applied
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'under_review' ? 'default' : 'outline'}
                    onClick={() => {
                      setStatusFilter('under_review')
                      setPage(1)
                    }}
                  >
                    Under Review
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'interview' ? 'default' : 'outline'}
                    onClick={() => {
                      setStatusFilter('interview')
                      setPage(1)
                    }}
                  >
                    Interview
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'offer_sent' ? 'default' : 'outline'}
                    onClick={() => {
                      setStatusFilter('offer_sent')
                      setPage(1)
                    }}
                    className="relative"
                  >
                    Offers
                    {applications.filter(a => a.status === 'offer_sent').length > 0 && (
                      <Badge className="ml-1 bg-green-500 text-white">
                        {applications.filter(a => a.status === 'offer_sent').length}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'hired' ? 'default' : 'outline'}
                    onClick={() => {
                      setStatusFilter('hired')
                      setPage(1)
                    }}
                  >
                    Hired
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                    onClick={() => {
                      setStatusFilter('rejected')
                      setPage(1)
                    }}
                  >
                    Rejected
                  </Button>
                </div>

                {/* Type Filter for Applied View */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={typeFilter === 'job' ? 'default' : 'outline'}
                    onClick={() => {
                      setTypeFilter('job')
                      setPage(1)
                    }}
                  >
                    Jobs
                  </Button>
                  <Button
                    size="sm"
                    variant={typeFilter === 'internship' ? 'default' : 'outline'}
                    onClick={() => {
                      setTypeFilter('internship')
                      setPage(1)
                    }}
                  >
                    Internships
                  </Button>
                  <Button
                    size="sm"
                    variant={typeFilter === 'lia' ? 'default' : 'outline'}
                    onClick={() => {
                      setTypeFilter('lia')
                      setPage(1)
                    }}
                  >
                    LIA
                  </Button>
                </div>
              </div>
            )}

            {/* Jobs List / Applications List */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
            ) : viewMode === 'browse' ? (
              // Browse Jobs View
              jobs.length === 0 ? (
                <div className="text-center py-20">
                  <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search criteria
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {jobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onView={setSelectedJob}
                        onToggleWishlist={handleToggleWishlist}
                        onQuickApply={handleQuickApply}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )
            ) : (
              // Applied Jobs View
              applications.length === 0 ? (
                <div className="text-center py-20">
                  <FileCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {statusFilter 
                      ? `No applications with status "${statusFilter.replace(/_/g, ' ')}"`
                      : 'Start applying to jobs to track your applications here'}
                  </p>
                  <Button onClick={() => setViewMode('browse')}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Jobs
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {applications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        onClick={setSelectedApplication}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </SidebarInset>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetails
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onToggleWishlist={handleToggleWishlist}
          onQuickApply={handleQuickApply}
        />
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <ApplicationDetails
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onAcceptOffer={() => {
            fetchApplications()
            setSelectedApplication(null)
          }}
        />
      )}

      {/* Application Modal */}
      {applicationModal.open && applicationModal.job && (
        <JobApplicationModal
          open={applicationModal.open}
          onClose={() => setApplicationModal({ open: false, job: null })}
          job={applicationModal.job}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </SidebarProvider>
  )
}
