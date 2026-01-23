import React from 'react'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { InputOTP } from '../ui/input-otp'

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
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-full space-y-3">
          <Label className="text-sm font-medium text-gray-300 text-center block">Enter OTP</Label>
          <div className="flex justify-center">
            <InputOTP value={otp} onChange={onOtpChange} />
          </div>
          {helpText ? (
            <p className="text-xs text-gray-500 text-center">{helpText}</p>
          ) : null}
        </div>
      </div>
      {error ? (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : null}
      <Button
        disabled={loading || !canSubmit}
        type="submit"
        className="neomorph-button w-full h-11 bg-gray-200 hover:bg-white text-black font-semibold transition-all"
      >
        {loading ? 'Verifying...' : submitLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="neomorph-button w-full h-11 border-gray-700/50 hover:bg-accent text-gray-300"
        onClick={onResend}
        disabled={loading}
      >
        {resendLabel}
      </Button>
    </form>
  )
}
