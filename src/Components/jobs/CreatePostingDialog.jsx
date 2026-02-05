import React from 'react'
import { useSelector } from 'react-redux'
import { useTheme } from '@/hooks/useTheme'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogClose } from '@/Components/ui/dialog'
import { Label } from '@/Components/ui/label'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { Select, SelectOption } from '@/Components/ui/select'
import apiClient from '@/lib/apiClient'

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']
const LOCATION_TYPES = ['On-site', 'Hybrid', 'Remote']
const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior']
const JOB_TYPES = ['Job', 'LIA']

export default function CreatePostingDialog({
  open,
  onClose,
  onSubmit,
  defaultCompany,
  postingTypes = JOB_TYPES,
  defaultJobType = 'Job',
  isSchool = false, // NEW: Flag to indicate if this is a school creating a job
}) {
  const { isDark } = useTheme()
  const accessToken = useSelector((state) => state.auth.accessToken)
  const [companies, setCompanies] = React.useState([])
  const [loadingCompanies, setLoadingCompanies] = React.useState(false)
  
  const [form, setForm] = React.useState({
    title: '',
    company: defaultCompany || '',
    companyId: '', // NEW: Store company organization ID
    location: '',
    employmentType: 'Full-time',
    locationType: 'Hybrid',
    seniority: 'Mid',
    jobType: postingTypes.includes(defaultJobType) ? defaultJobType : postingTypes[0] || 'Job',
    compensation: '',
    duration: '', // For LIA only
    mentor: '', // For LIA only
    supervisor: '', // For LIA only
    description: '',
  })

  // Fetch companies when dialog opens (for schools only)
  React.useEffect(() => {
    if (open && isSchool && accessToken) {
      setLoadingCompanies(true)
      apiClient
        .get('/api/v1/organizations/companies', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          setCompanies(response.data.companies || [])
        })
        .catch((error) => {
          console.error('Failed to fetch companies:', error)
        })
        .finally(() => {
          setLoadingCompanies(false)
        })
    }
  }, [open, isSchool, accessToken])

  React.useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        company: defaultCompany || prev.company,
        jobType: postingTypes.includes(defaultJobType) ? defaultJobType : prev.jobType,
      }))
    }
  }, [open, defaultCompany, postingTypes, defaultJobType])

  const updateField = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value }
      
      // If company dropdown changed, also update company name
      if (key === 'companyId' && isSchool) {
        const selectedCompany = companies.find((c) => c.id === value)
        if (selectedCompany) {
          updated.company = selectedCompany.name
        }
      }
      
      return updated
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.({ ...form })
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose?.() }}>
      <DialogContent className={`${!isDark ? 'bg-white text-black border-gray-200' : ''}`}>
        <DialogHeader>
          <DialogTitle>Create a new posting</DialogTitle>
          <DialogClose onClick={onClose} />
        </DialogHeader>
        <DialogBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="posting-title">Role title</Label>
              <Input
                id="posting-title"
                placeholder="e.g. Frontend Engineer"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="posting-company">
                Company {isSchool && <span className="text-red-500">*</span>}
              </Label>
              {isSchool ? (
                // Schools select from dropdown
                <Select
                  id="posting-company"
                  value={form.companyId}
                  onChange={(event) => updateField('companyId', event.target.value)}
                  className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                  required
                  disabled={loadingCompanies}
                >
                  <SelectOption value="">
                    {loadingCompanies ? 'Loading companies...' : 'Select a company'}
                  </SelectOption>
                  {companies.map((company) => (
                    <SelectOption key={company.id} value={company.id}>
                      {company.name}
                    </SelectOption>
                  ))}
                </Select>
              ) : (
                // Companies use text input (auto-filled from their org)
                <Input
                  id="posting-company"
                  placeholder="Your company"
                  value={form.company}
                  onChange={(event) => updateField('company', event.target.value)}
                  className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                  required
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="posting-location">Location</Label>
              <Input
                id="posting-location"
                placeholder="City, Country"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="posting-job-type">Posting type</Label>
                <Select
                  id="posting-job-type"
                  value={form.jobType}
                  onChange={(event) => updateField('jobType', event.target.value)}
                  className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                >
                  {(postingTypes.length ? postingTypes : JOB_TYPES).map((option) => (
                    <SelectOption key={option} value={option}>
                      {option}
                    </SelectOption>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="posting-employment-type">Employment</Label>
                <Select
                  id="posting-employment-type"
                  value={form.employmentType}
                  onChange={(event) => updateField('employmentType', event.target.value)}
                  className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                >
                  {EMPLOYMENT_TYPES.map((option) => (
                    <SelectOption key={option} value={option}>
                      {option}
                    </SelectOption>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="posting-location-type">Location mode</Label>
                <Select
                  id="posting-location-type"
                  value={form.locationType}
                  onChange={(event) => updateField('locationType', event.target.value)}
                  className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                >
                  {LOCATION_TYPES.map((option) => (
                    <SelectOption key={option} value={option}>
                      {option}
                    </SelectOption>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="posting-seniority">Seniority</Label>
                <Select
                  id="posting-seniority"
                  value={form.seniority}
                  onChange={(event) => updateField('seniority', event.target.value)}
                  className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                >
                  {SENIORITY_LEVELS.map((option) => (
                    <SelectOption key={option} value={option}>
                      {option}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            </div>

            {/* Show compensation field ONLY for Jobs, NOT for LIA */}
            {form.jobType !== 'LIA' && (
              <div className="grid gap-2">
                <Label htmlFor="posting-compensation">Compensation / stipend</Label>
                <Input
                  id="posting-compensation"
                  placeholder="e.g. $120K - $150K per year"
                  value={form.compensation}
                  onChange={(event) => updateField('compensation', event.target.value)}
                  className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                />
              </div>
            )}

            {/* Show LIA-specific fields ONLY for LIA */}
            {form.jobType === 'LIA' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="posting-duration">Duration *</Label>
                  <Input
                    id="posting-duration"
                    placeholder="e.g. 6 months, 3 months"
                    value={form.duration}
                    onChange={(event) => updateField('duration', event.target.value)}
                    className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="posting-mentor">Mentor</Label>
                    <Input
                      id="posting-mentor"
                      placeholder="e.g. Jane Doe"
                      value={form.mentor}
                      onChange={(event) => updateField('mentor', event.target.value)}
                      className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="posting-supervisor">Supervisor</Label>
                    <Input
                      id="posting-supervisor"
                      placeholder="e.g. John Smith"
                      value={form.supervisor}
                      onChange={(event) => updateField('supervisor', event.target.value)}
                      className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="posting-description">Description</Label>
              <textarea
                id="posting-description"
                placeholder="Add a short description"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                rows={4}
                className={`rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-gray-300 bg-gray-50 text-black'}`}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'}`}
                style={!isDark ? { backgroundColor: '#e5e7eb', color: '#000' } : undefined}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                className={`${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
                style={!isDark ? { backgroundColor: '#000000', color: '#ffffff' } : undefined}
              >
                Create posting
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
