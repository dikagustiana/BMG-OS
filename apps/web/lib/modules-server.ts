import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { supabaseServer } from "./supabase";
import { MODULE_KEYS, parseFlags, type Flags, type ModuleKey } from "./modules";
import { WriteError } from "./write";

/** Module flags for this request (RLS: every active app user may read app_setting). */
export const getFlags = cache(async (): Promise<Flags> => {
  const sb = await supabaseServer();
  const { data, error } = await sb.from("app_setting").select("key, value").in("key", [...MODULE_KEYS]);
  if (error) return parseFlags([]);
  return parseFlags((data ?? []) as { key: string; value: unknown }[]);
});

export async function moduleEnabled(key: ModuleKey): Promise<boolean> {
  return (await getFlags())[key];
}

/** Page guard: a module that is off has no pages. */
export async function requireModule(key: ModuleKey): Promise<void> {
  if (!(await moduleEnabled(key))) notFound();
}

/** Server-action guard: a module that is off accepts no writes. */
export async function assertModule(key: ModuleKey): Promise<void> {
  if (!(await moduleEnabled(key))) throw new WriteError(`Modul ${key} belum aktif`);
}
