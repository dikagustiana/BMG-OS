"use server";
import { revalidatePath } from "next/cache";
import type { Mapping, UploadKind } from "@bmg/parsers";
import { requireViewer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase";
import { assertModule } from "@/lib/modules-server";
import { commitUpload, kindsFor, rejectUpload, stageUpload, type StageResult } from "@/lib/upload";

/** Upload wizard actions (PRD §5). Every upload belongs to module B1 (ingest) or a later module that registers its kind. */
export async function stage(input: {
  period: string; kind: UploadKind; path: string; fileName: string; mapping?: Mapping; replaces?: string;
}): Promise<StageResult | { error: string }> {
  try {
    const v = await requireViewer();
    await assertModule("b1_ingest");
    if (!kindsFor(v.role).some((k) => k.kind === input.kind)) return { error: "Peran Anda tidak boleh mengunggah jenis ini" };
    if (!input.path.startsWith(`${input.period}/`)) return { error: "Lokasi file tidak valid" };
    const sb = await supabaseServer();
    if (input.replaces) await rejectUpload(sb, v, input.replaces);
    return await stageUpload(sb, v, input.kind, input.period, input.path, input.fileName, { mapping: input.mapping });
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function commit(uploadId: string): Promise<{ ok?: string; error?: string }> {
  try {
    const v = await requireViewer();
    await assertModule("b1_ingest");
    const sb = await supabaseServer();
    const msg = await commitUpload(sb, v, uploadId);
    revalidatePath("/", "layout");
    return { ok: msg };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function discard(uploadId: string): Promise<{ ok?: string; error?: string }> {
  try {
    const v = await requireViewer();
    const sb = await supabaseServer();
    await rejectUpload(sb, v, uploadId);
    return { ok: "Dibatalkan" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
