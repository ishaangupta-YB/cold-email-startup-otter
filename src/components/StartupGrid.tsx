"use client";

import { useState } from "react";
import { Startup } from "@/lib/types";
import DownloadButton from "./DownloadButton";
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  ExternalLink,
  Building2,
  Tag,
  Rocket,
  Banknote,
  Mail,
  Linkedin,
} from "lucide-react";

export default function StartupGrid({ startups }: { startups: Startup[] }) {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");

  const sectors = [
    "All",
    ...Array.from(
      new Set(startups.map((s) => s.sector).filter(Boolean) as string[])
    ).sort(),
  ];

  const filtered = startups.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.location ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesSector = sectorFilter === "All" || s.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="sticky top-4 z-10 mb-8 flex flex-col gap-4 rounded-xl border border-neutral-200/60 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, location, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-all"
            />
          </div>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-neutral-200 bg-white pl-10 pr-8 py-2.5 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-all sm:w-48 cursor-pointer"
            >
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-4 w-4 text-neutral-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <DownloadButton startups={filtered} format="csv" />
          <DownloadButton startups={filtered} format="xlsx" />
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between px-2">
        <h3 className="text-sm font-medium text-neutral-500">
          {filtered.length === 0
            ? "No startups found"
            : `Showing ${filtered.length} startups`}
        </h3>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-900/5">
            <Search className="h-6 w-6 text-neutral-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-neutral-900">
            No results found
          </h3>
          <p className="mt-2 text-sm text-neutral-500">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSectorFilter("All");
            }}
            className="mt-6 text-sm font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-4 hover:decoration-neutral-900"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-neutral-300 hover:shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {s.logo_url && s.logo_url !== "null" ? (
                      <img
                        src={s.logo_url}
                        alt={s.name}
                        className="h-12 w-12 rounded-lg border border-neutral-100 bg-white object-cover shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 text-lg font-bold text-neutral-400">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate font-semibold text-neutral-900"
                        title={s.name}
                      >
                        {s.name}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">
                          {s.location || "Remote"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {s.is_hiring && (
                  <div className="mt-3 flex">
                     <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      <Rocket className="h-3 w-3" />
                      Hiring Now
                    </span>
                  </div>
                )}

                <div className="mt-4">
                   <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600 h-[2.5rem]">
                    {s.description || "No description available."}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
                  {s.sector && (
                    <div className="flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1">
                      <Building2 className="h-3 w-3" />
                      {s.sector}
                    </div>
                  )}
                  {s.team_size && (
                    <div className="flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1">
                      <Users className="h-3 w-3" />
                      {s.team_size}
                    </div>
                  )}
                  {s.funding_round && (
                    <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-700 font-medium">
                      <Banknote className="h-3 w-3" />
                      {s.funding_round}
                    </div>
                  )}
                </div>

                {s.startup_tags && s.startup_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-neutral-100">
                    {s.startup_tags.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-white border border-neutral-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-500"
                      >
                        {t.tag}
                      </span>
                    ))}
                    {s.startup_tags.length > 3 && (
                      <span className="inline-flex items-center rounded-full bg-neutral-50 px-2 py-0.5 text-[10px] text-neutral-400">
                        +{s.startup_tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {s.startup_employees && s.startup_employees.length > 0 && (
                  <div className="mt-4 border-t border-neutral-100 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Key People
                    </p>
                    <div className="flex flex-col gap-2">
                      {s.startup_employees.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-neutral-800">
                              {e.name}
                            </span>
                            {e.role && (
                              <span className="text-[10px] text-neutral-500">
                                {e.role}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {e.email && (
                              <a
                                href={`mailto:${e.email}`}
                                className="text-neutral-400 transition-colors hover:text-neutral-900"
                                title="Email"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {e.linkedin_url && (
                              <a
                                href={e.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-neutral-400 transition-colors hover:text-[#0077b5]"
                                title="LinkedIn"
                              >
                                <Linkedin className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {s.startup_employees.length > 2 && (
                        <p className="text-[10px] italic text-neutral-400">
                          +{s.startup_employees.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-xs font-medium text-neutral-400">
                  {s.funding_amount
                    ? s.funding_amount
                    : "Undisclosed Funding"}
                </span>
                {s.website && (
                  <a
                    href={
                      s.website.startsWith("http")
                        ? s.website
                        : `https://${s.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 transition-colors hover:text-blue-600"
                  >
                    Visit Website
                    <ExternalLink className="h-3 w-3 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
