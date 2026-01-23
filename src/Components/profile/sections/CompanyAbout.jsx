import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectAuth } from '@/redux/store'
import { profileMerged } from '@/redux/slices/authSlice'
import { Button } from '@/Components/ui/button'
import { Card } from '@/Components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Textarea } from '@/Components/ui/textarea'
import { 
  MapPin, Mail, Phone, Link2, Briefcase, Building2, 
  Users, Calendar, Hash, Pencil, Globe, X, ChevronDown 
} from 'lucide-react'
import api from '@/lib/apiClient'

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Energy', 'Real Estate', 'Hospitality', 'Transportation',
  'Media', 'Telecommunications', 'Consulting', 'Legal', 'Agriculture',
  'Construction', 'Automotive', 'Aerospace', 'Pharmaceuticals', 'E-commerce',
  'Marketing', 'Advertising', 'Insurance', 'Banking', 'Government'
]

export default function CompanyAbout() {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const [editDialog, setEditDialog] = useState(false)
  const [formData, setFormData] = useState({})
  const [showIndustriesDropdown, setShowIndustriesDropdown] = useState(false)
  const [industriesSearchInput, setIndustriesSearchInput] = useState('')
  const industriesDropdownRef = useRef(null)

  const companyProfile = user?.companyProfile || {}

  // Close industries dropdown when clicking outside
  useEffect(() => {
    if (!showIndustriesDropdown) return

    const handleClickOutside = (event) => {
      if (industriesDropdownRef.current && !industriesDropdownRef.current.contains(event.target)) {
        setShowIndustriesDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showIndustriesDropdown])

  const handleEditCompanyInfo = () => {
    setFormData({
      companyName: companyProfile.companyName || user?.companyProfile?.companyName || '',
      contactPerson: companyProfile.contactPerson && companyProfile.contactPerson.trim() ? companyProfile.contactPerson : (user?.name ? `${user?.name?.first || ''} ${user?.name?.last || ''}`.trim() : ''),
      roles: companyProfile.roles || [],
      city: companyProfile.city || '',
      country: companyProfile.country || '',
      companyEmail: companyProfile.companyEmail || user?.email || '',
      companyPhone: companyProfile.companyPhone || user?.contact?.phone || '',
      companyRegNo: companyProfile.companyRegNo || '',
      aboutCompany: companyProfile.aboutCompany || '',
      website: companyProfile.website || user?.contact?.website || '',
      industries: companyProfile.industries || [],
      headcount: companyProfile.headcount || '',
      foundedYear: companyProfile.foundedYear || ''
    })
    setEditDialog(true)
  }

  const handleSaveCompanyInfo = async () => {
    try {
      // Merge with existing companyProfile to avoid losing data
      const payload = {
        companyProfile: {
          // Keep existing fields that aren't in the form
          ...companyProfile,
          // Update with form data
          companyName: formData.companyName?.trim() || '',
          contactPerson: formData.contactPerson?.trim() || '',
          roles: companyProfile.roles || [],  // Keep roles as-is (from registration)
          city: formData.city?.trim() || '',
          country: formData.country?.trim() || '',
          companyEmail: formData.companyEmail?.trim() || '',
          companyPhone: formData.companyPhone?.trim() || '',
          companyRegNo: formData.companyRegNo?.trim() || '',
          aboutCompany: formData.aboutCompany?.trim() || '',
          website: formData.website?.trim() || '',
          industries: Array.isArray(formData.industries) ? formData.industries : [],
          headcount: formData.headcount ? parseInt(formData.headcount) : undefined,
          foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined
        }
      }

      console.log('Sending payload:', payload) // Debug log
  const response = await api.put(`/users/${user.id}`, payload)
  console.log('Response (put):', response.data) // Debug log

  // Re-fetch full user object to ensure nested companyProfile is returned as stored by the backend
  const getResp = await api.get(`/users/${user.id}`)
  const fullUser = getResp.data
  console.log('Refetched full user:', fullUser)

  // Update Redux state with the full updated user data
  dispatch(profileMerged(fullUser))
      
      alert('Company information updated successfully!')
  // Update local UI state from the fresh user data
  setEditDialog(false)
  // Optionally update any local caches or state if necessary (Profile page listens to Redux changes)
      
      // No need to reload - Redux state is updated
    } catch (error) {
      console.error('Failed to update company info:', error)
      console.error('Error details:', error.response?.data) // More detailed error
      alert('Failed to update company information: ' + (error.response?.data?.message || error.message))
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Company Information</h3>
            <div className="text-sm text-muted-foreground">All company details visible here</div>
          </div>
          <Button size="sm" variant="outline" onClick={handleEditCompanyInfo}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Company Name</div>
              <div className="font-semibold text-base">{companyProfile.companyName || <span className="text-muted-foreground">Not provided</span>}</div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Contact Person</div>
              <div className="font-medium">{companyProfile.contactPerson || <span className="text-muted-foreground">Not provided</span>}</div>
            </div>
          </div>

          {/* Roles */}
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Role(s)</div>
              <div className="flex flex-wrap gap-2">
                {companyProfile.roles && companyProfile.roles.length > 0 ? (
                  companyProfile.roles.map((role, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">{role}</span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Location</div>
              <div>{[companyProfile.city, companyProfile.country].filter(Boolean).join(', ') || <span className="text-muted-foreground">Not provided</span>}</div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Email</div>
              {companyProfile.companyEmail ? (
                <a href={`mailto:${companyProfile.companyEmail}`} className="text-primary hover:underline">{companyProfile.companyEmail}</a>
              ) : (
                <div className="text-muted-foreground">Not provided</div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Phone</div>
              {companyProfile.companyPhone ? (
                <a href={`tel:${companyProfile.companyPhone}`} className="text-primary hover:underline">{companyProfile.companyPhone}</a>
              ) : (
                <div className="text-muted-foreground">Not provided</div>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Website</div>
              {companyProfile.website ? (
                <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{companyProfile.website.replace(/^https?:\/\/(www\.)?/, '')}</a>
              ) : (
                <div className="text-muted-foreground">Not provided</div>
              )}
            </div>
          </div>

          {/* Company Reg No */}
          <div className="flex items-start gap-3">
            <Hash className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Company Org/Reg No</div>
              <div className="font-mono text-sm">{companyProfile.companyRegNo || <span className="text-muted-foreground">Not provided</span>}</div>
            </div>
          </div>

          {/* About Company (full width) */}
          <div className="md:col-span-2 pt-2">
            <div className="text-xs text-muted-foreground mb-2">About Company</div>
            <p className="text-sm whitespace-pre-wrap">{companyProfile.aboutCompany || <span className="text-muted-foreground">Not provided</span>}</p>
          </div>

          {/* Industries */}
          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground mb-2">Industries</div>
            <div className="flex flex-wrap gap-2">
              {companyProfile.industries && companyProfile.industries.length > 0 ? (
                companyProfile.industries.map((industry, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">{industry}</span>
                ))
              ) : (
                <div className="text-muted-foreground">Not provided</div>
              )}
            </div>
          </div>

          {/* Company Stats */}
          <div className="md:col-span-2 pt-4 border-t flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Company Size</div>
              <div className="font-semibold">{companyProfile.headcount ? `${companyProfile.headcount} employees` : <span className="text-muted-foreground">Not provided</span>}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Founded</div>
              <div className="font-semibold">{companyProfile.foundedYear || <span className="text-muted-foreground">Not provided</span>}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Company Info Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Company Name - Non-editable but shown */}
            <div>
              <Label>Company Name <span className="text-xs text-muted-foreground">(From Registration)</span></Label>
              <Input
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Company Name"
              />
            </div>

            {/* Contact Person */}
            <div>
              <Label>Contact Person (Your Name)</Label>
              <Input
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            {/* Roles - Read Only */}
            <div>
              <Label>Role(s) in Company <span className="text-xs text-muted-foreground">(From Registration)</span></Label>
              <div className="p-3 bg-muted rounded-md border border-input">
                <div className="flex flex-wrap gap-2">
                  {formData.roles && Array.isArray(formData.roles) && formData.roles.length > 0 ? (
                    formData.roles.map((role, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">{role}</span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">Not set during registration</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Roles cannot be edited here. They were set during your company registration.</p>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Stockholm"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Sweden"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Email</Label>
                <Input
                  type="email"
                  value={formData.companyEmail || ''}
                  readOnly
                  disabled
                  className="bg-muted/60 cursor-not-allowed"
                  placeholder="contact@company.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Email is fixed from signup and cannot be edited here.</p>
              </div>
              <div>
                <Label>Company Phone</Label>
                <Input
                  type="tel"
                  value={formData.companyPhone || ''}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  placeholder="+46 123 456 789"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <Label>Company Website</Label>
              <Input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.company.com"
              />
            </div>

            {/* Company Reg No */}
            <div>
              <Label>Company Org/Reg No</Label>
              <Input
                value={formData.companyRegNo || ''}
                onChange={(e) => setFormData({ ...formData, companyRegNo: e.target.value })}
                placeholder="556789-0123"
              />
            </div>

            {/* About Company */}
            <div>
              <Label>About Company</Label>
              <Textarea
                value={formData.aboutCompany || ''}
                onChange={(e) => setFormData({ ...formData, aboutCompany: e.target.value })}
                className="focus-visible:ring-1 focus-visible:ring-primary/50"
                rows={4}
                placeholder="Tell us about your company, mission, and values..."
              />
            </div>

            {/* Industries - Searchable Multi-select Dropdown */}
            <div>
              <Label>Industries</Label>
              <div className="relative" ref={industriesDropdownRef}>
                {/* Search input - Dropdown trigger */}
                <div className="w-full p-0 bg-background border border-input rounded-md flex items-center">
                  <input
                    type="text"
                    placeholder="Type to search industries..."
                    value={industriesSearchInput}
                    onChange={(e) => {
                      setIndustriesSearchInput(e.target.value)
                      setShowIndustriesDropdown(true)
                    }}
                    onFocus={() => setShowIndustriesDropdown(true)}
                    className="flex-1 px-3 py-2 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <ChevronDown className={`h-4 w-4 mr-3 transition-transform ${showIndustriesDropdown ? 'rotate-180' : ''}`} />
                </div>

                {/* Filtered Dropdown menu */}
                {showIndustriesDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {(() => {
                      const filtered = INDUSTRY_OPTIONS.filter((industry) =>
                        industry.toLowerCase().includes(industriesSearchInput.toLowerCase())
                      )
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                            No industries found
                          </div>
                        )
                      }

                      return filtered.map((industry) => {
                        const isSelected = formData.industries?.includes(industry)
                        return (
                          <button
                            key={industry}
                            type="button"
                            onClick={() => {
                              const currentIndustries = Array.isArray(formData.industries) ? formData.industries : []
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  industries: currentIndustries.filter((ind) => ind !== industry)
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  industries: [...currentIndustries, industry]
                                })
                              }
                              // Clear search and close dropdown after selection
                              setIndustriesSearchInput('')
                              setShowIndustriesDropdown(false)
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors ${
                              isSelected ? 'bg-primary/10 text-primary font-medium' : ''
                            }`}
                          >
                            {industry}
                          </button>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>

              {/* Selected industries as chips */}
              {formData.industries && Array.isArray(formData.industries) && formData.industries.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.industries.map((industry, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20"
                    >
                      <span>{industry}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            industries: formData.industries.filter((ind) => ind !== industry)
                          })
                        }}
                        className="hover:opacity-70 transition-opacity"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Company Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Size (Employees)</Label>
                <Input
                  type="number"
                  value={formData.headcount || ''}
                  onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div>
                <Label>Founded Year</Label>
                <Input
                  type="number"
                  value={formData.foundedYear || ''}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                  placeholder="2020"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialog(false); setShowIndustriesDropdown(false); }}>Cancel</Button>
            <Button onClick={handleSaveCompanyInfo}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close dropdown when clicking outside */}
      {showIndustriesDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowIndustriesDropdown(false)}
        />
      )}
    </div>
  )
}
