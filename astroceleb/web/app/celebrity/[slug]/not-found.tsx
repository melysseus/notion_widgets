import Link from 'next/link'
import { Header } from '@/components/Header'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-4xl text-stone-200" aria-hidden="true">✦</p>
        <h1 className="mt-5 text-xl font-semibold text-stone-700">Celebrity not found</h1>
        <p className="mt-2 text-stone-400">
          This chart hasn't been added to the database yet.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-block text-sm text-violet-600 hover:underline"
        >
          ← Back to search
        </Link>
      </main>
    </>
  )
}
