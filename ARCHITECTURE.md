# Architecture

## App Router

- `app/page.tsx` loads the gallery; `app/mascots/page.tsx` loads the mascot-filtered gallery.
- `app/sign-in/`, `app/sign-up/` and `app/sso-callback/` host Clerk authentication flows.
- `app/api/` contains the app detail, bookmark, account and image route handlers. `app/actions/` contains app submission actions.
- `app/layout.tsx` provides the shared document shell and Clerk provider. Interactive UI lives in `components/`, with reusable client state in `hooks/`.

## App data import

1. `scripts/import-apps.ts` parses App Store IDs and calls `scripts/app-store-lookup.ts`, which uses Apple's public lookup API.
2. `scripts/ingest.ts` converts source images to WebP with `sharp`, uploads them to Cloudflare R2, and writes app metadata and image URLs to Postgres through Prisma.
3. `scripts/refresh-apps.ts` checks for app updates; `scripts/update-curated.ts` reingests curated apps. Backfill scripts update stored derived data.
4. The gallery reads app records and screenshot URLs from Postgres via `lib/db/` and renders images hosted in R2.

## Authentication and bookmarks

Clerk provides client sign-in state and server-side session verification. The browser can keep pending/offline bookmarks in IndexedDB (`lib/bookmarks-store.ts`) and sync them through `app/api/bookmarks/route.ts`. The route calls Clerk's server `auth()` and takes the user ID from that verified session; it does not accept a user ID from the request body. `lib/db/bookmarks.ts` scopes reads, inserts and deletes by that ID, and the `Bookmark` model uses `(userId, kind, appId)` as its key.

## Images

`app/api/image/route.ts` is the same-origin image route used by copy and download helpers. It only proxies image URLs whose origin matches `R2_PUBLIC_URL`; copy helpers can then convert image data to the format accepted by the clipboard.
