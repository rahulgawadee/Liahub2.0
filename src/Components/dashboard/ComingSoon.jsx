import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Separator } from '../ui/separator'

export function ComingSoon({ icon: Icon, title, description, points = [], actions = null, children = null }) {
  return (
    <Card className="bg-card/90 border border-border text-left">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          {Icon ? <Icon className="h-8 w-8 text-primary" /> : null}
          <div>
            <CardTitle className="text-2xl font-semibold text-foreground">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {points?.length ? (
          <div className="space-y-2">
            <Separator className="opacity-20" />
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {children}
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  )
}
