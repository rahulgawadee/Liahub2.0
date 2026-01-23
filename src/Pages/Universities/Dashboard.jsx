import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { GraduationCap, Users, ClipboardList, Globe } from 'lucide-react'
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

export default function UniversityDashboard() {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const showLiaInfo = user?.roles?.includes('university_admin') || user?.roles?.includes('university_manager')

  const dashboardStatus = useSelector(selectDashboardStatus)
  const stats = useSelector(selectStats)
  const studentsSection = useSelector(selectSectionData(SECTION_KEYS.students))
  const educationManagersSection = useSelector(selectSectionData(SECTION_KEYS.educationManagers))
  const companiesSection = useSelector(selectSectionData(SECTION_KEYS.leadingCompanies))

  React.useEffect(() => {
    if (!user) return
    if (dashboardStatus === 'idle' || dashboardStatus === 'failed') {
      dispatch(fetchStudentDashboard())
    }
  }, [dashboardStatus, dispatch, user])

  const studentCount = studentsSection?.data?.length ?? 0
  const managerCount = educationManagersSection?.data?.length ?? 0
  const partnerCount = companiesSection?.data?.length ?? 0

  const dashboardStats = [
    { title: 'Active Programmes', value: managerCount, subtext: 'Education managers engaged', icon: GraduationCap },
    { title: 'Students on LIA', value: studentCount, subtext: 'Current records', icon: Users },
    { title: 'Pending Reviews', value: stats.alerts ?? 0, subtext: 'Alerts requiring attention', icon: ClipboardList },
    { title: 'Global Partners', value: partnerCount, subtext: 'Lead company partnerships', icon: Globe },
  ]

  return (
    <DashboardShell
      title="University Dashboard"
      subtitle="Coordinate faculties, manage cohorts, and sync with partner institutions."
      stats={dashboardStats}
      infoCard={showLiaInfo ? <LiaInfoCard /> : null}
    />
  )
}
