import React, { useEffect, useState } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'

import { store, selectAuth } from './redux/store'
import { useAuthService } from './hooks/useAuthService'
import { receiveRealtimeMessage } from './redux/slices/messagesSlice'
import { connectSocket, disconnectSocket } from './lib/socketClient'
import ContractGuard from './Components/shared/ContractGuard'

import Login from './Pages/Login'
import Register from './Pages/Register'
import Homepage from './Pages/Homepage'
import Lia from './Pages/Lia'
import Explore from './Pages/Explore'
import Jobs from './Pages/Jobs'
import Documents from './Pages/Documents'
import Network from './Pages/Network'
import Notifications from './Pages/Notifications'
import Message from './Pages/Message'
import Privacy from './Pages/Privacy'
import Settings from './Pages/Settings'
import Verified from './Pages/Verified'
import Profile from './Pages/Profile'
import Feed from './Pages/Feed'
import StudentDashboard from './Pages/Student/Dashboard'
import SchoolDashboard from './Pages/School/Dashboard'
import UniversitiesDashboard from './Pages/Universities/Dashboard'
import CompanyHome from './Pages/Company/CompanyHome'
import ProfileView from './Pages/ProfileView'
import Contracts from './Pages/Contracts'

function ProtectedLayout() {
  const dispatch = useDispatch()
  const { user, accessToken, refreshToken, loading } = useSelector(selectAuth)
  const [attemptedRefresh, setAttemptedRefresh] = useState(false)

  // Initialize auth service for automatic token refresh
  useAuthService()

  useEffect(() => {
    if (!accessToken && refreshToken && !attemptedRefresh) {
      // Attempt to refresh token if we have a refresh token but no access token
      const { refreshSession } = require('./redux/slices/authSlice')
      dispatch(refreshSession(refreshToken)).finally(() => setAttemptedRefresh(true))
    } else if (!refreshToken) {
      setAttemptedRefresh(true)
    }
  }, [accessToken, refreshToken, attemptedRefresh, dispatch])

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket()
      return undefined
    }

    const socket = connectSocket(accessToken)
    if (!socket) return undefined

    const handleNewMessage = (payload) => {
      if (!payload) return
      dispatch(
        receiveRealtimeMessage({
          ...payload,
          currentUserId: user?.id,
        }),
      )
    }

    const handleConnectError = (error) => {
      console.warn('Socket connection error', error)
    }

    socket.on('message:new', handleNewMessage)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('connect_error', handleConnectError)
    }
  }, [accessToken, dispatch, user?.id])

  if (!accessToken && !user && attemptedRefresh && !loading) {
    return <Navigate to="/login" replace />
  }
  return (
    <ContractGuard>
      <Outlet />
    </ContractGuard>
  )
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/lia" element={<Lia />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/network" element={<Network />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/message" element={<Message />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/verified" element={<Verified />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:section" element={<Profile />} />
            <Route path="/view/profile/:id" element={<ProfileView />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/school" element={<SchoolDashboard />} />
            <Route path="/universities" element={<UniversitiesDashboard />} />
            <Route path="/company" element={<CompanyHome />} />
          </Route>

          <Route path="*" element={<Navigate to="/lia" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
