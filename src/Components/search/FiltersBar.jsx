import React from 'react'

export default function FiltersBar({ filters = {}, onChange, onReset, options = {} }) {
  const set = (k, v) => onChange?.({ ...filters, [k]: v })
  const pill = (label, k, values) => (
    <div className="relative">
      <select
        value={filters[k] || ''}
        onChange={(e)=> set(k, e.target.value || undefined)}
        className="appearance-none bg-gray-900 text-gray-200 border border-gray-700 rounded-full px-4 py-2.5 pr-10 text-sm hover:bg-gray-800 hover:border-gray-600 transition-all cursor-pointer focus:outline-none focus:border-blue-500"
      >
        <option value="">{label}</option>
        {values.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )

  const {
    locationType = ['Remote', 'Hybrid', 'On-site'],
    seniority = ['Junior', 'Mid', 'Senior'],
    employmentType = ['All Jobs', 'Full-time', 'Part-time', 'Contract', 'Internship'],
    company = [],
  } = options

  return (
    <div className="flex items-center gap-3 flex-wrap py-4 border-b border-gray-800">
      {pill('Location Type', 'locationType', locationType)}
      {pill('Seniority', 'seniority', seniority)}
      {pill('Employment Type', 'employmentType', employmentType)}
      {company.length > 0 && pill('Company', 'company', company)}
      <button 
        onClick={()=>onReset?.()} 
        className="text-gray-400 hover:text-white text-sm font-medium transition-colors ml-2"
      >
        Reset
      </button>
    </div>
  )
}
