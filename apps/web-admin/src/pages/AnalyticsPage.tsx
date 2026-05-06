import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { api } from "../api/client";
import { WorkspaceRow } from "../types";

export function AnalyticsPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);

  useEffect(() => {
    void api<{ data: WorkspaceRow[]; total: number }>("/workspaces").then((result) => setWorkspaces(result.data));
  }, []);

  const top = useMemo(
    () =>
      [...workspaces]
        .sort((a, b) => (b._count?.records ?? 0) - (a._count?.records ?? 0))
        .slice(0, 10),
    [workspaces]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-stone-500">Tenant usage signals for operational decisions.</p>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3">
          <BarChart3 className="h-4 w-4 text-mint" />
          <h2 className="font-semibold">Top Record Volumes</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {top.map((workspace) => (
            <div key={workspace.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3">
              <div>
                <p className="font-medium">{workspace.name}</p>
                <p className="text-sm text-stone-500">{workspace.plan} plan</p>
              </div>
              <div className="w-48">
                <div className="mb-1 text-right text-sm text-stone-500">{workspace._count?.records ?? 0}</div>
                <div className="h-2 rounded-full bg-stone-100">
                  <div
                    className="h-2 rounded-full bg-mint"
                    style={{ width: `${Math.min(100, ((workspace._count?.records ?? 0) / 1000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
