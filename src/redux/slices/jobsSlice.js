import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'

const transformJob = (job) => ({
  id: job.id || job._id,
  title: job.title,
  company: job.organization?.name || job.company || 'Unknown company',
  location: job.location || 'Remote',
  salary: job.salary || null,
  status: job.status,
  type: job.type || job.jobType,
  deadline: job.deadline,
  description: job.description,
  openings: job.openings ?? 1,
  tags: job.tags || [],
  createdAt: job.createdAt,
  applicants: job.applicants || 0,
  applied: job.applied || false,
  wishlisted: job.wishlisted || false,
  employmentType: job.employmentType || job.type || job.jobType,
  locationType: job.locationType || 'Hybrid',
  seniority: job.seniority || 'Mid',
  labels: job.labels || job.highlights || [],
  responsibilities: job.responsibilities || [],
  requirements: job.requirements || [],
  benefits: job.benefits || [],
  hiringStatus: job.hiringStatus,
})

export const searchJobs = createAsyncThunk('jobs/search', async (query = {}) => {
  const params = {
    search: query.keyword,
    status: query.filters?.status,
    type: query.filters?.jobType || 'job',
    organization: query.filters?.organization,
  }
  if (query.location) params.location = query.location
  const { data } = await api.get('/jobs', { params })
  return data
})

export const applyToJob = createAsyncThunk('jobs/apply', async ({ jobId, resumeUrl, coverLetter, additionalInfo }, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState()
    const user = auth.user
    
    console.log('Applying to job:', { jobId, user })
    
    const payload = {
      coverLetter,
      resumeUrl: resumeUrl || undefined,
      metadata: {
        applicantName: user?.name?.first || user?.username,
        additionalInfo: additionalInfo || undefined,
      },
    }
    
    console.log('Apply payload:', payload)
    
    const { data } = await api.post(`/jobs/${jobId}/apply`, payload)
    return data
  } catch (error) {
    console.error('Apply error:', error.response?.data || error.message)
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to submit application')
  }
})

// Create job posting and save to backend
export const createJobPosting = createAsyncThunk('jobs/create', async (jobData, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState()
    const user = auth.user
    
    // Get the user's organization ID - check multiple possible fields
    const organizationId = user?.organization?.id || user?.organization?._id || user?.organization
    
    if (!organizationId) {
      console.error('User object:', user)
      return rejectWithValue('Organization ID is required to create a job posting. Please ensure you are logged in with a company account.')
    }
    
    // Map frontend form data to backend API format
    const payload = {
      title: jobData.title,
      description: jobData.description || '',
      organization: organizationId,
      type: (jobData.jobType || jobData.type || 'job').toLowerCase(),
      location: jobData.location || 'Remote',
      employmentType: jobData.employmentType || 'Full-time',
      locationType: jobData.locationType || 'Hybrid',
      seniority: jobData.seniority || 'Mid',
      salary: jobData.compensation || jobData.salary || '',
      openings: jobData.openings || 1,
      status: 'open',
      tags: jobData.tags || [],
      responsibilities: jobData.responsibilities || [],
      requirements: jobData.requirements || [],
      benefits: jobData.benefits || [],
    }
    
    // Add deadline if provided
    if (jobData.deadline) {
      payload.deadline = jobData.deadline
    }
    
    console.log('Creating job with payload:', payload)
    const { data } = await api.post('/jobs', payload)
    console.log('Job created successfully:', data)
    return data
  } catch (error) {
    console.error('Error creating job posting:', error)
    const message = error.response?.data?.message || error.message || 'Failed to create job posting'
    return rejectWithValue(message)
  }
})

// Toggle wishlist - save to backend
export const toggleWishlist = createAsyncThunk('jobs/toggleWishlist', async (jobId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/jobs/${jobId}/wishlist`)
    return { jobId, wishlisted: data.wishlisted }
  } catch (error) {
    console.error('Error toggling wishlist:', error)
    const message = error.response?.data?.message || error.message || 'Failed to update wishlist'
    return rejectWithValue(message)
  }
})

const initialState = {
  mode: 'hero',
  loading: false,
  error: null,
  query: { keyword: '', location: '', filters: { jobType: 'job' } },
  activeTab: 'Jobs',
  list: [],
  selectedId: null,
  pagination: { total: 0, page: 1, pages: 1 },
}

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setQuery(state, { payload }) {
      state.query = { ...state.query, ...payload }
    },
    setActiveTab(state, { payload }) {
      state.activeTab = payload
    },
    setMode(state, { payload }) {
      state.mode = payload
    },
    selectJob(state, { payload }) {
      state.selectedId = payload
    },
    toggleApplied(state, { payload }) {
      const job = state.list.find((item) => item.id === payload)
      if (job) job.applied = !job.applied
    },
    addJobListing(state, { payload }) {
      const entry = transformJob(payload)
      const exists = state.list.some((job) => job.id === entry.id)
      state.list = exists ? state.list.map((job) => (job.id === entry.id ? entry : job)) : [entry, ...state.list]
      state.selectedId = entry.id
      state.mode = 'results'
    },
    clearResults(state) {
      state.list = []
      state.selectedId = null
      state.mode = 'hero'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchJobs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchJobs.fulfilled, (state, { payload, meta }) => {
        state.loading = false
        const { items = [], total = 0, page = 1 } = payload || {}
        state.list = items.map(transformJob)
        state.pagination = {
          total,
          page,
          pages: payload?.pages || 1,
        }
        state.mode = state.list.length ? 'results' : 'hero'
        state.selectedId = state.list[0]?.id || null
        const incomingFilters = meta?.arg?.filters || {}
        state.query = {
          ...state.query,
          ...meta?.arg,
          filters: {
            ...state.query.filters,
            ...incomingFilters,
          },
        }
      })
      .addCase(searchJobs.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(applyToJob.fulfilled, (state, { meta }) => {
        const job = state.list.find((item) => item.id === meta.arg.jobId)
        if (job) {
          job.applied = true
          job.applicants = (job.applicants || 0) + 1
        }
      })
      .addCase(createJobPosting.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createJobPosting.fulfilled, (state, { payload }) => {
        state.loading = false
        const newJob = transformJob(payload)
        state.list = [newJob, ...state.list]
        state.selectedId = newJob.id
        state.mode = 'results'
      })
      .addCase(createJobPosting.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error?.message || 'Failed to create job posting'
        console.error('Job creation failed:', action.payload || action.error)
      })
      .addCase(toggleWishlist.fulfilled, (state, { payload }) => {
        const job = state.list.find((item) => item.id === payload.jobId)
        if (job) {
          job.wishlisted = payload.wishlisted
        }
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || 'Failed to update wishlist'
        console.error('Wishlist toggle failed:', action.payload || action.error)
      })
  },
})

export const {
  setQuery,
  setActiveTab,
  setMode,
  selectJob,
  toggleApplied,
  addJobListing,
  clearResults,
} = jobsSlice.actions

// Note: Async thunks (searchJobs, applyToJob, createJobPosting, toggleWishlist) 
// are already exported when created with createAsyncThunk above

export const selectJobs = (state) => state.jobs
export default jobsSlice.reducer
