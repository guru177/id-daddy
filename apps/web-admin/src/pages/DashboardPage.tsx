import { useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, FileText, Users, Clock } from "lucide-react";
import { api } from "../api/client";
import { Metric } from "../components/Metric";
import { WorkspaceRow } from "../types";

export function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [expiring, setExpiring] = useState<WorkspaceRow[]>([]);

  useEffect(() => {
    void api<{ data: WorkspaceRow[]; total: number }>("/workspaces").then((result) => setWorkspaces(result.data));
    void api("/workspaces/settings").then(setSettings);
    void api("/workspaces/revenue").then(setRevenueStats);
    void api<WorkspaceRow[]>("/workspaces/expiring").then(setExpiring);
  }, []);

  const metrics = useMemo(() => {
    const totalRecords = workspaces.reduce((acc, w) => acc + (w._count?.records ?? 0), 0);
    const totalUsers = workspaces.reduce((acc, w) => acc + (w._count?.users ?? 0), 0);
    const freeClients = workspaces.filter(w => w.plan === "FREE_TRIAL").length;
    
    const revenue = revenueStats?.[settings?.CURRENCY || 'INR'] || 0;

    return { totalRecords, totalUsers, freeClients, revenue };
  }, [workspaces, settings, revenueStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-stone-500">Workspace health, adoption, and plan distribution.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric 
          label="Total Revenue" 
          value={`${settings?.CURRENCY === 'INR' ? '₹' : (settings?.CURRENCY || '')}${metrics.revenue.toLocaleString()}`} 
          icon={CreditCard} 
        />
        <Metric label="Total Users" value={metrics.totalUsers} icon={Users} />
        <Metric label="Total Records" value={metrics.totalRecords} icon={FileText} />
        <Metric label="Free Trial Clients" value={metrics.freeClients} icon={Building2} />
      </div>

      {expiring.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-red-900 text-sm">{expiring.length} Subscriptions Expiring Soon</p>
              <p className="text-xs text-red-600 font-medium">Clients will lose access once their term ends. Please contact for renewal.</p>
            </div>
          </div>
          <div className="flex -space-x-2">
            {expiring.map((w, i) => (
              <div key={w.id} className="h-8 w-8 rounded-full bg-white border-2 border-red-50 flex items-center justify-center text-[10px] font-black text-red-600 shadow-sm" title={w.name}>
                {w.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="font-semibold">Recent Clients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.slice(0, 8).map((workspace) => (
                <tr key={workspace.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium">{workspace.name}</td>
                  <td className="px-4 py-3">{workspace.plan}</td>
                  <td className="px-4 py-3">{workspace.status}</td>
                  <td className="px-4 py-3">{workspace._count?.users ?? 0}</td>
                  <td className="px-4 py-3">{new Date(workspace.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
