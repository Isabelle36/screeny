import { prisma } from '@/lib/prisma';
import { GalleryImage } from './components/gallery-image';

export default async function Page() {
  const apps = await prisma.app.findMany({
    orderBy: { name: 'asc' },
    include: {
      screenshots: {
        orderBy: { position: 'asc' },
        take: 10,
      },
    },
  });

  const screenshotCount = apps.reduce((total, app) => total + app.screenshots.length, 0);

  return (
    <main className="min-h-screen bg-[#f3f0ea] text-[#1f2823]">
      <header className="border-b border-[#d9d3c8] bg-[#f8f6f1] px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#758078]">
              Screeny library
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              App screenshots
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#68726c]">
              Every captured screen, grouped by app and ordered as it appears in the App Store.
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-3xl font-semibold tabular-nums">{apps.length}</div>
            <div className="text-xs uppercase tracking-[0.16em] text-[#758078]">apps</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c9c2b6] bg-[#f8f6f1] px-6 py-20 text-center">
            <h2 className="text-xl font-semibold">No screenshots yet</h2>
            <p className="mt-2 text-sm text-[#68726c]">Ingest an app to start building your library.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {apps.map((app) => (
              <section key={app.id}>
                <div className="mb-5 flex items-center gap-3">
                  {app.iconUrl ? (
                    <img src={app.iconUrl} alt="" className="h-11 w-11 rounded-xl object-cover shadow-sm" />
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-[#d8d1c4]" />
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{app.name}</h2>
                    <p className="truncate text-sm text-[#758078]">{app.developer} · {app.screenshots.length} screens</p>
                  </div>
                  {app.curated && (
                    <span className="ml-auto rounded-full bg-[#dce8d8] px-3 py-1 text-xs font-medium text-[#3d6948]">Curated</span>
                  )}
                </div>

                {app.screenshots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10">
                    {app.screenshots.map((screenshot) => (
                      <a
                        key={screenshot.id}
                        href={screenshot.r2Url}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-xl border border-[#d9d3c8] bg-[#e7e2d9] shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                      >
                        <GalleryImage
                          src={screenshot.r2Url}
                          alt={`${app.name} screenshot ${screenshot.position + 1}`}
                          className="aspect-9/19.5 w-full object-cover"
                        />
                        <div className="px-2 py-1.5 text-center text-[11px] tabular-nums text-[#758078] group-hover:text-[#1f2823]">
                          {String(screenshot.position + 1).padStart(2, '0')}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-[#c9c2b6] px-4 py-8 text-center text-sm text-[#758078]">
                    No screenshots stored for this app.
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      <footer className="mx-auto max-w-7xl px-6 pb-10 text-xs text-[#8b938c] sm:px-10">
        {screenshotCount} screenshots · refreshed from your local catalog
      </footer>
    </main>
  );
}
