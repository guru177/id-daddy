import { useEffect, useState } from "react";
import { LayoutTemplate, Globe, Shield, Trash2, ArrowUpCircle, ArrowDownCircle, Search, Edit2, X } from "lucide-react";
import { api } from "../api/client";

interface Template {
  id: string;
  name: string;
  isGlobal: boolean;
  workspaceId: string | null;
  updatedAt: string;
  design: {
    thumbnailFront?: string;
    thumbnailBack?: string;
    config?: {
      orientation: "horizontal" | "vertical";
      backsidePrinting?: string;
    };
  };
}

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [renameModal, setRenameModal] = useState({ isOpen: false, templateId: "", newName: "" });

  async function load() {
    try {
      const result = await api<{ data: Template[] }>("/templates");
      setTemplates(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function promote(id: string) {
    if (!confirm("Make this template available to ALL clients?")) return;
    try {
      await api(`/templates/${id}/promote`, { method: "POST" });
      void load();
    } catch (err) {
      alert("Failed to promote template");
    }
  }

  async function demote(id: string) {
    if (!confirm("Remove this template from the global gallery?")) return;
    try {
      await api(`/templates/${id}/demote`, { method: "POST" });
      void load();
    } catch (err) {
      alert("Failed to demote template");
    }
  }

  async function remove(id: string) {
    if (!confirm("Permanently delete this template?")) return;
    try {
      await api(`/templates/${id}`, { method: "DELETE" });
      void load();
    } catch (err) {
      alert("Failed to delete template");
    }
  }

  function openRenameModal(id: string, currentName: string) {
    setRenameModal({ isOpen: true, templateId: id, newName: currentName });
  }

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { templateId, newName } = renameModal;
    if (!newName.trim()) return;

    try {
      await api(`/templates/${templateId}`, { 
        method: "PATCH",
        body: JSON.stringify({ name: newName.trim() })
      });
      setRenameModal({ isOpen: false, templateId: "", newName: "" });
      void load();
    } catch (err) {
      alert("Failed to rename template");
    }
  }

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Global Templates</h1>
          <p className="text-stone-500 font-medium mt-1">Manage official designs pushed to all client workspaces.</p>
        </div>
        
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            className="w-full h-11 pl-12 pr-4 rounded-xl border border-stone-200 bg-white focus:border-teal-500 outline-none transition-all shadow-sm"
            placeholder="Search designs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-stone-400 font-medium">Loading templates...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-stone-50 rounded-[2.5rem] border-2 border-dashed border-stone-200 p-12 text-center">
          <div className="h-20 w-20 bg-stone-100 rounded-3xl flex items-center justify-center text-stone-300 mb-6">
            <LayoutTemplate size={40} />
          </div>
          <h3 className="text-xl font-black text-stone-800 mb-2">No Designs Found</h3>
          <p className="text-stone-500 max-w-sm mb-8">Design your official templates in the desktop app first, then return here to publish them to clients.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(template => {
            const isHorizontal = template.design.config?.orientation === 'horizontal';
            return (
            <div key={template.id} className="group bg-white rounded-[2rem] border border-stone-200 overflow-hidden hover:shadow-2xl hover:shadow-stone-200/50 hover:border-teal-500/30 transition-all flex flex-col">
              {/* Preview Area – dual front/back split */}
              <div className={`relative w-full ${isHorizontal ? 'aspect-[86/108]' : 'aspect-[108/86]'} bg-stone-50 overflow-hidden group-hover:bg-stone-100/50 transition-colors duration-500`}>
                <div className={`w-full h-full flex ${isHorizontal ? 'flex-col' : 'flex-row'}`}>
                  {/* Front half */}
                  <div className="flex-1 relative border-r border-stone-100 overflow-hidden group-hover:scale-105 transition-transform duration-700">
                    {template.design.thumbnailFront ? (
                      <img src={template.design.thumbnailFront} className="w-full h-full object-contain" alt="Front" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-stone-200">
                        <LayoutTemplate size={40} strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-[0.1em] rounded-full shadow-lg border border-white/10 z-10">
                      Front
                    </div>
                  </div>

                  {/* Back half */}
                  <div className="flex-1 relative overflow-hidden border-l border-stone-100 first:border-0 group-hover:scale-105 transition-transform duration-700 delay-75">
                    {template.design.config?.backsidePrinting !== 'none' && template.design.thumbnailBack ? (
                      <img src={template.design.thumbnailBack} className="w-full h-full object-contain" alt="Back" />
                    ) : (
                      <div className="w-full h-full bg-white flex items-center justify-center">
                        <span className="text-gray-300 font-black uppercase tracking-[0.15em] text-xs">Blank</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-[0.1em] rounded-full shadow-lg border border-white/10 z-10">
                      Back
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <div className="absolute top-3 right-3 flex gap-2">
                  {template.isGlobal ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-teal-500/20">
                      <Globe size={10} /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20">
                      <Shield size={10} /> Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Info Area */}
              <div className="p-6 flex-1 flex flex-col justify-between border-t border-stone-50">
                <div className="mb-6 flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-stone-900 truncate mb-1" title={template.name}>{template.name}</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">
                      Last Modified: {new Date(template.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => openRenameModal(template.id, template.name)}
                    className="p-2 text-stone-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors shrink-0"
                    title="Rename Template"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {template.isGlobal ? (
                    <button 
                      onClick={() => demote(template.id)}
                      className="flex-1 flex items-center justify-center gap-2 h-11 bg-stone-100 text-stone-600 hover:bg-stone-200 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                    >
                      <ArrowDownCircle size={16} /> Unpublish
                    </button>
                  ) : (
                    <button 
                      onClick={() => promote(template.id)}
                      className="flex-1 flex items-center justify-center gap-2 h-11 bg-teal-600 text-white hover:bg-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-teal-500/20 transition-all"
                    >
                      <ArrowUpCircle size={16} /> Push to Global
                    </button>
                  )}
                  
                  <button 
                    onClick={() => remove(template.id)}
                    className="flex h-11 w-11 items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Rename Modal */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h3 className="text-lg font-black text-stone-900">Rename Template</h3>
              <button 
                onClick={() => setRenameModal({ isOpen: false, templateId: "", newName: "" })}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRenameSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Template Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={renameModal.newName}
                  onChange={e => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-teal-500 outline-none transition-all"
                  placeholder="e.g., Standard Employee ID"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setRenameModal({ isOpen: false, templateId: "", newName: "" })}
                  className="px-5 py-2.5 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!renameModal.newName.trim()}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-teal-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
