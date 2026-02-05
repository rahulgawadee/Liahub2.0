import React from 'react'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/Components/ui/avatar'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar'
import { useDispatch } from 'react-redux'
import { logout } from '@/redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { useTheme } from '@/hooks/useTheme'

export function NavUser({ user }){
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isDark } = useTheme()

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
        <div className={`group rounded-full transition-all duration-300 cursor-pointer p-3 flex items-center gap-3 ${isDark ? 'hover:bg-gray-900' : 'hover:bg-gray-100'}`}>
          <div onClick={()=>navigate('/profile')} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 rounded-full"><AvatarFallback /></Avatar>
            <div className={`flex flex-col text-left leading-tight flex-1 min-w-0 transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <span className={`truncate font-semibold text-sm transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{displayName}</span>
              <span className={`truncate text-xs transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{subtitle || handle}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
            className={`relative p-2 rounded-full transition-all duration-300 ${isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' : 'text-red-600 hover:text-red-700 hover:bg-red-100'} focus:outline-none focus:ring-2 focus:ring-red-400/40`}
          >
            <LogOut className="size-5" />
            {/* Tooltip */}
            <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -top-8 scale-0 group-hover:scale-100 transition-transform text-white text-[10px] px-2 py-1 rounded shadow ${isDark ? 'bg-gray-700' : 'bg-gray-800'}`}>
              Logout
            </span>
          </button>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
