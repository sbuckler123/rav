# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server (frontend only; API runs on Vercel)
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npx tsc --noEmit   # Type-check without building (run this before committing)
```

There are no tests. Always run `npx tsc --noEmit` after making changes.

## Architecture

**Stack**: React 18 + Vite frontend, Vercel serverless functions (`/api`), Airtable as the database, Clerk for auth, Cloudinary for media.

**Routing**: React Router v6 in `src/App.tsx`. Public routes use a shared Header/Footer layout. Admin routes (`/admin/*`) are wrapped in `<ProtectedRoute>` which checks Clerk auth.

**RTL / Hebrew**: The app is Hebrew-first. Main layout has `dir="rtl"`. Airtable table names and field names are all in Hebrew.

## API Layer

All admin operations go through a single consolidated serverless function `api/admin.ts`, which dispatches by `?section=` query param. This consolidation exists to stay within Vercel Hobby plan's 12-function limit.

```
GET/POST/PATCH/DELETE /api/admin?section=questions
GET/POST/PATCH/DELETE /api/admin?section=articles
GET/POST/PATCH/DELETE /api/admin?section=events
GET/POST/PATCH/DELETE /api/admin?section=shiurim
GET/POST/PATCH/DELETE /api/admin?section=videos
GET/POST/PATCH/DELETE /api/admin?section=users
GET                   /api/admin?section=cloudinary-sign[&folder=pdf]
GET/POST/PATCH/DELETE /api/admin?section=al-haperek
```

Public (unauthenticated) endpoints are separate top-level functions: `api/articles.ts`, `api/videos.ts`, `api/events.ts`, `api/questions.ts`, `api/al-haperek.ts`, etc.

**Exception**: `POST /api/admin?section=questions&type=reply` bypasses auth (public follow-up replies by question askers).

## Auth Pattern

- **Client**: Clerk. `src/api/tokenStore.ts` caches the getter; `src/api/apiFetch.ts` auto-attaches `Authorization: Bearer <token>` to every admin API call.
- **Server**: `api/_verifyAuth.ts` verifies Clerk JWTs using JWKS (cached 5 min). Call `requireAuth(req, res)` at the top of any protected handler — it returns `false` and sends 401 if invalid, so handlers must `return` on `false`.
- **User context**: `src/auth/AuthContext.tsx` wraps Clerk and syncs the signed-in user with the Airtable users table.

## Data Layer (Airtable)

Airtable is the primary database. All helper functions are defined locally in each `api/_admin-*.ts` file — there is no shared Airtable client. The pattern is:

```ts
const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// fetch: GET https://api.airtable.com/v0/{BASE_ID}/{table}?filterByFormula=...
// create: POST, update: PATCH, delete: DELETE
```

Field names in Airtable formulas must be escaped for special characters. Hebrew values in `filterByFormula` use `"..."` quoting. Use `typecast: true` on PATCH requests so Airtable coerces linked-record fields from raw values.

There is also a secondary Airtable base (`AIRTABLE_PAT1` / `AIRTABLE_BASE_ID1`) used for some sections.

## Frontend Data Fetching

All data fetching uses TanStack React Query. Custom hooks live in `src/hooks/useQueries.ts` (`useArticles`, `useVideos`, `useAlHaperek`, etc.). After a mutation, invalidate the relevant query:

```ts
void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alHaperek });
```

## Cloudinary Uploads

**Images** (`uploadToCloudinary`): signed upload via `POST /api/admin?section=cloudinary-sign` → then POST to `/image/upload`.

**PDFs** (`uploadToCloudinaryFile`): same signing endpoint with `?folder=pdf` → POST to `/image/upload` with `format: pdf`. The signing endpoint detects `?folder=pdf` and signs `{ timestamp, format: 'pdf', folder: 'pdf' }` instead of `{ timestamp, type: 'upload' }` — the signed params must exactly match what the client sends.

## Adding a New Admin Section

1. Create `api/_admin-{name}.ts` with an exported `handle(req, res)` function.
2. Add a `case '{name}'` to the switch in `api/admin.ts`.
3. Create `src/pages/admin/Admin{Name}Page.tsx` using `apiFetch` for API calls.
4. Add the route in `src/App.tsx` under the admin routes.
5. Keep the total number of top-level files in `/api` under 12 (Vercel limit).

## Environment Variables

`VITE_*` variables are exposed to the browser. Server-side variables (Airtable, Clerk secret, Cloudinary secret) must never have the `VITE_` prefix.

Key variables: `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `CLERK_SECRET_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_FOLDER` (optional folder prefix for image uploads), `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`.
