import { configureStore } from '@reduxjs/toolkit'
import { injectStore } from '@/lib/apiClient'
import authReducer from './slices/authSlice'
import profileReducer from './slices/profileSlice'
import tableReducer from './slices/tableSlice'
import usersReducer from './slices/usersSlice'
import connectionsReducer from './slices/connectionsSlice'
import notificationsReducer from './slices/notificationsSlice'
import messagesReducer from './slices/messagesSlice'
import jobsReducer from './slices/jobsSlice'
import internshipsReducer from './slices/internshipsSlice'
import applicationsReducer from './slices/applicationsSlice'
import liaApplicationsReducer from './slices/lia/liaApplicationsSlice'
import themeReducer from './slices/themeSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    table: tableReducer,
    jobs: jobsReducer,
    internships: internshipsReducer,
    applications: applicationsReducer,
    liaApplications: liaApplicationsReducer,
    users: usersReducer,
    connections: connectionsReducer,
    notifications: notificationsReducer,
    messages: messagesReducer,
    theme: themeReducer,
  },
})

injectStore(store)

export const selectAuth = (state) => state.auth
export const selectProfile = (state) => state.profile
export const selectTable = (state) => state.table
export const selectJobsState = (state) => state.jobs
export const selectInternshipsState = (state) => state.internships
export const selectApplicationsState = (state) => state.applications
export const selectUsersState = (state) => state.users
export const selectConnections = (state) => state.connections
export const selectNotifications = (state) => state.notifications
export const selectMessages = (state) => state.messages
