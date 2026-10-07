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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json
          organization_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_favorites: {
        Row: {
          created_at: string
          document_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_favorites_doc_org"
            columns: ["organization_id", "document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_document_favorites_user_org"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      document_group_access: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          document_id: string
          granted_by: string | null
          group_id: string
          id: string
          organization_id: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at?: string
          document_id: string
          granted_by?: string | null
          group_id: string
          id?: string
          organization_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          document_id?: string
          granted_by?: string | null
          group_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_group_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_group_access_doc_org"
            columns: ["organization_id", "document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_document_group_access_group_org"
            columns: ["organization_id", "group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      document_role_access: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          document_id: string
          granted_by: string | null
          id: string
          organization_id: string
          role_id: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at?: string
          document_id: string
          granted_by?: string | null
          id?: string
          organization_id: string
          role_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          document_id?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_role_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_role_access_doc_org"
            columns: ["organization_id", "document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_document_role_access_role_org"
            columns: ["organization_id", "role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      document_tags: {
        Row: {
          created_at: string
          document_id: string
          organization_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          organization_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          organization_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_tags_document_org"
            columns: ["organization_id", "document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_document_tags_tag_org"
            columns: ["organization_id", "tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      document_user_access: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          document_id: string
          expires_at: string | null
          granted_by: string | null
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at?: string
          document_id: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          document_id?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_user_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_user_access_doc_org"
            columns: ["organization_id", "document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_document_user_access_user_org"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_note: string | null
          checksum: string | null
          document_id: string
          file_extension: string | null
          file_size: number | null
          id: string
          invalidated_at: string | null
          invalidated_by: string | null
          invalidation_reason: string | null
          mime_type: string | null
          organization_id: string
          original_filename: string
          storage_bucket: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          change_note?: string | null
          checksum?: string | null
          document_id: string
          file_extension?: string | null
          file_size?: number | null
          id?: string
          invalidated_at?: string | null
          invalidated_by?: string | null
          invalidation_reason?: string | null
          mime_type?: string | null
          organization_id: string
          original_filename: string
          storage_bucket?: string
          storage_path: string
          uploaded_at?: string
          uploaded_by: string
          version_number: number
        }
        Update: {
          change_note?: string | null
          checksum?: string | null
          document_id?: string
          file_extension?: string | null
          file_size?: number | null
          id?: string
          invalidated_at?: string | null
          invalidated_by?: string | null
          invalidation_reason?: string | null
          mime_type?: string | null
          organization_id?: string
          original_filename?: string
          storage_bucket?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_versions_document_org"
            columns: ["organization_id", "document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      documents: {
        Row: {
          access_mode: Database["public"]["Enums"]["document_access_mode"]
          archived_at: string | null
          category_id: string | null
          confidentiality: Database["public"]["Enums"]["document_confidentiality"]
          created_at: string
          created_by: string
          current_version_id: string | null
          description: string | null
          document_date: string | null
          document_number: string | null
          expires_at: string | null
          fiscal_year: string | null
          id: string
          occasion_id: string | null
          organization_id: string
          owner_group_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          superseded_by_document_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          access_mode?: Database["public"]["Enums"]["document_access_mode"]
          archived_at?: string | null
          category_id?: string | null
          confidentiality?: Database["public"]["Enums"]["document_confidentiality"]
          created_at?: string
          created_by: string
          current_version_id?: string | null
          description?: string | null
          document_date?: string | null
          document_number?: string | null
          expires_at?: string | null
          fiscal_year?: string | null
          id?: string
          occasion_id?: string | null
          organization_id: string
          owner_group_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          superseded_by_document_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          access_mode?: Database["public"]["Enums"]["document_access_mode"]
          archived_at?: string | null
          category_id?: string | null
          confidentiality?: Database["public"]["Enums"]["document_confidentiality"]
          created_at?: string
          created_by?: string
          current_version_id?: string | null
          description?: string | null
          document_date?: string | null
          document_number?: string | null
          expires_at?: string | null
          fiscal_year?: string | null
          id?: string
          occasion_id?: string | null
          organization_id?: string
          owner_group_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          superseded_by_document_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_category_org"
            columns: ["organization_id", "category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_documents_current_version"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["document_id", "id"]
          },
          {
            foreignKeyName: "fk_documents_occasion_org"
            columns: ["organization_id", "occasion_id"]
            isOneToOne: false
            referencedRelation: "occasions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_documents_owner_group_org"
            columns: ["organization_id", "owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_documents_superseded_by_org"
            columns: ["organization_id", "superseded_by_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_active: boolean
          joined_at: string | null
          left_at: string | null
          member_id: string
          organization_id: string
          role_in_group: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_active?: boolean
          joined_at?: string | null
          left_at?: string | null
          member_id: string
          organization_id: string
          role_in_group?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string | null
          left_at?: string | null
          member_id?: string
          organization_id?: string
          role_in_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_group_members_group_org"
            columns: ["organization_id", "group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_group_members_member_org"
            columns: ["organization_id", "member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "group_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          type: Database["public"]["Enums"]["group_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          type?: Database["public"]["Enums"]["group_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          type?: Database["public"]["Enums"]["group_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          joined_at: string | null
          last_name: string
          left_at: string | null
          membership_number: string | null
          middle_name: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          position_title: string | null
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          joined_at?: string | null
          last_name: string
          left_at?: string | null
          membership_number?: string | null
          middle_name?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          position_title?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          joined_at?: string | null
          last_name?: string
          left_at?: string | null
          membership_number?: string | null
          middle_name?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          position_title?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          organization_id: string
          read_at: string | null
          resource_id: string | null
          resource_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          organization_id: string
          read_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          organization_id?: string
          read_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_user_org"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      occasion_members: {
        Row: {
          created_at: string
          id: string
          member_id: string
          occasion_id: string
          organization_id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          occasion_id: string
          organization_id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          occasion_id?: string
          organization_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_occasion_members_member_org"
            columns: ["organization_id", "member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_occasion_members_occasion_org"
            columns: ["organization_id", "occasion_id"]
            isOneToOne: false
            referencedRelation: "occasions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "occasion_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      occasion_types: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "occasion_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      occasions: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          fiscal_year: string | null
          id: string
          location: string | null
          name: string
          occasion_type_id: string | null
          organization_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["occasion_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          fiscal_year?: string | null
          id?: string
          location?: string | null
          name: string
          occasion_type_id?: string | null
          organization_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["occasion_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          fiscal_year?: string | null
          id?: string
          location?: string | null
          name?: string
          occasion_type_id?: string | null
          organization_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["occasion_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_occasions_type_org"
            columns: ["organization_id", "occasion_type_id"]
            isOneToOne: false
            referencedRelation: "occasion_types"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "occasions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          registration_no: string | null
          short_name: string | null
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          registration_no?: string | null
          short_name?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          registration_no?: string | null
          short_name?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          last_active_at: string | null
          member_id: string | null
          organization_id: string
          phone: string | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          last_active_at?: string | null
          member_id?: string | null
          organization_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_active_at?: string | null
          member_id?: string | null
          organization_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_member_org"
            columns: ["organization_id", "member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          organization_id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_role_permissions_role_org"
            columns: ["organization_id", "role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "role_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system_role: boolean
          name: string
          organization_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean
          name: string
          organization_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_profile_org"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_user_roles_role_org"
            columns: ["organization_id", "role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      access_level_to_int: {
        Args: { p_level: Database["public"]["Enums"]["access_level"] }
        Returns: number
      }
      activate_my_invited_profile: { Args: never; Returns: boolean }
      add_group_member: {
        Args: {
          p_group_id: string
          p_joined_at?: string
          p_member_id: string
          p_role_in_group?: string
        }
        Returns: boolean
      }
      add_occasion_member: {
        Args: { p_member_id: string; p_occasion_id: string; p_role?: string }
        Returns: boolean
      }
      archive_document: { Args: { p_document_id: string }; Returns: boolean }
      archive_group: { Args: { p_group_id: string }; Returns: boolean }
      archive_member: { Args: { p_member_id: string }; Returns: boolean }
      archive_occasion: { Args: { p_occasion_id: string }; Returns: boolean }
      can_edit_document: { Args: { p_document_id: string }; Returns: boolean }
      can_manage_document: { Args: { p_document_id: string }; Returns: boolean }
      can_view_document: { Args: { p_document_id: string }; Returns: boolean }
      create_custom_role: {
        Args: {
          p_description?: string
          p_name: string
          p_permission_ids?: string[]
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          is_system_role: boolean
          name: string
          organization_id: string
          slug: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "roles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_document: {
        Args: {
          p_access_mode?: Database["public"]["Enums"]["document_access_mode"]
          p_category_id?: string
          p_confidentiality?: Database["public"]["Enums"]["document_confidentiality"]
          p_description?: string
          p_document_date?: string
          p_document_number?: string
          p_expires_at?: string
          p_fiscal_year?: string
          p_occasion_id?: string
          p_owner_group_id?: string
          p_status?: Database["public"]["Enums"]["document_status"]
          p_title: string
        }
        Returns: string
      }
      create_document_category: {
        Args: { p_description?: string; p_icon?: string; p_name: string }
        Returns: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "document_categories"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_document_version: {
        Args: {
          p_change_note?: string
          p_checksum?: string
          p_document_id: string
          p_file_extension?: string
          p_file_size: number
          p_mime_type?: string
          p_original_filename: string
          p_storage_path: string
        }
        Returns: Json
      }
      create_occasion: {
        Args: {
          p_description?: string
          p_end_date?: string
          p_fiscal_year?: string
          p_location?: string
          p_members?: Json
          p_name: string
          p_occasion_type_id?: string
          p_start_date?: string
          p_status?: Database["public"]["Enums"]["occasion_status"]
        }
        Returns: string
      }
      create_occasion_type: {
        Args: { p_description?: string; p_icon?: string; p_name: string }
        Returns: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "occasion_types"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_member_id: { Args: never; Returns: string }
      current_organization_id: { Args: never; Returns: string }
      current_profile_id: { Args: never; Returns: string }
      delete_custom_role: { Args: { p_role_id: string }; Returns: boolean }
      get_activity_logs: {
        Args: {
          p_action_category?: string
          p_end_date?: string
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_start_date?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          actor_avatar: string
          actor_email: string
          actor_name: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          organization_id: string
          total_count: number
          user_id: string
        }[]
      }
      get_document_access_level: {
        Args: { p_document_id: string }
        Returns: number
      }
      get_document_access_list: {
        Args: { p_document_id: string }
        Returns: Json
      }
      get_members_directory: {
        Args: { p_page?: number; p_page_size?: number; p_search?: string }
        Returns: {
          first_name: string
          id: string
          last_name: string
          membership_number: string
          middle_name: string
          organization_id: string
          position_title: string
          status: Database["public"]["Enums"]["member_status"]
          total_count: number
        }[]
      }
      get_my_auth_context: { Args: never; Returns: Json }
      get_my_permissions: { Args: never; Returns: string[] }
      has_permission: { Args: { p_permission_code: string }; Returns: boolean }
      has_role: { Args: { p_role_slug: string }; Returns: boolean }
      is_active_user: { Args: never; Returns: boolean }
      is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_activity: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_document_download: {
        Args: { p_document_id: string; p_version_id?: string }
        Returns: boolean
      }
      manage_document_access: {
        Args: {
          p_access_mode?: Database["public"]["Enums"]["document_access_mode"]
          p_document_id: string
          p_group_grants?: Json
          p_role_grants?: Json
          p_user_grants?: Json
        }
        Returns: boolean
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      remove_group_member: {
        Args: { p_group_id: string; p_member_id: string }
        Returns: boolean
      }
      remove_occasion_member: {
        Args: { p_member_id: string; p_occasion_id: string }
        Returns: boolean
      }
      restore_document: { Args: { p_document_id: string }; Returns: boolean }
      restore_group: { Args: { p_group_id: string }; Returns: boolean }
      restore_member: { Args: { p_member_id: string }; Returns: boolean }
      restore_occasion: { Args: { p_occasion_id: string }; Returns: boolean }
      set_user_roles: {
        Args: { p_role_ids: string[]; p_target_user_id: string }
        Returns: boolean
      }
      set_user_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["profile_status"]
          p_target_user_id: string
        }
        Returns: boolean
      }
      storage_can_read_document_file: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      storage_can_upload_document_file: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      update_document_category: {
        Args: {
          p_description?: string
          p_icon?: string
          p_id: string
          p_is_active?: boolean
          p_name: string
        }
        Returns: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "document_categories"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_my_profile: {
        Args: {
          p_avatar_url?: string
          p_display_name?: string
          p_phone?: string
        }
        Returns: Json
      }
      update_occasion: {
        Args: {
          p_description?: string
          p_end_date?: string
          p_fiscal_year?: string
          p_location?: string
          p_name: string
          p_occasion_id: string
          p_occasion_type_id?: string
          p_start_date?: string
          p_status?: Database["public"]["Enums"]["occasion_status"]
        }
        Returns: boolean
      }
      update_occasion_type: {
        Args: {
          p_description?: string
          p_icon?: string
          p_id: string
          p_is_active?: boolean
          p_name: string
        }
        Returns: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "occasion_types"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_organization_settings: {
        Args: {
          p_address?: string
          p_email?: string
          p_logo_url?: string
          p_name: string
          p_phone?: string
          p_registration_no?: string
          p_short_name?: string
          p_timezone?: string
          p_website?: string
        }
        Returns: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          registration_no: string | null
          short_name: string | null
          timezone: string
          updated_at: string
          website: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_role_permissions: {
        Args: { p_permission_ids: string[]; p_role_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_level: "view" | "edit" | "manage"
      document_access_mode: "organization" | "restricted" | "private"
      document_confidentiality:
        | "general"
        | "internal"
        | "confidential"
        | "restricted"
      document_status:
        | "draft"
        | "under_review"
        | "changes_requested"
        | "approved"
        | "final"
        | "superseded"
        | "archived"
      group_type: "committee" | "department" | "team" | "custom"
      member_status: "active" | "inactive" | "suspended" | "former"
      occasion_status:
        | "planned"
        | "ongoing"
        | "completed"
        | "cancelled"
        | "archived"
      profile_status: "invited" | "active" | "suspended" | "disabled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_level: ["view", "edit", "manage"],
      document_access_mode: ["organization", "restricted", "private"],
      document_confidentiality: [
        "general",
        "internal",
        "confidential",
        "restricted",
      ],
      document_status: [
        "draft",
        "under_review",
        "changes_requested",
        "approved",
        "final",
        "superseded",
        "archived",
      ],
      group_type: ["committee", "department", "team", "custom"],
      member_status: ["active", "inactive", "suspended", "former"],
      occasion_status: [
        "planned",
        "ongoing",
        "completed",
        "cancelled",
        "archived",
      ],
      profile_status: ["invited", "active", "suspended", "disabled"],
    },
  },
} as const
