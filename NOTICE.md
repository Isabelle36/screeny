# Content and Attribution Notice

## Source code

Screeny's source code is licensed under the [MIT License](LICENSE).

## App Store content

App Store screenshots, app icons, app names, logos, trademarks and mascots shown in Screeny belong to their respective owners. The MIT License does not cover them. Screeny is not affiliated with Apple or any featured app, and each featured app links back to its App Store page.

The repository includes a small demo seed at `prisma/demo-seed.json` with app metadata and public URLs for third-party icons and screenshots. The image files remain hosted separately; the seed contains no image binaries or R2 credentials. The full gallery is not included in the repository. The import script retrieves app information and image URLs from Apple's public lookup API, converts images to WebP, uploads images to Cloudflare R2, and saves their URLs in Postgres. App Store content remains owned by its respective owners; this project does not grant rights to reuse it. Forks are responsible for the content they import and host.

The bundled login visuals in `public/figma/login-visual.webp` and `public/figma/login-visual-v2.webp` are Screeny's own promotional artwork. Contributors should not add third-party assets to the repository; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Takedowns and corrections

For a takedown or correction request, email [alficodess@gmail.com](mailto:alficodess@gmail.com) or contact [@watermelonCodes](https://x.com/watermelonCodes) on X.
