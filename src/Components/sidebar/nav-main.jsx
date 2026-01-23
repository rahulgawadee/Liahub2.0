import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '../ui/sidebar'

export function NavMain({ items }){
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => (
          <Collapsible key={item.title} defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url} className="flex items-center gap-2">
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight className="size-4" />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map(sub => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={sub.url}><span>{sub.title}</span></a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ): null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export const SidebarGroupLabel = ({ children }) => <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</div>
