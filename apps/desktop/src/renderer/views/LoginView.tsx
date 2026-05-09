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
    <div className="flex h-screen w-full overflow-hidden bg-white relative">
      {/* Forgot Password Notification Overlay */}
      {showForgotHint && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/5 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 text-center animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3">Password Reset</h3>
            <p className="text-gray-500 font-bold leading-relaxed mb-8">
              Please contact your system administrator to reset your workspace credentials.
            </p>
            <button 
              className="w-full h-12 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
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
        </div>
      </div>

      {/* Right Login Section */}
      <div className="flex w-full flex-col items-center justify-center px-8 lg:w-1/2">
        <div className="w-full max-w-[420px]">
          {/* Mobile Branding */}
          <div className="mb-12 lg:hidden flex flex-col items-center">
            <div className="h-16 w-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl mb-4">
              <Fingerprint size={32} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">ID DADDY</h1>
          </div>

          <header className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
              {mode === "login" ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-gray-500 font-semibold italic">
              {mode === "login" 
                ? "Welcome back! Please enter your details." 
                : "Join ID Daddy and start designing today."}
            </p>
          </header>

          <form className="space-y-6" onSubmit={submit}>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Email Address</label>
              <input
                className="w-full h-14 rounded-2xl bg-gray-50 border-2 border-gray-100 px-5 text-gray-900 font-bold outline-none transition-all focus:border-indigo-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)]"
                placeholder="admin@company.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Phone Number</label>
                <input
                  className="w-full h-14 rounded-2xl bg-gray-50 border-2 border-gray-100 px-5 text-gray-900 font-bold outline-none transition-all focus:border-indigo-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)]"
                  placeholder="+91 00000 00000"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Password</label>
                {mode === "login" && (
                  <button 
                    type="button" 
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    onClick={() => setShowForgotHint(true)}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                className="w-full h-14 rounded-2xl bg-gray-50 border-2 border-gray-100 px-5 text-gray-900 font-bold outline-none transition-all focus:border-indigo-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)]"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600 animate-shake">
                {error}
              </div>
            ) : null}

            <button
              className="group relative w-full h-14 rounded-2xl bg-gray-900 text-white font-black text-lg transition-all hover:bg-black hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
              disabled={loading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading 
                  ? (mode === "login" ? "Verifying..." : "Creating Workspace...") 
                  : (mode === "login" ? "Sign In to Workspace" : "Get Started Now")}
                {!loading && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />}
              </span>
            </button>
          </form>

          <footer className="mt-12 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 w-full">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {mode === "login" ? "Enterprise Access" : "Direct Onboarding"}
              </span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <p className="text-sm font-bold text-gray-500">
              {mode === "login" ? "Need a new workspace?" : "Already have an account?"}{" "}
              <button 
                type="button"
                className="text-indigo-600 hover:underline"
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
  );
}


