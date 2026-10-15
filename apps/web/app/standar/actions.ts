"use server";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase";
import { assertModule } from "@/lib/modules-server";
import { can } from "@/lib/roles";

type S = { ok?: string; error?: string };

/** Approve a draft standard version (Finance/Admin; the database guard checks the role and the transition again). */
export async function approveVersion(_: S, form: FormData): Promise<S> {
  try {
    const v = await requireViewer();
    await assertModule("b1_ingest");
    if (!can(v.role, "std_approve")) return { error: "Hanya Finance/Admin yang menyetujui versi standar" };
    const sb = await supabaseServer();
    const { data, error } = await sb.from("std_version").update({ status: "approved" }).eq("id", String(form.get("id") ?? "")).eq("status", "draft").select("code");
    if (error) return { error: error.message };
    if (!data?.length) return { error: "Versi tidak ditemukan atau bukan draft" };
    revalidatePath("/standar");
    return { ok: `Versi ${String(data[0].code)} disetujui` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
