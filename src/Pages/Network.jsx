import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import UserCard from '@/Components/social/UserCard'
import ProfileView from '@/Components/social/ProfileView'
import { useDispatch, useSelector } from 'react-redux'
import { selectConnections, selectProfile, selectUsersState } from '@/redux/store'
import { selectUser, cacheUser, fetchUserProfile } from '@/redux/slices/usersSlice'
import {
  fetchConnections,
  acceptConnectionRequest,
  declineConnectionRequest,
  followUserConnection,
  unfollowUserConnection,
} from '@/redux/slices/connectionsSlice'
import { pushNotification } from '@/redux/slices/notificationsSlice'
import { updateProfile } from '@/redux/slices/profileSlice'
import { setActiveChat } from '@/redux/slices/messagesSlice'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { Button } from '@/Components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Separator } from '@/Components/ui/separator'
import { 
  Users, 
  UserPlus, 
  Send, 
  UserCheck, 
  UserMinus, 
  Network as NetworkIcon,
  MessageCircle,
  CheckCircle,
  X,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { mapUserPreview } from '@/lib/mappers/users'

export default function Network() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const conns = useSelector(selectConnections)
  const profile = useSelector(selectProfile)
  const usersState = useSelector(selectUsersState)
  const [acceptedPeer, setAcceptedPeer] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('connections')
  const [actionBusy, setActionBusy] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const dedupeByPeer = (collection) => {
    const map = new Map()
    collection.forEach((entry) => {
      const key = entry?.peer?.id || entry?.id
      if (!key) return
      if (!map.has(key)) map.set(key, entry)
    })
    return Array.from(map.values())
  }

  const dedupeUsers = (collection) => {
    const map = new Map()
    collection.forEach((user) => {
      if (!user?.id) return
      if (!map.has(user.id)) map.set(user.id, user)
    })
    return Array.from(map.values())
  }

  const network = useMemo(
    () => dedupeByPeer(conns.network.map((entry) => ({ ...entry, peer: mapUserPreview(entry.peer?.raw || entry.peer) }))),
    [conns.network],
  )
  const incoming = useMemo(
    () => dedupeByPeer(conns.incoming.map((entry) => ({ ...entry, peer: mapUserPreview(entry.peer?.raw || entry.peer) }))),
    [conns.incoming],
  )
  const outgoing = useMemo(
    () => dedupeByPeer(conns.outgoing.map((entry) => ({ ...entry, peer: mapUserPreview(entry.peer?.raw || entry.peer) }))),
    [conns.outgoing],
  )
  const followers = useMemo(
    () => dedupeUsers(conns.followers.map((user) => mapUserPreview(user.raw || user))),
    [conns.followers],
  )
  const following = useMemo(
    () => dedupeUsers(conns.following.map((user) => mapUserPreview(user.raw || user))),
    [conns.following],
  )

  useEffect(() => {
    dispatch(fetchConnections())
  }, [dispatch])

  const markActionBusy = (userId, action) => {
    if (!userId) return
    setActionBusy((prev) => ({ ...prev, [userId]: action }))
  }

  const clearActionBusy = (userId) => {
    if (!userId) return
    setActionBusy((prev) => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
  }

  const handleAccept = (connectionId, peer) => {
    dispatch(acceptConnectionRequest({ connectionId }))
      .unwrap()
      .then(() => {
        dispatch(pushNotification({ type: 'accepted', text: `You and ${peer?.name || 'this user'} are now connected`, userId: peer?.id }))
        setAcceptedPeer(peer)
      })
      .catch((error) => {
        dispatch(pushNotification({ type: 'error', text: error?.message || 'Failed to accept invitation' }))
      })
  }

  const handleDecline = (connectionId) => {
    dispatch(declineConnectionRequest({ connectionId }))
      .unwrap()
      .then(() => {
        dispatch(pushNotification({ type: 'info', text: 'Invitation declined' }))
      })
      .catch((error) => {
        dispatch(pushNotification({ type: 'error', text: error?.message || 'Unable to decline invitation' }))
      })
  }

  const dismissModal = () => {
    setModalVisible(false)
    setTimeout(() => setAcceptedPeer(null), 200)
  }

  useEffect(() => {
    if (acceptedPeer) {
      const frame = requestAnimationFrame(() => setModalVisible(true))
      return () => cancelAnimationFrame(frame)
    }
    setModalVisible(false)
    return undefined
  }, [acceptedPeer])

  const startChat = (user) => {
    if (!user?.id) return
    dispatch(setActiveChat(user.id))
    navigate('/message')
  }

  const handleViewProfile = (user) => {
    if (!user?.id) return
    dispatch(selectUser(user.id))
    dispatch(fetchUserProfile(user.id))
    navigate(`/view/profile/${user.id}`)
  }

  const openChat = () => {
    if (!acceptedPeer?.id) return
    startChat(acceptedPeer)
    dismissModal()
  }

  const handleFollow = (user) => {
    if (!user?.id) return
    markActionBusy(user.id, 'follow')
    dispatch(followUserConnection({ userId: user.id }))
      .unwrap()
      .then(() => {
        dispatch(pushNotification({ type: 'success', text: `You are now following ${user.name || 'this user'}` }))
      })
      .catch((error) => {
        const message = typeof error === 'string' ? error : error?.message || 'Unable to follow user'
        dispatch(pushNotification({ type: 'error', text: message }))
      })
      .finally(() => clearActionBusy(user.id))
  }

  const handleUnfollow = (user) => {
    if (!user?.id) return
    markActionBusy(user.id, 'unfollow')
    dispatch(unfollowUserConnection({ userId: user.id }))
      .unwrap()
      .then(() => {
        dispatch(pushNotification({ type: 'info', text: `You unfollowed ${user.name || 'this user'}` }))
      })
      .catch((error) => {
        const message = typeof error === 'string' ? error : error?.message || 'Unable to unfollow user'
        dispatch(pushNotification({ type: 'error', text: message }))
      })
      .finally(() => clearActionBusy(user.id))
  }

  useEffect(() => {
    dispatch(
      updateProfile({
        followers: followers.length,
        following: following.length,
        followersIds: followers.map((user) => user.id),
        followingIds: following.map((user) => user.id),
      }),
    )
  }, [dispatch, followers, following])

  const tabDefinitions = useMemo(
    () => [
      {
        key: 'connections',
        label: 'Connections',
        description: 'People you are connected with',
        icon: Users,
        count: conns.totals?.network ?? network.length,
        color: 'blue',
        entries: network.map((entry) => ({
          key: entry.id,
          user: entry.peer,
          status: 'connected',
          connectionId: entry.id,
        })),
      },
      {
        key: 'invitations',
        label: 'Invitations',
        description: 'Invitations waiting for your response',
        icon: UserPlus,
        count: conns.totals?.incoming ?? incoming.length,
        color: 'green',
        entries: incoming.map((entry) => ({
          key: entry.id,
          user: entry.peer,
          status: 'incoming',
          connectionId: entry.id,
        })),
      },
      {
        key: 'sent',
        label: 'My Requests',
        description: 'Connection requests you have sent',
        icon: Send,
        count: conns.totals?.outgoing ?? outgoing.length,
        color: 'purple',
        entries: outgoing.map((entry) => ({
          key: entry.id,
          user: entry.peer,
          status: 'pending',
          connectionId: entry.id,
        })),
      },
      {
        key: 'followers',
        label: 'Followers',
        description: 'People who follow your updates',
        icon: UserCheck,
        count: conns.totals?.followers ?? followers.length,
        color: 'orange',
        entries: followers.map((user) => ({
          key: user.id,
          user,
          status: 'follower',
        })),
      },
      {
        key: 'following',
        label: 'Following',
        description: 'Profiles you are following',
        icon: UserMinus,
        count: conns.totals?.following ?? following.length,
        color: 'pink',
        entries: following.map((user) => ({
          key: user.id,
          user,
          status: 'following',
        })),
      },
    ],
    [conns.totals, network, incoming, outgoing, followers, following],
  )

  const activeTabData = useMemo(
    () => tabDefinitions.find((tab) => tab.key === activeTab) || tabDefinitions[0],
    [tabDefinitions, activeTab],
  )

  const filteredEntries = useMemo(() => {
    const entries = activeTabData?.entries || []
    if (!searchQuery.trim()) return entries
    const query = searchQuery.toLowerCase()
    return entries.filter((entry) => {
      const user = entry.user
      return (
        user?.name?.toLowerCase().includes(query) ||
        user?.title?.toLowerCase().includes(query) ||
        user?.subtitle?.toLowerCase().includes(query) ||
        user?.companyProfile?.name?.toLowerCase().includes(query) ||
        user?.schoolProfile?.name?.toLowerCase().includes(query)
      )
    })
  }, [activeTabData?.entries, searchQuery])

  const followingIds = profile.followingIds || []
  const followersIds = profile.followersIds || []
  const isUserFollowing = (user) => (user?.id ? followingIds.includes(user.id) : false)
  const isUserFollower = (user) => (user?.id ? followersIds.includes(user.id) : false)
  const isBusy = (user, action) => (user?.id ? actionBusy[user.id] === action : false)

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/10 text-blue-600 border-blue-200',
      green: 'bg-green-500/10 text-green-600 border-green-200',
      purple: 'bg-purple-500/10 text-purple-600 border-purple-200',
      orange: 'bg-orange-500/10 text-orange-600 border-orange-200',
      pink: 'bg-pink-500/10 text-pink-600 border-pink-200',
    }
    return colors[color] || colors.blue
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset>
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <NetworkIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Network</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your professional connections
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="rounded-xl p-3" style={{ backgroundColor: '#121212' }}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search people"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20  border border-border"
                />
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* Chip Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {tabDefinitions.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-muted/50 text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-1 text-xs ${
                        activeTab === tab.key ? 'text-black/70' : 'text-muted-foreground'
                      }`}>
                        ({tab.count})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Content List */}
            <div className="rounded-xl p-3" style={{ backgroundColor: '#121212' }}>
              <div className="rounded-lg">
                <div className="py-2">
                  {filteredEntries?.length ? (
                    <div className="divide-y divide-border">
                      {filteredEntries.map((entry) => {
                        const user = entry.user
                        const isFollowing = isUserFollowing(user)
                        const followBusy = isBusy(user, 'follow')
                        const unfollowBusy = isBusy(user, 'unfollow')
                        return (
                          <UserCard
                            key={entry.key || user?.id}
                            user={user}
                            connected={entry.status === 'connected'}
                            pending={entry.status === 'pending'}
                            follower={entry.status === 'follower' || isUserFollower(user)}
                            following={isFollowing}
                            onMessage={startChat}
                            onAccept={
                              entry.status === 'incoming'
                                ? () => handleAccept(entry.connectionId, user)
                                : undefined
                            }
                            onDecline={
                              entry.status === 'incoming'
                                ? () => handleDecline(entry.connectionId)
                                : undefined
                            }
                            onFollow={
                              !isFollowing && (entry.status === 'follower' || entry.status === 'connected')
                                ? () => handleFollow(user)
                                : undefined
                            }
                            onUnfollow={isFollowing ? () => handleUnfollow(user) : undefined}
                            followDisabled={followBusy}
                            unfollowDisabled={unfollowBusy}
                            onView={handleViewProfile}
                            showConnect={['connected', 'incoming', 'pending'].includes(entry.status)}
                            bare={true}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-4 rounded-full ${getColorClasses(activeTabData?.color || 'blue')}`}>
                          {activeTabData?.icon && React.createElement(activeTabData.icon, { className: 'h-8 w-8' })}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {searchQuery.trim() ? 'No Results Found' : `No ${activeTabData?.label} Yet`}
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            {searchQuery.trim() ? (
                              'Try adjusting your search terms'
                            ) : (
                              <>
                                {activeTabData?.key === 'connections' && 'Start building your network by connecting with professionals'}
                                {activeTabData?.key === 'invitations' && 'No pending invitations at the moment'}
                                {activeTabData?.key === 'sent' && "You haven't sent any connection requests yet"}
                                {activeTabData?.key === 'followers' && 'No one is following you yet. Share great content to attract followers'}
                                {activeTabData?.key === 'following' && 'Start following people to see their updates'}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* Enhanced Connection Success Modal */}
      {acceptedPeer ? (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismissModal}></div>
          <div
            className={`relative z-10 w-full max-w-md transform transition-all duration-300 ${modalVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
          >
            <Card className="border-2 shadow-xl">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Connection Accepted
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      </CardTitle>
                      <CardDescription className="mt-1">
                        You can now message and collaborate
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    onClick={dismissModal}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{acceptedPeer.name}</div>
                      <div className="text-sm text-muted-foreground">{acceptedPeer.title || 'Professional'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>View full profile and contact details</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <span>Send messages and collaborate</span>
                  </div>
                </div>
              </CardContent>

              <Separator />

              <div className="p-6 flex gap-3">
                <Button variant="outline" onClick={dismissModal} className="flex-1">
                  Close
                </Button>
                <Button onClick={openChat} className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </SidebarProvider>
  )
}
