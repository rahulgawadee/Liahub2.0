import React, { createContext, useContext, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import logoUrl from '@/assets/logo.png'

const SidebarCtx = createContext({ isOpen: true, toggleSidebar: () => {}, isMobile:false })

export function SidebarProvider({ children, className }) {
  const isSmallScreen = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  const [isMobile, setIsMobile] = useState(isSmallScreen)
  const [isOpen, setIsOpen] = useState(!isSmallScreen)
  const toggleSidebar = () => setIsOpen((o) => !o)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e) => {
      setIsMobile(e.matches)
      // close sidebar on mobile, open on desktop
      setIsOpen(!e.matches)
    }
    // initial sync
    handler(mq)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener(handler)
    }
  }, [])

  return (
    <SidebarCtx.Provider value={{ isOpen, toggleSidebar, isMobile }}>
      {/* Root layout: lock to viewport height & prevent body scrolling; main content will scroll internally */}
      <div className={cn('flex h-screen w-full overflow-hidden bg-background text-foreground', className)}>{children}</div>
    </SidebarCtx.Provider>
  )
}

export function useSidebar(){ return useContext(SidebarCtx) }

export const Sidebar = ({ className='', children }) => {
  const { isOpen, isMobile, toggleSidebar } = useSidebar()
  // On mobile we overlay the sidebar when open, otherwise it occupies fixed width on desktop
  if (isMobile) {
    return (
      <div className={cn('fixed inset-0 z-50', !isOpen && 'pointer-events-none')} aria-hidden={!isOpen}>
        <div onClick={toggleSidebar} className={cn('absolute inset-0 bg-black/40 transition-opacity', isOpen ? 'opacity-100' : 'opacity-0')} />
        <aside onClick={(e) => e.stopPropagation()} className={cn('absolute left-0 top-0 bottom-0 w-72 bg-background p-3 shadow-lg transition-transform flex flex-col', isOpen ? 'translate-x-0' : '-translate-x-full', className)}>
          {isOpen && (
            <>
              <div className="flex justify-center p-4 mb-4">
                <img src={logoUrl} alt="Logo" className="h-10 w-auto" />
              </div>
              {children}
            </>
          )}
        </aside>
      </div>
    )
  }

  return (
    <aside className={cn('transition-all duration-300 flex flex-col h-full overflow-hidden border-r border-gray-400/20 dark:border-gray-600/20', isOpen? 'w-72':'w-0', className)}>
      {isOpen && children}
    </aside>
  )
}
export const SidebarHeader = ({ children }) => <div className="p-7 border-b">{children}</div>
// Sidebar content no longer scrolls; it stays fixed with the page while main content scrolls
export const SidebarContent = ({ children }) => <div className="flex-1 p-2 space-y-4 overflow-y-auto no-scrollbar">{children}</div>
export const SidebarFooter = ({ children }) => <div className="p-2 mt-auto">{children}</div>

export const SidebarMenu = ({ children }) => <ul className="space-y-1">{children}</ul>
export const SidebarMenuItem = ({ children }) => <li className="relative">{children}</li>
export const SidebarMenuButton = ({ children, asChild=false, size='md', tooltip, active=false }) => {
  const Comp = asChild? 'span':'button'
  // Increased left padding (pl-8) for more spacing from left edge; balanced with pr-4
  return <Comp className={cn('w-full flex items-center gap-4 text-lg pl-8 pr-4 py-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors', size==='lg' && 'py-3 text-base font-medium', active && 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700')}>{children}</Comp>
}
export const SidebarMenuAction = ({ children, className='' }) => <button className={cn('absolute right-2 top-2 text-xs opacity-70 hover:opacity-100 transition-transform', className)}>{children}</button>
export const SidebarMenuSub = ({ children }) => <ul className="pl-6 py-1 space-y-1">{children}</ul>
export const SidebarMenuSubItem = ({ children }) => <li>{children}</li>
export const SidebarMenuSubButton = ({ children, asChild=false, active=false }) => {
  const Comp = asChild? 'span':'button'
  return <Comp className={cn("w-full flex text-xs items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800", active && 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700')}>{children}</Comp>
}

// Main content area: provide its own vertical scroll so sidebar stays static
export const SidebarInset = ({ children }) => <div className="flex-1 h-full overflow-y-auto no-scrollbar">{children}</div>
