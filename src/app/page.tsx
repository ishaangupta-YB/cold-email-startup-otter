import { fetchStartups } from "@/lib/fetchStartups";
import StartupGrid from "@/components/StartupGrid";

export default async function Home() {
  let startups: Awaited<ReturnType<typeof fetchStartups>> = [];
  let error: string | null = null;

  try {
    startups = await fetchStartups();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
    startups = [];
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="sticky top-0 z-10 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Startup Directory
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/scrape"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Firecrawl Scraper
            </a>
            <span className="text-sm font-medium text-neutral-500">
              {startups.length} Companies
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12">
        {error ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Failed to load startups
            </h2>
            <p className="mt-2 text-sm font-mono text-red-700 break-all">
              {error}
            </p>
            <p className="mt-4 text-sm text-red-600">
              Check your <code className="rounded bg-red-100 px-1.5 py-0.5">.env.local</code> file
              and make sure <code className="rounded bg-red-100 px-1.5 py-0.5">SUPABASE_URL</code> and
              <code className="rounded bg-red-100 px-1.5 py-0.5">SUPABASE_ANON_KEY</code> are set correctly.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Discover Great Startups
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-500">
                Browse, search, and export data from top Indian startups. Find your next opportunity or partner.
              </p>
            </div>
            <StartupGrid startups={startups} />
          </>
        )}
      </main>
    </div>
  );
}
