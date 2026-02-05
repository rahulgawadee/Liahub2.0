import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { toggleThemeAction, setTheme, selectTheme } from '../redux/slices/themeSlice'
import { applyTheme } from '../lib/themeUtils'

/**
 * Hook to manage theme state and switching
 * Provides current theme and toggle function
 */
export function useTheme() {
  const dispatch = useDispatch()
  const theme = useSelector(selectTheme)

  // Apply theme to DOM when it changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    dispatch(toggleThemeAction())
  }

  const setCurrentTheme = (newTheme) => {
    dispatch(setTheme(newTheme))
  }

  return {
    theme,
    toggleTheme,
    setCurrentTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  }
}
