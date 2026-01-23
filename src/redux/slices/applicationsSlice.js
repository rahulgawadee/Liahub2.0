import { createSelector, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'
import { addJobListing, createJobPosting } from './jobsSlice'

const formatDate = (value) => {
	if (!value) return new Date().toISOString().slice(0, 10)
	if (value instanceof Date) return value.toISOString().slice(0, 10)
	return String(value).slice(0, 10)
}

const ensureUniqueJob = (jobs, jobId, draft) => {
	const existing = jobs.find((job) => job.jobId === jobId)
	if (existing) return existing
	const placeholder = {
		jobId,
		jobTitle: draft?.jobTitle || 'New Posting',
		jobType: draft?.jobType || 'Job',
		company: draft?.company || 'Unknown Company',
		location: draft?.location || 'TBD',
		postedOn: formatDate(draft?.postedOn || new Date()),
		hiringManager: draft?.hiringManager || 'Unassigned',
		applicants: draft?.applicants ? [...draft.applicants] : [],
	}
	jobs.unshift(placeholder)
	return placeholder
}

const withHistory = (applicant, change) => {
	const historyEntry = {
		date: new Date().toISOString(),
		...change,
	}
	return {
		...applicant,
		history: Array.isArray(applicant.history)
			? [...applicant.history, historyEntry]
			: [historyEntry],
	}
}

// Transform backend job data to frontend format
const transformJobData = (job) => ({
	jobId: job._id || job.id,
	jobTitle: job.title,
	jobType: job.type,
	company: job.organization?.name || 'Unknown Company',
	location: job.location || 'TBD',
	postedOn: formatDate(job.createdAt),
	hiringManager: job.createdBy?.name || 'Unassigned',
	applicants: [], // Will be populated separately
})

// Transform backend application data to frontend format
const transformApplicationData = (app) => ({
	id: app._id || app.id,
	studentId: app.applicant?._id || app.applicant,
	studentName: app.applicant?.name?.first && app.applicant?.name?.last 
		? `${app.applicant.name.first} ${app.applicant.name.last}` 
		: app.applicant?.username || 'Unknown',
	institute: app.applicant?.organizationName || app.applicant?.organization?.name || 'Unknown Institute',
	status: app.status,
	stage: app.stage || 'Applied',
	submittedOn: formatDate(app.createdAt),
	profileScore: app.profileScore,
	notes: app.notes,
	resumeUrl: app.resumeUrl,
	history: app.timeline || [],
	offerLetter: app.offerLetter ? {
		sentOn: formatDate(app.offerLetter.sentOn),
		startDate: formatDate(app.offerLetter.startDate),
		compensation: app.offerLetter.compensation,
		note: app.offerLetter.note,
	} : undefined,
})

// Async thunks for API calls
export const fetchMyJobs = createAsyncThunk('applications/fetchMyJobs', async (filters = {}, { rejectWithValue, getState }) => {
	try {
		const state = getState()
		const user = state.auth.user
		
		// If user is from a company, filter by their organization
		const isCompany = user?.roles?.some(r => ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'].includes(r))
		const companyOrgId = user?.currentOrganization?._id || user?.currentOrganization
		
		const params = {
			...filters,
			// Companies: only show jobs for their organization
			...(isCompany && companyOrgId ? { organization: companyOrgId } : {}),
		}
		
		const { data } = await api.get('/jobs', { params })
		// Backend returns { items, total, page, pages }
		return data
	} catch (error) {
		return rejectWithValue(error.response?.data?.message || 'Failed to fetch jobs')
	}
})

export const fetchJobApplications = createAsyncThunk(
	'applications/fetchJobApplications',
	async (jobId, { rejectWithValue }) => {
		try {
			const { data } = await api.get(`/jobs/${jobId}/applications`)
			// Backend returns { items, total, page, pages, summary }
			return { jobId, ...data }
		} catch (error) {
			return rejectWithValue(error.response?.data?.message || 'Failed to fetch applications')
		}
	}
)

export const updateApplicationStatusAsync = createAsyncThunk(
	'applications/updateStatus',
	async ({ applicationId, status, stage, notes }, { rejectWithValue }) => {
		try {
			const { data } = await api.post(`/jobs/applications/${applicationId}/status`, {
				status,
				stage,
				notes,
			})
			return data
		} catch (error) {
			return rejectWithValue(error.response?.data?.message || 'Failed to update status')
		}
	}
)

export const sendOfferAsync = createAsyncThunk(
	'applications/sendOffer',
	async ({ applicationId, offer }, { rejectWithValue }) => {
		try {
			console.log('Sending to API - applicationId:', applicationId, 'offer:', offer)
			const { data } = await api.post(`/jobs/applications/${applicationId}/offer`, {
				startDate: offer.startDate,
				compensation: offer.compensation,
				note: offer.note,
				pdfUrl: offer.pdfUrl,
			})
			return data
		} catch (error) {
			console.error('API Error:', error.response?.data)
			const errorMessage = error.response?.data?.message || 'Failed to send offer'
			const validationErrors = error.response?.data?.errors
			if (validationErrors) {
				console.error('Validation errors:', validationErrors)
				// Log each validation error with field and message
				validationErrors.forEach(err => {
					console.error(`Field "${err.path}" (${err.location}): ${err.msg}`)
				})
				return rejectWithValue(`${errorMessage}: ${validationErrors.map(e => `${e.path}: ${e.msg}`).join(', ')}`)
			}
			return rejectWithValue(errorMessage)
		}
	}
)

export const stopHiringAsync = createAsyncThunk(
	'applications/stopHiring',
	async ({ jobId }, { rejectWithValue }) => {
		try {
			const { data } = await api.post(`/jobs/${jobId}/stop-hiring`)
			return { jobId, ...data }
		} catch (error) {
			return rejectWithValue(error.response?.data?.message || 'Failed to stop hiring')
		}
	}
)

export const fetchSelectedCandidates = createAsyncThunk(
	'applications/fetchSelected',
	async ({ jobId }, { rejectWithValue }) => {
		try {
			const { data } = await api.get(`/jobs/${jobId}/selected`)
			return data
		} catch (error) {
			return rejectWithValue(error.response?.data?.message || 'Failed to fetch selected candidates')
		}
	}
)

const initialState = {
	jobs: [],
	activeJobId: null,
	loading: false,
	error: null,
}

const applicationsSlice = createSlice({
	name: 'applications',
	initialState,
	reducers: {
		setActiveJob(state, { payload }) {
			state.activeJobId = payload
		},
		addJobPosting(state, { payload }) {
			const jobId = payload?.jobId || payload?.id
			if (!jobId) return
			const nextJob = {
				jobId,
				jobTitle: payload.jobTitle || payload.title || 'Untitled Role',
				jobType: payload.jobType || payload.type || 'Job',
				company: payload.company || 'Unknown Company',
				location: payload.location || 'TBD',
				postedOn: formatDate(payload.postedOn || new Date()),
				hiringManager: payload.hiringManager || payload.contact || 'Unassigned',
				applicants: Array.isArray(payload.applicants) ? [...payload.applicants] : [],
			}
			const exists = state.jobs.some((job) => job.jobId === jobId)
			if (!exists) {
				state.jobs.unshift(nextJob)
			}
			state.activeJobId = jobId
		},
		addApplicant(state, { payload }) {
			const { jobId, applicant } = payload || {}
			if (!jobId || !applicant) return
			const job = ensureUniqueJob(state.jobs, jobId)
			job.applicants = [
				{
					...applicant,
					status: applicant.status || 'applied',
					submittedOn: formatDate(applicant.submittedOn || new Date()),
					history: applicant.history ? [...applicant.history] : [],
				},
				...(job.applicants || []),
			]
		},
		updateApplicantStatus(state, { payload }) {
			const { jobId, applicantId, status, stage, note } = payload || {}
			if (!jobId || !applicantId || !status) return
			const job = ensureUniqueJob(state.jobs, jobId)
			job.applicants = (job.applicants || []).map((applicant) => {
				if (applicant.id !== applicantId) return applicant
				const nextApplicant = {
					...applicant,
					status,
					stage: stage || applicant.stage,
				}
				return withHistory(nextApplicant, { status, stage, note })
			})
		},
		sendOffer(state, { payload }) {
			const { jobId, applicantId, offer } = payload || {}
			if (!jobId || !applicantId || !offer) return
			const job = ensureUniqueJob(state.jobs, jobId)
			job.applicants = (job.applicants || []).map((applicant) => {
				if (applicant.id !== applicantId) return applicant
				const offerLetter = {
					sentOn: formatDate(offer.sentOn || new Date()),
					startDate: formatDate(offer.startDate || offer.joiningDate || new Date()),
					compensation: offer.compensation || 'To be decided',
					note: offer.note || '',
				}
				const nextApplicant = {
					...applicant,
					status: 'offer-sent',
					stage: offer.stage || 'Offer',
					offerLetter,
				}
				return withHistory(nextApplicant, { status: 'offer-sent', stage: nextApplicant.stage, note: offerLetter.note })
			})
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch my jobs
			.addCase(fetchMyJobs.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchMyJobs.fulfilled, (state, { payload }) => {
				state.loading = false
				const { items = [] } = payload || {}
				state.jobs = items.map(transformJobData)
				if (!state.activeJobId && state.jobs.length > 0) {
					state.activeJobId = state.jobs[0].jobId
				}
			})
			.addCase(fetchMyJobs.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload
			})
			// Fetch job applications
			.addCase(fetchJobApplications.pending, (state) => {
				state.loading = true
			})
			.addCase(fetchJobApplications.fulfilled, (state, { payload }) => {
				state.loading = false
				const { jobId, items = [], summary } = payload || {}
				const job = state.jobs.find((j) => j.jobId === jobId)
				if (job) {
					job.applicants = items.map(transformApplicationData)
					if (summary) {
						job.summary = summary
					}
				}
			})
			.addCase(fetchJobApplications.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload
			})
			// Update application status
			.addCase(updateApplicationStatusAsync.fulfilled, (state, { payload }) => {
				const updatedApp = payload
				if (!updatedApp) return
				
				const job = state.jobs.find((j) => 
					j.applicants?.some((app) => app.id === (updatedApp._id || updatedApp.id))
				)
				if (job) {
					job.applicants = job.applicants.map((app) => 
						app.id === (updatedApp._id || updatedApp.id) 
							? transformApplicationData(updatedApp) 
							: app
					)
				}
			})
			// Send offer
			.addCase(sendOfferAsync.fulfilled, (state, { payload }) => {
				const updatedApp = payload
				if (!updatedApp) return
				
				const job = state.jobs.find((j) => 
					j.applicants?.some((app) => app.id === (updatedApp._id || updatedApp.id))
				)
				if (job) {
					job.applicants = job.applicants.map((app) => 
						app.id === (updatedApp._id || updatedApp.id) 
							? transformApplicationData(updatedApp) 
							: app
					)
				}
			})
			// Stop hiring
			.addCase(stopHiringAsync.fulfilled, (state, { payload }) => {
				const { jobId } = payload
				const job = state.jobs.find((j) => 
					j.jobId === jobId || j.postingId === jobId || j.id === jobId
				)
				if (job) {
					job.status = 'hiring_stopped'
					job.hiringStatus = 'Hiring Stopped'
				}
			})
			// Handle addJobListing from jobsSlice (legacy support)
			.addCase(addJobListing, (state, action) => {
				const payload = action.payload || {}
				const jobId = payload.id
				if (!jobId) return
				const exists = state.jobs.some((job) => job.jobId === jobId)
				if (exists) return
				state.jobs.unshift({
					jobId,
					jobTitle: payload.title || 'Untitled Role',
					jobType: payload.jobType || payload.type || 'Job',
					company: payload.company || 'Unknown Company',
					location: payload.location || 'TBD',
					postedOn: formatDate(payload.postedOn || new Date()),
					hiringManager: payload.hiringManager || 'Unassigned',
					applicants: [],
				})
				state.activeJobId = jobId
			})
			// Handle createJobPosting from jobsSlice (backend integration)
			.addCase(createJobPosting.fulfilled, (state, action) => {
				const job = action.payload
				const jobId = job.id || job._id
				if (!jobId) return
				const exists = state.jobs.some((j) => j.jobId === jobId)
				if (exists) return
				state.jobs.unshift({
					jobId,
					jobTitle: job.title || 'Untitled Role',
					jobType: job.type || job.jobType || 'Job',
					company: job.organization?.name || job.company || 'Unknown Company',
					location: job.location || 'TBD',
					postedOn: formatDate(job.postedOn || job.createdAt || new Date()),
					hiringManager: job.createdBy?.name || 'Unassigned',
					applicants: [],
				})
				state.activeJobId = jobId
			})
	},
})

export const { setActiveJob, addJobPosting, addApplicant, updateApplicantStatus, sendOffer } = applicationsSlice.actions

export default applicationsSlice.reducer

// Selectors
export const selectApplicationsState = (state) => state.applications
export const selectActiveJobId = (state) => state.applications.activeJobId
export const selectApplicationsLoading = (state) => state.applications.loading
export const selectApplicationsError = (state) => state.applications.error

const selectJobsCollection = createSelector([selectApplicationsState], (state) => state.jobs || [])

export const selectApplicationsByJob = createSelector(
	[selectJobsCollection, (_, jobId) => jobId],
	(jobs, jobId) => jobs.find((job) => job.jobId === jobId) || null,
)

export const selectActiveJobApplications = createSelector(
	[selectJobsCollection, selectActiveJobId],
	(jobs, activeJobId) => jobs.find((job) => job.jobId === activeJobId) || null,
)

const deriveJobSummary = (job) => {
	if (!job) return { total: 0, selected: 0, offers: 0, rejected: 0, inProcess: 0 }
	const total = job.applicants?.length || 0
	const selected = job.applicants?.filter((app) => app.status === 'selected' || app.status === 'accepted' || app.status === 'hired')?.length || 0
	const offers = job.applicants?.filter((app) => app.status === 'offer-sent' || app.offerLetter)?.length || 0
	const rejected = job.applicants?.filter((app) => app.status === 'rejected')?.length || 0
	const inProcess = total - selected - offers - rejected
	return { total, selected, offers, rejected, inProcess: Math.max(inProcess, 0) }
}

export const selectJobSummaries = createSelector([selectJobsCollection], (jobs) =>
	jobs.map((job) => ({
		jobId: job.jobId,
		jobTitle: job.jobTitle,
		jobType: job.jobType,
		company: job.company,
		location: job.location,
		postedOn: job.postedOn,
		summary: deriveJobSummary(job),
	})),
)

export const selectAggregateMetrics = createSelector([selectJobsCollection], (jobs) => {
	const aggregate = jobs.reduce(
		(acc, job) => {
			const summary = deriveJobSummary(job)
			acc.totalJobs += 1
			acc.totalApplicants += summary.total
			acc.selected += summary.selected
			acc.offers += summary.offers
			acc.rejected += summary.rejected
			return acc
		},
		{ totalJobs: 0, totalApplicants: 0, selected: 0, offers: 0, rejected: 0 },
	)
	return aggregate
})

