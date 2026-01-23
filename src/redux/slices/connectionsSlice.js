import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'
import { mapConnectionPayload, mapUserPreview } from '@/lib/mappers/users'
import { addFollower, followUser, updateProfile as updateProfileSlice } from './profileSlice'

const initialState = {
  loading: false,
  error: null,
  network: [],
  incoming: [],
  outgoing: [],
  followers: [],
  following: [],
  totals: { network: 0, incoming: 0, outgoing: 0, followers: 0, following: 0 },
}

export const fetchConnections = createAsyncThunk('connections/fetch', async (_, { getState }) => {
  const { data } = await api.get('/connections')
  const currentUserId = getState().auth?.user?.id
  return { data, currentUserId }
})

export const sendConnectionRequest = createAsyncThunk(
  'connections/send',
  async ({ recipientId, message, attachments }, { getState }) => {
    const payload = { recipientId, message, attachments }
    const { data } = await api.post('/connections', payload)
    const currentUserId = getState().auth?.user?.id
    return { connection: data, currentUserId }
  },
)

export const respondConnectionRequest = createAsyncThunk(
  'connections/respond',
  async ({ connectionId, action }, { getState, dispatch }) => {
    const { data } = await api.post(`/connections/${connectionId}/respond`, { action })
    const currentUserId = getState().auth?.user?.id

    if (action === 'accept') {
      const peer = data.requester?.id === currentUserId ? data.recipient : data.requester
      const peerId = peer?.id || peer?._id
      if (peerId) {
        dispatch(addFollower(peerId))
        dispatch(followUser(peerId))
      }
    }

    return { connection: data, action, currentUserId }
  },
)

export const followUserConnection = createAsyncThunk(
  'connections/followUser',
  async ({ userId }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post(`/users/${userId}/follow`)
      await dispatch(fetchConnections())
      if (data?.follower) {
        dispatch(updateProfileSlice({
          followers: data.follower.followerCount,
          following: data.follower.followingCount,
        }))
      }
      return data
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Unable to follow user')
    }
  },
)

export const unfollowUserConnection = createAsyncThunk(
  'connections/unfollowUser',
  async ({ userId }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/users/${userId}/follow`)
      
      // Refresh connections to get updated lists
      await dispatch(fetchConnections())
      
      // Update profile counts
      if (data?.follower) {
        dispatch(updateProfileSlice({
          followers: data.follower.followerCount,
          following: data.follower.followingCount,
        }))
      }
      
      // Remove from local following list
      if (data?.unfollowedUserId) {
        dispatch(updateProfileSlice({
          followingIds: [],  // Will be updated by fetchConnections
        }))
      }
      
      return data
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Unable to unfollow user')
    }
  },
)

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    resetConnections() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConnections.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchConnections.fulfilled, (state, { payload }) => {
        state.loading = false
        const { data, currentUserId } = payload
        state.network = (data.network || []).map((entry) => mapConnectionPayload(entry, currentUserId))
        state.incoming = (data.incoming || []).map((entry) => mapConnectionPayload(entry, currentUserId))
        state.outgoing = (data.outgoing || []).map((entry) => mapConnectionPayload(entry, currentUserId))
        state.followers = (data.followers || []).map((user) => mapUserPreview(user))
        state.following = (data.following || []).map((user) => mapUserPreview(user))
        state.totals = {
          network: data.totals?.network || state.network.length,
          incoming: data.totals?.incoming || state.incoming.length,
          outgoing: data.totals?.outgoing || state.outgoing.length,
          followers: data.totals?.followers || state.followers.length,
          following: data.totals?.following || state.following.length,
        }
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load connections'
      })
      .addCase(sendConnectionRequest.fulfilled, (state, { payload }) => {
        const entry = mapConnectionPayload(payload.connection, payload.currentUserId)
        if (!entry) return
        const exists = state.outgoing.some((item) => item.id === entry.id)
        if (!exists) state.outgoing.unshift(entry)
        state.totals.outgoing = state.outgoing.length
      })
      .addCase(respondConnectionRequest.fulfilled, (state, { payload }) => {
        const entry = mapConnectionPayload(payload.connection, payload.currentUserId)
        if (!entry) return

        // Remove from pending lists
        state.incoming = state.incoming.filter((item) => item.id !== entry.id)
        state.outgoing = state.outgoing.filter((item) => item.id !== entry.id)

        if (payload.action === 'accept') {
          // Add to network when accepted
          const exists = state.network.some((item) => item.id === entry.id)
          if (!exists) state.network.unshift({ ...entry, direction: 'connected' })

          const peer = entry.peer
          if (peer?.id) {
            if (!state.followers.some((user) => user.id === peer.id)) {
              state.followers.unshift(peer)
            }
            if (!state.following.some((user) => user.id === peer.id)) {
              state.following.unshift(peer)
            }
          }
        }

        state.totals = {
          ...state.totals,
          incoming: state.incoming.length,
          outgoing: state.outgoing.length,
          network: state.network.length,
          followers: state.followers.length,
          following: state.following.length,
        }
      })
      .addCase(respondConnectionRequest.rejected, (state, action) => {
        state.error = action.error?.message || 'Failed to update connection'
      })
      .addCase(followUserConnection.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || 'Unable to follow user'
      })
      .addCase(unfollowUserConnection.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || 'Unable to unfollow user'
      })
  },
})

export const { resetConnections } = connectionsSlice.actions
export default connectionsSlice.reducer

export const acceptConnectionRequest = ({ connectionId }) =>
  respondConnectionRequest({ connectionId, action: 'accept' })

export const declineConnectionRequest = ({ connectionId }) =>
  respondConnectionRequest({ connectionId, action: 'reject' })
