# Next.js Code Style Examples

Complete examples demonstrating the code style for common scenarios.

## Table of Contents

1. [Simple List Page](#simple-list-page)
2. [Detail Page with Related Data](#detail-page-with-related-data)
3. [Form with Server Action](#form-with-server-action)
4. [Search with Client State](#search-with-client-state)
5. [Modal with Client Interaction](#modal-with-client-interaction)
6. [Infinite Scroll](#infinite-scroll)
7. [Real-time Updates](#real-time-updates)

---

## Simple List Page

Display a list of items fetched from the database.

```tsx
// app/products/page.tsx (Server Component)
import { getProducts } from '@/lib/data/products'
import { ProductList } from '@/components/products/ProductList'

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <ProductList products={products} />
    </div>
  )
}
```

```tsx
// lib/data/products.ts
import { db } from '@/lib/db'

export async function getProducts() {
  return db.product.findMany({
    orderBy: { createdAt: 'desc' },
  })
}
```

```tsx
// components/products/ProductList.tsx (Server Component)
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="text-muted">No products found</p>
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="hover:shadow-lg transition">
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-sm text-muted">{product.category}</p>
            <p className="text-lg font-bold mt-2">${product.price}</p>
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

---

## Detail Page with Related Data

Show a single item with related data.

```tsx
// app/products/[id]/page.tsx (Server Component)
import { getProductById } from '@/lib/data/products'
import { getReviewsForProduct } from '@/lib/data/reviews'
import { ProductDetail } from '@/components/products/ProductDetail'
import { ReviewList } from '@/components/reviews/ReviewList'
import { notFound } from 'next/navigation'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const [product, reviews] = await Promise.all([
    getProductById(params.id),
    getReviewsForProduct(params.id),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="container py-8">
      <ProductDetail product={product} />
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>
        <ReviewList reviews={reviews} />
      </div>
    </div>
  )
}
```

```tsx
// lib/data/products.ts
export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: { category: true },
  })
}
```

```tsx
// components/products/ProductDetail.tsx (Server Component)
export function ProductDetail({ product }: { product: Product }) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <img src={product.imageUrl} alt={product.name} className="rounded" />
      </div>
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-muted mt-2">{product.category.name}</p>
        <p className="text-2xl font-bold mt-4">${product.price}</p>
        <p className="mt-6">{product.description}</p>
      </div>
    </div>
  )
}
```

---

## Form with Server Action

Handle form submission with a Server Action using Zod validation.

```tsx
// lib/schemas/product.ts
import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  categoryId: z.string().uuid('Invalid category'),
  price: z.number().positive('Price must be positive').max(999999, 'Price too high'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
```

```tsx
// lib/actions/create-product.ts
'use server'

import { db } from '@/lib/db'
import { createProductSchema } from '@/lib/schemas/product'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
    price: parseFloat(formData.get('price') as string),
  }

  const result = createProductSchema.safeParse(raw)

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors }
  }

  const product = await db.product.create({
    data: result.data,
  })

  revalidatePath('/products')
  redirect(`/products/${product.id}`)
}
```

```tsx
// app/products/new/page.tsx (Server Component)
import { ProductForm } from './ProductForm'
import { getCategories } from '@/lib/data/categories'

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">New Product</h1>
      <ProductForm categories={categories} />
    </div>
  )
}
```

```tsx
// app/products/new/ProductForm.tsx (Client Component - needs form state)
'use client'

import { useState } from 'react'
import { createProduct } from '@/lib/actions/create-product'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ProductForm({ categories }: { categories: Category[] }) {
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = async (formData: FormData) => {
    const result = await createProduct(formData)
    if (result?.error) {
      setErrors(result.error)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select name="categoryId">
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="text-sm text-destructive mt-1">{errors.categoryId[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="price">Price</Label>
        <Input id="price" name="price" type="number" step="0.01" />
        {errors.price && (
          <p className="text-sm text-destructive mt-1">{errors.price[0]}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Product'}
    </Button>
  )
}
```

---

## Search with Client State

Implement search with client-side state management.

```tsx
// app/products/page.tsx (Server Component)
import { ProductSearch } from './ProductSearch'

export default function ProductsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <ProductSearch />
    </div>
  )
}
```

```tsx
// app/products/ProductSearch.tsx (Client Component - needs useState)
'use client'

import { useState, useEffect } from 'react'
import { searchProducts } from '@/lib/actions/search-products'
import { ProductList } from '@/components/products/ProductList'

export function ProductSearch() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const search = async () => {
      setLoading(true)
      const results = await searchProducts(query)
      setProducts(results)
      setLoading(false)
    }

    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="border rounded px-4 py-2 w-full mb-6"
      />
      {loading ? (
        <p>Searching...</p>
      ) : (
        <ProductList products={products} />
      )}
    </div>
  )
}
```

```tsx
// lib/actions/search-products.ts
'use server'

import { db } from '@/lib/db'

export async function searchProducts(query: string) {
  if (!query) {
    return db.product.findMany({ take: 20 })
  }

  return db.product.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    take: 20,
  })
}
```

---

## Modal with Client Interaction

Show a modal that requires client-side state.

```tsx
// app/products/[id]/page.tsx (Server Component)
import { getProductById } from '@/lib/data/products'
import { ProductDetail } from '@/components/products/ProductDetail'
import { DeleteProductButton } from './DeleteProductButton'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id)

  return (
    <div className="container py-8">
      <ProductDetail product={product} />
      <DeleteProductButton productId={product.id} />
    </div>
  )
}
```

```tsx
// app/products/[id]/DeleteProductButton.tsx (Client Component)
'use client'

import { useState } from 'react'
import { deleteProduct } from '@/lib/actions/delete-product'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function DeleteProductButton({ productId }: { productId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await deleteProduct(productId)
  }

  return (
    <>
      <Button variant="danger" onClick={() => setShowModal(true)}>
        Delete Product
      </Button>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
        <p className="mb-6">Are you sure you want to delete this product?</p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button variant="ghost" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  )
}
```

```tsx
// lib/actions/delete-product.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteProduct(id: string) {
  await db.product.delete({ where: { id } })
  revalidatePath('/products')
  redirect('/products')
}
```

---

## Infinite Scroll

Implement pagination with infinite scroll.

```tsx
// app/products/page.tsx (Server Component)
import { getProducts } from '@/lib/data/products'
import { ProductInfiniteList } from './ProductInfiniteList'

export default async function ProductsPage() {
  const initialProducts = await getProducts({ page: 0, pageSize: 20 })

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <ProductInfiniteList initialProducts={initialProducts} />
    </div>
  )
}
```

```tsx
// app/products/ProductInfiniteList.tsx (Client Component)
'use client'

import { useState, useEffect } from 'react'
import { loadMoreProducts } from '@/lib/actions/load-more-products'
import { ProductList } from '@/components/products/ProductList'

export function ProductInfiniteList({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return

      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500

      if (scrolledToBottom) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, hasMore, page])

  const loadMore = async () => {
    setLoading(true)
    const newProducts = await loadMoreProducts(page)

    if (newProducts.length === 0) {
      setHasMore(false)
    } else {
      setProducts(prev => [...prev, ...newProducts])
      setPage(prev => prev + 1)
    }

    setLoading(false)
  }

  return (
    <div>
      <ProductList products={products} />
      {loading && <p className="text-center py-4">Loading more...</p>}
      {!hasMore && <p className="text-center py-4">No more products</p>}
    </div>
  )
}
```

---

## Real-time Updates

Handle real-time updates with polling or Server-Sent Events.

```tsx
// app/orders/OrdersLive.tsx (Client Component)
'use client'

import { useState, useEffect } from 'react'
import { getRecentOrders } from '@/lib/actions/get-recent-orders'
import { OrderList } from '@/components/orders/OrderList'

export function OrdersLive({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)

  useEffect(() => {
    // Poll every 5 seconds
    const interval = setInterval(async () => {
      const updated = await getRecentOrders()
      setOrders(updated)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return <OrderList orders={orders} />
}
```

```tsx
// app/orders/page.tsx (Server Component)
import { getRecentOrders } from '@/lib/data/orders'
import { OrdersLive } from './OrdersLive'

export default async function OrdersPage() {
  const initialOrders = await getRecentOrders()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Recent Orders</h1>
      <OrdersLive initialOrders={initialOrders} />
    </div>
  )
}
```
