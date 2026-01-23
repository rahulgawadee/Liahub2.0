// Mock people directory across entities for Explore/Network/Message flows
// In real app, replace with API calls and remove any random generation.

export const ENTITIES = {
  student: 'student',
  company: 'company',
  school: 'school',
  university: 'university',
}

const skills = [
  'React',
  'Node.js',
  'Python',
  'Java',
  'Data Science',
  'UI/UX',
  'Machine Learning',
  'DevOps',
]

const locations = [
  'Remote',
  'Bangalore, India',
  'Delhi, India',
  'Mumbai, India',
  'Stockholm, Sweden',
  'Gothenburg, Sweden',
  'Berlin, Germany',
  'San Francisco, USA',
]

const pick = (arr, n = 3) => {
  const copy = [...arr]
  const out = []
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

import logoUrl from '@/assets/logo.png'

export const usersMock = [
  {
    id: 'u-stu-1',
    name: 'Aarav Sharma',
    entity: ENTITIES.student,
    title: 'Computer Science Student',
    location: 'Bangalore, India',
    avatarUrl: 'https://i.pravatar.cc/100?img=68',
    bio: 'Aspiring frontend engineer passionate about React and design systems.',
    skills: pick(skills, 4),
  },
  {
    id: 'u-comp-google',
    name: 'Google',
    entity: ENTITIES.company,
    title: 'Technology Company',
    location: 'Mountain View, USA',
    avatarUrl: 'https://logo.clearbit.com/google.com',
    bio: 'Organizing the world\'s information and making it universally accessible and useful.',
    skills: ['Search', 'Cloud', 'AI'],
  },
  {
    id: 'u-comp-1',
    name: 'Acme Corp',
    entity: ENTITIES.company,
    title: 'Tech Company',
    location: 'San Francisco, USA',
  avatarUrl: logoUrl,
    bio: 'We build delightful web products. Always hiring great talent.',
    skills: ['Hiring', 'Product'],
  },
  {
    id: 'u-comp-2',
    name: 'Nordic Soft AB',
    entity: ENTITIES.company,
    title: 'Software Company',
    location: 'Stockholm, Sweden',
  avatarUrl: logoUrl,
    bio: 'Sustainable software for a better world.',
    skills: ['Hiring', 'Sustainability'],
  },
  {
    id: 'u-sch-1',
    name: 'Greenwood High',
    entity: ENTITIES.school,
    title: 'K-12 School',
    location: 'Bangalore, India',
    avatarUrl: 'https://i.pravatar.cc/100?img=7',
    bio: 'Excellence in education and holistic development.',
    skills: ['Education'],
  },
  {
    id: 'u-uni-1',
    name: 'Stockholm University',
    entity: ENTITIES.university,
    title: 'University',
    location: 'Stockholm, Sweden',
    avatarUrl: 'https://i.pravatar.cc/100?img=1',
    bio: 'Leading research and innovation in the Nordics.',
    skills: ['Research'],
  },
].map((u) => ({ ...u, contact: { email: `${u.name.toLowerCase().replace(/\s+/g, '.')}`.replace(/[^a-z.]/g,'') + '@example.com', phone: '+46 70 123 45 67' } }))

export const entityOptions = [
  { key: ENTITIES.student, label: 'Students' },
  { key: ENTITIES.company, label: 'Companies' },
  { key: ENTITIES.school, label: 'Schools' },
  { key: ENTITIES.university, label: 'Universities' },
]

export const locationOptions = locations
