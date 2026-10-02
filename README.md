# Screeny

App Store screenshots, actually worth stealing from.

Screeny is a hand-picked gallery of App Store screenshots from well-designed iOS apps. Browse by category, open any app to see its full screenshot set, copy or download the ones you like, and save them to your account for later.

If you find it useful, a ⭐ on this repo helps other people find it.

## The problem

A lot of people build genuinely good iOS apps, then lose people on the App Store page.

Most visitors decide whether to download an app in a few seconds, and in those seconds they mostly look at the screenshots. If the screenshots don't explain what the app does and why it helps, the visitor scrolls on, however good the app is behind them.

Designing those screenshots is hard. Most developers aren't marketers, and advice like "show the value, not the features" doesn't tell you what a good screenshot actually looks like. The fastest way to learn is to look at a lot of good ones side by side.

## Why Screeny

- **Curated, not scraped.** Every app is picked by hand because its screenshots do something well: a sharp headline, a clever layout, a strong use of colour.
- **The whole story, not one image.** Open an app and see its full screenshot set in one row, in the order it reads on the App Store.
- **Built for working designers.** Copy a screenshot straight into Figma, download one or a whole selection, or grab the app icon.
- **Saved where you need it.** Log in with an email code, Google or X, and your bookmarks follow you to any device. No passwords.
- **Fast and calm.** No ads, no tracking, no clutter. It works well on phones too.

## Features

- **Gallery:** one card per app with its first three screenshots, filtered by category or by Screenshots, Icons and Mascots.
- **App page:** opens in place, with the description, rating, price, developer and every screenshot in a single scrolling row. Select screenshots to copy or download them together.
- **Viewer:** a full-size view with arrow-key navigation, thumbnails, copy and download.
- **Search:** ⌘K / Ctrl+K opens a command palette for apps and categories.
- **Bookmarks:** saved to your account and synced across devices.
- **Submit an app:** anyone can suggest an App Store link. Submissions are reviewed by hand before anything appears in the gallery.
- **Accessible by default:** keyboard navigation throughout, visible focus, WCAG AA contrast, screen-reader labels, and motion that respects reduced-motion settings.
- **Small details:** quiet interface sounds with a mute switch, spring-based motion and a responsive layout from 320px phones up.

## Tech stack

- **Next.js 16** (App Router, Turbopack) with **React 19** and **TypeScript**
- **Tailwind CSS 4** for styling
- **Prisma** with **Neon Postgres** for apps, screenshots, submissions and bookmarks
- **Clerk** for passwordless sign-in (email code, Google, X)
- **Cloudflare R2** for screenshot and icon storage
- **sharp** to convert App Store images to WebP and analyse them on import
- **Motion** for springs, **cmdk** for the command palette, **Vaul** for the drawer
- **@web-kits/audio** for synthesized interface sounds
- **Resend** (optional) for submission notification emails

## How it works

- **Importing apps:** `scripts/ingest.ts` reads an app from Apple's public lookup API, converts its icon and screenshots to WebP, uploads them to R2 and writes everything to Postgres. It also detects whether the screenshots are mostly dark mode so the card frame can match.
- **Bookmarks:** each saved app is one row in a `Bookmark` table, keyed by the signed-in user's ID. The API takes the user ID from the verified session on the server, so nobody can read or change anyone else's bookmarks.
- **Images:** copy and download go through a small same-origin image route, because clipboards only accept PNG and the screenshots are WebP files on another domain.

## Running it locally

1. **Install dependencies.**

   ```bash
   npm install
   ```

2. **Create `.env` and `.env.local`.**

   ```bash
   # .env
   DATABASE_URL=          # Postgres pooled connection (Neon), add &connect_timeout=30 for cold starts
   DIRECT_URL=            # Postgres direct connection, used by Prisma
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET_NAME=
   R2_PUBLIC_URL=         # public base URL of the bucket
   RESEND_API_KEY=        # optional: emails new app submissions

   # .env.local
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   ```

   In your Clerk application, enable **Email verification code**, **Google** and **X**, and turn **Password** off. With the Clerk CLI linked to your app, `clerk env pull` writes the two Clerk keys for you.

3. **Create the tables and start the app.**

   ```bash
   npx prisma db push
   npm run dev
   ```

   Then open http://localhost:3000.

### Adding apps

```bash
npm run import:apps -- <track-ids.json> [--dry-run]   # add apps from a JSON list of App Store IDs
npm run update:curated                                # refresh curated apps with their latest screenshots
```

### Deploying

The app deploys to Vercel as a standard Next.js project. Set the environment variables above in the project settings. The build runs `prisma generate` automatically.

## Credits

The screenshots, icons and app names shown in Screeny belong to the developers and designers who made them. Screeny doesn't claim ownership of any of it and isn't affiliated with Apple or with any app shown. Every app links back to its App Store page.

If you made one of these apps and would rather it wasn't featured, or something is credited wrong, email alficodess@gmail.com or message [@watermelonCodes](https://x.com/watermelonCodes) on X, and it will be fixed or removed.

## Support

If Screeny helps you, you can [buy me a coffee](https://buymeacoffee.com/alficodessx) or star the repo. Issues and pull requests are welcome.
