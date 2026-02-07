import { NextResponse } from "next/server";
import { fetchStartups } from "@/lib/fetchStartups";
import Firecrawl from "@mendable/firecrawl-js";

export const maxDuration = 300;

export async function POST() {
  if (!process.env.FIRECRAWL_API_KEY) {
    return NextResponse.json(
      { error: "FIRECRAWL_API_KEY is not set in .env.local" },
      { status: 500 }
    );
  }

  let startups;
  try {
    startups = await fetchStartups();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch startups from Supabase",
      },
      { status: 500 }
    );
  }

  // Use the v1 client which has the well-documented scrapeUrl method
  const firecrawl = new Firecrawl({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });

  const withWebsites = startups.filter((s) => s.website);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      send({
        type: "init",
        total: withWebsites.length,
        skipped: startups.length - withWebsites.length,
      });

      const results: Record<string, unknown>[] = [];

      for (let i = 0; i < withWebsites.length; i++) {
        const startup = withWebsites[i];
        try {
          const doc = await firecrawl.v1.scrapeUrl(startup.website!, {
            formats: ["markdown"],
          });

          const success = "success" in doc && doc.success === true;
          const markdown = success ? (doc.markdown ?? "") : "";
          const scrapeError =
            !success && "error" in doc ? (doc as { error: string }).error : undefined;

          const item = {
            name: startup.name,
            website: startup.website,
            content: markdown,
            employees: startup.startup_employees,
            tags: startup.startup_tags.map((t) => t.tag),
            sector: startup.sector,
            location: startup.location,
            funding_round: startup.funding_round,
            funding_amount: startup.funding_amount,
            ...(scrapeError ? { error: scrapeError } : {}),
          };

          results.push(item);

          send({
            type: "progress",
            index: i + 1,
            total: withWebsites.length,
            name: startup.name,
            success: success && markdown.length > 0,
            contentLength: markdown.length,
            ...(scrapeError ? { error: scrapeError } : {}),
          });
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Unknown error";

          // If the very first request fails with an auth error, bail early
          if (
            i === 0 &&
            (errorMsg.includes("401") ||
              errorMsg.includes("Unauthorized") ||
              errorMsg.includes("Invalid API") ||
              errorMsg.includes("Unexpected error"))
          ) {
            send({
              type: "error",
              message: `Firecrawl API key error: ${errorMsg}. Check FIRECRAWL_API_KEY in .env.local`,
            });
            controller.close();
            return;
          }

          results.push({
            name: startup.name,
            website: startup.website,
            content: "",
            employees: startup.startup_employees,
            tags: startup.startup_tags.map((t) => t.tag),
            sector: startup.sector,
            location: startup.location,
            funding_round: startup.funding_round,
            funding_amount: startup.funding_amount,
            error: errorMsg,
          });

          send({
            type: "progress",
            index: i + 1,
            total: withWebsites.length,
            name: startup.name,
            success: false,
            error: errorMsg,
          });
        }
      }

      send({ type: "done", results });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
