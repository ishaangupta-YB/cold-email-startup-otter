# Cold Email Sender - Startup Directory

A Next.js app that pulls startup data from [useotter.app](https://useotter.app)'s Supabase database, displays it in a searchable grid, and lets you scrape every startup's website using [Firecrawl](https://firecrawl.dev) to get clean markdown content. Export everything as CSV, XLSX, or JSON.

## What it does

1. **Browse startups** — Fetches 233+ Indian startups from Supabase (name, sector, funding, employees, contact info) and shows them in a filterable grid at `/`
2. **Search & filter** — Search by name/location/description, filter by sector
3. **Export** — Download filtered results as CSV or XLSX (includes employee emails, LinkedIn URLs)
4. **Scrape with Firecrawl** — Go to `/scrape`, click "Start Scraping", and it scrapes every startup's website via Firecrawl to get structured markdown. Live progress bar + log. Download scraped results as CSV/XLSX/JSON

## Tech stack

- **Next.js 16** (App Router, server components)
- **Tailwind CSS 4**
- **Supabase** (data source, uses anon key — no auth needed)
- **Firecrawl** (`@mendable/firecrawl-js` v4) for website scraping
- **xlsx** for Excel/CSV export
- **lucide-react** for icons

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local (copy from example below and fill in your keys)

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env.local` file in the project root:

```env
# Supabase (useotter.app's public API)
SUPABASE_URL=
SUPABASE_ANON_KEY=your_supabase_anon_key

# Firecrawl (get key from https://firecrawl.dev)
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

- **SUPABASE_ANON_KEY** — This is a public anon key from useotter.app. Grab it from the browser network tab on useotter.app (look for the `apikey` header on any Supabase request).
- **FIRECRAWL_API_KEY** — Sign up at [firecrawl.dev](https://firecrawl.dev) and get your API key from the dashboard.

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Homepage — server component, fetches & displays startups
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind styles
│   ├── api/
│   │   └── scrape/
│   │       └── route.ts      # POST endpoint — streams SSE as Firecrawl scrapes each site
│   └── scrape/
│       └── page.tsx          # Scrape UI — progress bar, live log, download buttons
├── components/
│   ├── StartupGrid.tsx       # Client component — search, filter, startup cards grid
│   └── DownloadButton.tsx    # CSV/XLSX export button
└── lib/
    ├── fetchStartups.ts      # Fetches startup data from Supabase REST API
    └── types.ts              # TypeScript interfaces (Startup, StartupEmployee, StartupTag)
```

## Pages

| Route | What it does |
|-------|-------------|
| `/` | Startup directory grid with search, sector filter, CSV/XLSX download |
| `/scrape` | Firecrawl scraper — scrapes all startup websites, shows live progress, download results as CSV/XLSX/JSON |

## How the scraper works

1. Click "Start Scraping" on `/scrape`
2. `POST /api/scrape` fetches all startups from Supabase
3. Filters to startups that have a website URL
4. Calls `firecrawl.v1.scrapeUrl(url, { formats: ["markdown"] })` for each one sequentially
5. Streams progress back to the client via Server-Sent Events (SSE)
6. Client shows a live log with green/red dots per startup and a progress bar
7. When done, download buttons appear — CSV/XLSX include a content excerpt, JSON has the full markdown

## Data shape

Each startup from Supabase looks like:

```json
{
  "name": "Soket AI Labs",
  "sector": "AI",
  "location": "India-wide",
  "website": "https://soket.ai",
  "funding_round": "Govt Fund",
  "funding_amount": "$1M",
  "team_size": "51-200",
  "logo_url": "https://...",
  "is_hiring": true,
  "startup_employees": [
    {
      "name": "Abhishek Upperwal",
      "role": "CEO",
      "email": "abhishek@soket.ai",
      "linkedin_url": "https://linkedin.com/in/upperwal/"
    }
  ],
  "startup_tags": []
}
```

## Error handling

- **Missing env vars** — Shows an error banner on the page explaining which var is missing
- **Invalid Supabase key** — Shows the exact Supabase error (e.g., "Invalid API key")
- **Invalid Firecrawl key** — Detects auth failure on first scrape attempt and stops with an error banner
- **Individual scrape failures** — Logged as red entries in the live log, doesn't stop the overall job
- **Network errors** — Caught and displayed on the scrape page

## Notes

- The Supabase anon key is public (same one exposed in the browser on useotter.app), but keep your **Firecrawl key private**
- Scraping 200+ websites takes time — the scraper runs sequentially to avoid rate limits
- `.env*` files are gitignored — your keys will never be committed
