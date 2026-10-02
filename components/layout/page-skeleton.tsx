import { CardSkeleton } from '@/components/gallery/app-card';

const CHIP_WIDTHS = [52, 92, 104, 132, 112, 96, 124, 88];

export function PageSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-dvh flex-col">
      <p className="sr-only" role="status">
        Loading screenshots…
      </p>

      <header className="flex items-center gap-3 px-4 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 md:px-8 md:py-[15px]">
        <img src="/figma/screeny-eyes.svg" alt="" width={42} height={29} className="shrink-0 md:hidden" />
        <img src="/figma/logo.svg" alt="" width={113} height={30} className="hidden -rotate-3 md:block" />
        <span className="skeleton block h-10 min-w-0 flex-1 rounded-full md:h-[45px] md:w-[min(623px,48vw)] md:flex-none" />
        <span className="flex shrink-0 items-center gap-1 justify-self-end">
          <span className="skeleton block size-10 rounded-full lg:rounded-lg" />
          <span className="skeleton block size-10 rounded-full lg:hidden" />
        </span>
      </header>

      <section className="flex items-start justify-between gap-12 px-4 pb-12 pt-8 md:px-8 md:pb-16 md:pt-12 lg:pb-[88px]">
        <div className="w-full max-w-[811px] space-y-3 md:space-y-4">
          <span className="skeleton block h-9 w-[90%] rounded-2xl md:h-14 lg:h-[68px]" />
          <span className="skeleton block h-9 w-[70%] rounded-2xl md:h-14 lg:h-[68px]" />
          <span className="skeleton !mt-5 block h-5 w-[80%] max-w-[729px] rounded-full md:!mt-6 md:h-6" />
          <span className="skeleton block h-5 w-[55%] rounded-full md:h-6" />
          <span className="skeleton !mt-7 block h-[42px] w-[180px] rounded-full md:!mt-10 md:h-[58px] md:w-[232px] lg:!mt-[58px]" />
        </div>
        <div className="hidden shrink-0 lg:block">
          <CardSkeleton size="featured" as="div" />
        </div>
      </section>

      <div className="flex flex-1">
        <div className="hidden w-[267px] shrink-0 space-y-3 pl-8 pr-4 pt-[106px] lg:block">
          <span className="skeleton block h-4 w-16 rounded-full" />
          <span className="skeleton !mt-5 block h-4 w-28 rounded-full" />
          <span className="skeleton block h-4 w-14 rounded-full" />
          <span className="skeleton block h-4 w-20 rounded-full" />
        </div>
        <div className="min-w-0 flex-1 px-4 pb-16 md:px-8 lg:pl-0">
          <div className="flex gap-2 overflow-hidden py-2 lg:gap-[25px] lg:py-2.5">
            {CHIP_WIDTHS.map((width, index) => (
              <span key={index} className="skeleton block h-7 shrink-0 rounded-full lg:h-[38px]" style={{ width }} />
            ))}
          </div>
          <ul className="grid grid-cols-1 gap-x-[2vw] gap-y-12 pt-[33px] sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-[65px]">
            {Array.from({ length: 6 }, (_, index) => (
              <CardSkeleton key={index} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
