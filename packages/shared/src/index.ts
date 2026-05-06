export const ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "STAFF", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const PLANS = ["FREE", "BASIC", "PRO"] as const;
export type Plan = (typeof PLANS)[number];

export const WORKSPACE_STATUSES = ["ACTIVE", "BLOCKED", "PAST_DUE", "CANCELED"] as const;
export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export const EXPORT_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
export type ExportStatus = (typeof EXPORT_STATUSES)[number];

export const PLAN_LIMITS: Record<Plan, number | null> = {
  FREE: 50,
  BASIC: 500,
  PRO: null
};

export type IdCardFieldType = "text" | "image" | "shape" | "qr";

export interface IdCardDesignObject {
  id: string;
  type: IdCardFieldType;
  name?: string;
  placeholder?: string;
  text?: string;
  src?: string;
  qrValue?: string;
  fill?: string;
  stroke?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  left: number;
  top: number;
  width: number;
  height: number;
  angle?: number;
  radius?: number;
  opacity?: number;
  metadata?: Record<string, unknown>;
}

export interface IdCardDesign {
  version: 1;
  width: number;
  height: number;
  unit: "px" | "mm";
  backgroundUrl?: string;
  objects: IdCardDesignObject[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterWorkspaceRequest {
  workspaceName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface AuthUser {
  id: string;
  workspaceId: string | null;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface UploadMapping {
  source: string;
  target: string;
}

export interface GenerateRequest {
  templateId: string;
  recordIds?: string[];
  grid?: {
    pageSize?: "A4" | "LETTER";
    columns: number;
    rows: number;
    marginMm: number;
    gapMm: number;
  };
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
}
