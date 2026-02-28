# Audit Dimensions Reference

Detailed prompts for each parallel exploration agent. Each dimension runs as an independent Task agent and produces structured findings.

## Table of Contents

1. [API Route Handlers](#1-api-route-handlers)
2. [TanStack Query Hooks](#2-tanstack-query-hooks)
3. [UI Components (Dialogs + Cards)](#3-ui-components)
4. [Page Components & Layouts](#4-page-components--layouts)
5. [Form Field Patterns](#5-form-field-patterns)
6. [Types & Validations](#6-types--validations)
7. [Services & Utilities](#7-services--utilities)
8. [Detail Pages](#8-detail-pages)
9. [Micro-Patterns](#9-micro-patterns)

---

## 1. API Route Handlers

Explore `src/app/api/` across all modules. Read 8-10 full route files.

**Look for:**
- Repeated try/catch + auth + error response boilerplate
- GET list handler boilerplate (pagination, filter parsing, count + findMany)
- Creator ownership check blocks (find, 404, 403)
- Tag verification blocks
- Validation approach inconsistency (.parse vs .safeParse)
- Error message language mixing (French vs English)
- Response shape inconsistency (different key names for same concept)
- Status code inconsistency for same error types
- Whether `errorResponse()`/`successResponse()` helpers exist but are underused

**Quantify:** Count exact repetitions, lines per pattern, total affected routes.

---

## 2. TanStack Query Hooks

Read ALL files in `src/hooks/api/`, `src/lib/query-keys.ts`, `src/lib/api-client.ts`.

**Look for:**
- List query pattern (useQuery + URLSearchParams builder) — count instances
- Detail query pattern (useQuery + `enabled: !!id`) — count instances
- Create mutation pattern (useMutation + invalidate lists + toast) — count instances
- Update mutation pattern (useMutation + optimistic update + rollback) — count instances
- Delete mutation pattern (useMutation + invalidate + toast) — count instances
- Filter building inconsistency (manual field mapping vs Object.entries loop vs existing utility)
- Query key definitions duplicated in hook files vs centralized in query-keys.ts
- Error handling variations (toast, silent, status-aware, missing)
- Custom fetch wrappers that ignore the shared api-client

**Quantify:** Lines per pattern x instances = total reducible. Propose generic hook factories.

---

## 3. UI Components

Read dialog and card files across all modules in `src/components/`.

**Look for:**
- Dialog structural duplication (useForm + zodResolver + reset + onSubmit + FormDialog wrapper)
- Card variant explosion (standard/minimal/horizontal with shared logic)
- Enum label maps defined inline in multiple files
- CardLink wrapper pattern reimplemented per card
- Edit vs Create dialog near-duplication (shared form fields)
- Components >300 lines that should be decomposed

**Quantify:** % duplication across card variants. Lines per dialog that are boilerplate vs unique.

---

## 4. Page Components & Layouts

Read page.tsx files across all dashboard modules.

**Look for:**
- Shared page structure (PageHeader + FilterBar + Content + Pagination + Dialog)
- Loading/Error/Empty state patterns — are shared components used or reimplemented?
- Search/Filter state management pattern (nuqs, useState, etc.)
- Pagination component — is it shared or duplicated inline?
- Role-based rendering patterns
- Stagger animation patterns
- Tab navigation patterns

**Note:** Pages are often well-structured. Focus on finding exceptions and inline reimplementations.

---

## 5. Form Field Patterns

Read ALL dialog/form files. Count FormField instances.

**Look for:**
- Enum Select FormField (label map + SearchableSelect/Select) — lines per instance, count
- Date input FormField (type="date" + formatting) — count
- Time input FormField (type="time" + hour/minute parsing) — count
- Number input FormField (type="number" + parseInt onChange) — count
- Textarea FormField — count
- Tag multi-select FormField (checkbox grid with toggle logic) — count
- Location picker usage — count
- Inconsistent form patterns (register() vs FormField)

**Propose:** Thin wrapper components (EnumSelectField, DateField, TimeField, etc.) with line savings.

---

## 6. Types & Validations

Read `src/types/`, `src/lib/validations/`, and cross-reference with hooks and API routes.

**Look for:**
- Response types defined in multiple places (types/api.ts vs hook files vs inline)
- Conflicting type definitions (same entity, different shapes)
- Completely untyped code (using `never[]`, `any`, missing generics)
- Zod schemas that are never imported
- Enum values duplicated across validation files
- Missing barrel exports / re-export index

---

## 7. Services & Utilities

Read `src/services/`, `src/stores/`, `src/lib/` (all files).

**Look for:**
- Business logic trapped in API route handlers that should be in service files
- Missing service files (which modules have no service?)
- Utility functions duplicated or reimplemented in hook files
- Empty directories (stores with no stores, etc.)
- Unused dependencies in tech stack
- Configuration constants scattered vs centralized

---

## 8. Detail Pages

Read ALL `[id]/page.tsx` files.

**Look for:**
- Shared layout structure (back button, loading skeleton, not-found, title+badges, grid)
- Creator/owner sidebar card pattern — how many pages repeat it?
- Participants/reservations list card — shared or inline?
- Delete confirmation dialog setup — repeated?
- Permission check patterns (canEdit)

**Propose:** DetailPageLayout component with line savings estimate.

---

## 9. Micro-Patterns

Search across entire codebase for small but compounding duplications.

**Look for:**
- Inline pagination reimplementing existing Pagination component
- Inline skeleton grids ignoring existing SkeletonGrid component
- Badge components all following identical enum-to-badge structure (createEnumBadge factory)
- Loading → Grid → Empty state tri-state pattern (CardGridContainer)
- Debounced search patterns
- Tooltip wrapper patterns
- Stats card patterns
