import React from 'react'
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'

export const InputOTP = ({ value='', onChange, maxLength=6 }) => {
  const handleChange = (e) => {
    const next = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, maxLength)
    onChange?.(next)
  }
  return (
    <input
      value={value}
      onChange={handleChange}
      pattern={REGEXP_ONLY_DIGITS_AND_CHARS.source}
      className="tracking-widest text-center text-xl font-semibold h-12 w-full rounded-md border bg-background"
      placeholder={'_'.repeat(maxLength)}
    />
  )
}
