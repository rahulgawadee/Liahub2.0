import TeacherJobsBoard from '../../Components/jobs/TeacherJobsBoard';
import {
  selectJobSummaries,
  selectApplicationsByJob,
  selectActiveJobId,
  setActiveJob,
} from '../../redux/slices/applicationsSlice';

/**
 * School Job Applications - Read-Only View
 * 
 * Schools (Admin & Education Managers) can:
 *  View all job postings and applications
 *  See application statistics and status
 *  Monitor student progress through the hiring pipeline
 *  Track selected, rejected, and in-progress applications
 * 
 * Schools CANNOT:
 *  Accept or reject students
 *  Send offer letters
 *  Change application status
 * 
 * This is a monitoring/oversight view only.
 */
export default function SchoolJobApplications() {
  return (
    <TeacherJobsBoard
      jobType={null}
      title="Job Applications Overview"
      description="Monitor student applications across all company job postings. Track application status, selected candidates, and hiring progress."
      summariesSelector={selectJobSummaries}
      jobSelector={selectApplicationsByJob}
      activeSelector={selectActiveJobId}
      setActiveAction={setActiveJob}
      listLabel="Job Postings"
    />
  );
}
