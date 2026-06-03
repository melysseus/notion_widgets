'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  PLANET_KEYS, PLANET_DISPLAY,
  SIGN_DATA, NAKSHATRA_DATA,
  PROFESSIONS,
} from '@/lib/astro'

type FilterMode = 'sign' | 'nakshatra'

/**
 * Filter builder panel for the search page.
 *
 * Supports:
 *   Planet in Sign       → ?moon=virgo
 *   Planet in Nakshatra  → ?moon_nak=shravana
 *   Ascendant Sign       → ?asc=libra
 *   Ascendant Nakshatra  → ?asc_nak=swati
 *   Profession           → ?profession=athlete
 *
 * All active filters are additive (AND logic) and shown as removable chips
 * by the sibling FilterChips component.
 */
export function FilterBuilder() {
  const router      = useRouter()
  const params      = useSearchParams()

  const [mode,      setMode]      = useState<FilterMode>('sign')
  const [planet,    setPlanet]    = useState('moon')
  const [sign,      setSign]      = useState('')
  const [nakshatra, setNakshatra] = useState('')

  const canAdd = mode === 'sign' ? !!sign : !!nakshatra

  // ── handlers ──────────────────────────────────────────────────────────────

  const addFilter = () => {
    if (!canAdd) return
    const next = new URLSearchParams(params.toString())

    if (mode === 'sign') {
      next.set(planet === 'asc' ? 'asc' : planet, sign)
    } else {
      next.set(planet === 'asc' ? 'asc_nak' : `${planet}_nak`, nakshatra)
    }

    router.push(`/search?${next.toString()}`)
    setSign('')
    setNakshatra('')
  }

  const setProfession = (value: string) => {
    const next = new URLSearchParams(params.toString())
    value ? next.set('profession', value) : next.delete('profession')
    router.push(`/search?${next.toString()}`)
  }

  const clearAll = () => router.push('/search')

  const hasAnyFilter = params.toString().length > 0

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">

      {/* Header row: mode tabs + profession + clear */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
            Filter by
          </span>
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-sm">
            {(['sign', 'nakshatra'] as FilterMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setSign(''); setNakshatra('') }}
                className={`rounded px-3 py-1 capitalize transition-colors ${
                  mode === m
                    ? 'bg-white font-medium text-violet-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {m === 'sign' ? 'Sign' : 'Nakshatra'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Profession selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-stone-400">Profession</label>
            <select
              value={params.get('profession') ?? ''}
              onChange={e => setProfession(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-sm text-stone-700 focus:border-violet-400 focus:outline-none"
            >
              <option value="">Any</option>
              {PROFESSIONS.map(p => (
                <option key={p} value={p} className="capitalize">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {hasAnyFilter && (
            <button
              onClick={clearAll}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter input row */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Planet selector */}
        <select
          value={planet}
          onChange={e => setPlanet(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        >
          <option value="asc">↑ Ascendant</option>
          {PLANET_KEYS.map(p => (
            <option key={p} value={p}>
              {PLANET_DISPLAY[p]?.symbol} {PLANET_DISPLAY[p]?.label}
            </option>
          ))}
        </select>

        <span className="text-sm text-stone-400">
          {mode === 'sign' ? 'in sign' : 'in nakshatra'}
        </span>

        {/* Sign or Nakshatra picker */}
        {mode === 'sign' ? (
          <select
            value={sign}
            onChange={e => setSign(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Choose sign…</option>
            {SIGN_DATA.map(s => (
              <option key={s.number} value={s.name.toLowerCase()}>
                {s.symbol} {s.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={nakshatra}
            onChange={e => setNakshatra(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Choose nakshatra…</option>
            {NAKSHATRA_DATA.map(n => (
              <option key={n.number} value={n.slug}>
                {n.number}. {n.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={addFilter}
          disabled={!canAdd}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add filter
        </button>
      </div>

    </div>
  )
}
