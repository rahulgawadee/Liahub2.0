import React from 'react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import TableManager from '@/Components/table/TableManager'
import { TrendingUp, Activity } from 'lucide-react'

const StatCard = ({ title, value, subtext, icon: Icon, trend, trendDirection = 'up' }) => (
	<Card className="bg-gradient-to-br from-card to-card/80 border-0 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden relative">
		<CardHeader className="flex flex-row items-center justify-between pb-2">
			<div className="flex items-center gap-3">
				{Icon ? (
					<Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
				) : null}
				<CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
			</div>
		</CardHeader>
		<CardContent>
			<div className="flex items-baseline gap-2">
				<div className="text-3xl font-bold text-foreground">{value}</div>
				{subtext ? <p className="text-xs text-muted-foreground ml-1">{subtext}</p> : null}
			</div>
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
		<SidebarProvider className="flex flex-col bg-gradient-to-br from-background via-background to-background/80 text-foreground min-h-screen">
			<SiteHeader />
			<div className="flex flex-1 min-h-0">
				<AppSidebar />
				<SidebarInset>
					<main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full overflow-y-auto">
						{/* Header Section */}
						<header className="flex flex-col gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
							<h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
							{subtitle ? (
								<p className="text-sm text-muted-foreground flex items-center gap-2">
									<Activity className="w-4 h-4 text-blue-600" />
									{subtitle}
								</p>
							) : null}
						</header>

						{/* Pending Assignments Section */}
						{pendingAssignments ? (
							<div className="w-full">
								{pendingAssignments}
							</div>
						) : null}

						{/* Stats Grid */}
						{stats.length ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
								{stats.map((stat) => (
									<StatCard key={stat.title} {...stat} />
								))}
							</div>
						) : null}

						{/* For non-school (company/others) show infoCard above table */}
						{entity !== 'school' && infoCard ? (
							<div className="flex flex-col gap-4">{infoCard}</div>
						) : null}

						{/* Main Table Section */}
						<div className="w-full rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
							{tableContent}
						</div>

						{/* For school users, move infoCard (Lia essentials) to bottom-most */}
						{entity === 'school' && infoCard ? (
							<div className="flex flex-col gap-4 pb-4">{infoCard}</div>
						) : null}
					</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	)
}
