import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Briefcase, Users, Mail, FileText } from 'lucide-react'
import DashboardShell from '@/Components/dashboard/DashboardShell'
import LiaInfoCard from '@/Components/dashboard/LiaInfoCard'
import CompanyAssignmentsPanel from '@/Components/dashboard/CompanyAssignmentsPanel'
import TableManager from '@/Components/table/TableManager'
import { selectAuth } from '@/redux/store'
import {
  fetchStudentDashboard,
  selectDashboardStatus,
  selectSectionData,
  selectStats,
  SECTION_KEYS,
} from '@/redux/slices/tableSlice'

export default function CompanyHome(){
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  // Always show LIA Info for companies
  const showLiaInfo = true
  const dashboardStatus = useSelector(selectDashboardStatus)
  const stats = useSelector(selectStats)
  const studentsSection = useSelector(selectSectionData(SECTION_KEYS.students))
  const companiesSection = useSelector(selectSectionData(SECTION_KEYS.companies))
  const pendingAssignmentsCount = studentsSection?.pendingAssignments?.length ?? 0

  React.useEffect(() => {
    if (!user) return
    if (dashboardStatus === 'idle' || dashboardStatus === 'failed') {
      dispatch(fetchStudentDashboard())
    }
  }, [dashboardStatus, dispatch, user])

  const activeStudents = studentsSection?.data?.length ?? 0
  const placementPartners = companiesSection?.data?.length ?? 0

  const dashboardStats = [
    { title: 'Active Interns', value: activeStudents, subtext: 'Students engaged with your org', icon: Users },
    { title: 'Open Placements', value: stats.activePlacements ?? 0, subtext: 'Roles currently available', icon: Briefcase },
    { title: 'Pending Reviews', value: pendingAssignmentsCount, subtext: 'Awaiting your confirmation', icon: FileText },
    { title: 'Unread Messages', value: stats.unreadMessages ?? 0, subtext: 'Follow up soon', icon: Mail },
  ]

  return (
    <DashboardShell
      title="Employer Dashboard"
      entity="company"
      subtitle="Monitor internship requests, collaborate with schools, and review student submissions."
      stats={dashboardStats}
      infoCard={showLiaInfo ? <LiaInfoCard /> : null}
      pendingAssignments={<CompanyAssignmentsPanel />}
    >
      <TableManager />
    </DashboardShell>
  )
}
