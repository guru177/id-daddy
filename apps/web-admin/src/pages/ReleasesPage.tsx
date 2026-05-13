import { useState, useEffect } from "react";
import { MonitorUp, Plus, Trash2, Loader2, FileDown } from "lucide-react";
import { api } from "../api/client";

interface AppRelease {
  id: string;
  version: string;
  releaseNotes: string;
  isMandatory: boolean;
  platform: string;
  createdAt: string;
  installerUrl: string;
  yamlUrl: string;
}

export function ReleasesPage() {
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [version, setVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);
  const [platform, setPlatform] = useState("windows");
  const [installerFile, setInstallerFile] = useState<File | null>(null);
  const [yamlFile, setYamlFile] = useState<File | null>(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const data = await api<AppRelease[]>("/admin/releases");
      setReleases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this release?")) return;
    try {
      await api(`/admin/releases/${id}`, { method: "DELETE" });
      fetchReleases();
    } catch (err) {
      console.error(err);
      alert("Failed to delete release");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installerFile || !yamlFile) {
      alert("Please upload both the installer and latest.yml files.");
      return;
    }
    if (!version) {
      alert("Version is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("version", version);
      formData.append("releaseNotes", releaseNotes);
      formData.append("isMandatory", String(isMandatory));
      formData.append("platform", platform);
      formData.append("installer", installerFile);
      formData.append("yaml", yamlFile);

      await api("/admin/releases", {
        method: "POST",
        body: formData
      });
      setIsModalOpen(false);
      
      // Reset form
      setVersion("");
      setReleaseNotes("");
      setIsMandatory(false);
      setPlatform("windows");
      setInstallerFile(null);
      setYamlFile(null);
      
      fetchReleases();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to create release");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <MonitorUp className="h-5 w-5 text-gray-400" /> Desktop App Releases
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and distribute updates for the ID Daddy desktop application.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Publish Update
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Version</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Release Notes</th>
                <th className="px-6 py-4">Published Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {releases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No releases published yet.
                  </td>
                </tr>
              ) : (
                releases.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">v{r.version}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize">{r.platform}</span>
                    </td>
                    <td className="px-6 py-4">
                      {r.isMandatory ? (
                        <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">Mandatory</span>
                      ) : (
                        <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">Optional</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-gray-500" title={r.releaseNotes}>
                      {r.releaseNotes || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Publish New Update</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="releaseForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Version Number *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1.0.5" 
                      required 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                      value={version}
                      onChange={e => setVersion(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Platform</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                      value={platform}
                      onChange={e => setPlatform(e.target.value)}
                    >
                      <option value="windows">Windows</option>
                      <option value="mac">macOS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Release Notes</label>
                  <textarea 
                    placeholder="What's new in this version?" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 h-24 resize-none"
                    value={releaseNotes}
                    onChange={e => setReleaseNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="mandatory" 
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    checked={isMandatory}
                    onChange={e => setIsMandatory(e.target.checked)}
                  />
                  <label htmlFor="mandatory" className="text-sm text-gray-700 font-medium">Force Mandatory Update</label>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">1. Upload latest.yml *</label>
                  <input 
                    type="file" 
                    accept=".yml"
                    required
                    onChange={e => setYamlFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">2. Upload Installer (.exe / .dmg) *</label>
                  <input 
                    type="file" 
                    accept=".exe,.dmg,.zip"
                    required
                    onChange={e => setInstallerFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                form="releaseForm" 
                type="submit" 
                className="btn-primary flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                {isSubmitting ? "Uploading..." : "Publish Release"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
