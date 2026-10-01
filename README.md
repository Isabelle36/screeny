# Screeny

App Store screenshots, actually worth stealing from.

Screeny is a gallery of App Store screenshots from well-designed iOS apps. You can browse by category, open any app to see its full screenshot set, copy or download the ones you like, and save them for later.

## Why I built it

A lot of people build genuinely good iOS apps. Then they hit the App Store page and it falls apart.

Most people decide whether to download an app in about five seconds, and in those five seconds they mostly look at your screenshots. If the screenshots don't explain what the app does and why it helps, the visitor is gone, however good the app is behind them.

Designing those screenshots is hard. Most developers aren't marketers, and the usual advice ("show the value, not the features") doesn't tell you what a good screenshot actually looks like. The fastest way to learn is to look at a lot of good ones side by side.

That's what Screeny is for. You can:

- find screenshot ideas from apps that do it well, sorted by category
- see an app's whole screenshot story in one row, the way it reads on the App Store
- save what you like (no account, it stays in your browser)
- copy any screenshot straight into Figma, or download it
- grab app icons for reference from the Icons tab
- suggest an app that deserves to be in the gallery

## What it does

- **Gallery:** one card per app with its first three screenshots, filtered by category chips or the sidebar (Screenshots, Icons, Mascots).
- **App view:** clicking a card opens the app in place, with the sidebar and nav still there. It shows the description, rating and every screenshot in a single scrolling row. Hover a screenshot to expand, copy or select it. Back takes you to exactly where you were in the grid.
- **Viewer:** a full-size view with arrow keys, thumbnails, copy and download.
- **Search:** ⌘K opens a command palette for apps, categories and tabs.
- **Bookmarks:** saved locally in IndexedDB, so it works without logging in.
- **Submit an app:** a drawer where anyone can send an App Store link. Submissions are reviewed by hand before anything shows up in the gallery.
- **Small things:** quiet interface sounds (with a mute switch), springy motion that respects reduced-motion settings, and a little WebGL wave in the submit drawer.

## Hard parts

Some things took far longer than I expected:

- **Matching the Figma design.** The headline came out about 10% wider than in Figma. It turned out Figma exports `opsz 14` for DM Sans but renders with automatic optical sizing, so the fix was to stop forcing the axis. Card corners were another one: CSS `corner-shape: squircle` looked tighter than Figma's plain radius, so I went back to a normal radius with Figma's exact proportions.
- **Card backgrounds.** My first idea was to pull an accent colour from each app's icon and tint its card with it. I built the whole thing (sampling pixels in OKLab, scoring hues against the screenshot edges) and it worked, but the grid looked noisy. I dropped it for two calm greys. The pipeline now only checks whether an app's screenshots are mostly dark mode and picks the darker grey for those.
- **Returning to the same spot.** Closing an app view should drop you back on the card you clicked. Restoring the saved scroll offset didn't work, because the grid uses `content-visibility` and cards above you measure differently after they remount. The fix was to anchor on the card itself and re-align once more after the browser's own scroll restoration runs.
- **Keeping 200+ cards smooth.** Collapsing the sidebar used to reflow the whole grid every frame. It now changes width once and animates the cards with FLIP transforms, so only transforms move.
- **Copying images.** Clipboards only accept PNG, the screenshots are WebP, and they live on another domain. A small same-origin image route plus a canvas re-encode made Copy work.
- **Prisma on Windows.** The running dev server locks Prisma's engine file, so every schema change meant stopping the server, pushing and restarting.
- **Accessibility.** Several greys from the design failed WCAG AA contrast, so text uses a darker grey and icons are inked through CSS. Everything is reachable by keyboard, and focus goes back where it came from.

## Tech stack

- **Next.js 16** (App Router, Turbopack) with **React 19** and **TypeScript**
- **Tailwind CSS 4** for styling
- **Prisma** with **Neon Postgres** for apps, screenshots and submissions
- **Cloudflare R2** for screenshot and icon storage
- **sharp** to convert App Store images to WebP and analyse them at ingest
- **Motion** for springs and the sidebar dot, **cmdk** for the command palette, **Vaul** for the drawer
- **cuelume** and **@web-kits/audio** for synthesized interface sounds
- **WebGL** for the drawer's wave shader
- **Resend** for submission emails

## How the data gets in

`scripts/ingest.ts` takes an App Store ID, reads the app from Apple's lookup API, converts the icon and screenshots to WebP, uploads them to R2 and writes everything to Postgres. It also decides whether the screenshots are mostly dark mode. `npm run update:curated` re-runs it for the curated apps to pick up new screenshots.

## Running it locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file:

   ```bash
   DATABASE_URL=        # Postgres (Neon pooled connection)
   DIRECT_URL=          # Postgres direct connection, used by Prisma
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET_NAME=
   R2_PUBLIC_URL=       # public base URL of the bucket
   RESEND_API_KEY=      # optional: emails new app submissions
   ```

3. Create the tables and start the app:

   ```bash
   npx prisma db push
   npm run dev
   ```

Then open http://localhost:3000.

## Built for

The FirstCommit hackathon, October 2026.
