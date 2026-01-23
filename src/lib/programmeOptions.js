export const PROGRAMME_OPTIONS = [
  'IT',
  'Backend',
  'Frontend',
  'Paralegal',
  'Commercial Administration',
]

export const normalizeProgrammeValue = (value = '') => String(value || '').trim()

export const buildProgrammeOptions = (programmes = []) => {
  const base = Array.isArray(programmes) ? programmes : []
  const normalized = base.map(normalizeProgrammeValue).filter(Boolean)
  const combined = [...new Set([...normalized, ...PROGRAMME_OPTIONS])]
  return combined
}
