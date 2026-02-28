# Framework-Specific Fix Patterns

## Tailwind CSS

### Common Patterns

**Flexbox layouts:**
```jsx
// Centered container
<div className="flex items-center justify-center min-h-screen">
  <div className="max-w-md w-full">Content</div>
</div>

// Responsive sidebar layout
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64 shrink-0">Sidebar</aside>
  <main className="flex-1 min-w-0">Main content</main>
</div>

// Card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {cards.map(card => <Card key={card.id} {...card} />)}
</div>
```

**Spacing system:**
```jsx
// Consistent vertical spacing
<div className="space-y-6">
  <Section />
  <Section />
</div>

// Consistent horizontal spacing
<div className="flex gap-4">
  <Button />
  <Button />
</div>

// Container padding
<div className="px-4 py-6 sm:px-6 lg:px-8">
  Content with responsive padding
</div>
```

**Typography:**
```jsx
// Heading hierarchy
<h1 className="text-4xl font-bold tracking-tight text-gray-900">
<h2 className="text-3xl font-semibold text-gray-900">
<h3 className="text-2xl font-semibold text-gray-900">
<p className="text-base text-gray-700 leading-relaxed">

// Responsive text
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
```

**Color system:**
```jsx
// Background colors
<div className="bg-white"> // Cards, panels
<div className="bg-gray-50"> // Page background
<div className="bg-gray-100"> // Muted sections

// Text colors
<p className="text-gray-900"> // Primary text
<p className="text-gray-600"> // Secondary text
<p className="text-gray-500"> // Muted text

// Border colors
<div className="border border-gray-200"> // Default
<div className="border border-gray-300"> // Emphasized
```

**Interactive states:**
```jsx
// Button states
<button className="
  bg-blue-600 hover:bg-blue-700 active:bg-blue-800
  focus:ring-2 focus:ring-blue-500 focus:outline-none
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
">

// Link states
<a className="
  text-blue-600 hover:text-blue-800 hover:underline
  focus:ring-2 focus:ring-blue-500 focus:outline-none focus:rounded
">
```

### Common Tailwind Issues and Fixes

**Issue: Elements not aligned**
```jsx
// ❌ Bad - misaligned icon and text
<div>
  <Icon />
  <span>Text</span>
</div>

// ✅ Good - proper alignment
<div className="flex items-center gap-2">
  <Icon className="w-5 h-5 flex-shrink-0" />
  <span>Text</span>
</div>
```

**Issue: Truncated text in flex container**
```jsx
// ❌ Bad - text overflows
<div className="flex gap-4">
  <div className="flex-1">
    <p className="truncate">Very long text...</p>
  </div>
</div>

// ✅ Good - proper truncation
<div className="flex gap-4">
  <div className="flex-1 min-w-0">
    <p className="truncate">Very long text...</p>
  </div>
</div>
```

**Issue: Horizontal scroll on mobile**
```jsx
// ❌ Bad - causes overflow
<div className="w-[500px]">Content</div>

// ✅ Good - responsive width
<div className="w-full max-w-md">Content</div>
```

**Issue: Missing focus states**
```jsx
// ❌ Bad - no focus indicator
<button className="focus:outline-none">Click me</button>

// ✅ Good - visible focus ring
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500">
  Click me
</button>
```

## Next.js + Tailwind (App Router)

### Layout Structure

```jsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block">
            <Sidebar />
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <Header />
            </header>

            <main className="flex-1 px-6 py-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
```

### Page Layouts

```jsx
// List page with cards
export default function EventsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage your company events</p>
        </div>
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          New Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input placeholder="Search events..." className="max-w-sm" />
        <Select>...</Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
```

### Card Component

```jsx
// components/event/event-card.tsx
export function EventCard({ event }: { event: Event }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="aspect-video bg-gray-100">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
            {event.title}
          </h3>
          <p className="text-gray-600 mt-2 line-clamp-3">
            {event.description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(event.date)}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            {event.participantCount} participants
          </span>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## CSS Modules

### Common Patterns

```css
/* styles/card.module.css */
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: box-shadow 200ms;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.cardImage {
  aspect-ratio: 16 / 9;
  background: #f3f4f6;
}

.cardImage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cardContent {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cardTitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

```jsx
// Component usage
import styles from './card.module.css'

export function Card({ title, image, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardImage}>
        <img src={image} alt={title} />
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        {children}
      </div>
    </div>
  )
}
```

### Layout Patterns

```css
/* styles/layout.module.css */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 1.5rem;
}

.flex {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
```

## Styled Components

### Common Patterns

```jsx
import styled from 'styled-components'

const Card = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: box-shadow 200ms;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
`

const CardImage = styled.div`
  aspect-ratio: 16 / 9;
  background: #f3f4f6;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const CardContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

// Usage
export function EventCard({ event }) {
  return (
    <Card>
      <CardImage>
        <img src={event.image} alt={event.title} />
      </CardImage>
      <CardContent>
        <CardTitle>{event.title}</CardTitle>
        <p>{event.description}</p>
      </CardContent>
    </Card>
  )
}
```

## Plain CSS

### Modern CSS Features

```css
/* Container queries (modern) */
.card-container {
  container-type: inline-size;
}

.card {
  display: flex;
  flex-direction: column;
}

@container (min-width: 500px) {
  .card {
    flex-direction: row;
  }
}

/* Custom properties for theming */
:root {
  --color-primary: #0066cc;
  --color-text: #1a1a1a;
  --color-bg: #ffffff;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --radius: 0.5rem;
}

.card {
  background: var(--color-bg);
  padding: var(--space-6);
  border-radius: var(--radius);
}

/* Modern layout */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: var(--space-6);
}

/* Logical properties */
.button {
  padding-inline: 1rem; /* left/right in LTR, flips in RTL */
  padding-block: 0.5rem; /* top/bottom */
  margin-block-start: 1rem; /* margin-top in LTR */
}
```

## Detection Strategy

When analyzing screenshots, determine the framework by:

1. **Look for Tailwind classes** in HTML - utility classes like `flex`, `bg-blue-600`, `text-lg`
2. **Check for CSS Modules** - class names like `card_title__abc123`
3. **Check for styled-components** - class names like `sc-xyz123`
4. **Default to plain CSS** if no framework indicators

Apply the appropriate fix patterns based on detected framework.
