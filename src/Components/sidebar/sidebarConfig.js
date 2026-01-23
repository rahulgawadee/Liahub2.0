import { Home, Compass, MessageSquare, Bell, FileText, Briefcase, Command, Users, Settings, Lock, Building2, GraduationCap, UserRound, Share2 } from 'lucide-react'
import { getPrimaryEntity } from '@/lib/roles'

const createItem = (title, icon, url) => ({ title, icon, url })

const BASE_ITEMS = {
  explore: createItem('Explore', Compass, '/explore'),
  posts: createItem('Posts', Share2, '/feed'),
  message: createItem('Message', MessageSquare, '/message'),
  notifications: createItem('Notifications', Bell, '/notifications'),
  documents: createItem('Documents', FileText, '/documents'),
  jobs: createItem('Jobs', Briefcase, '/jobs'),
  lia: createItem('Lia', Command, '/lia'),
  network: createItem('Network', Users, '/network'),
  profile: createItem('Profile', UserRound, '/profile'),
}

const ENTITY_NAV = {
  student: [
    createItem('Student Home', Home, '/student'),
    BASE_ITEMS.posts,
    BASE_ITEMS.message,
     BASE_ITEMS.explore,
    BASE_ITEMS.notifications,
    BASE_ITEMS.documents,
    BASE_ITEMS.jobs,
    BASE_ITEMS.lia,
    BASE_ITEMS.network,
    BASE_ITEMS.profile,
  ],
  school: [
    createItem('School Home', Home, '/school'),
    BASE_ITEMS.posts,
    BASE_ITEMS.explore,
    BASE_ITEMS.message,
    BASE_ITEMS.notifications,
    BASE_ITEMS.documents,
    BASE_ITEMS.jobs,
    BASE_ITEMS.lia,
    createItem('Contract', FileText, '/contracts'),
    BASE_ITEMS.network,
    BASE_ITEMS.profile,
  ],
  university: [
    createItem('University Home', GraduationCap, '/universities'),
    BASE_ITEMS.posts,
    BASE_ITEMS.explore,
    BASE_ITEMS.message,
    BASE_ITEMS.notifications,
    BASE_ITEMS.documents,
    BASE_ITEMS.jobs,
    createItem('Internship ', Command, '/lia'),
    BASE_ITEMS.network,
    BASE_ITEMS.profile,
  ],
  company: [
    createItem('Company Home', Building2, '/company'),
    BASE_ITEMS.posts,
    BASE_ITEMS.message,
    BASE_ITEMS.notifications,
    BASE_ITEMS.documents,
    createItem('Contract', FileText, '/contracts'),
    BASE_ITEMS.jobs,
    BASE_ITEMS.network,
    BASE_ITEMS.lia,
    BASE_ITEMS.profile,
  ],
}

const DEFAULT_MORE = [
  createItem('Settings', Settings, '/settings'),
  createItem('Privacy', Lock, '/privacy'),
]

const resolveEntity = (input) => {
  if (!input) return 'student'
  if (typeof input === 'string') return ENTITY_NAV[input] ? input : 'student'
  if (Array.isArray(input)) return getPrimaryEntity(input)
  if (typeof input === 'object') {
    if (input.entity && ENTITY_NAV[input.entity]) return input.entity
    if (Array.isArray(input.roles)) return getPrimaryEntity(input.roles)
  }
  return 'student'
}

export function getSidebarConfig(input) {
  const entity = resolveEntity(input)
  const key = ENTITY_NAV[entity] ? entity : 'student'
  return {
    navItems: ENTITY_NAV[key],
    moreItems: DEFAULT_MORE,
  }
}
