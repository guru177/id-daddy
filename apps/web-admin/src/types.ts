import { ExportStatus, Plan, Role, WorkspaceStatus } from "@id-daddy/shared";

export interface WorkspaceRow {
  id: string;
  name: string;
  plan: Plan;
  status: WorkspaceStatus;
  createdAt: string;
  _count?: {
    users: number;
    templates: number;
    records: number;
    exports: number;
  };
  users?: {
    email: string;
    phone: string | null;
  }[];
  subscription?: {
    plan: Plan;
    startDate: string;
    endDate: string | null;
  } | null;
}

