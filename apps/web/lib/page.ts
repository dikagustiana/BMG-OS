import "server-only";
import { requireViewer, type Viewer } from "./session";
import { getFlags } from "./modules-server";
import type { Flags } from "./modules";
import { defaultMonth } from "./month";

export interface AppCtx {
  viewer: Viewer;
  flags: Flags;
  /** Month of the page (route param) or the default working month; fills "[month]" in the nav. */
  month: string;
}

/** Signed-in viewer and module flags for a page. */
export async function appContext(month?: string): Promise<AppCtx> {
  const viewer = await requireViewer();
  return { viewer, flags: await getFlags(), month: month ?? defaultMonth() };
}

export type PageProps = { searchParams: Promise<Record<string, string | undefined>> };
