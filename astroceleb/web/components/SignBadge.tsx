import { getSignData } from '@/lib/astro'

const ELEMENT_CLASSES = {
  fire:  'bg-orange-50  text-orange-800  border-orange-200',
  earth: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  air:   'bg-sky-50     text-sky-800     border-sky-200',
  water: 'bg-teal-50    text-teal-800    border-teal-200',
} as const

export function SignBadge({ sign }: { sign: number | null }) {
  if (!sign) return <span className="text-stone-300">—</span>
  const data = getSignData(sign)
  if (!data) return null

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-medium ${ELEMENT_CLASSES[data.element]}`}
    >
      <span aria-hidden="true">{data.symbol}</span>
      {data.name}
    </span>
  )
}
