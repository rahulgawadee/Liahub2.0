import React from 'react'
import { useDispatch } from 'react-redux'
import { Button } from '@/Components/ui/button'
import { Edit, Trash } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { fetchStudentDashboard } from '@/redux/slices/tableSlice'

export default function AdminManagementTable({ state }){
	const dispatch = useDispatch()
	const rows = state.data || []

	const handleEdit = async (row) => {
		if (!row?.id) return
		// Ask explicitly for fields so admin can update email and other contact details
		const nameInput = window.prompt('Full name', row.leader || '')
		const emailInput = window.prompt('Email', row.contact || '')
		const phoneInput = window.prompt('Phone', '')
		const placeInput = window.prompt('Place / Location', row.place || '')
		const titleInput = window.prompt('Title / Designation', '')
		const departmentInput = window.prompt('Department', '')
		const skillsInput = window.prompt('Skills (comma separated)', '')
		const qualificationsInput = window.prompt('Qualifications (comma separated)', '')

		const parsed = {
			name: nameInput,
			contact: emailInput,
			phone: phoneInput,
			place: placeInput,
			title: titleInput,
			department: departmentInput,
			skills: skillsInput,
			qualifications: qualificationsInput,
		}

		const userPayload = {}
		// Map name -> name
		const leader = parsed.name || ''
		if (leader) {
			const parts = String(leader).trim().split(/\s+/)
			userPayload.name = { first: parts.shift() || '', last: parts.join(' ') || '' }
		}

		// contact and place
		if (parsed.contact || parsed.phone || parsed.place) {
			userPayload.contact = {}
			if (parsed.contact) userPayload.contact.email = parsed.contact
			if (parsed.phone) userPayload.contact.phone = parsed.phone
			if (parsed.place) userPayload.contact.location = parsed.place
		}

		// staff profile (title/department/skills/qualifications)
		const staffProfile = {}
		if (parsed.title) staffProfile.designation = parsed.title
		if (parsed.department) staffProfile.department = parsed.department
		if (parsed.skills) {
			staffProfile.skills = String(parsed.skills).split(',').map(s => s.trim()).filter(Boolean)
		}
		if (parsed.qualifications) {
			staffProfile.qualifications = String(parsed.qualifications).split(',').map(s => s.trim()).filter(Boolean)
		}
		if (Object.keys(staffProfile).length) userPayload.staffProfile = staffProfile

		try {
			await apiClient.put(`/users/${row.id}`, userPayload)
			dispatch(fetchStudentDashboard())
			window.alert('Updated successfully')
		} catch (err) {
			console.error('Failed to update user', err)
			window.alert('Failed to update user')
		}
	}

	const handleDelete = (row) => {
		// Leave delete as a no-op or wire to server-side delete if desired.
		// For now show a confirmation and inform user this action is unsupported here.
		if (!row?.id) return
		if (window.confirm('Remove this admin from the dashboard? This does not delete the user account.')) {
			// Optionally implement removal logic - currently refresh dashboard
			dispatch(fetchStudentDashboard())
		}
	}

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
						{rows.map(r=> (
							<tr key={r.id} className="border-b border-subtle last:border-0 hover:bg-accent/50 transition-colors">
								<Td>{r.leader}</Td>
								<Td>{r.contact}</Td>
								<Td>{r.place}</Td>
								<Td>{r.students}</Td>
								<Td>
									<div className="flex gap-1 justify-end">
										<Button size="sm" variant="ghost" onClick={() => handleEdit(r)}><Edit className="w-4 h-4" /></Button>
										<Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" onClick={() => handleDelete(r)}><Trash className="w-4 h-4" /></Button>
									</div>
								</Td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="md:hidden space-y-4 p-4">
				{rows.map(r=> <AdminCard key={r.id} row={r} onEdit={() => handleEdit(r)} onDelete={() => handleDelete(r)} />)}
			</div>
		</div>
	)
}

const Th = ({ children, className='' }) => <th className={`font-medium px-4 py-3 text-left whitespace-nowrap text-muted-foreground ${className}`}>{children}</th>
const Td = ({ children, className='' }) => <td className={`px-4 py-3 align-top whitespace-nowrap ${className}`}>{children}</td>

function AdminCard({ row, onEdit, onDelete }){
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
					<Button size="sm" variant="ghost" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
					<Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" onClick={onDelete}><Trash className="w-4 h-4" /></Button>
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

