# Common Layout Issues and Fix Patterns

## Overlapping Elements

### Symptoms
- Elements rendering on top of each other
- Text hidden behind images or headers
- Modals/dialogs obscured by other content

### Common Causes
1. **Z-index conflicts** - Multiple elements with high z-index values
2. **Absolute positioning** - Elements removed from flow without proper containment
3. **Negative margins** - Pulling elements out of their natural position
4. **Flex/Grid errors** - Items not sizing correctly

### Fix Patterns

**Z-index stacking:**
```css
/* Establish stacking context layers */
.header { z-index: 40; }
.dropdown { z-index: 50; }
.modal-backdrop { z-index: 60; }
.modal { z-index: 70; }
.toast { z-index: 80; }

/* Tailwind equivalents */
.header { @apply z-40; }
.modal { @apply z-[70]; }
```

**Absolute positioning fixes:**
```css
/* Ensure container has position: relative */
.container {
  position: relative; /* Establishes containing block */
}

.absolute-child {
  position: absolute;
  top: 0;
  left: 0;
  /* Will be positioned relative to .container */
}

/* Tailwind */
<div className="relative">
  <div className="absolute top-0 left-0">...</div>
</div>
```

## Misaligned Elements

### Symptoms
- Buttons/inputs not vertically aligned
- Text baselines don't match
- Icons misaligned with text
- Grid items uneven heights

### Common Causes
1. **Mixed alignment methods** - Using different vertical-align, flexbox, grid
2. **Inconsistent box models** - Some elements box-sizing: border-box, others not
3. **Line-height issues** - Different line-heights causing misalignment
4. **Icon sizing** - SVG icons not matching text height

### Fix Patterns

**Flexbox alignment:**
```css
/* Vertical centering */
.flex-container {
  display: flex;
  align-items: center; /* Vertical */
  gap: 0.5rem;
}

/* Tailwind */
<div className="flex items-center gap-2">
  <Icon className="w-5 h-5" />
  <span>Text</span>
</div>
```

**Grid alignment:**
```css
/* Equal height cards */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  align-items: start; /* Top align items */
}

/* Tailwind */
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
```

**Icon + Text alignment:**
```css
/* Method 1: Flex */
.icon-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-text svg {
  width: 1.25em; /* Match text size */
  height: 1.25em;
  flex-shrink: 0;
}

/* Tailwind */
<span className="inline-flex items-center gap-2">
  <Icon className="w-5 h-5 flex-shrink-0" />
  Text
</span>
```

## Truncated Text

### Symptoms
- Text cut off with no ellipsis
- Words breaking mid-letter
- Overflow hidden without scrolling
- Content extending beyond container

### Common Causes
1. **Fixed widths** - Container too narrow for content
2. **No overflow handling** - Missing ellipsis or wrap
3. **White-space settings** - nowrap without truncation
4. **Flex shrinking** - Text in flex items not wrapping

### Fix Patterns

**Single-line truncation:**
```css
.truncate-single {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Tailwind */
<p className="truncate">Long text here...</p>
```

**Multi-line truncation:**
```css
.truncate-multi {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Number of lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tailwind */
<p className="line-clamp-3">Long text here...</p>
```

**Flex text wrapping:**
```css
/* Prevent flex items from shrinking text */
.flex-container {
  display: flex;
  gap: 1rem;
}

.flex-text {
  flex: 1;
  min-width: 0; /* Allow text to shrink */
  overflow-wrap: break-word;
}

/* Tailwind */
<div className="flex gap-4">
  <div className="flex-1 min-w-0">
    <p className="break-words">Long text...</p>
  </div>
</div>
```

## Broken Responsive Layouts

### Symptoms
- Horizontal scrolling on desktop
- Elements too small on desktop (mobile styles leaking)
- Layout breaks at specific viewport widths
- Content overflowing container

### Common Causes
1. **Fixed pixel widths** - Not using responsive units
2. **Missing breakpoints** - Mobile-first not applied
3. **Viewport units issues** - 100vw causing horizontal scroll
4. **Flex/Grid not responding** - Missing responsive grid changes

### Fix Patterns

**Container constraints:**
```css
/* Prevent overflow */
.container {
  max-width: 100%;
  overflow-x: hidden;
}

/* Safe full-width */
.full-width {
  width: 100%;
  /* NOT width: 100vw - causes horizontal scroll */
}

/* Tailwind */
<div className="max-w-full overflow-x-hidden">
```

**Responsive grid:**
```css
/* Auto-responsive grid */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 1.5rem;
}

/* Tailwind */
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
```

**Image constraints:**
```css
/* Prevent image overflow */
img {
  max-width: 100%;
  height: auto;
}

/* Tailwind */
<img src="..." className="max-w-full h-auto" alt="..." />
```

## Spacing Issues

### Symptoms
- Inconsistent gaps between elements
- Elements touching container edges
- Cramped or excessive whitespace
- Uneven padding/margins

### Common Causes
1. **Magic numbers** - Random padding/margin values
2. **No spacing system** - Not using consistent scale
3. **Margin collapse** - Vertical margins behaving unexpectedly
4. **Mixed spacing units** - rem, px, em all mixed together

### Fix Patterns

**Consistent spacing scale:**
```css
/* Use 4px or 8px base unit */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */

/* Tailwind already uses this */
<div className="p-4 space-y-6">
```

**Stack spacing (prevents margin collapse):**
```css
/* Flexbox stack */
.stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* No margin collapse */
}

/* Tailwind */
<div className="flex flex-col gap-6">
```

**Container padding:**
```css
/* Consistent container padding */
.container {
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

/* Tailwind */
<div className="px-4 sm:px-6 lg:px-8">
```

## Visual Hierarchy Issues

### Symptoms
- All text looks the same size/weight
- No clear primary/secondary actions
- Headings not distinguishable from body text
- Important content not standing out

### Common Causes
1. **Insufficient size contrast** - h1 only slightly larger than p
2. **Missing font weights** - Everything regular weight
3. **No color contrast** - All text same color
4. **Flat design taken too far** - No visual emphasis

### Fix Patterns

**Typography scale:**
```css
/* Clear hierarchy */
h1 { font-size: 2.5rem; font-weight: 700; line-height: 1.2; }
h2 { font-size: 2rem; font-weight: 600; line-height: 1.3; }
h3 { font-size: 1.5rem; font-weight: 600; line-height: 1.4; }
p  { font-size: 1rem; font-weight: 400; line-height: 1.5; }

/* Tailwind */
<h1 className="text-4xl font-bold">
<h2 className="text-3xl font-semibold">
<h3 className="text-2xl font-semibold">
<p className="text-base">
```

**Button hierarchy:**
```css
/* Primary action */
.btn-primary {
  background: #0066cc;
  color: white;
  font-weight: 600;
}

/* Secondary action */
.btn-secondary {
  background: white;
  color: #0066cc;
  border: 2px solid #0066cc;
}

/* Tertiary/ghost */
.btn-ghost {
  background: transparent;
  color: #666;
}

/* Tailwind */
<button className="bg-blue-600 text-white font-semibold"> /* Primary */
<button className="bg-white text-blue-600 border-2 border-blue-600"> /* Secondary */
<button className="bg-transparent text-gray-600 hover:bg-gray-100"> /* Ghost */
```

## Loading & Empty States

### Symptoms
- Blank white screen during loading
- No indication of empty data
- Jarring layout shifts when content loads
- Content jumping around

### Fix Patterns

**Skeleton screens:**
```jsx
/* Tailwind skeleton */
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

**Empty states:**
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

**Layout shift prevention:**
```css
/* Reserve space for images */
.image-container {
  aspect-ratio: 16 / 9;
  background: #f3f4f6; /* Placeholder color */
}

/* Tailwind */
<div className="aspect-video bg-gray-100">
  <img src="..." className="w-full h-full object-cover" alt="..." />
</div>
```
