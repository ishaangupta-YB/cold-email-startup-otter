export interface StartupEmployee {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  status: string;
  created_at: string;
  startup_id: string;
  updated_at: string;
  emails_sent: number;
  linkedin_url: string | null;
}

export interface StartupTag {
  tag: string;
}

export interface Startup {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  sector: string | null;
  location: string | null;
  funding_round: string | null;
  funding_amount: string | null;
  funding_date: string | null;
  team_size: string | null;
  logo_url: string | null;
  is_hiring: boolean | null;
  is_trending: boolean | null;
  status: string;
  views_count: number;
  saves_count: number;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  slug: string;
  startup_employees: StartupEmployee[];
  startup_tags: StartupTag[];
}
