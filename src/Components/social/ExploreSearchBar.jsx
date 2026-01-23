import React, { useState } from 'react'
import { Input } from '@/Components/ui/input'
import { Building2, MapPin, Search, Briefcase, X, ChevronDown, Filter } from 'lucide-react'

export default function ExploreSearchBar({ value, onChange, onSearch, locations = [], industries = [] }){
  const [kw, setKw] = useState(value?.keyword || '')
  const [location, setLocation] = useState(value?.location || 'all')
  const [industry, setIndustry] = useState(value?.industry || 'all')

  const handleKeywordChange = (e) => {
    const newKw = e.target.value
    setKw(newKw)
    const query = {
      keyword: newKw,
      entity: 'company',
      location: location !== 'all' ? location : undefined,
      industry: industry !== 'all' ? industry : undefined,
    }
    onChange?.(query)
  }

  const handleLocationChange = (e) => {
    const newLocation = e.target.value
    setLocation(newLocation)
    const query = {
      keyword: kw,
      entity: 'company',
      location: newLocation !== 'all' ? newLocation : undefined,
      industry: industry !== 'all' ? industry : undefined,
    }
    onChange?.(query)
  }

  const handleIndustryChange = (e) => {
    const newIndustry = e.target.value
    setIndustry(newIndustry)
    const query = {
      keyword: kw,
      entity: 'company',
      location: location !== 'all' ? location : undefined,
      industry: newIndustry !== 'all' ? newIndustry : undefined,
    }
    onChange?.(query)
  }

  const clearLocation = () => {
    setLocation('all')
    const query = {
      keyword: kw,
      entity: 'company',
      location: undefined,
      industry: industry !== 'all' ? industry : undefined,
    }
    onChange?.(query)
  }

  const clearIndustry = () => {
    setIndustry('all')
    const query = {
      keyword: kw,
      entity: 'company',
      location: location !== 'all' ? location : undefined,
      industry: undefined,
    }
    onChange?.(query)
  }

  const handleClearKeyword = () => {
    setKw('')
    const query = {
      keyword: '',
      entity: 'company',
      location: location !== 'all' ? location : undefined,
      industry: industry !== 'all' ? industry : undefined,
    }
    onChange?.(query)
  }

  const hasActiveFilters = location !== 'all' || industry !== 'all' || kw.trim()

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="rounded-2xl bg-card shadow-sm p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center transition-all hover:shadow-md">
        <div className="md:col-span-2 flex items-center gap-3">
          <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
            <Search className="h-6 w-6" />
          </div>
          <Input 
            placeholder="Search companies, people, or roles..." 
            value={kw} 
            onChange={handleKeywordChange} 
            className="h-12 text-base border-muted-foreground/20 focus-visible:ring-primary/20" 
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-muted/50 text-muted-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="relative w-full">
            <select 
              value={location} 
              onChange={handleLocationChange} 
              className="w-full h-12 appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Any Location</option>
              {locations.map((option)=>(
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-muted/50 text-muted-foreground">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="relative w-full">
            <select 
              value={industry} 
              onChange={handleIndustryChange} 
              className="w-full h-12 appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Any Industry</option>
              {industries.map((option)=>(
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center px-1">
            <div className="text-sm text-muted-foreground mr-2 flex items-center gap-1">
                <Filter className="h-3 w-3" />
                <span>Filters:</span>
            </div>
          {kw.trim() && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/10 transition-colors hover:bg-primary/15">
              <span>{kw}</span>
              <button
                onClick={handleClearKeyword}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {location !== 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-900/30">
              <MapPin className="h-3.5 w-3.5" />
              <span>{location}</span>
              <button
                onClick={clearLocation}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {industry !== 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-100 dark:border-purple-900/30">
               <Briefcase className="h-3.5 w-3.5" />
              <span>{industry}</span>
              <button
                onClick={clearIndustry}
                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
