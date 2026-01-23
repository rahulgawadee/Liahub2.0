import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Briefcase, Users, Link as LinkIcon, Bell } from 'lucide-react'
import DashboardShell from '@/Components/dashboard/DashboardShell'
import LiaInfoCard from '@/Components/dashboard/LiaInfoCard'
import { selectAuth } from '@/redux/store'
import {
  fetchStudentDashboard,
  selectDashboardStatus,
  selectSectionData,
  selectStats,
  SECTION_KEYS,
} from '@/redux/slices/tableSlice'

export default function SchoolDashboard() {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const showLiaInfo = user?.roles?.includes('school_admin') || user?.roles?.includes('education_manager')

  const dashboardStatus = useSelector(selectDashboardStatus)
  const stats = useSelector(selectStats)
  const studentsSection = useSelector(selectSectionData(SECTION_KEYS.students))
  const teachersSection = useSelector(selectSectionData(SECTION_KEYS.teachers))
  const companiesSection = useSelector(selectSectionData(SECTION_KEYS.companies))
  
  React.useEffect(() => {
    if (!user) return
    if (dashboardStatus === 'idle' || dashboardStatus === 'failed') {
      dispatch(fetchStudentDashboard())
    }
  }, [dashboardStatus, dispatch, user])

  const studentsCount = studentsSection?.data?.length ?? 0
  const teachersCount = teachersSection?.data?.length ?? 0
  const companiesCount = companiesSection?.data?.length ?? 0

  const dashboardStats = [
    { title: 'Students', value: studentsCount, subtext: 'Active records', icon: Users },
    { title: 'Mentors', value: teachersCount, subtext: 'Teachers & admins', icon: LinkIcon },
    { title: 'Partner Companies', value: companiesCount, subtext: 'Placement partners', icon: Briefcase },
    { title: 'Alerts', value: stats.alerts ?? 0, subtext: 'Latest dashboard alerts', icon: Bell },
  ]

  return (
    <DashboardShell
      title="School Dashboard"
      entity="school"
      stats={dashboardStats}
      infoCard={showLiaInfo ? <LiaInfoCard /> : null}
    />
  )
}
