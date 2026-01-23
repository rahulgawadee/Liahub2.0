# Authentication System Testing Checklist

## Quick Start Testing (5 minutes)
- [ ] Login as Student
- [ ] Refresh page - should stay logged in
- [ ] Click logout button - should log out
- [ ] Login as different role
- [ ] Verify correct dashboard loads

## Comprehensive Testing by Role

### Student Role Tests
- [ ] Login with student credentials
- [ ] Navigate to different pages (/feed, /jobs, /explore)
- [ ] Create a post or perform an action
- [ ] Refresh page - session should persist
- [ ] Open DevTools Network tab
- [ ] Check that refresh token is saved in localStorage
- [ ] Wait 1 minute - check for automatic token refresh in Network tab
- [ ] Close and reopen browser tab - should still be logged in
- [ ] Open multiple tabs - verify session syncs
- [ ] Logout - verify complete logout

### School Role Tests
- [ ] Login with: entity="school", subRole="admin"
- [ ] Verify school dashboard loads
- [ ] Perform school-specific actions
- [ ] Test all school admin features
- [ ] Refresh page - should persist
- [ ] Try subRole="education-manager" - should work
- [ ] Try subRole="teacher" - should work
- [ ] Verify role-specific permissions

### University Role Tests
- [ ] Login with: entity="university", subRole="education-manager"
- [ ] Verify university dashboard loads
- [ ] Perform university-specific actions
- [ ] Test all university features
- [ ] Refresh page - should persist
- [ ] Try subRole="study-counsellor" - should work
- [ ] Try subRole="professor" - should work
- [ ] Try subRole="asst-professor" - should work
- [ ] Try subRole="junior-researcher" - should work
- [ ] Verify role-specific permissions

### Company Role Tests
- [ ] Login with: entity="company", subRole="employer"
- [ ] Verify company dashboard loads
- [ ] Perform company-specific actions (post job, etc.)
- [ ] Refresh page - should persist
- [ ] Try subRole="hiring-manager" - should work
- [ ] Try subRole="founder" - should work
- [ ] Try subRole="ceo" - should work
- [ ] Verify role-specific permissions
- [ ] Test job posting features
- [ ] Test hiring features

## Advanced Testing Scenarios

### Token Refresh Testing
1. **Automatic Refresh**
   - [ ] Monitor Network tab in DevTools
   - [ ] Look for POST requests to `/auth/refresh`
   - [ ] Should happen approximately every 13 minutes
   - [ ] Page should remain functional during refresh
   
2. **Manual Refresh Trigger**
   - [ ] Open DevTools Console
   - [ ] Wait for automatic refresh
   - [ ] Verify Redux state updates: `store.getState().auth`
   - [ ] Check lastRefreshAttempt timestamp updates

3. **Expired Token Scenario**
   - [ ] Wait longer than access token expiry (15 min)
   - [ ] Make an API call
   - [ ] System should automatically refresh token
   - [ ] API call should succeed after refresh

### Error Handling Tests

1. **401 Unauthorized**
   - [ ] Manually delete access token: `localStorage.removeItem('liahub_auth')`
   - [ ] Try to make API call
   - [ ] Should redirect to login
   - [ ] Error message should be clear

2. **Invalid Refresh Token**
   - [ ] Manually corrupt refresh token in localStorage
   - [ ] Try to trigger refresh
   - [ ] Should logout with clear error
   - [ ] localStorage should be cleared
   - [ ] Redirect to login

3. **Network Error During Refresh**
   - [ ] Turn off internet connection
   - [ ] Wait for automatic refresh attempt
   - [ ] System should queue requests
   - [ ] Turn internet back on
   - [ ] Requests should retry automatically
   - [ ] Session should persist

### Session Persistence Tests

1. **localStorage Verification**
   - [ ] Login
   - [ ] Check localStorage: `localStorage.getItem('liahub_auth')`
   - [ ] Verify structure:
     ```
     {
       version: "v1",
       user: {...},
       accessToken: "...",
       refreshToken: "...",
       sessionId: "..."
     }
     ```
   - [ ] Close browser completely
   - [ ] Reopen - should be logged in
   - [ ] Check Redux state: `store.getState().auth`

2. **Multiple Tabs**
   - [ ] Login in Tab 1
   - [ ] Open new tab (Tab 2)
   - [ ] Visit app in Tab 2
   - [ ] Should be logged in
   - [ ] Both tabs should have same session
   - [ ] Logout in Tab 1
   - [ ] Tab 2 should be logged out after refresh

3. **Tab Visibility**
   - [ ] Login and minimize browser
   - [ ] Wait for several minutes
   - [ ] Click on browser tab
   - [ ] Token should refresh automatically
   - [ ] App should be responsive

### Cross-Role Testing

1. **Role Switching**
   - [ ] Login as Student
   - [ ] Logout
   - [ ] Login as School Admin
   - [ ] Verify school dashboard
   - [ ] Logout
   - [ ] Login as Company CEO
   - [ ] Verify company dashboard

2. **Different SubRoles**
   - [ ] Test all school subRoles
   - [ ] Test all university subRoles
   - [ ] Test all company subRoles
   - [ ] Verify permissions differ correctly

## Redux State Verification

Check these in DevTools or Console:

```javascript
// After login
store.getState().auth
{
  user: { /* user object */ },
  accessToken: "jwt...",
  refreshToken: "jwt...",
  sessionId: "mongo_id...",
  isAuthenticated: true,
  error: null,
  errorCode: null,
  loading: false,
  lastRefreshAttempt: "2026-01-18T..."
}

// After auto-refresh
// lastRefreshAttempt should update
// accessToken should be new
// user should remain same (or updated)

// After logout
{
  user: null,
  accessToken: null,
  refreshToken: null,
  sessionId: null,
  isAuthenticated: false,
  error: null,
  errorCode: null,
  loading: false,
  lastRefreshAttempt: null
}
```

## Network Tab Verification

1. **Login Request**
   - [ ] POST `/auth/login`
   - [ ] Status: 200
   - [ ] Response includes: accessToken, refreshToken, user, sessionId

2. **Refresh Request**
   - [ ] POST `/auth/refresh`
   - [ ] Sent approximately every 13 minutes
   - [ ] Status: 200
   - [ ] Response includes: accessToken, refreshToken, user

3. **Protected Requests**
   - [ ] All requests have `Authorization: Bearer {accessToken}`
   - [ ] If 401 received:
     - [ ] Auto-refresh triggered
     - [ ] Request queued and retried
     - [ ] Should succeed after refresh

## Logout Testing

1. **Explicit Logout**
   - [ ] Click logout button
   - [ ] POST `/auth/logout` sent
   - [ ] Redirected to login
   - [ ] localStorage cleared
   - [ ] Redux state cleared
   - [ ] Cannot access protected routes

2. **Forced Logout (401)**
   - [ ] Manually expire/revoke session on backend
   - [ ] Make API call
   - [ ] Receive 401 with code "AUTH_SESSION_INVALID"
   - [ ] Automatically redirected to login
   - [ ] Cannot retry

## Browser Compatibility

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Browser

## Performance Checks

1. **Auto-Refresh Overhead**
   - [ ] No noticeable lag during refresh
   - [ ] CPU usage reasonable
   - [ ] Memory usage stable

2. **localStorage Size**
   - [ ] Check size: ~1KB
   - [ ] No memory leaks
   - [ ] Storage cleared on logout

## Security Checks

1. **Token Storage**
   - [ ] Tokens stored in localStorage (current implementation)
   - [ ] Tokens not logged to console (unless debugging)
   - [ ] Tokens not sent in URL parameters

2. **Session Validation**
   - [ ] Session checked on backend for each request
   - [ ] Expired sessions rejected
   - [ ] Revoked sessions rejected
   - [ ] User status checked (suspended accounts)

3. **XSS Prevention**
   - [ ] No tokens in HTML attributes
   - [ ] No user data in HTML attributes

## Debug Mode Instructions

To enable verbose logging:

1. **Frontend Debugging**
   ```javascript
   // In browser console
   localStorage.setItem('DEBUG_AUTH', 'true')
   // Then refresh page
   // Log messages will appear for all auth operations
   ```

2. **Redux DevTools**
   - [ ] Install Redux DevTools extension
   - [ ] Open DevTools -> Redux
   - [ ] Watch auth actions: login, tokenRefreshed, logout, refreshSession
   - [ ] Check payload and state changes

3. **Network Debugging**
   - [ ] Open DevTools -> Network tab
   - [ ] Filter by XHR/Fetch
   - [ ] Watch `/auth/` requests
   - [ ] Check request/response headers and payloads

## Bug Report Template

If issues found, collect:
- [ ] Browser and version
- [ ] Exact steps to reproduce
- [ ] Screenshots/video
- [ ] Network tab HAR file
- [ ] Console errors
- [ ] Redux state at time of error
- [ ] localStorage contents
- [ ] Backend logs
- [ ] User role/entity/subRole

## Sign-off Checklist

- [ ] All student role tests pass
- [ ] All school role tests pass
- [ ] All university role tests pass
- [ ] All company role tests pass
- [ ] Token refresh working automatically
- [ ] Session persists across page refresh
- [ ] Session persists across browser restart
- [ ] Logout works cleanly
- [ ] Error handling working
- [ ] Performance acceptable
- [ ] No memory leaks
- [ ] No console errors
- [ ] Tested on multiple browsers

