import { LucideIcon } from "lucide-react";

export function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-mint">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
