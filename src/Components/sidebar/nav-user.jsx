import React from 'react'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/Components/ui/avatar'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar'
import { useDispatch } from 'react-redux'
import { logout } from '@/redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'

export function NavUser({ user }){
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { displayName, subtitle } = React.useMemo(() => {
    return getDisplayNameWithSubtitle(user)
  }, [user])

  const handle = React.useMemo(() => {
    if (!user) return '@user'
    if (user.handle) return user.handle
    if (user.username) return `@${user.username}`
    const safe = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '')
    return safe ? `@${safe}` : '@user'
  }, [user, displayName])

  const onLogout = (e) => {
    e.stopPropagation()
    dispatch(logout())
    navigate('/login')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="group rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer p-3 flex items-center gap-3">
          <div onClick={()=>navigate('/profile')} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 rounded-full"><AvatarFallback /></Avatar>
            <div className="flex flex-col text-left leading-tight flex-1 min-w-0">
              <span className="truncate font-semibold text-sm">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{subtitle || handle}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
            className="relative p-2 rounded-full text-red-400 hover:text-red-500 hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-red-400/40"
          >
            <LogOut className="size-5" />
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-8 scale-0 group-hover:scale-100 transition-transform bg-neutral-800 text-white text-[10px] px-2 py-1 rounded shadow">
              Logout
            </span>
          </button>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
