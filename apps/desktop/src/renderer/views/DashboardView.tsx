import { useEffect, useState, useMemo } from "react";
import { Briefcase, Database, LayoutTemplate, PlusCircle, Upload, PlayCircle, User } from "lucide-react";
import { useAuthStore } from "../store";
import { useDesignerStore } from "../designer/store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function DashboardView() {
  const setPage = useAuthStore((state) => state.setPage);
  const user = useAuthStore((state) => state.user);

  const members = useDesignerStore((state) => state.members);
  const savedDesigns = useDesignerStore((state) => state.savedDesigns);
  const loadMembersFromDb = useDesignerStore((state) => state.loadMembersFromDb);
  const loadTemplatesFromDb = useDesignerStore((state) => state.loadTemplatesFromDb);
  const syncLocalData = useDesignerStore((state) => state.syncLocalData);

  useEffect(() => {
    void loadMembersFromDb().then(() => {
      void loadTemplatesFromDb().then(() => {
        void syncLocalData();
      });
    });
  }, [loadMembersFromDb, loadTemplatesFromDb, syncLocalData]);

  const chartData = useMemo(() => {
    // Group members by department instead of creation date
    const depts: Record<string, number> = {};
    members.forEach(m => {
      const d = m.department || 'Unassigned';
      depts[d] = (depts[d] || 0) + 1;
    });
    return Object.entries(depts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 departments
  }, [members]);



  return (
    <div className="h-full flex flex-col overflow-hidden bg-stone-50 p-8">
      <div className="mb-6 flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-stone-800">Welcome back{user ? `, ${user.email.split('@')[0]}` : ''}</h1>
          <p className="text-stone-500 mt-1">Here is your workspace overview.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setPage('designer')} className="btn-primary flex items-center gap-2 rounded-full px-5 shadow-sm hover:shadow-md transition-shadow">
            <PlusCircle className="h-4 w-4" /> New Design
          </button>
          <button onClick={() => setPage('upload')} className="btn-secondary flex items-center gap-2 rounded-full px-5 shadow-sm hover:shadow-md transition-shadow bg-white">
            <Upload className="h-4 w-4" /> Upload Data
          </button>
        </div>
      </div>

      <div className="grid shrink-0 gap-6 md:grid-cols-3 mb-6">
        <Metric label="Active Templates" value={savedDesigns.length} icon={LayoutTemplate} />
        <Metric label="Total Members" value={members.length} icon={Database} />
        <Metric label="Departments" value={chartData.length} icon={Briefcase} />
      </div>

      <div className="grid flex-1 min-h-0 gap-6 md:grid-cols-3 mb-6">
        <div className="md:col-span-2 panel p-6 rounded-2xl shadow-sm bg-white border border-stone-100 flex flex-col">
          <h2 className="font-medium text-stone-700 mb-6 shrink-0">Members by Department</h2>
          <div className="flex-1 min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: '12px', border: '1px solid #f5f5f4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-stone-400 text-sm">No member data available</div>
            )}
          </div>
        </div>

        <div className="panel p-6 rounded-2xl shadow-sm bg-white border border-stone-100 flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="font-medium text-stone-700">Recent Members</h2>
            <button className="text-sm text-mint hover:text-teal-700 font-medium transition-colors" onClick={() => setPage('upload')}>View All</button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
            <div className="flex flex-col gap-3 flex-1 justify-between">
              {members.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center gap-4 bg-stone-50/50 hover:bg-stone-50 border border-stone-100 rounded-full py-2 px-3 transition-colors">
                  {m.profileImage ? (
                    <img src={m.profileImage} alt="" className="h-12 w-12 rounded-full object-cover shrink-0 bg-white border border-stone-200 shadow-sm" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-stone-200 shadow-sm text-stone-400">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-base font-semibold text-stone-800 truncate">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-stone-500 truncate leading-tight mt-0.5">{m.idNumber || m.employeeId || 'No ID'}</p>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="flex h-full items-center justify-center text-stone-400 text-sm py-8">No members found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid shrink-0 gap-6 md:grid-cols-3">
        <QuickLink icon={LayoutTemplate} label="Manage Designs" desc="Edit or create ID templates" onClick={() => setPage('designer')} />
        <QuickLink icon={Database} label="Manage Data" desc="Upload and preview members" onClick={() => setPage('upload')} />
        <QuickLink icon={PlayCircle} label="Bulk Generate" desc="Create print-ready files" onClick={() => setPage('generate')} />
      </div>

    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof LayoutTemplate }) {
  return (
    <div className="panel p-6 rounded-2xl shadow-sm bg-white border border-stone-100 flex items-center gap-5 hover:border-mint/30 transition-colors">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-mint">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <p className="mt-1 text-3xl font-light text-stone-800">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, label, desc, onClick }: { icon: typeof LayoutTemplate; label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="panel p-5 rounded-2xl bg-white border border-stone-100 hover:border-mint hover:shadow-md transition-all text-left group">
      <div className="mb-4 text-stone-400 group-hover:text-mint transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-medium text-stone-800 mb-1">{label}</h3>
      <p className="text-xs text-stone-500">{desc}</p>
    </button>
  );
}
