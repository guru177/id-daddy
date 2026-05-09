import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "@id-daddy/shared";

export type DesktopPage = "dashboard" | "designer" | "upload" | "generate" | "profile";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  page: DesktopPage;
  isBlocked: boolean;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  setPage: (page: DesktopPage) => void;
  setIsBlocked: (isBlocked: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      page: "dashboard",
      isBlocked: false,
      setSession: (accessToken, refreshToken, user) => {
        const page = user.role === "SUPER_ADMIN" ? "designer" : "dashboard";
        set({ accessToken, refreshToken, user, page, isBlocked: false });
      },
      setPage: (page) => set({ page }),
      setIsBlocked: (isBlocked) => set({ isBlocked }),
      logout: () => {
        localStorage.removeItem("saved_id_members");
        localStorage.removeItem("saved_id_designs");
        set({ accessToken: null, refreshToken: null, user: null, page: "dashboard", isBlocked: false });
      }
    }),
    { name: "id-daddy-desktop-auth" }
  )
);
