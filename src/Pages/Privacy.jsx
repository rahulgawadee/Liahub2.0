import React from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardHeader, CardTitle, CardContent } from '../Components/ui/card'
import { Button } from '../Components/ui/button'
import { Label } from '../Components/ui/label'

export default function Privacy(){
  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
  <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset>
          <div className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Visibility */}
                <div>
                  <h3 className="font-medium mb-3">Profile Visibility</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="profile-public" className="text-sm font-medium">Public Profile</Label>
                        <p className="text-xs text-muted-foreground">Make your profile visible to all users</p>
                      </div>
                      <input type="checkbox" id="profile-public" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-email" className="text-sm font-medium">Show Email Address</Label>
                        <p className="text-xs text-muted-foreground">Display your email on your profile</p>
                      </div>
                      <input type="checkbox" id="show-email" className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-activity" className="text-sm font-medium">Show Activity Status</Label>
                        <p className="text-xs text-muted-foreground">Let others see when you're active</p>
                      </div>
                      <input type="checkbox" id="show-activity" defaultChecked className="rounded" />
                    </div>
                  </div>
                </div>

                {/* Connection Privacy */}
                <div>
                  <h3 className="font-medium mb-3">Connection Privacy</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="connection-requests" className="text-sm font-medium">Connection Requests</Label>
                        <p className="text-xs text-muted-foreground">Who can send you connection requests</p>
                      </div>
                      <select className="px-3 py-1 border border-border rounded text-sm">
                        <option>Everyone</option>
                        <option>Schools and Companies</option>
                        <option>No one</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="view-connections" className="text-sm font-medium">View My Connections</Label>
                        <p className="text-xs text-muted-foreground">Who can see your network</p>
                      </div>
                      <select className="px-3 py-1 border border-border rounded text-sm">
                        <option>Everyone</option>
                        <option>Connections only</option>
                        <option>Only me</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Data & Analytics */}
                <div>
                  <h3 className="font-medium mb-3">Data & Analytics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="analytics" className="text-sm font-medium">Usage Analytics</Label>
                        <p className="text-xs text-muted-foreground">Help improve the platform with anonymous usage data</p>
                      </div>
                      <input type="checkbox" id="analytics" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketing" className="text-sm font-medium">Marketing Communications</Label>
                        <p className="text-xs text-muted-foreground">Receive emails about new features and opportunities</p>
                      </div>
                      <input type="checkbox" id="marketing" className="rounded" />
                    </div>
                  </div>
                </div>

                {/* Data Management */}
                <div>
                  <h3 className="font-medium mb-3">Data Management</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Download My Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Delete My Account
                    </Button>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div>
                  <h3 className="font-medium mb-3">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Learn more about how we collect, use, and protect your data.
                  </p>
                  <Button variant="link" className="p-0 h-auto">
                    View Privacy Policy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
