import "server-only";
import { requireViewer, type Viewer } from "./session";
import { getFlags } from "./modules-server";
import type { Flags } from "./modules";

export interface AppCtx {
  viewer: Viewer;
  flags: Flags;
}

/** Signed-in viewer and module flags for a page. */
export async function appContext(): Promise<AppCtx> {
  const viewer = await requireViewer();
  return { viewer, flags: await getFlags() };
}

export type PageProps = { searchParams: Promise<Record<string, string | undefined>> };
