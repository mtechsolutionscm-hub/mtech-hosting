"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setError(data.error ?? "Unable to sign in");
    router.push(data.user.role === "CUSTOMER_OWNER" || data.user.role === "CUSTOMER_MEMBER" ? "/dashboard" : "/admin");
    router.refresh();
  }

  return <main className="auth-shell"><section className="auth-card"><div className="eyebrow">MTECH HOSTING</div><h1>Welcome back</h1><p className="muted">Sign in to manage your hosting estate.</p><form onSubmit={submit} className="form-stack"><label>Email<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <p className="error">{error}</p>}<button className="primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form><p className="muted small">New customer? <a href="/register">Create an account</a></p></section></main>;
}
