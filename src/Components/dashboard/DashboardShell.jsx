import React from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import TableManager from '@/Components/table/TableManager'

const StatCard = ({ title, value, subtext, icon: Icon }) => (
	<Card className="bg-card border-0 shadow-sm">
		<CardHeader className="flex flex-row items-center justify-between pb-2">
			<div className="flex items-center gap-2">
				{Icon ? <Icon className="w-4 h-4 text-muted-foreground" /> : null}
				<CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
			</div>
		</CardHeader>
		<CardContent>
			<div className="text-2xl font-bold text-foreground">{value}</div>
			{subtext ? <p className="text-xs text-muted-foreground">{subtext}</p> : null}
		</CardContent>
	</Card>
)

export default function DashboardShell({
	title,
	subtitle = null,
	stats = [],
	tableSlot = null,
	infoCard = null,
	pendingAssignments = null,
	children,
	// optional entity string to customize layout for 'school' vs others
	entity = null,
}){
	const tableContent = tableSlot ?? children ?? <TableManager />

	return (
		<SidebarProvider className="flex flex-col bg-background text-foreground">
			<SiteHeader />
			<div className="flex flex-1 min-h-0">
				<AppSidebar />
				<SidebarInset>
					<main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full">
						<header className="flex flex-col gap-1">
							<h1 className="text-2xl font-bold text-foreground">{title}</h1>
							{subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
						</header>

						{pendingAssignments ? (
							<div className="w-full">
								{pendingAssignments}
							</div>
						) : null}

						{stats.length ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
								{stats.map((stat) => (
									<StatCard key={stat.title} {...stat} />
								))}
							</div>
						) : null}

						{/* For non-school (company/others) show infoCard above table */}
						{entity !== 'school' && infoCard ? (
							<div className="flex flex-col gap-4">{infoCard}</div>
						) : null}

						<div className="w-full rounded-lg bg-card overflow-hidden shadow-sm">
							{tableContent}
						</div>

						{/* For school users, move infoCard (Lia essentials) to bottom-most */}
						{entity === 'school' && infoCard ? (
							<div className="flex flex-col gap-4">{infoCard}</div>
						) : null}
					</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	)
}
