# Display Name Utilities Guide

## Overview
A centralized utility module (`displayNameUtils.js`) that handles consistent display of user and company names throughout the application.

## Main Functions

### `getDisplayNameWithSubtitle(user)`
**Returns:** `{ displayName, subtitle, isCompanyUser }`

Comprehensive function that returns both display name and subtitle for a user.

#### For Company Users:
- **displayName**: Company name (e.g., "Acme Corp")
- **subtitle**: Contact person name (e.g., "Rahul Gawade")
- **isCompanyUser**: `true`

#### For Individual Users:
- **displayName**: Person name (e.g., "Rahul Gawade")
- **subtitle**: Title, specialization, or bio (or null)
- **isCompanyUser**: `false`

#### Example Usage:
```javascript
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'

const { displayName, subtitle, isCompanyUser } = getDisplayNameWithSubtitle(user)

// Display:
<h4>{displayName}</h4>
{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
```

### `getDisplayName(user)`
**Returns:** `string`

Shorthand to get just the display name.

```javascript
const name = getDisplayName(user)
// Returns: "Acme Corp" or "Rahul Gawade"
```

### `getSubtitle(user)`
**Returns:** `string | null`

Shorthand to get just the subtitle.

```javascript
const subtitle = getSubtitle(user)
// Returns: "Rahul Gawade" (for company) or "Senior Developer" (for individual)
```

### `isCompanyUser(user)`
**Returns:** `boolean`

Check if a user is a company account.

```javascript
if (isCompanyUser(user)) {
  // Handle company-specific logic
}
```

## Data Structure Expectations

### Company User Object:
```javascript
{
  name: { first: "Rahul", last: "Gawade" },
  username: "rahul.gawade",
  roles: ["company_employer"],
  companyProfile: {
    companyName: "Acme Corp",
    contactPerson: "Rahul Gawade" // Optional
  }
}
```

### Individual User Object:
```javascript
{
  name: { first: "Rahul", last: "Gawade" },
  username: "rahul.gawade",
  roles: ["student"],
  title: "Senior Developer",
  studentProfile: {
    specializations: ["Web Development"]
  }
}
```

## Company Roles Detected:
- `company_employer`
- `company_hiring_manager`
- `company_founder`
- `company_ceo`

## Components Updated to Use This Utility:
1. ✅ `src/Components/sidebar/nav-user.jsx` - Sidebar user info
2. ✅ `src/Components/social/UserCard.jsx` - Network/Explore cards
3. ✅ `src/Components/social/EmployerCard.jsx` - Employer cards
4. ✅ `src/Components/social/PostCard.jsx` - Post author display
5. ✅ `src/Components/profile/ProfileStats.jsx` - Follower/Following lists
6. ✅ `src/Pages/Message.jsx` - Message conversations
7. ✅ `src/Pages/Notifications.jsx` - Connection requests & notifications

## Benefits:
- **Single Source of Truth**: All display logic in one place
- **Consistency**: Same format everywhere (Company Name + Contact Person)
- **Maintainability**: Easy to update display logic across entire app
- **Type Safety**: Clear return types and expectations
- **Flexibility**: Works with any user data structure that has name, roles, or companyProfile

## Example Integration:

```javascript
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'

function MyComponent({ user }) {
  const { displayName, subtitle } = getDisplayNameWithSubtitle(user)
  
  return (
    <div>
      <h4 className="font-semibold">{displayName}</h4>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
```
