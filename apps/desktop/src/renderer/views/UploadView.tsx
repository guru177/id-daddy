import { FormEvent, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { api } from "../api";

export function UploadView() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mappings, setMappings] = useState('[{"source":"Name","target":"name"},{"source":"ID","target":"id"},{"source":"Photo","target":"photo"}]');
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage("Choose a CSV or Excel file.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("mappings", mappings);
      const result = await api<{ inserted: number }>("/records/upload", { method: "POST", body });
      setMessage(`Imported ${result.inserted} records.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Data Upload</h1>
        <p className="text-sm text-stone-500">Import CSV, XLS, or XLSX and map source fields to template placeholders.</p>
      </div>
      <form className="panel max-w-3xl p-4" onSubmit={submit}>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Dataset</span>
          <input ref={fileRef} className="input file:mr-3 file:border-0 file:bg-transparent" type="file" accept=".csv,.xlsx,.xls" />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Field mappings JSON</span>
          <textarea className="textarea min-h-32 font-mono" value={mappings} onChange={(event) => setMappings(event.target.value)} />
        </label>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={loading}>
            <Upload className="h-4 w-4" />
            Upload
          </button>
          {message ? <p className="text-sm text-stone-600">{message}</p> : null}
        </div>
      </form>
    </div>
  );
}
