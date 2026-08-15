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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      animation_videos: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          external_url: string | null
          id: string
          source: string
          status: string
          storage_path: string | null
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          source?: string
          status?: string
          storage_path?: string | null
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          source?: string
          status?: string
          storage_path?: string | null
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      college_feedback: {
        Row: {
          author_name: string
          college_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          author_name: string
          college_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          author_name?: string
          college_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_feedback_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          approved: boolean
          avg_package: number | null
          branches: Json
          college_type: string | null
          created_at: string
          district: string
          highest_package: number | null
          id: string
          name: string
          nirf_rank: number | null
          placement_pct: number | null
          state: string
          submitted_by: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          approved?: boolean
          avg_package?: number | null
          branches?: Json
          college_type?: string | null
          created_at?: string
          district: string
          highest_package?: number | null
          id?: string
          name: string
          nirf_rank?: number | null
          placement_pct?: number | null
          state: string
          submitted_by?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          approved?: boolean
          avg_package?: number | null
          branches?: Json
          college_type?: string | null
          created_at?: string
          district?: string
          highest_package?: number | null
          id?: string
          name?: string
          nirf_rank?: number | null
          placement_pct?: number | null
          state?: string
          submitted_by?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          location: string | null
          mode: string | null
          organizer: string | null
          starts_at: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          location?: string | null
          mode?: string | null
          organizer?: string | null
          starts_at: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          location?: string | null
          mode?: string | null
          organizer?: string | null
          starts_at?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      material_sections: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      material_subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          section_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          section_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_subjects_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "material_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          class_level: string | null
          course: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          occupation: string | null
          school: string | null
          username: string
        }
        Insert: {
          class_level?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          occupation?: string | null
          school?: string | null
          username: string
        }
        Update: {
          class_level?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          occupation?: string | null
          school?: string | null
          username?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          class_level: string | null
          created_at: string
          id: string
          score: number
          topic: string
          total: number
          user_id: string
        }
        Insert: {
          class_level?: string | null
          created_at?: string
          id?: string
          score: number
          topic: string
          total: number
          user_id: string
        }
        Update: {
          class_level?: string | null
          created_at?: string
          id?: string
          score?: number
          topic?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          title: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      stay_reviews: {
        Row: {
          address: string | null
          approved: boolean
          author_name: string
          city: string
          comment: string | null
          created_at: string
          district: string
          id: string
          name: string
          rating: number
          rent_monthly: number | null
          state: string
          stay_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          approved?: boolean
          author_name?: string
          city: string
          comment?: string | null
          created_at?: string
          district: string
          id?: string
          name: string
          rating?: number
          rent_monthly?: number | null
          state: string
          stay_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          approved?: boolean
          author_name?: string
          city?: string
          comment?: string | null
          created_at?: string
          district?: string
          id?: string
          name?: string
          rating?: number
          rent_monthly?: number | null
          state?: string
          stay_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          category: string
          class_level: string | null
          created_at: string
          created_by: string | null
          description: string | null
          external_url: string | null
          file_path: string | null
          id: string
          section_id: string | null
          subject: string | null
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          class_level?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          file_path?: string | null
          id?: string
          section_id?: string | null
          subject?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          class_level?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          file_path?: string | null
          id?: string
          section_id?: string | null
          subject?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "material_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "material_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          minutes: number
          studied_on: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutes: number
          studied_on?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minutes?: number
          studied_on?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      study_tasks: {
        Row: {
          completed: boolean
          created_at: string
          due_date: string | null
          duration_min: number
          id: string
          subject: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          duration_min?: number
          id?: string
          subject?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          duration_min?: number
          id?: string
          subject?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
