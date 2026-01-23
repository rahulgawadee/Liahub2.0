import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import DocumentViewModal from '@/Components/documents/DocumentViewModal'
import { FileText, ArrowUpRight, CheckCircle2, Briefcase, Building, HardHat, Users, MoreVertical, Edit, Share, Copy, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/Components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogClose } from '@/Components/ui/dialog'
import { Button } from '@/Components/ui/button'
import { useSelector } from 'react-redux'
import api from '@/lib/apiClient'

const DEFAULT_PDFS = [
  {
    id: 'benefits-en',
    title: 'LIA Internship Benefits (English)',
    description: 'Key advantages of collaborating with LiaHub for internship programmes.',
    url: '/pdfs/LIA_Internship_Benefits_English.pdf',
  },
  {
    id: 'welcome-en',
    title: 'Welcome to NBI Handelsakademin (English)',
    description: 'English onboarding brief for supervisors partnering with LiaHub.',
  url: '/pdfs/Welcome%20to%20NBI_Handelsakademin%20as%20LIA%20supervisor%20%281%29.pdf',
  },
  {
    id: 'welcome-sv',
    title: 'Välkommen till NBI Handelsakademin (Svenska)',
    description: 'Svensk introduktion för handledare inom LiaHub-samarbetet.',
    url: '/pdfs/V%C3%A4lkommen%20till%20NBI_Handelsakademin%20som%20LIA-handledare%20-%20svenska.pdf',
  },
]

const REQUIREMENT_SECTIONS = [
  {
    id: 'technical-supervision',
    title: 'Technical Supervision',
    icon: HardHat,
    iconName: 'HardHat',
    color: 'blue',
    summary: 'Assign a qualified supervisor who stays closely involved throughout the internship.',
    items: [
      'Each intern must have an assigned technical supervisor.',
      'Share a professional profile (e.g. LinkedIn) to verify expertise.',
      'Supervisors must hold a formal role within your organisation.',
      'Coordinate supervision ratios with LiaHub to maintain quality support.',
    ],
  },
  {
    id: 'team-environment',
    title: 'Team & Work Environment',
    icon: Users,
    iconName: 'Users',
    color: 'green',
    summary: 'Integrate interns into genuine teams and day-to-day collaboration.',
    items: [
      'Place interns within established teams instead of intern-only pods.',
      'Provide regular interaction with colleagues, on-site or via digital channels.',
    ],
  },
  {
    id: 'company-registration',
    title: 'Company Registration',
    icon: Building,
    iconName: 'Building',
    color: 'amber',
    summary: 'Submit the correct registration evidence to match your region.',
    items: [
      'Sweden & Scandinavia: supply a valid organisationsnummer.',
      'Other EU countries: provide the national registration number plus documentation.',
      'Outside the EU: share the equivalent registration number and supporting document.',
    ],
  },
  {
    id: 'internship-structure',
    title: 'Internship Structure',
    icon: Briefcase,
    iconName: 'Briefcase',
    color: 'purple',
    summary: 'Clarify scope, delivery model, and alignment with LiaHub focus areas.',
    items: [
      'Confirm whether the internship is on-site, remote, or hybrid.',
      'Ensure assignments align with AI, System, Web Development, or Data Engineering.',
    ],
  },
]

const LIST_ITEM_CLASS = 'space-y-2 text-sm text-muted-foreground'

const COLOR_VARIANTS = {
  blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
  green: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
  amber: 'from-amber-500/10 to-amber-500/5 text-amber-600',
  purple: 'from-purple-500/10 to-purple-500/5 text-purple-600',
}

const RequirementCard = ({ title, summary, items, icon: Icon, color = 'blue' }) => {
  const colorClass = COLOR_VARIANTS[color] || COLOR_VARIANTS.blue

  return (
    <Card className="group h-full overflow-hidden border-0 bg-gradient-to-br from-background/80 to-background/90 shadow-md shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colorClass} opacity-80`} />
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`rounded-full bg-gradient-to-br ${colorClass} p-2`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        </div>
        {summary ? <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p> : null}
      </CardHeader>
      <CardContent>
        <ul className={LIST_ITEM_CLASS}>
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

const ResourceCard = ({ title, description, onOpen }) => (
  <Card
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onOpen()
      }
    }}
    className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden border-0 bg-gradient-to-br from-background/95 to-background/90 p-5 text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
  >
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-sm">
        <FileText className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description ? <p className="text-sm leading-snug text-muted-foreground">{description}</p> : null}
      </div>
    </div>
    <div className="mt-6 flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-medium text-primary shadow-sm transition-all group-hover:bg-primary/10 group-hover:gap-3">
      <span>Open document</span>
      <ArrowUpRight className="h-4 w-4" />
    </div>
  </Card>
)

export default function LiaInfoCard({ pdfs = DEFAULT_PDFS }) {
  const user = useSelector(state => state.auth.user)
  const isTeacherAdmin = user?.entity === 'school' && (user?.roles?.includes('school_admin') || user?.roles?.includes('education_manager'))

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [sections, setSections] = useState(REQUIREMENT_SECTIONS)
  const [currentPdfs, setCurrentPdfs] = useState(pdfs)
  const [activePdf, setActivePdf] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('Internship Collaboration Requirements')
  const [description, setDescription] = useState('A shared framework to guarantee meaningful placements. Review the expectations to keep interns supported, ensure compliance and deliver the workplace experience LiaHub stands behind.')
  const [lastUpdated, setLastUpdated] = useState('October 2025')

  // Fetch LIA Essentials from backend
  useEffect(() => {
    const fetchLiaEssentials = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/dashboard/lia-essentials')
        
        if (data) {
          // Use backend data if available
          if (data.title) setTitle(data.title)
          if (data.description) setDescription(data.description)
          if (data.lastUpdated) setLastUpdated(data.lastUpdated)
          if (data.requirementSections && data.requirementSections.length > 0) {
            // Map backend format to frontend format
            const mappedSections = data.requirementSections.map(section => ({
              ...section,
              iconName: section.icon, // Keep the string name for saving
              // Map icon name to actual icon component
              icon: section.icon === 'HardHat' ? HardHat :
                    section.icon === 'Users' ? Users :
                    section.icon === 'Building' ? Building :
                    section.icon === 'Briefcase' ? Briefcase :
                    HardHat,
              // Convert items from {text: string} to string array
              items: section.items.map(item => typeof item === 'string' ? item : item.text)
            }))
            setSections(mappedSections)
          }
          if (data.pdfResources && data.pdfResources.length > 0) {
            setCurrentPdfs(data.pdfResources)
          }
        }
        // If no data, use defaults (already set in state)
      } catch (error) {
        console.error('Error fetching LIA essentials:', error)
        // Use defaults on error
      } finally {
        setLoading(false)
      }
    }

    fetchLiaEssentials()
  }, [])

  const pdfList = useMemo(() => currentPdfs.filter((pdf) => pdf?.url), [currentPdfs])

  const handleOpenPdf = (pdf) => {
    if (!pdf?.url) return
    setActivePdf({ name: pdf.title, blobUrl: pdf.url })
  }

  const handleEdit = () => {
    setIsEditDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Prepare data for backend
      const payload = {
        title,
        description,
        lastUpdated,
        requirementSections: sections.map(section => ({
          id: section.id,
          title: section.title,
          icon: section.iconName || section.icon, // Use iconName (string) if available, fallback to icon
          color: section.color,
          summary: section.summary,
          items: section.items.map(item => ({ text: item }))
        })),
        pdfResources: currentPdfs.map(pdf => ({
          id: pdf.id,
          title: pdf.title,
          description: pdf.description,
          url: pdf.url,
          fileName: pdf.fileName
        })),
        visibility: 'company'
      }

      await api.put('/dashboard/lia-essentials', payload)
      
      setIsEditDialogOpen(false)
      
      // Show success message
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('notification', {
          detail: { message: 'LIA Essentials updated successfully', type: 'success' }
        })
        window.dispatchEvent(event)
      }
    } catch (error) {
      console.error('Error saving LIA essentials:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to last saved state would require re-fetching, or keep original state
    // For simplicity, just close the dialog
    setIsEditDialogOpen(false)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LIA Internship Requirements',
        text: 'Check out the LIA internship collaboration requirements.',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard')
    }
  }

  const handleCopy = () => {
    const text = document.querySelector('.lia-info-card')?.innerText || 'LIA Info Content'
    navigator.clipboard.writeText(text)
    alert('Content copied to clipboard')
  }

  const updateSection = (index, field, value) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const updateItem = (sectionIndex, itemIndex, value) => {
    setSections(prev => prev.map((s, i) => 
      i === sectionIndex 
        ? { ...s, items: s.items.map((item, j) => j === itemIndex ? value : item) } 
        : s
    ))
  }

  const updatePdf = (index, field, value) => {
    setCurrentPdfs(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const handlePdfUpload = (index, file) => {
    if (file) {
      const url = URL.createObjectURL(file)
      updatePdf(index, 'url', url)
      updatePdf(index, 'fileName', file.name)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/30 shadow-lg shadow-black/10">
        <CardContent className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading LIA Essentials...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/30 shadow-lg shadow-black/10 lia-info-card">
        <div className="absolute inset-0 -z-10 bg-[url('/assets/grid-pattern.svg')] opacity-[0.015]" />
        <CardHeader className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <span className="inline-flex items-center text-2xl rounded-full bg-primary/10 px-4 py-2  font-semibold uppercase tracking-wide text-primary">
              Lia Essentials
            </span>
            <CardTitle className="text-xl font-semibold text-foreground text-center">
              {title}
            </CardTitle>
          </div>
          <div className="hidden sm:block self-end">
            <span className="rounded-md bg-background/90 px-3 py-1 text-xs font-normal text-muted-foreground shadow-sm">
              Last updated: {lastUpdated}
            </span>
          </div>
          {isTeacherAdmin && (
            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <div className="relative max-w-3xl rounded-xl bg-primary/5 p-4 shadow-sm">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-4 lg:grid-cols-2">
            {sections.map((section) => (
              <RequirementCard key={section.id} {...section} />
            ))}
          </div>

          {pdfList.length ? (
            <div className="space-y-5 rounded-xl bg-muted/5 p-6 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground">Official Documentation</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep these references on hand when sharing the LiaHub framework with your internal stakeholders.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pdfList.map((pdf) => (
                  <ResourceCard
                    key={pdf.id}
                    title={pdf.title}
                    description={pdf.description}
                    onOpen={() => handleOpenPdf(pdf)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit LIA Requirements</DialogTitle>
            <DialogClose onClick={() => setIsEditDialogOpen(false)} />
          </DialogHeader>
          <DialogBody>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-6 text-foreground">General Information</h3>
                <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      placeholder="Internship Collaboration Requirements"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-none"
                      placeholder="A shared framework to guarantee meaningful placements..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Last Updated</label>
                    <input
                      type="text"
                      value={lastUpdated}
                      onChange={(e) => setLastUpdated(e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      placeholder="October 2025"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6 text-foreground">Edit Requirements</h3>
                <div className="space-y-6">
                  {sections.map((section, index) => (
                    <div key={section.id} className="space-y-4 p-6 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Section Title</label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                          placeholder="Section Title"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Summary</label>
                        <textarea
                          value={section.summary}
                          onChange={(e) => updateSection(index, 'summary', e.target.value)}
                          className="w-full px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-none"
                          placeholder="Section Summary"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Requirements</label>
                        {section.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateItem(index, i, e.target.value)}
                              className="flex-1 px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                              placeholder={`Requirement ${i + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6 text-foreground">Edit Documentation</h3>
                <div className="space-y-6">
                  {currentPdfs.map((pdf, index) => (
                    <div key={pdf.id} className="space-y-4 p-6 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Document Title</label>
                        <input
                          type="text"
                          value={pdf.title}
                          onChange={(e) => updatePdf(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                          placeholder="PDF Title"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <textarea
                          value={pdf.description}
                          onChange={(e) => updatePdf(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-none"
                          placeholder="PDF Description"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Upload PDF</label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => handlePdfUpload(index, e.target.files[0])}
                          className="w-full px-3 py-2 bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {pdf.fileName && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Uploaded: {pdf.fileName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t">
                <Button variant="outline" onClick={handleCancel} className="px-6" disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="px-6" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <DocumentViewModal file={activePdf} onClose={() => setActivePdf(null)} />
    </>
  )
}
