import { useEffect, useMemo, useState } from "react";
import { CreditCard, Save, Settings, Settings2 } from "lucide-react";
import { api } from "../api/client";
import { WorkspaceRow } from "../types";

export function BillingPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editSettings, setEditSettings] = useState<any>(null);

  useEffect(() => {
    void api<{ data: WorkspaceRow[]; total: number }>("/workspaces").then((result) => setWorkspaces(result.data));
    void api("/workspaces/settings").then((result) => {
      setSettings(result);
      setEditSettings(result);
    });
  }, []);

  async function saveSettings() {
    try {
      const updated = await api("/workspaces/settings", {
        method: "PATCH",
        body: JSON.stringify(editSettings)
      });
      setSettings(updated);
      setIsSettingsModalOpen(false);
    } catch (err) {
      alert("Failed to save settings");
    }
  }

  const counts = useMemo(
    () =>
      workspaces.reduce(
        (acc, workspace) => {
          acc[workspace.plan] = (acc[workspace.plan] || 0) + 1;
          return acc;
        },
        { FREE_TRIAL: 0, PRO_1Y: 0 } as Record<string, number>
      ),
    [workspaces]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Plan Configuration</h1>
          <p className="text-sm text-stone-500">Define global pricing, durations, and access limits.</p>
        </div>
        <button 
          className="btn-secondary h-10 gap-2 px-6 rounded-xl border-stone-200"
          onClick={() => { setEditSettings(settings); setIsSettingsModalOpen(true); }}
        >
          <Settings2 className="h-4 w-4" /> Edit Config
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl">
        {settings && (
          <>
            <div className="panel p-6 border-teal-100 bg-teal-50/20">
              <div className="flex items-center gap-3 mb-4 text-teal-600">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <span className="font-bold">FT</span>
                </div>
                <h3 className="font-bold">Free Trial</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-stone-500">Duration</span><span className="font-semibold">{settings.FREE_TRIAL_DAYS} Days</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Record Limit</span><span className="font-semibold">{settings.FREE_TRIAL_LIMIT}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Price</span><span className="font-semibold text-teal-600">FREE</span></div>
              </div>
            </div>

            <div className="panel p-6 border-indigo-100 bg-indigo-50/20">
              <div className="flex items-center gap-3 mb-4 text-indigo-600">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <span className="font-bold">P1</span>
                </div>
                <h3 className="font-bold">Pro (1 Year)</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-stone-500">Duration</span><span className="font-semibold">{settings.PRO_1Y_DAYS} Days</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Record Limit</span><span className="font-semibold">{settings.PRO_1Y_LIMIT}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Price</span><span className="font-semibold text-indigo-600">{settings.CURRENCY} {settings.PRO_1Y_PRICE}</span></div>
              </div>
            </div>

          </>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsModalOpen && editSettings && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-stone-900 rounded-2xl flex items-center justify-center text-white mb-8 mx-auto shadow-xl">
              <Settings size={32} />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-stone-900 mb-2 tracking-tight">Configure System Plans</h2>
              <p className="text-stone-500 font-medium">Changes here reflect across all new registrations and checkouts.</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-teal-600 border-b border-teal-100 pb-2">Trial & Durations</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-tighter text-stone-400 mb-1 block">Free Trial Days</label>
                    <input type="number" className="input h-12 text-lg font-bold" value={editSettings.FREE_TRIAL_DAYS} onChange={e => setEditSettings({...editSettings, FREE_TRIAL_DAYS: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-tighter text-stone-400 mb-1 block">Pro Year Days</label>
                    <input type="number" className="input h-12 text-lg font-bold" value={editSettings.PRO_1Y_DAYS} onChange={e => setEditSettings({...editSettings, PRO_1Y_DAYS: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-tighter text-stone-400 mb-1 block">Free Trial Record Limit</label>
                    <input type="number" className="input h-12 text-lg font-bold" value={editSettings.FREE_TRIAL_LIMIT} onChange={e => setEditSettings({...editSettings, FREE_TRIAL_LIMIT: parseInt(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-100 pb-2">Pricing (Amount)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-tighter text-stone-400 mb-1 block">Pro 1Y Price ({editSettings.CURRENCY})</label>
                    <input type="number" className="input h-12 text-lg font-bold" value={editSettings.PRO_1Y_PRICE} onChange={e => setEditSettings({...editSettings, PRO_1Y_PRICE: parseInt(e.target.value)})} />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-tighter text-stone-400 mb-1 block">Currency Code</label>
                    <input type="text" className="input h-12 text-lg font-bold" placeholder="e.g. INR, USD" value={editSettings.CURRENCY} onChange={e => setEditSettings({...editSettings, CURRENCY: e.target.value.toUpperCase()})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                className="h-16 flex-1 bg-stone-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                onClick={saveSettings}
              >
                <Save className="h-6 w-6" /> Save Configuration
              </button>
              <button 
                className="h-16 px-10 bg-stone-50 text-stone-400 font-bold rounded-2xl hover:bg-stone-100 transition-all active:scale-95"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="panel p-4 text-sm text-stone-600 bg-stone-50/50 border-dashed border-stone-200">
        <CreditCard className="h-4 w-4 inline mr-2 text-stone-400" />
        Pricing changes here update the plan logic but must be synced with Stripe dashboard Price IDs if using automated checkout.
      </div>
    </div>
  );
}
