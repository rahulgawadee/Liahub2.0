import { PROGRAMME_OPTIONS } from '@/lib/programmeOptions'

const isValidDateParts = (year, month, day) => {
	if (!year || !month || !day) return false
	if (month < 1 || month > 12) return false
	if (day < 1 || day > 31) return false
	const date = new Date(Date.UTC(year, month - 1, day))
	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	)
}

const normaliseYear = (year) => {
	if (year >= 1000) return year
	if (year >= 70) return 1900 + year
	return 2000 + year
}

const toYY = (year) => String(year).slice(-2).padStart(2, '0')
const toMMDD = (value) => String(value).padStart(2, '0')

export const DATE_FORMAT_YEARMONTHDAY_SHORT = 'YY/MM/DD'
export const DATE_FORMAT_PATTERN = /^\d{2}\/\d{2}\/\d{2}$/

export const formatDateYYMMDD = (value) => {
	if (value === undefined || value === null) return ''
	const raw = String(value).trim()
	if (!raw) return ''

	const alreadyFormatted = raw.match(/^(\d{2})[\/-](\d{2})[\/-](\d{2})$/)
	if (alreadyFormatted) {
		const [, yy, mm, dd] = alreadyFormatted
		const year = normaliseYear(Number(yy))
		if (isValidDateParts(year, Number(mm), Number(dd))) {
			return `${yy}/${toMMDD(mm)}/${toMMDD(dd)}`
		}
	}

	const matchYMD = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
	if (matchYMD) {
		const year = Number(matchYMD[1])
		const month = Number(matchYMD[2])
		const day = Number(matchYMD[3])
		if (isValidDateParts(year, month, day)) {
			return `${toYY(year)}/${toMMDD(month)}/${toMMDD(day)}`
		}
	}

	const matchDMY = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/)
	if (matchDMY) {
		const day = Number(matchDMY[1])
		const month = Number(matchDMY[2])
		const rawYear = Number(matchDMY[3])
		const year = matchDMY[3].length === 2 ? normaliseYear(rawYear) : rawYear
		if (isValidDateParts(year, month, day)) {
			return `${toYY(year)}/${toMMDD(month)}/${toMMDD(day)}`
		}
	}

	const parsed = new Date(raw)
	if (!Number.isNaN(parsed.getTime())) {
		const year = parsed.getFullYear()
		const month = parsed.getMonth() + 1
		const day = parsed.getDate()
		if (isValidDateParts(year, month, day)) {
			return `${toYY(year)}/${toMMDD(month)}/${toMMDD(day)}`
		}
	}

	return raw
}

export const formatStudentCohortValue = formatDateYYMMDD

export const SECTION_KEYS = {
	students: 'students',
	teachers: 'teachers',
	educationManagers: 'educationManagers',
	adminManagement: 'adminManagement',
	companies: 'companies',
	leadingCompanies: 'leadingCompanies',
	liahubCompanies: 'liahubCompanies',
}

const STATUS_OPTIONS = ['Active', 'Inactive', 'Pending']
const DEFAULT_STATUS = STATUS_OPTIONS[0]

const normalizeEntity = (value) => (typeof value === 'string' ? value.toLowerCase() : '')
const normalizeRole = (value) => (typeof value === 'string' ? value.toLowerCase() : '')

export const SECTION_SEQUENCE = [
	SECTION_KEYS.students,
	SECTION_KEYS.educationManagers,
	SECTION_KEYS.teachers,
	SECTION_KEYS.adminManagement,
	SECTION_KEYS.companies,
	SECTION_KEYS.liahubCompanies,
	SECTION_KEYS.leadingCompanies,
]

export const SECTION_DEFINITIONS = {
	[SECTION_KEYS.students]: {
		recordType: 'student',
		label: 'Students',
		singularLabel: 'Student',
		description: 'Active students participating in programmes.',
		cardTitleKey: 'name',
		cardSubtitleKey: 'programme',
		cardSections: [
			{ key: 'student_info', label: 'Student', keys: ['name', 'programme', 'cohort'] },
			{ key: 'contact', label: 'Contact', keys: ['email', 'phone'] },
			{ key: 'placement', label: 'Placement', keys: ['placement'] },
		],
		columns: [
			{
				key: 'cohort',
				label: 'Date',
				type: 'text',
				isDate: true,
				format: DATE_FORMAT_YEARMONTHDAY_SHORT,
				placeholder: 'YY/MM/DD (e.g., 25/09/04)',
				helpText: 'Enter date as YY/MM/DD, for example 25/09/04',
				pattern: DATE_FORMAT_PATTERN.source,
				title: 'Use YY/MM/DD format, e.g. 25/09/04',
				inputMode: 'numeric',
				maxLength: 8,
			},
			{ 
				key: 'companySelect', 
				label: 'Company (Select from list)', 
				type: 'select',
				isCompanyDropdown: true,
				dynamicOptions: true,
			},
			{ key: 'placement', label: 'Company', type: 'text', showAvatar: true, linkToProfile: true },
			{ key: 'location', label: 'City/Country', type: 'text' },
			{ key: 'contactPerson', label: 'Contact Person', type: 'text' },
			{ key: 'role', label: 'Role', type: 'text' },
			{ key: 'companyEmail', label: 'Email', type: 'email' },
			{ key: 'phone', label: 'Phone', type: 'text' },
			{ key: 'orgNumber', label: 'Company Org/Reg No', type: 'text' },
			{ key: 'notes', label: 'Notes', type: 'text' },
			{ key: 'assignmentProcess', label: 'Assignment/Selection Process', type: 'text' },
			{ 
				key: 'programme', 
				label: 'NBI/Commercial Administration program', 
				type: 'select',
				options: PROGRAMME_OPTIONS,
			},
			{
				key: 'educationLeader',
				label: 'Education Leader',
				type: 'select',
				// Program managers
				options: [
					'Zuzana Polievka',
					'Maria Holm',
					'Magdalena Fagerlind',
				],
			},
			{ key: 'name', label: 'Student Name', type: 'text', required: true, showAvatar: true, linkToProfile: true },
			{ key: 'email', label: 'Student Email (School)', type: 'email' },
			{ key: 'infoFromLeader', label: 'Info from Leader', type: 'text' },
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				variant: 'status',
				defaultValue: DEFAULT_STATUS,
				excludeFromData: true,
				options: STATUS_OPTIONS,
			},
		],
		upload: {
			title: 'Upload Student Data (Excel)',
			endpoint: '/dashboard/school/upload-students-excel',
			expectedColumns: [
				'Date',
				'Företag',
				'Ort/land',
				'Kontaktperson',
				'Roll',
				'Mejl',
				'Telefon',
				'Ftg org/reg nr',
				'Notera',
				'Tilldela/urvalsprocess',
				'NBI/Handelsakadmin program',
				'UL',
				'Studerande Namn',
				'Studerande mejladress (skola)',
				'Info från UL',
			],
		},
		addEnabled: true,
		defaultStatus: DEFAULT_STATUS,
	},
	[SECTION_KEYS.teachers]: {
		recordType: 'teacher',
		label: 'Teachers',
		singularLabel: 'Teacher',
		description: 'Coordinators supporting students on the field.',
		cardTitleKey: 'leader',
		cardSubtitleKey: 'place',
		cardSections: [
			{ key: 'leader_info', label: 'Leader information', keys: ['leader', 'contact', 'phone'] },
			{ key: 'location', label: 'Location', keys: ['place'] },
			{ key: 'students', label: 'Students', keys: ['students'] },
		],
		columns: [
			{ key: 'leader', label: 'Teacher', type: 'text', required: true, showAvatar: true, linkToProfile: true },
			{
				key: 'contact',
				label: 'Contact',
				type: 'email',
				secondaryKey: 'phone',
				secondaryLabel: 'Phone',
				secondaryType: 'tel',
			},
			{ key: 'place', label: 'Location', type: 'text' },
			{ key: 'students', label: 'Students', type: 'number', defaultValue: 0 },
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				variant: 'status',
				defaultValue: DEFAULT_STATUS,
				excludeFromData: true,
				options: STATUS_OPTIONS,
			},
		],
		addEnabled: true,
		defaultStatus: DEFAULT_STATUS,
	},
	[SECTION_KEYS.liahubCompanies]: {
		recordType: 'liahub_company',
		label: 'LiaHub Companies',
		singularLabel: 'LiaHub Company',
		description: 'Partner companies managed via LiaHub import or manual entry.',
		cardTitleKey: 'business',
		cardSubtitleKey: 'contactPerson',
		cardSections: [
			{ key: 'company', label: 'Company', keys: ['business', 'location'] },
			{ key: 'contact', label: 'Contact', keys: ['contactPerson', 'contactEmail', 'phone'] },
			{ key: 'students', label: 'Students', keys: ['students'] },
		],
		columns: [
			{
				key: 'date',
				label: 'Date',
				type: 'text',
				isDate: true,
				format: DATE_FORMAT_YEARMONTHDAY_SHORT,
				placeholder: 'YY/MM/DD (e.g., 25/09/04)',
				helpText: 'Enter date as YY/MM/DD, for example 25/09/04',
				pattern: DATE_FORMAT_PATTERN.source,
				title: 'Use YY/MM/DD format, e.g. 25/09/04',
				inputMode: 'numeric',
				maxLength: 8,
			},
			{ key: 'business', label: 'Company', type: 'text', required: true, showAvatar: true, linkToProfile: true },
			{ key: 'location', label: 'City/Country', type: 'text' },
			{ key: 'contactPerson', label: 'Contact Person', type: 'text', showAvatar: true, linkToProfile: true },
			{ key: 'role', label: 'Role', type: 'text' },
			{ key: 'contactEmail', label: 'Email', type: 'email' },
			{ key: 'phone', label: 'Phone', type: 'text' },
			{ key: 'orgNumber', label: 'Company Org/Reg No', type: 'text' },
			{ key: 'students', label: 'Students', type: 'number', defaultValue: 0 },
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				variant: 'status',
				defaultValue: DEFAULT_STATUS,
				excludeFromData: true,
				options: STATUS_OPTIONS,
			},
		],
		addEnabled: false,
		defaultStatus: DEFAULT_STATUS,
	},
	[SECTION_KEYS.educationManagers]: {
		recordType: 'education_manager',
		label: 'Education Managers',
		singularLabel: 'Education Manager',
		description: 'Education managers responsible for programmes.',
		cardTitleKey: 'leader',
		cardSubtitleKey: 'place',
		cardSections: [
			{ key: 'leader_info', label: 'Manager information', keys: ['leader', 'contact', 'phone'] },
			{ key: 'location', label: 'Location', keys: ['place'] },
			{ key: 'students', label: 'Students', keys: ['students'] },
		],
		columns: [
			{ key: 'leader', label: 'Manager', type: 'text', required: true, showAvatar: true, linkToProfile: true },
			{
				key: 'contact',
				label: 'Contact',
				type: 'email',
				secondaryKey: 'phone',
				secondaryLabel: 'Phone',
				secondaryType: 'tel',
			},
			{ key: 'programme', label: 'NBI/Commercial Administration program', type: 'select', options: PROGRAMME_OPTIONS, required: true },
			{ key: 'place', label: 'Location', type: 'text' },
			{ key: 'students', label: 'Students', type: 'number', defaultValue: 0 },
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				variant: 'status',
				defaultValue: DEFAULT_STATUS,
				excludeFromData: true,
				options: STATUS_OPTIONS,
			},
		],
		addEnabled: true,
		defaultStatus: DEFAULT_STATUS,
	},
	[SECTION_KEYS.adminManagement]: {
		recordType: 'admin',
		label: 'Admins',
		singularLabel: 'Admin',
		description: 'Admin management contacts.',
		cardTitleKey: 'leader',
		cardSubtitleKey: 'place',
		cardSections: [
			{ key: 'admin_info', label: 'Admin information', keys: ['leader', 'contact', 'phone'] },
			{ key: 'location', label: 'Location', keys: ['place'] },
			{ key: 'students', label: 'Students', keys: ['students'] },
		],
		columns: [
			{ key: 'leader', label: 'Admin', type: 'text', required: true, showAvatar: true, linkToProfile: true },
			{
				key: 'contact',
				label: 'Contact',
				type: 'email',
				secondaryKey: 'phone',
				secondaryLabel: 'Phone',
				secondaryType: 'tel',
			},
			{ key: 'place', label: 'Location', type: 'text' },
			{ key: 'students', label: 'Students', type: 'number', defaultValue: 0 },
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				variant: 'status',
				defaultValue: DEFAULT_STATUS,
				excludeFromData: true,
				options: STATUS_OPTIONS,
			},
		],
		addEnabled: false,
		defaultStatus: DEFAULT_STATUS,
	},
	[SECTION_KEYS.companies]: {
		recordType: 'company',
		label: 'Companies',
		singularLabel: 'Company',
		description: 'Partner companies hosting internships.',
		cardTitleKey: 'business',
		cardSubtitleKey: 'contactPerson',
		cardSections: [
			{ key: 'company_info', label: 'Company information', keys: ['business', 'contactPerson'] },
			{ key: 'contact', label: 'Contact', keys: ['companyEmail', 'phone'] },
			{ key: 'location', label: 'Location', keys: ['location'] },
			{ key: 'students', label: 'Students', keys: ['students'] },
		],
		columns: [
			{
				key: 'date',
				label: 'Date',
				type: 'text',
				isDate: true,
				format: DATE_FORMAT_YEARMONTHDAY_SHORT,
				placeholder: 'YY/MM/DD (e.g., 25/09/04)',
				helpText: 'Enter date as YY/MM/DD, for example 25/09/04',
				pattern: DATE_FORMAT_PATTERN.source,
				title: 'Use YY/MM/DD format, e.g. 25/09/04',
				inputMode: 'numeric',
				maxLength: 8,
			},
			{ key: 'business', label: 'Company', type: 'text', required: true, showAvatar: true, linkToProfile: true },
			{ key: 'location', label: 'City/Country', type: 'text' },
			{ key: 'contactPerson', label: 'Contact Person', type: 'text', showAvatar: true, linkToProfile: true },
			{ key: 'role', label: 'Role', type: 'text' },
			{ key: 'companyEmail', label: 'Email', type: 'email' },
			{ key: 'phone', label: 'Phone', type: 'text' },
			{ key: 'orgNumber', label: 'Company Org/Reg No', type: 'text' },
			{ key: 'students', label: 'Students', type: 'number', defaultValue: 0 },
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				variant: 'status',
				defaultValue: DEFAULT_STATUS,
				excludeFromData: true,
				options: STATUS_OPTIONS,
			},
		],
		addEnabled: false,
		defaultStatus: DEFAULT_STATUS,
	},
	[SECTION_KEYS.leadingCompanies]: {
		recordType: 'lead_company',
		label: 'Lead Companies',
		singularLabel: 'Lead Company',
		description: 'Highlighted companies with the highest engagement.',
		cardTitleKey: 'business',
		cardSubtitleKey: 'contactPerson',
		cardSections: [
			{ key: 'company_info', label: 'Company information', keys: ['business', 'contactPerson'] },
			{ key: 'contact', label: 'Contact', keys: ['email', 'phone'] },
			{ key: 'location', label: 'Location', keys: ['place'] },
			{ key: 'students', label: 'Students', keys: ['students'] },
		],
		columns: [
			{ key: 'business', label: 'Business', type: 'text', required: true, showAvatar: true, linkToProfile: true },
			{ key: 'contactPerson', label: 'Contact person', type: 'text', showAvatar: true, linkToProfile: true },
			{
				key: 'email',
				label: 'Email',
				type: 'email',
				secondaryKey: 'phone',
				secondaryLabel: 'Phone',
				secondaryType: 'tel',
			},
			{ key: 'place', label: 'Place', type: 'text' },
			{ key: 'students', label: 'Students', type: 'number', defaultValue: 0 },
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				variant: 'status',
				defaultValue: DEFAULT_STATUS,
				excludeFromData: true,
				options: STATUS_OPTIONS,
			},
		],
		addEnabled: false,
		defaultStatus: DEFAULT_STATUS,
	},
}

const ENTITY_SECTIONS = {
	student: SECTION_SEQUENCE,
	company: SECTION_SEQUENCE,
	school: SECTION_SEQUENCE,
	university: SECTION_SEQUENCE,
	admin: SECTION_SEQUENCE,
}

const READ_ONLY_ENTITIES = new Set(['student', 'company'])
// Only these roles can toggle edit controls for school dashboard sections.
const EDIT_ROLES = new Set(['platform_admin', 'school_admin', 'education_manager', 'university_admin', 'university_manager'])
const ENTITY_ALWAYS_EDIT = new Set(['university', 'admin'])

const normalizeStatus = (value) => {
	if (!value) return DEFAULT_STATUS
	const formatted = String(value).trim().toLowerCase()
	const match = STATUS_OPTIONS.find((status) => status.toLowerCase() === formatted)
	return match || DEFAULT_STATUS
}

// Converts stored table values into controlled input values without losing empties.
const ensureStringValue = (value, type) => {
	if (value === undefined || value === null) return ''
	if (type === 'number') {
		if (value === '') return ''
		const numeric = Number(value)
		return Number.isFinite(numeric) ? String(numeric) : ''
	}
	return String(value)
}

const toPayloadString = (value, type) => {
	if (Array.isArray(value)) {
		return value.map((entry) => String(entry).trim()).filter(Boolean).join(', ')
	}
	if (type === 'number') {
		if (value === undefined || value === null || value === '') return ''
		const numeric = Number(value)
		return Number.isFinite(numeric) ? String(numeric) : ''
	}
	return value === undefined || value === null ? '' : String(value).trim()
}

const fallbackLabel = (key) =>
	key
		.replace(/([A-Z])/g, ' $1')
		.replace(/_/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/^./, (letter) => letter.toUpperCase())

const applyColumnFormat = (column, value) => {
	if (!column) return value
	if (column.format === DATE_FORMAT_YEARMONTHDAY_SHORT) return formatDateYYMMDD(value)
	return value
}

export const getSectionsForEntity = (entity) => {
	const normalized = normalizeEntity(entity)
	if (!normalized) return SECTION_SEQUENCE
	const list = ENTITY_SECTIONS[normalized]
	return list ? list : SECTION_SEQUENCE
}

export const canEditSection = (entity, sectionKey, roles = []) => {
	const normalizedEntity = normalizeEntity(entity)
	if (normalizedEntity && READ_ONLY_ENTITIES.has(normalizedEntity)) return false
	if (sectionKey === SECTION_KEYS.liahubCompanies) {
		const isAdmin = roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(normalizeRole(role)))
		if (!isAdmin) return false
	}
	const hasRoleAccess = roles?.some((role) => EDIT_ROLES.has(normalizeRole(role)))
	if (hasRoleAccess) return true
	if (!normalizedEntity) return false
	const hasEntityBypass = ENTITY_ALWAYS_EDIT.has(normalizedEntity)
	if (!hasEntityBypass) return false
	const allowed = getSectionsForEntity(normalizedEntity)
	return allowed.includes(sectionKey)
}

export const canAddToSection = (entity, sectionKey, roles = []) => {
	if (!canEditSection(entity, sectionKey, roles)) return false
	if (sectionKey === SECTION_KEYS.liahubCompanies) {
		const isAdmin = roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(normalizeRole(role)))
		if (!isAdmin) return false
	}
	const definition = SECTION_DEFINITIONS[sectionKey]
	return definition?.addEnabled ?? false
}

export const getStatusOptions = () => [...STATUS_OPTIONS]

export const buildInitialValuesForSection = (sectionKey, row = null) => {
	const definition = SECTION_DEFINITIONS[sectionKey]
	if (!definition) return {}

	const values = {}
	definition.columns.forEach((column) => {
		const baseValue = row ? row[column.key] : column.defaultValue
		const rawValue = ensureStringValue(baseValue, column.type)
		values[column.key] = applyColumnFormat(column, rawValue)
		if (column.secondaryKey) {
			const secondaryValue = row ? row[column.secondaryKey] : column.secondaryDefaultValue
			const secondaryRaw = ensureStringValue(secondaryValue, column.secondaryType)
			values[column.secondaryKey] = applyColumnFormat({ ...column, format: column.secondaryFormat }, secondaryRaw)
		}
	})

	values.status = normalizeStatus(row?.status || definition.defaultStatus)
	
	// Include quality field for company-related records
	if (row && [SECTION_KEYS.companies, SECTION_KEYS.leadingCompanies, SECTION_KEYS.liahubCompanies].includes(sectionKey)) {
		values.quality = row.quality || ''
	}
	
	return values
}

export const buildRecordPayloadForSection = (sectionKey, values = {}) => {
	const definition = SECTION_DEFINITIONS[sectionKey]
	if (!definition?.recordType) {
		throw new Error('Unknown section key for payload build')
	}

	const data = {}
	definition.columns.forEach((column) => {
		if (column.excludeFromData) return
		const payloadValue = toPayloadString(values[column.key], column.type)
		data[column.key] = applyColumnFormat(column, payloadValue)
		if (column.secondaryKey) {
			const secondaryValue = toPayloadString(values[column.secondaryKey], column.secondaryType)
			data[column.secondaryKey] = applyColumnFormat({ ...column, format: column.secondaryFormat }, secondaryValue)
		}
	})

	if (sectionKey === SECTION_KEYS.students) {
		const assignedCompanyId = toPayloadString(values.companySelect || values.assignedCompanyId, 'text')
		if (assignedCompanyId) {
			data.assignedCompanyId = assignedCompanyId
		}
		const assignedCompanyName = toPayloadString(values.assignedCompanyName || values.placement, 'text')
		if (assignedCompanyName) {
			data.assignedCompanyName = assignedCompanyName
		}
		const assignedByName = toPayloadString(values.assignedByName, 'text')
		if (assignedByName) {
			data.assignedByName = assignedByName
		}
		const assignedByUserId = toPayloadString(values.assignedByUserId, 'text')
		if (assignedByUserId) {
			data.assignedByUserId = assignedByUserId
		}
		if (data.companySelect !== undefined) {
			delete data.companySelect
		}
	}

	// Include quality field for company-related records
	if ([SECTION_KEYS.companies, SECTION_KEYS.leadingCompanies, SECTION_KEYS.liahubCompanies].includes(sectionKey) && values.quality !== undefined) {
		data.quality = values.quality || ''
	}

	return {
		type: definition.recordType,
		status: normalizeStatus(values.status || definition.defaultStatus),
		data,
		quality: values.quality || '', // Include quality at top level for company records
	}
}

export const getFormFieldsForSection = (sectionKey) => {
	const definition = SECTION_DEFINITIONS[sectionKey]
	if (!definition) return []

	const fields = []
	definition.columns.forEach((column) => {
		fields.push({
			key: column.key,
			label: column.label,
			type: column.type || 'text',
			required: Boolean(column.required),
			options: column.options || null,
			placeholder: column.placeholder || null,
			helpText: column.helpText || null,
			pattern: column.pattern || null,
			title: column.title || null,
			inputMode: column.inputMode || null,
			maxLength: column.maxLength ?? null,
			isDate: column.isDate || false,
		})
		if (column.secondaryKey) {
			fields.push({
				key: column.secondaryKey,
				label: column.secondaryLabel || fallbackLabel(column.secondaryKey),
				type: column.secondaryType || 'text',
				required: Boolean(column.secondaryRequired),
				placeholder: column.secondaryPlaceholder || null,
				helpText: column.secondaryHelpText || null,
				pattern: column.secondaryPattern || null,
				title: column.secondaryTitle || null,
				inputMode: column.secondaryInputMode || null,
				maxLength: column.secondaryMaxLength ?? null,
			})
		}
	})

	const hasStatusField = fields.some((field) => field.key === 'status')
	if (!hasStatusField) {
		fields.push({
			key: 'status',
			label: 'Status',
			type: 'select',
			required: true,
			options: [...STATUS_OPTIONS],
		})
	}

	return fields
}

export const SECTION_KEY_BY_RECORD_TYPE = Object.freeze(
	Object.entries(SECTION_DEFINITIONS).reduce((acc, [sectionKey, definition]) => {
		if (definition.recordType) acc[definition.recordType] = sectionKey
		return acc
	}, {})
)

