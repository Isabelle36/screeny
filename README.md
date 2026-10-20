# Screeny

App Store screenshots, actually worth stealing from.

Screeny is a hand-picked gallery of App Store screenshots from well-designed iOS apps. Browse by category, open any app to see its full screenshot set, copy or download the ones you like, and save them to your account for later.

If you find Screeny useful, please star this repository to help others discover it.

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
- **Bookmarks:** save screenshot sets to your account and sync them across devices. App icons can be copied or downloaded from the expanded icon viewer.
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

2. **Create `.env` from the example.**

   ```bash
   cp .env.example .env
   ```

   Fill in `DATABASE_URL` and `DIRECT_URL` with a development Postgres database, and use valid Clerk development keys for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. These are needed to render the gallery and use authenticated features. The example's placeholder values let the Next.js dev process start, but they cannot render the gallery: the home page queries Postgres and Clerk rejects invalid keys. A working database with the Prisma schema and app records is required. Use a separate Neon development branch; do not point local experiments at production.

   `R2_*` credentials and `R2_PUBLIC_URL` are only needed to import or refresh app assets, or to use the same-origin image route. `RESEND_API_KEY` is optional and only enables submission email; `SUBMISSIONS_FROM_EMAIL` is optional and has a default. `NEXT_PUBLIC_SITE_URL` is optional and defaults to the hosted Screeny URL. See the comments in `.env.example` for each variable.

   In your Clerk development application, enable **Email verification code**, **Google** and **X**, and turn **Password** off. Production Clerk keys only work on their configured production domain.

3. **Create the tables and start the app.**

   ```bash
   npx prisma db push
   npm run dev
   ```

   Then open http://localhost:3000. Next.js 16 requires Node.js 20.9.0 or newer.

### Adding apps

```bash
npm run import:apps -- <track-ids.json> [--dry-run]   # add apps from a JSON list of App Store IDs
npm run update:curated                                # refresh curated apps with their latest screenshots
```

### Deploying

The app deploys to Vercel as a standard Next.js project. Set the environment variables above in the project settings. Set `NEXT_PUBLIC_SITE_URL` to the production HTTPS domain so canonical URLs, social previews, `robots.txt`, and the sitemap all use the public domain. The build runs `prisma generate` automatically.

## Credits

The screenshots, icons and app names shown in Screeny belong to the developers and designers who made them. Screeny doesn't claim ownership of any of it and isn't affiliated with Apple or with any app shown. Every app links back to its App Store page.

If you made one of these apps and would rather it wasn't featured, or something is credited wrong, email alficodess@gmail.com or message [@watermelonCodes](https://x.com/watermelonCodes) on X, and it will be fixed or removed.

## Support

If Screeny helps you, you can [buy me a coffee](https://buymeacoffee.com/alficodessx) or star the repo. Issues and pull requests are welcome.

## Contributing

Bug reports, design feedback and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change, and follow the [Code of Conduct](CODE_OF_CONDUCT.md). For vulnerability reports, see [SECURITY.md](SECURITY.md).

## License

The Screeny source code is licensed under the [MIT License](LICENSE). App Store screenshots, app icons, app names and third-party marks are excluded; they remain the property of their respective owners. See [Credits](#credits) and [NOTICE.md](NOTICE.md) for details.
