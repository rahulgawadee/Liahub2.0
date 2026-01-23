import { createSelector, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '@/lib/apiClient'

const normaliseDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

// Async Thunks for Real API Calls

// Fetch all LIAs (for students browsing)
export const fetchMyLIAs = createAsyncThunk(
  'liaApplications/fetchMyLIAs',
  async (filters = {}, { getState, rejectWithValue }) => {
    try {
      const { accessToken, user } = getState().auth
      
      console.log('🎓 Fetching all LIAs for browsing...')
      
      // If user is from a company, filter by their organization
      const isCompany = user?.roles?.some(r => ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'].includes(r))
      const companyOrgId = user?.currentOrganization?._id || user?.currentOrganization
      
      const params = {
        ...filters,
        // Companies: only show LIAs for their organization
        ...(isCompany && companyOrgId ? { organization: companyOrgId } : {}),
      }
      
      const response = await apiClient.get('/lias', {
        params,
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      
      console.log('🎓 LIAs fetched:', response.data.items?.length || 0, 'LIAs')
      console.log('🎓 Sample LIA:', response.data.items?.[0])
      
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch LIAs')
    }
  }
)

export const fetchCompanyLIAApplications = createAsyncThunk(
  'liaApplications/fetchCompanyApplications',
  async (_, { getState }) => {
    const { accessToken } = getState().auth
    console.log('🏢 Fetching company LIA applications...')
    const response = await apiClient.get('/lias/company/applications', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    console.log('🏢 Company LIAs fetched:', response.data.items?.length || 0, 'postings')
    return response.data
  }
)

export const fetchSchoolLIAApplications = createAsyncThunk(
  'liaApplications/fetchSchoolApplications',
  async (_, { getState }) => {
    const { accessToken } = getState().auth
    console.log('🏫 Fetching school LIA applications...')
    const response = await apiClient.get('/lias/school/applications', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    console.log('🏫 School LIAs fetched:', response.data.items?.length || 0, 'applications')
    return response.data
  }
)

// Student: Apply to a LIA
export const applyToLIA = createAsyncThunk(
  'liaApplications/applyToLIA',
  async ({ liaId, applicationData }, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth
      console.log('📝 Student applying to LIA:', liaId)
      const response = await apiClient.post(`/lias/${liaId}/apply`, applicationData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      console.log('✅ Application submitted successfully')
      return { liaId, application: response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply to LIA')
    }
  }
)

// Student: Fetch their own LIA applications
export const fetchMyLIAApplications = createAsyncThunk(
  'liaApplications/fetchMyApplications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth
      if (!accessToken) {
        console.warn('⚠️ No access token available')
        return { items: [] }
      }
      
      console.log('🎓 Fetching student\'s LIA applications...')
      const response = await apiClient.get('/lias/my/applications', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      console.log('🎓 Student applications fetched:', response.data.items?.length || 0)
      return response.data
    } catch (error) {
      console.error('❌ Error fetching LIA applications:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        data: error.response?.data
      })
      
      // If 422, return empty array instead of rejecting
      if (error.response?.status === 422) {
        console.warn('⚠️ 422 error - returning empty applications array')
        return { items: [] }
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch applications')
    }
  }
)

// Student: Accept offer
export const acceptLIAOffer = createAsyncThunk(
  'liaApplications/acceptOffer',
  async ({ liaId, applicationId }, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth
      console.log('✅ Student accepting offer for application:', applicationId)
      const response = await apiClient.post(`/lias/${liaId}/applications/${applicationId}/accept`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      return { liaId, applicationId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept offer')
    }
  }
)

// Student: Withdraw application
export const withdrawLIAApplication = createAsyncThunk(
  'liaApplications/withdrawApplication',
  async ({ liaId, applicationId }, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth
      console.log('❌ Student withdrawing application:', applicationId)
      const response = await apiClient.post(`/lias/${liaId}/applications/${applicationId}/withdraw`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      return { liaId, applicationId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to withdraw application')
    }
  }
)

export const updateLIAApplicationStatus = createAsyncThunk(
  'liaApplications/updateStatus',
  async ({ liaId, applicationId, status, stage }, { getState }) => {
    const { accessToken } = getState().auth
    const response = await apiClient.put(`/lias/${liaId}/applications/${applicationId}/status`, 
      { status, stage },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    return { liaId, applicationId, status, stage, ...response.data }
  }
)

export const sendLIAOfferLetter = createAsyncThunk(
  'liaApplications/sendOffer',
  async ({ liaId, applicationId, offerLetter }, { getState }) => {
    const { accessToken } = getState().auth
    const response = await apiClient.post(`/lias/${liaId}/applications/${applicationId}/offer`, 
      offerLetter,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    return { liaId, applicationId, offerLetter: response.data.offerLetter || offerLetter }
  }
)

export const createLIAPosting = createAsyncThunk(
  'liaApplications/createPosting',
  async (liaData, { getState }) => {
    const { accessToken } = getState().auth
    const { user } = getState().auth
    
    console.log('Creating LIA with data:', liaData)
    console.log('User object:', user)
    console.log('User organizationId:', user?.organizationId)
    console.log('User organization:', user?.organization)
    
    // Get organization ID - try multiple possible locations
    const organizationId = user?.organizationId || user?.organization?._id || user?.organization || liaData.organization
    
    if (!organizationId) {
      throw new Error('Organization ID not found. Please ensure you are logged in as a company user.')
    }
    
    console.log('Using organizationId:', organizationId)
    
    // Prepare payload for backend API
    const payload = {
      title: liaData.title,
      description: liaData.description || 'No description provided', // Default if empty
      organization: organizationId,
      location: liaData.location,
      locationType: liaData.locationType,
      duration: liaData.duration,
      mentor: liaData.mentor,
      supervisor: liaData.supervisor,
      learningGoals: liaData.learningGoals || [],
      support: liaData.support || [],
      requirements: liaData.requirements || [],
      responsibilities: liaData.responsibilities || [],
      openings: liaData.openings || 1,
      deadline: liaData.deadline,
      tags: liaData.tags || [],
    }
    
    console.log('Sending payload to backend:', payload)
    
    const response = await apiClient.post('/lias', payload, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    return response.data
  }
)

const initialState = {
  postings: [],
  myApplications: [], // Student's own LIA applications
  activeId: null,
  loading: false,
  error: null,
}

const liaApplicationsSlice = createSlice({
  name: 'liaApplications',
  initialState,
  reducers: {
    setActivePosting(state, { payload }) {
      state.activeId = payload
    },
    addLiaPosting(state, { payload }) {
      if (!payload?.postingId && !payload?.id) return
      const id = payload.postingId || payload.id
      const exists = state.postings.some((posting) => (posting.postingId || posting.id) === id)
      if (!exists) {
        state.postings = [
          {
            ...payload,
            postingId: id,
            postedOn: normaliseDate(payload.postedOn || new Date()),
            applicants: payload.applicants || payload.applications || [],
          },
          ...state.postings,
        ]
      }
      state.activeId = id
    },
    addLiaApplicant(state, { payload }) {
      const { postingId, applicant } = payload || {}
      if (!postingId || !applicant) return
      const posting = state.postings.find((p) => (p.postingId || p.id) === postingId)
      if (!posting) return
      const apps = posting.applicants || posting.applications || []
      posting.applicants = [
        {
          ...applicant,
          status: applicant.status || 'applied',
          submittedOn: normaliseDate(applicant.submittedOn || new Date()),
        },
        ...apps,
      ]
      if (posting.applications) {
        posting.applications = posting.applicants
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My LIAs (for students browsing)
      .addCase(fetchMyLIAs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyLIAs.fulfilled, (state, action) => {
        state.loading = false
        const items = action.payload.items || action.payload || []
        
        console.log('🎓 Fetched', items.length, 'LIAs from backend')
        
        // Store raw postings - PRESERVE backend's applied status!
        state.postings = items.map(posting => {
          // Normalize the posting data
          const normalized = {
            ...posting,
            // Ensure consistent ID field
            id: posting.id || posting._id,
            postingId: posting.id || posting._id,
            // Ensure organization structure
            organization: posting.organization || { name: posting.company },
            // Ensure arrays exist
            applicants: posting.applicants || posting.applications || [],
            learningGoals: posting.learningGoals || [],
            requirements: posting.requirements || [],
            responsibilities: posting.responsibilities || [],
            support: posting.support || [],
            tags: posting.tags || [],
            wishlisted: Array.isArray(posting.wishlisted) ? posting.wishlisted : [],
            // ✅ PRESERVE applied status from backend!
            applied: posting.applied || false,
            applicationStatus: posting.applicationStatus,
            appliedAt: posting.appliedAt,
          }
          
          return normalized
        })
        
        console.log('🎓 Postings stored in Redux state:', state.postings.length)
        console.log('🎓 LIAs with applied=true:', state.postings.filter(p => p.applied).length)
        
        if (state.postings.length > 0 && !state.activeId) {
          state.activeId = state.postings[0].postingId || state.postings[0].id
        }
      })
      .addCase(fetchMyLIAs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
      
      // Fetch Company Applications
      .addCase(fetchCompanyLIAApplications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCompanyLIAApplications.fulfilled, (state, action) => {
        state.loading = false
        const items = action.payload.items || action.payload || []
        state.postings = items.map(posting => ({
          ...posting,
          postingId: posting.id || posting._id,
          company: posting.organization?.name || posting.company,
          applicants: (posting.applications || []).map(app => ({
            ...app,
            id: app.id || app._id,
            studentName: app.applicant?.name || app.studentName,
            institute: app.applicant?.organization?.name || app.institute,
            submittedOn: normaliseDate(app.appliedAt || app.submittedOn || app.createdAt),
          })),
        }))
        if (state.postings.length > 0 && !state.activeId) {
          state.activeId = state.postings[0].postingId
        }
      })
      .addCase(fetchCompanyLIAApplications.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      
      // Fetch School Applications
      .addCase(fetchSchoolLIAApplications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSchoolLIAApplications.fulfilled, (state, action) => {
        state.loading = false
        const items = action.payload.items || action.payload || []
        console.log('📊 School LIA Applications received:', items.length, 'postings')
        console.log('📊 First posting:', items[0])
        state.postings = items.map(posting => ({
          ...posting,
          postingId: posting.id || posting._id || posting.postingId,
          company: posting.organization?.name || posting.company,
          applicants: (posting.applications || []).map(app => ({
            ...app,
            id: app.id || app._id,
            studentName: app.applicant?.name || app.studentName,
            institute: app.applicant?.organization?.name || app.institute,
            submittedOn: normaliseDate(app.appliedAt || app.submittedOn || app.createdAt),
          })),
        }))
        console.log('📊 Transformed postings:', state.postings.length)
        console.log('📊 First transformed:', state.postings[0])
        if (state.postings.length > 0 && !state.activeId) {
          state.activeId = state.postings[0].postingId
          console.log('📊 Set active ID:', state.activeId)
        }
      })
      .addCase(fetchSchoolLIAApplications.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      
      // Update Status
      .addCase(updateLIAApplicationStatus.fulfilled, (state, action) => {
        const { liaId, applicationId, status, stage } = action.payload
        const posting = state.postings.find(p => (p.id || p._id || p.postingId) === liaId)
        if (posting) {
          const apps = posting.applicants || posting.applications || []
          const app = apps.find(a => (a.id || a._id) === applicationId)
          if (app) {
            app.status = status
            if (stage) app.stage = stage
          }
        }
      })
      
      // Send Offer
      .addCase(sendLIAOfferLetter.fulfilled, (state, action) => {
        const { liaId, applicationId, offerLetter } = action.payload
        const posting = state.postings.find(p => (p.id || p._id || p.postingId) === liaId)
        if (posting) {
          const apps = posting.applicants || posting.applications || []
          const app = apps.find(a => (a.id || a._id) === applicationId)
          if (app) {
            app.status = 'offer-sent'
            app.offerLetter = {
              ...offerLetter,
              sentOn: normaliseDate(offerLetter.sentOn || new Date()),
              startDate: normaliseDate(offerLetter.startDate),
            }
          }
        }
      })
      
      // Create Posting
      .addCase(createLIAPosting.fulfilled, (state, action) => {
        console.log('createLIAPosting.fulfilled - Received:', action.payload)
        const posting = {
          ...action.payload,
          postingId: action.payload.id || action.payload._id,
          company: action.payload.organization?.name || action.payload.company,
          applicants: [],
          applications: [], // Ensure applications array exists
        }
        console.log('createLIAPosting.fulfilled - Adding posting:', posting)
        state.postings.unshift(posting)
        state.activeId = posting.postingId
        console.log('createLIAPosting.fulfilled - State now has', state.postings.length, 'postings')
      })
      
      // STUDENT ACTIONS
      
      // Apply to LIA
      .addCase(applyToLIA.pending, (state) => {
        state.loading = true
      })
      .addCase(applyToLIA.fulfilled, (state, action) => {
        state.loading = false
        const { liaId, application } = action.payload
        
        console.log('✅ Application successful for LIA ID:', liaId)
        console.log('📝 Application data:', application)
        
        // Mark the SPECIFIC LIA as applied in the postings list
        // Check against all possible ID fields to ensure exact match
        const posting = state.postings.find(p => {
          const postingId = p.id || p._id || p.postingId
          return postingId === liaId || 
                 p.id === liaId || 
                 p._id === liaId || 
                 p.postingId === liaId
        })
        
        if (posting) {
          console.log('✅ Found posting to mark as applied:', posting.title)
          posting.applied = true
          // Increment applicants count
          posting.applicants = (posting.applicants || 0) + 1
        } else {
          console.warn('⚠️ Could not find posting with ID:', liaId)
          console.log('Available posting IDs:', state.postings.map(p => ({
            id: p.id,
            _id: p._id,
            postingId: p.postingId,
            title: p.title
          })))
        }
        
        // Add to myApplications if not already there
        const existingApp = state.myApplications.find(app => 
          (app.id || app._id) === (application.id || application._id)
        )
        if (!existingApp) {
          console.log('✅ Adding application to myApplications')
          state.myApplications.unshift({
            ...application,
            id: application.id || application._id,
            lia: application.lia || liaId
          })
        }
      })
      .addCase(applyToLIA.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch My Applications
      .addCase(fetchMyLIAApplications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyLIAApplications.fulfilled, (state, action) => {
        state.loading = false
        const items = action.payload.items || action.payload || []
        console.log('📋 Fetched', items.length, 'applications')
        
        state.myApplications = items.map(app => {
          // Extract LIA ID - handle both populated and unpopulated
          const liaId = app.lia?._id || app.lia?.id || app.lia || app.liaId
          
          return {
            ...app,
            id: app.id || app._id,
            lia: app.lia, // Keep full LIA object if populated
            liaId: liaId, // Also store ID separately
            liaTitle: app.lia?.title || app.liaTitle,
            companyName: app.lia?.organization?.name || app.companyName,
            status: app.status || 'applied',
            appliedAt: app.appliedAt || app.createdAt,
            offerLetter: app.offerLetter,
          }
        })
        
        console.log('📋 Applications mapped:', state.myApplications.map(a => ({
          id: a.id,
          liaId: a.liaId,
          liaTitle: a.liaTitle
        })))
      })
      .addCase(fetchMyLIAApplications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        console.error('❌ Failed to fetch applications:', action.payload)
        // Keep existing applications on error instead of clearing them
        if (!state.myApplications || state.myApplications.length === 0) {
          state.myApplications = []
        }
      })
      
      // Accept Offer
      .addCase(acceptLIAOffer.fulfilled, (state, action) => {
        const { applicationId } = action.payload
        const app = state.myApplications.find(a => a.id === applicationId)
        if (app) {
          app.status = 'offer_accepted'
        }
      })
      
      // Withdraw Application
      .addCase(withdrawLIAApplication.fulfilled, (state, action) => {
        const { applicationId } = action.payload
        const app = state.myApplications.find(a => a.id === applicationId)
        if (app) {
          app.status = 'withdrawn'
        }
      })
  },
})

export const { setActivePosting, addLiaPosting, addLiaApplicant } = liaApplicationsSlice.actions

export default liaApplicationsSlice.reducer

export const selectLiaApplicationsState = (state) => state.liaApplications
export const selectActiveLiaId = (state) => state.liaApplications.activeId

export const selectLiaSummaries = createSelector([selectLiaApplicationsState], (state) => {
  console.log('🔍 selectLiaSummaries - Total postings:', state.postings.length)
  return state.postings.map((posting) => {
    // Ensure apps is always an array
    const apps = Array.isArray(posting.applicants) 
      ? posting.applicants 
      : Array.isArray(posting.applications) 
        ? posting.applications 
        : []
    console.log(`🔍 Posting "${posting.title}" has ${apps.length} applicants`)
    const total = apps.length
    const selected = apps.filter((applicant) =>
      ['selected', 'accepted', 'offer_accepted', 'placed', 'hired', 'finalised'].includes(applicant.status),
    ).length
    const offers = apps.filter((applicant) => applicant.status === 'offer-sent' || applicant.status === 'offer_sent' || applicant.offerLetter).length
    const rejected = apps.filter((applicant) => applicant.status === 'rejected').length
    const inProcess = Math.max(total - selected - offers - rejected, 0)

    // Return posting with both workspace format AND original student page format
    return {
      // Original posting data (for StudentLIAs)
      ...posting,
      
      // Workspace format (for CompanyJobsWorkspace)
      postingId: posting.postingId || posting.id || posting._id,
      jobId: posting.postingId || posting.id || posting._id,
      jobTitle: posting.title,
      jobType: posting.type || 'LIA',
      company: typeof posting.organization === 'object' 
        ? posting.organization?.name 
        : posting.company || posting.organization || 'Company',
      location: posting.location || 'Remote',
      postedOn: posting.postedOn 
        ? (typeof posting.postedOn === 'string' ? posting.postedOn : new Date(posting.postedOn).toLocaleDateString())
        : posting.createdAt 
          ? (typeof posting.createdAt === 'string' ? posting.createdAt : new Date(posting.createdAt).toLocaleDateString())
          : 'N/A',
      
      // Summary for workspace
      summary: {
        total,
        selected,
        offers,
        rejected,
        inProcess,
      },
    }
  })
})

export const selectActiveLiaPosting = createSelector(
  [selectLiaApplicationsState, selectActiveLiaId],
  (state, activeId) => state.postings.find((posting) => (posting.postingId || posting.id || posting._id) === activeId) || null,
)

export const selectLiaPostingById = createSelector(
  [selectLiaApplicationsState, (_, postingId) => postingId],
  (state, postingId) => {
    const posting = state.postings.find((p) => (p.postingId || p.id || p._id) === postingId)
    if (!posting) return null
    
    // Transform to match TeacherJobsBoard format
    return {
      ...posting,
      jobId: posting.postingId || posting.id || posting._id,
      jobTitle: posting.title,
      jobType: posting.type || 'LIA',
      company: typeof posting.organization === 'object' 
        ? posting.organization?.name 
        : posting.company || posting.organization || 'Company',
      location: posting.location || 'Remote',
      // Ensure applicants array exists (could be 'applicants' or 'applications')
      applicants: posting.applicants || posting.applications || [],
    }
  },
)

// Student application selectors
export const selectMyLIAApplications = (state) => state.liaApplications.myApplications || []

export const selectMyLIAApplicationById = createSelector(
  [selectMyLIAApplications, (_, applicationId) => applicationId],
  (applications, applicationId) => applications.find(app => app.id === applicationId) || null
)

export const selectLIAApplicationsByStatus = createSelector(
  [selectMyLIAApplications],
  (applications) => {
    return {
      all: applications,
      applied: applications.filter(app => app.status === 'applied'),
      inReview: applications.filter(app => app.status === 'under_review' || app.status === 'in-review'),
      interview: applications.filter(app => app.status === 'interview'),
      offerReceived: applications.filter(app => app.status === 'offer_sent' || app.status === 'offer-sent'),
      accepted: applications.filter(app => app.status === 'offer_accepted' || app.status === 'placed'),
      rejected: applications.filter(app => app.status === 'rejected'),
      withdrawn: applications.filter(app => app.status === 'withdrawn'),
    }
  }
)