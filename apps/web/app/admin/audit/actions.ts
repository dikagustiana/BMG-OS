"use server";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase";
import { RESTORE_KEYS } from "@/lib/restore";

/** Admin restores a soft-deleted row (deleting is soft; Admin can restore). */
export async function restoreRow(form: FormData) {
  const v = await requireViewer();
  if (v.role !== "admin") throw new Error("Hanya Admin");
  const table = String(form.get("table"));
  const id = String(form.get("row_id"));
  const pk = RESTORE_KEYS[table];
  if (!pk) throw new Error("Tabel tidak bisa dipulihkan");
  const sb = await supabaseServer();
  const { error } = await sb.from(table).update({ deleted_at: null, deleted_by: null }).eq(pk, id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
