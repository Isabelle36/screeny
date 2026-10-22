# Contributing to Screeny

Thanks for taking the time to improve Screeny. Bug reports, accessibility feedback, design suggestions and pull requests are welcome.

## Before you start

- For a large change, open an issue first so we can agree on the direction.
- Keep changes focused and consistent with the existing interface and code style.
- Do not commit credentials, `.env` files, personal data or production database records.
- Don't commit third-party screenshots, icons or marks to this repo. App data only goes through the import script.
- Don't open PRs to add new apps. The gallery is hand-curated. Suggest apps through the Submit form in the app.

## Where to look

| Area | Folder | What's there |
| --- | --- | --- |
| Routes and server actions | `app/` | App Router pages, API routes and form actions |
| UI | `components/` | Gallery, app viewer, navigation and reusable controls |
| Data and utilities | `lib/` | Prisma queries, bookmark storage, image and shared helpers |
| Client state | `hooks/` | Bookmark, viewer, auth-modal and other client hooks |
| Database | `prisma/` | Prisma schema and models |
| App data scripts | `scripts/` | Apple lookup, import, refresh and backfill scripts |

## Local setup

1. Use Node.js 20.9.0 or newer (the minimum required by Next.js 16) and install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in development values. A working development Clerk instance and Postgres database with Screeny's schema and app data are required to render the gallery. `R2_*` values are only needed for app import/refresh scripts; `RESEND_API_KEY` and `SUBMISSIONS_FROM_EMAIL` are optional submission-email settings. `DIRECT_URL` is used by Prisma commands that need the direct database connection.
3. Run `npx prisma db push` against your development database, then run `npm run seed:demo` to add 20 sample apps with their public icon and screenshot URLs. The seed uses the hosted public image URLs, so it does not need R2 credentials. Point `DATABASE_URL` at your own development database before running it.
4. Start the app with `npm run dev`.

The development server can start with placeholder values, but the gallery will not render without a reachable database, and Clerk features need valid Clerk development keys. No R2 or Resend account is needed for browsing after the demo seed is loaded.

## Make a change

1. Create a branch from the current default branch. Use a short name such as `fix/bookmark-feedback` or `docs/contributing`.
2. Make the smallest complete change that addresses the issue.
3. Run the relevant checks before submitting:

   ```sh
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

4. Commit with a concise imperative message. Conventional prefixes such as `feat:`, `fix:`, `docs:` and `chore:` are preferred.

AI-assisted PRs are fine if you have run and tested the change.

## Open a pull request

Include what changed and why, how you checked it, any related issue, and before-and-after screenshots or a short recording for visual changes. Please keep pull requests focused. Maintainers may ask for changes before merging.

Contributions are licensed under the [MIT License](LICENSE). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting security issues

Please see [SECURITY.md](SECURITY.md) for private vulnerability reporting.
