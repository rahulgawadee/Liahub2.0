import React, { useState } from 'react'
import { Input } from '@/Components/ui/input'
import { Building2, MapPin, Search, Briefcase, X, ChevronDown, Filter } from 'lucide-react'

export default function ExploreSearchBar({ value, onChange, onSearch, locations = [], industries = [], domains = [] }){
  const [kw, setKw] = useState(value?.keyword || '')
  const [location, setLocation] = useState(value?.location || 'all')
  const [industry, setIndustry] = useState(value?.industry || 'all')
  const [domain, setDomain] = useState(value?.domain || 'all')

  const handleKeywordChange = (e) => {
    const newKw = e.target.value
    setKw(newKw)
    const query = {
      keyword: newKw,
      entity: 'company',
      location: location !== 'all' ? location : undefined,
      industry: industry !== 'all' ? industry : undefined,
      domain: domain !== 'all' ? domain : undefined,
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
      domain: domain !== 'all' ? domain : undefined,
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
      domain: domain !== 'all' ? domain : undefined,
    }
    onChange?.(query)
  }

  const handleDomainChange = (e) => {
    const newDomain = e.target.value
    setDomain(newDomain)
    const query = {
      keyword: kw,
      entity: 'company',
      location: location !== 'all' ? location : undefined,
      industry: industry !== 'all' ? industry : undefined,
      domain: newDomain !== 'all' ? newDomain : undefined,
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
      domain: domain !== 'all' ? domain : undefined,
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
      domain: domain !== 'all' ? domain : undefined,
    }
    onChange?.(query)
  }

  const clearDomain = () => {
    setDomain('all')
    const query = {
      keyword: kw,
      entity: 'company',
      location: location !== 'all' ? location : undefined,
      industry: industry !== 'all' ? industry : undefined,
      domain: undefined,
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
      domain: domain !== 'all' ? domain : undefined,
    }
    onChange?.(query)
  }

  const hasActiveFilters = location !== 'all' || industry !== 'all' || domain !== 'all' || kw.trim()

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="rounded-2xl bg-card shadow-sm p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-center transition-all hover:shadow-md">
        <div className="md:col-span-2 flex items-center gap-3">
          <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/10 text-blue-600">
            <Search className="h-6 w-6 text-blue-500" />
          </div>
          <Input 
            placeholder="Search companies, people, or roles..." 
            value={kw} 
            onChange={handleKeywordChange} 
            className="h-12 text-base border-muted-foreground/20 focus-visible:ring-primary/20" 
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/10 text-blue-600">
            <MapPin className="h-5 w-5 text-blue-500" />
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
          <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/10 text-blue-600">
            <Briefcase className="h-5 w-5 text-blue-500" />
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

        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/10 text-blue-600">
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
          <div className="relative w-full">
            <select 
              value={domain} 
              onChange={handleDomainChange} 
              className="w-full h-12 appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Any Domain</option>
              {domains.map((option)=>(
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
              <Filter className="h-3 w-3 text-blue-500" />
              <span>Filters:</span>
            </div>
          {kw.trim() && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm text-blue-700 rounded-full text-sm font-medium border border-white/10">
              <span>{kw}</span>
              <button
                onClick={handleClearKeyword}
                className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full p-0.5 transition"
              >
                <X className="h-3.5 w-3.5 text-blue-500" />
              </button>
            </div>
          )}
          {location !== 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm text-blue-700 rounded-full text-sm font-medium border border-white/10">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span>{location}</span>
              <button
                onClick={clearLocation}
                className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full p-0.5 transition"
              >
                <X className="h-3.5 w-3.5 text-blue-500" />
              </button>
            </div>
          )}
          {industry !== 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm text-blue-700 rounded-full text-sm font-medium border border-white/10">
               <Briefcase className="h-3.5 w-3.5 text-blue-500" />
              <span>{industry}</span>
              <button
                onClick={clearIndustry}
                className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full p-0.5 transition"
              >
                <X className="h-3.5 w-3.5 text-blue-500" />
              </button>
            </div>
          )}
          {domain !== 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm text-blue-700 rounded-full text-sm font-medium border border-white/10">
               <Building2 className="h-3.5 w-3.5 text-blue-500" />
              <span>{domain}</span>
              <button
                onClick={clearDomain}
                className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full p-0.5 transition"
              >
                <X className="h-3.5 w-3.5 text-blue-500" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
