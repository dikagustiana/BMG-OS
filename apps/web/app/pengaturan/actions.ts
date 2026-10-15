"use server";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase";
import { can } from "@/lib/roles";
import { assertModule } from "@/lib/modules-server";
import { rebuildFsAll } from "@/lib/rebuild-fs";

type S = { ok?: string; error?: string };

/** Admin/Finance recompute the FS data marts (fs_month, nwc_month, cashflow_month, fs_check_month). */
export async function recalcFs(_: S, _form: FormData): Promise<S> {
  try {
    const v = await requireViewer();
    if (!can(v.role, "budget")) return { error: "Hanya Finance atau Admin" };
    await assertModule("b8_fs");
    const msg = await rebuildFsAll(await supabaseServer(), v, "manual");
    revalidatePath("/", "layout");
    return { ok: msg };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
