# Accessibility Standards for Visual Testing

## WCAG 2.1 AA Guidelines

### Color Contrast

**Normal Text (< 18pt or < 14pt bold):**
- Minimum ratio: 4.5:1
- Common failures: Gray text on white backgrounds, light blue on white

**Large Text (≥ 18pt or ≥ 14pt bold):**
- Minimum ratio: 3:1

**UI Components & Graphics:**
- Minimum ratio: 3:1 for interactive elements and meaningful graphics

**Testing Methods:**
1. Extract text color and background color from screenshot
2. Calculate contrast ratio: (L1 + 0.05) / (L2 + 0.05) where L is relative luminance
3. Flag violations with specific recommendations

**Common Fixes:**
- Tailwind: `text-gray-900` instead of `text-gray-400`, `bg-white` instead of `bg-gray-100`
- CSS: Use darker text colors like `#1a1a1a` instead of `#999`
- Ensure button states have sufficient contrast (hover, focus, disabled)

### Touch Target Sizes

**Minimum Size:**
- 44x44 CSS pixels for all interactive elements
- Applies to: buttons, links, form inputs, checkboxes, radio buttons

**Common Violations:**
- Icon-only buttons without padding
- Inline links with small font size
- Checkboxes/radios without proper click area

**Common Fixes:**
- Tailwind: Add `min-h-[44px] min-w-[44px]` or `p-3` to buttons
- CSS: `min-height: 44px; min-width: 44px; padding: 0.75rem;`
- For small icons: Add padding or increase clickable area with pseudo-elements

### Text Sizing

**Body Text:**
- Minimum: 16px (1rem)
- Line height: At least 1.5 (24px for 16px text)

**Headings:**
- H1: 32-40px (2rem - 2.5rem)
- H2: 24-32px (1.5rem - 2rem)
- H3: 20-24px (1.25rem - 1.5rem)

**Common Violations:**
- 12px or 14px body text
- Insufficient line-height causing cramped text
- Headings that are too similar in size

**Common Fixes:**
- Tailwind: Use `text-base` (16px) minimum, never `text-xs` or `text-sm` for body
- CSS: `font-size: 1rem; line-height: 1.5;`

### Focus Indicators

**Requirements:**
- Visible focus indicator on ALL interactive elements
- Minimum 2px outline or border
- Sufficient contrast (3:1) from background

**Common Violations:**
- `outline: none` without custom focus style
- Focus indicator same color as background
- No visible change on keyboard focus

**Common Fixes:**
- Tailwind: Use `focus:ring-2 focus:ring-blue-500 focus:outline-none`
- CSS: `&:focus-visible { outline: 2px solid #0066cc; outline-offset: 2px; }`
- Never use just `focus:outline-none` without replacement

### Skip Links

**Requirements:**
- "Skip to main content" link as first focusable element
- Hidden until focused
- Scrolls to main content area

**Implementation:**
```html
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white">
  Skip to main content
</a>
<main id="main">...</main>
```

## Common Patterns to Check in Screenshots

### Visual Indicators
1. **Small text** - Flag any text that appears < 16px
2. **Low contrast** - Gray/muted colors on light backgrounds
3. **Tiny buttons** - Icon buttons or links that look < 44px
4. **Cramped spacing** - Tight line-height or insufficient padding
5. **Missing focus rings** - Interactive elements with no visible focus state

### Automated Checks
1. Measure button/link dimensions from bounding boxes
2. Extract color values from text/background pixels
3. Check font sizes from computed styles (if available)
4. Verify spacing between interactive elements (minimum 8px)

## Framework-Specific Accessibility Patterns

### Tailwind CSS
```jsx
// Good button
<button className="px-4 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]">
  Click me
</button>

// Good text
<p className="text-base leading-relaxed text-gray-900">
  Body text content
</p>
```

### Plain CSS
```css
/* Good button */
button {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Good text */
body {
  font-size: 1rem;
  line-height: 1.5;
  color: #1a1a1a;
}
```
