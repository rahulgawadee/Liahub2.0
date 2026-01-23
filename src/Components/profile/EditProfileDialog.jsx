import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setProfile, fetchProfile } from '@/redux/slices/profileSlice'
import { profileMerged } from '@/redux/slices/authSlice'
import { selectAuth, selectProfile } from '@/redux/store'
import EditForm from './EditForm'
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'
import api from '@/lib/apiClient'
import { getImageUrl } from '@/lib/imageUtils'

const BIO_PLACEHOLDER = 'Add a short bio about yourself.'

const normalizeHandle = (value = '') => value.toString().replace(/^@+/, '').trim()

const normalizeWebsite = (value = '') => {
	const trimmed = value.trim()
	if (!trimmed) return ''
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const extractName = (name, fallback = '') => {
	if (!name) return fallback
	if (typeof name === 'string') {
		const trimmed = name.trim()
		return trimmed || fallback
	}
	if (typeof name === 'object') {
		const first = (name.first || '').trim()
		const last = (name.last || '').trim()
		const combined = [first, last].filter(Boolean).join(' ').trim()
		return combined || fallback
	}
	return fallback
}

const buildFormState = (profileState = {}, authUser = {}) => {
	// Check if user is a company
	const isCompany = authUser?.roles?.some(role => 
		['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'].includes(role)
	)
	
	// For companies, use companyName; for others, use name.first/last
	let name
	if (isCompany && authUser.companyProfile?.companyName) {
		name = authUser.companyProfile.companyName
	} else {
		const fallbackNameSource = extractName(authUser.rawName, typeof authUser.profileName === 'string' ? authUser.profileName : (typeof authUser.name === 'string' ? authUser.name : ''))
		name = extractName(profileState.name, fallbackNameSource)
	}

	const profileHandle = typeof profileState.handle === 'string' ? profileState.handle : profileState.social?.handle
	const usernameFallback = authUser.username || (authUser.email ? authUser.email.split('@')[0] : 'user')
	const handle = normalizeHandle(profileHandle ?? '') || normalizeHandle(usernameFallback) || 'user'

	const profileBioRaw = typeof profileState.bio === 'string' ? profileState.bio : profileState.social?.bio ?? ''
	const trimmedBio = (profileBioRaw || '').trim()
	const bio = trimmedBio && trimmedBio !== BIO_PLACEHOLDER ? trimmedBio : ''

	const locationRaw = typeof profileState.location === 'string' ? profileState.location : profileState.contact?.location ?? ''
	const websiteRaw = typeof profileState.website === 'string' ? profileState.website : profileState.contact?.website ?? ''

	return {
		name,
		handle,
		bio,
		location: (locationRaw || '').trim(),
		website: (websiteRaw || '').trim(),
	}
}


export default function EditProfileDialog({ open, onClose }){
	const dispatch = useDispatch()
	const { user } = useSelector(selectAuth)
	const profile = useSelector(selectProfile)
	const [form, setForm] = useState(() => buildFormState(profile, user))
	const [avatarPreview, setAvatarPreview] = useState(() => getImageUrl(profile.avatarUrl) || '')
	const [coverPreview, setCoverPreview] = useState(() => getImageUrl(profile.coverUrl) || '')
	const [avatarFile, setAvatarFile] = useState(null)
	const [coverFile, setCoverFile] = useState(null)
	const [saving, setSaving] = useState(false)
	const avatarRef = React.useRef(null)
	const coverRef = React.useRef(null)

	// Check if user is a company
	const isCompanyUser = user?.roles?.some(role => 
		['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'].includes(role)
	)

	const onChange = e => setForm(f=>({...f, [e.target.name]: e.target.value }))

	useEffect(() => {
		if (!open) return
		setForm(buildFormState(profile, user))
		setAvatarPreview(getImageUrl(profile.avatarUrl) || '')
		setCoverPreview(getImageUrl(profile.coverUrl) || '')
		setAvatarFile(null)
		setCoverFile(null)
	}, [open, profile, user])

	const readFileAsDataUrl = (file) => new Promise((res, rej) => {
		const reader = new FileReader()
		reader.onload = () => res(reader.result)
		reader.onerror = rej
		reader.readAsDataURL(file)
	})

	const onAvatarPick = async (e) => {
		if (saving) return
		const f = e.target.files?.[0]
		if(!f) return
		const url = await readFileAsDataUrl(f)
		setAvatarPreview(url)
		setAvatarFile(f)
	}

	const onCoverPick = async (e) => {
		if (saving) return
		const f = e.target.files?.[0]
		if(!f) return
		const url = await readFileAsDataUrl(f)
		setCoverPreview(url)
		setCoverFile(f)
	}

	const uploadImage = async (file, endpoint) => {
		if (!user?.id) {
			throw new Error('Missing user identifier')
		}
		console.log(`📤 Uploading ${endpoint}...`);
		const formData = new FormData()
		formData.append(endpoint === 'avatar' ? 'avatar' : 'cover', file)
		
		try {
			const response = await api.post(`/users/${user.id}/${endpoint}`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			})
			console.log(`✅ ${endpoint} upload response:`, response.data);
			return response.data
		} catch (error) {
			console.error(`❌ ${endpoint} upload failed:`, error);
			throw error;
		}
	}

	const onSubmit = async (e)=>{
		e.preventDefault()
		if (saving) return
		if (!user?.id) {
			alert('Unable to update profile at the moment. Please sign in again and retry.')
			return
		}
		try {
			setSaving(true)

			// Upload images first and get the new URLs
			let newAvatarUrl = null
			let newCoverUrl = null

			if (avatarFile) {
				const avatarResponse = await uploadImage(avatarFile, 'avatar')
				newAvatarUrl = avatarResponse.avatar
				console.log('✅ Avatar uploaded:', newAvatarUrl)
			}

			if (coverFile) {
				const coverResponse = await uploadImage(coverFile, 'cover')
				newCoverUrl = coverResponse.coverImage
				console.log('✅ Cover uploaded:', newCoverUrl)
			}

		const trimmedName = (form.name || '').trim()
		const normalizedHandle = normalizeHandle(form.handle || '')
		
		console.log('🔍 Form data - Name:', trimmedName, 'Is Company:', isCompanyUser)
		
		const payload = {
				social: {
					handle: normalizedHandle,
					bio: (form.bio || '').trim(),
				},
				contact: {
					location: (form.location || '').trim(),
					website: normalizeWebsite(form.website || ''),
				},
			}

			// For company users, save to companyProfile.companyName
			if (isCompanyUser && trimmedName) {
				payload.companyProfile = {
					...(user.companyProfile || {}),
					companyName: trimmedName,
				}
			} else if (trimmedName) {
				// For regular users, save to name.first/last
				const nameParts = trimmedName.split(/\s+/)
				payload.name = {
					first: nameParts[0] || '',
					last: nameParts.slice(1).join(' ') || '',
				}
			}

		await api.put(`/users/${user.id}`, payload)
		
		// Force refresh profile from server to get latest media URLs
		const profileResponse = await api.get(`/users/${user.id}`)
		const updatedProfile = profileResponse.data
		
		console.log('📥 Received updated profile:', updatedProfile)
		console.log('📸 Media from server:', updatedProfile.media)

		// Update both profile and auth slices with the latest data
		dispatch(setProfile(updatedProfile))
		dispatch(profileMerged(updatedProfile))
		
		// Force another fetch to ensure sync
		dispatch(fetchProfile(user.id))
		
		console.log('✅ Redux state updated')

		// Reset form with updated data
		setForm(buildFormState(updatedProfile, updatedProfile))
		
		// Set previews to the newly uploaded URLs or existing ones from the server
		const finalAvatarUrl = updatedProfile.media?.avatar || newAvatarUrl
		const finalCoverUrl = updatedProfile.media?.cover || newCoverUrl
		
		console.log('🖼️ Final URLs - Avatar:', finalAvatarUrl, 'Cover:', finalCoverUrl)
		
		setAvatarPreview(getImageUrl(finalAvatarUrl) || '')
		setCoverPreview(getImageUrl(finalCoverUrl) || '')
		setAvatarFile(null)
		setCoverFile(null)

			onClose?.()
		} catch (error) {
			console.error('Failed to update profile:', error)
			alert('Failed to update profile: ' + (error.response?.data?.message || error.message))
		} finally {
			setSaving(false)
		}
	}
	if(!open) return null
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
			<div className="w-full max-w-lg rounded-xl border bg-card p-6 space-y-4 max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Edit profile</h2>
					<button onClick={onClose} className="text-sm opacity-70 hover:opacity-100" disabled={saving}>✕</button>
				</div>
				{saving && (
					<div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-primary flex items-center gap-2">
						<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span>Updating profile...</span>
					</div>
				)}
				<div className="space-y-4">
					{/* Previews and pickers */}
					<div className="flex gap-4 items-start">
						<div className="flex flex-col items-center">
							<Avatar className="h-20 w-20">
								<AvatarImage src={avatarPreview} alt="avatar" />
								<AvatarFallback />
							</Avatar>
							<button type="button" onClick={()=>avatarRef.current?.click()} className="text-xs mt-2 underline-offset-2 hover:underline disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>Change avatar</button>
							<input ref={avatarRef} type="file" accept="image/*" onChange={onAvatarPick} className="hidden" disabled={saving} />
						</div>
						<div className="flex-1">
							<div className="h-24 rounded-md overflow-hidden bg-accent border flex items-center justify-center">
								{coverPreview? <img src={coverPreview} alt="cover preview" className="h-full w-full object-cover" /> : <div className="text-xs opacity-60">No cover</div>}
							</div>
							<button type="button" onClick={()=>coverRef.current?.click()} className="text-xs mt-2 underline-offset-2 hover:underline disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>Change cover</button>
							<input ref={coverRef} type="file" accept="image/*" onChange={onCoverPick} className="hidden" disabled={saving} />
						</div>
					</div>
					<EditForm form={form} onChange={onChange} onCancel={onClose} onSubmit={onSubmit} isSubmitting={saving} isCompany={isCompanyUser} />
				</div>
			</div>
		</div>
	)
}
