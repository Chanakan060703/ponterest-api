# REST API Completion (Schema.prisma) — Design

Date: 2026-03-17  
Project: `ponterest`  
Scope: Implement complete REST API for models in `prisma/schema.prisma`: `User`, `Category`, `Image`, `Tag`, `ImageTag`.

## Goals

- Provide CRUD endpoints for `Category`, `Tag`, `Image` aligned with Prisma schema constraints.
- Provide relationship endpoints to manage tags on images (`ImageTag`) without exposing join-table complexity to clients.
- Use **soft delete** semantics where schema includes `isDeleted`.
- Auth policy **A**:
  - Public: all `GET` endpoints + `/auth/register` + `/auth/login`
  - Protected: all `POST/PUT/DELETE` endpoints (except register/login), including `/auth/logout`

## Non-Goals

- File upload / image storage (only `url` is handled).
- Pagination, sorting, advanced filtering beyond basic query params.
- Role-based permissions (single “authenticated user” tier).

## Data Model Notes (from `schema.prisma`)

- `User`: `email` unique, `phone` unique.
- `Category`: `name` unique, `isDeleted` soft delete, has many `Image`.
- `Image`: belongs to `Category` (`categoryId`), has many `ImageTag`, `isDeleted` soft delete.
- `Tag`: `name` unique, `isDeleted` soft delete, has many `ImageTag`.
- `ImageTag`: join table (`imageId`, `tagId`), also has `isDeleted` in schema (treat as soft delete in relationship operations).

## Auth & Token

- Login/Register responses include `data.token` (and server may also set cookie `jwt`).
- Clients send token via:
  - `Authorization: Bearer <token>` (preferred), or
  - cookie `jwt` (browser flows)

## API Surface

Base URL: `http://localhost:5001`

### Auth

- `POST /auth/register` (public)
  - body: `{ name, email, phone, password }`
  - response: `{ status, message, data: { user, token } }`
- `POST /auth/login` (public)
  - body: `{ email, password }`
  - response: `{ status, message, data: { user, token } }`
- `POST /auth/logout` (protected)

### Categories

- `GET /categories` (public)
  - returns only `isDeleted=false`
- `POST /categories` (protected)
  - body: `{ name }`
- `PUT /categories/:id` (protected)
  - body: `{ name }`
- `DELETE /categories/:id` (protected)
  - sets `isDeleted=true`

### Tags

- `GET /tags` (public)
  - returns only `isDeleted=false`
- `POST /tags` (protected)
  - body: `{ name }`
- `PUT /tags/:id` (protected)
  - body: `{ name }`
- `DELETE /tags/:id` (protected)
  - sets `isDeleted=true`

### Images

- `GET /images` (public)
  - query (optional): `categoryId`, `tagId`
  - returns only `isDeleted=false` and only tags not deleted
- `GET /images/:id` (public)
- `POST /images` (protected)
  - body: `{ name, url, categoryId, tagIds?: number[] }`
- `PUT /images/:id` (protected)
  - body: `{ name?, url?, categoryId?, tagIds?: number[] }`
  - if `tagIds` provided: replace tags to match list (idempotent)
- `DELETE /images/:id` (protected)
  - sets `isDeleted=true`

### Image ↔ Tag Relationship (ImageTag)

- `GET /images/:id/tags` (public)
- `POST /images/:id/tags` (protected)
  - body: `{ tagIds: number[] }`
  - behavior: create missing relations; if relation exists but `isDeleted=true`, undelete it
- `DELETE /images/:id/tags/:tagId` (protected)
  - behavior: soft delete the relation (`isDeleted=true`)

## Response Shape

Consistent envelope:

```json
{
  "status": "success",
  "message": "...",
  "data": { }
}
```

Errors:

```json
{ "error": "..." }
```

## Validation & Error Mapping

- `400` for invalid input or uniqueness violations.
- `401` for missing/invalid token.
- `404` when record not found or is soft-deleted.
- Prisma error mapping:
  - Unique constraint → `400` with friendly message.

## Implementation Sketch (File Layout)

- Routers
  - `src/routers/authRoutes.js` (already)
  - `src/routers/categoryRoutes.js` (exists; fix logic + add auth)
  - `src/routers/tagRoutes.js` (new)
  - `src/routers/imageRoutes.js` (new, includes `/images/:id/tags`)
- Controllers
  - `src/controllers/authController.js` (already)
  - `src/controllers/categoryController.js` (fix)
  - `src/controllers/tagController.js` (new)
  - `src/controllers/imageController.js` (new)
- Middleware
  - `src/middleware/authMiddleware.js` (already; used on protected routes)
- Utilities
  - (optional) `src/utils/prismaErrors.js` to map Prisma codes

## Acceptance Criteria

- All endpoints above exist and match auth policy A.
- Soft delete enforced in `GET` queries.
- Image-tag operations work via relationship endpoints.
- `seed:category` still works; add a similar `seed:tag` only if needed.

