import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SECTION_KEYS, startEdit, cancelEdit, updateRow, deleteSchoolRecord, selectIsEditing } from '@/redux/slices/tableSlice'
import { Button } from '@/Components/ui/button'
import { Edit, Trash, Save, X } from 'lucide-react'

export default function LeadingCompaniesTable({ state }){
	const rows = state.data
	const dispatch = useDispatch()
	return (
		<div className="w-full">
			<div className="hidden md:block">
				<table className="w-full text-sm align-top">
					<thead className="border-b border-subtle">
						<tr>
							<Th>Business</Th>
							<Th>Contact person</Th>
							<Th>Contact number</Th>
							<Th>Email</Th>
							<Th>Place</Th>
							<Th>Students</Th>
							<Th className="text-right">Actions</Th>
						</tr>
					</thead>
					<tbody>
						{rows.map(r=> <Row key={r.id} row={r} dispatch={dispatch} />)}
					</tbody>
				</table>
			</div>
			<div className="md:hidden space-y-4 p-4">
				{rows.map(r=> <LeadingCompanyCard key={r.id} row={r} dispatch={dispatch} />)}
			</div>
		</div>
	)
}

const Th = ({ children, className='' }) => <th className={`font-medium px-4 py-3 text-left whitespace-nowrap text-muted-foreground ${className}`}>{children}</th>
const Td = ({ children, className='' }) => <td className={`px-4 py-3 align-top ${className}`}>{children}</td>
const Input = (props)=><input {...props} className="px-2 py-1 border rounded w-full text-sm bg-background" />

function Row({ row, dispatch }){
	const isEditing = useSelector(selectIsEditing(SECTION_KEYS.leadingCompanies, row.id))
	const [local, setLocal] = React.useState(row)
	React.useEffect(()=>{ setLocal(row) }, [row])
	const onChange = (k,v)=> setLocal(l=>({...l,[k]:v}))
	const apply = ()=>{ dispatch(updateRow({ section: SECTION_KEYS.leadingCompanies, id: row.id, changes: local })); dispatch(cancelEdit()) }
	const remove = ()=> dispatch(deleteSchoolRecord({ sectionKey: SECTION_KEYS.leadingCompanies, id: row.id }))

	return (
		<tr className="border-b border-subtle last:border-0 hover:bg-accent/50 transition-colors">
			{isEditing ? (
				<>
					<Td><Input value={local.business} onChange={e=>onChange('business',e.target.value)} /></Td>
					<Td><Input value={local.contactPerson} onChange={e=>onChange('contactPerson',e.target.value)} /></Td>
					<Td><Input value={local.contactNumber} onChange={e=>onChange('contactNumber',e.target.value)} /></Td>
					<Td><Input value={local.email} onChange={e=>onChange('email',e.target.value)} /></Td>
					<Td><Input value={local.place} onChange={e=>onChange('place',e.target.value)} /></Td>
					<Td><Input value={local.students} onChange={e=>onChange('students',e.target.value)} /></Td>
					<Td>
						<div className="flex gap-1 justify-end">
							<Button size="sm" variant="ghost" onClick={apply}><Save className="w-4 h-4" /></Button>
							<Button size="sm" variant="ghost" onClick={()=>dispatch(cancelEdit())}><X className="w-4 h-4" /></Button>
						</div>
					</Td>
				</>
			) : (
				<>
					<Td>{row.business}</Td>
					<Td>{row.contactPerson}</Td>
					<Td>{row.contactNumber}</Td>
					<Td>{row.email}</Td>
					<Td>{row.place}</Td>
					<Td>{row.students}</Td>
					<Td>
						<div className="flex gap-1 justify-end">
							<Button size="sm" variant="ghost" onClick={()=>dispatch(startEdit({ section: SECTION_KEYS.leadingCompanies, id: row.id }))}><Edit className="w-4 h-4" /></Button>
							<Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" onClick={remove}><Trash className="w-4 h-4" /></Button>
						</div>
					</Td>
				</>
			)}
		</tr>
	)
}

function LeadingCompanyCard({ row, dispatch }){
	const [editing, setEditing] = React.useState(false)
	const [local, setLocal] = React.useState(row)
	React.useEffect(()=>{ setLocal(row) }, [row])
	const onChange=(k,v)=> setLocal(l=>({...l,[k]:v}))
	const save=()=>{ dispatch(updateRow({ section: SECTION_KEYS.leadingCompanies, id: row.id, changes: local })); setEditing(false) }
	const remove = ()=> dispatch(deleteSchoolRecord({ sectionKey: SECTION_KEYS.leadingCompanies, id: row.id }))

	return (
		<div className="rounded-lg border border-border p-4 bg-card shadow-sm">
			<div className="flex items-start gap-3">
				<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium shrink-0">
					{row.business?.[0] || '?'}
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-base leading-tight">{editing ? <CardInput value={local.business} onChange={e=>onChange('business',e.target.value)} /> : row.business}</h3>
					<p className="text-sm text-muted-foreground break-all">{editing ? <CardInput value={local.email} onChange={e=>onChange('email',e.target.value)} /> : row.email}</p>
				</div>
				<div className="flex gap-1 ml-auto">
					{editing ? (
						<>
							<Button size="sm" variant="ghost" onClick={save}><Save className="w-4 h-4" /></Button>
							<Button size="sm" variant="ghost" onClick={()=>{ setEditing(false); setLocal(row) }}><X className="w-4 h-4" /></Button>
						</>
					) : (
						<>
							<Button size="sm" variant="ghost" onClick={()=>setEditing(true)}><Edit className="w-4 h-4" /></Button>
							<Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" onClick={remove}><Trash className="w-4 h-4" /></Button>
						</>
					)}
				</div>
			</div>
			<div className="mt-4 grid grid-cols-2 gap-4 text-sm">
				<Info label="Contact person" value={row.contactPerson} editing={editing} k="contactPerson" local={local} onChange={onChange} />
				<Info label="Contact number" value={row.contactNumber} editing={editing} k="contactNumber" local={local} onChange={onChange} />
				<Info label="Place" value={row.place} editing={editing} k="place" local={local} onChange={onChange} />
				<Info label="Students" value={row.students} editing={editing} k="students" local={local} onChange={onChange} />
			</div>
		</div>
	)
}

const CardInput = (props) => <input {...props} className="w-full border-b border-subtle bg-transparent focus:outline-none focus:border-primary text-sm" />

function Info({ label, value, editing, k, local, onChange }){
	return (
		<div>
			<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
			{editing ? <CardInput value={local[k]||''} onChange={e=>onChange(k,e.target.value)} /> : <div className="leading-snug break-words text-foreground">{value||<span className="text-muted-foreground">—</span>}</div>}
		</div>
	)
}

