import React, { useMemo, useState } from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardHeader, CardTitle, CardContent } from '../Components/ui/card'
import { Button } from '../Components/ui/button'
import { Input } from '../Components/ui/input'
import UserCard from '@/Components/social/UserCard'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveChat } from '@/redux/slices/messagesSlice'
import { useNavigate } from 'react-router-dom'
import { usersMock, ENTITIES } from '@/lib/mock/users'
import { selectConnections } from '@/redux/store'
import ProfileView from '@/Components/social/ProfileView'

export default function Verified(){
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const conns = useSelector(selectConnections)

  // Local UI state
  const [query, setQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  // Build organizations from the existing mock users (companies, schools, universities)
  const organizations = useMemo(() => usersMock.filter(u => [ENTITIES.company, ENTITIES.school, ENTITIES.university].includes(u.entity)), [])

  const filtered = useMemo(() => {
    return organizations.filter((o) => {
      if (entityFilter !== 'all' && o.entity !== entityFilter) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (o.name || '').toLowerCase().includes(q) || (o.title || '').toLowerCase().includes(q) || (o.location || '').toLowerCase().includes(q)
    })
  }, [organizations, query, entityFilter])

  const connectionSets = useMemo(() => {
    const networkIds = new Set((conns?.network || []).map((item) => item.peer?.id || item.id).filter(Boolean))
    const outgoingIds = new Set((conns?.outgoing || []).map((item) => item.peer?.id || item.id).filter(Boolean))
    const incomingIds = new Set((conns?.incoming || []).map((item) => item.peer?.id || item.id).filter(Boolean))

    return { networkIds, outgoingIds, incomingIds }
  }, [conns])

  const stats = useMemo(() => ({
    schools: organizations.filter(o=>o.entity===ENTITIES.school).length,
    companies: organizations.filter(o=>o.entity===ENTITIES.company).length,
    countries: new Set(organizations.map(o=>o.location)).size,
  }), [organizations])

  const onView = (org) => {
    setSelected(org)
    setDetailOpen(true)
  }

  const onMessage = (org) => {
    const isConnected = connectionSets.networkIds.has(org.id)
    if (!isConnected) return // guard: don't message non-connected orgs
    dispatch(setActiveChat(org.id))
    navigate('/message')
  }

  return (<>
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
  <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Verified Organizations</h2>
                    <p className="text-sm text-muted-foreground">Trusted schools, universities and companies verified by LiaHub.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search organizations..." value={query} onChange={(e)=>setQuery(e.target.value)} className="w-72" />
                    <select className="input" value={entityFilter} onChange={(e)=>setEntityFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value={ENTITIES.company}>Companies</option>
                      <option value={ENTITIES.school}>Schools</option>
                      <option value={ENTITIES.university}>Universities</option>
                    </select>
                    <Button variant="outline" onClick={()=>{setQuery(''); setEntityFilter('all')}}>Reset</Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{stats.schools}</div>
                      <p className="text-sm text-muted-foreground">Verified Schools</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{stats.companies}</div>
                      <p className="text-sm text-muted-foreground">Verified Companies</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{stats.countries}</div>
                      <p className="text-sm text-muted-foreground">Countries</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Grid of orgs */}
                <div>
                  <h3 className="font-medium mb-4">Featured Verified Organizations</h3>
                  {filtered.length===0 ? (
                    <div className="rounded-xl bg-card shadow-sm p-6 text-sm text-muted-foreground">No organizations match your search.</div>
                  ) : (
                    <ul className="space-y-3">
                      {filtered.map((org) => {
                        const isConnected = connectionSets.networkIds.has(org.id)
                        const status = isConnected
                          ? 'connected'
                          : connectionSets.outgoingIds.has(org.id)
                          ? 'pending'
                          : connectionSets.incomingIds.has(org.id)
                          ? 'incoming'
                          : 'none'
                        return (
                          <li key={org.id} className="overflow-hidden">
                            <div className="flex items-center justify-between rounded-xl bg-card shadow-sm p-3">
                              <div className="flex-1 min-w-0">
                                <UserCard user={org} onView={onView} onMessage={onMessage} connected={isConnected} badge="Verified" bare className="w-full" />
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                {status === 'connected' ? (
                                  <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-emerald-600 text-emerald-50">
                                    <span className="text-[10px]">✓</span>
                                    Connected
                                  </span>
                                ) : status === 'pending' ? (
                                  <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-black">
                                    <span className="text-[10px]">⏳</span>
                                    Pending
                                  </span>
                                ) : status === 'incoming' ? (
                                  <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-sky-500 text-white">
                                    <span className="text-[10px]">⬅️</span>
                                    Incoming
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                    <span className="text-[10px]">＋</span>
                                    Connect
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">What does "Verified" mean?</h4>
                  <p className="text-sm text-muted-foreground">
                    Verified organizations have undergone a review process to confirm legitimacy and credentials. Contact details are revealed only after a connection is established.
                  </p>
                </div>
              </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
        {
          /* Details modal */
        }
        {detailOpen && selected ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={()=>setDetailOpen(false)}></div>
            <div className="z-60 max-w-4xl w-full p-6">
              <ProfileView
                user={selected}
                status={
                  connectionSets.networkIds.has(selected.id)
                    ? 'connected'
                    : connectionSets.outgoingIds.has(selected.id)
                    ? 'pending'
                    : connectionSets.incomingIds.has(selected.id)
                    ? 'incoming'
                    : 'none'
                }
                onBack={()=>setDetailOpen(false)}
                onMessage={(u)=>{
                  if(connectionSets.networkIds.has(u.id)){
                    dispatch(setActiveChat(u.id))
                    navigate('/message')
                  }
                }}
              />
            </div>
          </div>
        ) : null}
  </>)
}
