-- Migration: 20261007191502_storage_security.sql
-- Description: Private Supabase Storage bucket 'ngo-documents' and object RLS policies

-- ==============================================================================
-- 1. CONFIGURE PRIVATE BUCKET 'ngo-documents'
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ngo-documents',
  'ngo-documents',
  FALSE,
  52428800, -- 50 MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ==============================================================================
-- 2. STORAGE OBJECT RLS POLICIES
-- ==============================================================================
-- Path Convention: {organization_id}/{document_id}/{version_id}/{filename}

-- Helper function to validate storage read access safely without throwing on malformed paths
CREATE OR REPLACE FUNCTION storage_can_read_document_file(p_object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_path_parts TEXT[];
  v_org_id UUID;
  v_doc_id UUID;
BEGIN
  -- Split path into components: [org_id, doc_id, version_id, filename]
  v_path_parts := string_to_array(p_object_name, '/');
  IF array_length(v_path_parts, 1) < 4 THEN
    RETURN FALSE;
  END IF;

  -- Validate organization match
  BEGIN
    v_org_id := v_path_parts[1]::uuid;
    v_doc_id := v_path_parts[2]::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  IF v_org_id <> current_organization_id() THEN
    RETURN FALSE;
  END IF;

  -- Verify document download permission and view rights
  IF NOT has_permission('documents.download') THEN
    RETURN FALSE;
  END IF;

  RETURN can_view_document(v_doc_id);
END;
$$;

-- Helper function to validate storage upload access
CREATE OR REPLACE FUNCTION storage_can_upload_document_file(p_object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_path_parts TEXT[];
  v_org_id UUID;
  v_doc_id UUID;
BEGIN
  v_path_parts := string_to_array(p_object_name, '/');
  IF array_length(v_path_parts, 1) < 4 THEN
    RETURN FALSE;
  END IF;

  BEGIN
    v_org_id := v_path_parts[1]::uuid;
    v_doc_id := v_path_parts[2]::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  IF v_org_id <> current_organization_id() THEN
    RETURN FALSE;
  END IF;

  -- Must have documents.create or documents.upload_version permission
  IF NOT (has_permission('documents.create') OR has_permission('documents.upload_version')) THEN
    RETURN FALSE;
  END IF;

  -- If document exists, must have can_edit_document rights
  IF EXISTS (SELECT 1 FROM documents WHERE id = v_doc_id) THEN
    RETURN can_edit_document(v_doc_id);
  END IF;

  -- Staging new document upload by authorized creator in same org
  RETURN has_permission('documents.create');
END;
$$;

-- Storage Policy: READ
CREATE POLICY "storage_ngo_documents_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'ngo-documents'
    AND storage_can_read_document_file(name)
  );

-- Storage Policy: INSERT
CREATE POLICY "storage_ngo_documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ngo-documents'
    AND storage_can_upload_document_file(name)
  );

-- Storage Policy: UPDATE (Immutable historical versions - denied)
-- No UPDATE policy created, resulting in default-deny for all updates.

-- Storage Policy: DELETE (Archival does not delete files - denied)
-- No DELETE policy created, resulting in default-deny for all physical deletes.
