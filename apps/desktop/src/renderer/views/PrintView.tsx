import { useEffect, useState } from "react";
import { Printer, RefreshCcw } from "lucide-react";
import { api } from "../api";
import { ExportRow } from "../types";

export function PrintView() {
  const [exports, setExports] = useState<ExportRow[]>([]);
  const [message, setMessage] = useState("");
  const [silent, setSilent] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  async function load() {
    const result = await api<{ data: ExportRow[]; total: number }>("/exports");
    setExports(result.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function print(exportId: string) {
    setMessage("Preparing print job...");
    const { url } = await api<{ url: string }>(`/exports/${exportId}/download`);
    const result = await window.idDaddy.printUrl(url, {
      silent,
      deviceName: deviceName || undefined
    });
    setMessage(result.ok ? "Print job sent." : "Printer rejected the job.");
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Print Manager</h1>
        <p className="text-sm text-stone-900">Print generated grid PDFs through the system printer.</p>
      </div>
      <div className="panel mb-6 flex items-center gap-4 p-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={silent} onChange={(event) => setSilent(event.target.checked)} />
          Silent print
        </label>
        <input
          className="input max-w-sm"
          placeholder="Printer device name"
          value={deviceName}
          onChange={(event) => setDeviceName(event.target.value)}
        />
        <button className="btn-secondary" onClick={() => void load()}>
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
        {message ? <span className="text-sm text-stone-900">{message}</span> : null}
      </div>
      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-900">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {exports.map((item) => (
              <tr key={item.id} className="border-t border-stone-100">
                <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{item.status}</td>
                <td className="px-4 py-3">
                  <button
                    className="btn-primary"
                    disabled={item.status !== "COMPLETED" || !item.fileUrl}
                    onClick={() => void print(item.id)}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
