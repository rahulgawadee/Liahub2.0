import React, { useState, useEffect } from 'react'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { InputOTP } from '../ui/input-otp'
import { useTheme } from '@/hooks/useTheme'

export function OtpVerification({
  otp,
  onOtpChange,
  onSubmit,
  onResend,
  loading,
  error,
  helpText,
  resendLabel = 'Resend OTP',
  submitLabel = 'Verify & Continue',
  canSubmit,
}) {
  const { isDark } = useTheme()
  const [timer, setTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000)
      return () => clearTimeout(countdown)
    } else {
      setCanResend(true)
    }
  }, [timer])

  const handleResend = () => {
    onResend()
    setTimer(30)
    setCanResend(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6">
      <div className="flex flex-col items-center space-y-4 sm:space-y-5">
        <div className="w-full space-y-3 sm:space-y-4">
          <Label className={`text-xs sm:text-sm font-medium text-center block transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-black'}`}>Enter OTP</Label>
          <div className="flex justify-center">
            <InputOTP value={otp} onChange={onOtpChange} />
          </div>
          {helpText && (
            <p className={`text-xs sm:text-sm text-center transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{helpText}</p>
          )}
        </div>
      </div>
      
      {error && (
        <div className={`p-3 sm:p-4 rounded-xl border transition-colors duration-300 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs sm:text-sm text-center transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
        </div>
      )}
      
      <Button
        disabled={loading || !canSubmit}
        type="submit"
        style={{
          backgroundColor: isDark ? 'white' : 'black',
          color: isDark ? 'black' : 'white'
        }}
        className="w-full h-12 sm:h-14 font-bold text-sm sm:text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        onMouseEnter={(e) => {
          if (!loading && canSubmit) {
            e.currentTarget.style.backgroundColor = isDark ? '#f3f4f6' : '#1f2937'
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && canSubmit) {
            e.currentTarget.style.backgroundColor = isDark ? 'white' : 'black'
          }
        }}
      >
        {loading ? 'Verifying...' : submitLabel}
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        className={`w-full h-11 sm:h-12 border rounded-full text-sm sm:text-base transition-all duration-300 ${
          isDark
            ? 'border-white/20 hover:border-white/40 bg-transparent hover:bg-white/5'
            : 'border-gray-300 hover:border-gray-400 bg-transparent hover:bg-gray-50'
        } ${
          canResend
            ? isDark ? 'text-white hover:text-white' : 'text-black hover:text-black'
            : isDark ? 'text-gray-500' : 'text-gray-400'
        }`}
        onClick={handleResend}
        disabled={loading || !canResend}
      >
        {canResend ? resendLabel : `Resend OTP in ${timer}s`}
      </Button>
    </form>
  )
}
