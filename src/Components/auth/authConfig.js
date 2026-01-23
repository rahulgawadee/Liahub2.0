import { PROGRAMME_OPTIONS } from '@/lib/programmeOptions'

const createOptions = (labels) =>
  labels.map((label) => ({ value: label.toLowerCase().replace(/\s+/g, '-'), label }))

export const ENTITY_KEYS = ['student', 'school', 'university', 'company']

export const AUTH_ENTITIES = {
  student: {
    key: 'student',
    label: 'Student',
    dashboardRoute: '/student',
    login: {
      title: 'Student Login',
      description: 'Access your personalized student dashboard.',
      fields: [
        {
          name: 'identifier',
          label: 'Email or Username',
          placeholder: 'e.g. john@college.edu or john123',
          autoComplete: 'username',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'current-password',
          required: true,
        },
      ],
    },
    register: {
      title: 'Create a Student Account',
      description: 'Join LiaHub to access opportunities and build your network.',
      fields: [
        {
          name: 'fullName',
          label: 'Full Name',
          placeholder: 'e.g. Priya Sharma',
          autoComplete: 'name',
          required: true,
        },
        {
          name: 'username',
          label: 'Username',
          placeholder: 'Choose a unique username',
          autoComplete: 'username',
          required: true,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'name@email.com',
          autoComplete: 'email',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'new-password',
          required: true,
        },
      ],
      otpHelp: 'We have emailed an OTP to verify your student account.',
    },
  },
  school: {
    key: 'school',
    label: 'School',
    dashboardRoute: '/school',
    login: {
      title: 'School Workspace Login',
      description: 'Select your role in the school and sign in to continue.',
      fields: [
        {
          name: 'subRole',
          label: 'Select your role',
          type: 'select',
          options: createOptions(['Admin', 'Education Manager', 'Teacher']),
          required: true,
        },
        {
          name: 'identifier',
          label: 'Username or Email',
          placeholder: 'Enter your school username or email',
          autoComplete: 'username',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'current-password',
          required: true,
        },
      ],
    },
    register: {
      title: 'Register Your School',
      description: 'Create a school workspace for your team.',
      fields: [
        {
          name: 'organizationName',
          label: 'School Name',
          placeholder: 'e.g. Greenwood High School',
          required: true,
        },
        {
          name: 'subRole',
          label: 'Your role in school',
          type: 'select',
          options: createOptions(['Admin', 'Education Manager', 'Teacher']),
          required: true,
        },
        {
          name: 'programme',
          label: 'NBI/Commercial Administration program',
          type: 'select',
          options: PROGRAMME_OPTIONS.map((option) => ({ value: option, label: option })),
          required: true,
          when: { name: 'subRole', value: 'education-manager' },
        },
        {
          name: 'fullName',
          label: 'Your Name',
          placeholder: 'e.g. Ananya Rao',
          autoComplete: 'name',
          required: true,
        },
        {
          name: 'username',
          label: 'Preferred Username',
          placeholder: 'e.g. ananya.rao',
          autoComplete: 'username',
          required: true,
        },
        {
          name: 'email',
          label: 'Work Email',
          type: 'email',
          placeholder: 'you@school.edu',
          autoComplete: 'email',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'new-password',
          required: true,
        },
      ],
      otpHelp: 'Enter the OTP sent to your work email to activate the school workspace.',
    },
  },
  university: {
    key: 'university',
    label: 'Universities',
    dashboardRoute: '/universities',
    login: {
      title: 'University Workspace Login',
      description: 'Select your role in the university and sign in to continue.',
      fields: [
        {
          name: 'subRole',
          label: 'Select your role',
          type: 'select',
          options: createOptions([
            'Admin',
            'Education Manager',
            'Study Counsellor',
            'Professor',
            'Asst Professor',
            'Junior Researcher',
          ]),
          required: true,
        },
        {
          name: 'identifier',
          label: 'Username or Email',
          placeholder: 'Enter your university username or email',
          autoComplete: 'username',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'current-password',
          required: true,
        },
      ],
    },
    register: {
      title: 'Register Your University',
      description: 'Create a collaborative space for your university team.',
      fields: [
        {
          name: 'organizationName',
          label: 'University Name',
          placeholder: 'e.g. National University of Singapore',
          required: true,
        },
        {
          name: 'subRole',
          label: 'Your role in university',
          type: 'select',
          options: createOptions([
            'Admin',
            'Education Manager',
            'Study Counsellor',
            'Professor',
            'Asst Professor',
            'Junior Researcher',
          ]),
          required: true,
        },
        {
          name: 'fullName',
          label: 'Your Name',
          placeholder: 'e.g. Dr. Kavya Menon',
          autoComplete: 'name',
          required: true,
        },
        {
          name: 'username',
          label: 'Preferred Username',
          placeholder: 'e.g. kavya.menon',
          autoComplete: 'username',
          required: true,
        },
        {
          name: 'email',
          label: 'Work Email',
          type: 'email',
          placeholder: 'you@university.edu',
          autoComplete: 'email',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'new-password',
          required: true,
        },
      ],
      otpHelp: 'We sent an OTP to your university email to confirm your identity.',
    },
  },
  company: {
    key: 'company',
    label: 'Company',
    dashboardRoute: '/company',
    login: {
      title: 'Company Workspace Login',
      description: 'Select your role in the company and sign in to continue.',
      fields: [
        {
          name: 'subRole',
          label: 'Select your role',
          type: 'select',
          options: createOptions(['Employer', 'Hiring Manager', 'Founder', 'CEO']),
          required: true,
        },
        {
          name: 'identifier',
          label: 'Username or Email',
          placeholder: 'Enter your company username or email',
          autoComplete: 'username',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'current-password',
          required: true,
        },
      ],
    },
    register: {
      title: 'Register Your Company',
      description: 'Create a hiring workspace and connect with top talent.',
      fields: [
        {
          name: 'organizationName',
          label: 'Company Name',
          placeholder: 'e.g. LiaHub Technologies',
          required: true,
        },
        {
          name: 'subRole',
          label: 'Your role in company',
          type: 'select',
          options: createOptions(['Employer', 'Hiring Manager', 'Founder', 'CEO']),
          required: true,
        },
        {
          name: 'fullName',
          label: 'Your Name',
          placeholder: 'e.g. Rahul Gawade',
          autoComplete: 'name',
          required: true,
        },
        {
          name: 'username',
          label: 'Preferred Username',
          placeholder: 'e.g. rahul.g',
          autoComplete: 'username',
          required: true,
        },
        {
          name: 'email',
          label: 'Work Email',
          type: 'email',
          placeholder: 'you@company.com',
          autoComplete: 'email',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'new-password',
          required: true,
        },
      ],
      otpHelp: 'Enter the OTP sent to your company email to activate your workspace.',
    },
  },
}

export const ENTITY_SUMMARY = ENTITY_KEYS.map((key) => ({
  key,
  label: AUTH_ENTITIES[key].label,
  route: AUTH_ENTITIES[key].dashboardRoute,
}))
