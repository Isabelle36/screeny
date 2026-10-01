import { CardSkeleton } from '@/components/gallery/app-card';

const CHIP_WIDTHS = [52, 92, 104, 132, 112, 96, 124, 88];

// The whole page in skeleton form, matching the real layout box for box so nothing jumps when data arrives.
export function PageSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-dvh flex-col">
      <p className="sr-only" role="status">
        Loading screenshots…
      </p>

      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-[15px] md:px-8">
        <img src="/figma/logo.svg" alt="" width={113} height={30} className="-rotate-3" />
        <span className="skeleton block h-[45px] w-[min(623px,48vw)] rounded-full" />
        <span className="skeleton block size-9 justify-self-end rounded-lg" />
      </header>

      <section className="flex items-start justify-between gap-12 px-4 pb-16 pt-12 md:px-8 lg:pb-[88px]">
        <div className="w-full max-w-[811px] space-y-4">
          <span className="skeleton block h-14 w-[90%] rounded-2xl lg:h-[68px]" />
          <span className="skeleton block h-14 w-[70%] rounded-2xl lg:h-[68px]" />
          <span className="skeleton !mt-6 block h-6 w-[80%] max-w-[729px] rounded-full" />
          <span className="skeleton block h-6 w-[55%] rounded-full" />
          <span className="skeleton !mt-10 block h-[58px] w-[232px] rounded-full lg:!mt-[58px]" />
        </div>
        <div className="hidden shrink-0 lg:block">
          <CardSkeleton size="featured" as="div" />
        </div>
      </section>

      <div className="flex flex-1">
        <div className="hidden w-[267px] shrink-0 space-y-3 pl-8 pr-4 pt-[106px] md:block">
          <span className="skeleton block h-4 w-16 rounded-full" />
          <span className="skeleton !mt-5 block h-4 w-28 rounded-full" />
          <span className="skeleton block h-4 w-14 rounded-full" />
          <span className="skeleton block h-4 w-20 rounded-full" />
        </div>
        <div className="min-w-0 flex-1 px-4 pb-16 md:pl-0 md:pr-8">
          <div className="flex gap-3 overflow-hidden py-2.5 lg:gap-[25px]">
            {CHIP_WIDTHS.map((width, index) => (
              <span key={index} className="skeleton block h-[38px] shrink-0 rounded-full" style={{ width }} />
            ))}
          </div>
          <ul className="grid grid-cols-1 gap-x-[clamp(24px,4vw,68px)] gap-y-12 pt-[33px] sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-[65px]">
            {Array.from({ length: 6 }, (_, index) => (
              <CardSkeleton key={index} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
