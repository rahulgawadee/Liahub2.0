import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../lib/utils'

/**
 * Professional theme toggle button
 * Displays sun icon for light mode, moon icon for dark mode
 */
export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-full transition-all duration-300 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-blue-400',
        'group',
        isDark ? 'hover:bg-gray-800 border border-gray-700 hover:border-gray-600' : 'hover:bg-gray-100 border border-gray-300 hover:border-gray-400',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Sun icon for light mode */}
      <Sun
        className={cn(
          'absolute w-5 h-5 transition-all duration-300',
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
          'text-black'
        )}
      />

      {/* Moon icon for dark mode */}
      <Moon
        className={cn(
          'absolute w-5 h-5 transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
          'text-white'
        )}
      />

      {/* Invisible space for button size */}
      <div className="w-5 h-5" />
    </button>
  )
}
