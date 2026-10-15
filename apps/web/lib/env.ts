/**
 * Supabase project the app talks to. The publishable key is public by design (it ships in the browser bundle;
 * RLS protects the data), so the BMG-OS project's values are the defaults and a fresh Vercel import works without
 * env vars. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY to point a deployment at another project
 * (e.g. a local `supabase start`).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://btccexwuukrpushmharq.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_dcAT1AxUeC_Bd2PyzkHO3A_nwWKu75x";
