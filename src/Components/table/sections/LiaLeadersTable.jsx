import React from 'react'

export default function LiaLeadersTable({ state }){
	const rows = state.data
	return (
		<div className="w-full">
			<div className="hidden md:block">
				<table className="w-full text-sm align-top">
					<thead className="border-b border-subtle">
						<tr>
							<Th>LIA Leader</Th>
							<Th>Contact</Th>
							<Th>Place</Th>
							<Th>Students</Th>
						</tr>
					</thead>
					<tbody>
						{rows.map(r=> (
							<tr key={r.id} className="border-b border-subtle last:border-0 hover:bg-accent/50 transition-colors">
								<Td>{r.leader}</Td>
								<Td>{r.contact}</Td>
								<Td>{r.place}</Td>
								<Td>{r.students}</Td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="md:hidden space-y-4 p-4">
				{rows.map(r => <LeaderCard key={r.id} row={r} />)}
			</div>
		</div>
	)
}

const Th = ({ children, className='' }) => <th className={`font-medium px-4 py-3 text-left whitespace-nowrap text-muted-foreground ${className}`}>{children}</th>
const Td = ({ children, className='' }) => <td className={`px-4 py-3 align-top whitespace-nowrap ${className}`}>{children}</td>

function LeaderCard({ row }){
	return (
		<div className="rounded-lg border border-border p-4 bg-card shadow-sm">
			<div className="flex items-start gap-3">
				<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium shrink-0">
					{row.leader?.[0] || '?'}
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-base leading-tight">{row.leader}</h3>
					<p className="text-sm text-muted-foreground break-all">{row.contact}</p>
				</div>
			</div>
			<div className="mt-4 grid grid-cols-2 gap-4 text-sm">
				<Info label="Place" value={row.place} />
				<Info label="Students" value={row.students} />
			</div>
		</div>
	)
}

function Info({ label, value }){
	return (
		<div>
			<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
			<div className="leading-snug text-foreground">{value ?? <span className="text-muted-foreground">—</span>}</div>
		</div>
	)
}

