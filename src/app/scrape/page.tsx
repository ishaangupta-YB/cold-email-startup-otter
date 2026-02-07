"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

interface ScrapeLog {
  name: string;
  success: boolean;
  contentLength?: number;
  error?: string;
}

interface ScrapedResult {
  name: string;
  website: string;
  content: string;
  employees: { name: string; role: string | null; email: string | null; linkedin_url: string | null }[];
  tags: string[];
  sector: string | null;
  location: string | null;
  funding_round: string | null;
  funding_amount: string | null;
  error?: string;
}

export default function ScrapePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ScrapedResult[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startScrape = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults(null);
    setFatalError(null);
    setProgress({ current: 0, total: 0 });

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        signal: abortRef.current.signal,
      });

      // If server returned a JSON error (not SSE stream)
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        setFatalError(json.error || `Server error: ${res.status}`);
        setIsRunning(false);
        return;
      }

      if (!res.ok) {
        setFatalError(`Server error: ${res.status} ${res.statusText}`);
        setIsRunning(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const dataLine = line.replace(/^data: /, "").trim();
          if (!dataLine) continue;

          try {
            const data = JSON.parse(dataLine);

            if (data.type === "init") {
              setProgress({ current: 0, total: data.total });
              setSkipped(data.skipped);
            } else if (data.type === "progress") {
              setProgress({ current: data.index, total: data.total });
              setLogs((prev) => [
                ...prev,
                {
                  name: data.name,
                  success: data.success,
                  contentLength: data.contentLength,
                  error: data.error,
                },
              ]);
            } else if (data.type === "error") {
              setFatalError(data.message);
            } else if (data.type === "done") {
              setResults(data.results);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setFatalError((err as Error).message || "Network error");
      }
    } finally {
      setIsRunning(false);
    }
  };

  const stopScrape = () => {
    abortRef.current?.abort();
    setIsRunning(false);
  };

  const downloadResults = (format: "csv" | "xlsx") => {
    if (!results) return;

    const rows = results.flatMap((r) => {
      const base = {
        "Startup Name": r.name,
        Website: r.website ?? "",
        Sector: r.sector ?? "",
        Location: r.location ?? "",
        "Funding Round": r.funding_round ?? "",
        "Funding Amount": r.funding_amount ?? "",
        Tags: r.tags.join(", "),
        "Scraped Content (excerpt)": (r.content ?? "").slice(0, 500),
        "Scrape Error": r.error ?? "",
      };

      if (r.employees.length === 0) {
        return [{ ...base, "Employee Name": "", "Employee Role": "", "Employee Email": "", "Employee LinkedIn": "" }];
      }
      return r.employees.map((e) => ({
        ...base,
        "Employee Name": e.name,
        "Employee Role": e.role ?? "",
        "Employee Email": e.email ?? "",
        "Employee LinkedIn": e.linkedin_url ?? "",
      }));
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scraped Startups");

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scraped_startups.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      XLSX.writeFile(wb, "scraped_startups.xlsx");
    }
  };

  const downloadJSON = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scraped_startups.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  const successCount = logs.filter((l) => l.success).length;
  const failCount = logs.filter((l) => !l.success).length;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="sticky top-0 z-10 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              &larr; Directory
            </a>
            <h1 className="text-lg font-semibold tracking-tight">
              Firecrawl Scraper
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Controls */}
        <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Scrape Startup Websites</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Fetches all startups from Supabase, then scrapes each website with
            Firecrawl to get clean markdown content.
          </p>
          <div className="mt-4 flex gap-3">
            {!isRunning ? (
              <button
                onClick={startScrape}
                disabled={isRunning}
                className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 active:scale-95 disabled:opacity-50"
              >
                Start Scraping
              </button>
            ) : (
              <button
                onClick={stopScrape}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {fatalError && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <h3 className="text-base font-semibold text-red-800">
              Scraping failed
            </h3>
            <p className="mt-2 text-sm font-mono text-red-700 break-all">
              {fatalError}
            </p>
            <p className="mt-3 text-sm text-red-600">
              Check your <code className="rounded bg-red-100 px-1.5 py-0.5">.env.local</code> and
              make sure <code className="rounded bg-red-100 px-1.5 py-0.5">FIRECRAWL_API_KEY</code>,{" "}
              <code className="rounded bg-red-100 px-1.5 py-0.5">SUPABASE_URL</code>, and{" "}
              <code className="rounded bg-red-100 px-1.5 py-0.5">SUPABASE_ANON_KEY</code> are set correctly.
            </p>
          </div>
        )}

        {/* Progress */}
        {progress.total > 0 && (
          <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium">
                {isRunning ? "Scraping..." : "Complete"} &mdash;{" "}
                {progress.current}/{progress.total}
              </span>
              <span className="text-neutral-500">{pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-neutral-900 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex gap-4 text-sm text-neutral-500">
              <span className="text-green-600">
                {successCount} scraped
              </span>
              <span className="text-red-500">{failCount} failed</span>
              {skipped > 0 && (
                <span>{skipped} skipped (no website)</span>
              )}
            </div>
          </div>
        )}

        {/* Download buttons */}
        {results && (
          <div className="mb-8 flex gap-3">
            <button
              onClick={() => downloadResults("csv")}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-all hover:bg-neutral-50 active:scale-95"
            >
              Download CSV
            </button>
            <button
              onClick={() => downloadResults("xlsx")}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-all hover:bg-neutral-50 active:scale-95"
            >
              Download XLSX
            </button>
            <button
              onClick={downloadJSON}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-all hover:bg-neutral-50 active:scale-95"
            >
              Download JSON (full markdown)
            </button>
          </div>
        )}

        {/* Live log */}
        {logs.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-6 py-3">
              <h3 className="text-sm font-semibold">Scrape Log</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {[...logs].reverse().map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-neutral-50 px-6 py-2.5 text-sm last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        log.success ? "bg-green-500" : "bg-red-400"
                      }`}
                    />
                    <span className="font-medium">{log.name}</span>
                  </div>
                  <span className="text-neutral-400">
                    {log.success
                      ? `${((log.contentLength ?? 0) / 1024).toFixed(1)} KB`
                      : log.error}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
