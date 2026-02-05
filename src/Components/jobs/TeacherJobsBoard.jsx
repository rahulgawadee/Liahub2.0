import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import CreatePostingDialog from './CreatePostingDialog'
import { Badge } from '@/Components/ui/badge'
import { Users, CheckCircle2, Briefcase, FileSpreadsheet, Activity } from 'lucide-react'
import {
  selectJobSummaries,
  selectApplicationsByJob,
  selectActiveJobId,
  setActiveJob,
  fetchMyJobs,
  fetchJobApplications,
} from '@/redux/slices/applicationsSlice'
import { selectAuth } from '@/redux/store'
import { useTheme } from '@/hooks/useTheme'

const StatChip = ({ icon: Icon, label, value, tone = 'default', isDark }) => {
  const tones = isDark ? {
    default: 'bg-slate-800 border-slate-700 text-slate-200',
    accent: 'bg-blue-900/60 border-blue-500/30 text-blue-100',
    success: 'bg-emerald-900/60 border-emerald-500/30 text-emerald-100',
    warning: 'bg-amber-900/60 border-amber-500/30 text-amber-100',
    danger: 'bg-rose-900/60 border-rose-500/30 text-rose-100',
  } : {
    default: 'bg-gray-100 border-gray-300 text-gray-800',
    accent: 'bg-blue-50 border-blue-300 text-blue-800',
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
    danger: 'bg-rose-50 border-rose-300 text-rose-800',
  }
  const className = `rounded-2xl border px-4 py-3 flex items-center gap-3 ${tones[tone] ?? tones.default}`
  return (
    <div className={className}>
      {Icon ? <Icon className="h-5 w-5" /> : null}
      <div className="flex flex-col leading-tight">
        <span className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{label}</span>
        <span className="text-lg font-semibold">{value}</span>
      </div>
    </div>
  )
}

const statusTone = {
  applied: 'warning',
  'in-review': 'accent',
  interview: 'accent',
  selected: 'success',
  accepted: 'success',
  'offer-sent': 'accent',
  hired: 'success',
  rejected: 'danger',
}

const ApplicantRow = ({ applicant, isDark }) => {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{applicant.studentName}</p>
          <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{applicant.institute}</p>
        </div>
        <Badge tone={statusTone[applicant.status] || 'default'}>
          {applicant.status.replace(/-|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      </div>
      <div className={`grid grid-cols-2 gap-3 text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
        <div>
          <span className={`block ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Stage</span>
          <span>{applicant.stage || '—'}</span>
        </div>
        <div>
          <span className={`block ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Submitted</span>
          <span>{applicant.submittedOn || '—'}</span>
        </div>
      </div>
      {applicant.offerLetter && applicant.offerLetter.sentOn ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/20 p-3 text-xs text-emerald-100">
          <p className="font-semibold text-sm">✓ Offer Letter Sent</p>
          <p>Start date: {new Date(applicant.offerLetter.startDate).toLocaleDateString()}</p>
          {applicant.offerLetter.compensation && (
            <p>Compensation: {applicant.offerLetter.compensation}</p>
          )}
          {applicant.offerLetter.duration && (
            <p>Duration: {applicant.offerLetter.duration}</p>
          )}
          {applicant.offerLetter.acceptedOn && (
            <p className="mt-2 text-emerald-300 font-semibold">
              ✓ Accepted on {new Date(applicant.offerLetter.acceptedOn).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : null}
      {applicant.notes ? (
        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          <span className={isDark ? 'text-white/40' : 'text-gray-500'}>Note:</span> {applicant.notes}
        </p>
      ) : null}
      {/* Timeline */}
      {applicant.timeline && applicant.timeline.length > 0 && (
        <div className={`mt-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <p className={`text-xs mb-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Timeline</p>
          <div className="space-y-1">
            {applicant.timeline.slice(-3).reverse().map((event, idx) => (
              <div key={idx} className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                <span className={isDark ? 'text-white/80' : 'text-gray-800'}>
                  {event.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                {' - '}
                <span className={isDark ? 'text-white/40' : 'text-gray-500'}>
                  {new Date(event.createdAt).toLocaleDateString()}
                </span>
                {event.comment && (
                  <p className={`ml-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>→ {event.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TeacherJobsBoard({
  jobType = null,
  title = 'Student Application Overview',
  description = "Track how many students have applied, who's progressing, and which candidates are selected across all company postings.",
  summariesSelector = selectJobSummaries,
  jobSelector = selectApplicationsByJob,
  activeSelector = selectActiveJobId,
  setActiveAction = setActiveJob,
  listLabel = 'Job & LIA postings',
  fetchListAction = fetchMyJobs,
  fetchApplicationsAction = fetchJobApplications,
  // New props to enable creating postings from school/education manager UI
  createAction = null,
  createPayloadBuilder = null,
  postingTypes = ['Job', 'LIA'],
  defaultJobType = 'LIA',
  isSchool = false,
}) {
  const dispatch = useDispatch()
  const { isDark } = useTheme()
  const summaries = useSelector(summariesSelector)
  const { user } = useSelector(selectAuth)
  const activeJobId = useSelector(activeSelector)
  const activeJob = useSelector((state) => (activeJobId ? jobSelector(state, activeJobId) : null))

  // Fetch jobs/LIAs from backend once auth is available
  React.useEffect(() => {
    if (!user) return
    dispatch(fetchListAction())
  }, [dispatch, user, fetchListAction])

  // Create dialog state (for schools creating postings)
  const [createOpen, setCreateOpen] = React.useState(false)

  // Fetch applications when active job/LIA changes
  React.useEffect(() => {
    if (activeJobId && fetchApplicationsAction) {
      dispatch(fetchApplicationsAction(activeJobId))
    }
  }, [activeJobId, dispatch, fetchApplicationsAction])

  const filteredSummaries = React.useMemo(
    () => summaries.filter((job) => (jobType ? job.jobType === jobType : true)),
    [summaries, jobType],
  )

  const aggregate = React.useMemo(() => {
    return filteredSummaries.reduce(
      (acc, job) => {
        acc.totalJobs += 1
        acc.totalApplicants += job.summary.total
        acc.selected += job.summary.selected
        acc.offers += job.summary.offers
        acc.inProcess += job.summary.inProcess
        return acc
      },
      { totalJobs: 0, totalApplicants: 0, selected: 0, offers: 0, inProcess: 0 },
    )
  }, [filteredSummaries])

  React.useEffect(() => {
    if (!filteredSummaries.length) return
    if (!activeJobId || !filteredSummaries.some((job) => job.jobId === activeJobId)) {
      dispatch(setActiveAction(filteredSummaries[0].jobId))
    }
  }, [activeJobId, filteredSummaries, dispatch, setActiveAction])

  const selectedApplicants = React.useMemo(() => {
    if (!activeJob || (jobType && activeJob.jobType !== jobType)) return []
    return (activeJob.applicants || []).filter((app) => ['selected', 'accepted', 'offer-sent', 'hired'].includes(app.status))
  }, [activeJob, jobType])

  const pendingApplicants = React.useMemo(() => {
    if (!activeJob || (jobType && activeJob.jobType !== jobType)) return []
    return (activeJob.applicants || []).filter((app) => !['selected', 'accepted', 'offer-sent', 'hired', 'rejected'].includes(app.status))
  }, [activeJob, jobType])

  // Handle create posting (from school staff)
  const handleCreatePosting = async (data) => {
    if (!createAction) return
    try {
      // If school selects a companyId from dialog, the CreatePostingDialog will set companyId on data
      // Map companyId -> organization to match createLIAPosting thunk expectations
      const payload = { ...data }
      if (isSchool && payload.companyId) {
        payload.organization = payload.companyId
      }
      // Dispatch create action (could be async thunk)
      await dispatch(createAction(payload)).unwrap?.()
      // Refresh list after creation
      dispatch(fetchListAction())
      setCreateOpen(false)
    } catch (error) {
      console.error('Failed to create posting from school UI:', error)
      // Fallback: close dialog
      setCreateOpen(false)
      alert(error?.message || 'Failed to create posting')
    }
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset>
          <div className={`px-6 py-6 space-y-6 ${isDark ? 'text-white' : 'text-black'}`}>
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{description}</p>
            </header>

            {/* Header with create button for schools (and education managers) */}
            {createAction && isSchool && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  style={{
                    backgroundColor: isDark ? 'transparent' : 'black',
                    color: isDark ? 'white' : 'white',
                    borderColor: isDark ? 'rgb(51 65 85)' : 'black'
                  }}
                  className="rounded-md border px-3 py-2 hover:opacity-80 transition-opacity"
                >
                  Add new posting
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatChip icon={Briefcase} label="Active Postings" value={aggregate.totalJobs} tone="accent" isDark={isDark} />
              <StatChip icon={Users} label="Total Applicants" value={aggregate.totalApplicants} isDark={isDark} />
              <StatChip icon={CheckCircle2} label="Selected" value={aggregate.selected} tone="success" isDark={isDark} />
              <StatChip icon={Activity} label="Offers Sent" value={aggregate.offers} tone="warning" isDark={isDark} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className={`xl:col-span-1 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>{listLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredSummaries.length === 0 ? (
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>No job postings yet.</p>
                  ) : (
                    filteredSummaries.map((job) => {
                      const isActive = job.jobId === activeJobId
                      const summary = job.summary
                      return (
                        <button
                          key={job.jobId}
                          type="button"
                          onClick={() => dispatch(setActiveAction(job.jobId))}
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                            isActive
                              ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                              : isDark
                                ? 'border-slate-800 bg-slate-950/70 hover:border-blue-500/40 hover:bg-slate-900'
                                : 'border-gray-200 bg-white hover:border-blue-500/40 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{job.jobTitle}</p>
                              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{job.company}</p>
                              <p className={`text-[11px] mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{job.jobType} • Posted {job.postedOn}</p>
                            </div>
                            <Badge tone="accent">{summary.total} applicants</Badge>
                          </div>
                          <div className={`mt-3 grid grid-cols-3 gap-2 text-[11px] ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            <span>Selected: {summary.selected}</span>
                            <span>Offers: {summary.offers}</span>
                            <span>In pipeline: {summary.inProcess}</span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              <Card className={`xl:col-span-2 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-gray-200'}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>{activeJob && (!jobType || activeJob.jobType === jobType) ? activeJob.jobTitle : 'Select a posting'}</CardTitle>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {activeJob && (!jobType || activeJob.jobType === jobType)
                        ? `${activeJob.company} • ${activeJob.location}`
                        : 'Choose a posting to view details'}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Students in review</h3>
                      <Badge tone="warning">{pendingApplicants.length} in progress</Badge>
                    </div>
                    {pendingApplicants.length === 0 ? (
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>No students awaiting review right now.</p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {pendingApplicants.map((applicant) => (
                          <ApplicantRow key={applicant.id} applicant={applicant} isDark={isDark} />
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Selected students</h3>
                      <Badge tone="success">{selectedApplicants.length} selected</Badge>
                    </div>
                    {selectedApplicants.length === 0 ? (
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>No students selected yet.</p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {selectedApplicants.map((applicant) => (
                          <ApplicantRow key={applicant.id} applicant={applicant} isDark={isDark} />
                        ))}
                      </div>
                    )}
                  </section>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>

      {createAction && (
        <CreatePostingDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreatePosting}
          defaultCompany={user?.organizationName || user?.name}
          postingTypes={postingTypes}
          defaultJobType={defaultJobType}
          isSchool={isSchool}
        />
      )}
    </SidebarProvider>
  )
}
