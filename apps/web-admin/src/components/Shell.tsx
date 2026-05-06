import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, Building2, CreditCard, Gauge, LogOut, Users } from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "../store/auth";

const navItems = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/users", label: "Users", icon: Users },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];

export function Shell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-stone-100 text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-stone-200 bg-white md:block">
        <div className="flex h-16 items-center border-b border-stone-200 px-5">
          <div>
            <p className="text-base font-semibold">ID Daddy</p>
            <p className="text-xs text-stone-500">Super Admin</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium",
                  isActive ? "bg-teal-50 text-mint" : "text-stone-600 hover:bg-stone-50 hover:text-ink"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div>
              <p className="text-sm font-medium text-stone-500">Platform Console</p>
              <p className="text-sm text-stone-400">{user?.email}</p>
            </div>
            <button className="btn-secondary" onClick={logout} title="Sign out">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
