import { useEffect, useState } from "react";
import { LayoutTemplate, Globe, Shield, Trash2, ArrowUpCircle, ArrowDownCircle, Search } from "lucide-react";
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
  };
}

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
          {filtered.map(template => (
            <div key={template.id} className="group bg-white rounded-[2rem] border border-stone-200 overflow-hidden hover:shadow-2xl hover:shadow-stone-200/50 hover:border-teal-500/30 transition-all flex flex-col">
              {/* Preview Area */}
              <div className="aspect-[1.586/1] bg-stone-50 relative overflow-hidden group-hover:bg-stone-100/50 transition-colors">
                {template.design.thumbnailFront ? (
                   <img src={template.design.thumbnailFront} className="w-full h-full object-contain p-4" alt="" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-stone-200">
                    <LayoutTemplate size={80} strokeWidth={1} />
                  </div>
                )}
                
                <div className="absolute top-4 left-4 flex gap-2">
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
                <div className="mb-6">
                  <h3 className="text-lg font-black text-stone-900 truncate mb-1">{template.name}</h3>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">
                    Last Modified: {new Date(template.updatedAt).toLocaleDateString()}
                  </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
