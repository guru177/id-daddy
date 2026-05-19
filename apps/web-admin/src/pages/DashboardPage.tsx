import { useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, FileText, Users, Clock, ArrowUpRight } from "lucide-react";
import { api } from "../api/client";
import { Metric } from "../components/Metric";
import { WorkspaceRow } from "../types";

const planBadge: Record<string, string> = {
  PRO_1Y:   "badge-blue",
  FREE_TRIAL:"badge-gray"
};
const planLabel: Record<string, string> = {
  PRO_1Y:   "Pro 1Y",
  FREE_TRIAL:"Free Trial"
};

export function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [expiring, setExpiring] = useState<WorkspaceRow[]>([]);

  useEffect(() => {
    void api<{ data: WorkspaceRow[]; total: number }>("/workspaces").then((r) => setWorkspaces(r.data));
    void api("/workspaces/settings").then(setSettings);
    void api<WorkspaceRow[]>("/workspaces/expiring").then(setExpiring);
  }, []);

  const metrics = useMemo(() => {
    const totalRecords = workspaces.reduce((acc, w) => acc + (w._count?.records ?? 0), 0);
    const totalUsers   = workspaces.reduce((acc, w) => acc + (w._count?.users ?? 0), 0);
    const freeClients  = workspaces.filter((w) => w.plan === "FREE_TRIAL").length;
    return { totalRecords, totalUsers, freeClients };
  }, [workspaces, settings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Workspace health, adoption, and plan distribution.</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Total Users"       value={metrics.totalUsers}   icon={Users} />
        <Metric label="Total Records"     value={metrics.totalRecords} icon={FileText} />
        <Metric label="Free Trial Clients" value={metrics.freeClients} icon={Building2} />
      </div>

      {/* Expiring alert */}
      {expiring.length > 0 && (
        <div className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-red-100 flex items-center justify-center text-red-500">
            <Clock className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">{expiring.length} Subscription{expiring.length > 1 ? "s" : ""} Expiring Soon</p>
            <p className="text-xs text-red-500 mt-0.5">Clients will lose access once their term ends.</p>
          </div>
          <div className="flex -space-x-2 shrink-0">
            {expiring.slice(0, 5).map((w) => (
              <div key={w.id} className="h-7 w-7 rounded-full bg-white border-2 border-red-50 flex items-center justify-center text-[10px] font-bold text-red-600 shadow-sm" title={w.name}>
                {w.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent clients table */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Recent Clients</h2>
          <span className="text-xs text-gray-400">{workspaces.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workspaces.slice(0, 8).map((workspace) => (
                <tr key={workspace.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-green-50 flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{workspace.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={planBadge[workspace.plan] ?? "badge-gray"}>
                      {planLabel[workspace.plan] ?? workspace.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={workspace.status === "ACTIVE" ? "badge-green" : "badge-red"}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 inline-block" />
                      {workspace.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 font-medium">{workspace._count?.users ?? 0}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(workspace.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
