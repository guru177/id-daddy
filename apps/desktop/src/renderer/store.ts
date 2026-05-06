import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "@id-daddy/shared";

export type DesktopPage = "dashboard" | "designer" | "upload" | "generate" | "print";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  page: DesktopPage;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  setPage: (page: DesktopPage) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      page: "dashboard",
      setSession: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      setPage: (page) => set({ page }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null, page: "dashboard" })
    }),
    { name: "id-daddy-desktop-auth" }
  )
);
