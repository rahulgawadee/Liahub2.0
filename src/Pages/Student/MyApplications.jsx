import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectAuth } from '@/redux/store'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import {
  MapPin,
  Briefcase,
  Building2,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  TrendingUp,
  Mail,
  PartyPopper,
  Download,
  BellRing,
  ArrowLeft,
  GraduationCap
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getImageUrl } from '@/lib/imageUtils'
import { toast } from 'sonner'

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

const ApplicationCard = ({ application, onClick }) => {
  const isLIA = application.applicationType === 'lia'
  const posting = isLIA ? application.lia : application.job
  
  const hasNewUpdate = application.updatedAt && 
    new Date(application.updatedAt).getTime() > new Date(application.createdAt).getTime() + 1000
  const hasOffer = application.offerLetter && application.offerLetter.sentOn
  const offerPending = hasOffer && !application.offerLetter.acceptedOn
  
  // Safe organization access
  const organization = typeof posting?.organization === 'object' 
    ? posting.organization 
    : { name: posting?.company || posting?.organization || 'Company', logo: null }

  return (
    <div 
      className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer relative"
      onClick={() => onClick(application)}
    >
      {/* New Update Badge */}
      {hasNewUpdate && !offerPending && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-blue-500 text-white animate-pulse">
            <BellRing className="h-3 w-3 mr-1" />
            Updated
          </Badge>
        </div>
      )}
      
      {/* Offer Pending Badge */}
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
          {organization.logo ? (
            <img 
              src={getImageUrl(organization.logo)} 
              alt={organization.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg truncate">{posting?.title}</h3>
            {isLIA && (
              <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                LIA
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mb-2">{organization.name}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {posting?.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {isLIA ? 'LIA Placement' : posting?.type}
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
            <span className="text-sm text-muted-foreground">Match Score:</span>
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
            You have a pending offer! Click to review and respond
          </p>
        </div>
      )}

      {application.notes && !offerPending && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <FileText className="h-4 w-4 inline mr-1" />
            {application.notes}
          </p>
        </div>
      )}
    </div>
  )
}

const ApplicationDetails = ({ application, onClose, onAcceptOffer }) => {
  const isLIA = application.applicationType === 'lia'
  const posting = isLIA ? application.lia : application.job
  const [accepting, setAccepting] = useState(false)
  
  // Safe organization access
  const organization = typeof posting?.organization === 'object' 
    ? posting.organization 
    : { name: posting?.company || posting?.organization || 'Company', logo: null }

  const handleAcceptOffer = async () => {
    setAccepting(true)
    try {
      const endpoint = isLIA 
        ? `/lias/applications/${application.id}/accept-offer`
        : `/jobs/applications/${application.id}/accept-offer`
      
      await apiClient.post(endpoint)
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
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Application Details</h2>
            {isLIA && (
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                LIA
              </Badge>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Job/LIA Info */}
          <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
            <div className="h-16 w-16 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
              {organization.logo ? (
                <img 
                  src={getImageUrl(organization.logo)} 
                  alt={organization.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl mb-1">{posting?.title}</h3>
              <p className="text-muted-foreground mb-2">{organization.name}</p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {posting?.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {isLIA ? 'LIA Placement' : posting?.type}
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
                  <p className="text-xs text-muted-foreground mb-1">
                    {application.applicationType === 'lia' ? 'LIA Duration' : 'Compensation'}
                  </p>
                  <p className="font-semibold text-lg">
                    {application.applicationType === 'lia' 
                      ? application.offerLetter.duration 
                      : application.offerLetter.compensation}
                  </p>
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

          {/* Timeline */}
          {application.timeline && application.timeline.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4 text-lg">Application Timeline</h4>
              <div className="space-y-4">
                {application.timeline.slice().reverse().map((event, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        getStatusColor(event.status).split(' ')[0]
                      }`}>
                        {getStatusIcon(event.status)}
                      </div>
                      {idx < application.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-muted min-h-[30px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold">
                        {event.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      {event.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{event.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {application.notes && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Internal Notes</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-muted-foreground">{application.notes}</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 border-t">
            <Button onClick={onClose} size="lg" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyApplications() {
  const navigate = useNavigate()
  const { user } = useSelector(selectAuth)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    offers: 0,
    hired: 0
  })

  const fetchApplications = async () => {
    try {
      setLoading(true)
      
      // Fetch both Job and LIA applications
      const [jobsResponse, liasResponse] = await Promise.all([
        apiClient.get('/jobs/my/applications', {
          params: {
            status: statusFilter || undefined,
            page: typeFilter === 'lia' ? undefined : page,
            limit: typeFilter === 'lia' ? undefined : 20,
          }
        }).catch(err => ({ data: { items: [] } })),
        apiClient.get('/lias/my/applications', {
          params: {
            status: statusFilter || undefined,
            page: typeFilter === 'job' ? undefined : page,
            limit: typeFilter === 'job' ? undefined : 20,
          }
        }).catch(err => ({ data: { items: [] } }))
      ])

      // Combine and mark type
      let allApplications = []
      
      if (typeFilter === 'job') {
        // Show only jobs
        allApplications = (jobsResponse.data.items || []).map(app => ({ ...app, applicationType: 'job' }))
      } else if (typeFilter === 'lia') {
        // Show only LIAs
        allApplications = (liasResponse.data.items || []).map(app => ({ ...app, applicationType: 'lia' }))
      } else {
        // Show both
        const jobs = (jobsResponse.data.items || []).map(app => ({ ...app, applicationType: 'job' }))
        const lias = (liasResponse.data.items || []).map(app => ({ ...app, applicationType: 'lia' }))
        allApplications = [...jobs, ...lias].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
      }

      setApplications(allApplications)
      setTotalPages(1) // Since we're combining, pagination is simplified
      
      // Calculate stats from combined data
      const newStats = {
        total: allApplications.length,
        active: allApplications.filter(a => ['applied', 'under_review', 'interview'].includes(a.status)).length,
        offers: allApplications.filter(a => ['offer_sent', 'offer_accepted'].includes(a.status)).length,
        hired: allApplications.filter(a => a.status === 'hired' || a.status === 'placed').length
      }
      setStats(newStats)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [statusFilter, typeFilter, page])
  
  const handleAcceptOfferSuccess = () => {
    // Refresh applications to show updated status
    fetchApplications()
    setSelectedApplication(null)
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'applied', label: 'Applied' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer_sent', label: 'Offer Sent' },
    { value: 'offer_accepted', label: 'Offer Accepted' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
  ]

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/student/jobs')}
                    className="hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Jobs
                  </Button>
                </div>
                <h1 className="text-3xl font-bold mb-2">My Applications</h1>
                <p className="text-muted-foreground">
                  Track the status of your job applications and manage offers
                </p>
              </div>
            </div>

            {/* Stats Dashboard */}
            {!loading && applications.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Applications</p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                    </div>
                    <Briefcase className="h-10 w-10 text-blue-500 opacity-50" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Active</p>
                      <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats.active}</p>
                    </div>
                    <Clock className="h-10 w-10 text-yellow-500 opacity-50" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400 mb-1">Offers Received</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.offers}</p>
                    </div>
                    <Mail className="h-10 w-10 text-green-500 opacity-50" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Hired</p>
                      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.hired}</p>
                    </div>
                    <PartyPopper className="h-10 w-10 text-purple-500 opacity-50" />
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-2 flex-wrap">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={statusFilter === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setStatusFilter(option.value)
                      setPage(1)
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={typeFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setTypeFilter('')
                    setPage(1)
                  }}
                >
                  All Types
                </Button>
                <Button
                  variant={typeFilter === 'job' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setTypeFilter('job')
                    setPage(1)
                  }}
                >
                  Jobs
                </Button>
                <Button
                  variant={typeFilter === 'lia' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setTypeFilter('lia')
                    setPage(1)
                  }}
                >
                  LIA
                </Button>
              </div>
            </div>

            {/* Applications List */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
                <p className="text-muted-foreground">
                  Start applying to jobs to see them here
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
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
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </SidebarInset>
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <ApplicationDetails
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onAcceptOffer={fetchApplications}
        />
      )}
    </SidebarProvider>
  )
}
