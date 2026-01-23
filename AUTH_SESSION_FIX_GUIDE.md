# LiaHub Authentication System - Session Persistence & Logout Fix

## Overview
This document details the comprehensive fixes implemented to prevent automatic logouts and ensure persistent sessions across all login roles (student, school, university, company).

## Problem Statement
Users were experiencing automatic logouts when:
- Refreshing the page
- Navigating between routes
- Performing any action that triggered an API call
- Switching browser tabs

## Root Causes Identified
1. **Improper session validation** - Sessions were being invalidated during refresh
2. **Token refresh failures** - API client wasn't properly retrying failed refreshes
3. **Insufficient error handling** - Unclear error codes and improper fallbacks
4. **No automatic token refresh** - Access tokens were expiring without renewal
5. **Session storage issues** - Auth state wasn't properly persisted to localStorage

## Implementations

### 1. Backend Token Refresh (authService.js)
**File**: `Backend/src/services/authService.js`

#### Changes:
- Added comprehensive token validation before refresh
- Implemented proper session expiry checking (`expiresAt >= new Date()`)
- Session TTL extended automatically on each refresh (15 days)
- Proper error handling with HTTP status codes and error codes
- Session is created only once, then reused and refreshed

```javascript
// Key improvements:
- Validates refresh token format and JWT signature
- Checks if user still exists and has roles
- Only accepts non-expired sessions
- Extends session TTL on each refresh
- Returns consistent payload with sessionId
```

### 2. Auth Middleware Enhancement (auth.js)
**File**: `Backend/src/middleware/auth.js`

#### Changes:
- Detailed error messages with specific error codes
- Proper token expiry detection (distinguishes from invalid tokens)
- Session expiry validation with timestamp comparison
- User status check (inactive/suspended accounts)
- Better error logging for debugging

```javascript
Error Codes:
- AUTH_HEADER_MISSING: No authorization header
- AUTH_HEADER_INVALID: Malformed Bearer token
- AUTH_TOKEN_EXPIRED: Token expired (client should refresh)
- AUTH_TOKEN_INVALID: Invalid/corrupted token
- AUTH_TOKEN_MISSING: Empty token string
- AUTH_SESSION_INVALID: Session expired or revoked
- AUTH_USER_NOT_FOUND: User deleted
- AUTH_USER_INACTIVE: Account suspended
- AUTH_NO_ROLES: User has no roles assigned
```

### 3. Auth Controller Enhancement (authController.js)
**File**: `Backend/src/controllers/authController.js`

#### Changes:
- Added field validation before service calls
- Proper HTTP status codes (400, 401, 500)
- Clear error responses with error codes
- Consistent response format

### 4. Frontend API Client (apiClient.js)
**File**: `src/lib/apiClient.js`

#### Changes:
- Improved interceptor logic with better state management
- Added 30-second timeout
- Proper queue management for pending requests during refresh
- Skip refresh for `/auth/refresh` endpoint itself
- Use separate axios instance for refresh to avoid interceptor loops
- Better error handling with specific scenarios

```javascript
Improvements:
- Validates refresh token before attempting refresh
- Skips retry if already retrying
- Queues requests during refresh
- Handles refresh endpoint failures gracefully
- Clears auth state on permanent 401 errors
```

### 5. Auth Redux Slice (authSlice.js)
**File**: `src/redux/slices/authSlice.js`

#### Changes:
- Added error code tracking (errorCode field)
- Added isAuthenticated flag for clearer state
- Added lastRefreshAttempt timestamp for debugging
- Improved localStorage persistence with versioning
- Only logout on permanent failures (401 status)
- Enhanced error payloads with structured data

```javascript
New State Fields:
- errorCode: Specific error code for UI handling
- isAuthenticated: Boolean flag for auth status
- lastRefreshAttempt: Timestamp of last refresh attempt
- STORAGE_VERSION: Versioned storage format
```

### 6. Automatic Token Refresh Hook (useAuthService.js)
**File**: `src/hooks/useAuthService.js`

#### Features:
- Proactive token refresh before expiry (2 minutes before expiry)
- Refresh interval: every 13 minutes for 15-minute tokens
- Handles visibility change (tab switch detection)
- Handles online/offline status changes
- Prevents multiple simultaneous refresh attempts

```javascript
Key Features:
- Refreshes when 2 minutes remain on access token
- Resets TTL on each refresh (keeps user logged in)
- Responds to tab visibility changes
- Handles network reconnection
- Thread-safe refresh operations
```

## Integration Guide

### Step 1: Update Main App Component
Add the useAuthService hook to your main App component:

```jsx
import { useAuthService } from '@/hooks/useAuthService'

function App() {
  // Call hook early in component tree
  useAuthService()

  return (
    // Your app routes and components
  )
}
```

### Step 2: Environment Variables
Ensure these are set in `.env.local`:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1  # Dev only
VITE_API_USE_CREDENTIALS=true
```

### Step 3: Redux Store Injection
In your store setup (likely `redux/store.js`):

```jsx
import { injectStore } from '@/lib/apiClient'
import store from '@/redux/store'

// Call after store is created
injectStore(store)
```

## Testing All Login Roles

### Test Case 1: Student Login
```
1. Login with entity: "student"
2. Navigate between pages
3. Wait for page refresh (auto-refresh happens every 13 min)
4. Perform API calls (create post, send message, etc.)
5. Verify no logout occurs
6. Close and reopen tab (verify session persists)
7. Click logout and verify clean logout
```

### Test Case 2: School Admin Login
```
1. Login with entity: "school", subRole: "admin"
2. Same tests as Student
3. Verify all school-specific features work
4. Check session persists across school-specific pages
```

### Test Case 3: University Manager Login
```
1. Login with entity: "university", subRole: "education-manager"
2. Same tests as Student
3. Verify university-specific features work
4. Check session persists across university-specific pages
```

### Test Case 4: Company Employer Login
```
1. Login with entity: "company", subRole: "employer"
2. Same tests as Student
3. Verify company-specific features work
4. Check session persists across company-specific pages
5. Test with different company roles: hiring-manager, founder, ceo
```

### Test Case 5: Cross-Entity Scenarios
```
1. Login as one entity
2. Logout
3. Login as different entity
4. Verify proper role switching
5. Test back-to-back logins
```

### Test Case 6: Edge Cases
```
1. Network interruption (disconnect then reconnect)
   - Should refresh token when connection restored
2. Tab background for extended time
   - Should refresh when tab becomes active
3. Multiple tabs open
   - Session should sync across tabs
4. Token near expiry
   - Should refresh proactively
5. Invalid refresh token
   - Should force logout with clear message
```

## Session Management Details

### Session Lifecycle
```
1. Login: Creates new session + access token (15 min) + refresh token (30 days)
2. API Call: Uses access token for authentication
3. Token Expiry Pending: Frontend detects (13 min mark)
4. Refresh Triggered: Uses refresh token to get new access token
5. Session Extended: Session expiresAt is reset to +15 days
6. Session Valid: User remains logged in
7. Logout: Session marked as revoked
```

### Session TTL Extension
- Initial TTL: 15 days from login
- Extended on each refresh: +15 days
- This means as long as user is active, session never expires
- Only expires if idle for 15+ days without refresh

### Token Expiry Timeline
```
Access Token: 15 minutes
Refresh Token: 30 days
Auto-refresh trigger: 13 minutes (2 min before expiry)
Refresh interval: Every 13 minutes (if user active)
```

## Error Handling Specification

### Frontend Error Codes
All errors from Redux have structure:
```javascript
{
  message: string,        // User-friendly message
  code: string,           // Machine-readable code
  status: number          // HTTP status if applicable
}
```

### Common Error Scenarios

#### 401 Unauthorized
```
message: "Token expired"
code: "AUTH_TOKEN_EXPIRED"
shouldRefresh: true
Action: Auto-refresh
```

#### 401 After Refresh Failure
```
message: "Session expired"
code: "AUTH_SESSION_INVALID"
Action: Force logout + redirect to login
```

#### Network Error During Refresh
```
message: "Session refresh failed"
code: "REFRESH_ERROR"
Action: Queue requests, retry on next network call
```

## localStorage Structure
```javascript
{
  version: "v1",
  user: { /* user object */ },
  accessToken: "jwt...",
  refreshToken: "jwt...",
  sessionId: "mongo_id..."
}
```

## Debugging

### Check Auth State
```javascript
// In browser console
const state = store.getState()
console.log(state.auth)
```

### Monitor Token Refresh
```javascript
// Add to useAuthService or check Redux DevTools
state.auth.lastRefreshAttempt   // Timestamp of last refresh
state.auth.isAuthenticated      // Current auth status
state.auth.errorCode            // Last error code
```

### Backend Session Logs
```bash
# Check backend logs for auth operations
# Look for refresh requests and session updates
grep "refresh" backend.log
grep "session" backend.log
```

## Rollback Plan

If issues occur:

1. **API Client Issues**: Revert apiClient.js to previous version
2. **Session Issues**: Clear localStorage and login again
3. **Middleware Issues**: Revert auth.js middleware
4. **Redux Issues**: Revert authSlice.js and clear Redux state

## Performance Considerations

- **Auto-refresh interval**: 13 minutes (minimal overhead)
- **Queue management**: Limits pending requests to prevent memory issues
- **Session checks**: Quick database lookups with indexed queries
- **localStorage**: ~1KB per user session

## Security Considerations

- Refresh tokens stored in localStorage (consider httpOnly cookies for future)
- Access tokens attached to all API requests
- Session validation on every request
- Automatic logout on 401 errors
- Session revocation on explicit logout
- User status checks (account suspension detection)

## Future Improvements

1. Implement httpOnly cookies for refresh tokens
2. Add CSRF protection
3. Implement device/fingerprinting for additional security
4. Add rate limiting on refresh endpoint
5. Implement sliding window session expiry
6. Add audit logging for auth operations

## Support & Troubleshooting

### User stays logged out after login
- Check localStorage for auth data
- Verify Redux reducer is updating state
- Check network tab for 401 responses
- Verify backend session creation

### User logs out unexpectedly
- Check lastRefreshAttempt in Redux state
- Look for 401 errors in network tab
- Verify refresh token is valid
- Check server logs for session issues

### Refresh token not working
- Clear localStorage and login again
- Check refresh token expiry date
- Verify backend refresh endpoint
- Check API client interceptors

