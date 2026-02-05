import React from 'react'
import logo from '../../assets/logo.png'
import logoLight from '../../assets/logolight.png'
import { ThemeToggle } from '../ui/theme-toggle'
import { useTheme } from '@/hooks/useTheme'

export function AuthShell({ title, description, children, footer = null, entityTabs = null }) {
  const { isDark } = useTheme()
  
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Fixed Logo at Top Left */}
      <div className="fixed top-0 left-0 p-3 sm:p-4 md:p-6 z-50">
        <img src={isDark ? logo : logoLight} alt="LiaHub" className="h-7 sm:h-8 md:h-10 w-auto" />
      </div>
      
      {/* Fixed Theme Toggle at Top Right */}
      <div className="fixed top-0 right-0 p-3 sm:p-4 md:p-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-20 sm:py-24 md:p-4 md:pt-24">
        <div className="w-full max-w-[95%] sm:max-w-md md:max-w-lg lg:max-w-[600px] space-y-6 sm:space-y-8">
          {/* Entity Tabs */}
          {entityTabs && (
            <div className="flex justify-center">
              {entityTabs}
            </div>
          )}

          {/* Auth Card */}
          <div className={`border rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6 transition-colors duration-300 ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            {/* Title and Description */}
            <div className="space-y-2 sm:space-y-3 text-center">
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{title}</h1>
              {description && (
                <p className={`text-sm sm:text-base transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
              )}
            </div>

            {/* Form Content */}
            <div className="pt-2 sm:pt-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className={`pt-4 sm:pt-6 border-t flex justify-center transition-colors duration-300 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
