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
      attachments: {
        Row: {
          created_at: string
          file_type: string
          id: string
          name: string
          path: string
          process_id: string
          size_bytes: number
        }
        Insert: {
          created_at?: string
          file_type?: string
          id?: string
          name: string
          path: string
          process_id: string
          size_bytes?: number
        }
        Update: {
          created_at?: string
          file_type?: string
          id?: string
          name?: string
          path?: string
          process_id?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "attachments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          required_role: Database["public"]["Enums"]["app_role"] | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          required_role?: Database["public"]["Enums"]["app_role"] | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          required_role?: Database["public"]["Enums"]["app_role"] | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      policies: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          name: string
          parent_policy_id: string | null
          scope: string
          slug: string
          sort_order: number
          source_url: string | null
          status: string
          updated_at: string
          working_version: string
        }
        Insert: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          parent_policy_id?: string | null
          scope?: string
          slug: string
          sort_order?: number
          source_url?: string | null
          status?: string
          updated_at?: string
          working_version?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          parent_policy_id?: string | null
          scope?: string
          slug?: string
          sort_order?: number
          source_url?: string | null
          status?: string
          updated_at?: string
          working_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_change_log: {
        Row: {
          change_type: string
          created_at: string
          description: string
          id: string
          policy_id: string
          user_email: string
          user_id: string | null
          version_label: string
        }
        Insert: {
          change_type?: string
          created_at?: string
          description?: string
          id?: string
          policy_id: string
          user_email?: string
          user_id?: string | null
          version_label?: string
        }
        Update: {
          change_type?: string
          created_at?: string
          description?: string
          id?: string
          policy_id?: string
          user_email?: string
          user_id?: string | null
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_change_log_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_documents: {
        Row: {
          created_at: string
          doc_date: string | null
          doc_type: string
          external_url: string | null
          id: string
          notes: string
          policy_id: string
          storage_path: string | null
          title: string
          version_label: string
        }
        Insert: {
          created_at?: string
          doc_date?: string | null
          doc_type?: string
          external_url?: string | null
          id?: string
          notes?: string
          policy_id: string
          storage_path?: string | null
          title: string
          version_label?: string
        }
        Update: {
          created_at?: string
          doc_date?: string | null
          doc_type?: string
          external_url?: string | null
          id?: string
          notes?: string
          policy_id?: string
          storage_path?: string | null
          title?: string
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_integrations: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          kind: string
          name: string
          notes: string
          status: string
        }
        Insert: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          kind?: string
          name: string
          notes?: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          kind?: string
          name?: string
          notes?: string
          status?: string
        }
        Relationships: []
      }
      policy_question_rules: {
        Row: {
          question_id: string
          rule_id: string
        }
        Insert: {
          question_id: string
          rule_id: string
        }
        Update: {
          question_id?: string
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_question_rules_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "policy_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_question_rules_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "policy_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_questions: {
        Row: {
          agreed_definition: string
          answer: string
          code: string
          created_at: string
          id: string
          policy_id: string
          question: string
          status: string
          updated_at: string
          validated_at: string | null
          validated_by: string
          validity_scope: string
        }
        Insert: {
          agreed_definition?: string
          answer?: string
          code?: string
          created_at?: string
          id?: string
          policy_id: string
          question: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string
          validity_scope?: string
        }
        Update: {
          agreed_definition?: string
          answer?: string
          code?: string
          created_at?: string
          id?: string
          policy_id?: string
          question?: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string
          validity_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_questions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_rules: {
        Row: {
          action_result: string
          allows_exception: boolean
          block: string
          code: string
          created_at: string
          data_source: string
          definition_status: Database["public"]["Enums"]["policy_rule_status"]
          id: string
          integration_id: string | null
          manual_intervention: boolean
          modifies_limit: boolean
          modifies_term: boolean
          operator: string
          original_text: string
          policy_id: string
          sort_order: number
          threshold: string
          updated_at: string
          variable: string
        }
        Insert: {
          action_result?: string
          allows_exception?: boolean
          block?: string
          code?: string
          created_at?: string
          data_source?: string
          definition_status?: Database["public"]["Enums"]["policy_rule_status"]
          id?: string
          integration_id?: string | null
          manual_intervention?: boolean
          modifies_limit?: boolean
          modifies_term?: boolean
          operator?: string
          original_text?: string
          policy_id: string
          sort_order?: number
          threshold?: string
          updated_at?: string
          variable?: string
        }
        Update: {
          action_result?: string
          allows_exception?: boolean
          block?: string
          code?: string
          created_at?: string
          data_source?: string
          definition_status?: Database["public"]["Enums"]["policy_rule_status"]
          id?: string
          integration_id?: string | null
          manual_intervention?: boolean
          modifies_limit?: boolean
          modifies_term?: boolean
          operator?: string
          original_text?: string
          policy_id?: string
          sort_order?: number
          threshold?: string
          updated_at?: string
          variable?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_rules_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "policy_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_rules_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_siisa_edges: {
        Row: {
          created_at: string
          from_node_id: string
          id: string
          label: string
          policy_id: string
          to_node_id: string
        }
        Insert: {
          created_at?: string
          from_node_id: string
          id?: string
          label?: string
          policy_id: string
          to_node_id: string
        }
        Update: {
          created_at?: string
          from_node_id?: string
          id?: string
          label?: string
          policy_id?: string
          to_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_siisa_edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "policy_siisa_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_siisa_edges_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_siisa_edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "policy_siisa_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_siisa_nodes: {
        Row: {
          called_policy_id: string | null
          created_at: string
          data_origin: string
          id: string
          impl_status: string
          inputs: string
          integration_id: string | null
          label: string
          node_type: string
          notes: string
          outputs: string
          policy_id: string
          rule_id: string | null
          sort_order: number
        }
        Insert: {
          called_policy_id?: string | null
          created_at?: string
          data_origin?: string
          id?: string
          impl_status?: string
          inputs?: string
          integration_id?: string | null
          label?: string
          node_type?: string
          notes?: string
          outputs?: string
          policy_id: string
          rule_id?: string | null
          sort_order?: number
        }
        Update: {
          called_policy_id?: string | null
          created_at?: string
          data_origin?: string
          id?: string
          impl_status?: string
          inputs?: string
          integration_id?: string | null
          label?: string
          node_type?: string
          notes?: string
          outputs?: string
          policy_id?: string
          rule_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "policy_siisa_nodes_called_policy_id_fkey"
            columns: ["called_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_siisa_nodes_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "policy_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_siisa_nodes_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_siisa_nodes_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "policy_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      process_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string
          id: string
          process_id: string
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string
          embedding: string
          id?: string
          process_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_chunks_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_tags: {
        Row: {
          process_id: string
          tag_id: string
        }
        Insert: {
          process_id: string
          tag_id: string
        }
        Update: {
          process_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_tags_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          author: string
          category_id: string | null
          created_at: string
          created_by: string | null
          document_markdown: string | null
          document_path: string | null
          document_text: string | null
          duration_label: string
          id: string
          indexed_at: string | null
          poster_path: string | null
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string
          video_path: string | null
          video_source_url: string | null
        }
        Insert: {
          author?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          document_markdown?: string | null
          document_path?: string | null
          document_text?: string | null
          duration_label?: string
          id?: string
          indexed_at?: string | null
          poster_path?: string | null
          slug: string
          status?: string
          summary?: string
          title: string
          updated_at?: string
          video_path?: string | null
          video_source_url?: string | null
        }
        Update: {
          author?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          document_markdown?: string | null
          document_path?: string | null
          document_text?: string | null
          duration_label?: string
          id?: string
          indexed_at?: string | null
          poster_path?: string | null
          slug?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          video_path?: string | null
          video_source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_seen_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          last_seen_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_seen_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_process_chunks: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          chunk_index: number
          content: string
          process_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer" | "usuario" | "it" | "riesgo"
      policy_rule_status:
        | "CONFIRMADA"
        | "PENDIENTE_VALIDACION"
        | "INCOMPLETA_EN_MANUAL"
        | "CONTRADICCION_A_RESOLVER"
        | "NO_AUTOMATIZABLE_HOY"
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
    Enums: {
      app_role: ["admin", "editor", "viewer", "usuario", "it", "riesgo"],
      policy_rule_status: [
        "CONFIRMADA",
        "PENDIENTE_VALIDACION",
        "INCOMPLETA_EN_MANUAL",
        "CONTRADICCION_A_RESOLVER",
        "NO_AUTOMATIZABLE_HOY",
      ],
    },
  },
} as const
