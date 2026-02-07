"use client";

import { Startup } from "@/lib/types";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

export default function DownloadButton({
  startups,
  format,
}: {
  startups: Startup[];
  format: "csv" | "xlsx";
}) {
  const handleDownload = () => {
    const rows = startups.flatMap((s) => {
      if (s.startup_employees.length === 0) {
        return [
          {
            "Startup Name": s.name,
            Sector: s.sector ?? "",
            Location: s.location ?? "",
            Website: s.website ?? "",
            "Funding Round": s.funding_round ?? "",
            "Funding Amount": s.funding_amount ?? "",
            "Team Size": s.team_size ?? "",
            "Is Hiring": s.is_hiring ? "Yes" : "No",
            Description: s.description ?? "",
            Tags: s.startup_tags.map((t) => t.tag).join(", "),
            "Employee Name": "",
            "Employee Role": "",
            "Employee Email": "",
            "Employee LinkedIn": "",
          },
        ];
      }
      return s.startup_employees.map((e) => ({
        "Startup Name": s.name,
        Sector: s.sector ?? "",
        Location: s.location ?? "",
        Website: s.website ?? "",
        "Funding Round": s.funding_round ?? "",
        "Funding Amount": s.funding_amount ?? "",
        "Team Size": s.team_size ?? "",
        "Is Hiring": s.is_hiring ? "Yes" : "No",
        Description: s.description ?? "",
        Tags: s.startup_tags.map((t) => t.tag).join(", "),
        "Employee Name": e.name,
        "Employee Role": e.role ?? "",
        "Employee Email": e.email ?? "",
        "Employee LinkedIn": e.linkedin_url ?? "",
      }));
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Startups");

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "startups.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      XLSX.writeFile(wb, "startups.xlsx");
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:text-neutral-900 hover:shadow-md active:scale-95 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      <span>{format.toUpperCase()}</span>
    </button>
  );
}
