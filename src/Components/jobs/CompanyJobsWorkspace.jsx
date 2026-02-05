import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import Badge from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import {
  selectJobSummaries,
  selectActiveJobId,
  selectApplicationsByJob,
  setActiveJob,
  updateApplicantStatus,
  sendOffer,
  fetchMyJobs,
  fetchJobApplications,
  updateApplicationStatusAsync,
  sendOfferAsync,
} from '@/redux/slices/applicationsSlice'
import { createJobPosting } from '@/redux/slices/jobsSlice'
import { selectAuth } from '@/redux/store'
import OfferLetterDialog from '@/Components/shared/OfferLetterDialog'
import CreatePostingDialog from './CreatePostingDialog'
import SuccessModal from './SuccessModal'
import { Users, BadgeCheck, FileText, Filter, Inbox } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

const StatusBadge = ({ status }) => {
  const toneMap = {
    applied: 'warning',
    'in-review': 'accent',
    interview: 'accent',
    selected: 'success',
    accepted: 'success',
    'offer-sent': 'success', // Show as success (green) for selected
    'offer_sent': 'success', // Both formats
    rejected: 'danger',
  }
  
  // Display "Selected" for offer_sent status
  const displayText = status === 'offer_sent' || status === 'offer-sent' ? 'Selected' : status.replace(/-|_/g, ' ')
  
  return <Badge tone={toneMap[status] || 'default'}>{displayText}</Badge>
}

const SummaryCard = ({ icon: Icon, title, value, hint, isDark }) => (
  <Card className={isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-gray-200'}>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{title}</CardTitle>
      {Icon ? <Icon className={`h-5 w-5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} /> : null}
    </CardHeader>
    <CardContent>
      <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{value}</p>
      {hint ? <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{hint}</p> : null}
    </CardContent>
  </Card>
)

const ApplicantActions = ({ applicant, onAccept, onReject, onOffer, loading }) => {
  const isSelected = applicant.status === 'selected'
  const isRejected = applicant.status === 'rejected'
  const isOfferSent = applicant.status === 'offer_sent'
  const isOfferAccepted = applicant.status === 'offer_accepted'

  if (isOfferAccepted) {
    return (
      <Badge className="bg-green-600 text-white">
        ✓ Offer Accepted
      </Badge>
    )
  }

  if (isOfferSent) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-blue-600 text-white">
          ✉️ Offer Sent
        </Badge>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onOffer}
          disabled={loading}
          className="h-8 w-8 p-0 hover:bg-slate-800"
          title="Edit offer letter"
        >
          <Pencil className="h-4 w-4 text-blue-400" />
        </Button>
      </div>
    )
  }

  if (isRejected) {
    return (
      <Badge className="bg-red-600 text-white">
        ✗ Rejected
      </Badge>
    )
  }

  if (isSelected) {
    return (
      <div className="flex gap-2">
        <Badge className="bg-green-600 text-white">
          ✓ Selected
        </Badge>
        <Button
          type="button"
          size="sm"
          onClick={onOffer}
          disabled={loading}
          className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
        >
          Send Offer
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button 
        type="button" 
        size="sm" 
        onClick={onAccept} 
        disabled={loading}
        className="h-8 px-3 bg-green-600 hover:bg-green-700"
      >
        {loading ? 'Accepting...' : 'Accept'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-900/20"
        onClick={onReject}
        disabled={loading}
      >
        {loading ? 'Rejecting...' : 'Reject'}
      </Button>
    </div>
  )
}

const defaultCreatePayloadBuilder = (data, user) => {
  const id = `job-${Date.now()}`
  return {
    actionPayload: {
      id,
      title: data.title,
      company: data.company || user?.organizationName || user?.name || 'Unknown Company',
      location: data.location,
      jobType: data.jobType,
      type: data.jobType,
      employmentType: data.employmentType,
      locationType: data.locationType,
      seniority: data.seniority,
      // Only include salary for regular Jobs, not for LIA
      ...(data.jobType !== 'LIA' && { salary: data.compensation }),
      // Include LIA-specific fields
      ...(data.jobType === 'LIA' && { 
        duration: data.duration,
        mentor: data.mentor,
        supervisor: data.supervisor 
      }),
      description: data.description,
      tags: [],
    },
    nextActiveId: id,
    additionalActions: [],
  }
}

export default function CompanyJobsWorkspace({
  title = 'Hiring workspace',
  description = 'Review applications, take action on candidates, and manage postings without leaving this screen.',
  summariesSelector = selectJobSummaries,
  activeSelector = selectActiveJobId,
  entrySelector = selectApplicationsByJob,
  setActiveAction = setActiveJob,
  updateStatusAction = updateApplicantStatus,
  offerAction = sendOffer,
  createAction = createJobPosting,
  fetchApplicationsAction = null, // For refreshing applications after actions
  createPayloadBuilder = null,
  jobTypeFilter = null,
  idKey = 'jobId',
  entryTitleKey = 'jobTitle',
  defaultCompanyFallback = 'Unknown Company',
  postingTypes,
  defaultJobType = 'Job',
} = {}) {
  const dispatch = useDispatch()
  const { isDark } = useTheme()
  const { user } = useSelector(selectAuth)
  const summaries = useSelector(summariesSelector)
  
  // Log summaries when they change
  React.useEffect(() => {
    console.log(`📊 ${jobTypeFilter || 'All'} postings in Redux state:`, summaries.length)
    console.log('📊 Posting IDs:', summaries.map(s => s[idKey]))
  }, [summaries, jobTypeFilter, idKey])
  
  const filteredSummaries = React.useMemo(
    () => (jobTypeFilter ? summaries.filter((summary) => summary.jobType === jobTypeFilter) : summaries),
    [summaries, jobTypeFilter],
  )
  const activeId = useSelector(activeSelector)
  const activeEntry = useSelector((state) => (activeId ? entrySelector(state, activeId) : null))
  const [search, setSearch] = React.useState('')
  const [offerContext, setOfferContext] = React.useState({ open: false, applicant: null })
  const [createOpen, setCreateOpen] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState({}) // Track loading per applicant
  const [successModal, setSuccessModal] = React.useState({ 
    open: false, 
    isLoading: false,
    title: '', 
    message: '',
    candidateName: '' 
  })

  // Fetch jobs from backend once auth user is available
  React.useEffect(() => {
    if (!user) return
    dispatch(fetchMyJobs())
  }, [dispatch, user])

  // Fetch applications when active job/lia changes
  React.useEffect(() => {
    if (activeId) {
      const fetchAction = fetchApplicationsAction || fetchJobApplications
      dispatch(fetchAction(activeId))
    }
  }, [activeId, dispatch, fetchApplicationsAction])

  React.useEffect(() => {
    if (!filteredSummaries.length) return
    if (!activeId || !filteredSummaries.some((summary) => summary[idKey] === activeId)) {
      dispatch(setActiveAction(filteredSummaries[0][idKey]))
    }
  }, [activeId, filteredSummaries, dispatch, setActiveAction, idKey])

  const applicants = React.useMemo(() => {
    if (!activeEntry) return []
    const list = activeEntry.applicants || []
    if (!search.trim()) return list
    const term = search.trim().toLowerCase()
    return list.filter((app) =>
      [app.studentName, app.institute, app.status].some((value) =>
        value?.toString().toLowerCase().includes(term),
      ),
    )
  }, [activeEntry, search])

  const newApplications = React.useMemo(() => {
    if (!activeEntry) return []
    return (activeEntry.applicants || []).filter((app) => ['applied', 'in-review'].includes(app.status))
  }, [activeEntry])

  const selectedCount = React.useMemo(() => {
    if (!activeEntry) return 0
    return (activeEntry.applicants || []).filter((app) => 
      ['selected', 'accepted', 'offer_sent', 'offer-sent', 'offer_accepted'].includes(app.status)
    ).length
  }, [activeEntry])

  const handleStatusChange = async (applicant, status) => {
    if (!activeEntry) return
    const entryId = activeEntry.jobId || activeEntry.postingId || activeEntry[idKey]
    if (!entryId) return
    
    // Set loading for this specific applicant
    setActionLoading(prev => ({ ...prev, [applicant.id]: true }))
    
    try {
      // Use the passed updateStatusAction (works for both Jobs and LIAs)
      const updateAction = updateStatusAction || updateApplicationStatusAsync
      
      await dispatch(
        updateAction({
          liaId: entryId, // For LIAs
          jobId: entryId, // For Jobs
          applicationId: applicant.id,
          status,
          stage: status === 'selected' ? 'Selected' : status === 'rejected' ? 'Rejected' : 'Review',
          notes: '',
        }),
      ).unwrap()
      
      // Show success message
      toast.success(
        status === 'selected' 
          ? '✓ Applicant accepted successfully!' 
          : '✗ Applicant rejected'
      )
      
      // Refresh applications to get updated data
      const fetchAction = fetchApplicationsAction || fetchJobApplications
      dispatch(fetchAction(entryId))
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error(error || 'Failed to update status')
    } finally {
      setActionLoading(prev => ({ ...prev, [applicant.id]: false }))
    }
  }

  const handleOfferSubmit = async (offerPayload) => {
    if (!activeEntry || !offerContext.applicant) return
    const entryId = activeEntry.jobId || activeEntry.postingId || activeEntry[idKey]
    if (!entryId) return
    
    const isEditing = offerContext.applicant?.offerLetter && offerContext.applicant?.status === 'offer_sent'
    const applicantName = offerContext.applicant?.studentName || 'candidate'
    console.log('Sending offer with payload:', offerPayload)
    
    // Close offer dialog and show loading modal
    setOfferContext({ open: false, applicant: null })
    setSuccessModal({ 
      open: true, 
      isLoading: true,
      title: '',
      message: '',
      candidateName: applicantName
    })
    
    try {
      // Use the passed offerAction (works for both Jobs and LIAs)
      const sendOfferAction = offerAction || sendOfferAsync
      
      await dispatch(
        sendOfferAction({
          liaId: entryId, // For LIAs
          jobId: entryId, // For Jobs  
          applicationId: offerContext.applicant.id,
          offerLetter: offerPayload, // For LIAs
          offer: offerPayload, // For Jobs
        }),
      ).unwrap()
      
      // Show success state
      setSuccessModal({ 
        open: true, 
        isLoading: false,
        title: isEditing ? 'Offer Letter Updated!' : 'Offer Letter Sent!',
        message: isEditing 
          ? `Updated offer letter has been sent to ${applicantName}`
          : `Offer letter has been sent to ${applicantName}`,
        candidateName: applicantName
      })
      
      // Refresh applications
      const fetchAction = fetchApplicationsAction || fetchJobApplications
      dispatch(fetchAction(entryId))
    } catch (error) {
      console.error('Failed to send offer:', error)
      console.error('Full error details:', JSON.stringify(error, null, 2))
      toast.error(error || 'Failed to send offer')
      // Close loading modal on error
      setSuccessModal({ open: false, isLoading: false, title: '', message: '', candidateName: '' })
    }
  }

  const openOfferDialog = (applicant) => {
    setOfferContext({ open: true, applicant })
  }

  const handleCreatePosting = async (data) => {
    try {
      // If custom payload builder exists, use it (legacy support)
      if (createPayloadBuilder) {
        const { actionPayload, nextActiveId, additionalActions } = createPayloadBuilder(data, user) || {}
        if (!actionPayload) return
        dispatch(createAction(actionPayload))
        if (Array.isArray(additionalActions)) {
          additionalActions.forEach((item) => {
            if (!item) return
            const { actionCreator, payload } = item
            if (typeof actionCreator === 'function') {
              dispatch(actionCreator(payload))
            } else if (payload) {
              dispatch(payload)
            }
          })
        }
        if (nextActiveId) {
          dispatch(setActiveAction(nextActiveId))
        }
      } else {
        // Use the new async thunk that saves to backend
        console.log('Creating posting with data:', data)
        const result = await dispatch(createAction(data)).unwrap()
        // The job is automatically added to both slices via extraReducers
        console.log('Job created successfully:', result)
        console.log('New posting should appear in workspace now')
      }
      setCreateOpen(false)
    } catch (error) {
      console.error('Failed to create job posting:', error)
      console.error('Error response:', error.response?.data)
      alert(`Failed to create job posting: ${error.response?.data?.message || error.message}\n\nErrors: ${JSON.stringify(error.response?.data?.errors, null, 2)}`)
    }
  }

  const activeTitle = activeEntry?.[entryTitleKey] || activeEntry?.title || 'Select a posting'
  const activeCompany = activeEntry?.company || defaultCompanyFallback
  const activeLocation = activeEntry?.location || '—'

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset>
          <div className={`px-6 py-6 space-y-6 ${isDark ? 'text-white' : 'text-black'}`}>
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{description}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateOpen(true)}
                  style={{
                    backgroundColor: isDark ? 'transparent' : 'black',
                    color: 'white',
                    borderColor: isDark ? '' : 'black'
                  }}
                  className="hover:opacity-80"
                >
                  Add new posting
                </Button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard icon={Users} title="Applicants" value={activeEntry?.applicants?.length || 0} isDark={isDark} />
              <SummaryCard icon={Inbox} title="New" value={newApplications.length} hint="Awaiting review" isDark={isDark} />
              <SummaryCard icon={BadgeCheck} title="Selected" value={selectedCount} isDark={isDark} />
              <SummaryCard icon={FileText} title="Offers sent" value={(activeEntry?.applicants || []).filter((app) => app.status === 'offer-sent').length} isDark={isDark} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className={`lg:col-span-1 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>All postings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredSummaries.length === 0 ? (
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Create your first posting to start tracking applications.</p>
                  ) : (
                    filteredSummaries.map((job) => (
                      <button
                        key={job.jobId}
                        type="button"
                        onClick={() => dispatch(setActiveAction(job.jobId))}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                          job.jobId === activeId
                            ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                            : isDark
                              ? 'border-slate-800 bg-slate-950/70 hover:border-blue-500/40 hover:bg-slate-900'
                              : 'border-gray-200 bg-white hover:border-blue-500/40 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{job.jobTitle}</p>
                            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{job.company}</p>
                            <p className={`text-[11px] mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{job.jobType} • {job.location}</p>
                          </div>
                          <Badge tone="accent">{job.summary.total}</Badge>
                        </div>
                        <div className={`mt-3 grid grid-cols-3 gap-2 text-[11px] ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          <span>Selected: {job.summary.selected}</span>
                          <span>Offers: {job.summary.offers}</span>
                          <span>Pending: {job.summary.inProcess}</span>
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className={`lg:col-span-2 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <CardTitle className={`text-base ${isDark ? 'text-white/90' : 'text-black'}`}>{activeEntry ? activeTitle : 'Select a posting'}</CardTitle>
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        {activeEntry ? `${activeCompany} • ${activeLocation}` : 'Choose a posting to review applicants'}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 rounded-full border px-4 py-2 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'}`}>
                      <Filter className={`h-4 w-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                      <Input
                        placeholder="Search applicants"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className={`h-8 bg-transparent border-0 focus-visible:ring-0 ${isDark ? 'text-white' : 'text-black'}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeEntry ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-sm">
                        <thead className={`text-xs uppercase ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          <tr className={`text-left border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                            <th className="py-3 pr-4">Candidate</th>
                            <th className="py-3 pr-4">Institute</th>
                            <th className="py-3 pr-4">Status</th>
                            <th className="py-3 pr-4">Score</th>
                            <th className="py-3 pr-4">Updated</th>
                            <th className="py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {applicants.length === 0 ? (
                            <tr>
                              <td colSpan={6} className={`py-6 text-center ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                No applicants match the current filters.
                              </td>
                            </tr>
                          ) : (
                            applicants.map((applicant) => (
                              <tr key={applicant.id} className={`border-b ${isDark ? 'border-slate-900/60 hover:bg-slate-900/60' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <td className="py-3 pr-4">
                                  <div>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{applicant.studentName}</p>
                                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Submitted {applicant.submittedOn}</p>
                                  </div>
                                </td>
                                <td className={`py-3 pr-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{applicant.institute || '—'}</td>
                                <td className="py-3 pr-4">
                                  <StatusBadge status={applicant.status} />
                                </td>
                                <td className={`py-3 pr-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{applicant.profileScore ?? '—'}</td>
                                <td className={`py-3 pr-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{applicant.stage || '—'}</td>
                                <td className="py-3">
                                  <ApplicantActions
                                    applicant={applicant}
                                    onAccept={() => handleStatusChange(applicant, 'selected')}
                                    onReject={() => handleStatusChange(applicant, 'rejected')}
                                    onOffer={() => openOfferDialog(applicant)}
                                    loading={actionLoading[applicant.id]}
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Select a posting to review candidates.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>

      <OfferLetterDialog
        open={offerContext.open}
        applicant={offerContext.applicant}
        onClose={() => setOfferContext({ open: false, applicant: null })}
        onSubmit={handleOfferSubmit}
        type={jobTypeFilter === 'LIA' ? 'lia' : 'job'}
      />
      
      {/* Success/Loading Modal */}
      <SuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, isLoading: false, title: '', message: '', candidateName: '' })}
        title={successModal.title}
        message={successModal.message}
        isLoading={successModal.isLoading}
        candidateName={successModal.candidateName}
      />
      
      <CreatePostingDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreatePosting}
        defaultCompany={user?.organizationName || user?.company || user?.name}
        postingTypes={postingTypes}
        defaultJobType={defaultJobType}
      />
    </SidebarProvider>
  )
}
