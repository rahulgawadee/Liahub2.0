import axios from 'axios'

// Use VITE_API_URL for deployment (Vercel → Render)
// In development, fall back to localhost
const useCredentials = import.meta.env.VITE_API_USE_CREDENTIALS === 'true'
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const defaultBase = import.meta.env.VITE_API_BASE_URL || `${apiUrl}/api/v1`
const api = axios.create({
  baseURL: defaultBase,
  withCredentials: useCredentials,
  timeout: 300000, // 5 minute timeout for large file uploads
})

let storeRef = null

export const injectStore = (store) => {
  storeRef = store
}

// Request interceptor: Attach access token to all requests
api.interceptors.request.use(
  (config) => {
    const { auth } = storeRef ? storeRef.getState() : { auth: null }
    const token = auth?.accessToken
    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let pendingQueue = []

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  pendingQueue = []
}

// Response interceptor: Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Skip retry for refresh endpoint itself and other non-401 errors
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Skip retry if it looks like a refresh attempt that failed
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    // Start refresh flow
    originalRequest._retry = true
    isRefreshing = true

    try {
      const state = storeRef?.getState()
      const refreshToken = state?.auth?.refreshToken

      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      // Use axios instance without interceptors to avoid infinite loop
      const refreshAxios = axios.create({
        baseURL: defaultBase,
        withCredentials: useCredentials,
        timeout: 300000, // 5 minute timeout
      })

      const { data } = await refreshAxios.post('/auth/refresh', { refreshToken })

      // Dispatch token refresh action to update Redux state
      if (storeRef) {
        storeRef.dispatch({ type: 'auth/tokenRefreshed', payload: data })
      }

      // Update original request with new token
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`

      // Process queued requests
      processQueue(null, data.accessToken)

      // Retry original request
      return api(originalRequest)
    } catch (refreshError) {
      // Clear pending queue on refresh failure
      processQueue(refreshError, null)

      // Log user out on refresh failure
      if (storeRef) {
        storeRef.dispatch({ type: 'auth/logout' })
      }

      // Clear stored auth data
      localStorage.removeItem('liahub_auth')

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
