/**
 * Theme utilities for managing light and dark mode
 */

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

export const DEFAULT_THEME = THEMES.LIGHT

export const getSystemTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_THEME
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEMES.DARK
  }
  return THEMES.LIGHT
}

export const applyTheme = (theme) => {
  const root = document.documentElement
  
  if (theme === THEMES.DARK) {
    root.classList.add('dark')
    root.classList.remove('light')
    document.body.style.backgroundColor = '#000000'
    document.body.style.color = '#ffffff'
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
    document.body.style.backgroundColor = '#ffffff'
    document.body.style.color = '#000000'
  }
  
  // Store theme preference
  localStorage.setItem('theme-preference', theme)
}

export const getSavedTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_THEME
  
  const savedTheme = localStorage.getItem('theme-preference')
  if (savedTheme) {
    return savedTheme
  }
  
  // If no saved theme, use system preference
  return getSystemTheme()
}

export const toggleTheme = (currentTheme) => {
  return currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
}
