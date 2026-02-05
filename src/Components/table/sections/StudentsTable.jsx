import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SECTION_KEYS, startEdit, cancelEdit, updateRow, deleteSchoolRecord, selectIsEditing } from '@/redux/slices/tableSlice'
import { Button } from '@/Components/ui/button'
import { Edit, Trash, Save, X } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme' 

export default function StudentsTable({ state }){
	const dispatch = useDispatch()
	const rows = state.data
	return (
		<div className="w-full">
			{/* Desktop / Tablet Table */}
			<div className="hidden md:block">
				<table className="w-full text-sm align-top">
					<thead className="border-b border-subtle">
						<tr>
							<Th>Date reported</Th>
							<Th>Business</Th>
							<Th>Place</Th>
							<Th>Employer</Th>
							<Th>Contact</Th>
							<Th>Registration #</Th>
							<Th>Notes</Th>
							<Th>Selection</Th>
							<Th>Course (Year)</Th>
							<Th>Training leader</Th>
							<Th>Student</Th>
							<Th>Email</Th>
							<Th>Status</Th>
							<Th className="text-right">Actions</Th>
						</tr>
					</thead>
					<tbody>
						{rows.map(r=> <Row key={r.id} row={r} dispatch={dispatch} />)}
					</tbody>
				</table>
			</div>

			{/* Mobile Card List */}
			<div className="md:hidden space-y-4 p-4">
				{rows.map(r => <StudentCard key={r.id} row={r} dispatch={dispatch} />)}
			</div>
		</div>
	)
}

const Th = ({ children, className='' }) => <th className={`font-medium px-4 py-3 text-left whitespace-nowrap text-muted-foreground ${className}`}>{children}</th>

function Row({ row, dispatch }){
	const isEditing = useSelector(selectIsEditing(SECTION_KEYS.students, row.id))
	const [local, setLocal] = React.useState(row)
	const { isDark } = useTheme()
	React.useEffect(()=>{ setLocal(row) }, [row])
	const onChange = (k,v)=> setLocal(l=>({...l,[k]:v}))
	const apply = ()=>{ dispatch(updateRow({ section: SECTION_KEYS.students, id: row.id, changes: local })); dispatch(cancelEdit()) }
	return (
		<tr className="border-b border-subtle last:border-0 hover:bg-accent/50 transition-colors">
			{isEditing ? (
				<>
					<Td><Input value={local.dateReported} onChange={e=>onChange('dateReported',e.target.value)} /></Td>
					<Td><Input value={local.business} onChange={e=>onChange('business',e.target.value)} /></Td>
					<Td><Input value={local.place} onChange={e=>onChange('place',e.target.value)} /></Td>
					<Td><Input value={local.employer} onChange={e=>onChange('employer',e.target.value)} /></Td>
					<Td><Input value={local.contact} onChange={e=>onChange('contact',e.target.value)} /></Td>
					<Td><Input value={local.registrationNumber} onChange={e=>onChange('registrationNumber',e.target.value)} /></Td>
					<Td><Input value={local.notes} onChange={e=>onChange('notes',e.target.value)} /></Td>
					<Td><Input value={local.selectionProcess} onChange={e=>onChange('selectionProcess',e.target.value)} /></Td>
					<Td><Input value={local.courseYear} onChange={e=>onChange('courseYear',e.target.value)} /></Td>
					<Td><Input value={local.trainingLeader} onChange={e=>onChange('trainingLeader',e.target.value)} /></Td>
					<Td><Input value={local.studentName} onChange={e=>onChange('studentName',e.target.value)} /></Td>
					<Td><Input value={local.email} onChange={e=>onChange('email',e.target.value)} /></Td>
					<Td><Input value={local.status} onChange={e=>onChange('status',e.target.value)} /></Td>
					<Td>
						<div className="flex gap-2 justify-end">
							<Button size="sm" onClick={apply} style={{ backgroundColor: isDark ? undefined : 'black', color: isDark ? undefined : 'white' }}><Save className="w-4 h-4 mr-1" /> Save</Button>
							<Button size="sm" variant="ghost" onClick={()=>dispatch(cancelEdit())} style={{ backgroundColor: isDark ? undefined : 'lightgray', color: isDark ? undefined : 'black' }}><X className="w-4 h-4 mr-1" /> Cancel</Button>
						</div>
					</Td>
				</>
			) : (
				<>
					<Td>{row.dateReported}</Td>
					<Td>{row.business}</Td>
					<Td>{row.place}</Td>
					<Td>{row.employer}</Td>
					<Td>{row.contact}</Td>
					<Td>{row.registrationNumber}</Td>
					<Td className="max-w-[180px] truncate" title={row.notes}>{row.notes}</Td>
					<Td>{row.selectionProcess}</Td>
					<Td>{row.courseYear}</Td>
					<Td>{row.trainingLeader}</Td>
					<Td>{row.studentName}</Td>
					<Td>{row.email}</Td>
					<Td><StatusPill status={row.status} /></Td>
					<Td>
						<div className="flex gap-1 justify-end">
							<Button size="sm" variant="ghost" onClick={()=>dispatch(startEdit({ section: SECTION_KEYS.students, id: row.id }))}><Edit className="w-4 h-4" /></Button>
							<Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" onClick={()=>dispatch(deleteSchoolRecord({ sectionKey: SECTION_KEYS.students, id: row.id }))}><Trash className="w-4 h-4" /></Button>
						</div>
					</Td>
				</>
			)}
		</tr>
	)
}

const Td = ({ children, className='' }) => <td className={`px-4 py-3 align-top whitespace-nowrap ${className}`}>{children}</td>
const Input = (props)=>{
	const { isDark } = useTheme()
	return <input {...props} className={`px-2 py-1 border rounded w-full text-sm focus:ring-1 focus:ring-primary ${isDark ? 'border border-input bg-background text-white' : 'border border-gray-300 bg-white text-black'}`} />
} 

// --- Mobile Card Version ---
function StudentCard({ row, dispatch }){
	const [editing, setEditing] = React.useState(false)
	const [local, setLocal] = React.useState(row)
	const { isDark } = useTheme()
	React.useEffect(()=>{ setLocal(row) }, [row])
	const onChange = (k,v)=> setLocal(l=>({...l,[k]:v}))
	const save = ()=>{ dispatch(updateRow({ section: SECTION_KEYS.students, id: row.id, changes: local })); setEditing(false) }
	return (
		<div className="rounded-lg border border-border p-4 bg-card shadow-sm">
			<div className="flex items-start gap-3">
				<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium shrink-0">
					{row.studentName?.[0] || '?'}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="font-semibold text-base leading-tight mr-2">{editing ? <input value={local.studentName} onChange={e=>onChange('studentName',e.target.value)} className={`border rounded px-2 py-1 text-sm ${isDark ? 'border border-input bg-background text-white' : 'border border-gray-300 bg-white text-black'}`} /> : row.studentName}</h3>
						<StatusPill status={row.status} editing={editing} value={local.status} onChange={v=>onChange('status',v)} />
					</div>
					<p className="text-sm text-muted-foreground break-all">{editing ? <input value={local.email} onChange={e=>onChange('email',e.target.value)} className={`border rounded px-1 py-0.5 text-sm ${isDark ? 'border border-input bg-background text-white' : 'border border-gray-300 bg-white text-black'}`} /> : row.email}</p>
				</div>
				<div className="flex gap-2 ml-auto">
					{editing ? (
						<>
							<Button size="sm" onClick={save} style={{ backgroundColor: isDark ? undefined : 'black', color: isDark ? undefined : 'white' }}><Save className="w-4 h-4" /></Button>
							<Button size="sm" variant="ghost" onClick={()=>{ setEditing(false); setLocal(row) }} style={{ backgroundColor: isDark ? undefined : 'lightgray', color: isDark ? undefined : 'black' }}><X className="w-4 h-4" /></Button>
						</>
					) : (
						<>
							<Button size="sm" variant="ghost" onClick={()=>setEditing(true)}><Edit className="w-4 h-4" /></Button>
							<Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" onClick={()=>dispatch(deleteSchoolRecord({ sectionKey: SECTION_KEYS.students, id: row.id }))}><Trash className="w-4 h-4" /></Button>
						</>
					)}
				</div>
			</div>
			<div className="mt-4 space-y-3 text-sm">
				<InfoRow label="Business" value={row.business} editing={editing} editKey="business" local={local} onChange={onChange} />
				<InfoRow label="Place" value={row.place} editing={editing} editKey="place" local={local} onChange={onChange} inline />
				<InfoRow label="Employer" value={row.employer} editing={editing} editKey="employer" local={local} onChange={onChange} />
				<InfoRow label="Contact" value={row.contact} editing={editing} editKey="contact" local={local} onChange={onChange} />
				<InfoRow label="Registration #" value={row.registrationNumber} editing={editing} editKey="registrationNumber" local={local} onChange={onChange} />
				<InfoRow label="Course (Year)" value={row.courseYear} editing={editing} editKey="courseYear" local={local} onChange={onChange} />
				<InfoRow label="Training leader" value={row.trainingLeader} editing={editing} editKey="trainingLeader" local={local} onChange={onChange} />
				<InfoRow label="Selection" value={row.selectionProcess} editing={editing} editKey="selectionProcess" local={local} onChange={onChange} />
				<InfoRow label="Notes" value={row.notes} editing={editing} editKey="notes" local={local} onChange={onChange} multiline />
				<InfoRow label="Date reported" value={row.dateReported} editing={editing} editKey="dateReported" local={local} onChange={onChange} inline />
			</div>
		</div>
	)
}

function InfoRow({ label, value, editing, editKey, local, onChange, multiline }){
	const { isDark } = useTheme()
	return (
		<div>
			<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
			{editing ? (
				multiline ? (
					<textarea value={local[editKey]||''} onChange={e=>onChange(editKey,e.target.value)} className={`w-full border rounded px-2 py-1 text-sm ${isDark ? 'border border-input bg-background text-white' : 'border border-gray-300 bg-white text-black'}`} rows={2} />
				) : (
					<input value={local[editKey]||''} onChange={e=>onChange(editKey,e.target.value)} className={`w-full border rounded px-2 py-1 text-sm ${isDark ? 'border border-input bg-background text-white' : 'border border-gray-300 bg-white text-black'}`} />
				)
			) : (
				<div className="leading-snug whitespace-pre-wrap break-words text-foreground">{value || <span className="text-muted-foreground">—</span>}</div>
			)}
		</div>
	)
} 

function StatusPill({ status, editing, value, onChange }){
	const statusStyles = {
		'Active': 'bg-green-500/20 text-green-400 border-green-500/30',
		'Inactive': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
		'Pending': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
	}
	if(editing){
		const { isDark } = useTheme()
		return (
			<select value={value} onChange={e=>onChange(e.target.value)} className={`text-xs border rounded px-2 py-1 ${isDark ? 'border border-input bg-background text-white' : 'border border-gray-300 bg-white text-black'}`}>
				<option>Active</option>
				<option>Inactive</option>
				<option>Pending</option>
			</select>
		)
	}
	return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusStyles[status] || statusStyles['Inactive']}`}>{status}</span>
}

