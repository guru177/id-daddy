import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "@id-daddy/shared";
import { useDesignerStore } from "./designer/store";

export type DesktopPage = "dashboard" | "designer" | "upload" | "generate" | "profile";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  page: DesktopPage;
  isBlocked: boolean;
  systemSettings: any | null;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  setPage: (page: DesktopPage) => void;
  setIsBlocked: (isBlocked: boolean) => void;
  setSystemSettings: (settings: any) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
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
      systemSettings: null,
      setSession: (accessToken, refreshToken, user) => {
        const page = user.role === "SUPER_ADMIN" ? "designer" : "dashboard";
        set({ accessToken, refreshToken, user, page, isBlocked: false });
      },
      setPage: (page) => set({ page }),
      setIsBlocked: (isBlocked) => set({ isBlocked }),
      setSystemSettings: (systemSettings) => set({ systemSettings }),
      updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      logout: () => {
        localStorage.removeItem("saved_id_members");
        localStorage.removeItem("saved_id_designs");
        useDesignerStore.setState({ members: [], savedDesigns: [], folders: [] });
        set({ accessToken: null, refreshToken: null, user: null, page: "dashboard", isBlocked: false });
      }
    }),
    { name: "id-daddy-desktop-auth" }
  )
);
