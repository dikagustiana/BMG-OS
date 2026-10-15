import "server-only";
import { requireViewer, type Viewer } from "./session";
import { getFlags } from "./modules-server";
import type { Flags } from "./modules";
import { defaultMonth, defaultWeek } from "./month";

export interface AppCtx {
  viewer: Viewer;
  flags: Flags;
  /** Month of the page (route param) or the default working month; fills "[month]" in the nav. */
  month: string;
  /** Monday of the page's week or the current week; fills "[week]". */
  week: string;
}

/** Signed-in viewer and module flags for a page. */
export async function appContext(month?: string, week?: string): Promise<AppCtx> {
  const viewer = await requireViewer();
  return { viewer, flags: await getFlags(), month: month ?? defaultMonth(), week: week ?? defaultWeek() };
}

export type PageProps = { searchParams: Promise<Record<string, string | undefined>> };
