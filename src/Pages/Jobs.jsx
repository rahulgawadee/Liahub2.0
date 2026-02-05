import React, { useState, useEffect } from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import SearchHero from '@/Components/search/SearchHero'
import TabsBar from '@/Components/search/TabsBar'
import FiltersBar from '@/Components/search/FiltersBar'
import ResultsLayout from '@/Components/search/ResultsLayout'
import TeacherJobsBoard from '@/Components/jobs/TeacherJobsBoard'
import CompanyJobsWorkspace from '@/Components/jobs/CompanyJobsWorkspace'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectJobs,
  setQuery,
  setActiveTab,
  searchJobs,
  selectJob,
  toggleApplied,
  toggleWishlist,
} from '@/redux/slices/jobsSlice'
import { selectAuth } from '@/redux/store'
import { getPrimaryEntity } from '@/lib/roles'
import apiClient from '@/lib/apiClient'
import { useTheme } from '@/hooks/useTheme'

export default function Jobs() {
  const dispatch = useDispatch()
  const state = useSelector(selectJobs)
  const { user } = useSelector(selectAuth)
  const { isDark } = useTheme()
  const { mode, query, activeTab, list, selectedId } = state

  // State for real applications from backend
  const [applications, setApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)

  // State for wishlisted jobs from backend
  const [wishlistedJobs, setWishlistedJobs] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Local state for optimistic UI updates
  const [optimisticWishlistCount, setOptimisticWishlistCount] = useState(0)

  const entity = getPrimaryEntity(user?.roles)
  const isCompany = entity === 'company'
  const isSchoolStaff = entity === 'school'
  const isUniversity = entity === 'university'
  
  // Check if user has MANAGE_JOBS permission (Admin or Education Manager)
  const canManageJobs = React.useMemo(() => {
    if (!user?.roles) return false
    return user.roles.some(role => 
      ['school_admin', 'education_manager', 'university_admin', 'university_manager'].includes(role)
    )
  }, [user?.roles])

  // Fetch real applications from backend
  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true)
      const response = await apiClient.get('/jobs/my/applications')
      console.log('🔍 RAW API RESPONSE:', response.data)
      if (response.data) {
        // Transform applications to match the expected format
        const transformedApps = (response.data.items || []).map(app => {
          console.log('🔍 RAW JOB DATA:', app.job)
          console.log('🔍 DESCRIPTION:', app.job?.description)
          return {
            id: app.job?.id || app.job?._id,
            title: app.job?.title,
            company: app.job?.organization?.name || 'Unknown Company',
            location: app.job?.location || 'Remote',
            salary: app.job?.salary,
            status: app.status, // Application status: applied, under_review, interview, offer_sent, hired, rejected
            type: app.job?.type,
            deadline: app.job?.deadline,
            description: app.job?.description,
            responsibilities: app.job?.responsibilities || [],
            requirements: app.job?.requirements || [],
            benefits: app.job?.benefits || [],
            applied: true, // All items here are applied
            wishlisted: false,
            employmentType: app.job?.employmentType || app.job?.type,
            locationType: app.job?.locationType || 'Hybrid',
            seniority: app.job?.seniority || 'Mid',
            labels: app.job?.labels || [],
            tags: app.job?.tags || [],
            openings: app.job?.openings || 1,
            applicants: app.job?.applicants || 0,
            applicationData: {
              appliedDate: app.createdAt,
              applicationStatus: app.status,
              stage: app.stage,
              profileScore: app.profileScore,
              offerLetter: app.offerLetter,
              applicationId: app.id || app._id,
            },
          }
        })
        console.log('🔍 TRANSFORMED APPS:', transformedApps)
        setApplications(transformedApps)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      setApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }

  // Fetch wishlisted jobs from backend
  const fetchWishlistedJobs = async () => {
    try {
      setWishlistLoading(true)
      const response = await apiClient.get('/jobs/my/wishlist')
      console.log('🔖 WISHLIST API RESPONSE:', response.data)
      if (response.data) {
        // Transform wishlisted jobs to match the expected format
        const transformedWishlist = (response.data.items || []).map(job => ({
          id: job.id || job._id,
          title: job.title,
          company: job.organization?.name || 'Unknown Company',
          location: job.location || 'Remote',
          salary: job.salary,
          type: job.type,
          deadline: job.deadline,
          description: job.description,
          responsibilities: job.responsibilities || [],
          requirements: job.requirements || [],
          benefits: job.benefits || [],
          applied: false,
          wishlisted: true, // All items here are wishlisted
          employmentType: job.employmentType || job.type,
          locationType: job.locationType || 'Hybrid',
          seniority: job.seniority || 'Mid',
          labels: job.labels || [],
          tags: job.tags || [],
          openings: job.openings || 1,
          applicants: job.applicants || 0,
        }))
        console.log('🔖 TRANSFORMED WISHLIST:', transformedWishlist)
        setWishlistedJobs(transformedWishlist)
      }
    } catch (error) {
      console.error('Failed to fetch wishlisted jobs:', error)
      setWishlistedJobs([])
    } finally {
      setWishlistLoading(false)
    }
  }

  // Fetch applications when Applied tab is active OR on initial load to filter out applied jobs from All tab
  useEffect(() => {
    if (!isCompany && !isSchoolStaff && !isUniversity) {
      fetchApplications()
    }
  }, [isCompany, isSchoolStaff, isUniversity])

  // Re-fetch applications when switching to Applied tab to ensure fresh data
  useEffect(() => {
    if (activeTab === 'Applied' && !isCompany && !isSchoolStaff && !isUniversity) {
      fetchApplications()
    }
  }, [activeTab, isCompany, isSchoolStaff, isUniversity])

  // Fetch wishlisted jobs when switching to Wishlist tab
  useEffect(() => {
    if (activeTab === 'Wishlist' && !isCompany && !isSchoolStaff && !isUniversity) {
      fetchWishlistedJobs()
    }
  }, [activeTab, isCompany, isSchoolStaff, isUniversity])

  // ⚠️ IMPORTANT: All hooks must be called before any conditional returns
  // This prevents "Rendered more hooks than during the previous render" error
  
  const keywordSuggestions = React.useMemo(
    () => Array.from(new Set(list.map((job) => job.title))).slice(0, 8),
    [list],
  )
  const locationSuggestions = React.useMemo(
    () => Array.from(new Set(list.map((job) => job.location))).slice(0, 8),
    [list],
  )

  // Use real applications when on Applied tab, otherwise use list from Redux
  const displayList = activeTab === 'Applied' ? applications : list

  const filteredList = React.useMemo(
    () => {
      if (activeTab === 'Applied') {
        // Show all applications (already filtered by backend)
        return applications
      } else if (activeTab === 'Wishlist') {
        // Show wishlisted jobs from backend
        return wishlistedJobs
      } else {
        // Show all jobs EXCEPT the ones already applied to
        const appliedJobIds = new Set(applications.map(app => app.id))
        return list.filter(j => !appliedJobIds.has(j.id))
      }
    },
    [list, activeTab, applications, wishlistedJobs]
  )

  const companies = React.useMemo(
    () => Array.from(new Set(list.map((j) => j.company).filter(Boolean))).slice(0, 12),
    [list],
  )

  const tabCounts = React.useMemo(
    () => {
      // Exclude applied jobs from Jobs tab count
      const appliedJobIds = new Set(applications.map(app => app.id))
      const availableJobsCount = list.filter(j => !appliedJobIds.has(j.id)).length
      
      // Use optimistic count if set, otherwise use actual count
      const wishlistCount = optimisticWishlistCount > 0 ? optimisticWishlistCount : wishlistedJobs.length
      
      return {
        Jobs: availableJobsCount, // Only show count of jobs not yet applied to
        Applied: applications.length, // Real count from backend
        Wishlist: wishlistCount, // Optimistic or real count from backend
      }
    },
    [list, applications, wishlistedJobs, optimisticWishlistCount]
  )

  React.useEffect(() => {
    if (isCompany || isSchoolStaff || isUniversity) return
    if (list.length === 0) {
      dispatch(searchJobs({ keyword: '', filters: { jobType: 'job' } }))
    }
  }, [dispatch, list.length, isCompany, isSchoolStaff, isUniversity])

  // Now safe to do conditional returns after all hooks are called
  if (isCompany) {
    return <CompanyJobsWorkspace />
  }

  // School Admin and Education Manager can manage jobs
  if ((isSchoolStaff || isUniversity) && canManageJobs) {
    return <CompanyJobsWorkspace 
      title="School Job Management"
      description="Post jobs, review applications, and manage hiring for your school."
    />
  }

  // Regular teachers get read-only view
  if (isSchoolStaff || isUniversity) {
    return <TeacherJobsBoard />
  }

  const handleSearch = () => {
    dispatch(
      searchJobs({
        ...query,
        filters: { ...query.filters, jobType: 'job' },
      }),
    )
  }

  const handleFilters = (filters) =>
    dispatch(
      setQuery({
        filters: {
          ...filters,
          jobType: 'job',
        },
      }),
    )

  const handleResetFilters = () =>
    dispatch(
      setQuery({
        filters: { jobType: 'job' },
      }),
    )

  // Handle wishlist toggle and refresh the list
  const handleToggleWishlist = async (id) => {
    try {
      // Get current wishlist state
      const job = list.find(j => j.id === id)
      const isCurrentlyWishlisted = job?.wishlisted || false
      
      // Optimistically update count immediately for instant feedback
      if (isCurrentlyWishlisted) {
        // Removing from wishlist
        setOptimisticWishlistCount(Math.max(0, wishlistedJobs.length - 1))
      } else {
        // Adding to wishlist
        setOptimisticWishlistCount(wishlistedJobs.length + 1)
      }
      
      // Dispatch the async action
      const result = await dispatch(toggleWishlist(id))
      
      // If successful, refresh the data
      if (result.type.endsWith('/fulfilled')) {
        // Refresh wishlist tab data
        if (activeTab === 'Wishlist' || isCurrentlyWishlisted) {
          await fetchWishlistedJobs()
        }
        
        // Refresh the main job list to update the bookmark icon
        await dispatch(searchJobs({ keyword: '', filters: { jobType: 'job' } }))
        
        // Reset optimistic count after real data is fetched
        setOptimisticWishlistCount(0)
      } else {
        // Revert optimistic update on failure
        setOptimisticWishlistCount(0)
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
      // Revert optimistic update on error
      setOptimisticWishlistCount(0)
    }
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset>
          {mode === 'hero' ? (
            <SearchHero
              title="Job Search"
              keyword={query.keyword}
              location={query.location}
              onKeyword={(v) => dispatch(setQuery({ keyword: v }))}
              onLocation={(v) => dispatch(setQuery({ location: v }))}
              keywordSuggestions={keywordSuggestions}
              locationSuggestions={locationSuggestions}
              onSearch={handleSearch}
            />
          ) : (
            <div className={`px-6 pt-4 flex-1 min-h-0 ${isDark ? 'text-white' : 'text-black'}`}>
              <div className="flex flex-col items-center">
                <TabsBar value={activeTab} onChange={(t) => dispatch(setActiveTab(t))} counts={tabCounts} />
              </div>
              <div className="mt-2">
                <SearchHero
                  title="Job Search"
                  keyword={query.keyword}
                  location={query.location}
                  onKeyword={(v) => dispatch(setQuery({ keyword: v }))}
                  onLocation={(v) => dispatch(setQuery({ location: v }))}
                  keywordSuggestions={keywordSuggestions}
                  locationSuggestions={locationSuggestions}
                  onSearch={handleSearch}
                  compact
                />
              </div>
              <FiltersBar
                filters={query.filters}
                onChange={handleFilters}
                onReset={handleResetFilters}
                options={{ company: companies }}
              />
              <ResultsLayout
                items={filteredList}
                selectedId={selectedId}
                onSelect={(id) => dispatch(selectJob(id))}
                onToggleApplied={(id) => dispatch(toggleApplied(id))}
                onToggleWishlist={handleToggleWishlist}
                variant="job"
              />
            </div>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
