import React from 'react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectItem } from '../ui/select'

const normalizeOptions = (options = []) =>
  options.map((opt) =>
    typeof opt === 'string' ? { value: opt.toLowerCase(), label: opt } : opt
  )

export function FormField({ entity, field, value, onChange }) {
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
    <div className="grid gap-2">
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium text-gray-300">
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
          className="neomorph-input border border-gray-600/40 bg-[#3a3a3a] text-gray-100 h-11 focus:border-gray-400/60 focus:ring-1 focus:ring-gray-400/30"
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
          className="neomorph-input border border-gray-600/40 bg-[#3a3a3a] text-gray-100 placeholder:text-gray-500 h-11 focus:border-gray-400/60 focus:ring-1 focus:ring-gray-400/30"
        />
      )}
      {description ? (
        <p className="text-xs text-gray-500">{description}</p>
      ) : null}
    </div>
  )
}
