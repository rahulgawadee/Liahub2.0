import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { GraduationCap, Users, ClipboardList, Globe, Building2, UserCog, CheckCircle, Bell } from 'lucide-react'
import DashboardShell from '@/Components/dashboard/DashboardShell'
import LiaInfoCard from '@/Components/dashboard/LiaInfoCard'
import ProgrammeStudentsChart from '@/Components/dashboard/ProgrammeStudentsChart'
import { selectAuth } from '@/redux/store'
import {
  fetchStudentDashboard,
  selectDashboardStatus,
  selectSectionData,
  selectStats,
  SECTION_KEYS,
} from '@/redux/slices/tableSlice'
import { fetchNotifications, selectUnreadNotificationsCount } from '@/redux/slices/notificationsSlice'

export default function UniversityDashboard() {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const showLiaInfo = user?.roles?.includes('university_admin') || user?.roles?.includes('university_manager')
  const isAdmin = user?.roles?.includes('university_admin')

  const dashboardStatus = useSelector(selectDashboardStatus)
  const stats = useSelector(selectStats)
  const studentsSection = useSelector(selectSectionData(SECTION_KEYS.students))
  const educationManagersSection = useSelector(selectSectionData(SECTION_KEYS.educationManagers))
  const companiesSection = useSelector(selectSectionData(SECTION_KEYS.companies))
  const leadCompaniesSection = useSelector(selectSectionData(SECTION_KEYS.leadCompanies))
  const liahubCompaniesSection = useSelector(selectSectionData(SECTION_KEYS.liahubCompanies))
  const unreadNotifications = useSelector(selectUnreadNotificationsCount)
  const notificationsState = useSelector((state) => state.notifications)

  React.useEffect(() => {
    if (!user) return
    if (dashboardStatus === 'idle' || dashboardStatus === 'failed') {
      dispatch(fetchStudentDashboard())
    }
  }, [dashboardStatus, dispatch, user])

  React.useEffect(() => {
    if (!user) return
    dispatch(fetchNotifications())
  }, [dispatch, user])

  // Compute real-time statistics
  const studentData = studentsSection?.data || []
  const educationManagersData = educationManagersSection?.data || []
  const companyData = companiesSection?.data || []
  const leadCompaniesData = leadCompaniesSection?.data || []
  const liahubCompaniesData = liahubCompaniesSection?.data || []

  const studentCount = studentData.length
  const managerCount = educationManagersData.length
  const totalCompanies = companyData.length + leadCompaniesData.length + liahubCompaniesData.length
  const confirmedStudents = studentData.filter(s => String(s.assignmentStatus || '').toLowerCase() === 'confirmed').length
  const totalNotifications = notificationsState?.items?.length || 0
  const notificationSubtext = unreadNotifications > 0 
    ? `${unreadNotifications} unread` 
    : 'All read'

  const dashboardStats = [
    { title: 'Total Students', value: studentCount, subtext: 'Currently enrolled', icon: GraduationCap },
    { title: 'Education Managers', value: managerCount, subtext: 'Programme coordinators', icon: UserCog },
    { title: 'Total Companies', value: totalCompanies, subtext: 'All partnerships', icon: Building2 },
    { title: 'Notifications', value: totalNotifications, subtext: notificationSubtext, icon: Bell },
  ]

  return (
    <DashboardShell
      title={`Welcome Back, ${user?.name || 'Admin'}`}
      subtitle=""
      entity="school"
      stats={dashboardStats}
      infoCard={
        <>
          {showLiaInfo && <LiaInfoCard />}
          {isAdmin && (
            <div className="mt-6">
              <ProgrammeStudentsChart studentData={studentData} />
            </div>
          )}
        </>
      }
    />
  )
}
