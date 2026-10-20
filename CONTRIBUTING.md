# Contributing to Screeny

Thanks for taking the time to improve Screeny. Bug reports, accessibility feedback, design suggestions and pull requests are welcome.

## Before you start

- For a large change, open an issue first so we can agree on the direction.
- Keep changes focused and consistent with the existing interface and code style.
- Do not commit credentials, `.env` files, personal data or production database records.
- App Store screenshots, icons, names and third-party marks belong to their respective owners. Do not add or redistribute them without permission.

## Local setup

1. Install dependencies with `npm install`.
2. Configure `.env` and `.env.local` using the variable names in the README.
3. Use Clerk development keys and a separate Neon development branch. Never point a local development server at the production database.
4. Run `npx prisma db push` against the development database, then start the app with `npm run dev`.

## Make a change

1. Create a branch from the current default branch. Use a short name such as `fix/bookmark-feedback` or `docs/contributing`.
2. Make the smallest complete change that addresses the issue.
3. Run the relevant checks before submitting:

   ```sh
   npm run lint
   npx tsc --noEmit
   ```

4. Commit with a concise imperative message. Conventional prefixes such as `feat:`, `fix:`, `docs:` and `chore:` are preferred.

## Open a pull request

Include:

- What changed and why.
- How you checked the change, including any checks you could not run.
- Before-and-after screenshots or a short recording for visual changes.
- Any related issue, if one exists.

Please keep pull requests focused. Maintainers may ask for changes before merging.

## Reporting security issues

Do not post credentials or exploitable security details in a public issue. Contact the maintainer privately using the email in the README.
