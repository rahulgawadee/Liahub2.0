import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BookOpen, MessageCircle, Briefcase, Bell } from 'lucide-react'
import DashboardShell from '@/Components/dashboard/DashboardShell'
import { selectAuth } from '@/redux/store'
import {
  fetchStudentDashboard,
  SECTION_KEYS,
  selectActiveSection,
  selectSectionData,
  selectStats,
  selectStudentDashboard,
} from '@/redux/slices/tableSlice'

export default function StudentDashboard() {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const stats = useSelector(selectStats)
  const dashboardState = useSelector(selectStudentDashboard)
  const activeSection = useSelector(selectActiveSection)
  const sectionState = useSelector(selectSectionData(activeSection))
  const educationManagersSection = useSelector(selectSectionData(SECTION_KEYS.educationManagers))

  React.useEffect(() => {
    if (!user) return
    if (dashboardState.status === 'idle') {
      dispatch(fetchStudentDashboard())
    }
  }, [dispatch, dashboardState.status, user])

  const dashboardStats = [
    { title: 'Active Placements', value: stats.activePlacements ?? 0, subtext: 'Internships & projects', icon: Briefcase },
    { title: 'Messages', value: stats.unreadMessages ?? 0, subtext: 'Unread conversations', icon: MessageCircle },
    {
      title: 'Education Managers',
      value: educationManagersSection?.data?.length ?? 0,
      subtext: 'Directory entries',
      icon: BookOpen,
    },
    { title: 'Alerts', value: stats.alerts ?? 0, subtext: 'Recent notifications', icon: Bell },
  ]

  return (
    <DashboardShell
      title="Student Dashboard"
      subtitle="Stay on top of your placements, mentors, and programme updates."
      stats={dashboardStats}
    />
  )
}
