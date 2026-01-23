import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { refreshSession, logout } from '@/redux/slices/authSlice'

/**
 * Hook to manage automatic token refresh and session persistence
 * Refreshes access token before expiry to prevent unexpected logouts
 */
export const useAuthService = () => {
  const dispatch = useDispatch()
  const { accessToken, refreshToken, isAuthenticated } = useSelector((state) => state.auth)
  
  const refreshIntervalRef = useRef(null)
  const isRefreshingRef = useRef(false)

  // ACCESS_TOKEN_EXPIRY is typically 15 minutes (900 seconds)
  // Refresh when 2 minutes remaining (720 seconds)
  const ACCESS_TOKEN_EXPIRY = 15 * 60 // seconds
  const REFRESH_THRESHOLD = 2 * 60 // seconds before expiry

  const performTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current || !refreshToken || !isAuthenticated) {
      return
    }

    isRefreshingRef.current = true
    try {
      const result = await dispatch(refreshSession(refreshToken))
      
      if (refreshSession.rejected.match(result)) {
        console.warn('Token refresh failed:', result.payload?.message)
        // Dispatch logout if refresh fails permanently
        if (result.payload?.status === 401) {
          dispatch(logout())
        }
      }
    } catch (error) {
      console.error('Unexpected token refresh error:', error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [dispatch, refreshToken, isAuthenticated])

  // Set up automatic token refresh interval
  useEffect(() => {
    if (!isAuthenticated || !refreshToken) {
      // Clear interval if not authenticated
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      return
    }

    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    // Calculate refresh interval:
    // Refresh when (ACCESS_TOKEN_EXPIRY - REFRESH_THRESHOLD) seconds have passed
    // Default: every 13 minutes (780 seconds) for 15-minute tokens
    const refreshInterval = (ACCESS_TOKEN_EXPIRY - REFRESH_THRESHOLD) * 1000

    // Perform initial refresh after a delay to let app stabilize
    const initialRefreshTimeout = setTimeout(() => {
      performTokenRefresh()
    }, 1000)

    // Set up periodic refresh
    refreshIntervalRef.current = setInterval(() => {
      performTokenRefresh()
    }, refreshInterval)

    return () => {
      clearTimeout(initialRefreshTimeout)
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [isAuthenticated, refreshToken, performTokenRefresh])

  // Handle visibility change - refresh token when tab becomes visible
  useEffect(() => {
    if (!isAuthenticated || !refreshToken) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, refresh token to ensure session is still valid
        performTokenRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, refreshToken, performTokenRefresh])

  // Handle online/offline status
  useEffect(() => {
    if (!isAuthenticated || !refreshToken) return

    const handleOnline = () => {
      console.log('Connection restored')
      // Refresh token when coming back online
      performTokenRefresh()
    }

    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [isAuthenticated, refreshToken, performTokenRefresh])

  return {
    isAuthenticated,
    refreshToken,
    accessToken,
    performTokenRefresh,
  }
}

export default useAuthService
