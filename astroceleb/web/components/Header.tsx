import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-stone-900 transition-colors hover:text-violet-700"
        >
          <span className="text-stone-400" aria-hidden="true">✦</span>
          <span className="font-semibold tracking-tight">AstroCeleb</span>
        </Link>
        <span className="text-stone-200" aria-hidden="true">·</span>
        <span className="hidden text-xs text-stone-400 sm:block">
          Vedic sidereal birth charts
        </span>
      </div>
    </header>
  )
}
