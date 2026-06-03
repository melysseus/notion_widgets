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

// ── Confidence badge from Rodden rating ──────────────────────────────────────
// AA/A = reliable birth time  B/C = approximate  DD/X/XX = unknown or conflicting

type DotColor = 'green' | 'amber' | 'red'

const RODDEN_CONFIDENCE: Record<string, { color: DotColor; label: string; detail: string }> = {
  AA: { color: 'green', label: 'Verified birth time',    detail: 'AA — Birth certificate or official record' },
  A:  { color: 'green', label: 'Verified birth time',    detail: 'A — Autobiography or personal statement'   },
  B:  { color: 'amber', label: 'Approximate birth time', detail: 'B — Biography or non-autobiographical'     },
  C:  { color: 'amber', label: 'Approximate birth time', detail: 'C — Caution, reliability uncertain'        },
  DD: { color: 'red',   label: 'Conflicting data',       detail: 'DD — Two or more conflicting sources'      },
  X:  { color: 'red',   label: 'Birth time unknown',     detail: 'X — No birth time on record'               },
  XX: { color: 'red',   label: 'Birth date unconfirmed', detail: 'XX — No confirmed birth date'              },
}

const DOT_CLASS: Record<DotColor, string> = {
  green: 'bg-green-400',
  amber: 'bg-amber-400',
  red:   'bg-red-400',
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

            {celebrity.rodden_rating && (() => {
              const conf = RODDEN_CONFIDENCE[celebrity.rodden_rating]
              if (!conf) return null
              return (
                <div
                  className="mt-2 flex items-center gap-1.5"
                  title={conf.detail}
                >
                  <span className={`h-2 w-2 rounded-full ${DOT_CLASS[conf.color]}`} />
                  <span className="text-xs text-stone-400">{conf.label}</span>
                </div>
              )
            })()}
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
