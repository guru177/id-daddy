import { BarChart3, Database, FileDown, LayoutTemplate, LogOut, Printer } from "lucide-react";
import clsx from "clsx";
import { DesktopPage, useAuthStore } from "./store";
import { LoginView } from "./views/LoginView";
import { DashboardView } from "./views/DashboardView";
import { DesignerView } from "./views/DesignerView";
import { UploadView } from "./views/UploadView";
import { GenerateView } from "./views/GenerateView";
import { PrintView } from "./views/PrintView";
import { GlobalModal } from "./designer/GlobalModal";

const pages: Array<{ id: DesktopPage; label: string; icon: typeof BarChart3 }> = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "designer", label: "Designer", icon: LayoutTemplate },
  { id: "upload", label: "Data Upload", icon: Database },
  { id: "generate", label: "Bulk Generator", icon: FileDown },
  { id: "print", label: "Print Manager", icon: Printer }
];

export default function App() {
  const user = useAuthStore((state) => state.user);
  const page = useAuthStore((state) => state.page);
  const setPage = useAuthStore((state) => state.setPage);
  const logout = useAuthStore((state) => state.logout);

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-stone-100 text-ink">
      <aside className="flex w-64 shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4">
          <p className="font-semibold">ID Daddy</p>
          <p className="text-xs text-stone-500">{user.email}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {pages.map((item) => (
            <button
              key={item.id}
              className={clsx(
                "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium",
                page === item.id ? "bg-teal-50 text-mint" : "text-stone-600 hover:bg-stone-50 hover:text-ink"
              )}
              onClick={() => setPage(item.id)}
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
      <main className="min-w-0 flex-1 overflow-hidden">
        {page === "dashboard" ? <DashboardView /> : null}
        {page === "designer" ? <DesignerView /> : null}
        {page === "upload" ? <UploadView /> : null}
        {page === "generate" ? <GenerateView /> : null}
        {page === "print" ? <PrintView /> : null}
      </main>
      <GlobalModal />
    </div>
  );
}
