import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { useDispatch, useSelector } from 'react-redux'
import { selectConnections, selectUsersState, selectProfile } from '@/redux/store'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import UserPosts from '@/Components/profile/sections/UserPosts'
import About from '@/Components/profile/sections/About'
import BackButton from '@/Components/ui/backButton'
import { Button } from '@/Components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'
import {
  fetchConnections,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
} from '@/redux/slices/connectionsSlice'
import { pushNotification } from '@/redux/slices/notificationsSlice'
import { setActiveChat } from '@/redux/slices/messagesSlice'
import { fetchUserProfile } from '@/redux/slices/usersSlice'
import { followUser, addFollower } from '@/redux/slices/profileSlice'
import { getImageUrl } from '@/lib/imageUtils'
import { MapPin, Globe, Clock } from 'lucide-react'

export default function ProfileView(){
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const conns = useSelector(selectConnections)
  const usersState = useSelector(selectUsersState)
  const myProfile = useSelector(selectProfile)
  const user = id ? usersState.entitiesById[id] || null : null
  const profileLoading = id ? usersState.profileLoading?.[id] : false
  const profileError = id ? usersState.profileErrors?.[id] : null
  const [activeTab, setActiveTab] = useState('posts')

  useEffect(() => {
    if (!id) return
    // Only fetch if user is not in cache AND not currently loading
    const cachedUser = usersState.entitiesById[id]
    const isLoading = usersState.profileLoading?.[id]
    
    // Don't fetch if we already have the user in cache
    if (cachedUser) return
    
    // Don't fetch if already fetching
    if (isLoading) return
    
    // Only fetch once if user doesn't exist and not loading
    dispatch(fetchUserProfile(id))
  }, [dispatch, id, usersState.entitiesById, usersState.profileLoading])

  useEffect(() => {
    if (!id) return
    dispatch(fetchConnections())
  }, [dispatch, id])

  const connectionIncoming = conns.incoming.find((entry) => entry.peer?.id === id)
  const connectionOutgoing = conns.outgoing.find((entry) => entry.peer?.id === id)
  const connectionAccepted = conns.network.find((entry) => entry.peer?.id === id)
  const status = connectionAccepted ? 'connected' : connectionOutgoing ? 'pending' : connectionIncoming ? 'incoming' : 'none'

  const onConnect = () => {
    dispatch(sendConnectionRequest({ recipientId: id }))
      .unwrap()
      .then(() => {
        dispatch(pushNotification({ type: 'invite', text: `Invitation sent to ${user?.name || 'this user'}`, userId: id }))
      })
      .catch((error) => {
        const message = typeof error === 'string' ? error : error?.message
        dispatch(pushNotification({ type: 'error', text: message || 'Unable to send invite' }))
      })
  }
  const onMessage = () => {
    dispatch(setActiveChat(id))
    navigate('/message')
  }

  const onAccept = () => {
    if (!connectionIncoming) return
    dispatch(acceptConnectionRequest({ connectionId: connectionIncoming.id }))
      .unwrap()
      .then(() => {
        dispatch(pushNotification({ type: 'accepted', text: `You and ${user?.name || 'this user'} are now connected` }))
        dispatch(addFollower(id))
        dispatch(followUser(id))
      })
      .catch((error) => {
        const message = typeof error === 'string' ? error : error?.message
        dispatch(pushNotification({ type: 'error', text: message || 'Unable to accept request' }))
      })
  }

  const onDecline = () => {
    if (!connectionIncoming) return
    dispatch(declineConnectionRequest({ connectionId: connectionIncoming.id }))
      .unwrap()
      .catch((error) => {
        const message = typeof error === 'string' ? error : error?.message
        dispatch(pushNotification({ type: 'error', text: message || 'Unable to decline request' }))
      })
  }

  if (profileError && !profileLoading && !user) {
    return (
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <SidebarInset>
            <div className="p-6">
              <div className="text-sm text-destructive">{profileError}</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!user && profileLoading) {
    return (
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <SidebarInset>
            <div className="p-6 text-sm text-muted-foreground">Loading profile…</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!user) {
    return (
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <SidebarInset>
            <div className="p-6">
              <div className="text-sm text-destructive">Profile not found</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  const rawProfile = user.raw || {}
  const coverUrl = rawProfile.media?.cover || rawProfile.coverUrl || null
  const avatarUrl = user.avatarUrl
  const followerCount = user.followerCount ?? rawProfile.followerCount ?? (user.followers?.length || 0)
  const followingCount = user.followingCount ?? rawProfile.followingCount ?? (user.following?.length || 0)
  const handle = user.handle || rawProfile.username || 'member'
  const bio = user.bio || rawProfile.social?.bio || rawProfile.social?.about || ''
  const location = user.location || rawProfile.contact?.location || ''
  const website = user.website || rawProfile.contact?.website || ''
  const isFollowing = myProfile.followingIds?.includes(id)
  
 const normalizedUser = {
  ...user,
  companyProfile: user.companyProfile || user.raw?.companyProfile,
  schoolProfile: user.schoolProfile || user.raw?.schoolProfile,
}

  const { displayName, subtitle, isCompanyUser } = getDisplayNameWithSubtitle(normalizedUser)

  const actionButtons = []
  if (status === 'connected') {
    actionButtons.push(
      <Button key="message" onClick={onMessage}>
        Message
      </Button>,
    )
  } else if (status === 'pending') {
    actionButtons.push(
      <Button key="pending" variant="outline" disabled className="gap-2">
        <Clock className="h-4 w-4" />
        Pending
      </Button>,
    )
  } else if (status === 'incoming') {
    actionButtons.push(
      <Button key="accept" onClick={onAccept}>
        Accept
      </Button>,
    )
    actionButtons.push(
      <Button key="decline" variant="ghost" onClick={onDecline}>
        Decline
      </Button>,
    )
  } else {
    actionButtons.push(
      <Button key="connect" onClick={onConnect}>
        Connect
      </Button>,
    )
  }

  if (status === 'connected' && !isFollowing) {
    actionButtons.push(
      <Button key="follow" variant="outline" onClick={() => dispatch(followUser(id))}>
        Follow back
      </Button>,
    )
  } else if (isFollowing) {
    actionButtons.push(
      <Button key="following" variant="ghost" disabled>
        Following
      </Button>,
    )
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 px-2 md:px-4">
            {/* Main center column - Match the main profile structure */}
            <div className="flex-1 w-full">
              {/* Top bar with back button */}
              <div className="flex items-center gap-4 p-3 sticky top-0 backdrop-blur bg-background/70 z-10">
                <BackButton onClick={() => navigate(-1)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent" />
                <div>
                  <div className="font-semibold leading-tight">Viewing profile</div>
                  <div className="text-xs text-muted-foreground">{displayName}</div>
                </div>
              </div>
              
              {/* Cover area - Fixed overlapping issue */}
              <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center overflow-hidden z-0">
                {/* Only show cover inside main column */}
                <div className="absolute inset-0 w-full z-0">
                  {coverUrl ? (
                    <img 
                      src={getImageUrl(coverUrl)} 
                      alt={`${user.name} cover`} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-black text-white text-sm font-medium">
                      No Cover image yet
                    </div>
                  )}
                </div>
              </div>
              
              {/* Avatar + Action buttons */}
              <div className="px-4 flex justify-between">
                <div className="relative -mt-16 h-28 w-28 rounded-full border-4 border-background overflow-hidden flex items-center justify-center z-20">
                  <Avatar className="h-24 w-24" key={avatarUrl}>
                    <AvatarImage src={avatarUrl ? getImageUrl(avatarUrl) : undefined} alt={user.name} />
                    <AvatarFallback />
                  </Avatar>
                </div>
                <div className="pt-2 flex gap-2">
                  {actionButtons}
                </div>
              </div>
              
              {/* User info - Match main profile structure */}
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
                  {bio && bio !== 'Add a short bio about yourself.' && (
                    <p className="text-sm whitespace-pre-wrap">{bio}</p>
                  )}
                  
                  {/* Location and Website */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {(location || (isCompanyUser && user?.companyProfile?.city)) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        <span>
                          {location || 
                           [user?.companyProfile?.city, user?.companyProfile?.country]
                             .filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {(website || (isCompanyUser && user?.companyProfile?.website)) && (
                      <div className="flex items-center gap-1">
                        <Globe className="size-4" />
                        <a 
                          href={website || user?.companyProfile?.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {(website || user?.companyProfile?.website).replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Followers/Following counts */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      <strong className="text-foreground">{followerCount}</strong> followers
                    </span>
                    <span>
                      <strong className="text-foreground">{followingCount}</strong> following
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs for Posts and About (only when connected) */}
              {status === 'connected' && (
                <>
                  <div className="mt-8 border-b">
                    <div className="flex gap-6">
                      <button
                        onClick={() => setActiveTab('posts')}
                        className={`pb-2 px-1 font-medium text-sm transition-colors ${
                          activeTab === 'posts'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Posts
                      </button>
                      <button
                        onClick={() => setActiveTab('about')}
                        className={`pb-2 px-1 font-medium text-sm transition-colors ${
                          activeTab === 'about'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        About
                      </button>
                    </div>
                  </div>

                  {/* Content based on active tab */}
                  {activeTab === 'posts' ? (
                    <>
                      {/* User's Posts Section */}
                      <div className="mt-8">
                        <div className="mb-4">
                          <h2 className="text-2xl font-bold">Posts</h2>
                          <p className="text-sm text-muted-foreground">Recent posts from {displayName}</p>
                        </div>

                        <UserPosts userId={id} userName={displayName} />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* About section - show when viewing connected user's profile */}
                      <div className="mt-8">
                        <About readOnly={true} viewingUserId={id} />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Message when not connected */}
              {status !== 'connected' && (
                <div className="mt-8 p-8 text-center border rounded-lg bg-muted/30">
                  <p className="text-muted-foreground">🔒 Connect with {displayName} to view posts and profile details</p>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}