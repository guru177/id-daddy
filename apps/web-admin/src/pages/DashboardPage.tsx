import { useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, FileText, Users } from "lucide-react";
import { api } from "../api/client";
import { Metric } from "../components/Metric";
import { WorkspaceRow } from "../types";

export function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);

  useEffect(() => {
    void api<{ data: WorkspaceRow[]; total: number }>("/workspaces").then((result) => setWorkspaces(result.data));
  }, []);

  const metrics = useMemo(() => {
    const totalRecords = workspaces.reduce((acc, w) => acc + (w._count?.records ?? 0), 0);
    const totalUsers = workspaces.reduce((acc, w) => acc + (w._count?.users ?? 0), 0);
    const freeClients = workspaces.filter(w => w.plan === "FREE_TRIAL").length;
    
    // Simple revenue calculation in INR: PRO_1Y=₹1999, LIFETIME=₹4999
    const revenue = workspaces.reduce((acc, w) => {
      if (w.plan === "PRO_1Y") return acc + 1999;
      if (w.plan === "LIFETIME") return acc + 4999;
      return acc;
    }, 0);

    return { totalRecords, totalUsers, freeClients, revenue };
  }, [workspaces]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-stone-500">Workspace health, adoption, and plan distribution.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Revenue" value={`₹${metrics.revenue.toLocaleString('en-IN')}`} icon={CreditCard} />
        <Metric label="Total Users" value={metrics.totalUsers} icon={Users} />
        <Metric label="Total Records" value={metrics.totalRecords} icon={FileText} />
        <Metric label="Free Trial Clients" value={metrics.freeClients} icon={Building2} />
      </div>

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
