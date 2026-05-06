import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { login } from "../api/client";
import { useAuthStore } from "../store/auth";

export function LoginPage({ message }: { message?: string }) {
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const [email, setEmail] = useState("owner@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(message ?? "");
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <form className="panel w-full max-w-sm p-6" onSubmit={onSubmit}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-mint">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">ID Daddy Admin</h1>
            <p className="text-sm text-stone-500">Sign in to manage the platform</p>
          </div>
        </div>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
