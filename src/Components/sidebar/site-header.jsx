import React from 'react'
import { SidebarIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { useSidebar } from '../ui/sidebar'
import { ThemeToggle } from '../ui/theme-toggle'
import logoUrl from '@/assets/logo.png'
import logoLightUrl from '@/assets/logolight.png'
import { useTheme } from '@/hooks/useTheme'

export function SiteHeader(){
  const { toggleSidebar } = useSidebar()
  const { isDark } = useTheme()
  return (
    // Shift header 5px below top as requested
    <header className={`sticky top-[5px] z-40 flex w-full items-center transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className={`flex h-16 w-full items-center justify-between px-4 transition-colors duration-300`}>
        <div className="flex items-center gap-2">
          <Button className={`h-8 w-8 transition-colors duration-300 ${isDark ? 'hover:bg-gray-900' : 'hover:bg-gray-100'}`} variant="ghost" size="icon" onClick={toggleSidebar}>
            <SidebarIcon className={`size-4 transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-800'}`} />
          </Button>
          <Separator orientation="vertical" className={`mr-2 h-4 transition-colors duration-300 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
          <div className="flex items-center">
            <img src={isDark ? logoUrl : logoLightUrl} alt="LiaHub" className="h-8" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
