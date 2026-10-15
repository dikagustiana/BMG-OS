"use server";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase";
import { isModuleKey } from "@/lib/modules";
import { can } from "@/lib/roles";

type S = { ok?: string; error?: string };

/** Admin turns a module on or off (app_setting; RLS allows Admin only; every change is audited). */
export async function setModule(_: S, form: FormData): Promise<S> {
  const v = await requireViewer();
  if (!can(v.role, "module_flags")) return { error: "Hanya Admin" };
  const key = String(form.get("key") ?? "");
  if (!isModuleKey(key)) return { error: "Modul tidak dikenal" };
  const on = form.get("on") === "1";
  const sb = await supabaseServer();
  const { error } = await sb.from("app_setting").update({ value: on }).eq("key", key);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: `${key} ${on ? "aktif" : "nonaktif"}` };
}

/** Queue a rebuild of one period (processed by the rebuild worker of the phase that ships the engine). */
export async function queueRebuild(_: S, form: FormData): Promise<S> {
  const v = await requireViewer();
  if (!can(v.role, "rebuild")) return { error: "Peran Anda tidak boleh meminta rebuild" };
  const kind = String(form.get("kind") ?? "");
  const period = String(form.get("period") ?? "");
  if (!["month", "week", "day"].includes(kind) || !/^\d{4}-\d{2}-\d{2}$/.test(period)) return { error: "Periode tidak valid (YYYY-MM-DD)" };
  const sb = await supabaseServer();
  const { error } = await sb.from("rebuild_queue").insert({ kind, period, reason: "manual (Admin → Modul)" });
  if (error) return { error: error.message };
  revalidatePath("/admin/modul");
  return { ok: `Rebuild ${kind} ${period} masuk antrian` };
}
