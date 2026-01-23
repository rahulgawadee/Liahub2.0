export const mockJobApplications = [
  {
    jobId: 'j1',
    jobTitle: 'AI Engineer',
    jobType: 'Job',
    company: 'Tennr',
    location: 'New York City, New York, USA',
    postedOn: '2025-09-01',
    hiringManager: 'Jordan Blake',
    applicants: [
      {
        id: 'app-j1-001',
        studentId: 'stu-101',
        studentName: 'Alice Johnson',
        institute: 'NBI Handelsakademin',
        status: 'applied',
        stage: 'Screening',
        submittedOn: '2025-09-10',
        profileScore: 87,
        notes: 'Strong portfolio focused on healthcare ML.',
        resumeUrl: '/public/pdfs/Welcome to NBI_Handelsakademin as LIA supervisor (1).pdf'
      },
      {
        id: 'app-j1-002',
        studentId: 'stu-111',
        studentName: 'Leo Fernández',
        institute: 'Chalmers University',
        status: 'interview',
        stage: 'Interview',
        submittedOn: '2025-09-07',
        profileScore: 91,
        notes: 'Completed technical take-home. Awaiting manager feedback.',
        resumeUrl: '/public/pdfs/LIA_Internship_Benefits_English.pdf'
      },
      {
        id: 'app-j1-003',
        studentId: 'stu-175',
        studentName: 'Rahul Andersson',
        institute: 'NBI Handelsakademin',
        status: 'selected',
        stage: 'Final Review',
        submittedOn: '2025-08-31',
        profileScore: 95,
        offerLetter: {
          sentOn: '2025-09-15',
          startDate: '2025-10-01',
          compensation: '$230K + equity',
          note: 'Offer accepted verbally, awaiting signature.'
        },
        resumeUrl: '/public/pdfs/Välkommen till NBI_Handelsakademin som LIA-handledare - svenska.pdf'
      }
    ]
  },
  {
    jobId: 'j6',
    jobTitle: 'Full Stack Developer',
    jobType: 'LIA',
    company: 'InnovateLabs',
    location: 'Remote, USA',
    postedOn: '2025-08-22',
    hiringManager: 'Priya Sharma',
    applicants: [
      {
        id: 'app-j6-001',
        studentId: 'stu-209',
        studentName: 'Bartosz Nowak',
        institute: 'Linnaeus University',
        status: 'applied',
        stage: 'Assignment',
        submittedOn: '2025-09-12',
        profileScore: 78,
        notes: 'Waiting for coding exercise submission.'
      },
      {
        id: 'app-j6-002',
        studentId: 'stu-218',
        studentName: 'Greta Lind',
        institute: 'NBI Handelsakademin',
        status: 'rejected',
        stage: 'Screening',
        submittedOn: '2025-08-28',
        profileScore: 69,
        notes: 'Hard requirement: TypeScript experience missing.'
      }
    ]
  },
  {
    jobId: 'j11',
    jobTitle: 'Full Stack Developer',
    jobType: 'Job',
    company: 'BrightBuild',
    location: 'Austin, TX, USA',
    postedOn: '2025-07-30',
    hiringManager: 'Ebba Larsson',
    applicants: [
      {
        id: 'app-j11-001',
        studentId: 'stu-300',
        studentName: 'Malik Chen',
        institute: 'Halmstad University',
        status: 'offer-sent',
        stage: 'Offer',
        submittedOn: '2025-08-15',
        profileScore: 88,
        offerLetter: {
          sentOn: '2025-08-29',
          startDate: '2025-09-15',
          compensation: '$135K + bonus',
          note: 'Offer awaiting candidate signature.'
        }
      },
      {
        id: 'app-j11-002',
        studentId: 'stu-301',
        studentName: 'Sara Holm',
        institute: 'NBI Handelsakademin',
        status: 'in-review',
        stage: 'Hiring Manager Review',
        submittedOn: '2025-08-20',
        profileScore: 84
      }
    ]
  }
]
