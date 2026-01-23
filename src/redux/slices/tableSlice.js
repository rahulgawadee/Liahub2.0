import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'
import { SECTION_SEQUENCE, SECTION_KEYS } from '@/Components/table/sectionDefinitions'

const SECTION_KEY_ORDER = SECTION_SEQUENCE

export const fetchStudentDashboard = createAsyncThunk(
  'table/fetchStudentDashboard',
  async (forceRefresh = false, { rejectWithValue, getState }) => {
    try {
      // Check cache validity
      const state = getState()
      const { lastGlobalFetch } = state.studentDashboard || {}
      const now = Date.now()
      
      if (!forceRefresh && lastGlobalFetch && (now - lastGlobalFetch < CACHE_DURATION)) {
        // Return cached data (skip actual fetch)
        return { cached: true }
      }

      const { data } = await api.get('/dashboard/student')
      return { ...data, fetchTimestamp: now }
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to load dashboard'
      return rejectWithValue(message)
    }
  },
)

export const createSchoolRecord = createAsyncThunk(
  'table/createSchoolRecord',
  async ({ sectionKey, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/dashboard/school/records', payload)
      return data
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to create record'
      return rejectWithValue(message)
    }
  },
)

export const updateSchoolRecord = createAsyncThunk(
  'table/updateSchoolRecord',
  async ({ sectionKey, id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/dashboard/school/records/${id}`, payload)
      return data
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to update record'
      return rejectWithValue(message)
    }
  },
)

export const deleteSchoolRecord = createAsyncThunk(
  'table/deleteSchoolRecord',
  async ({ sectionKey, id }, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/dashboard/school/records/${id}`)
      return data
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to delete record'
      return rejectWithValue(message)
    }
  },
)

export const confirmStudentAssignment = createAsyncThunk(
  'table/confirmStudentAssignment',
  async ({ id }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/dashboard/company/assignments/${id}/confirm`)
      return data
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to confirm assignment'
      return rejectWithValue(message)
    }
  },
)

export const rejectStudentAssignment = createAsyncThunk(
  'table/rejectStudentAssignment',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/dashboard/company/assignments/${id}/reject`, { reason })
      return data
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to reject assignment'
      return rejectWithValue(message)
    }
  },
)

const createSectionState = () => ({
  data: [],
  status: 'idle',
  error: null,
  mutationStatus: 'idle',
  mutationError: null,
  pendingAssignments: [],
  lastFetched: null, // Timestamp for cache
  cacheValid: false,
})

const initialSections = SECTION_KEY_ORDER.reduce((acc, key) => {
  acc[key] = createSectionState()
  return acc
}, {})

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const initialState = {
  activeSection: SECTION_KEY_ORDER[0] || null,
  sections: initialSections,
  stats: {
    activePlacements: 0,
    unreadMessages: 0,
    alerts: 0,
  },
  notifications: [],
  status: 'idle',
  error: null,
  lastGlobalFetch: null, // Global cache timestamp
}

const tableSlice = createSlice({
  name: 'studentDashboard',
  initialState,
  reducers: {
    setActiveSection(state, { payload }) {
      if (SECTION_KEY_ORDER.includes(payload)) {
        state.activeSection = payload
      }
    },
    invalidateCache(state) {
      state.lastGlobalFetch = null
      SECTION_KEY_ORDER.forEach((key) => {
        const section = state.sections[key]
        if (section) {
          section.lastFetched = null
          section.cacheValid = false
        }
      })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentDashboard.pending, (state) => {
        state.status = 'loading'
        state.error = null
        SECTION_KEY_ORDER.forEach((key) => {
          const section = state.sections[key]
          if (!section) return
          section.status = 'loading'
          section.error = null
          section.mutationStatus = 'idle'
          section.mutationError = null
          section.pendingAssignments = []
        })
      })
      .addCase(fetchStudentDashboard.fulfilled, (state, { payload }) => {
        // If cached, skip update
        if (payload.cached) {
          state.status = 'succeeded'
          return
        }

        state.status = 'succeeded'
        state.lastGlobalFetch = payload.fetchTimestamp || Date.now()
        state.stats = payload.stats || state.stats
        state.notifications = payload.notifications || []

        const tables = payload.tables || {}
        SECTION_KEY_ORDER.forEach((key) => {
          const section = state.sections[key]
          if (!section) return
          section.status = 'succeeded'
          section.error = null
          section.mutationStatus = 'idle'
          section.mutationError = null
          section.data = Array.isArray(tables[key]) ? tables[key].map((row) => ({ ...row })) : []
          section.lastFetched = payload.fetchTimestamp || Date.now()
          section.cacheValid = true
          if (key === SECTION_KEYS.students) {
            const pending = payload.pendingAssignments || []
            section.pendingAssignments = Array.isArray(pending) ? pending.map((row) => ({ ...row })) : []
          }
        })
      })
      .addCase(fetchStudentDashboard.rejected, (state, { payload }) => {
        state.status = 'failed'
        state.error = payload
        SECTION_KEY_ORDER.forEach((key) => {
          const section = state.sections[key]
          if (!section) return
          section.status = 'failed'
          section.error = payload
          section.mutationStatus = 'idle'
          if (key === SECTION_KEYS.students) {
            section.pendingAssignments = []
          }
        })
      })
      .addCase(createSchoolRecord.pending, (state, action) => {
        const { sectionKey } = action.meta.arg
        const section = state.sections[sectionKey]
        if (!section) return
        section.mutationStatus = 'pending'
        section.mutationError = null
      })
      .addCase(createSchoolRecord.fulfilled, (state, { payload }) => {
        const { sectionKey, record } = payload || {}
        const section = state.sections[sectionKey]
        if (!section || !record) return
        section.mutationStatus = 'idle'
        section.mutationError = null
        const existingIndex = section.data.findIndex((row) => row.id === record.id)
        if (existingIndex >= 0) {
          section.data[existingIndex] = record
        } else {
          section.data = [record, ...section.data]
        }
      })
      .addCase(createSchoolRecord.rejected, (state, action) => {
        const { sectionKey } = action.meta.arg
        const section = state.sections[sectionKey]
        if (!section) return
        section.mutationStatus = 'idle'
        section.mutationError = action.payload || action.error?.message || 'Unable to create record'
      })
      .addCase(updateSchoolRecord.pending, (state, action) => {
        const { sectionKey } = action.meta.arg
        const section = state.sections[sectionKey]
        if (!section) return
        section.mutationStatus = 'pending'
        section.mutationError = null
      })
      .addCase(updateSchoolRecord.fulfilled, (state, action) => {
        const requestedKey = action.meta.arg.sectionKey
        const requestedSection = requestedKey ? state.sections[requestedKey] : undefined
        if (requestedSection) {
          requestedSection.mutationStatus = 'idle'
          requestedSection.mutationError = null
        }

        const { sectionKey: responseKey, record } = action.payload || {}
        if (!record) return

        if (requestedKey && requestedKey !== responseKey && requestedSection) {
          requestedSection.data = requestedSection.data.filter((row) => row.id !== record.id)
        }

        const targetSection = state.sections[responseKey]
        if (!targetSection) return

        targetSection.mutationStatus = 'idle'
        targetSection.mutationError = null

        const index = targetSection.data.findIndex((row) => row.id === record.id)
        if (index >= 0) {
          targetSection.data[index] = record
        } else {
          targetSection.data = [record, ...targetSection.data]
        }
      })
      .addCase(updateSchoolRecord.rejected, (state, action) => {
        const { sectionKey } = action.meta.arg
        const section = state.sections[sectionKey]
        if (!section) return
        section.mutationStatus = 'idle'
        section.mutationError = action.payload || action.error?.message || 'Unable to update record'
      })
      .addCase(deleteSchoolRecord.pending, (state, action) => {
        const { sectionKey } = action.meta.arg
        const section = state.sections[sectionKey]
        if (!section) return
        section.mutationStatus = 'pending'
        section.mutationError = null
      })
      .addCase(deleteSchoolRecord.fulfilled, (state, action) => {
        const requestedKey = action.meta.arg.sectionKey
        const { sectionKey: responseKey, id } = action.payload || {}
        const effectiveKey = responseKey || requestedKey

        if (requestedKey && state.sections[requestedKey]) {
          state.sections[requestedKey].mutationStatus = 'idle'
          state.sections[requestedKey].mutationError = null
        }

        if (!effectiveKey || !id) return

        const targetSection = state.sections[effectiveKey]
        if (!targetSection) return

        targetSection.mutationStatus = 'idle'
        targetSection.mutationError = null
        targetSection.data = targetSection.data.filter((row) => row.id !== id)
        targetSection.pendingAssignments = targetSection.pendingAssignments.filter((row) => row.id !== id)

        if (requestedKey && requestedKey !== effectiveKey && state.sections[requestedKey]) {
          state.sections[requestedKey].data = state.sections[requestedKey].data.filter((row) => row.id !== id)
          state.sections[requestedKey].pendingAssignments = state.sections[requestedKey].pendingAssignments.filter((row) => row.id !== id)
        }
      })
      .addCase(deleteSchoolRecord.rejected, (state, action) => {
        const { sectionKey } = action.meta.arg
        const section = state.sections[sectionKey]
        if (!section) return
        section.mutationStatus = 'idle'
        section.mutationError = action.payload || action.error?.message || 'Unable to delete record'
        
        // If record not found (404), remove it from local state anyway to sync with backend
        if (action.payload?.includes('not found') || action.error?.message?.includes('404')) {
          const { id } = action.meta.arg
          if (id) {
            section.data = section.data.filter((row) => row.id !== id)
            section.pendingAssignments = section.pendingAssignments.filter((row) => row.id !== id)
          }
        }
      })
      .addCase(confirmStudentAssignment.pending, (state) => {
        const section = state.sections[SECTION_KEYS.students]
        if (!section) return
        section.mutationStatus = 'pending'
        section.mutationError = null
      })
      .addCase(confirmStudentAssignment.fulfilled, (state, { payload }) => {
        const section = state.sections[SECTION_KEYS.students]
        if (!section) return
        section.mutationStatus = 'idle'
        section.mutationError = null

        const removedId = payload?.pendingAssignmentRemoved
        if (removedId) {
          section.pendingAssignments = section.pendingAssignments.filter((row) => row.id !== removedId)
          section.data = section.data.filter((row) => row.id !== removedId)
        }

        const record = payload?.record
        if (record && String(record.assignmentStatus || '').toLowerCase() === 'confirmed') {
          const existingIndex = section.data.findIndex((row) => row.id === record.id)
          if (existingIndex >= 0) {
            section.data[existingIndex] = record
          } else {
            section.data = [record, ...section.data]
          }
        }
      })
      .addCase(confirmStudentAssignment.rejected, (state, action) => {
        const section = state.sections[SECTION_KEYS.students]
        if (!section) return
        section.mutationStatus = 'idle'
        section.mutationError = action.payload || action.error?.message || 'Unable to confirm assignment'
      })
      .addCase(rejectStudentAssignment.pending, (state) => {
        const section = state.sections[SECTION_KEYS.students]
        if (!section) return
        section.mutationStatus = 'pending'
        section.mutationError = null
      })
      .addCase(rejectStudentAssignment.fulfilled, (state, { payload }) => {
        const section = state.sections[SECTION_KEYS.students]
        if (!section) return
        section.mutationStatus = 'idle'
        section.mutationError = null

        const removedId = payload?.pendingAssignmentRemoved
        if (removedId) {
          section.pendingAssignments = section.pendingAssignments.filter((row) => row.id !== removedId)
          section.data = section.data.filter((row) => row.id !== removedId)
        }

        const record = payload?.record
        if (record && String(record.assignmentStatus || '').toLowerCase() === 'confirmed') {
          const existingIndex = section.data.findIndex((row) => row.id === record.id)
          if (existingIndex >= 0) {
            section.data[existingIndex] = record
          } else {
            section.data = [record, ...section.data]
          }
        }
      })
      .addCase(rejectStudentAssignment.rejected, (state, action) => {
        const section = state.sections[SECTION_KEYS.students]
        if (!section) return
        section.mutationStatus = 'idle'
        section.mutationError = action.payload || action.error?.message || 'Unable to reject assignment'
      })
  },
})

export const { setActiveSection, invalidateCache } = tableSlice.actions

export const selectStudentDashboard = (state) => state.table
export const selectStats = (state) => state.table.stats
export const selectNotifications = (state) => state.table.notifications
export const selectActiveSection = (state) => state.table.activeSection
export const selectSectionData = (section) => (state) => state.table.sections[section]
export const selectDashboardStatus = (state) => state.table.status

export default tableSlice.reducer

export { SECTION_KEYS } from '@/Components/table/sectionDefinitions'

// Legacy no-op exports retained for compatibility with historical components.
export const startEdit = () => ({ type: 'studentDashboard/startEdit' })
export const cancelEdit = () => ({ type: 'studentDashboard/cancelEdit' })
export const updateRow = () => ({ type: 'studentDashboard/updateRow' })
export const deleteRow = () => ({ type: 'studentDashboard/deleteRow' })
export const addRow = () => ({ type: 'studentDashboard/addRow' })
export const selectIsEditing = () => () => false
