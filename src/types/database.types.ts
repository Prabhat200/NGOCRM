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
      bills: {
        Row: {
          amount: number
          archived_at: string | null
          bill_date: string
          bill_number: string | null
          category_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          due_date: string | null
          funding_source_id: string | null
          id: string
          occasion_id: string | null
          organization_id: string
          owner_group_id: string | null
          payee_name: string | null
          person_payee_id: string | null
          status: Database["public"]["Enums"]["bill_status"]
          title: string
          updated_at: string
          updated_by: string | null
          vendor_id: string | null
          vendor_invoice_number: string | null
        }
        Insert: {
          amount: number
          archived_at?: string | null
          bill_date?: string
          bill_number?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          funding_source_id?: string | null
          id?: string
          occasion_id?: string | null
          organization_id: string
          owner_group_id?: string | null
          payee_name?: string | null
          person_payee_id?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          vendor_id?: string | null
          vendor_invoice_number?: string | null
        }
        Update: {
          amount?: number
          archived_at?: string | null
          bill_date?: string
          bill_number?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          funding_source_id?: string | null
          id?: string
          occasion_id?: string | null
          organization_id?: string
          owner_group_id?: string | null
          payee_name?: string | null
          person_payee_id?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          vendor_id?: string | null
          vendor_invoice_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bills_category_org"
            columns: ["organization_id", "category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_bills_funding_source_org"
            columns: ["organization_id", "funding_source_id"]
            isOneToOne: false
            referencedRelation: "funding_sources"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_bills_occasion_org"
            columns: ["organization_id", "occasion_id"]
            isOneToOne: false
            referencedRelation: "occasions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_bills_owner_group_org"
            columns: ["organization_id", "owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_bills_person_payee_org"
            columns: ["organization_id", "person_payee_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_bills_vendor_org"
            columns: ["organization_id", "vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["organization_id", "id"]
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
      employment_compensation: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string
          effective_to: string | null
          employment_record_id: string
          id: string
          notes: string | null
          organization_id: string
          pay_frequency: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from: string
          effective_to?: string | null
          employment_record_id: string
          id?: string
          notes?: string | null
          organization_id: string
          pay_frequency?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          employment_record_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          pay_frequency?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_compensation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compensation_employment_org"
            columns: ["organization_id", "employment_record_id"]
            isOneToOne: false
            referencedRelation: "employment_records"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      employment_records: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          department_group_id: string | null
          designation: string
          employee_number: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          ended_at: string | null
          id: string
          organization_id: string
          person_id: string
          probation_ends_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["employment_status"]
          supervisor_person_id: string | null
          termination_reason: string | null
          updated_at: string
          updated_by: string | null
          work_location: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          department_group_id?: string | null
          designation: string
          employee_number?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          ended_at?: string | null
          id?: string
          organization_id: string
          person_id: string
          probation_ends_at?: string | null
          started_at: string
          status?: Database["public"]["Enums"]["employment_status"]
          supervisor_person_id?: string | null
          termination_reason?: string | null
          updated_at?: string
          updated_by?: string | null
          work_location?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          department_group_id?: string | null
          designation?: string
          employee_number?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          ended_at?: string | null
          id?: string
          organization_id?: string
          person_id?: string
          probation_ends_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["employment_status"]
          supervisor_person_id?: string | null
          termination_reason?: string | null
          updated_at?: string
          updated_by?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_records_department_group_id_fkey"
            columns: ["department_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employment_person_org"
            columns: ["organization_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_employment_supervisor_org"
            columns: ["organization_id", "supervisor_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          category_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expense_date: string
          expense_number: string | null
          funding_source_id: string | null
          id: string
          is_reimbursable: boolean
          notes: string | null
          occasion_id: string | null
          organization_id: string
          owner_group_id: string | null
          payee_name: string | null
          person_payee_id: string | null
          reimbursement_person_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["expense_status"]
          submitted_at: string | null
          submitted_by: string | null
          title: string
          updated_at: string
          updated_by: string | null
          vendor_id: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expense_date?: string
          expense_number?: string | null
          funding_source_id?: string | null
          id?: string
          is_reimbursable?: boolean
          notes?: string | null
          occasion_id?: string | null
          organization_id: string
          owner_group_id?: string | null
          payee_name?: string | null
          person_payee_id?: string | null
          reimbursement_person_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          vendor_id?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expense_date?: string
          expense_number?: string | null
          funding_source_id?: string | null
          id?: string
          is_reimbursable?: boolean
          notes?: string | null
          occasion_id?: string | null
          organization_id?: string
          owner_group_id?: string | null
          payee_name?: string | null
          person_payee_id?: string | null
          reimbursement_person_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          vendor_id?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expenses_category_org"
            columns: ["organization_id", "category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_expenses_funding_source_org"
            columns: ["organization_id", "funding_source_id"]
            isOneToOne: false
            referencedRelation: "funding_sources"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_expenses_occasion_org"
            columns: ["organization_id", "occasion_id"]
            isOneToOne: false
            referencedRelation: "occasions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_expenses_owner_group_org"
            columns: ["organization_id", "owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_expenses_person_payee_org"
            columns: ["organization_id", "person_payee_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_expenses_reimbursement_person_org"
            columns: ["organization_id", "reimbursement_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_expenses_vendor_org"
            columns: ["organization_id", "vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      finance_accounts: {
        Row: {
          account_reference: string | null
          account_type: Database["public"]["Enums"]["finance_account_type"]
          archived_at: string | null
          bank_name: string | null
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          account_reference?: string | null
          account_type?: Database["public"]["Enums"]["finance_account_type"]
          archived_at?: string | null
          bank_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          account_reference?: string | null
          account_type?: Database["public"]["Enums"]["finance_account_type"]
          archived_at?: string | null
          bank_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          category_type: Database["public"]["Enums"]["category_type"]
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          category_type?: Database["public"]["Enums"]["category_type"]
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          category_type?: Database["public"]["Enums"]["category_type"]
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_file_versions: {
        Row: {
          checksum: string | null
          created_at: string
          created_by: string | null
          file_size: number
          filename: string
          finance_file_id: string
          id: string
          mime_type: string
          notes: string | null
          organization_id: string
          storage_path: string
          version_number: number
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          file_size: number
          filename: string
          finance_file_id: string
          id?: string
          mime_type: string
          notes?: string | null
          organization_id: string
          storage_path: string
          version_number?: number
        }
        Update: {
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          file_size?: number
          filename?: string
          finance_file_id?: string
          id?: string
          mime_type?: string
          notes?: string | null
          organization_id?: string
          storage_path?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_file_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_finance_file_versions_file_org"
            columns: ["organization_id", "finance_file_id"]
            isOneToOne: false
            referencedRelation: "finance_files"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      finance_files: {
        Row: {
          archived_at: string | null
          bill_id: string | null
          created_at: string
          created_by: string | null
          current_version_id: string | null
          description: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["finance_file_entity_type"]
          expense_id: string | null
          file_type: Database["public"]["Enums"]["finance_file_type"]
          id: string
          organization_id: string
          payment_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          vendor_id: string | null
        }
        Insert: {
          archived_at?: string | null
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["finance_file_entity_type"]
          expense_id?: string | null
          file_type?: Database["public"]["Enums"]["finance_file_type"]
          id?: string
          organization_id: string
          payment_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          vendor_id?: string | null
        }
        Update: {
          archived_at?: string | null
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["finance_file_entity_type"]
          expense_id?: string | null
          file_type?: Database["public"]["Enums"]["finance_file_type"]
          id?: string
          organization_id?: string
          payment_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_finance_files_bill_org"
            columns: ["organization_id", "bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_finance_files_expense_org"
            columns: ["organization_id", "expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_finance_files_payment_org"
            columns: ["organization_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_finance_files_vendor_org"
            columns: ["organization_id", "vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_finance_files_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "finance_file_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_sequences: {
        Row: {
          last_val: number
          organization_id: string
          sequence_type: string
          year: number
        }
        Insert: {
          last_val?: number
          organization_id: string
          sequence_type: string
          year: number
        }
        Update: {
          last_val?: number
          organization_id?: string
          sequence_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_sources: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          reference_code: string | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          reference_code?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          reference_code?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
          person_id: string | null
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
          person_id?: string | null
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
          person_id?: string | null
          phone?: string | null
          position_title?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_members_person_org"
            columns: ["organization_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
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
          default_currency: string
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
          default_currency?: string
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
          default_currency?: string
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
      payment_allocations: {
        Row: {
          allocated_amount: number
          bill_id: string | null
          created_at: string
          expense_id: string | null
          id: string
          organization_id: string
          payment_id: string
        }
        Insert: {
          allocated_amount: number
          bill_id?: string | null
          created_at?: string
          expense_id?: string | null
          id?: string
          organization_id: string
          payment_id: string
        }
        Update: {
          allocated_amount?: number
          bill_id?: string | null
          created_at?: string
          expense_id?: string | null
          id?: string
          organization_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_allocations_bill_org"
            columns: ["organization_id", "bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_allocations_expense_org"
            columns: ["organization_id", "expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_allocations_payment_org"
            columns: ["organization_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          organization_id: string
          payee_name: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_number: string | null
          person_payee_id: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          updated_by: string | null
          vendor_id: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          organization_id: string
          payee_name?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_number?: string | null
          person_payee_id?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          updated_by?: string | null
          vendor_id?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          organization_id?: string
          payee_name?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_number?: string | null
          person_payee_id?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          updated_by?: string | null
          vendor_id?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_account_org"
            columns: ["organization_id", "account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_payments_person_payee_org"
            columns: ["organization_id", "person_payee_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_payments_vendor_org"
            columns: ["organization_id", "vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          address: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          middle_name: string | null
          organization_id: string
          photo_path: string | null
          preferred_name: string | null
          primary_email: string | null
          primary_phone: string | null
          secondary_email: string | null
          secondary_phone: string | null
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          organization_id: string
          photo_path?: string | null
          preferred_name?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          secondary_email?: string | null
          secondary_phone?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          organization_id?: string
          photo_path?: string | null
          preferred_name?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          secondary_email?: string | null
          secondary_phone?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      person_emergency_contacts: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          organization_id: string
          person_id: string
          phone: string
          relationship: string
          secondary_phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          organization_id: string
          person_id: string
          phone: string
          relationship: string
          secondary_phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          organization_id?: string
          person_id?: string
          phone?: string
          relationship?: string
          secondary_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_emergency_contacts_person_org"
            columns: ["organization_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "person_emergency_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      person_notes: {
        Row: {
          archived_at: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          person_id: string
          title: string | null
          type: string
          updated_at: string
          visibility_level: string
        }
        Insert: {
          archived_at?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          person_id: string
          title?: string | null
          type?: string
          updated_at?: string
          visibility_level?: string
        }
        Update: {
          archived_at?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          person_id?: string
          title?: string | null
          type?: string
          updated_at?: string
          visibility_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_person_notes_person_org"
            columns: ["organization_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "person_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      person_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          person_id: string
          relationship_type: string
          started_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          person_id: string
          relationship_type: string
          started_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          person_id?: string
          relationship_type?: string
          started_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_relationships_person_org"
            columns: ["organization_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "person_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      personnel_file_categories: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          is_system_category: boolean
          name: string
          organization_id: string
          sensitivity_level: Database["public"]["Enums"]["personnel_file_sensitivity"]
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system_category?: boolean
          name: string
          organization_id: string
          sensitivity_level?: Database["public"]["Enums"]["personnel_file_sensitivity"]
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system_category?: boolean
          name?: string
          organization_id?: string
          sensitivity_level?: Database["public"]["Enums"]["personnel_file_sensitivity"]
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personnel_file_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      personnel_file_versions: {
        Row: {
          change_note: string | null
          checksum: string | null
          file_extension: string | null
          file_size: number
          id: string
          invalidated_at: string | null
          invalidated_by: string | null
          invalidation_reason: string | null
          mime_type: string
          organization_id: string
          original_filename: string
          personnel_file_id: string
          storage_bucket: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          change_note?: string | null
          checksum?: string | null
          file_extension?: string | null
          file_size: number
          id?: string
          invalidated_at?: string | null
          invalidated_by?: string | null
          invalidation_reason?: string | null
          mime_type: string
          organization_id: string
          original_filename: string
          personnel_file_id: string
          storage_bucket?: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          change_note?: string | null
          checksum?: string | null
          file_extension?: string | null
          file_size?: number
          id?: string
          invalidated_at?: string | null
          invalidated_by?: string | null
          invalidation_reason?: string | null
          mime_type?: string
          organization_id?: string
          original_filename?: string
          personnel_file_id?: string
          storage_bucket?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_personnel_versions_file_org"
            columns: ["organization_id", "personnel_file_id"]
            isOneToOne: false
            referencedRelation: "personnel_files"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "personnel_file_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      personnel_files: {
        Row: {
          archived_at: string | null
          category_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          description: string | null
          document_date: string | null
          expires_at: string | null
          id: string
          organization_id: string
          person_id: string
          sensitivity_level: Database["public"]["Enums"]["personnel_file_sensitivity"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          document_date?: string | null
          expires_at?: string | null
          id?: string
          organization_id: string
          person_id: string
          sensitivity_level?: Database["public"]["Enums"]["personnel_file_sensitivity"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          document_date?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string
          person_id?: string
          sensitivity_level?: Database["public"]["Enums"]["personnel_file_sensitivity"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_personnel_files_category_org"
            columns: ["organization_id", "category_id"]
            isOneToOne: false
            referencedRelation: "personnel_file_categories"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "fk_personnel_files_person_org"
            columns: ["organization_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "personnel_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          last_active_at: string | null
          member_id: string | null
          must_change_password: boolean
          organization_id: string
          person_id: string | null
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
          must_change_password?: boolean
          organization_id: string
          person_id?: string | null
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
          must_change_password?: boolean
          organization_id?: string
          person_id?: string | null
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
            foreignKeyName: "fk_profiles_person_org"
            columns: ["organization_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
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
      vendors: {
        Row: {
          address: string | null
          archived_at: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          registration_number: string | null
          tax_identifier: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          registration_number?: string | null
          tax_identifier?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          registration_number?: string | null
          tax_identifier?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey"
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
      approve_expense: { Args: { p_expense_id: string }; Returns: Json }
      archive_document: { Args: { p_document_id: string }; Returns: boolean }
      archive_group: { Args: { p_group_id: string }; Returns: boolean }
      archive_member: { Args: { p_member_id: string }; Returns: boolean }
      archive_occasion: { Args: { p_occasion_id: string }; Returns: boolean }
      can_edit_document: { Args: { p_document_id: string }; Returns: boolean }
      can_manage_document: { Args: { p_document_id: string }; Returns: boolean }
      can_view_document: { Args: { p_document_id: string }; Returns: boolean }
      can_view_person_private: {
        Args: { p_person_id: string }
        Returns: boolean
      }
      can_view_personnel_file: { Args: { p_file_id: string }; Returns: boolean }
      complete_first_login_password_change: { Args: never; Returns: boolean }
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
      create_payment: {
        Args: {
          p_account_id: string
          p_allocations?: Json
          p_amount: number
          p_notes?: string
          p_payee_name?: string
          p_payment_date: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_person_payee_id?: string
          p_reference_number?: string
          p_vendor_id?: string
        }
        Returns: Json
      }
      current_member_id: { Args: never; Returns: string }
      current_organization_id: { Args: never; Returns: string }
      current_person_id: { Args: never; Returns: string }
      current_profile_id: { Args: never; Returns: string }
      delete_custom_role: { Args: { p_role_id: string }; Returns: boolean }
      generate_finance_number: {
        Args: { p_org_id: string; p_type: string }
        Returns: string
      }
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
      get_bill_balance: { Args: { p_bill_id: string }; Returns: Json }
      get_document_access_level: {
        Args: { p_document_id: string }
        Returns: number
      }
      get_document_access_list: {
        Args: { p_document_id: string }
        Returns: Json
      }
      get_expense_balance: { Args: { p_expense_id: string }; Returns: Json }
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
      log_finance_file_download: {
        Args: { p_finance_file_id: string; p_version_id: string }
        Returns: Json
      }
      log_personnel_file_download: {
        Args: { p_personnel_file_id: string; p_version_id?: string }
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
      mask_account_reference: { Args: { p_ref: string }; Returns: string }
      reject_expense: {
        Args: { p_expense_id: string; p_reason: string }
        Returns: Json
      }
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
      storage_can_read_finance_file: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      storage_can_read_people_media: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      storage_can_read_personnel_file: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      storage_can_upload_document_file: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      storage_can_upload_finance_file: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      storage_can_upload_people_media: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      storage_can_upload_personnel_file: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      submit_expense: { Args: { p_expense_id: string }; Returns: Json }
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
          default_currency: string
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
      void_expense: {
        Args: { p_expense_id: string; p_reason: string }
        Returns: Json
      }
      void_payment: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: Json
      }
    }
    Enums: {
      access_level: "view" | "edit" | "manage"
      bill_status:
        | "draft"
        | "received"
        | "approved"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "void"
      category_type: "expense" | "income" | "both"
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
      employment_status:
        | "active"
        | "probation"
        | "on_leave"
        | "suspended"
        | "ended"
      employment_type:
        | "permanent"
        | "full_time"
        | "part_time"
        | "contract"
        | "temporary"
        | "intern"
        | "consultant"
      expense_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "paid"
        | "void"
      finance_account_type:
        | "bank"
        | "cash"
        | "petty_cash"
        | "wallet"
        | "card"
        | "other"
      finance_file_entity_type: "expense" | "bill" | "payment" | "vendor"
      finance_file_type:
        | "bill"
        | "invoice"
        | "receipt"
        | "payment_voucher"
        | "cheque_copy"
        | "bank_slip"
        | "purchase_order"
        | "quotation"
        | "approval_document"
        | "supporting_evidence"
        | "other"
      group_type: "committee" | "department" | "team" | "custom"
      member_status: "active" | "inactive" | "suspended" | "former"
      occasion_status:
        | "planned"
        | "ongoing"
        | "completed"
        | "cancelled"
        | "archived"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "cheque"
        | "card"
        | "mobile_wallet"
        | "other"
      payment_status: "draft" | "completed" | "void"
      person_status: "active" | "inactive" | "former" | "deceased" | "archived"
      personnel_file_sensitivity: "normal" | "private" | "highly_restricted"
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
      bill_status: [
        "draft",
        "received",
        "approved",
        "partially_paid",
        "paid",
        "overdue",
        "void",
      ],
      category_type: ["expense", "income", "both"],
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
      employment_status: [
        "active",
        "probation",
        "on_leave",
        "suspended",
        "ended",
      ],
      employment_type: [
        "permanent",
        "full_time",
        "part_time",
        "contract",
        "temporary",
        "intern",
        "consultant",
      ],
      expense_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "paid",
        "void",
      ],
      finance_account_type: [
        "bank",
        "cash",
        "petty_cash",
        "wallet",
        "card",
        "other",
      ],
      finance_file_entity_type: ["expense", "bill", "payment", "vendor"],
      finance_file_type: [
        "bill",
        "invoice",
        "receipt",
        "payment_voucher",
        "cheque_copy",
        "bank_slip",
        "purchase_order",
        "quotation",
        "approval_document",
        "supporting_evidence",
        "other",
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
      payment_method: [
        "cash",
        "bank_transfer",
        "cheque",
        "card",
        "mobile_wallet",
        "other",
      ],
      payment_status: ["draft", "completed", "void"],
      person_status: ["active", "inactive", "former", "deceased", "archived"],
      personnel_file_sensitivity: ["normal", "private", "highly_restricted"],
      profile_status: ["invited", "active", "suspended", "disabled"],
    },
  },
} as const
