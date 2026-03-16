# REST API Completion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete REST API for `User`, `Category`, `Image`, `Tag`, `ImageTag` per `prisma/schema.prisma` and the approved design.

**Architecture:** Express routers map to controllers; controllers use Prisma for DB access. `authMiddleware` enforces auth on protected routes. Soft delete is implemented via `isDeleted` filters and update-on-delete.

**Tech Stack:** Node.js (ESM), Express 5, Prisma (with `@prisma/adapter-pg` + `pg` Pool), JWT, Postgres (Docker).

---

## Chunk 1: Baseline and shared utilities

### Task 1: Ensure server wires routers correctly

**Files:**
- Modify: `src/server.js`

- [ ] **Step 1: Add route mounting for categories/tags/images**
  - Mount:
    - `/categories` → `categoryRoutes`
    - `/tags` → `tagRoutes`
    - `/images` → `imageRoutes`

- [ ] **Step 2: Run dev server smoke check**
  - Run: `npm run dev`
  - Expected: server starts; no immediate crash.

- [ ] **Step 3: Commit**
  - Run:
    ```bash
    git add src/server.js
    git commit -m "feat: mount category/tag/image routes"
    ```

### Task 2: Add Prisma error mapping helper

**Files:**
- Create: `src/utils/prismaErrors.js`
- Modify: `src/controllers/*.js` (as needed)

- [ ] **Step 1: Add `toHttpError(error)` utility**
  - Map common Prisma errors:
    - Unique constraint (`P2002`) → `400`
    - Record not found (`P2025`) → `404`
  - Default → `500`

- [ ] **Step 2: Update controllers to use helper**
  - Wrap controller bodies in try/catch and respond with mapped status/message.

- [ ] **Step 3: Commit**
  - Run:
    ```bash
    git add src/utils/prismaErrors.js src/controllers
    git commit -m "feat: map Prisma errors to HTTP responses"
    ```

## Chunk 2: Categories (fix existing)

### Task 3: Fix category controller logic and protect writes

**Files:**
- Modify: `src/controllers/categoryController.js`
- Modify: `src/routers/categoryRoutes.js`

- [ ] **Step 1: Fix `createCategory` logic**
  - Current bug: returns 404 when category does not exist (inverted condition).
  - Correct behavior:
    - If a non-deleted category with same name exists → `400`
    - Else create with `isDeleted=false`

- [ ] **Step 2: Make `GET /categories` public; protect others**
  - Router behavior:
    - `router.get("/")` public
    - `router.post/put/delete` use `authMiddleware`

- [ ] **Step 3: Ensure soft delete respected**
  - `getCategories` returns only `isDeleted=false`
  - `deleteCategory` sets `isDeleted=true`

- [ ] **Step 4: Manual verification**
  - Run: `npm run dev`
  - Call:
    - `GET /categories` works without token
    - `POST /categories` returns `401` without token

- [ ] **Step 5: Commit**
  - Run:
    ```bash
    git add src/controllers/categoryController.js src/routers/categoryRoutes.js
    git commit -m "fix: categories CRUD with auth and soft delete"
    ```

## Chunk 3: Tags CRUD

### Task 4: Implement Tag controller and router

**Files:**
- Create: `src/controllers/tagController.js`
- Create: `src/routers/tagRoutes.js`

- [ ] **Step 1: Implement `getTags` (public)**
  - Filter `isDeleted=false`

- [ ] **Step 2: Implement `createTag` (protected)**
  - Unique by `name`

- [ ] **Step 3: Implement `updateTag` (protected)**
  - Validate tag exists and not deleted

- [ ] **Step 4: Implement `deleteTag` (protected, soft delete)**

- [ ] **Step 5: Wire router auth policy**
  - `GET /tags` public, other methods protected by `authMiddleware`

- [ ] **Step 6: Manual verification**
  - `GET /tags` works without token
  - `POST /tags` requires token

- [ ] **Step 7: Commit**
  - Run:
    ```bash
    git add src/controllers/tagController.js src/routers/tagRoutes.js
    git commit -m "feat: tags CRUD with auth and soft delete"
    ```

## Chunk 4: Images CRUD + query filters

### Task 5: Implement Image controller and router

**Files:**
- Create: `src/controllers/imageController.js`
- Create: `src/routers/imageRoutes.js`

- [ ] **Step 1: Implement `getImages` (public)**
  - Filter `isDeleted=false`
  - Optional query params:
    - `categoryId` (number)
    - `tagId` (number; via `ImageTag` where `isDeleted=false` and tag not deleted)

- [ ] **Step 2: Implement `getImageById` (public)**
  - Include `category` + tags list (only non-deleted).

- [ ] **Step 3: Implement `createImage` (protected)**
  - Validate `categoryId` exists and not deleted
  - Create `Image`
  - If `tagIds` provided:
    - validate tags exist and not deleted
    - create `ImageTag` relations (skip duplicates)

- [ ] **Step 4: Implement `updateImage` (protected)**
  - Update fields if provided
  - If `tagIds` provided: replace set (soft delete missing, upsert present)

- [ ] **Step 5: Implement `deleteImage` (protected, soft delete)**

- [ ] **Step 6: Wire router auth policy**
  - `GET /images` and `GET /images/:id` public
  - `POST/PUT/DELETE` protected

- [ ] **Step 7: Manual verification**
  - `GET /images` works without token
  - `POST /images` requires token

- [ ] **Step 8: Commit**
  - Run:
    ```bash
    git add src/controllers/imageController.js src/routers/imageRoutes.js
    git commit -m "feat: images CRUD with filters and soft delete"
    ```

## Chunk 5: Image ↔ Tag relationship endpoints

### Task 6: Implement `/images/:id/tags` management

**Files:**
- Modify: `src/controllers/imageController.js`
- Modify: `src/routers/imageRoutes.js`

- [ ] **Step 1: Add `getImageTags` (public)**
  - Return tags for image where relation `isDeleted=false` and tag `isDeleted=false`

- [ ] **Step 2: Add `addImageTags` (protected)**
  - Body: `{ tagIds: number[] }`
  - For each tagId:
    - If relation exists with `isDeleted=true` → set to `false`
    - Else create relation

- [ ] **Step 3: Add `removeImageTag` (protected)**
  - Soft delete the relation: `isDeleted=true`

- [ ] **Step 4: Manual verification**
  - Add tags then list, then remove one.

- [ ] **Step 5: Commit**
  - Run:
    ```bash
    git add src/controllers/imageController.js src/routers/imageRoutes.js
    git commit -m "feat: manage image tags via relationship endpoints"
    ```

## Chunk 6: Auth routes and middleware consistency

### Task 7: Ensure auth policy A is enforced everywhere

**Files:**
- Modify: `src/routers/authRoutes.js`
- Modify: `src/routers/categoryRoutes.js`
- Modify: `src/routers/tagRoutes.js`
- Modify: `src/routers/imageRoutes.js`

- [ ] **Step 1: Verify only intended routes are protected**
  - `/auth/login`, `/auth/register` public
  - All GET routes public
  - All write routes protected

- [ ] **Step 2: Commit**
  - Run:
    ```bash
    git add src/routers
    git commit -m "chore: enforce auth policy A across routers"
    ```

## Chunk 7: Verification & developer ergonomics

### Task 8: Add minimal health endpoint (optional but helpful)

**Files:**
- Modify: `src/server.js`

- [ ] **Step 1: Add `GET /health`**
  - Response: `{ status: "ok" }`

- [ ] **Step 2: Commit**
  - Run:
    ```bash
    git add src/server.js
    git commit -m "feat: add health endpoint"
    ```

### Task 9: Run full smoke test sequence

**Files:**
- None (command-only)

- [ ] **Step 1: Ensure Docker services are up**
  - Run: `docker compose up -d`
  - Expected: postgres + redis `Up`

- [ ] **Step 2: Start server**
  - Run: `npm run dev`
  - Expected: `Database connected` + `Server is running on port 5001`

- [ ] **Step 3: Exercise endpoints**
  - Use Bruno or curl:
    - `GET /categories`, `GET /tags`, `GET /images` without auth
    - Login to get token
    - `POST /categories` with auth
    - `POST /tags` with auth
    - `POST /images` with auth
    - `POST /images/:id/tags` with auth

---

Plan complete and saved to `docs/superpowers/plans/2026-03-17-rest-api-completion.md`. Ready to execute?

