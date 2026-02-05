import React from 'react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectItem } from '../ui/select'
import { useTheme } from '@/hooks/useTheme'

const normalizeOptions = (options = []) =>
  options.map((opt) =>
    typeof opt === 'string' ? { value: opt.toLowerCase(), label: opt } : opt
  )

// Autofill styling to prevent black background and white border
const autofillStyles = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px white inset !important;
    -webkit-text-fill-color: black !important;
    background-color: white !important;
    border: 1px solid rgb(209 213 219) !important;
    transition: background-color 5000s ease-in-out 0s;
  }
  
  html.dark input:-webkit-autofill,
  html.dark input:-webkit-autofill:hover,
  html.dark input:-webkit-autofill:focus,
  html.dark input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px black inset !important;
    -webkit-text-fill-color: white !important;
    background-color: black !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`

export function FormField({ entity, field, value, onChange }) {
  const { isDark } = useTheme()
  if (!field) return null

  const {
    name,
    label,
    type = 'text',
    placeholder = '',
    autoComplete,
    required = false,
    options = [],
    inputMode,
    description,
  } = field

  const id = `${entity}-${name}`
  const handleChange = (event) => onChange(name, event.target.value)
  const handleSelectChange = (val) => onChange(name, val)

  return (
    <>
      <style>{autofillStyles}</style>
      <div className="space-y-2">
        {label ? (
          <Label htmlFor={id} className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            {label}
          </Label>
        ) : null}
      {type === 'select' ? (
        <Select
          id={id}
          name={name}
          value={value}
          onValueChange={handleSelectChange}
          required={required}
          className={`w-full h-12 sm:h-14 px-3 sm:px-4 text-sm sm:text-base border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 ${
            isDark 
              ? 'bg-black text-white border-white/30 focus:border-white focus:ring-white/20 hover:border-white/50'
              : 'bg-white text-black border-gray-300 focus:border-black focus:ring-black/20 hover:border-gray-400'
          }`}
        >
          {normalizeOptions(options).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          inputMode={inputMode}
          className={`w-full h-12 sm:h-14 px-3 sm:px-4 text-sm sm:text-base border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 ${
            isDark
              ? 'bg-black text-white border-white/30 focus:border-white focus:ring-white/20 hover:border-white/50 placeholder:text-gray-500 [&:-webkit-autofill]:bg-black [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_black_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_black_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_black_inset]'
              : 'bg-white text-black border-gray-300 focus:border-black focus:ring-black/20 hover:border-gray-400 placeholder:text-gray-400 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-black [&:-webkit-autofill]:[-webkit-text-fill-color:black] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_white_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_white_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_white_inset]'
          }`}
        />
      )}
      {description ? (
        <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
      ) : null}
      </div>
    </>
  )
}
