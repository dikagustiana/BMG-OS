"use client";
import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input className="in" id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Kata sandi</label>
        <input className="in" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error ? <div className="msg err" role="alert">{state.error}</div> : null}
      <button className="b" disabled={pending}>{pending ? "Masuk…" : "Masuk"}</button>
    </form>
  );
}
