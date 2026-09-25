const Block = ({ className }: { className: string }) => <div className={`skeleton rounded-lg ${className}`} />

export default function Loading() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background px-4 pb-14 pt-24 text-text-primary sm:px-6 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-8 lg:pb-6" aria-label="Loading page" aria-busy="true">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(112,139,122,0.16)_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="relative mx-auto flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col">
        <div className="mb-5 flex items-center gap-3 border-b border-border pb-3">
          <Block className="h-8 w-1 rounded-full" />
          <div className="min-w-0 space-y-2"><Block className="h-5 w-44" /><Block className="h-3 w-56" /></div>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <Block className="h-56 sm:h-64" />
          <Block className="h-56 sm:h-64" />
        </div>

        <div className="grid min-h-0 gap-8 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="mb-6 grid grid-cols-7 border-b border-border pb-3">
              {[0, 1, 2, 3, 4, 5, 6].map((item) => <Block key={item} className="mx-2 h-4" />)}
            </div>
            <div className="schedule-rail flex snap-x gap-3 overflow-x-auto pb-4 lg:flex-col lg:overflow-hidden">
              {[0, 1, 2, 3, 4].map((item) => <Block key={item} className="h-24 w-72 shrink-0 snap-start sm:w-full" />)}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}