import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '@/redux/store'
import { useParams, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { Textarea } from '@/Components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'
import { Dialog } from '@/Components/ui/dialog'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  Filter,
  ArrowLeft,
  StopCircle,
  Users
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getImageUrl } from '@/lib/imageUtils'

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

const getStatusColor = (status) => {
  const colors = {
    applied: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200',
    under_review: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400 border-yellow-200',
    interview: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-200',
    offer_sent: 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200',
    offer_accepted: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200',
    hired: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200',
    rejected: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200',
    withdrawn: 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-gray-200',
  }
  return colors[status] || colors.applied
}

const ApplicantCard = ({ application, onViewProfile, onUpdateStatus }) => {
  const applicant = application.applicant

  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-all">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-16 w-16 flex-shrink-0">
          <AvatarImage src={getImageUrl(applicant.media?.avatar)} alt={`${applicant.name?.first || ''} ${applicant.name?.last || ''}`} />
          <AvatarFallback />
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1">
            {applicant.name?.first} {applicant.name?.last}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">@{applicant.username}</p>
          
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {applicant.contact?.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {applicant.contact.email}
              </span>
            )}
            {applicant.studentProfile?.year && (
              <span className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                Year {applicant.studentProfile.year}
              </span>
            )}
          </div>

          {applicant.studentProfile?.skills && applicant.studentProfile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {applicant.studentProfile.skills.slice(0, 5).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={getStatusColor(application.status)}>
            {application.stage || application.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
          {application.profileScore && (
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {application.profileScore}% Match
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewProfile(application)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Profile
          </Button>
          <Button
            size="sm"
            onClick={() => onUpdateStatus(application)}
          >
            Update Status
          </Button>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Applied {formatDate(application.createdAt)}
      </div>
    </div>
  )
}

const UpdateStatusDialog = ({ application, onClose, onUpdate }) => {
  const [status, setStatus] = useState(application.status)
  const [stage, setStage] = useState(application.stage || '')
  const [notes, setNotes] = useState(application.notes || '')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await onUpdate(application.id, { status, stage, notes, comment })
      onClose()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-xl">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">Update Application Status</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
              required
            >
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="interview">Interview</option>
              <option value="offer_sent">Offer Sent</option>
              <option value="offer_accepted">Offer Accepted</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Stage (Optional)</label>
            <Input
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder="e.g., Technical Interview, Final Round"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Internal Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes for hiring team..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Comment for Timeline</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment about this status change..."
              rows={2}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Status'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const OfferLetterDialog = ({ application, onClose, onSend }) => {
  const [startDate, setStartDate] = useState('')
  const [compensation, setCompensation] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await onSend(application.id, { startDate, compensation, note })
      onClose()
    } catch (error) {
      console.error('Failed to send offer letter:', error)
      alert('Failed to send offer letter')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-xl">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">Send Offer Letter</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Start Date *</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Compensation *</label>
            <Input
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
              placeholder="e.g., $120,000 per year, SEK 16,000/month"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Additional Notes</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Welcome message or additional details..."
              rows={4}
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <p className="text-blue-600 dark:text-blue-400">
              Email will be sent to: <strong>{application.applicant.contact?.email || 'N/A'}</strong>
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Offer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function JobApplicationsManagement() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector(selectAuth)
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [summary, setSummary] = useState({ total: 0, offers: 0, hired: 0, closed: 0, inProcess: 0 })

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/jobs/${jobId}/applications`, {
        params: {
          status: statusFilter || undefined,
          limit: 100,
        }
      })

      if (response.data) {
        setApplications(response.data.items || [])
        setSummary(response.data.summary || {})
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobDetails = async () => {
    try {
      const response = await apiClient.get(`/jobs/${jobId}`)
      if (response.data) {
        setJob(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error)
    }
  }

  useEffect(() => {
    if (jobId) {
      fetchJobDetails()
      fetchApplications()
    }
  }, [jobId, statusFilter])

  const handleUpdateStatus = async (applicationId, data) => {
    try {
      await apiClient.post(`/jobs/applications/${applicationId}/status`, data)
      fetchApplications() // Refresh list
      alert('Status updated successfully')
    } catch (error) {
      throw error
    }
  }

  const handleSendOffer = async (applicationId, data) => {
    try {
      await apiClient.post(`/jobs/applications/${applicationId}/offer`, data)
      fetchApplications() // Refresh list
      alert('Offer letter sent successfully!')
    } catch (error) {
      throw error
    }
  }

  const handleStopHiring = async () => {
    if (!window.confirm('Are you sure you want to stop hiring for this position? All pending applicants will be notified.')) {
      return
    }

    try {
      await apiClient.post(`/jobs/${jobId}/stop-hiring`)
      alert('Hiring stopped successfully')
      navigate('/company/jobs')
    } catch (error) {
      console.error('Failed to stop hiring:', error)
      alert('Failed to stop hiring')
    }
  }

  const handleViewProfile = (application) => {
    navigate(`/view/profile/${application.applicant.id}`)
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{job?.title || 'Job Applications'}</h1>
                  <p className="text-muted-foreground">
                    Manage applications and track candidates
                  </p>
                </div>
              </div>
              
              <Button
                variant="destructive"
                onClick={handleStopHiring}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Hiring
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-card border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold">{summary.total}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">In Process</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.inProcess}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">Offers</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.offers}</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Hired</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.hired}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Closed</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{summary.closed}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'applied' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('applied')}
              >
                Applied
              </Button>
              <Button
                variant={statusFilter === 'under_review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('under_review')}
              >
                Under Review
              </Button>
              <Button
                variant={statusFilter === 'interview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('interview')}
              >
                Interview
              </Button>
              <Button
                variant={statusFilter === 'offer_sent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('offer_sent')}
              >
                Offer Sent
              </Button>
              <Button
                variant={statusFilter === 'hired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('hired')}
              >
                Hired
              </Button>
            </div>

            {/* Applications List */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
                <p className="text-muted-foreground">
                  Applications will appear here once candidates start applying
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map((application) => (
                  <ApplicantCard
                    key={application.id}
                    application={application}
                    onViewProfile={handleViewProfile}
                    onUpdateStatus={(app) => {
                      setSelectedApplication(app)
                      setShowUpdateDialog(true)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>

      {/* Dialogs */}
      {showUpdateDialog && selectedApplication && (
        <UpdateStatusDialog
          application={selectedApplication}
          onClose={() => {
            setShowUpdateDialog(false)
            setSelectedApplication(null)
          }}
          onUpdate={handleUpdateStatus}
        />
      )}

      {showOfferDialog && selectedApplication && (
        <OfferLetterDialog
          application={selectedApplication}
          onClose={() => {
            setShowOfferDialog(false)
            setSelectedApplication(null)
          }}
          onSend={handleSendOffer}
        />
      )}
    </SidebarProvider>
  )
}
