"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateWebsiteForm({ organizations }: { organizations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/websites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, organizationId }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error ?? "Unable to create website");
    setName(""); router.refresh();
  }

  if (!organizations.length) return null;
  return <form className="card form-inline" onSubmit={submit}><div><label>Website name<input value={name} onChange={e => setName(e.target.value)} placeholder="My production site" required /></label></div><div><label>Organization<select value={organizationId} onChange={e => setOrganizationId(e.target.value)}>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label></div><button className="primary" disabled={busy}>{busy ? "Creating…" : "Create website"}</button>{error && <p className="error">{error}</p>}</form>;
}
