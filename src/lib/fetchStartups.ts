import { Startup } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function fetchStartups(): Promise<Startup[]> {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error(
      "Missing env vars: SUPABASE_URL or SUPABASE_ANON_KEY not set in .env.local"
    );
  }

  const params = new URLSearchParams({
    select: "*,startup_employees(*),startup_tags(tag)",
    order: "created_at.desc",
  });

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/startups?${params.toString()}`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Accept-Profile": "public",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    let detail = res.statusText;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.message || parsed.error || body;
    } catch {
      detail = body || res.statusText;
    }
    throw new Error(`Supabase error (${res.status}): ${detail}`);
  }

  return res.json();
}
