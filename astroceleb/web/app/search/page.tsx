import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { SearchBar } from '@/components/SearchBar'
import { FilterChips } from '@/components/FilterChips'
import { FilterBuilder } from '@/components/FilterBuilder'
import { CelebrityCard } from '@/components/CelebrityCard'
import { searchCelebrities } from '@/lib/queries'

type RawParams = { [key: string]: string | string[] | undefined }

function str(v: string | string[] | undefined): string | null {
  return typeof v === 'string' ? v : null
}

// ── metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: RawParams
}): Promise<Metadata> {
  const q = str(searchParams.q)
  return { title: q ? `"${q}"` : 'Search' }
}

// ── result list (async server component, suspendable) ─────────────────────────

async function Results({ searchParams }: { searchParams: RawParams }) {
  const planets = ['sun','moon','mercury','venus','mars','jupiter','saturn','rahu','ketu']

  const params = {
    q:          str(searchParams.q),
    asc:        str(searchParams.asc),
    asc_nak:    str(searchParams.asc_nak),
    profession: str(searchParams.profession),
    ...Object.fromEntries(
      planets.flatMap(p => [
        [p, str(searchParams[p])],
        [`${p}_nak`, str(searchParams[`${p}_nak`])],
      ]).filter(([, v]) => v != null),
    ),
  }

  const { celebrities, count } = await searchCelebrities(params)

  if (celebrities.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-3xl text-stone-200" aria-hidden="true">✦</p>
        <p className="mt-4 text-stone-500">No celebrities found.</p>
        <p className="mt-1 text-sm text-stone-400">
          Try different search terms or remove a filter.
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="mb-6 text-sm text-stone-400">
        {count.toLocaleString()} {count === 1 ? 'result' : 'results'}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {celebrities.map(c => (
          <CelebrityCard key={c.id} celebrity={c} />
        ))}
      </div>
    </>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function SearchPage({ searchParams }: { searchParams: RawParams }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">

        {/* Search bar + filter builder + active filter chips */}
        <div className="mb-8 space-y-3">
          <Suspense>
            <SearchBar />
          </Suspense>
          <Suspense>
            <FilterBuilder />
          </Suspense>
          <Suspense>
            <FilterChips />
          </Suspense>
        </div>

        {/* Results — suspends while fetching */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-stone-100" />
              ))}
            </div>
          }
        >
          <Results searchParams={searchParams} />
        </Suspense>

      </main>
    </>
  )
}
