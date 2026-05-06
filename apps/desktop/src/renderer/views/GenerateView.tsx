import { useEffect, useState } from "react";
import { Play, RefreshCcw } from "lucide-react";
import { api } from "../api";
import { ExportRow, TemplateRow } from "../types";

export function GenerateView() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [exports, setExports] = useState<ExportRow[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [templateResult, exportResult] = await Promise.all([
      api<{ data: TemplateRow[]; total: number }>("/templates"),
      api<{ data: ExportRow[]; total: number }>("/exports")
    ]);
    setTemplates(templateResult.data);
    setExports(exportResult.data);
    setTemplateId((current) => current || templateResult.data[0]?.id || "");
  }

  useEffect(() => {
    void load();
  }, []);

  async function generate() {
    if (!templateId) {
      setMessage("Create or select a template first.");
      return;
    }
    setMessage("Queued generation job.");
    await api("/generate", {
      method: "POST",
      body: JSON.stringify({
        templateId,
        grid: { pageSize: "A4", columns: 2, rows: 5, marginMm: 8, gapMm: 4 }
      })
    });
    await load();
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Bulk Generator</h1>
        <p className="text-sm text-stone-500">Queue PDF exports using the selected template and uploaded records.</p>
      </div>
      <div className="panel mb-6 flex items-center gap-3 p-4">
        <select className="input max-w-sm" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <button className="btn-primary" onClick={() => void generate()}>
          <Play className="h-4 w-4" />
          Generate
        </button>
        <button className="btn-secondary" onClick={() => void load()}>
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
        {message ? <span className="text-sm text-stone-500">{message}</span> : null}
      </div>
      <ExportTable exports={exports} />
    </div>
  );
}

export function ExportTable({ exports }: { exports: ExportRow[] }) {
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-stone-500">
          <tr>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Message</th>
          </tr>
        </thead>
        <tbody>
          {exports.map((item) => (
            <tr key={item.id} className="border-t border-stone-100">
              <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3">{item.status}</td>
              <td className="px-4 py-3">{item.error ?? (item.fileUrl ? "Ready for print" : "Waiting")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
