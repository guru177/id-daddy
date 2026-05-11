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
    console.error("API Error details:", error);
    
    if (error.message === "WORKSPACE_BLOCKED") {
      useAuthStore.getState().setIsBlocked(true);
    }
    
    throw new Error(error.message || response.statusText || "Request failed");
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

export function register(workspaceName: string, adminEmail: string, adminPassword: string, adminPhone?: string) {
  return api<AuthResponse>("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ workspaceName, adminEmail, adminPassword, adminPhone })
  });
}

export function getProfile() {
  return api<any>("/auth/profile");
}

export function updateProfile(data: any) {
  return api<any>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function uploadImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  return api<{ fileUrl: string; downloadUrl: string }>("/files/upload", { method: "POST", body });
}

export function fetchRecords() {
  return api<{ data: { id: string; data: any }[]; total: number }>("/records");
}

export function createRecord(data: any) {
  return api<{ id: string; data: any }>("/records", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateRecord(id: string, data: any) {
  return api<{ id: string; data: any }>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteRecord(id: string) {
  return api<{ success: boolean }>(`/records/${id}`, {
    method: "DELETE"
  });
}

export function fetchTemplates() {
  return api<{ data: { id: string; name: string; design: any }[]; total: number }>("/templates");
}

export function createTemplate(data: { name: string; design: any }) {
  return api<{ id: string; name: string; design: any }>("/templates", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateTemplate(id: string, data: { name?: string; design?: any }) {
  return api<{ id: string; name: string; design: any }>(`/templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export function deleteTemplate(id: string) {
  return api<{ success: boolean }>(`/templates/${id}`, {
    method: "DELETE"
  });
}
