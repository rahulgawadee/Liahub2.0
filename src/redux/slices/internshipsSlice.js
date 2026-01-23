import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'

const transformPlacement = (placement) => ({
  id: placement.id || placement._id,
  title: placement.title,
  company: placement.organization?.name || placement.company || 'Unknown company',
  location: placement.location || 'Remote',
  stipend: placement.stipend || placement.salary || null,
  status: placement.status,
  type: placement.type || placement.jobType,
  description: placement.description,
  postedOn: placement.createdAt,
  openings: placement.openings ?? 1,
  applicants: placement.applicants || 0,
  tags: placement.tags || [],
  applied: placement.applied || false,
  wishlisted: placement.wishlisted || false,
  employmentType: placement.employmentType || 'Internship',
  locationType: placement.locationType || 'Hybrid',
  seniority: placement.seniority || 'Mid',
  labels: placement.labels || placement.highlights || [],
  duration: placement.duration,
  mentor: placement.mentor,
  applicationDeadline: placement.applicationDeadline,
  learningGoals: placement.learningGoals || placement.requirements || [],
  support: placement.support || placement.benefits || [],
  responsibilities: placement.responsibilities || [],
  requirements: placement.requirements || [],
  benefits: placement.benefits || [],
  hiringStatus: placement.hiringStatus,
  salary: placement.salary,
  avatarSeed: placement.organizationId || placement.company,
})

export const searchInternships = createAsyncThunk('internships/search', async (query = {}) => {
  const params = {
    search: query.keyword,
    type: query.filters?.jobType || 'lia',
    status: query.filters?.status || 'open',
  }
  if (query.location) params.location = query.location
  if (query.filters?.employmentType && query.filters.employmentType !== 'All Jobs') {
    params.employmentType = query.filters.employmentType
  }
  if (query.filters?.locationType) params.locationType = query.filters.locationType
  if (query.filters?.seniority) params.seniority = query.filters.seniority
  if (query.filters?.company) params.company = query.filters.company

  const { data } = await api.get('/jobs', { params })
  return data
})

const initialState = {
  mode: 'hero',
  loading: false,
  error: null,
  query: { keyword: '', location: '', filters: { jobType: 'lia' } },
  activeTab: 'All',
  list: [],
  selectedId: null,
  pagination: { total: 0, page: 1, pages: 1 },
}

const internshipsSlice = createSlice({
  name: 'internships',
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
    selectItem(state, { payload }) {
      state.selectedId = payload
    },
    toggleApplied(state, { payload }) {
      const item = state.list.find((placement) => placement.id === payload)
      if (item) item.applied = !item.applied
    },
    toggleWishlist(state, { payload }) {
      const item = state.list.find((placement) => placement.id === payload)
      if (item) item.wishlisted = !item.wishlisted
    },
    addInternshipListing(state, { payload }) {
      const entry = transformPlacement(payload)
      const exists = state.list.some((placement) => placement.id === entry.id)
      state.list = exists
        ? state.list.map((placement) => (placement.id === entry.id ? entry : placement))
        : [entry, ...state.list]
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
      .addCase(searchInternships.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchInternships.fulfilled, (state, { payload, meta }) => {
        state.loading = false
        const { items = [], total = 0, page = 1 } = payload || {}
        state.list = items.map(transformPlacement)
        state.pagination = { total, page, pages: payload?.pages || 1 }
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
      .addCase(searchInternships.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  },
})

export const {
  setQuery,
  setActiveTab,
  setMode,
  selectItem,
  toggleApplied,
  toggleWishlist,
  addInternshipListing,
  clearResults,
} =
  internshipsSlice.actions
export const selectInternships = (state) => state.internships
export default internshipsSlice.reducer
