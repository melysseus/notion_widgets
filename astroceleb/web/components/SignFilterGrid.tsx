'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SIGN_DATA } from '@/lib/astro'

type FilterTab = 'sun' | 'moon' | 'asc'

const TABS: { key: FilterTab; label: string; urlParam: string }[] = [
  { key: 'moon', label: 'Moon Signs',   urlParam: 'moon' },
  { key: 'sun',  label: 'Sun Signs',    urlParam: 'sun'  },
  { key: 'asc',  label: 'Rising Signs', urlParam: 'asc'  },
]

const ELEMENT_HOVER = {
  fire:  'hover:border-orange-200  hover:bg-orange-50  hover:text-orange-800',
  earth: 'hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800',
  air:   'hover:border-sky-200     hover:bg-sky-50     hover:text-sky-800',
  water: 'hover:border-teal-200    hover:bg-teal-50    hover:text-teal-800',
} as const

export function SignFilterGrid() {
  const [activeTab, setActiveTab] = useState<FilterTab>('moon')
  const router = useRouter()

  const { urlParam } = TABS.find(t => t.key === activeTab)!

  return (
    <div className="space-y-5">
      {/* Planet tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              activeTab === tab.key
                ? 'border-violet-300 bg-violet-50 font-medium text-violet-700'
                : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sign grid — 6 across on small+, 12 across on large */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {SIGN_DATA.map(sign => (
          <button
            key={sign.number}
            onClick={() =>
              router.push(`/search?${urlParam}=${sign.name.toLowerCase()}`)
            }
            title={`${TABS.find(t => t.key === activeTab)!.label.replace(' Signs', '')} in ${sign.name}`}
            className={`flex flex-col items-center gap-0.5 rounded-lg border border-stone-200 bg-white px-2 py-3 text-center transition-all ${ELEMENT_HOVER[sign.element]}`}
          >
            <span className="text-xl leading-none" aria-hidden="true">
              {sign.symbol}
            </span>
            <span className="mt-1 text-xs text-stone-600">{sign.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
