import React from 'react'
import { SidebarIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { useSidebar } from '../ui/sidebar'
import logoUrl from '@/assets/logo.png'

export function SiteHeader(){
  const { toggleSidebar } = useSidebar()
  return (
    // Shift header 5px below top as requested
    <header className="bg-background sticky top-[5px] z-40 flex w-full items-center">
      <div className="flex h-16 w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <SidebarIcon className="size-4" />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center">
          <img src={logoUrl} alt="LiaHub" className="h-8" />
        </div>
      </div>
    </header>
  )
}
