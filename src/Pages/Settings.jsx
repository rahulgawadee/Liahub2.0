import React from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardHeader, CardTitle, CardContent } from '../Components/ui/card'
import { Button } from '../Components/ui/button'
import { Input } from '../Components/ui/input'
import { Label } from '../Components/ui/label'
import { useTheme } from '@/hooks/useTheme'

export default function Settings(){
  const { isDark } = useTheme()
  
  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
  <div className={`flex flex-1 min-h-0 transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <AppSidebar />
        <SidebarInset>
          <div className={`p-6 space-y-6 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-white'}`}>
            {/* Account Settings */}
            <Card className={`transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className={`transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>First Name</Label>
                    <Input id="firstName" placeholder="Enter your first name" className={`transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-black placeholder-gray-500'}`} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className={`transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Last Name</Label>
                    <Input id="lastName" placeholder="Enter your last name" className={`transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-black placeholder-gray-500'}`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className={`transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" className={`transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-black placeholder-gray-500'}`} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className={`transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Phone</Label>
                  <Input id="phone" placeholder="Enter your phone number" className={`transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-black placeholder-gray-500'}`} />
                </div>
                <Button className={`transition-colors duration-300 ${isDark ? 'bg-white hover:bg-gray-100 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}>Save Changes</Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className={`transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>Change Password</Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive push notifications in browser</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Connection Requests</Label>
                    <p className="text-xs text-muted-foreground">Notify when someone wants to connect</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Job Updates</Label>
                    <p className="text-xs text-muted-foreground">Notify about new job opportunities</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-start">
                  Manage Privacy Settings
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
