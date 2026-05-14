import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "../api/client";
import { useAuthStore } from "../store/auth";

export function LoginPage({ message }: { message?: string }) {
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const [email, setEmail] = useState("admin@retaildaddy.in");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(message ?? "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await login(email, password);
      if (session.user.role !== "SUPER_ADMIN") {
        logout();
        setError("Super admin access is required for this console.");
        return;
      }
      setSession(session.accessToken, session.refreshToken, session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden bg-stone-100">
      {/* Faded Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.1]"
        style={{ backgroundImage: "url('/desktop.jpg')" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/40 to-stone-100/60 backdrop-blur-sm" />

      <div className="w-full max-w-sm relative z-10">
        {/* Card */}
        <div className="panel p-8 shadow-[0_32px_64px_rgba(0,0,0,0.05)] border-white/60 bg-white/95 backdrop-blur-xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mb-4 shadow-sm ring-1 ring-black/5">
              <img src="/favicon.png" alt="ID Daddy" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">ID Daddy Admin</h1>
            <p className="text-sm text-gray-400 mt-1">Sign in to manage the platform</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="admin@retaildaddy.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button className="btn-primary w-full h-10 mt-2" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ID Daddy · Super Admin Console
        </p>
      </div>
    </div>
  );
}
