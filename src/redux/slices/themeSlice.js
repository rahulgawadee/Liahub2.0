import { createSlice } from '@reduxjs/toolkit'
import { getSavedTheme, THEMES } from '../../lib/themeUtils'

const initialState = {
  theme: getSavedTheme(),
  isLoading: false,
  error: null,
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload
      state.error = null
    },
    toggleTheme: (state) => {
      state.theme = state.theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
      state.error = null
    },
    initializeTheme: (state, action) => {
      state.theme = action.payload
    },
  },
})

export const { setTheme, toggleTheme: toggleThemeAction, initializeTheme } = themeSlice.actions

export const selectTheme = (state) => state.theme.theme
export const selectThemeLoading = (state) => state.theme.isLoading
export const selectThemeError = (state) => state.theme.error

export default themeSlice.reducer
