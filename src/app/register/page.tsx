"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", organization: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error ?? "Unable to create account");
    router.push("/dashboard"); router.refresh();
  }

  return <main className="auth-shell"><section className="auth-card"><div className="eyebrow">MTECH HOSTING</div><h1>Create your workspace</h1><p className="muted">Launch websites and applications from one control plane.</p><form onSubmit={submit} className="form-stack"><label>Full name<input value={form.name} onChange={e => update("name", e.target.value)} required /></label><label>Work email<input type="email" value={form.email} onChange={e => update("email", e.target.value)} required /></label><label>Organization<input value={form.organization} onChange={e => update("organization", e.target.value)} required /></label><label>Password<input type="password" minLength={12} autoComplete="new-password" value={form.password} onChange={e => update("password", e.target.value)} required /><span className="hint">Use at least 12 characters.</span></label>{error && <p className="error">{error}</p>}<button className="primary" disabled={busy}>{busy ? "Creating workspace…" : "Create workspace"}</button></form><p className="muted small">Already have an account? <a href="/login">Sign in</a></p></section></main>;
}
