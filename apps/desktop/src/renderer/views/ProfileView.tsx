import { useEffect, useState } from "react";
import { Key, Mail, Phone, Save, Building2, Edit2, CheckCircle2, X, Eye, EyeOff } from "lucide-react";
import { api } from "../api";
import { useAuthStore } from "../store";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [isEditingWorkspaceName, setIsEditingWorkspaceName] = useState(false);
  const [tempWorkspaceName, setTempWorkspaceName] = useState("");

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
    setError("");
    setMessage("");

    if (form.password) {
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    } else if (form.confirmPassword) {
      setError("Please enter a new password");
      return;
    }

    if (isEditingWorkspaceName && !tempWorkspaceName.trim()) {
      setError("Workspace name cannot be empty");
      return;
    }

    if (!form.password && !isEditingWorkspaceName) {
      setError("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const newWorkspaceName = isEditingWorkspaceName ? tempWorkspaceName : undefined;
      await api("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          password: form.password || undefined,
          workspaceName: newWorkspaceName
        })
      });
      setIsEditingWorkspaceName(false);
      setMessage("Profile updated successfully");
      setForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
      if (newWorkspaceName) {
        useAuthStore.getState().updateUser({ workspaceName: newWorkspaceName });
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <p className="text-stone-900 font-medium">Loading profile...</p>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-stone-50/50 p-6 lg:p-10">
      <div className="w-full">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">Account Settings</h1>
          <p className="text-lg text-stone-900 font-medium">Manage your administrator profile and workspace credentials.</p>
        </header>

        <div className="grid gap-8 grid-cols-1 xl:grid-cols-2">
          {/* Workspace Info Card */}
          <div className="bg-white rounded-[2rem] p-10  border border-stone-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-6 mb-10 pb-8 border-b border-stone-100">
                <div className="h-20 w-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white   shrink-0">
                  <Building2 size={40} />
                </div>
                 <div>
                  {isEditingWorkspaceName ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        autoFocus
                        className="h-9 px-3 bg-white border-2 border-indigo-500 rounded-xl text-lg font-black text-stone-900 outline-none "
                        value={tempWorkspaceName}
                        onChange={(e) => setTempWorkspaceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") save();
                          if (e.key === "Escape") setIsEditingWorkspaceName(false);
                        }}
                      />
                      <button 
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        onClick={save}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        className="p-2 text-stone-900 hover:bg-stone-50 rounded-xl transition-colors"
                        onClick={() => setIsEditingWorkspaceName(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 group mb-1">
                      <h2 className="text-2xl font-black text-stone-900 leading-tight">{profile?.workspaceName}</h2>
                      <button 
                        className="p-1.5 text-stone-300 opacity-0 group-hover:opacity-100 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-lg"
                        onClick={() => {
                          setTempWorkspaceName(profile?.workspaceName || "");
                          setIsEditingWorkspaceName(true);
                        }}
                        title="Rename Workspace"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-stone-900 font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 bg-stone-100 rounded-md">Enterprise</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-black text-stone-900 uppercase tracking-wider">Email Address</label>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">Primary ID</span>
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                    <input
                      className="w-full h-14 pl-14 pr-5 rounded-2xl bg-stone-100/50 border-2 border-stone-100 text-stone-900 font-bold outline-none cursor-not-allowed"
                      value={form.email}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-black text-stone-900 uppercase tracking-wider">Phone Number</label>
                    <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded-md">Fixed Contact</span>
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                    <input
                      className="w-full h-14 pl-14 pr-5 rounded-2xl bg-stone-100/50 border-2 border-stone-100 text-stone-900 font-bold outline-none cursor-not-allowed"
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
          <div className="bg-white rounded-[2rem] p-10  border border-stone-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 ">
                  <Key size={22} />
                </div>
                <h3 className="text-xl font-black text-stone-900">Security & Password</h3>
              </div>

              <div className="grid gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-stone-900 uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full h-14 pl-5 pr-12 rounded-2xl bg-stone-50 border-2 border-stone-100 text-stone-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all "
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-stone-900 uppercase tracking-wider ml-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full h-14 pl-5 pr-12 rounded-2xl bg-stone-50 border-2 border-stone-100 text-stone-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all "
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-xs text-stone-900 font-medium italic">Leave password fields blank to keep your current credentials.</p>
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
                    className="flex items-center gap-2 h-14 px-12 bg-stone-900 text-white font-black rounded-2xl hover:bg-black transition-all  hover:-translate-y-1 active:scale-95 disabled:opacity-50"
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
