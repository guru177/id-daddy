import { useEffect } from "react";
import { BarChart3, Database, FileDown, LayoutTemplate, LogOut, User as UserIcon } from "lucide-react";
import clsx from "clsx";
import { api } from "./api";
import { DesktopPage, useAuthStore } from "./store";
import { LoginView } from "./views/LoginView";
import { DashboardView } from "./views/DashboardView";
import { DesignerView } from "./views/DesignerView";
import { UploadView } from "./views/UploadView";
import { GenerateView } from "./views/GenerateView";
import { ProfileView } from "./views/ProfileView";
import { GlobalModal } from "./designer/GlobalModal";

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
        })
        .catch(err => console.error("Failed to sync profile:", err));
    }
  }, []);

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="relative flex h-screen bg-stone-100 text-ink">
      {/* ... (Blocked Notification Overlay remains the same) */}
      {isBlocked && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
          <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center border-2 border-red-500/20 animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LogOut className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-black text-stone-900 mb-3">Account Blocked</h2>
            <p className="text-stone-500 font-medium leading-relaxed mb-8">
              Your account has been blocked by the admin. Please contact support for more information.
            </p>
            <button 
              className="w-full h-12 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"
              onClick={logout}
            >
              OK, Log out
            </button>
          </div>
        </div>
      )}

      <aside className={clsx("flex w-64 shrink-0 flex-col border-r border-stone-200 bg-white transition-all", isBlocked && "grayscale")}>
        <button 
          className="border-b border-stone-200 px-5 py-4 text-left hover:bg-stone-50 transition-colors group"
          onClick={() => !isBlocked && setPage("profile")}
          disabled={isBlocked}
        >
          <p className="font-semibold group-hover:text-indigo-600 transition-colors">ID Daddy</p>
          <p className="text-xs text-stone-500">{user.email}</p>
          
          <div className="mt-3 flex items-center gap-2">
            <div className={clsx(
              "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
              user.plan === "LIFETIME" ? "bg-amber-50 text-amber-600 border-amber-200" :
              user.plan === "PRO_1Y" ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
              "bg-stone-50 text-stone-500 border-stone-200"
            )}>
              {user.plan === "FREE_TRIAL" ? "3-Day Trial" : 
               user.plan === "PRO_1Y" ? "Pro (1 Year)" : "Lifetime"}
            </div>
            {user.subscriptionEnd && user.plan !== "LIFETIME" && (
              <span className="text-[10px] font-bold text-stone-400">
                {Math.ceil((new Date(user.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left
              </span>
            )}
          </div>
        </button>
        <nav className="flex-1 space-y-1 p-3">
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
                  "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium",
                  page === item.id ? "bg-teal-50 text-mint" : "text-stone-600 hover:bg-stone-50 hover:text-ink"
                )}
                onClick={() => !isBlocked && setPage(item.id)}
                disabled={isBlocked}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
        </nav>
        <div className="border-t border-stone-200 p-3">
          <button className="btn-secondary w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className={clsx("min-w-0 flex-1 overflow-hidden transition-all", isBlocked && "grayscale")}>
        {page === "dashboard" ? <DashboardView /> : null}
        {page === "designer" ? <DesignerView /> : null}
        {page === "upload" ? <UploadView /> : null}
        {page === "generate" ? <GenerateView /> : null}
        {page === "profile" ? <ProfileView /> : null}
      </main>
      <GlobalModal />
    </div>
  );
}
