import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  setActiveSection,
  selectActiveSection,
  selectSectionData,
  selectDashboardStatus,
  createSchoolRecord,
  updateSchoolRecord,
  deleteSchoolRecord,
  fetchStudentDashboard,
} from '@/redux/slices/tableSlice'
import { selectAuth } from '@/redux/store'
import {
  SECTION_DEFINITIONS,
  SECTION_SEQUENCE,
  getSectionsForEntity,
  canAddToSection,
  canEditSection,
  getStatusOptions,
  buildInitialValuesForSection,
  buildRecordPayloadForSection,
  getFormFieldsForSection,
  formatDateYYMMDD,
  DATE_FORMAT_YEARMONTHDAY_SHORT,
  SECTION_KEYS,
} from './sectionDefinitions'
import { buildProgrammeOptions } from '@/lib/programmeOptions'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/Components/ui/dialog'
import { Label } from '@/Components/ui/label'
import { Select, SelectOption } from '@/Components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'
import { Search, Upload, FileSpreadsheet, Edit, Trash2, Eye, User, GraduationCap, Users, BookOpen, Shield, Building2, Briefcase, Building } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import VerificationBadge from '@/Components/shared/VerificationBadge'
import { getImageUrl } from '@/lib/imageUtils'
import { StatusCard } from '@/Components/ui/status-card'

const STATUS_CLASSES = {
  Active: 'bg-emerald-500/15 text-emerald-300',
  Inactive: 'bg-slate-500/15 text-slate-300',
  Pending: 'bg-amber-500/15 text-amber-300',
}

const StatusPill = ({ status }) => {
  const classes = STATUS_CLASSES[status] || STATUS_CLASSES.Inactive
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${classes}`}>{status || 'Unknown'}</span>
}

const normalizeProgrammeValue = (value) => {
  const raw = String(value || '')
  if (!raw) return ''
  return raw
    .toLowerCase()
    .replace(/^nbi\s*\/\s*/i, '')
    .replace(/\bprogram(me)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const formatColumnValue = (column, value) => {
  if (column?.format === DATE_FORMAT_YEARMONTHDAY_SHORT) return formatDateYYMMDD(value)
  return value
}

const AvatarCell = ({ value, imageUrl, userId, onClick }) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-7 w-7 cursor-pointer" onClick={onClick}>
        <AvatarImage src={imageUrl ? getImageUrl(imageUrl) : undefined} alt={value} />
        <AvatarFallback className="text-xs">
          {value ? value.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
        </AvatarFallback>
      </Avatar>
      <span className="cursor-pointer hover:underline" onClick={onClick}>{value || '—'}</span>
    </div>
  )
}

const renderCellContent = (column, row, onNavigate) => {
  const primaryValue = row[column.key]

  // Handle avatar + profile link columns
  if (column.showAvatar && column.linkToProfile) {
    const userId = row.id || row.userId || row._id
    const imageUrl = row.avatarUrl || row.profileImage || row.avatar
    const handleClick = (e) => {
      e.stopPropagation()
      if (userId && onNavigate) {
        onNavigate(`/profile/${userId}`)
      }
    }
    return <AvatarCell value={primaryValue} imageUrl={imageUrl} userId={userId} onClick={handleClick} />
  }

  if (column.variant === 'status') {
    return <StatusPill status={primaryValue} />
  }

  const renderValue = (value) =>
    value === null || value === undefined || value === '' ? (
      <span className="text-muted-foreground">—</span>
    ) : (
      <span>{formatColumnValue(column, value)}</span>
    )

  if (column.key === 'name' && row.sectionKey === SECTION_KEYS.students) {
    const assignmentStatus = String(row.assignmentStatus || '').toLowerCase()
    const isVerified = Boolean(row.verified) || assignmentStatus === 'confirmed'
    const isPending = assignmentStatus === 'pending'
    const isRejected = assignmentStatus === 'rejected'
    
    if (column.showAvatar && column.linkToProfile) {
      const userId = row.id || row.userId || row._id
      const imageUrl = row.avatarUrl || row.profileImage || row.avatar
      const handleClick = (e) => {
        e.stopPropagation()
        if (userId && onNavigate) {
          onNavigate(`/profile/${userId}`)
        }
      }
      return (
        <div className="flex items-center gap-2">
          <AvatarCell value={primaryValue} imageUrl={imageUrl} userId={userId} onClick={handleClick} />
          {isVerified ? (
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
              Verified
            </span>
          ) : isPending ? (
            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
              Pending confirmation
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
              Rejected
            </span>
          ) : null}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        {renderValue(primaryValue)}
        {isVerified ? (
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
            Verified
          </span>
        ) : isPending ? (
          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
            Pending confirmation
          </span>
        ) : isRejected ? (
          <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
            Rejected
          </span>
        ) : null}
      </div>
    )
  }

  // Show verification badge for company business name if verified
  if (column.key === 'business' && (row.sectionKey === SECTION_KEYS.companies || row.sectionKey === SECTION_KEYS.leadCompanies)) {
    const verified = row.verified || row.contractSigned
    
    if (column.showAvatar && column.linkToProfile) {
      const userId = row.id || row.userId || row._id
      const imageUrl = row.avatarUrl || row.profileImage || row.avatar
      const handleClick = (e) => {
        e.stopPropagation()
        if (userId && onNavigate) {
          onNavigate(`/profile/${userId}`)
        }
      }
      return (
        <div className="flex items-center gap-2">
          <AvatarCell value={primaryValue} imageUrl={imageUrl} userId={userId} onClick={handleClick} />
          {verified ? <VerificationBadge verified={true} size="sm" /> : null}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        {renderValue(primaryValue)}
        {verified ? <VerificationBadge verified={true} size="sm" /> : null}
      </div>
    )
  }

  if (column.secondaryKey) {
    const secondaryValue = row[column.secondaryKey]
    const secondaryLabel = column.secondaryLabel || 'Details'
    return (
      <div className="flex flex-col gap-1 leading-snug">
        {renderValue(primaryValue)}
        <span className="text-xs text-muted-foreground">
          {secondaryLabel}: {secondaryValue ? formatColumnValue(column, secondaryValue) : '—'}
        </span>
      </div>
    )
  }

  return renderValue(primaryValue)
}

const buildTitle = (column, row) => {
  const values = []
  const primary = row[column.key]
  if (primary) values.push(String(primary))
  if (column.secondaryKey) {
    const secondary = row[column.secondaryKey]
    if (secondary) values.push(`${column.secondaryLabel || 'Details'}: ${secondary}`)
  }
  return values.length ? values.join('\n') : undefined
}

export default function DataTable() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const active = useSelector(selectActiveSection)
  const dashboardStatus = useSelector(selectDashboardStatus)
  const { user } = useSelector(selectAuth)
  const educationManagersState = useSelector(selectSectionData(SECTION_KEYS.educationManagers))
  const entity = user?.entity || null
  const roles = user?.roles || []
  const isEducationManager = roles.includes('education_manager')
  const isSchoolAdmin = roles.includes('school_admin') || roles.includes('platform_admin') || roles.includes('university_admin')
  const educationManagersList = educationManagersState?.data || []

  const educationManagerProgrammes = React.useMemo(() => {
    const staffProfile = user?.staffProfile || {}
    const programme = staffProfile.programme || staffProfile.program || ''
    const programmes = Array.isArray(staffProfile.programmes) ? staffProfile.programmes : []
    return [programme, ...programmes].map((p) => String(p || '').trim()).filter(Boolean)
  }, [user])

  const programmeOptions = React.useMemo(() => {
    const fromManagers = educationManagersList.flatMap((manager) => {
      const single = manager?.programme || manager?.program
      const list = Array.isArray(manager?.programmes) ? manager.programmes : []
      return [single, ...list]
    })
    return buildProgrammeOptions(fromManagers)
  }, [educationManagersList])

  const userOrganizationId = React.useMemo(() => {
    if (!user) return ''
    const org = user.organization
    if (!org) return ''
    if (typeof org === 'string') return org
    if (typeof org === 'object') return org.id || org._id || ''
    return ''
  }, [user])

  const normalizedCompanyName = React.useMemo(() => {
    if (!user) return ''
    const rawName =
      (user.companyProfile && (user.companyProfile.companyName || user.companyProfile.name)) ||
      (typeof user.organization === 'object' ? user.organization.name : '') ||
      ''
    return rawName ? String(rawName).trim().toLowerCase() : ''
  }, [user])

  const allowedSections = React.useMemo(() => {
    const allowed = getSectionsForEntity(entity)
    const normalizedEntity = typeof entity === 'string' ? entity.toLowerCase() : ''
    return SECTION_SEQUENCE.filter((key) => {
      if (!allowed.includes(key)) return false
      if (normalizedEntity === 'company' && (key === SECTION_KEYS.companies || key === SECTION_KEYS.leadCompanies)) {
        return false
      }
      if (normalizedEntity === 'company' && key === SECTION_KEYS.liahubCompanies) {
        return false
      }
      return true
    })
  }, [entity])

  const definition = SECTION_DEFINITIONS[active]
  const uploadConfig = definition?.upload || null
  const sectionState = useSelector(selectSectionData(active))
  const columns = definition?.columns || []
  const statusOptions = React.useMemo(() => getStatusOptions(), [])

  const [search, setSearch] = React.useState('')
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editorMode, setEditorMode] = React.useState('add') // 'add' | 'edit'
  const [formValues, setFormValues] = React.useState({})
  const [selectedRow, setSelectedRow] = React.useState(null)
  const hasPendingSubmissionRef = React.useRef(false)
  const shouldRefreshRef = React.useRef(false)
  const lastFetchKeyRef = React.useRef(null)
  
  // Excel upload state
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [uploadResult, setUploadResult] = React.useState(null)
  const fileInputRef = React.useRef(null)

  // Row detail drawer
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [detailRow, setDetailRow] = React.useState(null)
  
  // Admin warning modal
  const [adminWarningOpen, setAdminWarningOpen] = React.useState(false)

  // LiaHub programme selection
  const [programmeDialogOpen, setProgrammeDialogOpen] = React.useState(false)
  const [pendingProgrammeAction, setPendingProgrammeAction] = React.useState(null) // 'add' | 'upload' | 'deleteAll'
  const [selectedProgramme, setSelectedProgramme] = React.useState('')
  const [liahubProgrammeFilter, setLiahubProgrammeFilter] = React.useState('')

  // Lazy render guard for table rows
  const tableRef = React.useRef(null)
  const [tableVisible, setTableVisible] = React.useState(false)

  React.useEffect(() => {
    if (tableVisible) return
    const el = tableRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setTableVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setTableVisible(true)
          observer.disconnect()
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [tableVisible])

  React.useEffect(() => {
    if (!allowedSections.length) return
    if (!allowedSections.includes(active)) {
      dispatch(setActiveSection(allowedSections[0]))
    }
  }, [active, allowedSections, dispatch])

  React.useEffect(() => {
    setProgrammeDialogOpen(false)
    setPendingProgrammeAction(null)
    setSelectedProgramme('')
    setLiahubProgrammeFilter('')
  }, [active])

  React.useEffect(() => {
    if (!user) return
    const userId = user.id || user._id || ''
    const org = user.organization
    const orgId =
      typeof org === 'string'
        ? org
        : org && typeof org === 'object'
        ? org.id || org._id || ''
        : ''
    const nextKey = `${userId}|${orgId}`
    const shouldLoad = dashboardStatus === 'idle' || lastFetchKeyRef.current !== nextKey
    if (!shouldLoad) return
    lastFetchKeyRef.current = nextKey
    dispatch(fetchStudentDashboard())
  }, [dashboardStatus, dispatch, user])

  const rows = React.useMemo(() => {
    const base = sectionState?.data || []
    const normalizedEntity = typeof entity === 'string' ? entity.toLowerCase() : ''
    const normalizedOrgId = userOrganizationId ? String(userOrganizationId).trim() : ''

    return base
      .map((row) => {
        const next = { ...row, sectionKey: active }
        columns.forEach((column) => {
          if (column.format === DATE_FORMAT_YEARMONTHDAY_SHORT) {
            next[column.key] = formatDateYYMMDD(next[column.key])
          }
        })
        return next
      })
      .filter((row) => {
        if (!row) return false
        if (isEducationManager) {
          const rowProgramme = String(row.programme || row.program || '').trim().toLowerCase()
          const allowedProgrammes = educationManagerProgrammes.map((p) => p.toLowerCase())
          if (row.sectionKey === SECTION_KEYS.students || row.sectionKey === SECTION_KEYS.liahubCompanies) {
            return rowProgramme && allowedProgrammes.includes(rowProgramme)
          }
        }
        if (normalizedEntity === 'company' && row.sectionKey === SECTION_KEYS.students) {
          const assignedCompanyId = String(row.assignedCompanyId || '').trim()
          if (!normalizedOrgId && !normalizedCompanyName) {
            return true
          }
          if (normalizedOrgId && assignedCompanyId === normalizedOrgId) {
            return true
          }
          if (!normalizedCompanyName) {
            return false
          }
          const assignedCompanyName = String(row.assignedCompanyName || row.placement || '')
            .trim()
            .toLowerCase()
          return assignedCompanyName && assignedCompanyName === normalizedCompanyName
        }
        return true
      })
  }, [sectionState?.data, columns, active, entity, normalizedCompanyName, userOrganizationId])

  const liahubProgrammeChips = React.useMemo(() => {
    if (!isSchoolAdmin || active !== SECTION_KEYS.liahubCompanies) return []
    const seen = new Set()
    const chips = []
    rows.forEach((row) => {
      const label = String(row.program || '').trim()
      if (!label) return
      const value = label.toLowerCase()
      if (seen.has(value)) return
      seen.add(value)
      chips.push({ label, value })
    })
    chips.sort((a, b) => a.label.localeCompare(b.label))
    return chips
  }, [active, isSchoolAdmin, rows])

  const [visibleRowsLimit, setVisibleRowsLimit] = React.useState(50)

  const filteredRows = React.useMemo(() => {
    let working = rows

    if (active === SECTION_KEYS.liahubCompanies && liahubProgrammeFilter) {
      const target = liahubProgrammeFilter.toLowerCase()
      working = working.filter((row) => String(row.program || '').trim().toLowerCase() === target)
    }

    const term = search.trim().toLowerCase()
    if (!term) return working
    return working.filter((row) =>
      columns.some((column) => {
        const values = [row[column.key]]
        if (column.secondaryKey) values.push(row[column.secondaryKey])
        return values.some((value) => value && String(value).toLowerCase().includes(term))
      }),
    )
  }, [rows, columns, search, active, liahubProgrammeFilter])

  const visibleRows = tableVisible ? filteredRows.slice(0, visibleRowsLimit) : []

  // Reset limit when switching sections or search changes
  React.useEffect(() => {
    setVisibleRowsLimit(50)
  }, [active, search])

  // Auto-load all rows progressively without user interaction
  React.useEffect(() => {
    if (visibleRowsLimit >= filteredRows.length) return
    
    const timer = setTimeout(() => {
      setVisibleRowsLimit(prev => Math.min(prev + 100, filteredRows.length))
    }, 100) // Load 100 more rows every 100ms
    
    return () => clearTimeout(timer)
  }, [visibleRowsLimit, filteredRows.length])

  const loading = sectionState?.status === 'loading'
  const error = sectionState?.error
  const mutationPending = sectionState?.mutationStatus === 'pending'
  const mutationError = sectionState?.mutationError
  const [deleteSuccess, setDeleteSuccess] = React.useState(null)

  const allowAdd = canAddToSection(entity, active, roles)
  const allowEdit = canEditSection(entity, active, roles)

  const isEducationManagerSection = active === SECTION_KEYS.educationManagers
  const loggedInUserId = user?._id ? String(user._id) : user?.id ? String(user.id) : ''

  const findEducationManagerForProgramme = React.useCallback(
    (programme) => {
      if (!programme) return null
      const normalized = String(programme).trim().toLowerCase()
      return educationManagersList.find((manager) => {
        const managerProgramme = String(manager?.programme || manager?.program || '').trim().toLowerCase()
        return managerProgramme && managerProgramme === normalized
      }) || null
    },
    [educationManagersList],
  )

  const resetEditorState = React.useCallback(() => {
    setEditorOpen(false)
    setEditorMode('add')
    setSelectedRow(null)
    setFormValues({})
    hasPendingSubmissionRef.current = false
  }, [])

  const openEditor = React.useCallback(
    (mode, row = null, seedValues = {}) => {
      if (!definition) return
      setEditorMode(mode)
      setSelectedRow(row)
      const initialValues = buildInitialValuesForSection(active, row)

      let enrichedValues = initialValues
      if (mode === 'add' && active === SECTION_KEYS.students) {
        const assignedByName = user?.name
          ? [user.name.first, user.name.last].filter(Boolean).join(' ')
          : user?.fullName || ''
        const assignedByUserId = user?.id || user?._id || ''
        enrichedValues = {
          ...initialValues,
          assignedByName,
          assignedByUserId,
          companySelect: initialValues.companySelect || '',
        }
      }

      const mergedValues = { ...enrichedValues, ...seedValues }
      if (active === SECTION_KEYS.liahubCompanies && seedValues.program) {
        const manager = findEducationManagerForProgramme(seedValues.program)
        if (manager?.leader) mergedValues.educationLeader = manager.leader
        if (manager?.contact) mergedValues.educationLeaderEmail = manager.contact
      }
      setFormValues(mergedValues)
      setEditorOpen(true)
      hasPendingSubmissionRef.current = false
    },
    [active, definition, user],
  )

  const isLiahubCompanies = active === SECTION_KEYS.liahubCompanies
  const requiresProgrammeSelection = isLiahubCompanies && isSchoolAdmin

  const openProgrammeDialog = React.useCallback((action) => {
    setPendingProgrammeAction(action)
    setSelectedProgramme((prev) => prev || programmeOptions[0] || '')
    setProgrammeDialogOpen(true)
  }, [programmeOptions])

  const handleAddClick = React.useCallback(() => {
    if (requiresProgrammeSelection) {
      openProgrammeDialog('add')
      return
    }
    openEditor('add', null)
  }, [openEditor, openProgrammeDialog, requiresProgrammeSelection])

  const handleEditClick = React.useCallback(
    (row) => {
      openEditor('edit', row)
    },
    [openEditor],
  )

  const handleDelete = React.useCallback(
    async (row) => {
      if (!row?.id) return
      shouldRefreshRef.current = true
      setDetailOpen(false)
      setDetailRow(null)
      try {
        await dispatch(deleteSchoolRecord({ sectionKey: active, id: row.id })).unwrap()
        if (active === SECTION_KEYS.students) {
          const studentName = row.name || row.studentName || 'Student'
          setDeleteSuccess({ name: studentName })
        }
      } catch (err) {
        console.error('Failed to delete record', err)
      }
    },
    [active, dispatch],
  )

  const handleSubmit = React.useCallback(
    async (event) => {
      // Prevent default form submission if event provided
      try {
        event?.preventDefault?.()
      } catch (e) {
        // ignore
      }

      const payload = buildRecordPayloadForSection(active, formValues)

      // ADD flow
      if (editorMode === 'add') {
        hasPendingSubmissionRef.current = true
        shouldRefreshRef.current = true
        
        // Check if adding a company to trigger contract creation
        const isCompanySection = active === SECTION_KEYS.companies || active === SECTION_KEYS.leadCompanies
        
        if (isCompanySection) {
          try {
            await dispatch(createSchoolRecord({ sectionKey: active, payload })).unwrap()
            resetEditorState()
            // Contract will be auto-created from template on backend
          } catch (err) {
            console.error('Failed to create company:', err)
          }
        } else {
          dispatch(createSchoolRecord({ sectionKey: active, payload }))
        }
        return
      }

      // EDIT flow
      if (editorMode === 'edit' && selectedRow?.id) {
        // Special-case: education managers and admin management entries are backed by User documents, not SchoolRecord.
        if (active === SECTION_KEYS.educationManagers || active === SECTION_KEYS.adminManagement) {
          // Build user payload from form values. Map common fields to name, contact and staffProfile.
          const userPayload = {}

          // Map leader -> name (split into first/last)
          const leader = formValues.leader || formValues.name || ''
          if (leader) {
            const parts = String(leader).trim().split(/\s+/)
            userPayload.name = { first: parts.shift() || '', last: parts.join(' ') || '' }
          }

          // Map contact -> email, phone
          if (formValues.contact || formValues.phone || formValues.place) {
            userPayload.contact = {}
            if (formValues.contact) userPayload.contact.email = formValues.contact
            if (formValues.phone) userPayload.contact.phone = formValues.phone
            if (formValues.place) userPayload.contact.location = formValues.place
          }

          // staffProfile mapping
          const staffProfile = {}
          if (formValues.title) staffProfile.designation = formValues.title
          if (formValues.department) staffProfile.department = formValues.department
          if (formValues.programme) staffProfile.programme = formValues.programme
          if (formValues.experience) staffProfile.totalExperience = formValues.experience
          if (formValues.qualifications) {
            // qualifications may be comma-separated
            staffProfile.qualifications = Array.isArray(formValues.qualifications)
              ? formValues.qualifications
              : String(formValues.qualifications).split(',').map((s) => s.trim()).filter(Boolean)
          }
          if (formValues.bio) staffProfile.bio = formValues.bio
          if (formValues.skills) {
            staffProfile.skills = Array.isArray(formValues.skills)
              ? formValues.skills
              : String(formValues.skills).split(',').map((s) => s.trim()).filter(Boolean)
          }
          if (Object.keys(staffProfile).length) userPayload.staffProfile = staffProfile

          // Send update to users endpoint
          hasPendingSubmissionRef.current = true
          try {
            await apiClient.put(`/users/${selectedRow.id}`, userPayload)
            shouldRefreshRef.current = true
            // After successful update, refresh the dashboard to pick up changes
            dispatch(fetchStudentDashboard())
            // Close editor
            resetEditorState()
          } catch (err) {
            console.error('Failed to update education manager', err)
            hasPendingSubmissionRef.current = false
          }
        } else {
          hasPendingSubmissionRef.current = true
          shouldRefreshRef.current = true
          dispatch(updateSchoolRecord({ sectionKey: active, id: selectedRow.id, payload }))
        }
      }
    },
    [active, definition, dispatch, editorMode, formValues, selectedRow, resetEditorState],
  )

  React.useEffect(() => {
    if (!editorOpen) return
    if (!hasPendingSubmissionRef.current) return
    if (sectionState?.mutationStatus === 'pending') return

    if (mutationError) {
      hasPendingSubmissionRef.current = false
      return
    }

    if (editorMode === 'add' || editorMode === 'edit') {
      resetEditorState()
    }
  }, [editorMode, editorOpen, mutationError, resetEditorState, sectionState?.mutationStatus])

  React.useEffect(() => {
    if (!shouldRefreshRef.current) return
    if (sectionState?.mutationStatus === 'pending') return

    if (mutationError) {
      shouldRefreshRef.current = false
      return
    }

    shouldRefreshRef.current = false
    dispatch(fetchStudentDashboard())
  }, [dispatch, mutationError, sectionState?.mutationStatus])

  const formFields = React.useMemo(() => {
    const base = getFormFieldsForSection(active)
    if (![SECTION_KEYS.students, SECTION_KEYS.liahubCompanies, SECTION_KEYS.educationManagers].includes(active)) {
      return base
    }
    return base.map((field) => {
      if (field.key === 'programme' || field.key === 'program') {
        return { ...field, options: programmeOptions }
      }
      return field
    })
  }, [active, programmeOptions])

  // Companies list for dropdown autofill
  const [companiesList, setCompaniesList] = React.useState([])
  const [companiesListKey, setCompaniesListKey] = React.useState(0) // Force refresh key

  React.useEffect(() => {
    let mounted = true
    const fetchCompanies = async () => {
      try {
        const resp = await apiClient.get('/organizations/companies')
        if (!mounted) return
        setCompaniesList(resp.data?.companies || [])
      } catch (err) {
        // ignore
      }
    }
    fetchCompanies()
  }, [companiesListKey]) // Re-fetch when key changes

  // Function to refresh companies list for dynamic updates
  const refreshCompaniesList = React.useCallback(() => {
    setCompaniesListKey(prev => prev + 1)
  }, [])

  const handleFieldChange = React.useCallback((key, value) => {
    setFormValues((prev) => {
      const next = { ...prev, [key]: value }
      if (active === SECTION_KEYS.students && key === 'programme') {
        const normalized = normalizeProgrammeValue(value)
        const matchingManagers = educationManagersList.filter((manager) => {
          const managerProgramme = normalizeProgrammeValue(manager?.programme || manager?.program)
          return managerProgramme && managerProgramme === normalized
        })
        const leaderNames = matchingManagers.map((manager) => manager?.leader).filter(Boolean)
        next.educationLeader = leaderNames
      }
      if (active === SECTION_KEYS.liahubCompanies && key === 'program') {
        const manager = findEducationManagerForProgramme(value)
        if (manager?.leader) {
          next.educationLeader = manager.leader
        }
        if (manager?.contact) {
          next.educationLeaderEmail = manager.contact
        }
      }
      return next
    })
  }, [active, educationManagersList, findEducationManagerForProgramme])

  // Helper to apply company autofill into form values
  const applyCompanyAutofill = React.useCallback(async (companyId) => {
    if (!companyId) return

    // Always fetch fresh company data for dynamic updates
    try {
      const resp = await apiClient.get(`/organizations/${companyId}`)
      const org = resp.data?.organization
      if (!org) return

      setFormValues((prev) => ({
        ...prev,
        placement: org.name || prev.placement,
        location: (org.address && (org.address.city || org.address.country)) ? [org.address.city, org.address.country].filter(Boolean).join(', ') : prev.location,
        contactPerson: org.metadata?.contactPerson || prev.contactPerson,
        role: (org.metadata?.roles && org.metadata.roles.length) ? org.metadata.roles[0] : prev.role,
        companyEmail: org.contact?.email || prev.companyEmail,
        phone: org.contact?.phone || prev.phone,
        orgNumber: org.metadata?.companyRegNo || prev.orgNumber,
      }))
    } catch (err) {
      // Fallback: try cached data if API fails
      const cachedCompany = companiesList.find(c => c.id === companyId)
      if (cachedCompany && cachedCompany.companyProfile) {
        const profile = cachedCompany.companyProfile

        setFormValues((prev) => ({
          ...prev,
          placement: cachedCompany.name || prev.placement,
          location: [profile.city, profile.country].filter(Boolean).join(', ') || prev.location,
          contactPerson: profile.contactPerson || prev.contactPerson,
          role: profile.roles && profile.roles.length > 0 ? profile.roles[0] : prev.role,
          companyEmail: profile.companyEmail || prev.companyEmail,
          phone: profile.companyPhone || prev.phone,
          orgNumber: profile.companyRegNo || prev.orgNumber,
        }))
      }
    }
  }, [companiesList])

  const handleExcelUpload = React.useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file || !uploadConfig?.endpoint) return

    const formData = new FormData()
    formData.append('excelFile', file)
    if (active === SECTION_KEYS.liahubCompanies && selectedProgramme) {
      formData.append('programme', selectedProgramme)
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const response = await apiClient.post(uploadConfig.endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadResult({
        success: true,
        data: response.data,
      })

      // Force refresh to bypass dashboard cache after upload
      dispatch(fetchStudentDashboard(true))
    } catch (error) {
      setUploadResult({
        success: false,
        error: error.response?.data?.message || error.message || 'Upload failed',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [dispatch, uploadConfig, active, selectedProgramme])

  const handleUploadButtonClick = React.useCallback(() => {
    if (uploadConfig?.adminOnly && !isSchoolAdmin) {
      setAdminWarningOpen(true)
      return
    }
    if (requiresProgrammeSelection) {
      openProgrammeDialog('upload')
      return
    }
    setUploadDialogOpen(true)
    setUploadResult(null)
  }, [uploadConfig, isSchoolAdmin, openProgrammeDialog, requiresProgrammeSelection])

  const handleCloseUploadDialog = React.useCallback(() => {
    setUploadDialogOpen(false)
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleDeleteAllBySection = React.useCallback(async () => {
    if (isLiahubCompanies && !selectedProgramme) return

    const message = isLiahubCompanies
      ? `Delete all LiaHub companies for ${selectedProgramme}? This cannot be undone.`
      : active === SECTION_KEYS.companies
        ? 'Delete all Companies? This cannot be undone.'
        : 'Delete all Lead Companies? This cannot be undone.'

    const confirmed = window.confirm(message)
    if (!confirmed) return

    try {
      if (isLiahubCompanies) {
        await apiClient.delete('/dashboard/school/liahub-companies', { params: { programme: selectedProgramme } })
      } else {
        const type = active === SECTION_KEYS.companies ? 'company' : 'lead_company'
        await apiClient.delete('/dashboard/school/companies', { params: { type } })
      }
      dispatch(fetchStudentDashboard(true))
    } catch (err) {
      console.error('Failed to delete companies:', err)
    }
  }, [active, isLiahubCompanies, selectedProgramme, dispatch])

  const handleProgrammeActionConfirm = React.useCallback(() => {
    if (!selectedProgramme) return
    const action = pendingProgrammeAction
    setProgrammeDialogOpen(false)

    if (action === 'add') {
      openEditor('add', null, { program: selectedProgramme })
      return
    }
    if (action === 'upload') {
      setUploadDialogOpen(true)
      setUploadResult(null)
      return
    }
    if (action === 'deleteAll') {
      handleDeleteAllBySection()
    }
  }, [pendingProgrammeAction, selectedProgramme, openEditor, handleDeleteAllBySection])

  if (!definition) {
    return <div className="p-4 text-sm text-muted-foreground">No section configured for this role.</div>
  }

  const showUploadButton = Boolean(uploadConfig && allowAdd)
  const showDeleteAllButton = isSchoolAdmin && (isLiahubCompanies || active === SECTION_KEYS.companies || active === SECTION_KEYS.leadingCompanies)

  const getSectionIcon = (sectionKey) => {
    const iconMap = {
      students: GraduationCap,
      educationManagers: Users,
      teachers: BookOpen,
      adminManagement: Shield,
      companies: Building2,
      liahubCompanies: Building,
      leadingCompanies: Briefcase,
    }
    return iconMap[sectionKey] || Building2
  }

  return (
    <div className="flex flex-col rounded-3xl bg-card shadow-[4px_4px_12px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.05)]">
      <div className="flex flex-wrap justify-center gap-2 p-4">{allowedSections.map((sectionKey) => {
          const def = SECTION_DEFINITIONS[sectionKey]
          if (!def) return null
          const isActive = sectionKey === active
          const IconComponent = getSectionIcon(sectionKey)
          return (
            <button
              key={sectionKey}
              onClick={() => dispatch(setActiveSection(sectionKey))}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]'
                  : 'bg-muted/70 text-muted-foreground shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.05)] hover:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1),inset_-1px_-1px_3px_rgba(255,255,255,0.05)] hover:text-foreground'
              }`}
              type="button"
            >
              <IconComponent className="h-4 w-4" />
              {def.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 p-4">
        <Toolbar
          search={search}
          onSearch={setSearch}
          totalRows={rows.length}
          filteredRows={filteredRows.length}
          currentSectionLabel={definition.label}
          allowAdd={allowAdd}
          onAdd={handleAddClick}
          showUploadButton={showUploadButton}
          onUpload={handleUploadButtonClick}
          uploadLabel={uploadConfig?.buttonLabel || 'Upload Excel'}
          showDeleteAllButton={showDeleteAllButton}
          onDeleteAll={() => openProgrammeDialog('deleteAll')}
        />

        {isSchoolAdmin && active === SECTION_KEYS.liahubCompanies && liahubProgrammeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-xs text-muted-foreground">Filter by programme:</span>
            {liahubProgrammeChips.map((chip) => {
              const selected = liahubProgrammeFilter === chip.value
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setLiahubProgrammeFilter((prev) => (prev === chip.value ? '' : chip.value))}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    selected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-foreground border-border hover:border-primary/60'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
            {liahubProgrammeFilter && (
              <button
                type="button"
                onClick={() => setLiahubProgrammeFilter('')}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/60"
              >
                Clear
              </button>
            )}
          </div>
        )}

        <div className="relative" ref={tableRef}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/60 border-t-transparent" />
                <span>Loading {definition.label}...</span>
              </div>
            </div>
          )}

          {!tableVisible && !loading ? (
            <div className="rounded-2xl bg-background/60 px-6 py-12 text-center text-sm text-muted-foreground">
              Scroll to load the table.
            </div>
          ) : !visibleRows.length && !loading ? (
            <div className="rounded-2xl bg-background/60 px-6 py-12 text-center text-sm text-muted-foreground">
              {search ? 'No records match your search.' : 'No data available for this section yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl shadow-[2px_2px_8px_rgba(0,0,0,0.1),-2px_-2px_8px_rgba(255,255,255,0.05)] bg-background/40 p-1">
              <table className="w-full min-w-[720px] table-auto text-sm text-foreground">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="h-11">
                    {columns.map((column) => (
                      <th key={column.key} className="px-4 text-left font-semibold">
                        {column.label}
                      </th>
                    ))}
                    {(allowEdit || isEducationManagerSection || active === SECTION_KEYS.liahubCompanies) && <th className="px-4 text-right font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const isSelfEducationManager = isEducationManagerSection && loggedInUserId && String(row.id) === loggedInUserId
                    const rowAllowsEdit = isEducationManagerSection ? (isSchoolAdmin || isSelfEducationManager) : allowEdit
                    const rowAllowsDelete = isEducationManagerSection ? isSchoolAdmin : rowAllowsEdit
                    return (
                    <tr
                      key={row.id}
                      className="h-[52px] rounded-xl transition-all hover:bg-primary/5 hover:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05)] cursor-pointer"
                      onClick={() => {
                        setDetailRow(row)
                        setDetailOpen(true)
                      }}
                      onClick={(e) => {
                          if (e.target.closest('[data-no-detail-on-click]')) return
                          setDetailRow(row)
                          setDetailOpen(true)
                        }}
                      >
                      {columns.map((column) => {
                        const title = buildTitle(column, row)
                        const cellClasses = ['px-3 py-3 align-top']
                        if (column.grow) cellClasses.push('max-w-[260px] whitespace-normal break-words line-clamp-2')
                        else cellClasses.push('max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis')

                        return (
                          <td key={column.key} className={cellClasses.join(' ')} title={title}>
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1 text-sm leading-snug text-foreground line-clamp-2">
                                {renderCellContent(column, row)}
                              </div>
                            </div>
                          </td>
                        )
                      })}
                      {(rowAllowsEdit || active === SECTION_KEYS.liahubCompanies || isEducationManagerSection) && (
                        <td className="px-4 py-4 text-right" data-no-detail-on-click>
                          <RowActions
                            onView={() => {
                              setDetailRow(row)
                              setDetailOpen(true)
                            }}
                            onEdit={(e) => {
                              e.stopPropagation()
                              handleEditClick(row)
                            }}
                            onDelete={() => {
                              handleDelete(row)
                            }}
                            disabled={mutationPending}
                            isAdminOnly={active === SECTION_KEYS.liahubCompanies}
                            isAdmin={isSchoolAdmin}
                            allowEdit={rowAllowsEdit}
                            allowDelete={rowAllowsDelete}
                          />
                        </td>
                      )}
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}

          {error && <div className="mt-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
          {mutationError && (
            <div className="mt-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {mutationError}
            </div>
          )}
        </div>
      </div>

      <RecordEditorDialog
        open={editorOpen}
        mode={editorMode}
        onOpenChange={(value) => {
          if (!value) resetEditorState()
          else {
            setEditorOpen(value)
            hasPendingSubmissionRef.current = false
          }
        }}
        formFields={formFields}
        statusOptions={statusOptions}
        values={formValues}
        companiesList={companiesList}
        applyCompanyAutofill={applyCompanyAutofill}
        refreshCompaniesList={refreshCompaniesList}
        educationManagersList={educationManagersList}
        onChange={handleFieldChange}
        onSubmit={handleSubmit}
        onCancel={resetEditorState}
        definition={definition}
        submitting={mutationPending}
        error={mutationError}
      />

      <ExcelUploadDialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        onFileChange={handleExcelUpload}
        uploading={uploading}
        result={uploadResult}
        fileInputRef={fileInputRef}
        uploadConfig={uploadConfig}
      />

      <RowDetailDialog
        open={detailOpen}
        onOpenChange={(value) => {
          setDetailOpen(value)
          if (!value) setDetailRow(null)
        }}
        row={detailRow}
        columns={columns}
        definition={definition}
      />

      {deleteSuccess && active === SECTION_KEYS.students && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <StatusCard
            title="Student deleted"
            description={`${deleteSuccess.name} has been removed from the dashboard.`}
            actionLabel="Close"
            onDismiss={() => setDeleteSuccess(null)}
          />
        </div>
      )}

      <Dialog open={adminWarningOpen} onOpenChange={setAdminWarningOpen}>
        <DialogContent className="w-full max-w-md mx-auto text-left">
          <DialogHeader>
            <DialogTitle>Admin Access Required</DialogTitle>
            <DialogClose onClick={() => setAdminWarningOpen(false)} />
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              This feature is restricted to system administrators only. Please contact your system administrator to upload data to this section.
            </p>
          </DialogBody>
          <DialogFooter className="justify-start">
            <Button type="button" onClick={() => setAdminWarningOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={programmeDialogOpen} onOpenChange={setProgrammeDialogOpen}>
        <DialogContent className="w-full max-w-md mx-auto text-left bg-transparent border-0 shadow-none">
          <div className="rounded-2xl bg-background/60 backdrop-blur-sm p-6 shadow-[2px_2px_8px_rgba(0,0,0,0.1),-2px_-2px_8px_rgba(255,255,255,0.05)]">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Select programme</DialogTitle>
              <DialogClose onClick={() => setProgrammeDialogOpen(false)} />
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Which NBI/Commercial Administration programme?</Label>
                <Select
                  value={selectedProgramme}
                  onChange={(event) => setSelectedProgramme(event.target.value)}
                  required
                  className="rounded-xl"
                >
                  {programmeOptions.map((option) => (
                    <SelectOption key={option} value={option}>
                      {option}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            </DialogBody>
            <DialogFooter className="justify-start gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setProgrammeDialogOpen(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button type="button" onClick={handleProgrammeActionConfirm} disabled={!selectedProgramme} className="rounded-lg">
                Continue
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Toolbar({ search, onSearch, totalRows, filteredRows, currentSectionLabel, allowAdd, onAdd, showUploadButton, onUpload, uploadLabel, showDeleteAllButton, onDeleteAll }) {
  const hasFilter = search.trim().length > 0
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{currentSectionLabel}</span>
        <span className="text-muted-foreground/60">•</span>
        <span>
          {filteredRows} / {totalRows || 0} rows
          {hasFilter && ' (filtered)'}
        </span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search in table..."
            className="rounded-full pl-10"
          />
        </div>
        {showUploadButton && (
          <Button type="button" onClick={onUpload} variant="outline" className="sm:w-auto gap-2">
            <Upload className="h-4 w-4" />
            {uploadLabel || 'Upload Excel'}
          </Button>
        )}
        {showDeleteAllButton && (
          <Button type="button" onClick={onDeleteAll} variant="destructive" className="sm:w-auto gap-2">
            Delete all
          </Button>
        )}
        {allowAdd && (
          <Button type="button" onClick={onAdd} className="sm:w-auto">
            Add new
          </Button>
        )}
      </div>
    </div>
  )
}

function RowActions({ onView, onEdit, onDelete, disabled, isAdminOnly = false, isAdmin = false, allowEdit = true, allowDelete = true }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const shouldDisableActions = isAdminOnly && !isAdmin

  const handleConfirmDelete = React.useCallback(() => {
    setConfirmOpen(false)
    onDelete()
  }, [onDelete])

  const handleDeleteClick = React.useCallback(() => {
    if (disabled || shouldDisableActions || !allowDelete) return
    setConfirmOpen(true)
  }, [disabled, shouldDisableActions, allowDelete])

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        {onView ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.05)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] transition-all"
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || shouldDisableActions || !allowEdit}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(e)
          }}
          title={shouldDisableActions ? 'Only admins can edit this section' : 'Edit'}
          className="h-8 w-8 p-0 rounded-full shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.05)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] transition-all"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.05)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] transition-all text-destructive hover:text-destructive"
          disabled={disabled || shouldDisableActions || !allowDelete}
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteClick()
          }}
          title={shouldDisableActions ? 'Only admins can delete this section' : 'Delete'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(next) => setConfirmOpen(!!next)}>
        <DialogContent className="w-full max-w-md mx-auto text-left">
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this record?</DialogTitle>
            <DialogClose onClick={() => setConfirmOpen(false)} />
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone and will permanently remove the record from the dashboard.
            </p>
          </DialogBody>
          <DialogFooter className="justify-start">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              No, keep it
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Yes, delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RecordEditorDialog({
  open,
  mode,
  onOpenChange,
  formFields,
  statusOptions,
  values,
  onChange,
  onSubmit,
  onCancel,
  definition,
  submitting,
  error,
  companiesList = [],
  applyCompanyAutofill = async () => {},
  refreshCompaniesList = () => {},
  educationManagersList = [],
}) {
  const title = mode === 'edit' ? `Edit ${definition?.singularLabel || 'record'}` : `Add ${definition?.singularLabel || 'record'}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose onClick={onCancel} />
        </DialogHeader>
        <DialogBody>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {formFields.map((field) => {
                // When editing/adding students, render company picker UI for the placement/company field
                if (definition?.recordType === 'student' && field.key === 'placement') {
                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <Label>Company</Label>
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-md border border-gray-600 bg-background text-white px-3 py-2"
                          value={values.companySelect || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            // companySelect holds selected company id; we support single selection for autofill but chips show multiple if needed
                            onChange('companySelect', val)
                            if (val) {
                              // apply autofill for selected company
                              ;(async () => { await Promise.resolve(applyCompanyAutofill(val)) })()
                            }
                          }}
                        >
                          <option value="">— Select company —</option>
                          {Array.isArray((values.companiesList || []))
                            ? null
                            : null}
                          {/** Use companiesList passed via props (outer scope) */}
                          {companiesList.map((c) => (
                            <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                          ))}
                        </select>
                        <button type="button" className="text-sm px-3 py-2 rounded border" onClick={() => {
                          const selected = values.companySelect
                          if (!selected) return
                          // add to chips list
                          const current = Array.isArray(values.selectedCompanies) ? values.selectedCompanies.slice() : []
                          if (!current.includes(selected)) current.push(selected)
                          onChange('selectedCompanies', current)
                          // clear select
                          onChange('companySelect', '')
                        }}>Add</button>
                        <button type="button" className="text-sm px-3 py-2 rounded border bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={refreshCompaniesList} title="Refresh companies list">
                          ↻
                        </button>
                      </div>

                      {/* Chips for selected companies */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Array.isArray(values.selectedCompanies) && values.selectedCompanies.length > 0 ? (
                          values.selectedCompanies.map((id) => {
                            const org = companiesList.find((c) => (c.id || c._id) === id)
                            const label = org ? org.name : id
                            return (
                              <div key={id} className="inline-flex items-center gap-2 bg-muted/30 rounded-full px-3 py-1 text-sm">
                                <span>{label}</span>
                                <button type="button" onClick={() => {
                                  const next = (values.selectedCompanies || []).filter(x => x !== id)
                                  onChange('selectedCompanies', next)
                                }} className="text-xs opacity-70">×</button>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-muted-foreground text-sm">No companies selected</div>
                        )}
                      </div>
                    </div>
                  )
                }

                if (field.isDate) {
                  const dateValue = values[field.key]
                  let selectedDate = null
                  if (dateValue) {
                    const parts = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
                    if (parts) {
                      const [, yy, mm, dd] = parts
                      const year = parseInt(yy, 10)
                      const fullYear = year >= 70 ? 1900 + year : 2000 + year
                      selectedDate = new Date(Date.UTC(fullYear, parseInt(mm, 10) - 1, parseInt(dd, 10)))
                    } else {
                      const parsed = new Date(dateValue)
                      if (!isNaN(parsed.getTime())) {
                        selectedDate = parsed
                      }
                    }
                  }

                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <Label htmlFor={`field-${field.key}`}>
                        {field.label}
                        {field.required ? <span className="text-destructive"> *</span> : null}
                      </Label>
                      <DatePicker
                        id={`field-${field.key}`}
                        selected={selectedDate}
                        onChange={(date) => {
                          const formattedDate = formatDateYYMMDD(date)
                          onChange(field.key, formattedDate)
                        }}
                        dateFormat="yy/MM/dd"
                        placeholderText="YY/MM/DD"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                      />
                      {field.helpText ? (
                        <p className="text-xs text-muted-foreground">{field.helpText}</p>
                      ) : null}
                    </div>
                  )
                }

                const isEducationLeaderField = definition?.recordType === 'student' && field.key === 'educationLeader'
                const programmeValue = values.programme || ''
                const educationLeaderOptions = isEducationLeaderField
                  ? educationManagersList
                      .filter((manager) => normalizeProgrammeValue(manager?.programme || manager?.program) === normalizeProgrammeValue(programmeValue))
                      .map((manager) => manager?.leader)
                      .filter(Boolean)
                  : []

                return (
                  <div key={field.key} className="flex flex-col gap-2">
                    <Label htmlFor={`field-${field.key}`}>
                      {field.label}
                      {field.required ? <span className="text-destructive"> *</span> : null}
                    </Label>
                    {isEducationLeaderField ? (
                      <div className="space-y-2">
                        <div className="rounded-2xl bg-background/60 p-3 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.06)]">
                          <select
                            id={`field-${field.key}`}
                            multiple
                            disabled={!programmeValue}
                            value={Array.isArray(values[field.key]) ? values[field.key] : values[field.key] ? [values[field.key]] : []}
                            onChange={(event) => {
                              const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value)
                              onChange(field.key, selected)
                            }}
                            className="w-full rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm focus:outline-none"
                          >
                            {!programmeValue ? (
                              <option value="">Select a programme first</option>
                            ) : educationLeaderOptions.length ? (
                              educationLeaderOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))
                            ) : (
                              <option value="">No UL found for selected programme</option>
                            )}
                          </select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Hold Ctrl/Cmd to select multiple ULs.
                        </p>
                      </div>
                    ) : field.type === 'select' ? (
                      <Select
                        id={`field-${field.key}`}
                        value={values[field.key] || ''}
                        onChange={(event) => onChange(field.key, event.target.value)}
                        required={field.required}
                      >
                        {(field.options || statusOptions).map((option) => (
                          <SelectOption key={option} value={option}>
                            {option}
                          </SelectOption>
                        ))}
                      </Select>
                    ) : (
                      // Make company-related fields read-only if they were autofilled from a selected company
                      <Input
                        id={`field-${field.key}`}
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={values[field.key] ?? ''}
                        onChange={(event) => onChange(field.key, event.target.value)}
                        required={field.required}
                        readOnly={definition?.recordType === 'student' && ['companyEmail','phone','orgNumber','contactPerson','location','role'].includes(field.key)}
                        placeholder={field.placeholder || undefined}
                        pattern={field.pattern || undefined}
                        title={field.title || undefined}
                        inputMode={field.inputMode || undefined}
                        maxLength={field.maxLength ?? undefined}
                      />
                    )}
                    {field.helpText ? (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {error ? <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

function ExcelUploadDialog({ open, onClose, onFileChange, uploading, result, fileInputRef, uploadConfig }) {
  const expectedColumns = uploadConfig?.expectedColumns || []
  const dialogTitle = uploadConfig?.title || 'Upload Data (Excel)'
  const extraNote = uploadConfig?.note || ''

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogClose onClick={onClose} />
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            {/* Instructions */}
            <div className="rounded-2xl bg-muted/50 p-4">
              <h4 className="mb-2 font-semibold text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel File Requirements
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Upload .xlsx or .xls files only</li>
                <li>• First row must contain Swedish column headers</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>

            {/* Swedish Column Names */}
            <div className="rounded-2xl bg-muted/30 p-4">
              <h4 className="mb-3 font-semibold text-sm">Expected Column Names:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {expectedColumns.map((col, idx) => (
                  <div key={idx} className="rounded-lg bg-background/60 px-3 py-2 font-mono">
                    {col}
                  </div>
                ))}
              </div>
              {extraNote ? <p className="mt-3 text-xs text-muted-foreground">{extraNote}</p> : null}
            </div>

            {/* File Input */}
            <div className="space-y-3">
              <Label htmlFor="excel-file-input">Select Excel File</Label>
              <Input
                ref={fileInputRef}
                id="excel-file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={onFileChange}
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>

            {/* Upload Status */}
            {uploading && (
              <div className="flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-sm">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/60 border-t-transparent" />
                <span>Uploading and processing Excel file...</span>
              </div>
            )}

            {/* Upload Result */}
            {result && !uploading && (
              <div className={`rounded-2xl px-4 py-4 text-sm ${
                result.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-destructive/10 text-destructive'
              }`}>
                {result.success ? (
                  <div className="space-y-3">
                    <div className="font-semibold">✓ Upload Successful!</div>
                    <div className="space-y-1 text-xs">
                      <div>Total rows processed: {result.data?.summary?.totalRows || 0}</div>
                      <div>Successfully added: {result.data?.summary?.successful || 0}</div>
                      <div>Failed: {result.data?.summary?.failed || 0}</div>
                    </div>
                    
                    {result.data?.failedRecords?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="font-semibold text-amber-300">Failed Records:</div>
                        <div className="max-h-40 space-y-1 overflow-y-auto text-xs">
                          {result.data.failedRecords.map((record, idx) => (
                            <div key={idx} className="rounded bg-background/40 p-2">
                              Row {record.rowNumber}: {record.name} ({record.email}) - {record.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold">✗ Upload Failed</div>
                    <div className="mt-1 text-xs">{result.error}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

function RowDetailDialog({ open, onOpenChange, row, columns, definition }) {
  const { user } = useSelector(selectAuth)
  const isAdmin = user?.roles?.some(r => ['school_admin', 'platform_admin', 'university_admin'].includes(r))
  const isReadOnly = definition?.recordType === 'liahub_company' && !isAdmin
  
  if (!row) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-transparent border-0 shadow-none">
        <div className="rounded-2xl bg-background/60 backdrop-blur-sm p-6 shadow-[2px_2px_8px_rgba(0,0,0,0.1),-2px_-2px_8px_rgba(255,255,255,0.05)]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{definition?.singularLabel || 'Record'} Details</DialogTitle>
            <DialogClose onClick={() => onOpenChange(false)} />
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-3 sm:grid-cols-2">
              {columns.map((column) => {
                const value = row[column.key]
                const display = value === null || value === undefined || value === '' ? '—' : formatColumnValue(column, value)
                return (
                  <div key={column.key} className="rounded-2xl bg-background/40 p-4 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.1)]">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{column.label}</div>
                    <div className={`mt-2 text-sm break-words whitespace-pre-wrap leading-snug ${
                      isReadOnly ? 'text-muted-foreground' : 'text-foreground'
                    }`}>{display}</div>
                  </div>
                )
              })}
            </div>
            {isReadOnly && (
              <p className="mt-4 text-xs text-muted-foreground text-center italic">Read-only view. Admins can edit this record.</p>
            )}
          </DialogBody>
          <DialogFooter className="justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg">
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}


