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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_daily_usage: {
        Row: {
          request_count: number
          total_tokens: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          request_count?: number
          total_tokens?: number
          updated_at?: string
          usage_date: string
          user_id: string
        }
        Update: {
          request_count?: number
          total_tokens?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      cycle_settings: {
        Row: {
          cycle_length: number
          last_period_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cycle_length?: number
          last_period_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cycle_length?: number
          last_period_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      derived_insights: {
        Row: {
          content: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insight_sources: {
        Row: {
          insight_id: string
          record_id: string
          record_updated_at: string
          user_id: string
        }
        Insert: {
          insight_id: string
          record_id: string
          record_updated_at: string
          user_id: string
        }
        Update: {
          insight_id?: string
          record_id?: string
          record_updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_sources_insight_fk"
            columns: ["insight_id", "user_id"]
            isOneToOne: false
            referencedRelation: "derived_insights"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "insight_sources_record_fk"
            columns: ["record_id", "user_id"]
            isOneToOne: false
            referencedRelation: "personal_records"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      intelligence_preferences: {
        Row: {
          allow_background_insights: boolean
          allow_external_ai: boolean
          updated_at: string
          use_my_rhythms_context: boolean
          use_my_world_context: boolean
          user_id: string
        }
        Insert: {
          allow_background_insights?: boolean
          allow_external_ai?: boolean
          updated_at?: string
          use_my_rhythms_context?: boolean
          use_my_world_context?: boolean
          user_id: string
        }
        Update: {
          allow_background_insights?: boolean
          allow_external_ai?: boolean
          updated_at?: string
          use_my_rhythms_context?: boolean
          use_my_world_context?: boolean
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          content: string
          created_at: string
          domain: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          domain?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          domain?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      record_followups: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          record_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          record_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          record_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_followups_record_fk"
            columns: ["record_id", "user_id"]
            isOneToOne: false
            referencedRelation: "personal_records"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      record_revisions: {
        Row: {
          content: string
          domain: string
          id: string
          record_id: string
          replaced_at: string
          user_id: string
          version_created_at: string
        }
        Insert: {
          content: string
          domain: string
          id?: string
          record_id: string
          replaced_at?: string
          user_id: string
          version_created_at: string
        }
        Update: {
          content?: string
          domain?: string
          id?: string
          record_id?: string
          replaced_at?: string
          user_id?: string
          version_created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_revisions_record_fk"
            columns: ["record_id", "user_id"]
            isOneToOne: false
            referencedRelation: "personal_records"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      sleep_awakenings: {
        Row: {
          created_at: string
          ended_at: string
          id: string
          night_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at: string
          id?: string
          night_id: string
          started_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string
          id?: string
          night_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_awakenings_night_fk"
            columns: ["night_id", "user_id"]
            isOneToOne: false
            referencedRelation: "sleep_nights"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      sleep_nights: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reported_awakening_count: number | null
          restfulness_rating: number | null
          sleep_date: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reported_awakening_count?: number | null
          restfulness_rating?: number | null
          sleep_date: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reported_awakening_count?: number | null
          restfulness_rating?: number | null
          sleep_date?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_sessions: {
        Row: {
          created_at: string
          ended_at: string
          id: string
          night_id: string
          session_label: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at: string
          id?: string
          night_id: string
          session_label?: string | null
          started_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string
          id?: string
          night_id?: string
          session_label?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_sessions_night_fk"
            columns: ["night_id", "user_id"]
            isOneToOne: false
            referencedRelation: "sleep_nights"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      user_calendar_preferences: {
        Row: {
          igbo_spelling: string
          primary_calendar: string
          secondary_calendar: string | null
          show_igbo_market_days: boolean
          show_moon_phases: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          igbo_spelling?: string
          primary_calendar?: string
          secondary_calendar?: string | null
          show_igbo_market_days?: boolean
          show_moon_phases?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          igbo_spelling?: string
          primary_calendar?: string
          secondary_calendar?: string | null
          show_igbo_market_days?: boolean
          show_moon_phases?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_ai_tokens: {
        Args: { _tokens: number; _user_id: string }
        Returns: undefined
      }
      release_ai_request: { Args: { _user_id: string }; Returns: undefined }
      reserve_ai_request: {
        Args: { _limit: number; _user_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
