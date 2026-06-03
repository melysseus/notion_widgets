import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { SearchBar } from '@/components/SearchBar'
import { SignFilterGrid } from '@/components/SignFilterGrid'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-16">

        {/* Hero */}
        <div className="mb-16 text-center">
          <p className="mb-2 text-2xl text-stone-300" aria-hidden="true">✦</p>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-stone-900">
            AstroCeleb
          </h1>
          <p className="mb-10 text-stone-500">
            Celebrity Vedic birth charts · Lahiri ayanamsa · Whole sign houses
          </p>

          <div className="flex justify-center">
            <Suspense>
              <SearchBar autoFocus />
            </Suspense>
          </div>
        </div>

        {/* Browse grid */}
        <section>
          <h2 className="mb-6 text-sm font-medium uppercase tracking-widest text-stone-400">
            Browse by Sign
          </h2>
          <Suspense>
            <SignFilterGrid />
          </Suspense>
        </section>

      </main>
    </>
  )
}
