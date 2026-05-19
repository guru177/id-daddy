import { FormEvent, useEffect, useState } from "react";
import { Ban, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, Edit2, History, Key, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Plan } from "@id-daddy/shared";
import { api } from "../api/client";
import { WorkspaceRow } from "../types";

const PLAN_LABELS: Record<Plan, string> = {
  FREE_TRIAL: "Free Trial (3 Days)",
  PRO_1Y: "Pro (1 Year)"
};

export function CompaniesPage() {
  const [companies, setCompanies] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [confirmChange, setConfirmChange] = useState<{
    companyId: string;
    companyName: string;
    newPlan: Plan;
  } | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [newNameValue, setNewNameValue] = useState("");
  const [historyWorkspace, setHistoryWorkspace] = useState<any>(null);
  const [historyPayments, setHistoryPayments] = useState<any[]>([]);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadPayments = async (id: string) => {
    const payments = await api<any[]>(`/workspaces/${id}/payments`);
    setHistoryPayments(payments);
  };
  const [confirmExtension, setConfirmExtension] = useState<{
    companyId: string;
    companyName: string;
    currentEnd: string | null;
    newEnd: string;
  } | null>(null);
  const [confirmRenewal, setConfirmRenewal] = useState<{
    companyId: string;
    companyName: string;
    newEnd: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    companyId: string;
    companyName: string;
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    plan: "FREE_TRIAL" as Plan
  });

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const result = await api<{ data: WorkspaceRow[]; total: number; totalPages: number }>(`/workspaces?${params.toString()}`);
      setCompanies(result.data);
      setTotalCount(result.total);
      setTotalPages(result.totalPages || 1);
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
    setPage(1);
  }, [query, limit]);

  useEffect(() => {
    void load();
  }, [query, page, limit]);

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
      setIsCreateModalOpen(false);
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

  function deleteCompany(company: WorkspaceRow) {
    setConfirmDelete({
      companyId: company.id,
      companyName: company.name
    });
  }

  async function applyDelete() {
    if (!confirmDelete) return;
    try {
      await api(`/workspaces/${confirmDelete.companyId}`, { method: "DELETE" });
      setConfirmDelete(null);
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
  async function confirmPlanChange() {
    if (!confirmChange) return;
    try {
      await api(`/workspaces/${confirmChange.companyId}`, {
        method: "PATCH",
        body: JSON.stringify({ plan: confirmChange.newPlan })
      });
      setConfirmChange(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to change plan");
    }
  }
  
  async function renameCompany() {
    if (!editingNameId || !newNameValue.trim()) return;
    try {
      await api(`/workspaces/${editingNameId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newNameValue.trim() })
      });
      setEditingNameId(null);
      setNewNameValue("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to rename company");
    }
  }

  function extendTrial(company: WorkspaceRow) {
    const currentEnd = company.subscription?.endDate ? new Date(company.subscription.endDate) : new Date();
    const newEnd = new Date(currentEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    setConfirmExtension({
      companyId: company.id,
      companyName: company.name,
      currentEnd: company.subscription?.endDate || null,
      newEnd: newEnd.toISOString()
    });
  }

  async function applyExtension() {
    if (!confirmExtension) return;
    try {
      await api(`/workspaces/${confirmExtension.companyId}`, {
        method: "PATCH",
        body: JSON.stringify({ endDate: confirmExtension.newEnd })
      });
      setConfirmExtension(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to extend trial");
    }
  }

  function renewPlan(company: WorkspaceRow) {
    if (company.plan !== "PRO_1Y") return;
    
    const currentEnd = company.subscription?.endDate ? new Date(company.subscription.endDate) : new Date();
    // Start renewal from now or from the future end date (whichever is later) to prevent losing days
    const baseDate = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    setConfirmRenewal({
      companyId: company.id,
      companyName: company.name,
      newEnd: newEnd.toISOString()
    });
  }

  async function applyRenewal() {
    if (!confirmRenewal) return;
    try {
      await api(`/workspaces/${confirmRenewal.companyId}`, {
        method: "PATCH",
        body: JSON.stringify({ endDate: confirmRenewal.newEnd })
      });
      setConfirmRenewal(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to renew plan");
    }
  }

  return (
    <div className="space-y-6 relative pb-24">
      {/* Plan Change Modal */}
      {confirmChange && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mb-8 mx-auto shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-stone-900 mb-3 tracking-tight">Approve Plan Change?</h2>
              <p className="text-stone-500 font-medium leading-relaxed">
                You are about to switch <span className="text-stone-900 font-bold">{confirmChange.companyName}</span> to the 
                <span className="text-indigo-600 font-black"> {PLAN_LABELS[confirmChange.newPlan] || confirmChange.newPlan}</span> tier. 
                This will update their billing and feature access immediately.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                className="h-14 w-full bg-stone-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
                onClick={confirmPlanChange}
              >
                Approve Change
              </button>
              <button 
                className="h-14 w-full bg-stone-50 text-stone-400 font-bold rounded-2xl hover:bg-stone-100 transition-all active:scale-95"
                onClick={() => setConfirmChange(null)}
              >
                Reject / Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Extension Confirmation Modal */}
      {confirmExtension && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mb-8 mx-auto shadow-inner border border-indigo-100">
              <Calendar size={40} />
            </div>
            
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-stone-900 mb-3 tracking-tight">Extend Trial Period?</h2>
              <p className="text-stone-500 font-medium leading-relaxed">
                You are adding <span className="text-stone-900 font-bold">3 days</span> of extra access to 
                <span className="text-stone-900 font-bold"> {confirmExtension.companyName}</span>.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest">
                <div className="px-3 py-2 bg-stone-50 text-stone-400 rounded-lg">
                  {confirmExtension.currentEnd ? new Date(confirmExtension.currentEnd).toLocaleDateString() : "New User"}
                </div>
                <div className="text-indigo-600">→</div>
                <div className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  {new Date(confirmExtension.newEnd).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                className="h-14 w-full bg-stone-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
                onClick={applyExtension}
              >
                Approve Extension
              </button>
              <button 
                className="h-14 w-full bg-stone-50 text-stone-400 font-bold rounded-2xl hover:bg-stone-100 transition-all active:scale-95"
                onClick={() => setConfirmExtension(null)}
              >
                Reject / Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Renewal Confirmation Modal */}
      {confirmRenewal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-8 mx-auto shadow-inner border border-emerald-100">
              <RefreshCw size={40} />
            </div>
            
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-stone-900 mb-3 tracking-tight">Renew Pro Plan?</h2>
              <p className="text-stone-500 font-medium leading-relaxed">
                You are adding <span className="text-stone-900 font-bold">365 days</span> of Pro access to 
                <span className="text-stone-900 font-bold"> {confirmRenewal.companyName}</span>.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest">
                <div className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  New Expiry: {new Date(confirmRenewal.newEnd).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                className="h-14 w-full bg-stone-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
                onClick={applyRenewal}
              >
                Approve Renewal
              </button>
              <button 
                className="h-14 w-full bg-stone-50 text-stone-400 font-bold rounded-2xl hover:bg-stone-100 transition-all active:scale-95"
                onClick={() => setConfirmRenewal(null)}
              >
                Reject / Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-600 mb-8 mx-auto shadow-inner border border-red-100">
              <Trash2 size={40} />
            </div>
            
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-stone-900 mb-3 tracking-tight">Delete Client?</h2>
              <p className="text-stone-500 font-medium leading-relaxed">
                You are about to permanently delete <span className="text-stone-900 font-bold">{confirmDelete.companyName}</span>. All their templates and records will be lost forever.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                className="h-14 w-full bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl active:scale-95"
                onClick={applyDelete}
              >
                Yes, Delete Client
              </button>
              <button 
                className="h-14 w-full bg-stone-50 text-stone-400 font-bold rounded-2xl hover:bg-stone-100 transition-all active:scale-95"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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

      {/* User Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-xl p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-teal-50 rounded-[2rem] flex items-center justify-center text-teal-600 mb-8 mx-auto shadow-inner border border-teal-100">
              <Plus size={40} />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-stone-900 mb-2 tracking-tight">Create New Workspace</h2>
              <p className="text-stone-500 font-medium">Set up a new client account and subscription.</p>
            </div>

            <form onSubmit={createCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    className="input h-14 bg-stone-50 border-transparent focus:bg-white focus:border-teal-500 transition-all text-lg font-medium px-6"
                    placeholder="name@company.com"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Admin Phone</label>
                  <input
                    type="tel"
                    className="input h-14 bg-stone-50 border-transparent focus:bg-white focus:border-teal-500 transition-all text-lg font-medium px-6"
                    placeholder="+91 ..."
                    value={form.adminPhone}
                    onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    className="input h-14 bg-stone-50 border-transparent focus:bg-white focus:border-teal-500 transition-all text-lg font-medium px-6"
                    placeholder="••••••••"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Initial Plan</label>
                  <select
                    className="input h-14 bg-stone-50 border-transparent focus:bg-white focus:border-teal-500 transition-all text-lg font-medium px-6 appearance-none cursor-pointer"
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value as any })}
                  >
                    <option value="FREE_TRIAL">Free Trial (3 Days)</option>
                    <option value="PRO_1Y">Pro (1 Year)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="submit"
                  className="h-16 flex-1 bg-stone-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  <Plus className="h-6 w-6" /> Create Account
                </button>
                <button 
                  type="button"
                  className="h-16 px-8 bg-stone-50 text-stone-400 font-bold rounded-2xl hover:bg-stone-100 transition-all active:scale-95"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Client Admins</h1>
          <p className="text-sm text-stone-500">Manage companies, workspace plans, and access levels.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-72 group">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="input pr-10 pl-5 h-10 w-full rounded-full border-stone-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-3 h-4 w-4 text-stone-400 group-focus-within:text-teal-500 transition-colors" />
          </div>
          <button 
            className="btn-primary h-9 gap-2 shadow-lg shadow-teal-500/20"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Create User
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto h-[calc(100vh-260px)] relative">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-stone-50 border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-4">Client / Email</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-4 py-4">Plan</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Access Until</th>
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
                      {editingNameId === company.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            className="input h-8 text-sm px-2 py-0 min-w-[150px]"
                            value={newNameValue}
                            onChange={(e) => setNewNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") renameCompany();
                              if (e.key === "Escape") setEditingNameId(null);
                            }}
                          />
                          <button 
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            onClick={renameCompany}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            className="p-1 text-stone-400 hover:bg-stone-50 rounded"
                            onClick={() => setEditingNameId(null)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center group gap-2">
                          <div className="font-medium text-stone-900">{company.name}</div>
                          <button 
                            className="p-1 text-stone-300 opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition-all rounded"
                            onClick={() => {
                              setEditingNameId(company.id);
                              setNewNameValue(company.name);
                            }}
                            title="Rename Company"
                          >
                            <Edit2 size={12} /> 
                          </button>
                        </div>
                      )}
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
                          const newPlan = event.target.value as Plan;
                          setConfirmChange({
                            companyId: company.id,
                            companyName: company.name,
                            newPlan
                          });
                        }}
                      >
                        <option value="FREE_TRIAL">Free Trial (3 Days)</option>
                        <option value="PRO_1Y">Pro (1 Year)</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{company.status}</td>
                    <td className="px-4 py-3 font-medium text-stone-600">
                      {company.subscription?.endDate 
                        ? (() => {
                            const diffTime = new Date(company.subscription.endDate).getTime() - new Date().getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const isExpired = diffDays < 0;
                            return (
                              <div className="flex items-center gap-2">
                                <span>{new Date(company.subscription.endDate).toLocaleDateString()}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isExpired ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {isExpired ? 'Expired' : `${diffDays} days left`}
                                </span>
                                {company.plan === "PRO_1Y" && diffDays > 0 && diffDays < 30 && (
                                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Expiring within 30 days" />
                                )}
                              </div>
                            );
                          })()
                        : "No Subscription"}
                    </td>
                    <td className="px-4 py-3">{company._count?.users ?? 0}</td>
                    <td className="px-4 py-3">{company._count?.templates ?? 0}</td>
                    <td className="px-4 py-3">{company._count?.records ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                          onClick={() => { setHistoryWorkspace(company); loadPayments(company.id); }}
                          title="View Payment History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        {company.status === "ACTIVE" ? (
                          <button
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            onClick={() => void setStatus(company, "BLOCKED")}
                            title="Block company"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors"
                            onClick={() => void setStatus(company, "ACTIVE")}
                            title="Unblock company"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {company.plan === "FREE_TRIAL" && (
                          <button
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                            onClick={() => void extendTrial(company)}
                            title="Extend trial (+3 days)"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                        )}
                        {company.plan === "PRO_1Y" && (
                          <button
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            onClick={() => void renewPlan(company)}
                            title="Renew Pro Plan (+1 Year)"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                          onClick={() => void setResettingId(company.id)}
                          title="Reset admin password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          onClick={() => deleteCompany(company)}
                          title="Delete company"
                        >
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
        
        {/* Fixed Pagination Bar */}
        <div className="fixed bottom-0 left-0 md:left-60 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-100 p-4 px-8 flex items-center justify-between z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          {/* Left Side: Page Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="font-black text-stone-900 text-sm tracking-widest uppercase">PAGE</span>
            
            <div className="h-9 px-4 flex items-center justify-center rounded-xl border border-stone-200 text-stone-900 font-bold text-sm bg-stone-50">
              {page} / {totalPages || 1}
            </div>

            <button 
              onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))} 
              disabled={page === (totalPages || 1)}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Side: Rows and Info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="font-black text-stone-900 text-sm tracking-widest uppercase">ROWS PER PAGE:</span>
              <div className="flex items-center gap-2">
                {[10, 20, 30, 50].map((val) => (
                  <button
                    key={val}
                    onClick={() => setLimit(val)}
                    className={`h-9 w-11 flex items-center justify-center rounded-xl font-bold text-sm transition-all ${
                      limit === val 
                        ? "bg-[#1B5E20] text-white shadow-sm border border-[#1B5E20]" 
                        : "border border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-stone-200"></div>

            <div className="text-sm font-medium text-stone-500 text-right min-w-[200px]">
              Showing <span className="font-bold text-stone-900">{totalCount === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-bold text-stone-900">{Math.min(page * limit, totalCount)}</span> of <span className="font-bold text-stone-900">{totalCount}</span> members
            </div>
          </div>
        </div>
      </div>
      {/* Renewal History Modal */}
      {historyWorkspace && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-4 items-center">
                <div className="h-12 w-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-900 tracking-tight">Renewal History</h2>
                  <p className="text-sm text-stone-500 font-medium">{historyWorkspace.name}</p>
                </div>
              </div>
              <button onClick={() => setHistoryWorkspace(null)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {historyPayments.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                   <Clock className="h-8 w-8 mx-auto mb-3 opacity-20" />
                   <p className="font-medium">No transactions recorded yet.</p>
                </div>
              ) : (
                historyPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div>
                      <div className="font-black text-stone-900 text-sm uppercase tracking-wider">{payment.plan} RENEWAL</div>
                      <div className="text-xs text-stone-500 font-bold">{new Date(payment.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-teal-600">{payment.currency} {payment.amount}</div>
                      <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest">SUCCESSFUL</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              className="mt-8 w-full h-14 bg-stone-900 text-white font-black rounded-2xl hover:bg-black transition-all active:scale-95"
              onClick={() => setHistoryWorkspace(null)}
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
