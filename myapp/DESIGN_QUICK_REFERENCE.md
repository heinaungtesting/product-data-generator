# Design System Quick Reference
## MyApp Design System 2.0

A quick reference guide for developers implementing the design system.

---

## Color Usage

### Primary Actions
```jsx
// Primary button, main CTAs
className="bg-gradient-brand text-white shadow-brand"

// Secondary actions
className="bg-white border-2 border-brand-200 text-brand-700"

// Ghost/tertiary actions
className="bg-transparent text-slate-700 hover:bg-slate-100"
```

### Status Colors
```jsx
// Success states
className="bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-800"

// Warning states
className="bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-800"

// Error states
className="bg-gradient-to-br from-red-50 to-rose-50 text-red-800"

// Info states
className="bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-800"
```

### Category Colors
```jsx
// Health products
className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700"

// Cosmetic products
className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700"

// Points/rewards
className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700"
```

---

## Component Classes

### Cards
```jsx
// Base card
className="card"
// → rounded-4xl bg-white/95 border shadow-soft-lg

// Interactive card (hoverable)
className="card-interactive"
// → card + hover:-translate-y-1 hover:shadow-brand-lg

// Glass card
className="glass-strong rounded-4xl p-6"
// → frosted glass effect with blur
```

### Buttons
```jsx
// Primary button
className="btn-primary"
// → Full gradient, white text, brand shadow

// Secondary button
className="btn-secondary"
// → White bg, brand border, hover effects

// Ghost button
className="btn-ghost"
// → Transparent, hover bg

// Danger button
className="rounded-full px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-accent"
```

### Inputs
```jsx
// Text input
className="input-field"
// → Rounded, bordered, focus ring

// Search input with icon
<div className="relative group">
  <input className="input-field h-16 pr-14" />
  <div className="absolute right-5 top-1/2 -translate-y-1/2">
    {/* Icon */}
  </div>
</div>
```

### Badges
```jsx
// Base badge
className="badge px-3 py-1.5 bg-gradient-to-r from-brand-100 to-accent-100 text-brand-700"

// Category badge
className="badge bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700"
```

---

## Animations

### Entrance Animations
```jsx
// Fade in
className="animate-fade-in"

// Slide up from bottom
className="animate-slide-up"

// Slide down from top
className="animate-slide-down"

// Scale in (zoom)
className="animate-scale-in"
// With delay:
className="animate-scale-in" style={{ animationDelay: '0.1s' }}
```

### Interactive Animations
```jsx
// Hover lift
className="hover-lift"
// → hover:-translate-y-1

// Floating element
className="animate-float"
// → gentle up/down motion

// Glow pulse
className="animate-glow-pulse"
// → opacity pulsing

// Loading spinner
className="animate-spin"
```

### Staggered Lists
```jsx
{items.map((item, index) => (
  <div
    key={item.id}
    className="animate-scale-in"
    style={{ animationDelay: `${index * 0.05}s` }}
  >
    {/* Content */}
  </div>
))}
```

---

## Spacing Patterns

### Card Padding
```jsx
// Small card
className="p-4"  // 16px

// Medium card
className="p-5"  // 20px

// Large card
className="p-6"  // 24px

// Hero card
className="p-8"  // 32px
```

### Section Spacing
```jsx
// Between sections
className="space-y-7"  // 28px vertical

// Between related items
className="space-y-4"  // 16px vertical

// Between form fields
className="space-y-3"  // 12px vertical

// Horizontal spacing
className="gap-4"  // 16px gap in flex/grid
```

### Container Margins
```jsx
// Page top margin (after TopBar)
className="mt-8"  // 32px

// Section margins
className="mb-6"  // 24px
```

---

## Typography

### Headings
```jsx
// Page title (H1)
className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight"

// Section title (H2)
className="text-2xl font-black text-slate-900 tracking-tight"

// Card title (H3)
className="text-xl font-black text-slate-900 leading-tight tracking-tight"

// Subsection (H4)
className="text-lg font-bold text-slate-900"
```

### Body Text
```jsx
// Large body
className="text-base text-slate-700 leading-relaxed"

// Standard body
className="text-sm text-slate-600"

// Small text
className="text-xs text-slate-500"

// Micro text
className="text-2xs text-slate-400"
```

### Special Text
```jsx
// Gradient text
className="text-gradient"
// → bg-clip-text text-transparent bg-gradient-to-r

// Uppercase label
className="text-xs font-black uppercase tracking-[0.3em] text-brand-600"

// Bold emphasis
className="font-bold text-slate-900"
```

---

## Icons & Emojis

### Icon Containers
```jsx
// Small icon (navigation)
<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-brand shadow-brand">
  <span className="text-lg">🏠</span>
</div>

// Medium icon (section headers)
<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand shadow-brand">
  <span className="text-2xl">⚙️</span>
</div>

// Large icon (hero sections)
<div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-brand shadow-brand-lg">
  <span className="text-4xl">📦</span>
</div>
```

### Recommended Icons
```
🏠 Home
📋 Log/List
📅 Calendar
⚙️ Settings
🔍 Search
💊 Health
💄 Cosmetic
⭐ Points/Rating
📝 Notes/Edit
🗑️ Delete
✓ Success
❌ Error
↻ Sync/Refresh
📦 Product/Package
💡 Info/Tip
⚠️ Warning
✨ Effects/Features
🔄 Auto-sync
📳 Haptic
💾 Data
💼 Backup
🎨 Appearance
```

---

## Layouts

### Page Container
```jsx
<AppShell>
  <div className="space-y-7">
    {/* Sections */}
  </div>
</AppShell>
```

### Grid Layouts
```jsx
// Product grid (responsive)
className="grid gap-6 sm:grid-cols-2"

// Stats grid
className="grid grid-cols-2 gap-4"

// Settings grid
className="grid gap-4 sm:grid-cols-2"
```

### Flex Layouts
```jsx
// Horizontal with gap
className="flex items-center gap-4"

// Space between
className="flex items-center justify-between"

// Wrap
className="flex flex-wrap gap-2"

// Vertical stack
className="flex flex-col gap-4"
```

---

## Interactive States

### Hover
```jsx
// Scale on hover
className="hover:scale-105"

// Lift on hover
className="hover:-translate-y-1"

// Shadow enhancement
className="hover:shadow-brand-lg"

// Background change
className="hover:bg-brand-50"
```

### Active/Pressed
```jsx
// Scale down
className="active:scale-95"

// Scale specific
className="active:scale-[0.98]"
```

### Focus
```jsx
// Focus ring (accessibility)
className="focus-ring"
// → focus-visible:ring-4 focus-visible:ring-brand-500/20

// Focus outline
className="focus:outline-none focus:border-brand-500"
```

### Disabled
```jsx
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

---

## Common Patterns

### Loading State
```jsx
// Skeleton card
<div className="card rounded-4xl p-5 animate-pulse">
  <div className="h-20 rounded-3xl skeleton" />
  <div className="mt-4 space-y-3">
    <div className="h-5 rounded-full skeleton" />
    <div className="h-4 w-3/4 rounded-full skeleton" />
  </div>
</div>

// Spinner
<span className="inline-block animate-spin">↻</span>
```

### Empty States
```jsx
<div className="card rounded-5xl p-12 text-center border-2 border-dashed border-brand-200 bg-gradient-brand-subtle">
  <div className="mb-6 text-7xl animate-float">📦</div>
  <h2 className="text-2xl font-bold text-slate-900">Title</h2>
  <p className="mt-4 text-base text-slate-600 max-w-md mx-auto">
    Description text
  </p>
</div>
```

### Success/Error Messages
```jsx
// Success
<div className="card rounded-3xl px-5 py-4 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 animate-slide-down">
  <div className="flex items-center gap-3">
    <span className="text-2xl">✅</span>
    <p className="text-sm font-bold text-emerald-800">Success message</p>
  </div>
</div>

// Error
<div className="card rounded-3xl px-5 py-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200 animate-slide-down">
  <div className="flex items-center gap-3">
    <span className="text-2xl">❌</span>
    <p className="text-sm font-bold text-red-800">Error message</p>
  </div>
</div>
```

### Toggle Switch
```jsx
<button
  className={`relative h-8 w-14 rounded-full transition-all duration-300 ${
    isOn ? 'bg-gradient-brand' : 'bg-slate-200'
  }`}
>
  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-soft transition-all ${
    isOn ? 'translate-x-7' : 'translate-x-1'
  }`} />
</button>
```

### Expandable Section
```jsx
const [isExpanded, setIsExpanded] = useState(false);

<button
  onClick={() => setIsExpanded(!isExpanded)}
  className="flex items-center gap-2"
>
  <span>Show Details</span>
  <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
    {/* Down arrow */}
  </svg>
</button>

{isExpanded && (
  <div className="animate-slide-down">
    {/* Content */}
  </div>
)}
```

---

## Responsive Design

### Breakpoint Usage
```jsx
// Mobile first, then sm+
className="text-base sm:text-lg"

// Hide on mobile
className="hidden sm:block"

// Show only on mobile
className="sm:hidden"

// Grid responsive
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Flex responsive
className="flex flex-col sm:flex-row"
```

### Safe Areas (iOS)
```jsx
// Padding with safe areas
className="pb-safe pt-safe"

// Specific safe area
className="safe-bottom"  // max(1rem, safe-area-inset-bottom)
```

---

## Accessibility

### Required Patterns
```jsx
// Focus ring on all interactive elements
className="focus-ring"

// ARIA labels for icon buttons
<button aria-label="Delete product">
  <span>🗑️</span>
</button>

// ARIA pressed for toggles
<button aria-pressed={isActive}>
  Toggle
</button>

// Alt text for images
<img src="..." alt="Product name" />

// Semantic HTML
<article>
  <h3>Title</h3>
  <p>Content</p>
</article>
```

---

## Best Practices

### Do's ✅
- Use semantic HTML elements
- Add focus-ring to all interactive elements
- Use staggered animations for lists
- Implement loading states
- Show clear error messages
- Use haptic feedback on mobile
- Test with keyboard navigation
- Provide ARIA labels

### Don'ts ❌
- Don't use color alone to convey information
- Don't animate if prefers-reduced-motion
- Don't make touch targets smaller than 44x44px
- Don't use low contrast text
- Don't remove focus indicators
- Don't use infinite loops without pause
- Don't auto-play videos with sound
- Don't rely only on hover states

---

## Performance Tips

### Optimize Animations
```jsx
// Use transform instead of position
className="hover:-translate-y-1"  // ✅
className="hover:top-[-4px]"      // ❌

// Use opacity instead of visibility
className="opacity-0"              // ✅
className="hidden"                 // ❌ (for animations)
```

### Reduce Reflows
```jsx
// Fixed dimensions when possible
className="h-14 w-14"

// Avoid layout shifts
className="aspect-[4/3]"
```

### Lazy Load
```jsx
// Stagger animations
style={{ animationDelay: `${index * 0.05}s` }}

// Load images lazily
<img loading="lazy" src="..." />
```

---

## Quick Checklist

Before committing new UI:

- [ ] All interactive elements have focus-ring
- [ ] Colors meet WCAG AAA contrast (7:1)
- [ ] Touch targets are minimum 44x44px
- [ ] Animations respect prefers-reduced-motion
- [ ] Loading states are implemented
- [ ] Error states are handled
- [ ] Mobile responsive (test 320px+)
- [ ] Keyboard accessible
- [ ] ARIA labels on icon-only buttons
- [ ] Semantic HTML used
- [ ] Safe area insets for iOS
- [ ] Haptic feedback where appropriate

---

**Quick Reference Version:** 2.0
**Last Updated:** November 15, 2025
