import { useEffect, useState } from "react";
import { Key, Mail, Phone, Save, Building2 } from "lucide-react";
import { api } from "../api";

export function ProfileView() {
  const [profile, setProfile] = useState<{
    email: string;
    phone: string | null;
    workspaceName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  async function load() {
    try {
      const data = await api<any>("/auth/profile");
      setProfile(data);
      setForm({
        email: data.email,
        phone: data.phone || "",
        password: "",
        confirmPassword: ""
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          password: form.password || undefined
        })
      });
      setMessage("Profile updated successfully");
      setForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <p className="text-stone-400 font-medium">Loading profile...</p>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-stone-50/50 p-6 lg:p-10">
      <div className="w-full">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">Account Settings</h1>
          <p className="text-lg text-stone-500 font-medium">Manage your administrator profile and workspace credentials.</p>
        </header>

        <div className="grid gap-8 grid-cols-1 xl:grid-cols-2">
          {/* Workspace Info Card */}
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-stone-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-6 mb-10 pb-8 border-b border-stone-100">
                <div className="h-20 w-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 shrink-0">
                  <Building2 size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-stone-900 leading-tight mb-1">{profile?.workspaceName}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 bg-stone-100 rounded-md">Enterprise</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-wider">Email Address</label>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">Primary ID</span>
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                    <input
                      className="w-full h-14 pl-14 pr-5 rounded-2xl bg-stone-100/50 border-2 border-stone-100 text-stone-400 font-bold outline-none cursor-not-allowed"
                      value={form.email}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-wider">Phone Number</label>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded-md">Fixed Contact</span>
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                    <input
                      className="w-full h-14 pl-14 pr-5 rounded-2xl bg-stone-100/50 border-2 border-stone-100 text-stone-400 font-bold outline-none cursor-not-allowed"
                      placeholder="Not provided"
                      value={form.phone}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-stone-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                  <Key size={22} />
                </div>
                <h3 className="text-xl font-black text-stone-900">Security & Password</h3>
              </div>

              <div className="grid gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-stone-400 uppercase tracking-wider ml-1">New Password</label>
                  <input
                    type="password"
                    className="w-full h-14 px-5 rounded-2xl bg-stone-50 border-2 border-stone-100 text-stone-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-stone-400 uppercase tracking-wider ml-1">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full h-14 px-5 rounded-2xl bg-stone-50 border-2 border-stone-100 text-stone-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </div>
                <p className="mt-4 text-xs text-stone-400 font-medium italic">Leave password fields blank to keep your current credentials.</p>
              </div>

              <div className="space-y-4 pt-6 mt-6 border-t border-stone-50">
                {message && (
                  <div className="p-4 rounded-2xl bg-green-50 border border-green-100 text-green-700 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    className="flex items-center gap-2 h-14 px-12 bg-stone-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                    onClick={save}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Settings"}
                    <Save size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
