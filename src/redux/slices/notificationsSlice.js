import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'
import { mapUserPreview } from '@/lib/mappers/users'

const buildNotificationText = (notification, actor) => {
  const actorName = actor?.name || 'Someone'
  switch (notification.type) {
    case 'connection_request':
      return `${actorName} wants to connect with you`
    case 'connection_accept':
      return `${actorName} accepted your connection request`
    case 'message':
      return `New message from ${actorName}`
    case 'job_posted':
      return `${actorName} posted a new opportunity`
    case 'job_application':
      return `${actorName} submitted a job application`
    case 'job_status_update':
      return `An application status was updated`
    case 'lia_posted':
      return `A new LIA posting is available`
    case 'follower_update':
      return `${actorName} started following you`
    case 'document_shared':
      return `${actorName} shared a document`
    case 'student_assigned':
      return `${actorName} assigned a student to your company`
    default:
      return 'You have a new notification'
  }
}

const formatNotification = (item) => {
  if (!item) return null
  const raw = typeof item.toJSON === 'function' ? item.toJSON() : item
  const actor = mapUserPreview(raw.actor)
  return {
    id: raw.id,
    type: raw.type,
    actor,
    payload: raw.payload || {},
    createdAt: raw.createdAt,
    readAt: raw.readAt,
    archivedAt: raw.archivedAt,
    text: buildNotificationText(raw, actor),
    raw,
  }
}

const baseError = (error) => error?.response?.data?.message || error?.message || 'Unable to complete request'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (page = 1, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/notifications?page=${page}&limit=20`)
    return data
  } catch (error) {
    return rejectWithValue(baseError(error))
  }
})

export const markNotificationsRead = createAsyncThunk(
  'notifications/mark-read',
  async ({ notificationIds }, { rejectWithValue }) => {
    try {
      await api.post('/notifications/read', { notificationIds })
      return notificationIds
    } catch (error) {
      return rejectWithValue(baseError(error))
    }
  },
)

const initialState = {
  items: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  readBatch: [], // Track read notifications to batch send
}

let seq = 1
const makeId = () => 'n-' + seq++

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification(state, { payload }) {
      const id = makeId()
      state.items.unshift({
        id,
        type: payload?.type || 'info',
        text: payload?.text || 'Notification',
        createdAt: Date.now(),
        readAt: null,
        actor: payload?.actor || null,
        payload: payload?.payload || {},
        local: true,
      })
    },
    markRead(state, { payload }) {
      const notification = state.items.find((item) => item.id === payload)
      if (notification && !notification.readAt) {
        notification.readAt = new Date().toISOString()
        // Add to batch for deferred sending (avoid duplicates)
        if (!notification.local && !state.readBatch.includes(payload)) {
          state.readBatch.push(payload)
        }
      }
    },
    markAllRead(state) {
      state.items.forEach((item) => {
        if (!item.readAt && !item.local) {
          item.readAt = new Date().toISOString()
          if (!state.readBatch.includes(item.id)) {
            state.readBatch.push(item.id)
          }
        }
      })
    },
    clearReadBatch(state) {
      state.readBatch = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.loading = false
        const notificationList = Array.isArray(payload.data) ? payload.data : []
        state.items = notificationList.map(formatNotification).filter(Boolean)
        state.pagination = payload.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error?.message || 'Failed to load notifications'
      })
      .addCase(markNotificationsRead.fulfilled, (state, { payload }) => {
        if (!Array.isArray(payload)) return
        payload.forEach((id) => {
          const notification = state.items.find((item) => item.id === id)
          if (notification) notification.readAt = notification.readAt || new Date().toISOString()
        })
        // Clear batch after successful send
        state.readBatch = []
      })
  },
})

export const { pushNotification, markRead, markAllRead, clearReadBatch } = notificationsSlice.actions

// Selector to get unread notification count
export const selectUnreadNotificationsCount = (state) => {
  const items = state?.notifications?.items || []
  return items.filter((item) => !item.readAt).length
}

export default notificationsSlice.reducer
