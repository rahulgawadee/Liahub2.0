import { getPrimaryEntity } from '@/lib/roles'

const buildFullName = (name = {}, username, email) => {
  if (typeof name === 'string' && name.trim()) return name.trim()
  if (name && typeof name === 'object') {
    if (typeof name.full === 'string' && name.full.trim()) return name.full.trim()
    const parts = [name.first, name.middle, name.last].filter(Boolean)
    if (parts.length) return parts.join(' ')
  }
  if (username) return username
  if (email) return email.split('@')[0]
  return 'Unknown member'
}

const deriveTitle = (user) => {
  if (user.studentProfile?.specializations?.length) {
    return user.studentProfile.specializations[0]
  }
  if (user.staffProfile?.designation) return user.staffProfile.designation
  if (user.companyProfile?.companyName) return user.companyProfile.companyName
  if (user.social?.about) return user.social.about
  if (user.social?.bio) return user.social.bio
  return 'Community member'
}

const deriveSkills = (user) => {
  if (Array.isArray(user.studentProfile?.skills) && user.studentProfile.skills.length) {
    return user.studentProfile.skills
  }
  if (Array.isArray(user.staffProfile?.experiences)) {
    return user.staffProfile.experiences.map((exp) => exp.title).filter(Boolean)
  }
  if (Array.isArray(user.companyProfile?.industries)) {
    return user.companyProfile.industries
  }
  return []
}

export const mapUserPreview = (user) => {
  if (!user) return null
  const safeUser = typeof user.toJSON === 'function' ? user.toJSON() : user
  const entity = getPrimaryEntity(safeUser.roles)
  // Only use actual uploaded avatars - no fallback generation
  // This allows the Avatar component to show the professional UserCircle icon
  const avatarUrl = safeUser.media?.avatar || safeUser.avatarUrl || null

  const id = safeUser.id || (typeof safeUser._id === 'string' ? safeUser._id : safeUser._id?.toString?.())

  // Check if user is company
  const isCompanyUser = safeUser.roles?.some(role => 
    ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'].includes(role)
  )
  const companyName = safeUser.companyProfile?.companyName
  const schoolName = safeUser.schoolProfile?.schoolName
  const personName = buildFullName(safeUser.name, safeUser.username, safeUser.email)

  // Use company name for companies, person name for individuals
  const displayName = isCompanyUser && companyName ? companyName : personName

  return {
    id,
    name: displayName,
    personName, // Keep for reference
    companyName, // For company users
    schoolName, // For school users
    isCompanyUser, // Flag to indicate if this is a company
    contactPersonName: safeUser.name, // Preserve original name object for contact person display
    companyProfile: safeUser.companyProfile, // Preserve company profile
    schoolProfile: safeUser.schoolProfile, // Preserve school profile
    username: safeUser.username, // Preserve username
  handle: safeUser.social?.handle || safeUser.username || (safeUser.email ? safeUser.email.split('@')[0] : undefined),
    title: deriveTitle(safeUser),
    location: safeUser.contact?.location || safeUser.companyProfile?.headquarters || 'Remote',
    avatarUrl,
    bio: safeUser.social?.bio || safeUser.social?.about || '',
    skills: deriveSkills(safeUser),
    contact: {
      email: safeUser.contact?.email || safeUser.email || null,
      phone: safeUser.contact?.phone || null,
      website: safeUser.contact?.website || null,
    },
    entity,
    roles: safeUser.roles || [],
    followerCount: safeUser.followerCount || 0,
    followingCount: safeUser.followingCount || 0,
    raw: safeUser,
  }
}

export const mapConnectionPayload = (connection, currentUserId) => {
  if (!connection) return null
  const safeConnection = typeof connection.toJSON === 'function' ? connection.toJSON() : connection
  const requesterId = safeConnection.requester?.id || safeConnection.requester?._id || safeConnection.requester
  const recipientId = safeConnection.recipient?.id || safeConnection.recipient?._id || safeConnection.recipient
  const requester = mapUserPreview(safeConnection.requester)
  const recipient = mapUserPreview(safeConnection.recipient)
  const isRequester = requesterId?.toString() === currentUserId?.toString()

  return {
    id: safeConnection.id,
    status: safeConnection.status,
    direction: safeConnection.direction || (isRequester ? 'outgoing' : 'incoming'),
    peer: isRequester ? recipient : requester,
    requester,
    recipient,
    message: safeConnection.message,
    createdAt: safeConnection.createdAt,
    updatedAt: safeConnection.updatedAt,
    acceptedAt: safeConnection.acceptedAt,
    rejectedAt: safeConnection.rejectedAt,
  }
}
