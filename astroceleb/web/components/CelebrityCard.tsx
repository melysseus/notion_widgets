import Link from 'next/link'
import { SignBadge } from './SignBadge'
import { formatBirthDate } from '@/lib/astro'
import type { CelebrityListItem } from '@/types'

export function CelebrityCard({ celebrity: c }: { celebrity: CelebrityListItem }) {
  const initials = c.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Link
      href={`/celebrity/${c.slug}`}
      className="group flex flex-col rounded-xl border border-stone-200 bg-white p-4 transition-all hover:border-violet-300 hover:shadow-sm"
    >
      {/* Identity row */}
      <div className="mb-3 flex items-center gap-3">
        {c.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image_url}
            alt={c.name}
            className="h-11 w-11 flex-none rounded-full object-cover ring-1 ring-stone-200"
          />
        ) : (
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight text-stone-900 group-hover:text-violet-700">
            {c.name}
          </p>
          <p className="truncate text-xs text-stone-400">{formatBirthDate(c.birth_date)}</p>
        </div>
      </div>

      {/* Key placements */}
      <div className="flex flex-1 flex-col gap-1.5 text-sm">
        {c.sun_sign && (
          <div className="flex items-center gap-2">
            <span className="w-4 text-center text-base text-stone-300" aria-hidden="true">☉</span>
            <SignBadge sign={c.sun_sign} />
          </div>
        )}
        {c.moon_sign && (
          <div className="flex items-center gap-2">
            <span className="w-4 text-center text-base text-stone-300" aria-hidden="true">☽</span>
            <SignBadge sign={c.moon_sign} />
          </div>
        )}
        {c.ascendant && (
          <div className="flex items-center gap-2">
            <span className="w-4 text-center text-sm font-semibold text-stone-400" aria-hidden="true">↑</span>
            <SignBadge sign={c.ascendant.sign} />
          </div>
        )}
        {!c.sun_sign && !c.moon_sign && !c.ascendant && (
          <p className="text-xs text-stone-300 italic">Chart pending</p>
        )}
      </div>

      {/* Professions footer */}
      {c.professions.length > 0 && (
        <p className="mt-3 truncate border-t border-stone-100 pt-2.5 text-xs capitalize text-stone-400">
          {c.professions.slice(0, 2).join(' · ')}
        </p>
      )}
    </Link>
  )
}
