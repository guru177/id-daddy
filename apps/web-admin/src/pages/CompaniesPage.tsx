import { FormEvent, useEffect, useState } from "react";
import { Ban, CheckCircle2, Key, Plus, Search, Trash2 } from "lucide-react";
import { Plan } from "@id-daddy/shared";
import { api } from "../api/client";
import { WorkspaceRow } from "../types";

export function CompaniesPage() {
  const [companies, setCompanies] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [form, setForm] = useState({
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    plan: "FREE_TRIAL" as Plan
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
      const email = form.adminEmail.trim();
      // Derive company name from email: e.g. "john@raintech.com" -> "Raintech"
      const domain = email.split('@')[1] || "Default";
      const name = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

      await api("/workspaces", {
        method: "POST",
        body: JSON.stringify({ ...form, name })
      });
      setForm({ adminEmail: "", adminPhone: "", adminPassword: "", plan: "FREE_TRIAL" });
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

  async function deleteCompany(id: string) {
    if (!confirm("Are you sure you want to delete this client? All their templates and records will be permanently removed.")) return;
    try {
      await api(`/workspaces/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete client");
    }
  }

  async function confirmResetPassword() {
    if (!resettingId || !newPassword) return;
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    setResetLoading(true);
    try {
      await api(`/workspaces/${resettingId}/reset-password`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword })
      });
      setResettingId(null);
      setNewPassword("");
      alert("Password has been reset successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Password Reset Modal */}
      {resettingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/20 backdrop-blur-sm p-4">
          <div className="panel w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Key className="h-6 w-6" />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-stone-900">Reset Client Password</h2>
            <p className="mb-6 text-sm text-stone-500">Enter a new secure password for this administrative account.</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-400">New Password</label>
                <input
                  className="input h-11"
                  type="password"
                  autoFocus
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmResetPassword()}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="btn-secondary flex-1 h-11" onClick={() => { setResettingId(null); setNewPassword(""); }} disabled={resetLoading}>
                  Cancel
                </button>
                <button className="btn-primary flex-1 h-11" onClick={confirmResetPassword} disabled={resetLoading || newPassword.length < 8}>
                  {resetLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Client Admins</h1>
          <p className="text-sm text-stone-500">Create and manage client administrators and their workspaces.</p>
        </div>
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <input className="input w-64" placeholder="Search companies" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button className="btn-secondary" title="Search">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <form className="panel grid gap-3 p-4 lg:grid-cols-[1fr_1fr_1fr_160px_auto]" onSubmit={createCompany}>
        <input className="input" placeholder="Admin email" value={form.adminEmail} onChange={(event) => setForm({ ...form, adminEmail: event.target.value })} />
        <input className="input" placeholder="Admin phone" value={form.adminPhone} onChange={(event) => setForm({ ...form, adminPhone: event.target.value })} />
        <input className="input" type="password" placeholder="Temporary password" value={form.adminPassword} onChange={(event) => setForm({ ...form, adminPassword: event.target.value })} />
        <select className="input" value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value as Plan })}>
          <option value="FREE_TRIAL">Free Trial (3 Days)</option>
          <option value="PRO_1Y">Pro (1 Year)</option>
          <option value="LIFETIME">Lifetime</option>
        </select>
        <button className="btn-primary flex items-center justify-center gap-2 px-6">
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/50 border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-4">Client / Email</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-4 py-4">Plan</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Users</th>
                <th className="px-4 py-4">Templates</th>
                <th className="px-4 py-4">Records</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-stone-400">
                    Loading clients...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-stone-400">
                    No companies found.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="border-t border-stone-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">{company.name}</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">
                        {company.users?.[0]?.email ?? "No Admin Email"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600 font-medium">
                      {company.users?.[0]?.phone ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="input h-9 w-40"
                        value={company.plan}
                        onChange={(event) => {
                          const newPlan = event.target.value;
                          const planLabel = newPlan === "FREE_TRIAL" ? "Free Trial (3 Days)" : newPlan === "PRO_1Y" ? "Pro (1 Year)" : "Lifetime";
                          if (confirm(`Are you sure you want to change ${company.name}'s plan to ${planLabel}?`)) {
                            void api(`/workspaces/${company.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ plan: newPlan })
                            }).then(load).catch(err => alert(err.message));
                          }
                        }}
                      >
                        <option value="FREE_TRIAL">Free Trial (3 Days)</option>
                        <option value="PRO_1Y">Pro (1 Year)</option>
                        <option value="LIFETIME">Lifetime</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{company.status}</td>
                    <td className="px-4 py-3">{company._count?.users ?? 0}</td>
                    <td className="px-4 py-3">{company._count?.templates ?? 0}</td>
                    <td className="px-4 py-3">{company._count?.records ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {company.status === "ACTIVE" ? (
                          <button className="btn-secondary h-9 w-9 p-0" onClick={() => void setStatus(company, "BLOCKED")} title="Block company">
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button className="btn-secondary h-9 w-9 p-0" onClick={() => void setStatus(company, "ACTIVE")} title="Unblock company">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button className="btn-secondary h-9 w-9 p-0 text-amber-600 hover:bg-amber-50 hover:border-amber-100" onClick={() => void setResettingId(company.id)} title="Reset admin password">
                          <Key className="h-4 w-4" />
                        </button>
                        <button className="btn-secondary h-9 w-9 p-0 text-red-600 hover:bg-red-50 hover:border-red-100" onClick={() => void deleteCompany(company.id)} title="Delete company">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
