# Visual Quality Reference

Consolidated guide for visual QA analysis: detecting layout bugs, UX issues, and applying Tailwind-focused fixes.

---

## 1. Analysis Workflow

Scan screenshots in this order, spending ~30 seconds per category:

1. **Structural** - Broken images, overlapping content, elements cut off
2. **Layout** - Alignment, spacing consistency, visual hierarchy
3. **Accessibility** - Text readability, contrast, touch targets, focus states
4. **UX** - Information clarity, empty states, interaction feedback, consistency

Quick first-impression test: squint at the page. Can you identify the primary action in 3 seconds? Does it look like a finished product?

---

## 2. Critical Issues

### 2.1 Broken Images

**Detect:** Broken image icons, blank spaces, alt text showing instead of image.

```jsx
// Fix: Next.js Image with fallback
<Image
  src={imageUrl}
  alt="Description"
  onError={(e) => e.target.src = '/fallback.png'}
/>

// Fix: Reserve space to prevent layout shift
<div className="aspect-video bg-gray-100">
  <Image src={src} fill className="object-cover" />
</div>
```

### 2.2 Overlapping Content

**Detect:** Text on top of text, modals obscured, headers covering content.

**Causes:** Z-index conflicts, absolute positioning without containment, fixed headers without body padding.

```jsx
// Fix: Z-index stacking order
// header: z-40, dropdown: z-50, modal-backdrop: z-60, modal: z-70, toast: z-80

// Fix: Absolute positioning
<div className="relative">
  <div className="absolute top-0 left-0">...</div>
</div>

// Fix: Fixed header
<header className="fixed top-0 z-40">...</header>
<main className="pt-16">...</main>  {/* offset by header height */}
```

### 2.3 Unreadable Text

**Detect:** Text too small (<16px body), poor contrast (gray on light gray), text cut off without ellipsis.

```jsx
// Bad: too small, poor contrast
<p className="text-xs text-gray-400">Important text</p>

// Good: readable size and contrast
<p className="text-base text-gray-900">Important text</p>

// Good: proper truncation
<p className="truncate">Long text...</p>
<p className="line-clamp-3">Multi-line text...</p>
```

### 2.4 Stacked Text (Unintentional)

**Detect:** Labels and values stacking vertically when they should be inline.

```jsx
// Bad: stacks vertically
<div>
  <span>Label:</span>
  <span>Value</span>
</div>

// Good: horizontal layout
<div className="flex items-center gap-2">
  <span>Label:</span>
  <span>Value</span>
</div>
```

---

## 3. Layout Patterns

### 3.1 Z-Index Stacking

Use a consistent scale: header(40), dropdown(50), backdrop(60), modal(70), toast(80).

```jsx
<div className="z-40">  {/* header */}
<div className="z-50">  {/* dropdown */}
<div className="z-[70]"> {/* modal */}
```

### 3.2 Flexbox Alignment

```jsx
// Icon + text alignment
<div className="flex items-center gap-2">
  <Icon className="w-5 h-5 flex-shrink-0" />
  <span>Aligned text</span>
</div>

// Sidebar layout
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64 shrink-0">Sidebar</aside>
  <main className="flex-1 min-w-0">Content</main>
</div>
```

### 3.3 Grid Alignment

```jsx
// Equal-height cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="flex flex-col h-full">
    <div className="flex-1">Content</div>
    <div>Footer</div>
  </div>
</div>

// Auto-responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
```

### 3.4 Truncated Text in Flex

The key fix: add `min-w-0` to the flex child so truncation works.

```jsx
// Bad: text overflows flex container
<div className="flex gap-4">
  <div className="flex-1">
    <p className="truncate">Long text...</p>
  </div>
</div>

// Good: min-w-0 enables truncation
<div className="flex gap-4">
  <div className="flex-1 min-w-0">
    <p className="truncate">Long text...</p>
  </div>
</div>
```

### 3.5 Responsive Fixes

```jsx
// Bad: fixed width causes overflow
<div className="w-[500px]">Content</div>

// Good: responsive width
<div className="w-full max-w-md">Content</div>

// Responsive text sizing
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">

// Responsive container padding
<div className="px-4 sm:px-6 lg:px-8">

// Image constraint
<img src="..." className="max-w-full h-auto" alt="..." />
```

---

## 4. Typography & Readability

### 4.1 Hierarchy Scale

```jsx
<h1 className="text-4xl font-bold tracking-tight text-gray-900">
<h2 className="text-3xl font-semibold text-gray-900">
<h3 className="text-2xl font-semibold text-gray-900">
<p className="text-base text-gray-700 leading-relaxed">
<span className="text-sm text-gray-500">  {/* secondary/muted */}
```

### 4.2 Sizing Guidelines

- Body text: minimum 16px (`text-base`)
- Secondary text: 14px (`text-sm`) only for metadata/labels
- Never use `text-xs` for important content
- Line length: 45-80 characters per line (use `max-w-prose` or `max-w-2xl`)

### 4.3 Contrast Requirements

```jsx
// Primary text: text-gray-900 on white (high contrast)
// Secondary text: text-gray-600 on white (adequate)
// Muted text: text-gray-500 on white (minimum acceptable)
// Avoid: text-gray-400 on white (fails WCAG AA for body text)

// Background pairings
<div className="bg-white text-gray-900">     {/* primary */}
<div className="bg-gray-50 text-gray-700">   {/* secondary */}
<div className="bg-gray-100 text-gray-600">  {/* muted section */}
```

---

## 5. UX Quality Checks

### 5.1 Information Hierarchy

- Can you identify the most important element in 3 seconds?
- Are primary actions visually distinct from secondary?
- Is related information grouped together?

```jsx
// Button hierarchy
<button className="bg-blue-600 text-white font-semibold">Primary</button>
<button className="bg-white text-blue-600 border-2 border-blue-600">Secondary</button>
<button className="bg-transparent text-gray-600 hover:bg-gray-100">Tertiary</button>
```

### 5.2 Missing Context

Check for: numbers without units, dates without formatting, icons without labels, status indicators without descriptions, technical IDs exposed to users.

Ask: "Would a new user understand this without explanation?"

### 5.3 Empty States

Every list/grid must handle the zero-data case with guidance.

```jsx
{items.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon className="w-12 h-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No items yet</h3>
    <p className="text-gray-600 mb-6">Get started by creating your first item.</p>
    <Button>Create Item</Button>
  </div>
) : (
  <ItemList items={items} />
)}
```

### 5.4 Interaction Feedback

Every interactive element needs: hover state, active/pressed state, focus ring, disabled state, loading state for async actions.

```jsx
<button className="
  bg-blue-600 hover:bg-blue-700 active:bg-blue-800
  focus:outline-none focus:ring-2 focus:ring-blue-500
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
">

// Loading state
<Button disabled={isLoading}>
  {isLoading ? (
    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
  ) : 'Save'}
</Button>
```

### 5.5 Visual Consistency

- Same component type should look the same everywhere
- Consistent border radii, shadows, and padding across cards
- Same icon set throughout (don't mix icon libraries)
- Consistent color usage for same semantic meaning

---

## 6. Framework Fix Patterns (Tailwind)

### 6.1 Flex Alignment

```jsx
// Centered container
<div className="flex items-center justify-center min-h-screen">
  <div className="max-w-md w-full">Content</div>
</div>

// Icon + text (most common alignment fix)
<div className="flex items-center gap-2">
  <Icon className="w-5 h-5 flex-shrink-0" />
  <span>Text</span>
</div>
```

### 6.2 Spacing System

```jsx
// Vertical stack (prevents margin collapse)
<div className="space-y-6">
  <Section />
  <Section />
</div>

// Or with flex
<div className="flex flex-col gap-6">

// Horizontal group
<div className="flex gap-4">

// Scale: gap-1(4px), gap-2(8px), gap-3(12px), gap-4(16px), gap-6(24px), gap-8(32px)
```

### 6.3 Focus States

```jsx
// Bad: removes focus indicator entirely
<button className="focus:outline-none">

// Good: replaces outline with visible ring
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500">

// Link focus
<a className="focus:ring-2 focus:ring-blue-500 focus:outline-none focus:rounded">
```

### 6.4 Skeleton Loaders

```jsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

### 6.5 Touch Targets

```jsx
// Minimum 44x44px for mobile
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon className="w-5 h-5" />
</button>
```

---

## 7. Reporting Format

### Issue Structure

```
## Issue: [Descriptive title]

**What's happening:**
[Describe current state objectively]

**Why it matters:**
[User impact in plain language]

**Fix:**
[Specific code change with Tailwind classes]
```

### Priority Guidelines

**Critical** (must fix):
- Broken images, overlapping content, unreadable text
- Interactive elements not clickable (z-index, pointer-events)
- Content cut off or hidden unintentionally

**High** (should fix):
- Technical data exposed to users (IDs, raw timestamps)
- Missing interaction feedback (no hover, no loading state)
- Major accessibility issues (contrast, touch targets)
- Missing empty states for primary views

**Medium** (improve):
- Inconsistent spacing or visual patterns
- Weak typography hierarchy
- Missing contextual guidance
- Unhandled edge cases (error states, loading)

**Low** (polish):
- Minor formatting inconsistencies
- Small visual refinements
- Nice-to-have additional context

### What NOT to Report

- Personal style preferences without user impact
- Subjective color choices (unless accessibility issue)
- Sub-pixel alignment issues
- Features that are missing but not implied to exist
