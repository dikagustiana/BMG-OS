import { appContext } from "@/lib/page";
import { Shell } from "@/components/Shell";
import { Card, PageHeader } from "@/components/ds";
import { ActionForm } from "@/components/ActionForm";
import { ROLE_LABEL, roleHelp } from "@/lib/roles";
import { changePassword } from "./actions";

export const dynamic = "force-dynamic";

export default async function AkunPage() {
  const ctx = await appContext();
  const { viewer } = ctx;
  return (
    <Shell ctx={ctx} active="akun">
      <PageHeader title="Akun" sub={<>{viewer.fullName ?? "Nama belum diisi Admin"} · {ROLE_LABEL[viewer.role]}. Boleh mengisi: {roleHelp(viewer.role)}.</>} />
      <Card title="Ganti kata sandi">
        <ActionForm action={changePassword} submit="Ganti kata sandi" className="stack">
          <div className="field"><label htmlFor="pw1">Kata sandi baru, minimal 10 karakter</label><input id="pw1" className="in" type="password" name="password" minLength={10} required autoComplete="new-password" /></div>
          <div className="field"><label htmlFor="pw2">Ulangi kata sandi baru</label><input id="pw2" className="in" type="password" name="password2" minLength={10} required autoComplete="new-password" /></div>
        </ActionForm>
      </Card>
    </Shell>
  );
}
