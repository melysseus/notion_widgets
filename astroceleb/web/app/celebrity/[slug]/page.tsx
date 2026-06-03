import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { ChartTable } from '@/components/ChartTable'
import { SignBadge } from '@/components/SignBadge'
import { getCelebrity } from '@/lib/queries'
import { formatBirthDate, formatDegree } from '@/lib/astro'

interface PageProps {
  params: { slug: string }
}

// ── metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const celebrity = await getCelebrity(params.slug)
  if (!celebrity) return { title: 'Not found' }
  return {
    title: celebrity.name,
    description: `Vedic sidereal birth chart for ${celebrity.name}.`,
  }
}

// ── Rodden rating labels (shown on hover) ─────────────────────────────────────

const RODDEN: Record<string, string> = {
  AA: 'AA — Birth record (most reliable)',
  A:  'A — From memory or autobiography',
  B:  'B — Biography or non-autobiographical source',
  C:  'C — Caution, less-reliable source',
  DD: 'DD — Dirty data, two or more conflicting dates',
  X:  'X — No birth time',
  XX: 'XX — No confirmed birth date',
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function CelebrityPage({ params }: PageProps) {
  const celebrity = await getCelebrity(params.slug)
  if (!celebrity) notFound()

  const { chart } = celebrity

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">

        {/* Back link */}
        <Link
          href="/search"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-700"
        >
          ← Back to search
        </Link>

        {/* Celebrity header */}
        <div className="mb-10 flex items-start gap-5">
          {celebrity.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={celebrity.image_url}
              alt={celebrity.name}
              className="h-20 w-20 flex-none rounded-full object-cover ring-1 ring-stone-200"
            />
          ) : (
            <div className="flex h-20 w-20 flex-none items-center justify-center rounded-full bg-violet-100 text-2xl font-semibold text-violet-600">
              {celebrity.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-stone-900">{celebrity.name}</h1>

            <p className="mt-1 text-stone-500">
              Born {formatBirthDate(celebrity.birth_date)}
              {celebrity.birth_time_known && celebrity.birth_time && (
                <> at {celebrity.birth_time.slice(0, 5)}</>
              )}
              {celebrity.birth_place && (
                <> · {celebrity.birth_place}</>
              )}
            </p>

            {celebrity.professions.length > 0 && (
              <p className="mt-1 text-sm capitalize text-stone-400">
                {celebrity.professions.join(' · ')}
              </p>
            )}

            {celebrity.rodden_rating && (
              <span
                className="mt-2 inline-block rounded border border-stone-200 px-1.5 py-0.5 text-xs text-stone-400"
                title={RODDEN[celebrity.rodden_rating] ?? celebrity.rodden_rating}
              >
                {celebrity.rodden_rating}
              </span>
            )}
          </div>
        </div>

        {/* Chart section */}
        <section>
          <div className="mb-5 flex items-baseline gap-3">
            <h2 className="text-lg font-medium text-stone-800">Sidereal Chart</h2>
            <span className="text-xs text-stone-400">
              Lahiri ayanamsa · Whole sign houses
            </span>
          </div>

          {/* Ascendant summary */}
          {chart.ascendant ? (
            <div className="mb-5 flex items-center gap-3 text-sm">
              <span className="font-medium text-stone-500">Ascendant</span>
              <SignBadge sign={chart.ascendant.sign} />
              <span className="tabular text-stone-400">
                {formatDegree(chart.ascendant.degree ?? 0)}
              </span>
            </div>
          ) : (
            <p className="mb-5 text-sm italic text-stone-400">
              Birth time unknown — ascendant and house placements not available.
            </p>
          )}

          {/* Placements table */}
          <div className="rounded-xl border border-stone-200 bg-white px-6 py-5">
            <ChartTable placements={chart.placements} />
          </div>
        </section>

        {/* Notes */}
        {celebrity.notes && (
          <p className="mt-8 text-sm text-stone-400">{celebrity.notes}</p>
        )}

      </main>
    </>
  )
}
