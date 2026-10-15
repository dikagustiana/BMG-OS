import { LoginForm } from "./LoginForm";
import { signInGoogle } from "./actions";

const ERR: Record<string, string> = {
  "not-allowed": "E-mail ini belum terdaftar atau tidak aktif di BMG-OS. Minta Admin menambahkan Anda.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = sp.next ?? "/";
  const google = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";
  return (
    <div className="login">
      <div className="card stack">
        <div>
          <h1>BMG-OS</h1>
          <p className="muted">PT Boga Makmur Gracia · costing, operasi, dan laporan bulanan</p>
        </div>
        {sp.error ? <div className="msg err" role="alert">{ERR[sp.error] ?? sp.error}</div> : null}
        <LoginForm next={next} />
        {google ? (
          <form action={signInGoogle}>
            <input type="hidden" name="next" value={next} />
            <button className="b sec">Masuk dengan Google Workspace</button>
          </form>
        ) : null}
        <p className="muted small">Akses hanya untuk e-mail yang didaftarkan Admin. Lupa kata sandi? Minta Admin mengatur kata sandi sementara di Pengaturan → Pengguna.</p>
      </div>
    </div>
  );
}
