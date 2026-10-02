'use client';

import { useId, type ReactNode } from 'react';
import { SubmitAppDrawer } from '@/components/submit/submit-app-drawer';
import { BackButton } from '@/components/ui/back-button';

const CONTACT_EMAIL = 'alficodess@gmail.com';
const X_URL = 'https://x.com/watermelonCodes';

const KICKER = 'text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted';
const INLINE_LINK =
  'cursor-pointer rounded-sm font-medium text-foreground underline decoration-border-strong underline-offset-[3px] transition-[text-decoration-color] duration-[120ms] hover:decoration-foreground';

type InfoViewProps = {
  appCount: number;
  onBack: () => void;
};

export function InfoView({ appCount, onBack }: InfoViewProps) {
  const email = (
    <a href={`mailto:${CONTACT_EMAIL}`} className={INLINE_LINK}>
      {CONTACT_EMAIL}
    </a>
  );

  return (
    <section aria-labelledby="info-title" className="pb-10">
      <BackButton onBack={onBack} />

      <article className="relative mx-auto mt-6 max-w-4xl md:mt-8">
        <div className="stamp-edge">
          <div className="rounded-[12px] bg-background px-5 py-9 shadow-[inset_0_0_0_1px_var(--card-border)] sm:px-10 md:rounded-[16px] md:px-16 md:py-14">
            <p className={KICKER}>Info · Letter No. 001</p>
            <h1 id="info-title" className="mt-3 max-w-[15ch] text-[2rem] leading-[1.08] font-semibold tracking-[-0.04em] text-card-title md:text-[2.75rem]">
              A note about these screenshots
            </h1>
            <p className="mt-5 max-w-[58ch] text-body leading-[1.6] text-muted md:text-body-lg md:leading-normal">
              Screeny is a small gallery of App Store screenshots I’ve picked by hand, {appCount} apps so far. Each one made the cut because its
              screenshots do something well: a sharp headline, a clever layout, a color you can’t stop looking at.
            </p>

            <Perforation />

            <div className="space-y-10">
              <LetterSection number="01" title="Credit where it’s due">
                <p>
                  None of these screenshots are mine, and I don’t take credit for any of them. The screenshots, icons and app names belong to the
                  developers and designers who made them. Every app links to its App Store page, so the credit, and the downloads, go to them.
                </p>
                <p>Screeny isn’t affiliated with Apple or with any app shown here.</p>
              </LetterSection>

              <LetterSection number="02" title="Use them as inspiration">
                <p>
                  Study them, save them, share them with your team. Just don’t pass them off as your own work or reuse them commercially without
                  the owner’s permission.
                </p>
              </LetterSection>

              <LetterSection number="03" title="Made one of these apps?">
                <p>
                  If you’d rather your app wasn’t here, or something is credited wrong, email {email} or message{' '}
                  <a href={X_URL} target="_blank" rel="noopener noreferrer" className={INLINE_LINK}>
                    @watermelonCodes on X<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  . I’ll fix it or take it down, no questions asked.
                </p>
                <p>
                  Want your app featured instead? <SubmitAppDrawer triggerClassName={INLINE_LINK} />.
                </p>
              </LetterSection>
            </div>

            <Perforation />

            <div className="grid gap-10 md:grid-cols-2 md:gap-14">
              <FinePrint
                title="Privacy"
                items={[
                  'No accounts, no ads, no analytics and no tracking cookies.',
                  'Bookmarks and your sound setting are saved only in your browser. They never reach a server, and clearing your browser data removes them.',
                  'If you submit an app, the App Store link and the optional name you type are stored so the app can be reviewed, and I get an email about it. Nothing else about you is collected.',
                  'The site runs on third-party hosting, database, image storage and email services, which may keep standard server logs, like IP addresses, to keep things running and secure.',
                  <>Personal data is never sold or shared. Questions? Email {email}.</>,
                ]}
              />
              <FinePrint
                title="Terms"
                items={[
                  'Screeny is free to browse and is provided as is, with no guarantee that listings are complete, accurate or always available.',
                  'Screenshots, app names, icons and trademarks belong to their respective owners. App Store is a trademark of Apple Inc.',
                  'Use the site for research and inspiration. Please don’t scrape it in bulk, disrupt it or try to access anything you shouldn’t.',
                  'By submitting an app, you confirm you’re allowed to share the link you send.',
                  'These notes may change over time. The date below shows the latest version.',
                ]}
              />
            </div>

            <Perforation />

            <footer className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-body text-muted">Thanks for looking closely,</p>
                <img src="/figma/screeny-eyes.svg" alt="" width={58} height={40} className="mt-4 -rotate-6" />
                <p className="mt-2 text-body font-semibold text-card-title">Screeny, curated by hand</p>
              </div>
              <p className="text-body-sm text-muted">
                Last updated <time dateTime="2026-10-02">October 2, 2026</time>
              </p>
            </footer>
          </div>
        </div>
      </article>
    </section>
  );
}

function Perforation() {
  return <div aria-hidden="true" className="my-10 border-t-2 border-dotted border-border-strong/40 md:my-12" />;
}

function LetterSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="grid gap-2 md:grid-cols-[96px_1fr] md:gap-8">
      <p aria-hidden="true" className="pt-1 text-body-sm tabular-nums text-muted">
        {number}
      </p>
      <div>
        <h2 id={headingId} className="text-body-lg font-semibold text-card-title">
          {title}
        </h2>
        <div className="mt-2.5 max-w-[62ch] space-y-3 text-body leading-[1.65] text-card-title/85">{children}</div>
      </div>
    </section>
  );
}

function FinePrint({ title, items }: { title: string; items: ReactNode[] }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-body font-semibold text-card-title">
        {title}
      </h2>
      <ol className="mt-4 space-y-3 text-body-sm leading-[1.6] text-muted">
        {items.map((item, index) => (
          <li key={index} className="grid grid-cols-[1.75rem_1fr]">
            <span aria-hidden="true" className="tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
