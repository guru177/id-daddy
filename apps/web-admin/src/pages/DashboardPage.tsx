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

  const totals = useMemo(
    () =>
      workspaces.reduce(
        (acc, workspace) => {
          acc.users += workspace._count?.users ?? 0;
          acc.records += workspace._count?.records ?? 0;
          acc.exports += workspace._count?.exports ?? 0;
          return acc;
        },
        { users: 0, records: 0, exports: 0 }
      ),
    [workspaces]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-stone-500">Workspace health, adoption, and plan distribution.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Companies" value={workspaces.length} icon={Building2} />
        <Metric label="Users" value={totals.users} icon={Users} />
        <Metric label="Records" value={totals.records} icon={FileText} />
        <Metric label="Exports" value={totals.exports} icon={CreditCard} />
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="font-semibold">Recent Companies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3">Company</th>
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
