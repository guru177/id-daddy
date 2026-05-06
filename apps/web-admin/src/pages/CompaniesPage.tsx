import { FormEvent, useEffect, useState } from "react";
import { Ban, CheckCircle2, Plus, Search } from "lucide-react";
import { Plan } from "@id-daddy/shared";
import { api } from "../api/client";
import { WorkspaceRow } from "../types";

export function CompaniesPage() {
  const [companies, setCompanies] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    adminEmail: "",
    adminPassword: "",
    plan: "FREE" as Plan
  });

  async function load() {
    setLoading(true);
    try {
      const result = await api<{ data: WorkspaceRow[]; total: number }>(`/workspaces${query ? `?q=${query}` : ""}`);
      setCompanies(result.data);
    } catch (err) {
      console.error("Failed to load companies:", err);
      const message = err instanceof Error ? err.message : "Unable to load companies";
      if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
        setError("Your session has expired. Please sign in again.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCompany(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/workspaces", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", adminEmail: "", adminPassword: "", plan: "FREE" });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create company";
      if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
        setError("Your session has expired. Please log out and sign in again.");
      } else {
        setError(message);
      }
    }
  }

  async function setStatus(company: WorkspaceRow, status: "ACTIVE" | "BLOCKED") {
    await api(`/workspaces/${company.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-sm text-stone-500">Create, plan, block, and unblock tenant workspaces.</p>
        </div>
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <input className="input w-64" placeholder="Search companies" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button className="btn-secondary" title="Search">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <form className="panel grid gap-3 p-4 lg:grid-cols-[1fr_1fr_1fr_160px_auto]" onSubmit={createCompany}>
        <input className="input" placeholder="Company name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="input" placeholder="Admin email" value={form.adminEmail} onChange={(event) => setForm({ ...form, adminEmail: event.target.value })} />
        <input className="input" placeholder="Temporary password" type="password" value={form.adminPassword} onChange={(event) => setForm({ ...form, adminPassword: event.target.value })} />
        <select className="input" value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value as Plan })}>
          <option value="FREE">Free</option>
          <option value="BASIC">Basic</option>
          <option value="PRO">Pro</option>
        </select>
        <button className="btn-primary" title="Create company">
          <Plus className="h-4 w-4" />
          Create
        </button>
        {error ? <p className="text-sm text-red-700 lg:col-span-5">{error}</p> : null}
      </form>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Templates</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                    Loading companies...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                    No companies found.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-medium">{company.name}</td>
                    <td className="px-4 py-3">
                      <select
                        className="input h-9 w-28"
                        value={company.plan}
                        onChange={(event) =>
                          void api(`/workspaces/${company.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ plan: event.target.value })
                          }).then(load)
                        }
                      >
                        <option value="FREE">Free</option>
                        <option value="BASIC">Basic</option>
                        <option value="PRO">Pro</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{company.status}</td>
                    <td className="px-4 py-3">{company._count?.users ?? 0}</td>
                    <td className="px-4 py-3">{company._count?.templates ?? 0}</td>
                    <td className="px-4 py-3">
                      {company.status === "ACTIVE" ? (
                        <button className="btn-secondary" onClick={() => void setStatus(company, "BLOCKED")} title="Block company">
                          <Ban className="h-4 w-4" />
                          Block
                        </button>
                      ) : (
                        <button className="btn-secondary" onClick={() => void setStatus(company, "ACTIVE")} title="Unblock company">
                          <CheckCircle2 className="h-4 w-4" />
                          Unblock
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
