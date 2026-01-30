import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'
import { mapUserPreview } from '@/lib/mappers/users'

export const searchUsers = createAsyncThunk('users/search', async (query, { rejectWithValue }) => {
  try {
    const {
      keyword = '',
      entity = 'all',
      location = 'all',
      industry = 'all',
      domain = 'all',
      skills = [],
      page = 1,
      limit = 20,
    } = query || {}

    const params = {
      search: keyword?.trim() || undefined,
      entity: entity !== 'all' ? entity : undefined,
      location: location !== 'all' ? location : undefined,
      industry: industry !== 'all' ? industry : undefined,
      domain: domain !== 'all' ? domain : undefined,
      skills: Array.isArray(skills) && skills.length ? skills.join(',') : undefined,
      page,
      limit,
    }

    const { data } = await api.get('/users', { params })
    return data
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'Search failed'
    return rejectWithValue(message)
  }
})

const initialState = {
  query: { keyword: '', entity: 'all', location: 'all', industry: 'all', domain: 'all', skills: [] },
  loading: false,
  error: null,
  results: [],
  pagination: { page: 1, pages: 1, total: 0, limit: 20 },
  entityFilter: 'all',
  selectedUserId: null,
  entitiesById: {},
  profileLoading: {},
  profileErrors: {},
}

export const fetchUserProfile = createAsyncThunk('users/fetchProfile', async (userId, { rejectWithValue }) => {
  try {
    if (!userId) throw new Error('User id is required')
    const { data } = await api.get(`/users/${userId}`)
    return data
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to load profile')
  }
})

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsersQuery(state, { payload }) {
      state.query = { ...state.query, ...payload }
    },
    selectUser(state, { payload }) {
      state.selectedUserId = payload
    },
    cacheUser(state, { payload }) {
      // Cache a user object directly without fetching
      if (payload?.id) {
        state.entitiesById[payload.id] = {
          ...payload,
          raw: payload.raw || payload,
        }
        // Mark as not loading and clear any errors
        state.profileLoading[payload.id] = false
        state.profileErrors[payload.id] = null
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(searchUsers.pending, (state) => {
      state.loading = true
      state.error = null
    })
      .addCase(searchUsers.fulfilled, (state, { payload }) => {
        state.loading = false
        state.error = null
        const mappedResults = Array.isArray(payload?.items) ? payload.items.map(mapUserPreview).filter(Boolean) : []
        state.results = mappedResults
        mappedResults.forEach((user) => {
          if (user?.id) state.entitiesById[user.id] = user
        })
        state.pagination = {
          page: payload?.page || 1,
          pages: payload?.pages || 1,
          total: payload?.total || 0,
          limit: payload?.limit || state.pagination.limit,
        }
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error?.message || 'Search failed'
        state.results = []
      })
      .addCase(fetchUserProfile.pending, (state, action) => {
        const userId = action.meta?.arg
        if (!userId) return
        state.profileLoading[userId] = true
        state.profileErrors[userId] = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, { payload, meta }) => {
        const userId = meta?.arg
        if (userId) state.profileLoading[userId] = false
        const profileData = payload?.profile || payload
        if (!profileData) {
          if (userId) state.profileErrors[userId] = 'Profile not found'
          return
        }
        const preview = mapUserPreview(profileData)
        if (preview?.id) {
          const userData = {
            ...preview,
            followers: (payload.followers || []).map(mapUserPreview).filter(Boolean),
            following: (payload.following || []).map(mapUserPreview).filter(Boolean),
            relation: payload.relation || null,
            raw: profileData,
          }
          // Store under both the preview ID and requested userId to ensure lookup works
          state.entitiesById[preview.id] = userData
          if (userId && userId !== preview.id) {
            state.entitiesById[userId] = userData
          }
          state.profileErrors[preview.id] = null
          state.profileErrors[userId] = null
        } else if (userId) {
           state.profileErrors[userId] = 'Failed to map profile'
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        const userId = action.meta?.arg
        if (!userId) return
        state.profileLoading[userId] = false
        state.profileErrors[userId] = action.payload || action.error?.message || 'Failed to load profile'
      })
  },
})

export const { setUsersQuery, selectUser, cacheUser } = usersSlice.actions
export default usersSlice.reducer
