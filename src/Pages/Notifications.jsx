import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar'
import { Badge } from '@/Components/ui/badge'
import { Separator } from '@/Components/ui/separator'
import { Skeleton } from '@/Components/ui/skeleton'
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  PartyPopper,
  Clock,
  Inbox,
  Users,
  ThumbsUp,
  Send,
  ChevronDown
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { selectConnections, selectNotifications } from '@/redux/store'
import {
  acceptConnectionRequest,
  declineConnectionRequest,
  fetchConnections,
} from '@/redux/slices/connectionsSlice'
import {
  fetchNotifications,
  markNotificationsRead,
  pushNotification,
  markRead,
  clearReadBatch,
} from '@/redux/slices/notificationsSlice'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { getImageUrl } from '@/lib/imageUtils'

export default function Notifications(){
  const dispatch = useDispatch()
  const { items, loading, pagination, readBatch } = useSelector(selectNotifications)
  const connections = useSelector(selectConnections)
  const [currentPage, setCurrentPage] = useState(1)
  const [readScheduled, setReadScheduled] = useState(false)

  // Initial load - fetch both data
  useEffect(() => {
    dispatch(fetchConnections())
    dispatch(fetchNotifications(1))
  }, [dispatch])

  // Defer marking notifications as read - batch after 2 seconds of inactivity
  useEffect(() => {
    const unreadNotificationIds = (items || [])
      .filter((item) => !item.readAt && !item.local)
      .map((item) => item.id)

    const batchIds = Array.from(readBatch || [])

    const idsToSend = [...new Set([...(unreadNotificationIds || []), ...(batchIds || [])])]

    if (idsToSend.length > 0 && !readScheduled) {
      setReadScheduled(true)
      const timer = setTimeout(() => {
        dispatch(markNotificationsRead({ notificationIds: idsToSend }))
        setReadScheduled(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [items, readBatch, dispatch, readScheduled])

  const pendingUsers = useMemo(
    () =>
      (connections.incoming || []).map((entry) => ({
        connectionId: entry.id,
        user: entry.peer,
      })),
    [connections.incoming],
  )

  const onAccept = (pending) => {
    if (!pending?.connectionId) return
    dispatch(acceptConnectionRequest({ connectionId: pending.connectionId }))
      .unwrap()
      .then(() => {
        dispatch(fetchConnections())
        dispatch(pushNotification({ type: 'accepted', text: `You and ${pending.user?.name || 'this user'} are now connected` }))
      })
      .catch((error) => {
        dispatch(pushNotification({ type: 'error', text: error?.message || 'Failed to accept request' }))
      })
  }

  const onDecline = (pending) => {
    if (!pending?.connectionId) return
    dispatch(declineConnectionRequest({ connectionId: pending.connectionId }))
      .unwrap()
      .then(() => dispatch(fetchConnections()))
      .catch((error) => {
        dispatch(pushNotification({ type: 'error', text: error?.message || 'Unable to decline request' }))
      })
  }

  const onDismissNotification = (notificationId) => {
    dispatch(markRead(notificationId))
  }

  const onPageChange = (page) => {
    if (page >= 1 && page <= (pagination?.pages || 1)) {
      setCurrentPage(page)
      dispatch(fetchNotifications(page))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Helper function to get notification icon and color
  const getNotificationStyle = (type) => {
    const styles = {
      post_liked: { icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
      post_created: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      post_commented: { icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
      connection_accepted: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      connection_request: { icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      job_status_update: { icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-500/10' },
      job_offer: { icon: PartyPopper, color: 'text-pink-500', bg: 'bg-pink-500/10' },
      job_hiring_stopped: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' },
      offer_accepted: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
      job_application: { icon: Send, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      default: { icon: Bell, color: 'text-primary', bg: 'bg-primary/10' }
    }
    return styles[type] || styles.default
  }

  // Format notification message with proper context
  const formatNotification = (notification) => {
    let message = notification.text || 'New notification'
    let title = ''
    let actorName = 'Someone'
    
    if (notification.actor) {
      const { displayName } = getDisplayNameWithSubtitle(notification.actor)
      actorName = displayName
    }
    
    switch (notification.type) {
      case 'post_liked':
        title = 'Post Liked'
        message = notification.payload?.postContent 
          ? `liked your post: "${notification.payload.postContent.substring(0, 60)}${notification.payload.postContent.length > 60 ? '...' : ''}"`
          : 'liked your post'
        break
      
      case 'post_created':
        title = 'New Post'
        message = 'created a new post'
        break
      
      case 'post_commented':
        title = 'New Comment'
        message = notification.payload?.commentText
          ? `commented: "${notification.payload.commentText.substring(0, 60)}${notification.payload.commentText.length > 60 ? '...' : ''}"`
          : 'commented on your post'
        break
      
      case 'connection_accepted':
        title = 'Connection Accepted'
        message = 'accepted your connection request. You are now connected!'
        break
      
      case 'connection_request':
        title = 'Connection Request'
        message = 'wants to connect with you'
        break
      
      case 'job_status_update':
        const status = notification.payload?.status || 'updated'
        const jobTitle = notification.payload?.jobTitle || 'a position'
        
        if (status === 'selected') {
          title = '🎉 You\'re Selected!'
          message = `Congratulations! You've been selected for "${jobTitle}"`
        } else if (status === 'interview') {
          title = 'Interview Scheduled'
          message = `You have an interview invitation for "${jobTitle}"`
        } else if (status === 'rejected') {
          title = 'Application Update'
          message = `Your application for "${jobTitle}" has been reviewed`
        } else if (status === 'hired') {
          title = '🎊 You\'re Hired!'
          message = `Congratulations! You're hired for "${jobTitle}"`
        } else if (status === 'under_review') {
          title = 'Application Under Review'
          message = `Your application for "${jobTitle}" is being reviewed`
        } else {
          title = 'Job Application Update'
          message = `Your application status for "${jobTitle}" has been updated to: ${status.replace(/_/g, ' ')}`
        }
        break
      
      case 'job_offer':
        title = '💼 Job Offer Received'
        const offerJobTitle = notification.payload?.jobTitle || 'a position'
        message = `You received a job offer for "${offerJobTitle}"! Review and respond now.`
        break
      
      case 'job_hiring_stopped':
        title = 'Hiring Stopped'
        const stoppedJobTitle = notification.payload?.jobTitle || 'a position'
        message = `Hiring has been stopped for "${stoppedJobTitle}"`
        break
      
      case 'offer_accepted':
        title = 'Offer Accepted'
        message = `accepted your job offer for "${notification.payload?.jobTitle || 'the position'}"`
        break
      
      case 'job_application':
        title = 'New Application'
        const appJobTitle = notification.payload?.jobTitle || 'your job posting'
        message = `applied for "${appJobTitle}"`
        break
      
      default:
        title = 'Notification'
        message = notification.text || 'You have a new notification'
    }
    
    return { title, message, actorName }
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="w-full min-h-screen bg-gradient-to-b from-background to-secondary/5">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 sm:px-6 lg:px-8 py-5">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary/10">
                      <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Notifications</h1>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {pagination?.total || 0} notification{pagination?.total !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {items.some(n => !n.readAt) && (
                    <Badge className="flex-shrink-0 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-200/50">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                      {items.filter(n => !n.readAt).length} Unread
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Connection Requests Section */}
                {pendingUsers.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Users className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Connection Requests</h2>
                      <Badge variant="secondary" className="ml-auto">{pendingUsers.length}</Badge>
                    </div>
                    
                    <div className="grid gap-3 sm:gap-4">
                      {pendingUsers.map((pending) => {
                        const { displayName, subtitle } = getDisplayNameWithSubtitle(pending.user)
                        
                        return (
                          <Card key={pending.connectionId} className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                  <Avatar className="h-12 w-12 flex-shrink-0 shadow-sm border border-border/50">
                                    <AvatarImage src={pending.user?.avatarUrl ? getImageUrl(pending.user.avatarUrl) : undefined} alt={pending.user?.name} />
                                    <AvatarFallback>{pending.user?.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-foreground truncate">{displayName}</div>
                                    {subtitle && (
                                      <div className="text-sm text-muted-foreground truncate">{subtitle}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <Button
                                    onClick={() => onAccept(pending)}
                                    size="sm"
                                    className="flex-1 sm:flex-none gap-2 bg-primary hover:bg-primary/90"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Accept
                                  </Button>
                                  <Button
                                    onClick={() => onDecline(pending)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 sm:flex-none gap-2"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Decline
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                )}

                {/* Notifications List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Bell className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Activity</h2>
                  </div>
                  
                  {(() => {
                    // Loading skeleton
                    if (loading && items.length === 0) {
                      return (
                        <div className="space-y-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Card key={i} className="border-border/50">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                                  <div className="flex-1 space-y-3 min-w-0">
                                    <div className="space-y-2">
                                      <Skeleton className="h-4 w-1/3" />
                                      <Skeleton className="h-3 w-2/3" />
                                    </div>
                                    <Skeleton className="h-3 w-1/4" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )
                    }

                    // Empty state
                    if (!items || items.length === 0) {
                      return (
                        <Card className="border-border/50 bg-secondary/30">
                          <CardContent className="py-16 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="p-3 rounded-full bg-primary/10">
                                <Inbox className="h-10 w-10 text-primary" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-foreground">You're all caught up!</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  No new notifications at the moment
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }

                    // Notifications grid
                    return (
                      <div className="space-y-3">
                        {items.map((notification) => {
                          const { title, message, actorName } = formatNotification(notification)
                          const style = getNotificationStyle(notification.type)
                          const Icon = style.icon
                          const actorAvatar = notification.actor?.media?.avatar || null
                          const isUnread = !notification.readAt
                          
                          return (
                            <Card 
                              key={notification.id} 
                              className={`group transition-all duration-200 overflow-hidden border-border/50 hover:shadow-md hover:border-primary/20 ${
                                isUnread ? 'bg-primary/5 border-primary/20' : 'hover:bg-secondary/30'
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  {/* Actor Avatar & Badge */}
                                  <div className="relative flex-shrink-0">
                                    {actorAvatar ? (
                                      <Avatar className="h-12 w-12 border border-border/50 shadow-sm">
                                        <AvatarImage src={getImageUrl(actorAvatar)} alt={actorName} />
                                        <AvatarFallback>{actorName?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center border border-border/50">
                                        {actorName?.charAt(0)}
                                      </div>
                                    )}
                                    
                                    {/* Type Icon Badge */}
                                    <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${style.bg} ${style.color} shadow-md border-2 border-background`}>
                                      <Icon className="h-3.5 w-3.5" />
                                    </div>
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-base text-foreground flex items-center gap-2 mb-1">
                                          {title}
                                          {isUnread && (
                                            <span className="inline-block w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                                          )}
                                        </h3>
                                        <p className="text-sm text-foreground/80 line-clamp-2">
                                          <span className="font-medium text-foreground">{actorName}</span>
                                          <span className="text-muted-foreground"> {message}</span>
                                        </p>
                                      </div>
                                      
                                      {/* Dismiss Button */}
                                      {isUnread && (
                                        <Button
                                          onClick={() => onDismissNotification(notification.id)}
                                          variant="ghost"
                                          size="sm"
                                          className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                    
                                    {/* Timestamp */}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span className="truncate">{timeAgo(notification.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* Pagination */}
                {pagination?.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          onClick={() => onPageChange(page)}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === pagination.pages || loading}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// small utility: relative time (very lightweight)
function timeAgo(date){
  const d = new Date(date)
  const seconds = Math.floor((Date.now() - d.getTime())/1000)
  if(seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds/60)
  if(minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes/60)
  if(hours < 24) return `${hours}h`
  const days = Math.floor(hours/24)
  if(days < 7) return `${days}d`
  return d.toLocaleDateString()
}
