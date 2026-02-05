import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initializeTheme, selectTheme } from '../redux/slices/themeSlice'
import { getSavedTheme, applyTheme, getSystemTheme } from '../lib/themeUtils'

/**
 * Theme Provider - Initializes theme on app load
 * Wraps the entire application to provide theme context
 */
export function ThemeProvider({ children }) {
  const dispatch = useDispatch()
  const theme = useSelector(selectTheme)

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = getSavedTheme()
    dispatch(initializeTheme(savedTheme))
    applyTheme(savedTheme)
  }, [dispatch])

  // Listen for system theme changes when no explicit preference is set
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e) => {
      // Only update if user hasn't explicitly set a theme preference
      const savedTheme = localStorage.getItem('theme-preference')
      if (!savedTheme) {
        const systemTheme = e.matches ? 'dark' : 'light'
        dispatch(initializeTheme(systemTheme))
        applyTheme(systemTheme)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [dispatch])

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return <>{children}</>
}

export default ThemeProvider
