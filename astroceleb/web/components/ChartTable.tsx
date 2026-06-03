import { PLANET_DISPLAY, formatDegree } from '@/lib/astro'
import { SignBadge } from './SignBadge'
import type { Placement } from '@/types'

export function ChartTable({ placements }: { placements: Placement[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100">
            <th className="pb-3 pr-8 text-left text-xs font-medium uppercase tracking-wide text-stone-400">
              Planet
            </th>
            <th className="pb-3 pr-8 text-left text-xs font-medium uppercase tracking-wide text-stone-400">
              Sign
            </th>
            <th className="pb-3 pr-6 text-right text-xs font-medium uppercase tracking-wide text-stone-400">
              Degree
            </th>
            <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wide text-stone-400">
              House
            </th>
            <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-stone-400">
              Ret
            </th>
          </tr>
        </thead>
        <tbody>
          {placements.map(p => {
            const display = PLANET_DISPLAY[p.planet]
            return (
              <tr key={p.planet} className="border-b border-stone-50 last:border-0">
                {/* Planet name + symbol */}
                <td className="py-2.5 pr-8">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-5 text-center text-base text-stone-300"
                      aria-hidden="true"
                    >
                      {display?.symbol ?? ''}
                    </span>
                    <span className="font-medium text-stone-800">
                      {display?.label ?? p.planet}
                    </span>
                  </span>
                </td>

                {/* Sign badge */}
                <td className="py-2.5 pr-8">
                  <SignBadge sign={p.sign} />
                </td>

                {/* Degree */}
                <td className="tabular py-2.5 pr-6 text-right text-stone-500">
                  {formatDegree(p.degree_in_sign)}
                </td>

                {/* House */}
                <td className="py-2.5 pr-4 text-right text-stone-500">
                  {p.house ?? '—'}
                </td>

                {/* Retrograde indicator */}
                <td className="py-2.5 text-right">
                  {p.retrograde && (
                    <span
                      className="text-xs font-medium text-amber-600"
                      title="Retrograde"
                      aria-label="Retrograde"
                    >
                      ℛ
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
