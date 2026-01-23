export const SCHOOL_ROLES = new Set(['school_admin', 'education_manager', 'teacher'])
export const UNIVERSITY_ROLES = new Set(['university_admin', 'university_manager'])
export const COMPANY_ROLES = new Set(['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'])

export const getPrimaryEntity = (roles = []) => {
  if (!Array.isArray(roles) || roles.length === 0) return 'student'
  if (roles.includes('student')) return 'student'
  if (roles.some((role) => SCHOOL_ROLES.has(role))) return 'school'
  if (roles.some((role) => UNIVERSITY_ROLES.has(role))) return 'university'
  if (roles.some((role) => COMPANY_ROLES.has(role))) return 'company'
  return 'student'
}

export const hasRole = (roles = [], target) => roles?.includes(target)
export const hasAnyRole = (roles = [], targetRoles = []) => targetRoles.some((role) => roles?.includes(role))
