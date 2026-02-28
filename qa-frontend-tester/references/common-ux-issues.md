# Common UI/UX Issues - Visual QA Checklist

## Critical Issues (Must Fix)

### 1. Broken Images

**Symptoms:**
- Missing images (broken image icon)
- Alt text showing instead of image
- Blank spaces where images should be
- 404 errors for image resources

**Common Causes:**
- Incorrect image paths
- Images not imported/uploaded
- Image optimization breaking Next.js images
- CORS issues for external images

**How to Detect:**
- Look for broken image icons (🖼️ with X)
- Check browser console for 404 errors
- Verify `<img>` tags have valid `src`

**Fixes:**
```jsx
// ❌ Bad - hardcoded path
<img src="/images/logo.png" />

// ✅ Good - Next.js Image with proper import
import Image from 'next/image'
import logo from '@/public/images/logo.png'
<Image src={logo} alt="Logo" />

// ✅ Good - with error handling
<Image
  src={imageUrl}
  alt="..."
  onError={(e) => e.target.src = '/fallback.png'}
/>
```

### 2. Overlapping Content

**Symptoms:**
- Text rendering on top of other text
- Images covering buttons or links
- Modal/dropdown obscured by other elements
- Headers covering page content

**Common Causes:**
- Z-index conflicts
- Absolute positioning without containment
- Fixed headers without body padding
- Negative margins pulling content

**How to Detect:**
- Look for text that's hard to read due to overlap
- Check if clicking elements is difficult
- Verify modals/dropdowns are fully visible
- Check sticky headers don't cover content

**Fixes:**
```css
/* Fix z-index stacking */
.header { z-index: 40; }
.dropdown { z-index: 50; }
.modal { z-index: 60; }

/* Fix fixed header overlap */
body { padding-top: 64px; } /* Header height */
.header { position: fixed; top: 0; }

/* Fix absolute positioning */
.container { position: relative; }
.absolute-child { position: absolute; }
```

### 3. Unreadable Text

**Symptoms:**
- Text too small to read comfortably
- Poor contrast making text hard to see
- Text truncated or cut off
- Text color blends into background

**Common Causes:**
- Font size below 16px (14px, 12px, 10px)
- Low contrast ratio (gray on light gray)
- `overflow: hidden` without proper handling
- White text on light backgrounds

**How to Detect:**
- Visually scan for tiny text
- Check gray text on white/light backgrounds
- Look for cut-off text without ellipsis
- Verify all text is easily readable

**Fixes:**
```jsx
// ❌ Bad - too small, poor contrast
<p className="text-xs text-gray-400">Important text</p>

// ✅ Good - readable size and contrast
<p className="text-base text-gray-900">Important text</p>

// ❌ Bad - truncated without indication
<p className="overflow-hidden">Long text that gets cut off...</p>

// ✅ Good - proper truncation
<p className="truncate">Long text that gets cut off...</p>
<p className="line-clamp-3">Long text with 3 line limit...</p>
```

### 4. Stacked Text (Unintentional)

**Symptoms:**
- Multiple lines of text stacking vertically when they should be inline
- Labels and values not aligned horizontally
- Form labels appearing above inputs when they should be beside them
- Text wrapping unexpectedly

**Common Causes:**
- Missing `display: flex` or `display: inline`
- Block-level elements instead of inline
- Container too narrow forcing wraps
- Missing `white-space: nowrap`

**How to Detect:**
- Look for text that appears vertically stacked when it should be horizontal
- Check if labels and values are misaligned
- Verify intentional vs unintentional line breaks

**Fixes:**
```jsx
// ❌ Bad - unintentional stacking
<div>
  <span>Label:</span>
  <span>Value</span>
</div>
// Results in: Label:
//            Value

// ✅ Good - horizontal layout
<div className="flex items-center gap-2">
  <span>Label:</span>
  <span>Value</span>
</div>
// Results in: Label: Value

// ✅ Good - prevent wrapping
<div className="flex items-center gap-2 whitespace-nowrap">
  <span className="text-gray-600">Last updated:</span>
  <span className="font-medium">2 hours ago</span>
</div>
```

## High Priority Issues

### 5. Button/Link Not Clickable

**Symptoms:**
- Clicking interactive elements does nothing
- Hover states not appearing
- Elements look clickable but aren't
- Small touch targets on mobile

**Common Causes:**
- Element covered by transparent overlay
- `pointer-events: none` applied
- Touch target too small (< 44x44px)
- Z-index placing it behind other elements

**How to Detect:**
- Try clicking buttons/links in the screenshot context
- Check if elements have hover states
- Verify touch targets are adequately sized
- Look for elements that appear interactive but might not be

**Fixes:**
```jsx
// Ensure adequate touch targets
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon className="w-5 h-5" />
</button>

// Fix z-index issues
<button className="relative z-10">Click me</button>

// Remove pointer-events blocking
<button className="pointer-events-auto">Click me</button>
```

### 6. Form Validation Issues

**Symptoms:**
- No visual feedback for errors
- Error messages hidden or cut off
- Success states not clear
- Loading states missing

**How to Detect:**
- Check if error messages are visible
- Verify error states are clearly indicated
- Look for loading indicators on submit buttons

**Fixes:**
```jsx
// ✅ Good - clear error indication
<Input
  error={!!errors.email}
  className={errors.email ? 'border-red-500' : ''}
/>
{errors.email && (
  <p className="text-sm text-red-600 mt-1">
    {errors.email.message}
  </p>
)}

// ✅ Good - loading state
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      Submitting...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

### 7. Misaligned Elements

**Symptoms:**
- Icons not aligned with text vertically
- Grid items with different heights
- Buttons not aligned in button groups
- Form fields with inconsistent heights

**How to Detect:**
- Look for icons that sit too high or too low relative to text
- Check if grid/list items have uneven heights
- Verify button groups have consistent alignment

**Fixes:**
```jsx
// ✅ Good - icon + text alignment
<div className="flex items-center gap-2">
  <Icon className="w-5 h-5 flex-shrink-0" />
  <span>Aligned text</span>
</div>

// ✅ Good - equal height cards
<div className="grid grid-cols-3 gap-4">
  <Card className="flex flex-col h-full">
    <CardHeader>...</CardHeader>
    <CardContent className="flex-1">...</CardContent>
    <CardFooter>...</CardFooter>
  </Card>
</div>
```

## Medium Priority Issues

### 8. Inconsistent Spacing

**Symptoms:**
- Random gaps between elements
- Some sections cramped, others spacious
- Inconsistent padding in similar components
- Margins that don't follow a scale

**How to Detect:**
- Visually compare spacing between sections
- Check if similar elements have similar spacing
- Verify spacing follows a consistent scale (4px, 8px, 16px, 24px, etc.)

**Fixes:**
```jsx
// ✅ Use consistent spacing scale
<div className="space-y-6"> {/* 24px between children */}
  <Section />
  <Section />
</div>

<div className="flex gap-4"> {/* 16px between items */}
  <Item />
  <Item />
</div>
```

### 9. Poor Visual Hierarchy

**Symptoms:**
- All text looks the same size
- No clear primary/secondary actions
- Headings not distinct from body text
- Important content doesn't stand out

**How to Detect:**
- Squint at the page - what stands out?
- Check if you can tell primary from secondary actions
- Verify headings are clearly larger/bolder than body text

**Fixes:**
```jsx
// ✅ Clear hierarchy
<h1 className="text-4xl font-bold">Main Heading</h1>
<h2 className="text-2xl font-semibold">Subheading</h2>
<p className="text-base text-gray-700">Body text</p>

// ✅ Clear button hierarchy
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Tertiary Action</Button>
```

### 10. Missing Empty States

**Symptoms:**
- Blank white screen when no data
- Just shows empty list with no explanation
- No guidance for users on what to do
- Confusing whether content is loading or empty

**How to Detect:**
- Look for areas that might be empty lists/grids
- Check if there's any messaging for empty data
- Verify loading vs empty states are distinguishable

**Fixes:**
```jsx
// ✅ Good empty state
{items.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon className="w-12 h-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      No items yet
    </h3>
    <p className="text-gray-600 mb-6">
      Get started by creating your first item.
    </p>
    <Button>Create Item</Button>
  </div>
) : (
  <ItemList items={items} />
)}
```

### 11. Layout Shifts

**Symptoms:**
- Content jumps when loading completes
- Images causing page to reflow
- Text appearing/disappearing causing shifts
- Elements moving after fonts load

**How to Detect:**
- Watch for content that moves after initial render
- Check if images reserve space before loading
- Verify fonts don't cause layout changes

**Fixes:**
```jsx
// ✅ Reserve space for images
<div className="aspect-video bg-gray-100">
  <Image src={src} fill className="object-cover" />
</div>

// ✅ Skeleton loaders
{isLoading ? (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
) : (
  <Content />
)}
```

### 12. Mobile Responsiveness Issues

**Symptoms:**
- Horizontal scrolling on mobile
- Text too small on mobile
- Buttons too small to tap
- Content cut off on smaller screens

**How to Detect (Desktop View):**
- Look for fixed widths that might overflow
- Check if text might be too small scaled down
- Verify touch targets would be adequate

**Fixes:**
```jsx
// ✅ Responsive sizing
<div className="w-full max-w-4xl"> {/* Not w-[800px] */}

// ✅ Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// ✅ Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Analysis Workflow

When analyzing a screenshot, check for issues in this order:

1. **Critical Issues First** - Broken images, overlapping content, unreadable text
2. **Functional Issues** - Clickability, form validation, error states
3. **Layout Issues** - Alignment, spacing, visual hierarchy
4. **Polish Issues** - Empty states, loading states, responsiveness

For each issue found:
1. Identify the specific element/area
2. Classify severity (Critical / High / Medium / Low)
3. Describe the user impact
4. Suggest specific code fix
5. Ask for confirmation before applying
