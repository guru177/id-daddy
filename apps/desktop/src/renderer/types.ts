import { ExportStatus, IdCardDesign, Plan, Role } from "@id-daddy/shared";

export interface TemplateRow {
  id: string;
  name: string;
  design: IdCardDesign;
  updatedAt: string;
}

export interface RecordRow {
  id: string;
  data: Record<string, unknown>;
  imageUrl: string | null;
  createdAt: string;
}

export interface ExportRow {
  id: string;
  status: ExportStatus;
  fileUrl: string | null;
  error?: string | null;
  createdAt: string;
}

export interface UserRow {
  id: string;
  email: string;
  role: Role;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  plan: Plan;
  status: string;
}
