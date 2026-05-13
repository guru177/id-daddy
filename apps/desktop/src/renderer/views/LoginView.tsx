import { FormEvent, useState } from "react";
import { ArrowRight, Fingerprint, Sparkles } from "lucide-react";
import loginBg from "../desktop.jpg";
import { login, register } from "../api";
import { useAuthStore } from "../store";

export function LoginView() {
  const setSession = useAuthStore((state) => state.setSession);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      let session;
      if (mode === "login") {
        session = await login(email, password);
      } else {
        // Derive workspace name from email (e.g. admin@google.com -> Google)
        const domain = email.split("@")[1]?.split(".")[0] || "My Workspace";
        const workspaceName = domain.charAt(0).toUpperCase() + domain.slice(1);
        session = await register(workspaceName, email, password, phone);
      }

      if (session.user.role === "VIEWER") {
        setError("Viewer users cannot access the desktop generator.");
        return;
      }
      setSession(session.accessToken, session.refreshToken, session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#fdfaf5] relative font-medium">
      {/* Title Bar Drag Area */}
      <div
        className="w-full h-8 shrink-0 flex items-center px-4 z-[9999]"
        style={{ WebkitAppRegion: "drag", WebkitUserSelect: "none" } as any}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#1a5d1a] to-[#2d7a2d] flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-[8px]">ID</span>
          </div>
          <span className="text-xs font-bold text-[#1a5d1a]">ID Daddy Desktop</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Forgot Password Notification Overlay */}
        {showForgotHint && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/5 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white rounded-[40px] p-10  border border-stone-100 text-center animate-in zoom-in-95 duration-300">
              <div className="h-20 w-20 bg-green-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 ">
                <Sparkles className="h-10 w-10 text-[#1a5d1a]" />
              </div>
              <h3 className="text-2xl font-black text-stone-900 mb-3 tracking-tight">Password Reset</h3>
              <p className="text-stone-900 font-bold leading-relaxed mb-8">
                Please contact your system administrator to reset your workspace credentials.
              </p>
              <button
                className="w-full h-14 bg-gradient-to-br from-[#1a5d1a] to-[#2d7a2d] text-white font-black rounded-[24px]   transition-all active:scale-95"
                onClick={() => setShowForgotHint(false)}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Left Hero Section */}
        <div className="relative hidden w-1/2 flex-col justify-end overflow-hidden lg:flex">
          {/* Full Hero Image */}
          <div className="absolute inset-0">
            <img
              src={loginBg}
              className="h-full w-full object-cover"
              alt="Hero"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a5d1a]/80 via-transparent to-transparent" />
          </div>
        </div>

        {/* Right Login Section */}
        <div className="flex w-full flex-col items-center justify-center px-8 lg:w-1/2">
          <div className="w-full max-w-[440px]">
            {/* Mobile Branding */}
            <div className="mb-12 lg:hidden flex flex-col items-center">
              <div className="h-20 w-20 rounded-[32px] bg-[#1a5d1a] flex items-center justify-center text-white  mb-4">
                <Fingerprint size={40} />
              </div>
              <h1 className="text-3xl font-black text-[#1a5d1a] tracking-tighter uppercase">ID DADDY</h1>
            </div>

            <header className="mb-12 text-center lg:text-left">
              <h2 className="text-5xl font-black text-stone-900 tracking-tighter mb-3 leading-none">
                {mode === "login" ? "Sign In" : "Create Account"}
              </h2>
              <p className="text-stone-900 text-lg font-bold">
                {mode === "login"
                  ? "Manage your workspace and designs."
                  : "Join ID Daddy and start designing today."}
              </p>
            </header>

            <form className="space-y-8" onSubmit={submit}>
              <div className="space-y-3">
                <label className="text-sm font-black text-stone-900 uppercase tracking-[0.2em] ml-2">Email Address</label>
                <input
                  className="w-full h-16 rounded-[28px] bg-white border-2 border-stone-100 px-6 text-stone-900 font-black text-lg outline-none transition-all focus:border-[#1a5d1a]  placeholder:text-stone-200"
                  placeholder="admin@company.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              {mode === "register" && (
                <div className="space-y-3">
                  <label className="text-sm font-black text-stone-900 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                  <input
                    className="w-full h-16 rounded-[28px] bg-white border-2 border-stone-100 px-6 text-stone-900 font-black text-lg outline-none transition-all focus:border-[#1a5d1a]  placeholder:text-stone-200"
                    placeholder="+91 00000 00000"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <label className="text-sm font-black text-stone-900 uppercase tracking-[0.2em]">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="text-xs font-black text-[#1a5d1a] hover:underline"
                      onClick={() => setShowForgotHint(true)}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  className="w-full h-16 rounded-[28px] bg-white border-2 border-stone-100 px-6 text-stone-900 font-black text-lg outline-none transition-all focus:border-[#1a5d1a]  placeholder:text-stone-200"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error ? (
                <div className="p-5 rounded-[24px] bg-red-50 border border-red-100 text-sm font-black text-red-600 animate-shake flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-600" />
                  {error}
                </div>
              ) : null}

              <button
                className="group relative w-full h-16 rounded-[28px] bg-gradient-to-br from-[#1a5d1a] to-[#2d7a2d] text-white font-black text-xl transition-all 0_20px_40px_-10px_rgba(26,93,26,0.3)] hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading
                    ? (mode === "login" ? "Verifying..." : "Creating Workspace...")
                    : (mode === "login" ? "Sign In" : "Get Started Now")}
                  {!loading && <ArrowRight size={24} className="transition-transform group-hover:translate-x-2" />}
                </span>
              </button>
            </form>

            <footer className="mt-16 flex flex-col items-center gap-8">
              <div className="flex items-center gap-6 w-full">
                <div className="h-px flex-1 bg-stone-100" />
                <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">
                  {mode === "login" ? "Enterprise Portal" : "Join the Platform"}
                </span>
                <div className="h-px flex-1 bg-stone-100" />
              </div>

              <p className="text-base font-bold text-stone-900">
                {mode === "login" ? "Need a new workspace?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="text-[#1a5d1a] font-black hover:underline ml-1"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError("");
                  }}
                >
                  {mode === "login" ? "Create Account" : "Sign In"}
                </button>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}


