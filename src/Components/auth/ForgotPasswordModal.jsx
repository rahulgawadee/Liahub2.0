import React from 'react'
import { X, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { useTheme } from '@/hooks/useTheme'

export function ForgotPasswordModal({ isOpen, onClose }) {
  const { isDark } = useTheme()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`border rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 transition-colors ${
        isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-6 h-6 transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-xl sm:text-2xl font-bold transition-colors ${isDark ? 'text-white' : 'text-black'}`}>Password Reset</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-black'
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-center space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <p className={`text-sm sm:text-base leading-relaxed transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              If you've forgotten your password, please contact your administrator for assistance.
            </p>
            <div className={`border rounded-lg p-4 sm:p-5 transition-colors ${
              isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-xs sm:text-sm font-medium transition-colors ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Admin Support Available
              </p>
              <p className={`text-xs sm:text-sm mt-2 transition-colors ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Our support team is here to help you reset your password securely.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t space-y-3 transition-colors ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <Button
            onClick={onClose}
            style={{
              backgroundColor: isDark ? 'white' : 'black',
              color: isDark ? 'black' : 'white'
            }}
            className="w-full h-12 sm:h-14 font-semibold rounded-full transition-all duration-300"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#f3f4f6' : '#1f2937'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? 'white' : 'black'
            }}
          >
            Got It
          </Button>
          <button
            type="button"
            onClick={onClose}
            className={`w-full h-11 sm:h-12 border bg-transparent text-sm sm:text-base rounded-full transition-all duration-300 font-medium ${
              isDark 
                ? 'border-white/20 hover:border-white/40 hover:bg-white/5 text-gray-300 hover:text-white'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 hover:text-black'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
