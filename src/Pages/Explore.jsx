import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog'
import ExploreSearchBar from '@/Components/social/ExploreSearchBar'
import EmployerCard from '@/Components/social/EmployerCard'
import ConnectModal from '@/Components/social/ConnectModal'
import ProfileView from '@/Components/social/ProfileView'
import { useDispatch, useSelector } from 'react-redux'
import { selectUsersState, selectConnections, selectProfile, selectAuth } from '@/redux/store'
import { searchUsers, setUsersQuery, selectUser, cacheUser, fetchUserProfile } from '@/redux/slices/usersSlice'
import {
  fetchConnections,
  acceptConnectionRequest,
  declineConnectionRequest,
} from '@/redux/slices/connectionsSlice'
import { pushNotification } from '@/redux/slices/notificationsSlice'
import { setActiveChat } from '@/redux/slices/messagesSlice'
import { followUser as followUserLocal, addFollower } from '@/redux/slices/profileSlice'
import { Users, Search } from 'lucide-react'
import api from '@/lib/apiClient'

export default function Explore(){
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const users = useSelector(selectUsersState)
  const connections = useSelector(selectConnections)
  const profile = useSelector(selectProfile)
  const { user: authUser } = useSelector(selectAuth)
  const selected = users.selectedUserId
    ? users.entitiesById[users.selectedUserId] || users.results.find((user) => user.id === users.selectedUserId) || null
    : null
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [connectTarget, setConnectTarget] = useState(null)
  const [filterOptions, setFilterOptions] = useState({ locations: [], industries: [], domains: [] })
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const selectedIncoming = selected ? connections.incoming.find((entry) => entry.peer?.id === selected.id) : null

  useEffect(() => {
    if (initialLoadDone) return
    if (users.loading) return
    // Initial load: fetch all companies once
    dispatch(searchUsers({ entity: 'company' }))
    setInitialLoadDone(true)
  }, [dispatch, initialLoadDone, users.loading])

  useEffect(() => {
    if (!initialLoadDone) return // Don't search until initial load is done
    if (!users.query || Object.keys(users.query).length === 0) return
    // Trigger search when query changes (after initial load)
    const queryStr = JSON.stringify(users.query)
    dispatch(searchUsers(users.query))
  }, [dispatch, users.query, initialLoadDone])

  useEffect(() => {
    if (users.selectedUserId && !users.entitiesById[users.selectedUserId]) {
      dispatch(fetchUserProfile(users.selectedUserId))
    }
  }, [dispatch, users.entitiesById, users.selectedUserId])

  useEffect(() => {
    dispatch(fetchConnections())
  }, [dispatch])

  useEffect(() => {
    let mounted = true
    api
      .get('/users/filters')
      .then(({ data }) => {
        if (!mounted) return
        setFilterOptions({
          locations: Array.isArray(data?.locations) ? data.locations : [],
          industries: Array.isArray(data?.industries) ? data.industries : [],
          domains: Array.isArray(data?.domains) ? data.domains : [],
        })
      })
      .catch((err) => {
        console.error('Failed to load filter options', err)
        if (!mounted) return
        setFilterOptions({ locations: [], industries: [], domains: [] })
      })
    return () => {
      mounted = false
    }
  }, [])

  const onSearch = () => dispatch(searchUsers(users.query))
  const findConnectionEntry = (collection, userId) => collection.find((entry) => entry.peer?.id === userId)
  const statusFor = (user) => {
    if (!user) return 'none'
    if (findConnectionEntry(connections.network, user.id)) return 'connected'
    if (findConnectionEntry(connections.outgoing, user.id)) return 'pending'
    if (findConnectionEntry(connections.incoming, user.id)) return 'incoming'
    return 'none'
  }
  const onConnect = (u) => {
    setConnectTarget(u)
    setConnectModalOpen(true)
  }
  const onMessage = (u) => {
    dispatch(setActiveChat(u.id))
    dispatch(pushNotification({ type: 'message', text: `Opened chat with ${u.name}`, userId: u.id }))
  }
  const onView = (u) => {
    dispatch(selectUser(u.id))
    setDetailModalOpen(true)
  }

  const handleAccept = (entry, user) => {
    if (!entry) return
    dispatch(acceptConnectionRequest({ connectionId: entry.id }))
      .unwrap()
      .then(() => {
        dispatch(addFollower(user.id))
        dispatch(followUserLocal(user.id))
        dispatch(pushNotification({ type: 'info', text: `You are now connected with ${user.name}`, userId: user.id }))
      })
      .catch((error) => {
        dispatch(pushNotification({ type: 'error', text: error?.message || 'Accept failed' }))
      })
  }

  const handleDecline = (entry) => {
    if (!entry) return
    dispatch(declineConnectionRequest({ connectionId: entry.id }))
      .unwrap()
      .then(() => {
        dispatch(
          pushNotification({ type: 'info', text: 'Connection request declined', userId: entry.peer?.id }),
        )
      })
      .catch((error) => {
        dispatch(pushNotification({ type: 'error', text: error?.message || 'Decline failed' }))
      })
  }

  const directoryResults = useMemo(
    () =>
      users.results.filter((user) => {
        // Exclude self
        if (user.id === authUser?.id) return false

        // Exclude already connected
        const isAlreadyConnected = connections.network.some((entry) => entry.peer?.id === user.id)
        if (isAlreadyConnected) return false

        // Show only companies
        const isCompany = user.entity === 'company' || (Array.isArray(user.roles) && user.roles.some((role) => role.startsWith('company_')))
        return isCompany
      }),
    [authUser?.id, users.results, connections.network],
  )

  const handleVisitProfile = (user) => {
    if (!user?.id) return
    dispatch(cacheUser(user))
    dispatch(selectUser(user.id))
    navigate(`/view/profile/${user.id}`)
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          {/* Modern Explore Container - Full Width */}
          <div className="w-full min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Explore</h1>
                  <p className="text-sm text-muted-foreground">Discover and connect with professionals</p>
                </div>
              </div>
            </div>

            {/* Content - Full Width */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
              {/* Search Bar */}
              <div className="mb-6">
                 <ExploreSearchBar
                    value={users.query}
                    locations={filterOptions.locations}
                    industries={filterOptions.industries}
                    domains={filterOptions.domains}
                    onChange={(q) => dispatch(setUsersQuery(q))}
                    onSearch={onSearch}
                  />
              </div>

              {/* Results Section */}
              <div className="space-y-4">
                {users.loading ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="h-12 w-12 text-muted-foreground animate-pulse" />
                        <p className="text-muted-foreground font-medium">Searching for profiles...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : !users.loading && users.results.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="h-16 w-16 text-muted-foreground" />
                        <div>
                          <p className="text-xl font-semibold mb-2">No results found</p>
                          <p className="text-muted-foreground">Try adjusting your search criteria</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : !users.loading && users.results.length > 0 && directoryResults.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="h-16 w-16 text-muted-foreground" />
                        <div>
                          <p className="text-xl font-semibold mb-2">No matching profiles</p>
                          <p className="text-muted-foreground">No directory accounts match your search</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        Found <span className="font-semibold text-foreground">{directoryResults.length}</span> {directoryResults.length === 1 ? 'profile' : 'profiles'}
                      </p>
                    </div>

                    {/* Results Grid */}
                    <div className="space-y-4">
                      {directoryResults.map((entry) => {
                        const status = statusFor(entry)
                        const incomingEntry = status === 'incoming' ? findConnectionEntry(connections.incoming, entry.id) : null

                        return (
                          <EmployerCard
                            key={entry.id}
                            employer={entry}
                            status={status}
                            onConnect={onConnect}
                            onVisitProfile={handleVisitProfile}
                            onAccept={incomingEntry ? () => handleAccept(incomingEntry, entry) : undefined}
                            onDecline={incomingEntry ? () => handleDecline(incomingEntry) : undefined}
                          />
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* Profile Detail Dialog */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <ProfileView
              user={selected}
              status={statusFor(selected)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Connect Modal */}
      {connectModalOpen && connectTarget && (
        <ConnectModal
          open={connectModalOpen}
          onClose={() => {
            setConnectModalOpen(false)
            setConnectTarget(null)
          }}
          employer={connectTarget}
        />
      )}
    </SidebarProvider>
  )
}
