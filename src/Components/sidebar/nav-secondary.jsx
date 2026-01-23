import React from 'react'
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar'

export function NavSecondary({ items }){
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <a href={item.url} className="flex items-center gap-2">
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// Simple wrappers for grouping (to mirror API)
export const SidebarGroup = ({ children, ...p }) => <div {...p}>{children}</div>
export const SidebarGroupContent = ({ children }) => <div>{children}</div>
