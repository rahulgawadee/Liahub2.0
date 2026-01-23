import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth, selectProfile, selectUsersState } from '@/redux/store'
import { Button } from '@/Components/ui/button'
import { Card } from '@/Components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Textarea } from '@/Components/ui/textarea'
import { Plus, Trash2, MapPin, Mail, Phone, Globe, Briefcase, GraduationCap, Pencil, BookOpen, Code, Zap } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { PROGRAMME_OPTIONS } from '@/lib/programmeOptions'

export default function About({ readOnly = false, viewingUserId = null }) {
  const { user: currentUser } = useSelector(selectAuth)
  const profile = useSelector(selectProfile)
  const usersState = useSelector(selectUsersState)
  const [activeTab, setActiveTab] = useState('personal')
  const [editDialog, setEditDialog] = useState(null) // 'personal' or 'career'
  const [formData, setFormData] = useState({})

  // Determine which user data to display
  const viewedUser = readOnly && viewingUserId ? usersState.entitiesById[viewingUserId] : null
  const displayUser = viewedUser || currentUser
  const { isCompanyUser } = getDisplayNameWithSubtitle(displayUser)
  const isEducationManager = displayUser?.roles?.includes('education_manager') || displayUser?.primaryRole === 'education_manager'

  const handleEditPersonalInfo = () => {
    if (readOnly) return // Prevent editing when viewing others
    const rawName = currentUser?.rawName || currentUser?.name || profile?.name || currentUser?.profileName || currentUser?.username || ''
    const nameObj = typeof rawName === 'string'
      ? (() => {
          const parts = String(rawName).trim().split(/\s+/)
          return { first: parts.shift() || '', last: parts.join(' ') }
        })()
      : rawName
    setFormData({
      firstName: nameObj?.first || '',
      lastName: nameObj?.last || '',
      bio: currentUser?.social?.bio || '',
      about: currentUser?.social?.about || '',
      location: currentUser?.contact?.location || '',
      email: currentUser?.email || '',
      phone: currentUser?.contact?.phone || '',
      website: currentUser?.contact?.website || '',
      contactPerson: isCompanyUser ? (currentUser?.companyProfile?.contactPerson || '') : '',
      linkedin: currentUser?.social?.linkedin || '',
      github: currentUser?.social?.github || '',
      programme: currentUser?.staffProfile?.programme || currentUser?.staffProfile?.program || '',
    })
    setEditDialog('personal')
  }

  const handleSavePersonalInfo = async () => {
    try {
      const payload = {
        name: {
          first: formData.firstName,
          last: formData.lastName
        },
        social: {
          bio: formData.bio,
          about: formData.about,
          website: formData.website,
          linkedin: formData.linkedin,
          github: formData.github
        },
        contact: {
          location: formData.location,
          phone: formData.phone,
          website: formData.website
        },
      }
      
      // Add contact person for company users
      if (isCompanyUser && formData.contactPerson) {
        payload.companyProfile = { ...(currentUser?.companyProfile || {}), contactPerson: formData.contactPerson }
      }

      if (isEducationManager) {
        payload.staffProfile = { ...(currentUser?.staffProfile || {}), programme: formData.programme || '' }
      }

      await apiClient.put(`/users/${currentUser.id}/sections/personalInfo`, payload)
      alert('Personal info updated successfully!')
      setEditDialog(null)
      window.location.reload() // Refresh to see updates
    } catch (error) {
      console.error('Failed to update personal info:', error)
      alert('Failed to update personal info')
    }
  }

  const handleEditCareer = () => {
    if (readOnly) return // Prevent editing when viewing others
    const studentProfile = currentUser?.studentProfile || {}
    setFormData({
      experiences: studentProfile.experiences || [],
      education: studentProfile.education || [],
      skills: studentProfile.skills || [],
      languages: studentProfile.languages || []
    })
    setEditDialog('career')
  }

  const handleSaveCareer = async () => {
    try {
      const payload = {
        studentProfile: {
          experiences: formData.experiences,
          education: formData.education,
          skills: formData.skills,
          languages: formData.languages
        }
      }

      await apiClient.put(`/users/${currentUser.id}/sections/careerHighlights`, payload)
      alert('Career highlights updated successfully!')
      setEditDialog(null)
      window.location.reload() // Refresh to see updates
    } catch (error) {
      console.error('Failed to update career highlights:', error)
      alert('Failed to update career highlights')
    }
  }

  const addExperience = () => {
    setFormData({
      ...formData,
      experiences: [...(formData.experiences || []), { title: '', company: '', duration: '', description: '' }]
    })
  }

  const removeExperience = (index) => {
    const updated = [...formData.experiences]
    updated.splice(index, 1)
    setFormData({ ...formData, experiences: updated })
  }

  const updateExperience = (index, field, value) => {
    const updated = [...formData.experiences]
    updated[index][field] = value
    setFormData({ ...formData, experiences: updated })
  }

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...(formData.education || []), { institution: '', degree: '', duration: '', description: '' }]
    })
  }

  const removeEducation = (index) => {
    const updated = [...formData.education]
    updated.splice(index, 1)
    setFormData({ ...formData, education: updated })
  }

  const updateEducation = (index, field, value) => {
    const updated = [...formData.education]
    updated[index][field] = value
    setFormData({ ...formData, education: updated })
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 text-sm font-medium relative ${
            activeTab === 'personal' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          Personal Info
          {activeTab === 'personal' && (
            <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary" />
          )}
        </button>
        {/* Only show Career Highlights tab for non-company users */}
        {!isCompanyUser && (
          <button
            onClick={() => setActiveTab('career')}
            className={`px-4 py-2 text-sm font-medium relative ${
              activeTab === 'career' ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Career Highlights
            {activeTab === 'career' && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary" />
            )}
          </button>
        )}
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <Card className="p-6 space-y-6 bg-gradient-to-br from-background to-secondary/20">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={handleEditPersonalInfo} className="gap-2">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>

          {/* Bio & About */}
          <div className="space-y-4">
            {(displayUser?.social?.bio) && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Bio</h4>
                <p className="text-sm leading-relaxed">{displayUser?.social?.bio}</p>
              </div>
            )}

            {(displayUser?.social?.about) && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">{isCompanyUser ? 'About Company' : 'About'}</h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayUser?.social?.about}</p>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEducationManager && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Briefcase className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Education Manager</p>
                  <p className="text-sm break-all">
                    {typeof displayUser?.name === 'string'
                      ? displayUser?.name
                      : [displayUser?.name?.first, displayUser?.name?.last].filter(Boolean).join(' ') || 'Not provided'}
                  </p>
                </div>
              </div>
            )}
            {/* Email */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                <p className="text-sm break-all">{displayUser?.email || displayUser?.companyProfile?.companyEmail || displayUser?.schoolProfile?.schoolEmail || 'Not provided'}</p>
              </div>
            </div>

            {/* Phone */}
            {(displayUser?.contact?.phone || displayUser?.companyProfile?.companyPhone || displayUser?.schoolProfile?.schoolPhone) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
                  <p className="text-sm">{displayUser?.contact?.phone || displayUser?.companyProfile?.companyPhone || displayUser?.schoolProfile?.schoolPhone}</p>
                </div>
              </div>
            )}

            {/* Location */}
            {(displayUser?.contact?.location || displayUser?.companyProfile?.city || displayUser?.schoolProfile?.city) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</p>
                  <p className="text-sm">
                    {displayUser?.contact?.location || [displayUser?.companyProfile?.city, displayUser?.companyProfile?.country].filter(Boolean).join(', ') || [displayUser?.schoolProfile?.city, displayUser?.schoolProfile?.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Website */}
            {(displayUser?.contact?.website || displayUser?.companyProfile?.website || displayUser?.schoolProfile?.website) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Globe className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Website</p>
                  <a href={displayUser?.contact?.website || displayUser?.companyProfile?.website || displayUser?.schoolProfile?.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline break-all">
                    {(displayUser?.contact?.website || displayUser?.companyProfile?.website || displayUser?.schoolProfile?.website).replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              </div>
            )}

            {isEducationManager && (displayUser?.staffProfile?.programme || displayUser?.staffProfile?.program) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Programme</p>
                  <p className="text-sm break-all">{displayUser?.staffProfile?.programme || displayUser?.staffProfile?.program}</p>
                </div>
              </div>
            )}
          </div>

          {/* Company-Specific Info */}
          {isCompanyUser && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-primary">Company Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayUser?.companyProfile?.companyRegNo && (
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registration Number</p>
                    <p className="text-sm">{displayUser.companyProfile.companyRegNo}</p>
                  </div>
                )}

                {displayUser?.companyProfile?.foundedYear && (
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Founded Year</p>
                    <p className="text-sm">{displayUser.companyProfile.foundedYear}</p>
                  </div>
                )}

                {displayUser?.companyProfile?.headcount && (
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Headcount</p>
                    <p className="text-sm">{displayUser.companyProfile.headcount} employees</p>
                  </div>
                )}

                {displayUser?.companyProfile?.industries?.length > 0 && (
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Industries</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {displayUser.companyProfile.industries.map((ind, i) => (
                        <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* School-Specific Info */}
          {displayUser?.roles?.includes('school_admin') && displayUser?.schoolProfile && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-primary">School Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayUser?.schoolProfile?.schoolType && (
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">School Type</p>
                    <p className="text-sm">{displayUser.schoolProfile.schoolType}</p>
                  </div>
                )}

                {displayUser?.schoolProfile?.studentsCount && (
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Students Count</p>
                    <p className="text-sm">{displayUser.schoolProfile.studentsCount}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links */}
          {displayUser?.social?.highlights?.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-primary mb-3">Highlights</h4>
              <div className="flex flex-wrap gap-2">
                {displayUser.social.highlights.map((highlight, i) => (
                  <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Career Highlights Tab - Only for non-company users */}
      {!isCompanyUser && activeTab === 'career' && (
        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-br from-background to-secondary/20">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <h3 className="text-lg font-semibold">Career Highlights</h3>
              {!readOnly && (
                <Button size="sm" variant="outline" onClick={handleEditCareer} className="gap-2">
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              )}
            </div>

            <div className="space-y-8">
              {/* Experience */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h4 className="text-base font-semibold">Experience</h4>
                  {displayUser?.studentProfile?.experiences?.length > 0 && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{displayUser.studentProfile.experiences.length}</span>
                  )}
                </div>
                {displayUser?.studentProfile?.experiences?.length > 0 ? (
                  <div className="space-y-3">
                    {displayUser.studentProfile.experiences.map((exp, i) => (
                      <div key={i} className="p-4 rounded-lg bg-background/50 border-l-4 border-primary/50">
                        <div className="font-semibold text-sm">{exp.title || 'Untitled'}</div>
                        <div className="text-sm text-muted-foreground">{exp.company || 'Company'}</div>
                        {exp.location && <div className="text-xs text-muted-foreground">{exp.location}</div>}
                        {(exp.startDate || exp.duration) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {exp.duration || `${new Date(exp.startDate).toLocaleDateString()} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}`}
                          </div>
                        )}
                        {exp.description && <p className="text-sm mt-2 text-foreground/80">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No experience added yet</p>
                )}
              </div>

              {/* Education */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h4 className="text-base font-semibold">Education</h4>
                  {displayUser?.studentProfile?.education?.length > 0 && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{displayUser.studentProfile.education.length}</span>
                  )}
                </div>
                {displayUser?.studentProfile?.education?.length > 0 ? (
                  <div className="space-y-3">
                    {displayUser.studentProfile.education.map((edu, i) => (
                      <div key={i} className="p-4 rounded-lg bg-background/50 border-l-4 border-primary/50">
                        <div className="font-semibold text-sm">{edu.program || edu.degree || 'Program'}</div>
                        <div className="text-sm text-muted-foreground">{edu.organization || edu.institution || 'Institution'}</div>
                        {(edu.startYear || edu.endYear) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {edu.startYear}{edu.endYear ? ` - ${edu.endYear}` : ''}
                          </div>
                        )}
                        {edu.notes && <p className="text-sm mt-2 text-foreground/80">{edu.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No education added yet</p>
                )}
              </div>

              {/* Skills */}
              {displayUser?.studentProfile?.skills?.length > 0 && (
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    <h4 className="text-base font-semibold">Skills</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayUser.studentProfile.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specializations */}
              {displayUser?.studentProfile?.specializations?.length > 0 && (
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h4 className="text-base font-semibold">Specializations</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayUser.studentProfile.specializations.map((spec, i) => (
                      <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {displayUser?.studentProfile?.languages?.length > 0 && (
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h4 className="text-base font-semibold">Languages</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayUser.studentProfile.languages.map((lang, i) => (
                      <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Personal Info Edit Dialog */}
      <Dialog open={editDialog === 'personal'} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={2}
                placeholder="A short bio..."
              />
            </div>

            <div>
              <Label>About</Label>
              <Textarea
                value={formData.about || ''}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                rows={4}
                placeholder="Tell us more about yourself..."
              />
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>

            {isEducationManager && (
              <div>
                <Label>NBI/Commercial Administration program</Label>
                <select
                  value={formData.programme || ''}
                  onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select programme</option>
                  {PROGRAMME_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>Website</Label>
              <Input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
            
            {isCompanyUser && (
              <div>
                <Label>Contact Person Name</Label>
                <Input
                  value={formData.contactPerson || ''}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Contact person name"
                />
              </div>
            )}

            <div>
              <Label>LinkedIn</Label>
              <Input
                type="url"
                value={formData.linkedin || ''}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <Label>GitHub</Label>
              <Input
                type="url"
                value={formData.github || ''}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                placeholder="https://github.com/yourusername"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleSavePersonalInfo}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Career Highlights Edit Dialog */}
      <Dialog open={editDialog === 'career'} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle>Edit Career Highlights</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Experience Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Experience</Label>
                <Button size="sm" variant="outline" onClick={addExperience}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.experiences?.map((exp, index) => (
                  <Card key={index} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Label className="text-sm font-medium">Experience {index + 1}</Label>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeExperience(index)}
                        className="h-6 w-6"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Input
                      placeholder="Job Title"
                      value={exp.title || ''}
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                    />
                    <Input
                      placeholder="Company"
                      value={exp.company || ''}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    />
                    <Input
                      placeholder="Duration (e.g., Jan 2020 - Present)"
                      value={exp.duration || ''}
                      onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                    />
                    <Textarea
                      placeholder="Description"
                      value={exp.description || ''}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </Card>
                ))}
              </div>
            </div>

            {/* Education Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Education</Label>
                <Button size="sm" variant="outline" onClick={addEducation}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.education?.map((edu, index) => (
                  <Card key={index} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Label className="text-sm font-medium">Education {index + 1}</Label>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeEducation(index)}
                        className="h-6 w-6"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Input
                      placeholder="Degree (e.g., Bachelor of Science)"
                      value={edu.degree || ''}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    />
                    <Input
                      placeholder="Institution"
                      value={edu.institution || ''}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    />
                    <Input
                      placeholder="Duration (e.g., 2016 - 2020)"
                      value={edu.duration || ''}
                      onChange={(e) => updateEducation(index, 'duration', e.target.value)}
                    />
                    <Textarea
                      placeholder="Description"
                      value={edu.description || ''}
                      onChange={(e) => updateEducation(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </Card>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <Label className="text-base">Skills (comma-separated)</Label>
              <Textarea
                value={formData.skills?.join(', ') || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="JavaScript, React, Node.js, Python..."
                rows={2}
              />
            </div>

            {/* Languages */}
            <div>
              <Label className="text-base">Languages (comma-separated)</Label>
              <Textarea
                value={formData.languages?.join(', ') || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="English, Spanish, French..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveCareer}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
