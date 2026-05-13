import { useEffect } from "react";
import { BarChart3, Database, FileDown, LayoutTemplate, LogOut, Sparkles, User as UserIcon } from "lucide-react";
import clsx from "clsx";
import { api } from "./api";
import { DesktopPage, useAuthStore } from "./store";
import { useDesignerStore } from "./designer/store";
import { LoginView } from "./views/LoginView";
import { DashboardView } from "./views/DashboardView";
import { DesignerView } from "./views/DesignerView";
import { UploadView } from "./views/UploadView";
import { GenerateView } from "./views/GenerateView";
import { ProfileView } from "./views/ProfileView";
import { GlobalModal } from "./designer/GlobalModal";
import faviconImg from "./assets/favicon.png";

const pages: Array<{ id: DesktopPage; label: string; icon: typeof BarChart3 }> = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "designer", label: "Designer", icon: LayoutTemplate },
  { id: "upload", label: "Data Upload", icon: Database },
  { id: "generate", label: "Bulk Generator", icon: FileDown },
  { id: "profile", label: "Profile", icon: UserIcon as any }
];

export default function App() {
  const user = useAuthStore((state) => state.user);
  const page = useAuthStore((state) => state.page);
  const isBlocked = useAuthStore((state) => state.isBlocked);
  const setPage = useAuthStore((state) => state.setPage);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (user) {
      api<any>("/auth/profile")
        .then(data => {
          updateUser({ plan: data.plan, subscriptionEnd: data.subscriptionEnd });
          if (data.settings) {
            const designerStore = useDesignerStore.getState();
            if (data.settings.organizationType) {
              designerStore.setOrganizationType(data.settings.organizationType);
            }
            if (data.settings.formConfig) {
              designerStore.setFormConfig(data.settings.formConfig);
            }
          }
        })
        .catch(err => console.error("Failed to sync profile:", err));
    }
  }, []);

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="relative flex flex-col h-screen bg-[#fdfaf5] text-[#2c3e50] font-medium">
      {/* Title Bar Drag Area */}
      <div 
        className="w-full h-8 shrink-0 flex items-center px-4 z-[9999]" 
        style={{ WebkitAppRegion: "drag", WebkitUserSelect: "none" } as any}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
            <img src={faviconImg} alt="ID Daddy" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-bold text-[#1a5d1a]">ID Daddy Desktop</span>
        </div>
      </div>

      {/* ... (Blocked Notification Overlay remains the same) */}
      {isBlocked && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
          <div className="w-full max-w-sm bg-white rounded-[40px] p-10  text-center border-2 border-red-500/20 animate-in fade-in zoom-in duration-300">
            <div className="h-20 w-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <LogOut className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-stone-900 mb-3">Account Blocked</h2>
            <p className="text-stone-900 font-medium text-lg leading-relaxed mb-8">
              Your account has been blocked by the admin. Please contact support for more information.
            </p>
            <button 
              className="w-full h-14 bg-gray-900 text-white font-black text-lg rounded-[24px] hover:bg-black transition-all  active:scale-95"
              onClick={logout}
            >
              OK, Log out
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 relative">
        <aside className={clsx(
        "flex w-80 shrink-0 flex-col border-r border-[#e8d5c4]/50 transition-all relative overflow-hidden",
        isBlocked && "grayscale"
      )}>
        <div className="absolute inset-0 bg-[#f5ece2]/50 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5ece2] via-[#f5ece2] to-[#d4e7d4]/30 -z-10" />
        
        <button 
          className="px-8 py-8 text-left hover:bg-white/40 transition-all group relative"
          onClick={() => !isBlocked && setPage("profile")}
          disabled={isBlocked}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0">
              <img src={faviconImg} alt="ID Daddy" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-black text-2xl tracking-tight group-hover:text-[#1a5d1a] transition-colors leading-none">ID Daddy</p>
              <p className="text-sm font-bold text-stone-900 mt-1 opacity-70">Desktop Professional</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className={clsx(
              "inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-2xl  border",
              user.plan === "LIFETIME" ? "bg-amber-100 text-amber-700 border-amber-200" :
              user.plan === "PRO_1Y" ? "bg-green-100 text-green-700 border-green-200" :
              "bg-stone-100 text-stone-900 border-stone-200"
            )}>
              <Sparkles size={11} className="opacity-50" />
              {(() => {
                if (user.plan === "FREE_TRIAL") {
                  if (!user.subscriptionEnd) return "Trial Version";
                  const diffDays = Math.ceil((new Date(user.subscriptionEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays < 0 ? "Trial Expired" : `${diffDays} Days Left`;
                }
                if (user.plan === "PRO_1Y") {
                  if (!user.subscriptionEnd) return "Pro (1 Year)";
                  const diffDays = Math.ceil((new Date(user.subscriptionEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays < 0 ? "Pro Expired" : `Pro (${diffDays} Days Left)`;
                }
                return "Lifetime Membership";
              })()}
            </div>
          </div>
        </button>

        <nav className="flex-1 space-y-2 px-6 py-2 overflow-y-auto custom-scrollbar">
          {pages
            .filter((item) => {
              if (user.role === "SUPER_ADMIN") {
                return !["dashboard", "profile"].includes(item.id);
              }
              return true;
            })
            .map((item) => (
              <button
                key={item.id}
                className={clsx(
                  "flex h-16 w-full items-center gap-4 px-6 text-left transition-all duration-300 group rounded-lg",
                  page === item.id 
                    ? "bg-gradient-to-r from-[#1a5d1a] to-[#2d7a2d] text-white scale-[1.02]" 
                    : "text-stone-900 hover:bg-white/60 hover:text-[#1a5d1a] hover:translate-x-1"
                )}
                onClick={() => !isBlocked && setPage(item.id)}
                disabled={isBlocked}
              >
                <div className={clsx(
                  "p-2.5 rounded-md transition-colors",
                  page === item.id ? "bg-white/20" : "bg-stone-100 group-hover:bg-white"
                )}>
                  <item.icon className={clsx("h-6 w-6", page === item.id ? "text-white" : "text-stone-900 group-hover:text-[#1a5d1a]")} />
                </div>
                <span className={clsx("font-black text-lg", page === item.id ? "text-white" : "text-stone-900")}>
                  {item.label}
                </span>
              </button>
            ))}
        </nav>

        <div className="p-6">
          <div className="bg-white/40 backdrop-blur-sm rounded-[32px] p-5 border border-white/60">
             <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-[#e8d5c4] flex items-center justify-center text-[#1a5d1a] font-black">
                  {user.workspaceName ? user.workspaceName[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black truncate">{user.workspaceName || user.email.split('@')[0]}</p>
                  <p className="text-[10px] font-bold text-stone-900 truncate">{user.email}</p>
                </div>
             </div>
            <button 
              className="w-full h-12 bg-white text-stone-900 font-black rounded-2xl border border-stone-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2 " 
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className={clsx("min-w-0 flex-1 overflow-hidden transition-all", isBlocked && "grayscale")}>
        {page === "dashboard" ? <DashboardView /> : null}
        {page === "designer" ? <DesignerView /> : null}
        {page === "upload" ? <UploadView /> : null}
        {page === "generate" ? <GenerateView /> : null}
        {page === "profile" ? <ProfileView /> : null}
      </main>
      </div>
      <GlobalModal />
    </div>
  );
}
