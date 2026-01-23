import React from 'react'
import TypeaheadInput from './TypeaheadInput'
import { Button } from '@/Components/ui/button'

export default function SearchHero({
  title,
  keyword,
  location,
  onKeyword,
  onLocation,
  keywordSuggestions = [],
  locationSuggestions = [],
  onSearch,
  compact = false,
}) {
  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch?.()
    }
  }
  return (
    <div className={(compact ? 'min-h-[10vh]' : 'min-h-[40vh]') + ' text-white flex items-center justify-center px-6'}>
      <div className="max-w-5xl w-full">
        <div className={'flex flex-col items-center ' + (compact ? 'gap-3' : 'gap-6')}>
          <h1 className={(compact ? 'text-xl' : 'text-2xl md:text-3xl') + ' font-semibold'}>{title}</h1>
          <div className="w-full flex gap-3 items-center justify-center flex-col sm:flex-row">
            <TypeaheadInput
              value={keyword}
              onChange={onKeyword}
              suggestions={keywordSuggestions}
              placeholder="Keyword"
              className="sm:w-1/2"
              onKeyDown={handleKey}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
            <TypeaheadInput
              value={location}
              onChange={onLocation}
              suggestions={locationSuggestions}
              placeholder="Location"
              className="sm:w-1/2"
              onKeyDown={handleKey}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <Button
              onClick={onSearch}
              className="mt-3 sm:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-8 rounded-full font-medium"
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
