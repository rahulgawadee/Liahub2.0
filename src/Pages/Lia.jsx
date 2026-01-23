import React from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import TeacherJobsBoard from '@/Components/jobs/TeacherJobsBoard'
import CompanyJobsWorkspace from '@/Components/jobs/CompanyJobsWorkspace'
import StudentLIAs from '@/Pages/Student/StudentLias'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectLiaSummaries,
  selectActiveLiaId,
  selectLiaPostingById,
  setActivePosting,
  updateLIAApplicationStatus,
  sendLIAOfferLetter,
  createLIAPosting,
  fetchCompanyLIAApplications,
  fetchSchoolLIAApplications,
} from '@/redux/slices/lia/liaApplicationsSlice'
import { selectAuth } from '@/redux/store'

export default function Lia() {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)

  const entity = user?.entity
  const isCompany = entity === 'company'
  const isSchoolStaff = entity === 'school'

  // Load real LIA applications data from backend
  React.useEffect(() => {
    if (isCompany) {
      dispatch(fetchCompanyLIAApplications())
    } else if (isSchoolStaff) {
      dispatch(fetchSchoolLIAApplications())
    }
  }, [dispatch, isCompany, isSchoolStaff])

  if (isCompany) {
    return (
      <CompanyJobsWorkspace
        title="LIA application workspace"
        description="Manage LIA postings, move students through review, and send offer letters in one streamlined view."
        summariesSelector={selectLiaSummaries}
        activeSelector={selectActiveLiaId}
        entrySelector={selectLiaPostingById}
        setActiveAction={setActivePosting}
        updateStatusAction={updateLIAApplicationStatus}
        offerAction={sendLIAOfferLetter}
        createAction={createLIAPosting}
        fetchApplicationsAction={fetchCompanyLIAApplications}
        jobTypeFilter="LIA"
        idKey="jobId"
        entryTitleKey="title"
        defaultCompanyFallback={user?.organizationName || user?.name || 'Unknown Company'}
        postingTypes={['LIA']}
        defaultJobType="LIA"
      />
    )
  }

  if (isSchoolStaff) {
    return (
      <TeacherJobsBoard
        jobType="LIA"
        title="LIA placements overview"
        description="Monitor LIA placement demand, track which students are progressing, and review the latest updates from employer partners."
        summariesSelector={selectLiaSummaries}
        jobSelector={selectLiaPostingById}
        activeSelector={selectActiveLiaId}
        setActiveAction={setActivePosting}
        listLabel="LIA postings"
        fetchListAction={fetchSchoolLIAApplications}
        fetchApplicationsAction={null}
        createAction={createLIAPosting}
        postingTypes={["LIA"]}
        defaultJobType={"LIA"}
        isSchool={true}
      />
    )
  }

  // Student view - use dedicated StudentLIAs component
  return <StudentLIAs />
}
