import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'

export function AuthShell({ title, description, children, footer = null, entityTabs = null }) {
  return (
    <div className="auth-background min-h-screen flex items-center justify-center p-4">
      <Card className="neomorph-card w-full max-w-md relative overflow-hidden border border-[#1a1a1a]">
        <CardHeader className="space-y-4">
          {entityTabs}
          <CardTitle className="text-center text-2xl text-gray-100">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-center text-gray-400">{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="pt-6">{children}</CardContent>
        {footer ? (
          <CardFooter className="flex justify-center border-t border-gray-700/30 pt-6">{footer}</CardFooter>
        ) : null}
      </Card>
    </div>
  )
}
