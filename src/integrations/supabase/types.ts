export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          metadata: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          message: string
          metadata?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string
          metadata?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      applicant_access_tokens: {
        Row: {
          application_id: string
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_access_tokens_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_projects: {
        Row: {
          application_id: string
          created_at: string
          document_path: string | null
          id: string
          project_url: string | null
          summary: string
          title: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_path?: string | null
          id?: string
          project_url?: string | null
          summary: string
          title: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_path?: string | null
          id?: string
          project_url?: string | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_projects_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_events: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          note: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          note: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          note?: string
          to_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_status_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          admin_notes: string | null
          agreement_accepted: boolean
          agreement_version: string
          availability: string | null
          college: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string
          graduation_year: number | null
          hod_contact: string | null
          hod_email: string | null
          hod_name: string | null
          id: string
          interview_questions: string | null
          interview_questions_generated_at: string | null
          job_posting_id: string | null
          linkedin_url: string | null
          message: string | null
          phone: string
          portfolio_url: string | null
          position: string | null
          resume_path: string | null
          role_applied: string
          state: string | null
          status: Database["public"]["Enums"]["application_status"]
          tp_officer_contact: string | null
          tp_officer_email: string | null
          tp_officer_name: string | null
          updated_at: string
          years_experience: string | null
        }
        Insert: {
          admin_notes?: string | null
          agreement_accepted?: boolean
          agreement_version?: string
          availability?: string | null
          college?: string | null
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          graduation_year?: number | null
          hod_contact?: string | null
          hod_email?: string | null
          hod_name?: string | null
          id?: string
          interview_questions?: string | null
          interview_questions_generated_at?: string | null
          job_posting_id?: string | null
          linkedin_url?: string | null
          message?: string | null
          phone: string
          portfolio_url?: string | null
          position?: string | null
          resume_path?: string | null
          role_applied: string
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          tp_officer_contact?: string | null
          tp_officer_email?: string | null
          tp_officer_name?: string | null
          updated_at?: string
          years_experience?: string | null
        }
        Update: {
          admin_notes?: string | null
          agreement_accepted?: boolean
          agreement_version?: string
          availability?: string | null
          college?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          graduation_year?: number | null
          hod_contact?: string | null
          hod_email?: string | null
          hod_name?: string | null
          id?: string
          interview_questions?: string | null
          interview_questions_generated_at?: string | null
          job_posting_id?: string | null
          linkedin_url?: string | null
          message?: string | null
          phone?: string
          portfolio_url?: string | null
          position?: string | null
          resume_path?: string | null
          role_applied?: string
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          tp_officer_contact?: string | null
          tp_officer_email?: string | null
          tp_officer_name?: string | null
          updated_at?: string
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          }
        ]
      }
      job_postings: {
        Row: {
          id: string
          title: string
          department: string
          location: string
          type: string
          description: string
          requirements: string | null
          salary_range: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          department: string
          location?: string
          type?: string
          description: string
          requirements?: string | null
          salary_range?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          department?: string
          location?: string
          type?: string
          description?: string
          requirements?: string | null
          salary_range?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      status_email_templates: {
        Row: {
          enabled: boolean
          html_body: string
          status: Database["public"]["Enums"]["application_status"]
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          html_body: string
          status: Database["public"]["Enums"]["application_status"]
          subject: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          html_body?: string
          status?: Database["public"]["Enums"]["application_status"]
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_counts: {
        Row: {
          page_key: string
          count: number
          updated_at: string
        }
        Insert: {
          page_key: string
          count?: number
          updated_at?: string
        }
        Update: {
          page_key?: string
          count?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      application_status:
        | "new"
        | "reviewing"
        | "shortlisted"
        | "rejected"
        | "hired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      application_status: [
        "new",
        "reviewing",
        "shortlisted",
        "rejected",
        "hired",
      ],
    },
  },
} as const
