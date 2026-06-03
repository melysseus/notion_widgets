import { Header } from '@/components/Header'

export default function SearchLoading() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 space-y-3">
          <div className="h-12 w-full max-w-xl animate-pulse rounded-xl bg-stone-100" />
        </div>
        <div className="mb-6 h-4 w-20 animate-pulse rounded bg-stone-100" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      </main>
    </>
  )
}
