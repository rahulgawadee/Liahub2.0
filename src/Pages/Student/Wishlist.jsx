import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '@/redux/store'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import {
  MapPin,
  Briefcase,
  Building2,
  Bookmark,
  DollarSign,
  Users,
  Calendar,
  Loader2,
  Heart,
  Send,
  Globe,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getImageUrl } from '@/lib/imageUtils'

const formatTimeAgo = (date) => {
  const now = new Date()
  const postDate = new Date(date)
  const diffInDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const WishlistJobCard = ({ job, onRemove, onQuickApply }) => {
  const isDeadlinePassed = job.deadline && new Date(job.deadline) < new Date()
  const isHiringStopped = job.status === 'hiring_stopped' || job.status === 'closed'

  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {job.organization?.logo ? (
              <img 
                src={getImageUrl(job.organization.logo)} 
                alt={job.organization.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1 truncate">{job.title}</h3>
            <p className="text-muted-foreground text-sm mb-2">{job.organization?.name}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              {job.employmentType && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {job.employmentType}
                </span>
              )}
              {job.locationType && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {job.locationType}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onRemove(job)}
          className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-yellow-500 hover:text-red-500 transition-colors"
        >
          <Bookmark className="h-5 w-5" fill="currentColor" />
        </button>
      </div>

      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.tags.slice(0, 5).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4 text-sm">
          {job.salary && (
            <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
              <DollarSign className="h-4 w-4" />
              {job.salary}
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            {job.applicants || 0} applicants
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatTimeAgo(job.postedOn || job.createdAt)}
          </span>
        </div>

        {job.applied ? (
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Applied
          </Badge>
        ) : isDeadlinePassed || isHiringStopped ? (
          <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {isHiringStopped ? 'Hiring Stopped' : 'Deadline Passed'}
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={() => onQuickApply(job)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4 mr-1" />
            Quick Apply
          </Button>
        )}
      </div>
    </div>
  )
}

export default function Wishlist() {
  const { user } = useSelector(selectAuth)
  const [wishlistedJobs, setWishlistedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchWishlistedJobs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/jobs/my/wishlist', {
        params: {
          page,
          limit: 20,
        }
      })

      if (response.data) {
        setWishlistedJobs(response.data.items || [])
        setTotalPages(response.data.pages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch wishlisted jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlistedJobs()
  }, [page])

  const handleRemoveFromWishlist = async (job) => {
    try {
      await apiClient.post(`/jobs/${job.id}/wishlist`)
      
      // Remove from local state
      setWishlistedJobs(wishlistedJobs.filter(j => j.id !== job.id))
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
      alert('Failed to update wishlist')
    }
  }

  const handleQuickApply = async (job) => {
    if (!window.confirm(`Apply for ${job.title}?\n\nYour profile information will be sent to the employer.`)) {
      return
    }

    try {
      await apiClient.post(`/jobs/${job.id}/apply`, {})

      alert('Application submitted successfully!')
      
      // Update local state
      setWishlistedJobs(wishlistedJobs.map(j => 
        j.id === job.id 
          ? { ...j, applied: true, applicationStatus: 'applied' }
          : j
      ))
    } catch (error) {
      console.error('Failed to apply:', error)
      const message = error.response?.data?.message || 'Failed to submit application'
      alert(message)
    }
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Heart className="h-8 w-8 text-red-500" fill="currentColor" />
                  Saved Jobs
                </h1>
                <p className="text-muted-foreground">
                  Jobs you've bookmarked for later
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {wishlistedJobs.length}
                </p>
                <p className="text-sm text-muted-foreground">Saved</p>
              </div>
            </div>

            {/* Wishlist List */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
            ) : wishlistedJobs.length === 0 ? (
              <div className="text-center py-20">
                <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No saved jobs yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start bookmarking jobs you're interested in to see them here
                </p>
                <Button onClick={() => window.location.href = '/jobs'}>
                  Browse Jobs
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {wishlistedJobs.map((job) => (
                    <WishlistJobCard
                      key={job.id}
                      job={job}
                      onRemove={handleRemoveFromWishlist}
                      onQuickApply={handleQuickApply}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
