import { AuthResponse } from "@id-daddy/shared";
import { useAuthStore } from "./store";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

interface Options extends RequestInit {
  auth?: boolean;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.auth === false || !token ? {} : { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password })
  });
}

export async function uploadImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  return api<{ fileUrl: string; downloadUrl: string }>("/files/upload", { method: "POST", body });
}
