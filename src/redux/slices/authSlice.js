import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'
import { getPrimaryEntity } from '@/lib/roles'

const buildFullName = (name = {}, username) => {
  if (!name) return username || ''
  if (typeof name === 'string') return name
  const parts = [name.first, name.last].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return username || ''
}

const STORAGE_KEY = 'liahub_auth'
const STORAGE_VERSION = 'v1'

const persistState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      ...state,
    }))
  } catch (error) {
    console.error('Failed to persist auth state:', error)
  }
}

const readState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    
    // Validate version and structure
    if (parsed.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    // Check if tokens exist and are strings
    if (parsed.accessToken && typeof parsed.accessToken !== 'string') return null
    if (parsed.refreshToken && typeof parsed.refreshToken !== 'string') return null

    return parsed
  } catch (error) {
    console.error('Failed to read auth state:', error)
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

const enrichUser = (user) => {
  if (!user) return null
  const entity = user.entity || getPrimaryEntity(user.roles)
  const derivedName = buildFullName(user.name, user.username)
  return {
    ...user,
    entity,
    name: derivedName || user.name || user.username || 'Member',
    profileName: derivedName,
    rawName: user.name,
  }
}

const mergeProfileIntoUser = (user, profile) => {
  if (!user || !profile) return user

  const base = {
    ...user,
    name: user.rawName ?? user.name,
  }

  if (profile.name !== undefined) {
    base.name = profile.name
  }

  if (profile.media) {
    base.media = { ...(user.media || {}), ...profile.media }
  }

  if (profile.contact) {
    base.contact = { ...(user.contact || {}), ...profile.contact }
  }

  if (profile.social) {
    base.social = { ...(user.social || {}), ...profile.social }
  }

  if (typeof profile.followerCount === 'number') {
    base.followerCount = profile.followerCount
  }

  if (typeof profile.followingCount === 'number') {
    base.followingCount = profile.followingCount
  }

  if (profile.username) {
    base.username = profile.username
  }

  if (profile.email) {
    base.email = profile.email
  }

  if (profile.roles) {
    base.roles = profile.roles
  }

  if (profile.companyProfile) {
    base.companyProfile = { ...(user.companyProfile || {}), ...profile.companyProfile }
  }

  if (profile.staffProfile) {
    base.staffProfile = { ...(user.staffProfile || {}), ...profile.staffProfile }
  }

  return base
}

const baseState = (() => {
  const saved = readState()
  if (!saved) return null
  return {
    ...saved,
    user: enrichUser(saved.user),
  }
})()

export const login = createAsyncThunk('auth/login', async ({ identifier, password, entity, subRole }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', { identifier, password, entity, subRole })
    return data
  } catch (error) {
    return rejectWithValue({
      message: error?.response?.data?.message || error?.message || 'Unable to login',
      code: error?.response?.data?.code || 'LOGIN_ERROR',
      status: error?.response?.status || 500,
    })
  }
})

export const refreshSession = createAsyncThunk('auth/refresh', async (refreshToken, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/refresh', { refreshToken })
    return data
  } catch (error) {
    return rejectWithValue({
      message: error?.response?.data?.message || error?.message || 'Session refresh failed',
      code: error?.response?.data?.code || 'REFRESH_ERROR',
      status: error?.response?.status || 500,
    })
  }
})

export const logoutRemote = createAsyncThunk('auth/logoutRemote', async (_, { getState, rejectWithValue }) => {
  const { auth } = getState()
  try {
    if (auth?.sessionId) {
      await api.post('/auth/logout')
    }
    return null
  } catch (error) {
    // Don't fail logout on API error
    console.warn('Remote logout failed:', error?.message)
    return null
  }
})

export const requestOtp = createAsyncThunk('auth/requestOtp', async ({ entity, form }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register/request-otp', { entity, form })
    return data
  } catch (error) {
    return rejectWithValue({
      message: error?.response?.data?.message || error?.message || 'Unable to request OTP',
      code: error?.response?.data?.code || 'OTP_ERROR',
      status: error?.response?.status || 500,
    })
  }
})

export const verifyAndRegister = createAsyncThunk(
  'auth/verifyAndRegister',
  async ({ entity, form, otp }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register/verify', { entity, form, otp })
      return data
    } catch (error) {
      return rejectWithValue({
        message: error?.response?.data?.message || error?.message || 'Verification failed',
        code: error?.response?.data?.code || 'VERIFY_ERROR',
        status: error?.response?.status || 500,
      })
    }
  },
)

const otpInitialState = {
  status: 'idle',
  requested: false,
  email: null,
  maskedEmail: null,
  expiresAt: null,
  expiresIn: null,
}

const initialState = {
  user: baseState?.user || null,
  accessToken: baseState?.accessToken || null,
  refreshToken: baseState?.refreshToken || null,
  sessionId: baseState?.sessionId || null,
  loading: false,
  error: null,
  errorCode: null,
  otp: { ...otpInitialState },
  isAuthenticated: !!(baseState?.accessToken && baseState?.refreshToken && baseState?.user),
  lastRefreshAttempt: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.sessionId = null
      state.error = null
      state.errorCode = null
      state.otp = { ...otpInitialState }
      state.isAuthenticated = false
      state.lastRefreshAttempt = null
      persistState({ user: null, accessToken: null, refreshToken: null, sessionId: null })
    },
    tokenRefreshed(state, { payload }) {
      state.accessToken = payload.accessToken
      state.refreshToken = payload.refreshToken
      if (payload.user) state.user = enrichUser(payload.user)
      state.error = null
      state.errorCode = null
      state.isAuthenticated = true
      state.lastRefreshAttempt = new Date().toISOString()
      persistState({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        sessionId: payload.sessionId || state.sessionId,
      })
    },
    clearError(state) {
      state.error = null
      state.errorCode = null
    },
    resetOtp(state) {
      state.otp = { ...otpInitialState }
    },
    profileMerged(state, { payload }) {
      if (!state.user || !payload) return
      const merged = mergeProfileIntoUser(state.user, payload)
      state.user = enrichUser(merged)
      persistState({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        sessionId: state.sessionId,
      })
    },
    setAuthenticationStatus(state, { payload }) {
      state.isAuthenticated = payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
        state.errorCode = null
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false
        state.user = enrichUser(payload.user)
        state.accessToken = payload.accessToken
        state.refreshToken = payload.refreshToken
        state.sessionId = payload.sessionId || payload.user?.sessionId || null
        state.error = null
        state.errorCode = null
        state.isAuthenticated = true
        state.lastRefreshAttempt = new Date().toISOString()
        persistState({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          sessionId: state.sessionId,
        })
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || action.error?.message || 'Login failed'
        state.errorCode = action.payload?.code || 'LOGIN_ERROR'
        state.isAuthenticated = false
      })
      .addCase(refreshSession.pending, (state) => {
        state.lastRefreshAttempt = new Date().toISOString()
      })
      .addCase(refreshSession.fulfilled, (state, { payload }) => {
        state.accessToken = payload.accessToken
        state.refreshToken = payload.refreshToken
        if (payload.user) state.user = enrichUser(payload.user)
        state.error = null
        state.errorCode = null
        state.isAuthenticated = true
        persistState({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          sessionId: state.sessionId,
        })
      })
      .addCase(refreshSession.rejected, (state, action) => {
        // Only logout on permanent failures, not on temporary network issues
        if (action.payload?.status === 401) {
          state.user = null
          state.accessToken = null
          state.refreshToken = null
          state.sessionId = null
          state.error = action.payload?.message || 'Session expired'
          state.errorCode = action.payload?.code || 'SESSION_EXPIRED'
          state.isAuthenticated = false
          persistState({ user: null, accessToken: null, refreshToken: null, sessionId: null })
        }
      })
      .addCase(logoutRemote.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.sessionId = null
        state.error = null
        state.errorCode = null
        state.otp = { ...otpInitialState }
        state.isAuthenticated = false
        persistState({ user: null, accessToken: null, refreshToken: null, sessionId: null })
      })
      .addCase(requestOtp.pending, (state) => {
        state.loading = true
        state.error = null
        state.errorCode = null
        state.otp = { ...state.otp, status: 'requesting', requested: false, email: null, maskedEmail: null, expiresAt: null, expiresIn: null }
      })
      .addCase(requestOtp.fulfilled, (state, { payload }) => {
        state.loading = false
        state.otp = {
          status: 'requested',
          requested: true,
          email: payload.email,
          maskedEmail: payload.maskedEmail,
          expiresAt: payload.expiresAt,
          expiresIn: payload.expiresIn,
        }
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || action.error?.message || 'OTP request failed'
        state.errorCode = action.payload?.code || 'OTP_ERROR'
        state.otp = { ...otpInitialState }
      })
      .addCase(verifyAndRegister.pending, (state) => {
        state.loading = true
        state.error = null
        state.errorCode = null
        state.otp.status = 'verifying'
      })
      .addCase(verifyAndRegister.fulfilled, (state, { payload }) => {
        state.loading = false
        state.user = enrichUser(payload.user)
        state.accessToken = payload.accessToken
        state.refreshToken = payload.refreshToken
        state.sessionId = payload.sessionId || null
        state.error = null
        state.errorCode = null
        state.isAuthenticated = true
        state.otp = { ...otpInitialState, status: 'verified', email: payload.user?.email || null }
        persistState({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          sessionId: state.sessionId,
        })
      })
      .addCase(verifyAndRegister.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || action.error?.message || 'Verification failed'
        state.errorCode = action.payload?.code || 'VERIFY_ERROR'
        state.otp.status = state.otp.requested ? 'requested' : 'idle'
      })
  },
})

export const { logout, tokenRefreshed, clearError, resetOtp, profileMerged, setAuthenticationStatus } = authSlice.actions
export default authSlice.reducer
