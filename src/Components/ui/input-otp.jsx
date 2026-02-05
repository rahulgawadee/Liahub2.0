import React from 'react'
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'
import { useTheme } from '@/hooks/useTheme'

export const InputOTP = ({ value='', onChange, maxLength=6 }) => {
  const { isDark } = useTheme()
  const handleChange = (e) => {
    const next = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, maxLength)
    onChange?.(next)
  }
  return (
    <input
      value={value}
      onChange={handleChange}
      pattern={REGEXP_ONLY_DIGITS_AND_CHARS.source}
      className={`tracking-widest text-center text-xl font-semibold h-12 w-full rounded-md border transition-colors duration-300 ${isDark ? 'bg-black text-white border-gray-600 placeholder:text-gray-600' : 'bg-white text-black border-gray-300 placeholder:text-gray-400'}`}
      placeholder={'_'.repeat(maxLength)}
    />
  )
}
