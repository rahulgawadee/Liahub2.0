import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { selectProfile, selectAuth } from '@/redux/store'
import { followUser, unfollowUser } from '@/redux/slices/profileSlice'
import { setActiveChat } from '@/redux/slices/messagesSlice'
import { getImageUrl } from '@/lib/imageUtils'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import api from '@/lib/apiClient'
import { Loader2, UserPlus, MessageCircle, UserMinus, Users } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'

export default function ProfileStats(){
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const { user } = useSelector(selectAuth)
	const { followers, following } = useSelector(selectProfile)
	const [openFollowers, setOpenFollowers] = useState(false)
	const [openFollowing, setOpenFollowing] = useState(false)
	const [followerUsers, setFollowerUsers] = useState([])
	const [followingUsers, setFollowingUsers] = useState([])
	const [loadingFollowers, setLoadingFollowers] = useState(false)
	const [loadingFollowing, setLoadingFollowing] = useState(false)
	const [followingStates, setFollowingStates] = useState({}) // Track who current user is following

	// Fetch followers when modal opens
	useEffect(() => {
		if (openFollowers && user?.id) {
			fetchFollowers()
		}
	}, [openFollowers, user?.id])

	// Fetch following when modal opens
	useEffect(() => {
		if (openFollowing && user?.id) {
			fetchFollowing()
		}
	}, [openFollowing, user?.id])

	const fetchFollowers = async () => {
		if (!user?.id) return
		setLoadingFollowers(true)
		try {
			const response = await api.get(`/users/${user.id}/followers?limit=100`)
			const data = response.data
			console.log('👥 Followers data:', data)
			setFollowerUsers(data.items || [])
			
			// Check which followers the current user is following back
			const followingMap = {}
			for (const follower of (data.items || [])) {
				try {
					const profileResponse = await api.get(`/users/${follower.id || follower._id}`)
					followingMap[follower.id || follower._id] = profileResponse.data.isFollowing || false
				} catch (error) {
					console.error('Error checking follow status:', error)
				}
			}
			setFollowingStates(followingMap)
		} catch (error) {
			console.error('Failed to fetch followers:', error)
			setFollowerUsers([])
		} finally {
			setLoadingFollowers(false)
		}
	}

	const fetchFollowing = async () => {
		if (!user?.id) return
		setLoadingFollowing(true)
		try {
			const response = await api.get(`/users/${user.id}/following?limit=100`)
			const data = response.data
			console.log('👥 Following data:', data)
			setFollowingUsers(data.items || [])
		} catch (error) {
			console.error('Failed to fetch following:', error)
			setFollowingUsers([])
		} finally {
			setLoadingFollowing(false)
		}
	}

	const handleFollowToggle = async (targetUserId, currentlyFollowing) => {
		try {
			if (currentlyFollowing) {
				// Unfollow
				await api.delete(`/users/${targetUserId}/follow`)
				setFollowingStates(prev => ({ ...prev, [targetUserId]: false }))
				dispatch(unfollowUser(targetUserId))
			} else {
				// Follow
				await api.post(`/users/${targetUserId}/follow`)
				setFollowingStates(prev => ({ ...prev, [targetUserId]: true }))
				dispatch(followUser(targetUserId))
			}
			// Refresh the list
			if (openFollowers) fetchFollowers()
		} catch (error) {
			console.error('Failed to toggle follow:', error)
		}
	}

	const handleUnfollow = async (targetUserId) => {
		try {
			await api.delete(`/users/${targetUserId}/follow`)
			dispatch(unfollowUser(targetUserId))
			// Refresh the list
			if (openFollowing) fetchFollowing()
		} catch (error) {
			console.error('Failed to unfollow:', error)
		}
	}

	const onMessage = (targetUserId) => { 
		dispatch(setActiveChat(targetUserId))
		navigate('/message')
	}

	const getUserName = (user) => {
		const { displayName } = getDisplayNameWithSubtitle(user)
		return displayName
	}

	const getUserTitle = (user) => {
		const { subtitle } = getDisplayNameWithSubtitle(user)
		return subtitle
	}

	return (
		<>
			<div className="flex gap-4 text-sm">
				<button 
					className="hover:underline transition-colors" 
					onClick={()=>setOpenFollowing(true)}
				>
					<span className="font-semibold">{following}</span>{' '}
					<span className="opacity-70">Following</span>
				</button>
				<button 
					className="hover:underline transition-colors" 
					onClick={()=>setOpenFollowers(true)}
				>
					<span className="font-semibold">{followers}</span>{' '}
					<span className="opacity-70">Followers</span>
				</button>
			</div>

			{/* Followers Modal */}
			{openFollowers && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setOpenFollowers(false)}></div>
					<div className="relative z-10 w-full max-w-lg rounded-xl bg-card shadow-lg border">
						<div className="flex items-center justify-between p-4 border-b">
							<div className="flex items-center gap-2">
								<Users className="size-5" />
								<h3 className="font-semibold text-lg">Followers</h3>
								<span className="text-sm text-muted-foreground">({followers})</span>
							</div>
							<button 
								className="text-sm text-muted-foreground hover:text-foreground transition-colors" 
								onClick={()=>setOpenFollowers(false)}
							>
								✕
							</button>
						</div>
						
						<div className="max-h-[60vh] overflow-y-auto p-4">
							{loadingFollowers ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="size-8 animate-spin text-primary" />
								</div>
							) : followerUsers.length === 0 ? (
								<div className="text-center py-12">
									<Users className="size-12 mx-auto mb-3 text-muted-foreground opacity-50" />
									<p className="text-sm text-muted-foreground">No followers yet.</p>
								</div>
							) : (
								<div className="space-y-3">
									{followerUsers.map(follower => {
										const userId = follower.id || follower._id
										const isFollowing = followingStates[userId]
										const name = getUserName(follower)
										const title = getUserTitle(follower)
										
										return (
											<div key={userId} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors border">
												<div className="flex items-center gap-3 min-w-0 flex-1">
													<Avatar className="h-12 w-12 border-2 border-background">
														<AvatarImage src={getImageUrl(follower.media?.avatar)} alt={name} />
													<AvatarFallback />
													</Avatar>
													<div className="min-w-0 flex-1">
														<div className="text-sm font-semibold truncate">{name}</div>
														<div className="text-xs text-muted-foreground truncate">{title}</div>
													</div>
												</div>
												<div className="flex items-center gap-2 ml-2">
													{isFollowing ? (
														<Button 
															size="sm" 
															variant="outline"
															onClick={() => handleFollowToggle(userId, true)}
														>
															<UserMinus className="size-3 mr-1" />
															Unfollow
														</Button>
													) : (
														<Button 
															size="sm" 
															variant="default"
															onClick={() => handleFollowToggle(userId, false)}
														>
															<UserPlus className="size-3 mr-1" />
															Follow Back
														</Button>
													)}
													<Button 
														size="sm" 
														variant="secondary"
														onClick={() => onMessage(userId)}
													>
														<MessageCircle className="size-3 mr-1" />
														Message
													</Button>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Following Modal */}
			{openFollowing && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setOpenFollowing(false)}></div>
					<div className="relative z-10 w-full max-w-lg rounded-xl bg-card shadow-lg border">
						<div className="flex items-center justify-between p-4 border-b">
							<div className="flex items-center gap-2">
								<Users className="size-5" />
								<h3 className="font-semibold text-lg">Following</h3>
								<span className="text-sm text-muted-foreground">({following})</span>
							</div>
							<button 
								className="text-sm text-muted-foreground hover:text-foreground transition-colors" 
								onClick={()=>setOpenFollowing(false)}
							>
								✕
							</button>
						</div>
						
						<div className="max-h-[60vh] overflow-y-auto p-4">
							{loadingFollowing ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="size-8 animate-spin text-primary" />
								</div>
							) : followingUsers.length === 0 ? (
								<div className="text-center py-12">
									<Users className="size-12 mx-auto mb-3 text-muted-foreground opacity-50" />
									<p className="text-sm text-muted-foreground">Not following anyone yet.</p>
								</div>
							) : (
								<div className="space-y-3">
									{followingUsers.map(followedUser => {
										const userId = followedUser.id || followedUser._id
										const name = getUserName(followedUser)
										const title = getUserTitle(followedUser)
										
										return (
											<div key={userId} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors border">
												<div className="flex items-center gap-3 min-w-0 flex-1">
													<Avatar className="h-12 w-12 border-2 border-background">
														<AvatarImage src={getImageUrl(followedUser.media?.avatar)} alt={name} />
													<AvatarFallback />
													</Avatar>
													<div className="min-w-0 flex-1">
														<div className="text-sm font-semibold truncate">{name}</div>
														<div className="text-xs text-muted-foreground truncate">{title}</div>
													</div>
												</div>
												<div className="flex items-center gap-2 ml-2">
													<Button 
														size="sm" 
														variant="outline"
														onClick={() => handleUnfollow(userId)}
													>
														<UserMinus className="size-3 mr-1" />
														Unfollow
													</Button>
													<Button 
														size="sm" 
														variant="secondary"
														onClick={() => onMessage(userId)}
													>
														<MessageCircle className="size-3 mr-1" />
														Message
													</Button>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	)
}
