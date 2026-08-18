export type Role =
  | "admin"
  | "registrar"
  | "program_director"
  | "advisor"
  | "faculty"
  | "viewer";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  registrar: "Registrar",
  program_director: "Program Director",
  advisor: "Advisor",
  faculty: "Faculty",
  viewer: "Viewer",
};

export type StudentStatus = "active" | "leave_of_absence" | "withdrawn" | "graduated";

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Active",
  leave_of_absence: "Leave of Absence",
  withdrawn: "Withdrawn",
  graduated: "Graduated",
};

export type MilestoneStatus = "not_started" | "in_progress" | "at_risk" | "complete";

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  at_risk: "At Risk",
  complete: "Complete",
};

export type ConcernCategory = "academic" | "professionalism" | "wellbeing" | "clinical_performance";

export const CONCERN_CATEGORY_LABELS: Record<ConcernCategory, string> = {
  academic: "Academic",
  professionalism: "Professionalism",
  wellbeing: "Wellbeing",
  clinical_performance: "Clinical Performance",
};

export type ConcernSeverity = "low" | "medium" | "high";
export type ConcernStatus = "open" | "in_review" | "resolved";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  dob?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  program: string;
  cohort_year: number;
  status: StudentStatus;
  advisor_id?: number | null;
  cusis_synced_at?: string | null;
  manually_overridden: boolean;
}

export interface StudentSummary {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  cohort_year: number;
  status: StudentStatus;
  advisor_id?: number | null;
  open_concern_count: number;
  at_risk_milestone_count: number;
}

export interface Milestone {
  id: number;
  student_id: number;
  milestone_type: string;
  status: MilestoneStatus;
  target_date?: string | null;
  completed_date?: string | null;
  notes?: string | null;
  recorded_by_id?: number | null;
  updated_at: string;
}

export interface Concern {
  id: number;
  student_id: number;
  category: ConcernCategory;
  severity: ConcernSeverity;
  status: ConcernStatus;
  description: string;
  resolution_notes?: string | null;
  raised_by_id: number;
  assigned_to_id?: number | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface FacultyAppointment {
  id: number;
  user_id: number;
  role_title: string;
  program: string;
  site?: string | null;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
  is_active: boolean;
}

export interface CusisSyncLog {
  id: number;
  started_at: string;
  completed_at?: string | null;
  status: "success" | "partial" | "failed";
  records_processed: number;
  records_created: number;
  records_updated: number;
  triggered_by_id?: number | null;
  notes?: string | null;
}

export interface AuditLogEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  field: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by_id?: number | null;
  changed_at: string;
}
