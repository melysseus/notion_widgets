'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SearchBarProps {
  autoFocus?: boolean
}

export function SearchBar({ autoFocus }: SearchBarProps) {
  const router = useRouter()
  const currentParams = useSearchParams()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = (new FormData(e.currentTarget).get('q') as string).trim()
    // Preserve existing planet/filter params when updating the text query
    const params = new URLSearchParams(currentParams.toString())
    q ? params.set('q', q) : params.delete('q')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <input
        name="q"
        type="search"
        autoFocus={autoFocus}
        defaultValue={currentParams.get('q') ?? ''}
        placeholder="Search celebrities…"
        className="w-full rounded-xl border border-stone-200 bg-white px-5 py-3 pr-14 text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-stone-400 transition-colors hover:text-violet-600"
      >
        →
      </button>
    </form>
  )
}
