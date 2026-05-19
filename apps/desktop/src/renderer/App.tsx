import { useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  Database,
  FileDown,
  LayoutTemplate,
  LogOut,
  Sparkles,
  User as UserIcon,
  CheckCircle2,
  X,
} from "lucide-react";

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
import { UpdateNotification } from "./UpdateNotification";

import faviconImg from "./assets/favicon.png";

const pages: Array<{
  id: DesktopPage;
  label: string;
  icon: typeof BarChart3;
}> = [
    { id: "upload", label: "Data Upload", icon: Database },
    { id: "designer", label: "Designer", icon: LayoutTemplate },
    { id: "generate", label: "Bulk Generator", icon: FileDown },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "profile", label: "Profile", icon: UserIcon as any },
  ];

export default function App() {
  const user = useAuthStore((state) => state.user);
  const page = useAuthStore((state) => state.page);

  const isBlocked = useAuthStore((state) => state.isBlocked);

  const setPage = useAuthStore((state) => state.setPage);

  const setSystemSettings = useAuthStore(
    (state) => state.setSystemSettings
  );

  const updateUser = useAuthStore(
    (state) => state.updateUser
  );

  const logout = useAuthStore((state) => state.logout);

  const [appVersion, setAppVersion] = useState("1.0.0");

  const [showUpgradePrompt, setShowUpgradePrompt] =
    useState(false);

  const [pricing, setPricing] = useState({
    PRO_1Y_PRICE: 2999,
    LIFETIME_PRICE: 9999,
    CURRENCY: "INR",
  });

  const [isTimeExpired, setIsTimeExpired] = useState(false);

  useEffect(() => {
    if (!user || user.plan === "LIFETIME" || !user.subscriptionEnd) {
      setIsTimeExpired(false);
      return;
    }

    const timeUntilExpiry = new Date(user.subscriptionEnd).getTime() - Date.now();

    if (timeUntilExpiry <= 0) {
      setIsTimeExpired(true);
    } else if (timeUntilExpiry < 2147483647) {
      // Schedule exact block when time runs out (max ~24.8 days)
      const timeoutId = setTimeout(() => {
        setIsTimeExpired(true);
      }, timeUntilExpiry);
      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  const isPlanExpired = useMemo(() => {
    if (
      !user ||
      user.plan === "LIFETIME" ||
      !user.subscriptionEnd
    )
      return false;

    return (
      isTimeExpired || new Date(user.subscriptionEnd).getTime() < Date.now()
    );
  }, [user, isTimeExpired, page]);

  useEffect(() => {
    if (
      user &&
      user.plan === "FREE_TRIAL" &&
      !isPlanExpired
    ) {
      const interval = setInterval(() => {
        setShowUpgradePrompt(true);
      }, 10 * 60 * 1000); // 10 minutes

      return () => clearInterval(interval);
    }
  }, [user, isPlanExpired]);

  useEffect(() => {
    window.idDaddy
      ?.getAppVersion?.()
      .then((v) => setAppVersion(v))
      .catch(() => { });

    api<any>("/auth/system-settings")
      .then((data) => {
        if (data) {
          setSystemSettings(data);

          setPricing((prev) => ({
            ...prev,
            PRO_1Y_PRICE:
              data.PRO_1Y_PRICE ?? prev.PRO_1Y_PRICE,
            LIFETIME_PRICE:
              data.LIFETIME_PRICE ?? prev.LIFETIME_PRICE,
            CURRENCY: data.CURRENCY ?? prev.CURRENCY,
          }));
        }
      })
      .catch((err) =>
        console.error(
          "Failed to fetch system settings:",
          err
        )
      );
  }, []);

  useEffect(() => {
    if (user) {
      api<any>("/auth/profile")
        .then((data) => {
          updateUser({
            plan: data.plan,
            subscriptionEnd: data.subscriptionEnd,
          });

          if (data.settings) {
            const designerStore =
              useDesignerStore.getState();

            if (data.settings.organizationType) {
              designerStore.setOrganizationType(
                data.settings.organizationType
              );
            }

            if (data.settings.formConfig) {
              designerStore.setFormConfig(
                data.settings.formConfig
              );
            }
          }
        })
        .catch((err) =>
          console.error("Failed to sync profile:", err)
        );
    }
  }, []);

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="relative flex flex-col h-screen bg-[#fdfaf5] text-[#2c3e50] font-medium overflow-hidden">

      {/* TITLE BAR */}
      <div
        className="w-full h-8 shrink-0 flex items-center px-4 z-[9999]"
        style={
          {
            WebkitAppRegion: "drag",
            WebkitUserSelect: "none",
          } as any
        }
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded overflow-hidden shrink-0">
            <img
              src={faviconImg}
              alt="ID Daddy"
              className="w-full h-full object-cover"
            />
          </div>

          <span className="text-xs font-bold text-[#1a5d1a]">
            ID Daddy v{appVersion}
          </span>
        </div>
      </div>

      {/* BLOCKED / EXPIRED OVERLAY */}
      {(isBlocked || isPlanExpired) && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm bg-white rounded-[40px] p-10 text-center border-2 border-red-500/20">
            <div className="h-20 w-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <LogOut className="h-10 w-10 text-red-600" />
            </div>

            <h2 className="text-2xl font-black text-stone-900 mb-3">
              {isBlocked ? "Account Blocked" : "Plan Expired"}
            </h2>

            <p className="text-stone-900 font-medium text-lg leading-relaxed mb-8">
              {isBlocked
                ? "Your account has been blocked by the admin."
                : "Your subscription plan has ended. Please renew to continue."}
            </p>

            <button
              className="w-full h-14 bg-gray-900 text-white font-black text-lg rounded-[24px]"
              onClick={logout}
            >
              OK, Log out
            </button>
          </div>
        </div>
      )}

      {/* PLAN NOTIFICATION OVERLAY (For Active Trial) */}
      {showUpgradePrompt && !isBlocked && !isPlanExpired && (
        <div className="absolute inset-0 z-[9998] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-[40px] p-8 xl:p-10 text-center border-2 border-[#1a5d1a]/20 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 xl:h-20 xl:w-20 bg-amber-50 rounded-[24px] xl:rounded-[32px] flex items-center justify-center mx-auto mb-4 xl:mb-6">
              <Sparkles className="h-8 w-8 xl:h-10 xl:w-10 text-amber-500" />
            </div>

            <h2 className="text-2xl xl:text-3xl font-black text-stone-900 mb-2 xl:mb-3 tracking-tight">
              Upgrade Your Plan
            </h2>

            <p className="text-stone-600 font-medium text-sm xl:text-lg leading-relaxed mb-6 xl:mb-8 max-w-lg mx-auto">
              Unlock all premium features and create unlimited ID cards by upgrading your plan today.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 xl:mb-8 text-left">
              <div className="bg-stone-50 p-5 xl:p-6 rounded-3xl border-2 border-stone-100 hover:border-[#1a5d1a]/30 transition-colors">
                <h3 className="text-lg xl:text-xl font-black mb-1 xl:mb-2 text-[#1a5d1a]">PRO (1 Year)</h3>
                <p className="text-xl xl:text-2xl font-black mb-3 xl:mb-4">{pricing.CURRENCY} {pricing.PRO_1Y_PRICE}</p>
                <ul className="space-y-1.5 xl:space-y-2 text-xs xl:text-sm font-bold text-stone-600">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#1a5d1a]" /> Unlimited ID Generation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#1a5d1a]" /> All Premium Templates</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#1a5d1a]" /> Priority Support</li>
                </ul>
              </div>
              <div className="bg-amber-50 p-5 xl:p-6 rounded-3xl border-2 border-amber-200 relative overflow-hidden shadow-lg shadow-amber-500/10">
                <div className="absolute top-3 right-3 bg-amber-500 text-white text-[9px] xl:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">Best Value</div>
                <h3 className="text-lg xl:text-xl font-black mb-1 xl:mb-2 text-amber-700">LIFETIME</h3>
                <p className="text-xl xl:text-2xl font-black mb-3 xl:mb-4">{pricing.CURRENCY} {pricing.LIFETIME_PRICE}</p>
                <ul className="space-y-1.5 xl:space-y-2 text-xs xl:text-sm font-bold text-stone-600">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-600" /> One-time Payment</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-600" /> Lifetime Updates</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-600" /> 24/7 Premium Support</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 xl:gap-4">
              <button
                className="w-full sm:flex-1 h-12 xl:h-14 bg-stone-100 text-stone-900 hover:bg-stone-200 transition-colors font-black text-sm xl:text-lg rounded-[20px] xl:rounded-[24px]"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Maybe Later
              </button>
              <button
                className="w-full sm:flex-1 h-12 xl:h-14 bg-gradient-to-r from-[#1a5d1a] to-[#2d7a2d] text-white font-black text-sm xl:text-lg rounded-[20px] xl:rounded-[24px] shadow-lg shadow-green-900/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                onClick={() => {
                  setShowUpgradePrompt(false);
                }}
              >
                <Sparkles size={18} /> Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN APP */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">

        {/* SIDEBAR */}
        <aside
          className={clsx(
            "flex w-64 lg:w-80 shrink-0 flex-col border-r border-[#e8d5c4]/50 relative overflow-hidden",
            (isBlocked || isPlanExpired) &&
            "grayscale"
          )}
        >
          <div className="absolute inset-0 bg-[#f5ece2]/50 -z-10" />

          <div className="absolute inset-0 bg-gradient-to-br from-[#f5ece2] via-[#f5ece2] to-[#d4e7d4]/30 -z-10" />

          {/* BRAND */}
          <button
            className="px-4 py-4 xl:px-8 xl:py-8 text-left hover:bg-white/95 transition-all group relative"
            onClick={() =>
              !isBlocked && setPage("profile")
            }
            disabled={isBlocked}
          >
            <div className="flex items-center gap-3 xl:gap-4 mb-1 xl:mb-2">

              <div className="w-8 h-8 xl:w-12 xl:h-12 rounded-lg xl:rounded-2xl overflow-hidden shrink-0">
                <img
                  src={faviconImg}
                  alt="ID Daddy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <p className="font-black text-lg xl:text-2xl tracking-tight leading-none">
                  ID Daddy
                </p>

                <p className="text-xs xl:text-sm font-bold text-stone-900 mt-0.5 xl:mt-1 opacity-70">
                  Desktop Professional
                </p>
              </div>
            </div>

            <div className="mt-2 xl:mt-4">
              <div
                className={clsx(
                  "inline-flex items-center gap-1.5 xl:gap-2 text-[9px] xl:text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 xl:px-3 xl:py-1.5 rounded-lg xl:rounded-2xl border",
                  user.plan === "LIFETIME"
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : user.plan === "PRO_1Y"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-stone-100 text-stone-900 border-stone-200"
                )}
              >
                <Sparkles
                  size={11}
                  className="opacity-50"
                />

                {user.plan === "LIFETIME"
                  ? "Lifetime Membership"
                  : user.plan === "PRO_1Y"
                    ? "PRO Membership"
                    : "Trial Version"}
              </div>
            </div>
          </button>

          {/* NAVIGATION */}
          <nav className="flex-1 min-h-0 space-y-1 xl:space-y-2 px-3 xl:px-6 py-1 xl:py-2 overflow-y-auto custom-scrollbar">

            {pages
              .filter((item) => {
                if (
                  user.role === "SUPER_ADMIN"
                ) {
                  return ![
                    "dashboard",
                    "profile",
                  ].includes(item.id);
                }

                return true;
              })
              .map((item) => (
                <button
                  key={item.id}
                  className={clsx(
                    "flex h-11 xl:h-16 w-full items-center gap-3 xl:gap-4 px-3 xl:px-6 text-left transition-all duration-300 group rounded-lg",
                    page === item.id
                      ? "bg-gradient-to-r from-[#1a5d1a] to-[#2d7a2d] text-white scale-[1.02]"
                      : "text-stone-900 hover:bg-white/60 hover:text-[#1a5d1a]"
                  )}
                  onClick={() =>
                    !isBlocked &&
                    setPage(item.id)
                  }
                  disabled={isBlocked}
                >
                  <div
                    className={clsx(
                      "p-1.5 xl:p-2.5 rounded-md transition-colors",
                      page === item.id
                        ? "bg-white/90"
                        : "bg-stone-100 group-hover:bg-white"
                    )}
                  >
                    <item.icon
                      className={clsx(
                        "h-4 w-4 xl:h-6 xl:w-6",
                        page === item.id
                          ? "text-white"
                          : "text-stone-900 group-hover:text-[#1a5d1a]"
                      )}
                    />
                  </div>

                  <span
                    className={clsx(
                      "font-black text-sm xl:text-lg",
                      page === item.id
                        ? "text-white"
                        : "text-stone-900"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
          </nav>

          {/* USER CARD */}
          <div className="p-3 xl:p-6 shrink-0">
            <div className="bg-white/95 rounded-xl xl:rounded-[32px] p-3 xl:p-5 border border-white/60">

              <div className="flex items-center gap-2 xl:gap-3 mb-2 xl:mb-4 px-1 xl:px-2">

                <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-[#e8d5c4] flex items-center justify-center text-[#1a5d1a] font-black shrink-0 text-xs xl:text-base">
                  {user.workspaceName
                    ? user.workspaceName[0].toUpperCase()
                    : user.email[0].toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="text-xs xl:text-sm font-black truncate">
                    {user.workspaceName ||
                      user.email.split("@")[0]}
                  </p>

                  <p className="text-[9px] xl:text-[10px] font-bold text-stone-900 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                className="w-full h-8 xl:h-12 bg-white text-stone-900 font-black text-xs xl:text-sm rounded-lg xl:rounded-2xl border border-stone-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-1.5 xl:gap-2"
                onClick={logout}
              >
                <LogOut className="h-3 w-3 xl:h-4 xl:w-4" />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main
          className={clsx(
            "min-w-0 flex-1 overflow-hidden transition-all",
            (isBlocked || isPlanExpired) &&
            "grayscale"
          )}
        >
          {page === "upload" ? (
            <UploadView />
          ) : null}

          {page === "designer" ? (
            <DesignerView />
          ) : null}

          {page === "generate" ? (
            <GenerateView />
          ) : null}

          {page === "dashboard" ? (
            <DashboardView />
          ) : null}

          {page === "profile" ? (
            <ProfileView />
          ) : null}
        </main>
      </div>

      <GlobalModal />

      <UpdateNotification />
    </div>
  );
}