export const keywordSuggestions = [
  // Core categories and role variations for dropdown matching
  'AI',
  'Artificial Intelligence',
  'Data Science',
  'Data Scientist',
  'Data Analyst',
  'Machine Learning',
  'Frontend',
  'Frontend Developer',
  'Frontend Engineer',
  'React Developer',
  'Backend',
  'Backend Engineer',
  'API Engineer',
  'Full Stack',
  'Full Stack Developer',
  'Fullstack Engineer',
  'Product Manager',
  'PM',
  'Product Owner',
  'DevOps',
  'SRE',
  'Mobile',
  'iOS',
  'Android',
  'Node',
  'Python',
  'Java',
  'Golang',
  'JavaScript',
  'TypeScript',
  'Vue',
  'Angular',
  'Django',
  'Flask',
  'Data Engineering',
  'MLOps',
  'Agile',
  'Scrum'
]

export const locationSuggestions = [
  'USA', 'United Kingdom', 'Sweden', 'Germany', 'Remote', 'Hybrid', 'On-site', 'New York, NY', 'San Francisco, CA', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Stockholm, Sweden'
]

export const mockJobs = [
  {
    id: 'j1',
    title: 'AI Engineer',
    company: 'Tennr',
    location: 'New York City, New York, USA',
    salary: '$200K - $240K per year',
    employmentType: 'Full-time',
    locationType: 'On-site',
    seniority: 'Senior',
    tags: ['Python', 'ML', 'LLMs', 'MLOps'],
    description:
      'Tennr prevents delays and denials by ensuring every referral gets where it needs to go, with the right info, at the right time. You will build production ML systems and ship features impacting healthcare.',
    applied: false,
    wishlisted: false
  },
  {
    id: 'j2',
    title: 'AI Specialist',
    company: 'Snowflake',
    location: 'Remote Bay Area, CA, USA',
    salary: '$180K - $210K per year',
    employmentType: 'Full-time',
    locationType: 'Remote',
    seniority: 'Mid',
    tags: ['SQL', 'Python', 'Data Engineering'],
    description:
      'Build and optimize data pipelines and ML features atop Snowflake. Work with cross-functional teams to deliver analytics products at scale.',
    applied: false,
    wishlisted: true
  },
  {
    id: 'j3',
    title: 'AI Associate',
    company: 'Flagship Pioneering',
    location: 'Cambridge, MA, USA',
    salary: '$150K - $180K per year',
    employmentType: 'Full-time',
    locationType: 'Hybrid',
    seniority: 'Junior',
    tags: ['Research', 'Python', 'BioTech'],
    description:
      'Contribute to cutting-edge research at the intersection of AI and biotechnology. Collaborate with scientists and engineers to build novel platforms.',
    applied: true,
    wishlisted: false
  },
  {
    id: 'j4',
    title: 'Frontend Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA, USA',
    salary: '$120K - $150K per year',
    employmentType: 'Full-time',
    locationType: 'Hybrid',
    seniority: 'Mid',
    tags: ['React', 'JavaScript', 'CSS'],
    description:
      'Develop responsive user interfaces using React and modern web technologies. Collaborate with designers and backend teams to deliver seamless user experiences.',
    applied: false,
    wishlisted: false
  },
  {
    id: 'j5',
    title: 'Backend Engineer',
    company: 'DataFlow Inc.',
    location: 'Austin, TX, USA',
    salary: '$130K - $160K per year',
    employmentType: 'Full-time',
    locationType: 'On-site',
    seniority: 'Senior',
    tags: ['Node', 'Python', 'APIs'],
    description:
      'Build scalable backend services and APIs. Work on microservices architecture and integrate with databases for high-performance applications.',
    applied: false,
    wishlisted: true
  },
  {
    id: 'j6',
    title: 'Full Stack Developer',
    company: 'InnovateLabs',
    location: 'Remote, USA',
    salary: '$140K - $170K per year',
    employmentType: 'Full-time',
    locationType: 'Remote',
    seniority: 'Mid',
    tags: ['React', 'Node', 'MongoDB'],
    description:
      'Handle end-to-end development from frontend UI to backend logic. Ensure seamless integration and optimize for performance and security.',
    applied: true,
    wishlisted: false
  },
  {
    id: 'j7',
    title: 'Data Scientist',
    company: 'Analytics Pro',
    location: 'New York, NY, USA',
    salary: '$150K - $180K per year',
    employmentType: 'Full-time',
    locationType: 'Hybrid',
    seniority: 'Senior',
    tags: ['Python', 'Machine Learning', 'Data Analysis'],
    description:
      'Analyze large datasets to derive insights and build predictive models. Collaborate with product teams to drive data-driven decisions.',
    applied: false,
    wishlisted: false
  },
  {
    id: 'j8',
    title: 'Product Manager',
    company: 'Productive Co.',
    location: 'Seattle, WA, USA',
    salary: '$160K - $190K per year',
    employmentType: 'Full-time',
    locationType: 'On-site',
    seniority: 'Mid',
    tags: ['Agile', 'Scrum', 'Strategy'],
    description:
      'Lead product development from ideation to launch. Work with engineering and design teams to define roadmaps and prioritize features.',
    applied: false,
    wishlisted: true
  }
  ,
  {
    id: 'j9',
    title: 'Frontend Engineer',
    company: 'PixelWave',
    location: 'Berlin, Germany',
    salary: '€70K - €95K per year',
    employmentType: 'Full-time',
    locationType: 'Hybrid',
    seniority: 'Mid',
    tags: ['React', 'TypeScript', 'CSS'],
    description:
      'Build and maintain high-performance web applications with a focus on accessibility and performance. Collaborate closely with designers to ship polished UIs.',
    applied: false,
    wishlisted: false
  },
  {
    id: 'j10',
    title: 'Backend Engineer (Payments)',
    company: 'ChargeFlow',
    location: 'Remote, Europe',
    salary: '€85K - €110K per year',
    employmentType: 'Full-time',
    locationType: 'Remote',
    seniority: 'Senior',
    tags: ['Node', 'Go', 'APIs', 'Postgres'],
    description:
      'Design resilient payment processing systems, optimize throughput and ensure data integrity across distributed services.',
    applied: false,
    wishlisted: true
  },
  {
    id: 'j11',
    title: 'Full Stack Developer',
    company: 'BrightBuild',
    location: 'Austin, TX, USA',
    salary: '$120K - $140K per year',
    employmentType: 'Full-time',
    locationType: 'On-site',
    seniority: 'Mid',
    tags: ['React', 'Node', 'GraphQL'],
    description:
      'Own features end-to-end: build UI components, connect GraphQL endpoints and iterate quickly with product feedback.',
    applied: false,
    wishlisted: false
  },
  {
    id: 'j12',
    title: 'Data Scientist — Personalization',
    company: 'Recommendo',
    location: 'San Francisco, CA, USA',
    salary: '$170K - $200K per year',
    employmentType: 'Full-time',
    locationType: 'Hybrid',
    seniority: 'Senior',
    tags: ['Python', 'Machine Learning', 'Experimentation'],
    description:
      'Develop personalization and ranking models for web and mobile. Run A/B experiments and productionize models with observability in mind.',
    applied: false,
    wishlisted: false
  },
  {
    id: 'j13',
    title: 'Technical Product Manager',
    company: 'InfraScale',
    location: 'New York, NY, USA',
    salary: '$150K - $180K per year',
    employmentType: 'Full-time',
    locationType: 'On-site',
    seniority: 'Mid',
    tags: ['Product', 'APIs', 'Cloud'],
    description:
      'Drive product initiatives for developer-facing platform features. Partner with engineering to define APIs, SLAs, and rollout plans.',
    applied: false,
    wishlisted: true
  },
  {
    id: 'j14',
    title: 'Site Reliability Engineer',
    company: 'ScaleOps',
    location: 'Remote Bay Area, CA, USA',
    salary: '$180K - $210K per year',
    employmentType: 'Full-time',
    locationType: 'Remote',
    seniority: 'Senior',
    tags: ['SRE', 'Kubernetes', 'Monitoring'],
    description:
      'Improve reliability and uptime across services, build runbooks, and automate incident response and remediation.',
    applied: false,
    wishlisted: false
  }
]
