// =============================================================================
// Brasil Atleta — Supabase Database Types
//
// FR-0.3: Hand-written to match the Supabase generated-types shape
// (`Database["public"]["Tables"][...]`) so it can be passed to
// `createClient<Database>()`.
//
// Scope: covers the full schema through
// supabase/migrations/00007_lgpd_minors.sql — i.e. 00001_initial_
// schema.sql, 00002_role_based_rls.sql, 00003_secure_roles.sql (user_roles /
// app_role), 00004_achievements.sql, 00005 (athletes.slug/bio,
// competitions.created_by_athlete_id/status, entity_read_own_coaches fix —
// the latter has no TS-visible surface), 00006 (self-service write policies /
// slug trigger — no TS-visible surface), and 00007 (athletes.profile_
// visibility, guardian_consents, abuse_reports — LGPD/minors, FR-0.7-0.10).
//
// TODO: once a local Supabase instance (or CI) can run all migrations,
// regenerate this file with:
//   npx supabase gen types typescript --local > packages/web/src/lib/database.types.ts
// and re-apply this header comment.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      entities: {
        Row: {
          id: string;
          name: string;
          type: Database["public"]["Enums"]["entity_type"];
          parent_entity_id: string | null;
          state: string | null;
          city: string | null;
          modalities: string[];
          level: Database["public"]["Enums"]["entity_level"] | null;
          logo_url: string | null;
          location: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: Database["public"]["Enums"]["entity_type"];
          parent_entity_id?: string | null;
          state?: string | null;
          city?: string | null;
          modalities?: string[];
          level?: Database["public"]["Enums"]["entity_level"] | null;
          logo_url?: string | null;
          location?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: Database["public"]["Enums"]["entity_type"];
          parent_entity_id?: string | null;
          state?: string | null;
          city?: string | null;
          modalities?: string[];
          level?: Database["public"]["Enums"]["entity_level"] | null;
          logo_url?: string | null;
          location?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entities_parent_entity_id_fkey";
            columns: ["parent_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      athletes: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          birth_date: string | null;
          gender: Database["public"]["Enums"]["gender_type"] | null;
          state: string | null;
          city: string | null;
          photo_url: string | null;
          primary_modality: string | null;
          secondary_modalities: string[];
          competitive_level: Database["public"]["Enums"]["competitive_level"] | null;
          status: Database["public"]["Enums"]["athlete_status"];
          is_paralympic: boolean;
          paralympic_classification: Json | null;
          current_entity_id: string | null;
          birth_location: unknown | null;
          /** Added in 00005_schema_reconciliation.sql (Story 11.2) */
          slug: string | null;
          /** Added in 00005_schema_reconciliation.sql (Story 11.2) */
          bio: string | null;
          /** Added in 00007_lgpd_minors.sql (FR-0.8/D6). Forced by a BEFORE
           * INSERT/UPDATE trigger — see enforce_athlete_profile_visibility in
           * the Functions section below — not freely client-writable for
           * minors without a guardian_consents(consent_type=public_profile)
           * row. */
          profile_visibility: Database["public"]["Enums"]["athlete_profile_visibility"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          birth_date?: string | null;
          gender?: Database["public"]["Enums"]["gender_type"] | null;
          state?: string | null;
          city?: string | null;
          photo_url?: string | null;
          primary_modality?: string | null;
          secondary_modalities?: string[];
          competitive_level?: Database["public"]["Enums"]["competitive_level"] | null;
          status?: Database["public"]["Enums"]["athlete_status"];
          is_paralympic?: boolean;
          paralympic_classification?: Json | null;
          current_entity_id?: string | null;
          birth_location?: unknown | null;
          slug?: string | null;
          bio?: string | null;
          /** Ignored by the BEFORE INSERT trigger — always recomputed from
           * birth_date. Kept optional/typed here only for shape parity with
           * the generated-types convention. */
          profile_visibility?: Database["public"]["Enums"]["athlete_profile_visibility"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          birth_date?: string | null;
          gender?: Database["public"]["Enums"]["gender_type"] | null;
          state?: string | null;
          city?: string | null;
          photo_url?: string | null;
          primary_modality?: string | null;
          secondary_modalities?: string[];
          competitive_level?: Database["public"]["Enums"]["competitive_level"] | null;
          status?: Database["public"]["Enums"]["athlete_status"];
          is_paralympic?: boolean;
          paralympic_classification?: Json | null;
          current_entity_id?: string | null;
          birth_location?: unknown | null;
          slug?: string | null;
          bio?: string | null;
          profile_visibility?: Database["public"]["Enums"]["athlete_profile_visibility"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athletes_current_entity_id_fkey";
            columns: ["current_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      coaches: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          specialization: string | null;
          certifications: Json;
          academic_background: string | null;
          entity_id: string | null;
          modalities: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          specialization?: string | null;
          certifications?: Json;
          academic_background?: string | null;
          entity_id?: string | null;
          modalities?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          specialization?: string | null;
          certifications?: Json;
          academic_background?: string | null;
          entity_id?: string | null;
          modalities?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coaches_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      athlete_entities: {
        Row: {
          id: string;
          athlete_id: string;
          entity_id: string;
          coach_id: string | null;
          start_date: string;
          end_date: string | null;
          role: string | null;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          entity_id: string;
          coach_id?: string | null;
          start_date: string;
          end_date?: string | null;
          role?: string | null;
          is_current?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          entity_id?: string;
          coach_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          role?: string | null;
          is_current?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_entities_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athlete_entities_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athlete_entities_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
        ];
      };
      competitions: {
        Row: {
          id: string;
          name: string;
          date_start: string | null;
          date_end: string | null;
          location_state: string | null;
          location_city: string | null;
          grade: Database["public"]["Enums"]["competitive_level"] | null;
          modality_code: string | null;
          organizing_entity_id: string | null;
          /** Added in 00005_schema_reconciliation.sql (Story 11.1 self-service) */
          created_by_athlete_id: string | null;
          /** Added in 00005_schema_reconciliation.sql (Story 11.1 self-service) */
          status: Database["public"]["Enums"]["competition_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          date_start?: string | null;
          date_end?: string | null;
          location_state?: string | null;
          location_city?: string | null;
          grade?: Database["public"]["Enums"]["competitive_level"] | null;
          modality_code?: string | null;
          organizing_entity_id?: string | null;
          created_by_athlete_id?: string | null;
          status?: Database["public"]["Enums"]["competition_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          date_start?: string | null;
          date_end?: string | null;
          location_state?: string | null;
          location_city?: string | null;
          grade?: Database["public"]["Enums"]["competitive_level"] | null;
          modality_code?: string | null;
          organizing_entity_id?: string | null;
          created_by_athlete_id?: string | null;
          status?: Database["public"]["Enums"]["competition_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competitions_organizing_entity_id_fkey";
            columns: ["organizing_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competitions_created_by_athlete_id_fkey";
            columns: ["created_by_athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      results: {
        Row: {
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
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          competition_id: string;
          position?: number | null;
          mark?: string | null;
          mark_numeric?: number | null;
          mark_unit?: string | null;
          category?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          competition_id?: string;
          position?: number | null;
          mark?: string | null;
          mark_numeric?: number | null;
          mark_unit?: string | null;
          category?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "results_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "results_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          id: string;
          athlete_id: string;
          assessment_date: string;
          modality_code: string | null;
          protocol: string | null;
          metrics: Json;
          evaluator_id: string | null;
          entity_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          assessment_date: string;
          modality_code?: string | null;
          protocol?: string | null;
          metrics?: Json;
          evaluator_id?: string | null;
          entity_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          assessment_date?: string;
          modality_code?: string | null;
          protocol?: string | null;
          metrics?: Json;
          evaluator_id?: string | null;
          entity_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_evaluator_id_fkey";
            columns: ["evaluator_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      performance_kpis: {
        Row: {
          id: string;
          athlete_id: string;
          period: string;
          competitive_frequency: number | null;
          result_progression: number | null;
          performance_stability: number | null;
          relative_evolution: number | null;
          modality_specific: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          period: string;
          competitive_frequency?: number | null;
          result_progression?: number | null;
          performance_stability?: number | null;
          relative_evolution?: number | null;
          modality_specific?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          period?: string;
          competitive_frequency?: number | null;
          result_progression?: number | null;
          performance_stability?: number | null;
          relative_evolution?: number | null;
          modality_specific?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "performance_kpis_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      scouting_alerts: {
        Row: {
          id: string;
          athlete_id: string;
          alert_type: Database["public"]["Enums"]["alert_type"];
          severity: Database["public"]["Enums"]["alert_severity"];
          description: string | null;
          data: Json;
          is_read: boolean;
          target_entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          alert_type: Database["public"]["Enums"]["alert_type"];
          severity?: Database["public"]["Enums"]["alert_severity"];
          description?: string | null;
          data?: Json;
          is_read?: boolean;
          target_entity_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          alert_type?: Database["public"]["Enums"]["alert_type"];
          severity?: Database["public"]["Enums"]["alert_severity"];
          description?: string | null;
          data?: Json;
          is_read?: boolean;
          target_entity_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scouting_alerts_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scouting_alerts_target_entity_id_fkey";
            columns: ["target_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          id: string;
          athlete_id: string;
          type: Database["public"]["Enums"]["media_type"];
          url: string;
          title: string | null;
          competition_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          type: Database["public"]["Enums"]["media_type"];
          url: string;
          title?: string | null;
          competition_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          type?: Database["public"]["Enums"]["media_type"];
          url?: string;
          title?: string | null;
          competition_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
        ];
      };
      /** Added in 00004_achievements.sql (Story 11.4 / FR-0.2) */
      achievements: {
        Row: {
          id: string;
          athlete_id: string;
          title: string;
          competition_name: string | null;
          date: string;
          type: Database["public"]["Enums"]["achievement_type"];
          description: string | null;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          title: string;
          competition_name?: string | null;
          date: string;
          type: Database["public"]["Enums"]["achievement_type"];
          description?: string | null;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          title?: string;
          competition_name?: string | null;
          date?: string;
          type?: Database["public"]["Enums"]["achievement_type"];
          description?: string | null;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "achievements_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      /** Added in 00003_secure_roles.sql — server-controlled source of truth
       * for user roles. No INSERT/UPDATE/DELETE policy is granted to
       * `authenticated`; writes only happen via service_role or the
       * on_auth_user_created_set_role trigger (always 'atleta'). */
      user_roles: {
        Row: {
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      /** Added in 00007_lgpd_minors.sql (FR-0.7/D6). Immutable audit log —
       * no UPDATE/DELETE policy is granted to `authenticated` (or even
       * admin); rows can only be inserted, never modified. */
      guardian_consents: {
        Row: {
          id: string;
          athlete_id: string;
          guardian_full_name: string;
          guardian_email: string;
          guardian_relationship: Database["public"]["Enums"]["guardian_relationship_type"];
          consent_type: Database["public"]["Enums"]["guardian_consent_type"];
          consented_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          guardian_full_name: string;
          guardian_email: string;
          guardian_relationship: Database["public"]["Enums"]["guardian_relationship_type"];
          consent_type: Database["public"]["Enums"]["guardian_consent_type"];
          consented_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          guardian_full_name?: string;
          guardian_email?: string;
          guardian_relationship?: Database["public"]["Enums"]["guardian_relationship_type"];
          consent_type?: Database["public"]["Enums"]["guardian_consent_type"];
          consented_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guardian_consents_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      /** Added in 00007_lgpd_minors.sql (FR-0.9/D6). INSERT open to anon +
       * authenticated; SELECT restricted to admin; no UPDATE/DELETE policy
       * for anyone. */
      abuse_reports: {
        Row: {
          id: string;
          reported_athlete_slug: string | null;
          reporter_email: string | null;
          category: Database["public"]["Enums"]["abuse_report_category"];
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reported_athlete_slug?: string | null;
          reporter_email?: string | null;
          category: Database["public"]["Enums"]["abuse_report_category"];
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reported_athlete_slug?: string | null;
          reporter_email?: string | null;
          category?: Database["public"]["Enums"]["abuse_report_category"];
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_entity_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      /** Added in 00005_schema_reconciliation.sql — not called via .rpc()
       * anywhere in the app today; used internally by the
       * "entity_read_own_coaches" RLS policy. Listed here for schema parity. */
      get_coach_entity_id: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      /** Added in 00005_schema_reconciliation.sql — used only by the slug
       * backfill DO block in that migration; not called via .rpc(). */
      generate_athlete_slug: {
        Args: { p_full_name: string };
        Returns: string;
      };
      /** Added in 00007_lgpd_minors.sql — not called via .rpc() anywhere in
       * the app today; used internally by the profile_visibility triggers
       * and backfill. Listed here for schema parity. */
      athlete_is_minor: {
        Args: { p_birth_date: string | null };
        Returns: boolean;
      };
      /** Added in 00007_lgpd_minors.sql — used internally by the
       * public_read_achievements/results/assessments RLS policies. Listed
       * here for schema parity; not called via .rpc(). */
      is_athlete_profile_public: {
        Args: { p_athlete_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      entity_type:
        | "school"
        | "club"
        | "training_center"
        | "federation"
        | "confederation"
        | "committee";
      entity_level: "municipal" | "state" | "national";
      gender_type: "M" | "F" | "NB";
      competitive_level: "school" | "state" | "national" | "elite";
      athlete_status: "active" | "inactive" | "retired";
      alert_type: "progression_spike" | "talent_detected" | "dropout_risk";
      alert_severity: "low" | "medium" | "high";
      media_type: "video" | "photo" | "document";
      /** Added in 00004_achievements.sql */
      achievement_type: "gold" | "silver" | "bronze" | "participation" | "record";
      /** Added in 00003_secure_roles.sql. Mirrors UserRole in
       * packages/web/src/lib/auth/roles.ts */
      app_role:
        | "admin_nacional"
        | "confederacao"
        | "federacao"
        | "clube"
        | "tecnico"
        | "atleta";
      /** Added in 00005_schema_reconciliation.sql */
      competition_status: "scheduled" | "ongoing" | "completed" | "cancelled";
      /** Added in 00007_lgpd_minors.sql (FR-0.8/D6) */
      athlete_profile_visibility: "public" | "restricted";
      /** Added in 00007_lgpd_minors.sql (FR-0.7/D6) */
      guardian_relationship_type: "mae" | "pai" | "tutor" | "outro";
      /** Added in 00007_lgpd_minors.sql (FR-0.7/D6) */
      guardian_consent_type: "account" | "public_profile";
      /** Added in 00007_lgpd_minors.sql (FR-0.9/D6) */
      abuse_report_category:
        | "abordagem_inadequada"
        | "perfil_falso"
        | "conteudo_inadequado"
        | "outro";
    };
    CompositeTypes: Record<string, never>;
  };
}
