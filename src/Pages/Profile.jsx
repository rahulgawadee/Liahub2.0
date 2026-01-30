import React, { useState, useEffect } from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { useSelector, useDispatch } from 'react-redux'
import { selectAuth, selectProfile } from '@/redux/store'
import { fetchProfile } from '@/redux/slices/profileSlice'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { ArrowLeft, Pencil, MapPin, Globe } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar'
import ProfileStats from '@/Components/profile/ProfileStats'
import ProfileTabs from '@/Components/profile/ProfileTabs'
import EditProfileDialog from '@/Components/profile/EditProfileDialog'
import { getImageUrl } from '@/lib/imageUtils'
import api from '@/lib/apiClient'

export default function Profile(){
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const profile = useSelector(selectProfile)
  const [editing, setEditing] = useState(false)
  const [postCount, setPostCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0) // Force re-render when data updates
  
  // Handler to close edit dialog and refresh profile
  const handleCloseEdit = () => {
    setEditing(false)
    // Force refresh profile data
    if (user?.id) {
      console.log('🔄 Refreshing profile after edit close...')
      dispatch(fetchProfile(user.id))
    }
  }
  
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchProfile(user.id))
      fetchPostCount()
    }
  }, [dispatch, user?.id, refreshKey]) // Add refreshKey dependency
  
  // Listen for profile media changes (avatar/cover)
  useEffect(() => {
    console.log('👀 Profile media changed - Avatar:', profile.avatarUrl, 'Cover:', profile.coverUrl)
    console.log('🔍 Full profile state:', profile)
  }, [profile.avatarUrl, profile.coverUrl])
  
  // Listen for user updates to refresh
  useEffect(() => {
    console.log('👀 Profile detected user change. Company name:', user?.companyProfile?.companyName)
    console.log('👤 User media:', user?.media)
    setRefreshKey(prev => prev + 1)
  }, [user?.companyProfile?.companyName, user?.companyProfile?.city, user?.companyProfile?.website, user?.media?.avatar, user?.media?.cover])
  
  // Also listen to the entire user object
  useEffect(() => {
    console.log('👀 User object changed')
  }, [user])
  
  const fetchPostCount = async () => {
    if (!user?.id) return
    try {
      const response = await api.get(`/posts/user/${user.id}`)
      const data = response.data
      setPostCount(data.total || (Array.isArray(data) ? data.length : data.posts?.length || 0))
    } catch (error) {
      console.error('Failed to fetch post count:', error)
    }
  }
  
  // Check if user is a company
  const { displayName, subtitle, isCompanyUser } = getDisplayNameWithSubtitle(user)
    
  const handle = profile.handle || (user?.email? user.email.split('@')[0] : 'user')

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 px-2 md:px-4">
            {/* Main center column */}
            <div className="flex-1 w-full">
              {/* Top bar */}
              <div className="flex items-center gap-4 p-3 sticky top-0 backdrop-blur bg-background/70 z-10">
                <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent" onClick={()=>window.history.back()}><ArrowLeft className="size-4" /></button>
                <div>
                  <div className="font-semibold leading-tight">{displayName}</div>
                  <div className="text-xs text-muted-foreground">{postCount} posts</div>
                </div>
              </div>
              {/* Cover area */}
              <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center overflow-hidden z-0">
                {/* Center the cover only for the main column */}
                <div className="absolute inset-0 w-full z-0">
                  {profile.coverUrl ? (
                    <img key={profile.coverUrl} src={getImageUrl(profile.coverUrl)} alt="cover" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-black text-white text-sm font-medium">No Cover image yet</div>
                  )}
                </div>
              </div>
              {/* Avatar + Edit */}
              <div className="px-4 flex justify-between">
                <div className="relative -mt-16 h-28 w-28 rounded-full border-4 border-background overflow-hidden flex items-center justify-center z-20">
                  <Avatar className="h-24 w-24" key={profile.avatarUrl}>
                    <AvatarImage src={getImageUrl(profile.avatarUrl)} alt={displayName} />
                    <AvatarFallback />
                  </Avatar>
                </div>
                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={()=>setEditing(true)} className="flex items-center gap-1"><Pencil className="size-3" /> Edit profile</Button>
                </div>
              </div>
              {/* User info */}
              <div className="px-4 pt-4 space-y-3">
                <div>
                  <h1 className="text-xl font-semibold leading-tight">{displayName}</h1>
                  {subtitle ? (
                    <div className="text-sm text-muted-foreground">{subtitle}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">@{handle}</div>
                  )}
                </div>
                
                {/* Bio section with all details */}
                <div className="space-y-2">
                  {profile.bio && profile.bio !== 'Add a short bio about yourself.' && (
                    <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
                  )}
                  
                  {/* Location and Website */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {(profile.location || (isCompanyUser && user?.companyProfile?.city)) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        <span>
                          {profile.location || 
                           [user?.companyProfile?.city, user?.companyProfile?.country]
                             .filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {(profile.website || (isCompanyUser && user?.companyProfile?.website)) && (
                      <div className="flex items-center gap-1">
                        <Globe className="size-4" />
                        <a 
                          href={profile.website || user?.companyProfile?.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {(profile.website || user?.companyProfile?.website).replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                <ProfileStats />
              </div>
              {/* Tabs & content */}
              <ProfileTabs />
            </div>
          </div>
        </SidebarInset>
      </div>
      <EditProfileDialog open={editing} onClose={handleCloseEdit} />
    </SidebarProvider>
  )
}
