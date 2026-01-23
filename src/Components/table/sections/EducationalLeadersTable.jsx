import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAuth } from '@/redux/store'
import { Button } from '@/Components/ui/button'
import { Edit, Trash } from 'lucide-react'
import api from '@/lib/apiClient'
import { fetchStudentDashboard } from '@/redux/slices/tableSlice'

// currentUser is expected on state.currentUser (injected by parent)

export default function EducationalLeadersTable({ state }){
	const dispatch = useDispatch()
	const rows = state.data
	const { user: currentUser } = useSelector(selectAuth)

	// Defensive: ensure rows is an array
	const safeRows = Array.isArray(rows) ? rows : []
	return (
		<div className="w-full">
			<div className="hidden md:block">
				<table className="w-full text-sm align-top">
					<thead className="border-b border-subtle">
						<tr>
							<Th>LIA leader</Th>
							<Th>Contact</Th>
							<Th>Place</Th>
							<Th>Students</Th>
							<Th className="text-right">Actions</Th>
						</tr>
					</thead>
						<tbody>
							{safeRows.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">No records available</td>
								</tr>
							) : (
								safeRows.map((r) => (
									<tr key={r.id} className="border-b border-subtle last:border-0 hover:bg-accent/50 transition-colors">
										<Td>{r.leader}</Td>
										<Td>{r.contact}</Td>
										<Td>{r.place}</Td>
										<Td>{r.students}</Td>
																				<Td>
																						<div className="flex gap-1 justify-end">
																								{canEditRow(currentUser, r) ? (
																									<Button size="sm" variant="ghost" onClick={() => handleEdit(r)}>
																										<Edit className="w-4 h-4" />
																									</Button>
																								) : (
																									<Button size="sm" variant="ghost" disabled>
																										<Edit className="w-4 h-4" />
																									</Button>
																								)}
																								<Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500"><Trash className="w-4 h-4" /></Button>
																						</div>
																				</Td>
									</tr>
								))
							)}
						</tbody>
				</table>
			</div>
			<div className="md:hidden space-y-4 p-4">
					{safeRows.length === 0 ? (
						<div className="text-center text-sm text-muted-foreground">No records available</div>
					) : (
						safeRows.map((r) => <EduLeaderCard key={r.id} row={r} />)
					)}
			</div>
		</div>
	)
}

const Th = ({ children, className='' }) => <th className={`font-medium px-4 py-3 text-left whitespace-nowrap text-muted-foreground ${className}`}>{children}</th>
const Td = ({ children, className='' }) => <td className={`px-4 py-3 align-top whitespace-nowrap ${className}`}>{children}</td>

function EduLeaderCard({ row }){
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
				<div className="flex gap-1 ml-auto">
					<Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
					<Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500"><Trash className="w-4 h-4" /></Button>
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

function canEditRow(currentUser, row) {
	if (!currentUser) return false
	// Admins (manage_users) handled server-side; on client check role
	const roles = currentUser.roles || []
	if (roles.includes('platform_admin') || roles.includes('school_admin')) return true
	// Education managers can edit students only (server enforces) and their own profile
	if (roles.includes('education_manager')) {
		if (!row || !row.roles) return false
		// If row represents a student
		if (row.roles.includes && row.roles.includes('student')) return true
		// If row is the current user
		if (row.id === currentUser.id) return true
	}
	// Owners can edit themselves
	if (currentUser.id === row.id) return true
	return false
}

async function handleEdit(row) {
	try {
		const input = window.prompt('Enter JSON with fields to update (e.g. {"name": {"first":"New"}})')
		if (!input) return
		let payload = {}
		try { payload = JSON.parse(input) } catch (err) { alert('Invalid JSON'); return }

		// Call backend
		await api.put(`/users/${row.id}`, payload)
		alert('Updated')
		// Refresh dashboard data in redux
		dispatch(fetchStudentDashboard())
	} catch (err) {
		console.error(err)
		alert(err?.response?.data?.error || err.message || 'Update failed')
	}
}

