'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PLANET_DISPLAY, PLANET_KEYS } from '@/lib/astro'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function FilterChips() {
  const router = useRouter()
  const params = useSearchParams()

  const chips: { key: string; label: string }[] = []

  for (const planet of PLANET_KEYS) {
    const raw = params.get(planet)
    if (!raw) continue
    const d = PLANET_DISPLAY[planet]
    chips.push({ key: planet, label: `${d?.symbol ?? ''} ${d?.label ?? planet}: ${cap(raw)}` })
  }

  const asc = params.get('asc')
  if (asc) chips.push({ key: 'asc', label: `↑ Rising: ${cap(asc)}` })

  if (chips.length === 0) return null

  const remove = (key: string) => {
    const next = new URLSearchParams(params.toString())
    next.delete(key)
    const qs = next.toString()
    router.push(qs ? `/search?${qs}` : '/search')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ key, label }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm text-violet-700"
        >
          {label}
          <button
            onClick={() => remove(key)}
            aria-label={`Remove ${label} filter`}
            className="ml-0.5 text-violet-400 transition-colors hover:text-violet-800"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )
}
