# Frontend API Integration Guide

This guide explains how frontend should use each API endpoint in the current codebase.

## Base URL and Response Shape

- Local base URL: `http://localhost:5001`
- No `/api` prefix. Use paths directly, for example `/auth/login`, `/images`.

Common success response:

```json
{
  "status": "success",
  "message": "...",
  "data": {}
}
```

Common error response:

```json
{
  "error": "..."
}
```

## Authentication

Protected endpoints accept either:

- `Authorization: Bearer <token>`
- Cookie `jwt` (set by login/register)

Frontend recommendations:

- If using bearer token, attach `Authorization` on protected requests.
- If using cookie auth, send `credentials: "include"`.

Auth failures return `401`.

## Endpoint Summary

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Register user |
| POST | `/auth/login` | No | Login |
| POST | `/auth/logout` | Yes | Logout |
| GET | `/categories` | No | List categories |
| POST | `/categories` | Yes | Create category |
| PUT | `/categories/:id` | Yes | Update category |
| DELETE | `/categories/:id` | Yes | Soft delete category |
| GET | `/tags` | No | List tags |
| POST | `/tags` | Yes | Create tag |
| PUT | `/tags/:id` | Yes | Update tag |
| DELETE | `/tags/:id` | Yes | Soft delete tag |
| GET | `/images` | No | List images, optional filters |
| GET | `/images/search` | No | Search images |
| GET | `/images/tags` | No | Get images by tag ids |
| GET | `/images/categories/:id/images` | No | Get images by category |
| GET | `/images/:id` | No | Get image detail |
| POST | `/images` | Yes | Create image record |
| PUT | `/images/upload-image` | Yes | Upload image file to S3 and update URL |
| PUT | `/images/:id` | Yes | Update image fields/tags |
| DELETE | `/images/:id` | Yes | Soft delete image |
| POST | `/images/:id/tags` | Yes | Add tags to image |
| DELETE | `/images/:id/tags/:tagId` | Yes | Remove tag from image |
| GET | `/users` | No | Test route only |
| POST | `/users` | Yes | Test route only |
| PUT | `/users/:id` | Yes | Test route only |
| DELETE | `/users/:id` | Yes | Test route only |

## Auth Endpoints

### `POST /auth/register`
Use for sign-up.

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0812345678",
  "password": "123456"
}
```

Validation:

- `name`: min 3 chars
- `email`: valid email
- `phone`: min 10 chars
- `password`: min 6 chars

Success: `201`

Returns user info and `token`, and also sets `jwt` cookie.

### `POST /auth/login`
Use for login.

Request body:

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

Success: `201` (current implementation)

Returns user info and `token`, and also sets `jwt` cookie.

### `POST /auth/logout` (protected)
Use for logout.

Success: `200`

Clears `jwt` cookie. Frontend should also clear local auth state.

## Category Endpoints

### `GET /categories`
Returns non-deleted categories.

### `POST /categories` (protected)
Create category.

```json
{ "name": "Nature" }
```

### `PUT /categories/:id` (protected)
Update category name.

```json
{ "name": "New Category" }
```

### `DELETE /categories/:id` (protected)
Soft delete (`isDeleted = true`).

Frontend usage:

- Management page for categories
- Dropdown source in image create/edit forms

## Tag Endpoints

### `GET /tags`
Returns non-deleted tags.

### `POST /tags` (protected)
Create tag.

```json
{ "name": "Landscape" }
```

### `PUT /tags/:id` (protected)
Update tag name.

```json
{ "name": "Portrait" }
```

### `DELETE /tags/:id` (protected)
Soft delete (`isDeleted = true`).

Frontend usage:

- Tag management page
- Tag filters

## Image Endpoints

### `GET /images`
List images.

Optional query:

- `categoryId` (number)
- `tagId` (number)

Examples:

- `/images`
- `/images?categoryId=1`
- `/images?tagId=2`
- `/images?categoryId=1&tagId=2`

### `GET /images/search`
Search by image name, category name, or tag name.

Query:

- `search` (string)

Example:

- `/images/search?search=nature`

### `GET /images/tags`
Get images by tags.

Supported query:

- `id=1` (single)
- `ids=1,2,3` (multiple)

### `GET /images/categories/:id/images`
Get images by category id.

### `GET /images/:id`
Get one image detail.

### `POST /images` (protected)
Create image metadata record first.

```json
{
  "name": "Sunset",
  "url": "",
  "categoryId": 1,
  "tagIds": [1, 2]
}
```

Notes:

- `categoryId` required
- `tagIds` optional
- `url` can be empty before file upload

### `PUT /images/upload-image` (protected, multipart/form-data)
Upload real image file and update image URL.

Form-data fields:

- `imageId`: number
- `file`: image file (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`)

### `PUT /images/:id` (protected)
Partial update. Send at least one of:

- `name`
- `url`
- `categoryId`
- `tagIds`

Example:

```json
{
  "name": "New name",
  "categoryId": 2,
  "tagIds": [1, 3]
}
```

When `tagIds` is sent, backend syncs image-tag relations to match the new list.

### `DELETE /images/:id` (protected)
Soft delete image (`isDeleted = true`).

### `POST /images/:id/tags` (protected)
Add tags to image.

```json
{ "tagIds": [2, 4] }
```

### `DELETE /images/:id/tags/:tagId` (protected)
Remove one tag from image.

Frontend flow recommendation:

1. Create image record via `POST /images`
2. Upload file via `PUT /images/upload-image`
3. Optionally adjust tags via tag endpoints

## Users Routes (Current State)

`/users` routes are test stubs only, not real business endpoints yet.

- `GET /users` returns `{ "httpMethod": "GET" }`
- `POST/PUT/DELETE` require auth and return method-only payloads

Do not rely on `/users` for production user features yet.

## Error Handling Guidance for Frontend

Common status codes:

- `400`: validation/payload error
- `401`: auth/token error
- `404`: resource not found
- `500`: server/internal error

Recommended handling:

- Show backend `error` text in toast/alert
- On `401`, reset auth state and redirect to login
- For upload, handle file-size and invalid-file errors

## Suggested API Wrapper Pattern

```ts
async function apiRequest(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`http://localhost:5001${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Request failed");
  return data;
}
```

For multipart upload, do not manually set `Content-Type`; let browser set boundary.

## Quick Checklist

- Set `BASE_URL = http://localhost:5001`
- Add auth store (`token`, `user`, login state)
- Add request helper/interceptor for auth headers + credentials
- Load categories/tags for create/edit forms
- Use 2-step image create flow: metadata then file upload
- Handle `400/401/404/500` globally
