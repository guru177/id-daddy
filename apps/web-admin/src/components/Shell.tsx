import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, Building2, CreditCard, Gauge, LogOut, LayoutTemplate, MonitorUp } from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "../store/auth";

const navItems = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/companies", label: "Clients", icon: Building2 },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/releases", label: "Releases", icon: MonitorUp },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];

export function Shell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 md:flex flex-col bg-white border-r border-gray-100">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
            <img src="/favicon.png" alt="ID Daddy" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">ID Daddy</p>
            <p className="text-[10px] font-semibold text-green-600 mt-0.5 tracking-wide uppercase">Admin Console</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-green-50 text-green-700 font-semibold"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={clsx("h-4 w-4 shrink-0", isActive ? "text-green-600" : "text-gray-400")} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl group">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.email?.split("@")[0]}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 md:pl-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-6 md:px-8 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">Platform Console</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <button className="btn-secondary text-xs gap-1.5" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </header>

        <main className="flex-1 px-6 py-7 md:px-8">{children}</main>
      </div>
    </div>
  );
}
