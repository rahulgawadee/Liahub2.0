/**
 * Utility functions for displaying user/company/school names consistently
 */

const ORG_ROLES = [
  'company_employer',
  'company_hiring_manager',
  'company_founder',
  'company_ceo',
  'school_admin',
  'school_representative',
  'university_admin',
  'university_representative',
]

export function getDisplayNameWithSubtitle(user) {
  if (!user) {
    return {
      displayName: 'User',
      subtitle: null,
      isCompanyUser: false,
    }
  }

  const roles = user.roles || []

  // ✅ Detect organization (company OR school)
  const isOrgUser = roles.some(role => ORG_ROLES.includes(role))

  // ✅ Organization name (school/company)
  // Check companyProfile/schoolProfile first, then fall back to mapped fields
  const organizationName =
    user.companyProfile?.companyName ||
    user.schoolProfile?.schoolName ||
    user.companyName || // From mapUserPreview
    user.schoolName || // From mapUserPreview
    null

  // ✅ Contact person name (strict priority)
  const getContactPersonName = () => {
    // Check companyProfile.contactPerson first
    if (user.companyProfile?.contactPerson) {
      return user.companyProfile.contactPerson
    }

    // Check contactPersonName (from mapUserPreview)
    if (user.contactPersonName && typeof user.contactPersonName === 'object') {
      const parts = [user.contactPersonName.first, user.contactPersonName.last].filter(Boolean)
      if (parts.length) return parts.join(' ')
    }

    // Check name object
    if (user.name && typeof user.name === 'object') {
      const parts = [user.name.first, user.name.last].filter(Boolean)
      if (parts.length) return parts.join(' ')
    }

    // Check personName (from mapUserPreview)
    if (user.personName && typeof user.personName === 'string' && user.personName.trim()) {
      return user.personName
    }

    // Check name as string
    if (typeof user.name === 'string' && user.name.trim()) {
      return user.name
    }

    return user.username || null
  }

  // ===============================
  // 🏫 SCHOOL / 🏢 COMPANY USER
  // ===============================
  if (isOrgUser && organizationName) {
    return {
      displayName: organizationName,        // BIG / BOLD
      subtitle: getContactPersonName(),     // Contact person
      isCompanyUser: true,
    }
  }

  // ===============================
  // 👤 INDIVIDUAL USER
  // ===============================
  const personName = (() => {
    if (typeof user.name === 'string' && user.name.trim()) return user.name
    if (user.name && typeof user.name === 'object') {
      const parts = [user.name.first, user.name.last].filter(Boolean)
      if (parts.length) return parts.join(' ')
    }
    return user.username || 'User'
  })()

  const getRoleDisplayName = (role) => {
    const roleMap = {
      education_manager: 'Education Manager',
      student: 'Student',
      freelancer: 'Freelancer',
      job_seeker: 'Job Seeker',
    }
    return (
      roleMap[role] ||
      role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    )
  }

  let subtitle = null

  if (roles.length) {
    const nonGenericRole = roles.find(
      r => !['user', 'student'].includes(r) && !r.includes('company')
    )
    if (nonGenericRole) {
      subtitle = getRoleDisplayName(nonGenericRole)
    }
  }

  if (!subtitle) {
    subtitle =
      user.title ||
      user.studentProfile?.specializations?.[0] ||
      user.social?.bio?.slice(0, 50) ||
      null
  }

  return {
    displayName: personName,
    subtitle,
    isCompanyUser: false,
  }
}

/**
 * Shorthands
 */
export const getDisplayName = user =>
  getDisplayNameWithSubtitle(user).displayName

export const getSubtitle = user =>
  getDisplayNameWithSubtitle(user).subtitle

export const isCompanyUser = user =>
  !!user?.roles?.some(role => ORG_ROLES.includes(role))
