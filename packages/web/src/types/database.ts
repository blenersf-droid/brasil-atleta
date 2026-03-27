export type EntityType =
  | "school"
  | "club"
  | "training_center"
  | "federation"
  | "confederation"
  | "committee";

export type Gender = "M" | "F" | "NB";

export type CompetitiveLevel = "school" | "state" | "national" | "elite";

export type AthleteStatus = "active" | "inactive" | "retired";

export type AlertType = "progression_spike" | "talent_detected" | "dropout_risk";

export type AlertSeverity = "low" | "medium" | "high";

export type MediaType = "video" | "photo" | "document";

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  parent_entity_id: string | null;
  state: string;
  city: string;
  modalities: string[];
  level: "municipal" | "state" | "national";
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Athlete {
  id: string;
  user_id: string | null;
  full_name: string;
  birth_date: string;
  gender: Gender;
  state: string;
  city: string;
  photo_url: string | null;
  primary_modality: string;
  secondary_modalities: string[];
  competitive_level: CompetitiveLevel;
  status: AthleteStatus;
  is_paralympic: boolean;
  paralympic_classification: Record<string, unknown> | null;
  current_entity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coach {
  id: string;
  user_id: string | null;
  full_name: string;
  specialization: string | null;
  certifications: Record<string, unknown>[];
  academic_background: string | null;
  entity_id: string | null;
  modalities: string[];
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: string;
  name: string;
  date_start: string;
  date_end: string | null;
  location_state: string;
  location_city: string;
  grade: CompetitiveLevel;
  modality_code: string;
  organizing_entity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Result {
  id: string;
  athlete_id: string;
  competition_id: string;
  position: number | null;
  mark: string | null;
  mark_numeric: number | null;
  mark_unit: string | null;
  category: string | null;
  notes: string | null;
  created_at: string;
}

export interface Assessment {
  id: string;
  athlete_id: string;
  assessment_date: string;
  modality_code: string;
  protocol: string;
  metrics: Record<string, unknown>;
  evaluator_id: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface PerformanceKPI {
  id: string;
  athlete_id: string;
  period: string;
  competitive_frequency: number;
  result_progression: number | null;
  performance_stability: number | null;
  relative_evolution: number | null;
  modality_specific: Record<string, unknown> | null;
  created_at: string;
}

export interface ScoutingAlert {
  id: string;
  athlete_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  description: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  target_entity_id: string | null;
  created_at: string;
}
