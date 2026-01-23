import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'

const DEFAULT_BIO = 'Add a short bio about yourself.'

const deriveFullName = (name) => {
	if (!name) return ''
	if (typeof name === 'string') return name.trim()
	const first = (name.first || '').trim()
	const last = (name.last || '').trim()
	return [first, last].filter(Boolean).join(' ').trim()
}

const sanitizeHandle = (value) => {
	if (typeof value !== 'string') return ''
	return value.replace(/^@+/, '').trim()
}

const applyServerProfile = (state, payload = {}) => {
	const media = payload.media ?? {}
	state.avatarUrl = media.avatar || null
	state.coverUrl = media.cover || null

	if (Object.prototype.hasOwnProperty.call(payload, 'name') || payload.name) {
		const fullName = deriveFullName(payload.name)
		state.name = fullName || null
	}

	const social = payload.social ?? {}
	const primaryHandleSource = social.handle !== undefined ? social.handle : undefined
	const fallbackHandleSource = primaryHandleSource !== undefined ? primaryHandleSource : (payload.username ?? state.handle ?? '')
	const sanitizedHandle = sanitizeHandle(fallbackHandleSource)
	state.handle = sanitizedHandle || sanitizeHandle(payload.username ?? '') || (state.handle ? state.handle.trim() : '')
	const rawBio = typeof social.bio === 'string' ? social.bio : ''
	const normalizedBio = rawBio.trim()
	state.bio = normalizedBio.length ? normalizedBio : DEFAULT_BIO

	const contact = payload.contact ?? {}
	state.location = (contact.location ?? '').toString().trim()
	state.website = (contact.website ?? '').toString().trim()

	if (typeof payload.followerCount === 'number') {
		state.followers = payload.followerCount
	}
	if (typeof payload.followingCount === 'number') {
		state.following = payload.followingCount
	}
}

// Async thunk to fetch profile from backend
export const fetchProfile = createAsyncThunk(
	'profile/fetchProfile',
	async (userId, { rejectWithValue }) => {
		try {
			const response = await api.get(`/users/${userId}`)
			return response.data
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message)
		}
	}
)

// Async thunk to update profile in backend
export const updateProfileAsync = createAsyncThunk(
	'profile/updateProfile',
	async ({ userId, data }, { rejectWithValue }) => {
		try {
			const response = await api.put(`/users/${userId}`, data)
			return response.data
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message)
		}
	}
)

const initialState = {
	coverUrl: null,
	avatarUrl: null,
	name: null,
	handle: null,
	bio: DEFAULT_BIO,
	location: '',
	website: '',
	followers: 0,
	following: 0,
	followersIds: [],
	followingIds: [],
	highlights: [],
	posts: [],
	loading: false,
	error: null,
}

const profileSlice = createSlice({
	name: 'profile',
	initialState,
	reducers: {
		updateProfile(state, { payload }) {
			Object.assign(state, payload)
		},
		addPost(state, { payload }) {
			state.posts.unshift(payload)
		},
		// Follow someone (adds to following)
		followUser(state, { payload }) {
			const userId = payload
			if (!state.followingIds.includes(userId)) {
				state.followingIds.push(userId)
				state.following = state.followingIds.length
			}
		},
		// Add a follower (someone followed me)
		addFollower(state, { payload }) {
			const userId = payload
			if (!state.followersIds.includes(userId)) {
				state.followersIds.push(userId)
				state.followers = state.followersIds.length
			}
		},
		// Unfollow someone
		unfollowUser(state, { payload }) {
			const userId = payload
			if (!userId) return
			state.followingIds = state.followingIds.filter((id) => id !== userId)
			state.following = state.followingIds.length
		},
		// Remove a follower (someone unfollowed me)
		removeFollower(state, { payload }) {
			const userId = payload
			if (!userId) return
			state.followersIds = state.followersIds.filter((id) => id !== userId)
			state.followers = state.followersIds.length
		},
		// Set followers list (e.g., from server)
		setFollowersIds(state, { payload }) {
			state.followersIds = Array.isArray(payload) ? payload : []
			state.followers = state.followersIds.length
		},
		// Utility to sync counts with arrays if needed
		syncFollowCounts(state) {
			state.followers = state.followersIds.length
			state.following = state.followingIds.length
		},
		// Set profile data from backend
		setProfile(state, { payload }) {
			applyServerProfile(state, payload)
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProfile.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchProfile.fulfilled, (state, { payload }) => {
				state.loading = false
				applyServerProfile(state, payload)
			})
			.addCase(fetchProfile.rejected, (state, { payload }) => {
				state.loading = false
				state.error = payload
			})
			.addCase(updateProfileAsync.pending, (state) => {
				state.loading = true
			})
			.addCase(updateProfileAsync.fulfilled, (state, { payload }) => {
				state.loading = false
				applyServerProfile(state, payload)
			})
			.addCase(updateProfileAsync.rejected, (state, { payload }) => {
				state.loading = false
				state.error = payload
			})
	}
})

export const { updateProfile, addPost, followUser, addFollower, unfollowUser, removeFollower, setFollowersIds, syncFollowCounts, setProfile } = profileSlice.actions
export default profileSlice.reducer
