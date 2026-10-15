"use server";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase";
import { rejectUpload } from "@/lib/upload";
import { monthParam } from "@/lib/month";

/** Drop previews that were never saved (status planned → rejected), e.g. from a closed tab. */
export async function discardPending(_: { ok?: string; error?: string }, form: FormData): Promise<{ ok?: string; error?: string }> {
  try {
    const v = await requireViewer();
    const month = monthParam(String(form.get("month") ?? ""));
    const sb = await supabaseServer();
    const ids = form.getAll("id").map(String);
    for (const id of ids) await rejectUpload(sb, v, id);
    if (month) revalidatePath(`/m/${month}/input`);
    return { ok: `${ids.length} pratinjau dibatalkan` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
