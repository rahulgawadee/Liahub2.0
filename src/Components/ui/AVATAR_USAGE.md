# Avatar Component Usage Guide

## Overview
The Avatar component system provides a professional, consistent way to display user profile images across the entire application. When users haven't uploaded a profile image, it automatically displays a UserCircle icon (similar to Facebook/LinkedIn).

## Key Features
- ✅ **Automatic fallback**: Shows profile icon when no image uploaded
- ✅ **Responsive scaling**: Icon scales proportionally with avatar size
- ✅ **Professional design**: Gradient background with subtle styling
- ✅ **Dark mode support**: Adapts colors for light/dark themes
- ✅ **Error handling**: Gracefully handles failed image loads
- ✅ **Zero configuration**: Works out of the box, no initials needed

## Usage

### Basic Usage
```jsx
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar'
import { getImageUrl } from '@/lib/imageUtils'

<Avatar className="h-12 w-12">
  <AvatarImage 
    src={user.avatarUrl ? getImageUrl(user.avatarUrl) : undefined} 
    alt={user.name} 
  />
  <AvatarFallback />
</Avatar>
```

### Important Rules

1. **ALWAYS use AvatarFallback without children**
   ```jsx
   ✅ Correct:
   <AvatarFallback />
   
   ❌ Wrong - DO NOT add content:
   <AvatarFallback>AB</AvatarFallback>
   <AvatarFallback className="text-lg">JD</AvatarFallback>
   ```

2. **Pass undefined when no avatar URL**
   ```jsx
   ✅ Correct:
   <AvatarImage src={user.avatarUrl ? getImageUrl(user.avatarUrl) : undefined} />
   
   ❌ Avoid empty strings or null:
   <AvatarImage src={user.avatarUrl || null} />
   ```

3. **Always include alt text for accessibility**
   ```jsx
   <AvatarImage src={avatarUrl} alt={user.name || 'User avatar'} />
   ```

### Size Variants

The Avatar automatically scales the icon based on container size:

```jsx
// Small avatar (e.g., message list)
<Avatar className="h-8 w-8">
  <AvatarImage src={avatarUrl} alt={userName} />
  <AvatarFallback />
</Avatar>

// Medium avatar (e.g., user cards)
<Avatar className="h-12 w-12">
  <AvatarImage src={avatarUrl} alt={userName} />
  <AvatarFallback />
</Avatar>

// Large avatar (e.g., profile page)
<Avatar className="h-20 w-20">
  <AvatarImage src={avatarUrl} alt={userName} />
  <AvatarFallback />
</Avatar>
```

## Component Architecture

### Avatar (Container)
- Provides context for image loading state
- Sets up rounded circular container
- Applies gradient background
- Manages size via className

### AvatarImage
- Handles image loading and error states
- Automatically triggers fallback on error
- Positioned absolutely to fill container
- Supports object-fit for proper scaling

### AvatarFallback
- Displays only when image fails or is missing
- Shows UserCircle icon at 65% of container size
- No customization needed - works automatically
- Consistent across all avatar instances

## Implementation Details

### State Management
The Avatar component tracks three states:
- `hasImage`: Whether src prop was provided
- `imageLoaded`: Whether image successfully loaded
- `imageError`: Whether image failed to load

The fallback displays when: `!hasImage || imageError`

### Styling
- **Background**: Subtle slate gradient (light: 200-300, dark: 700-800)
- **Icon size**: 65% of container (optimal visibility)
- **Icon color**: Slate-600 (light mode), Slate-400 (dark mode)
- **Stroke width**: 1.5 (clean, modern appearance)

## Where It's Used

The Avatar component is used consistently across:
- ✅ Profile pages (Profile.jsx, ProfileView.jsx)
- ✅ Message page (conversation list, chat bubbles)
- ✅ Explore page (user discovery cards)
- ✅ Network page (connections, invitations, followers)
- ✅ Post cards (author avatars, comment avatars)
- ✅ Navigation sidebar (user menu)
- ✅ Notifications (connection requests)
- ✅ Job applications (applicant cards)
- ✅ Search results (user/job listings)

## Migration from Old Pattern

If you find old avatar code with initials, update it:

### Before
```jsx
<Avatar className="h-12 w-12">
  <AvatarImage src={avatarUrl} />
  <AvatarFallback className="text-lg">
    {user.name?.split(' ').map(n => n[0]).join('')}
  </AvatarFallback>
</Avatar>
```

### After
```jsx
<Avatar className="h-12 w-12">
  <AvatarImage 
    src={avatarUrl ? getImageUrl(avatarUrl) : undefined} 
    alt={user.name} 
  />
  <AvatarFallback />
</Avatar>
```

## Troubleshooting

### Icon not appearing?
1. Verify AvatarFallback has no children: `<AvatarFallback />`
2. Check that UserCircle is imported in avatar.jsx
3. Ensure parent Avatar has proper dimensions
4. Verify lucide-react package is installed

### Icon too small/large?
The icon automatically scales to 65% of the Avatar container. Adjust the Avatar size, not the icon:
```jsx
<Avatar className="h-16 w-16"> {/* Adjust this */}
  <AvatarImage ... />
  <AvatarFallback /> {/* Don't modify this */}
</Avatar>
```

### Wrong colors?
The component uses Tailwind's slate colors with dark mode support. Ensure your Tailwind config includes slate colors and dark mode is properly configured.

## Best Practices

1. **Use getImageUrl helper** for all avatar URLs to ensure proper API paths
2. **Always pass alt text** for screen reader accessibility
3. **Don't customize AvatarFallback** - keep it consistent across the app
4. **Size avatars appropriately** based on context (smaller in lists, larger in profiles)
5. **Test in both light/dark modes** to ensure proper contrast

## Future Enhancements

Potential improvements (do not implement without discussion):
- Loading skeleton animation during image load
- Lazy loading for performance in long lists
- Custom avatar shapes (square, rounded-square)
- Status indicators (online/offline badges)
- Hover effects for interactive contexts

---

**Last Updated**: January 2026  
**Component Location**: `src/Components/ui/avatar.jsx`  
**Maintained By**: Development Team
