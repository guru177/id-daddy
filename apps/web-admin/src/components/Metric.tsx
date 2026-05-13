import { LucideIcon } from "lucide-react";

export function Metric({
  label,
  value,
  icon: Icon,
  trend
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}) {
  return (
    <div className="panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
          <Icon className="h-4 w-4 text-green-600" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {trend && <p className="text-xs text-gray-400 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
