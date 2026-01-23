import React, { useRef } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar'
import { NavUser } from './nav-user'
import { useSelector } from 'react-redux'
import { selectAuth } from '@/redux/store'
import { Link, useLocation } from 'react-router-dom'
import { getSidebarConfig } from './sidebarConfig'
import { selectTotalUnreadMessages } from '@/redux/slices/messagesSlice'
import { selectUnreadNotificationsCount } from '@/redux/slices/notificationsSlice'

export function AppSidebar(){
  const { user } = useSelector(selectAuth)
  const location = useLocation()
  const { navItems, moreItems } = getSidebarConfig(user)
  const detailsRef = useRef(null)
  const unreadMessages = useSelector(selectTotalUnreadMessages)
  const unreadNotifications = useSelector(selectUnreadNotificationsCount)

  const handleDetailsToggle = () => {
    if (detailsRef.current && detailsRef.current.open) {
      setTimeout(() => {
        detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 0)
    }
  }

  const getBadgeCount = (itemTitle) => {
    if (itemTitle === 'Message') return unreadMessages
    if (itemTitle === 'Notifications') return unreadNotifications
    // Add more badge logic here for Jobs, Posts etc as needed
    return 0
  }

  return (
    <Sidebar>
    
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.url
            const badgeCount = getBadgeCount(item.title)
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild active={isActive}>
                  <Link to={item.url} className="flex items-center gap-2">
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                    {badgeCount > 0 && (
                      <div className="ml-auto h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-semibold">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </div>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          <SidebarMenuItem>
            <details ref={detailsRef} onToggle={handleDetailsToggle} className="group">
              <summary className="list-none cursor-pointer">
                <SidebarMenuButton asChild>
                  <div className="flex items-center gap-2"><MoreHorizontal className="size-4" /><span>More</span></div>
                </SidebarMenuButton>
              </summary>
              <div className="mt-1 ml-4 space-y-1">
                {moreItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.url
                  const badgeCount = getBadgeCount(item.title)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild active={isActive}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span>{item.title}</span>
                          {badgeCount > 0 && (
                            <div className="ml-auto h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-semibold">
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </div>
            </details>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user||{ name:'Guest', email:'guest@example.com'}} />
      </SidebarFooter>
    </Sidebar>
  )
}
