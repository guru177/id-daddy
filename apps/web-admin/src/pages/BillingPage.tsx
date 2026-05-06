import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { api } from "../api/client";
import { WorkspaceRow } from "../types";

export function BillingPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);

  useEffect(() => {
    void api<{ data: WorkspaceRow[]; total: number }>("/workspaces").then((result) => setWorkspaces(result.data));
  }, []);

  const counts = useMemo(
    () =>
      workspaces.reduce(
        (acc, workspace) => {
          acc[workspace.plan] += 1;
          return acc;
        },
        { FREE: 0, BASIC: 0, PRO: 0 }
      ),
    [workspaces]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-stone-500">Plan assignments and Stripe subscription state.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(counts).map(([plan, count]) => (
          <div className="panel p-4" key={plan}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">{plan}</p>
                <p className="mt-2 text-2xl font-semibold">{count}</p>
              </div>
              <CreditCard className="h-5 w-5 text-coral" />
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-4 text-sm text-stone-600">
        Stripe Checkout is initiated from company admin clients. Webhooks update workspace plans and reset canceled
        subscriptions to Free.
      </div>
    </div>
  );
}
