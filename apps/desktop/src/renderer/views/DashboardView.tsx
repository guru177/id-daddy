import { useEffect, useState } from "react";
import { Database, FileDown, LayoutTemplate } from "lucide-react";
import { api } from "../api";
import { ExportRow, RecordRow, TemplateRow } from "../types";

export function DashboardView() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [exports, setExports] = useState<ExportRow[]>([]);

  useEffect(() => {
    void Promise.all([
      api<{ data: TemplateRow[]; total: number }>("/templates"),
      api<{ data: RecordRow[]; total: number }>("/records"),
      api<{ data: ExportRow[]; total: number }>("/exports")
    ]).then(([templateResult, recordResult, exportResult]) => {
      setTemplates(templateResult.data);
      setRecords(recordResult.data);
      setExports(exportResult.data);
    });
  }, []);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-stone-500">Workspace production overview.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Templates" value={templates.length} icon={LayoutTemplate} />
        <Metric label="Records" value={records.length} icon={Database} />
        <Metric label="Exports" value={exports.length} icon={FileDown} />
      </div>
      <div className="panel mt-6 overflow-hidden">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="font-semibold">Recent Exports</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">File</th>
            </tr>
          </thead>
          <tbody>
            {exports.slice(0, 8).map((item) => (
              <tr key={item.id} className="border-t border-stone-100">
                <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{item.status}</td>
                <td className="px-4 py-3">{item.fileUrl ? "Ready" : item.error ?? "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof LayoutTemplate }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-mint">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
