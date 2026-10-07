-- Migration: 20261007203500_document_rpcs.sql
-- Description: Transactional document RPCs for versioning, archive/restore, audit download, and access management

-- 1. Concurrency-Safe Document Version Creation (Rule 47 & 48)
CREATE OR REPLACE FUNCTION create_document_version(
  p_document_id UUID,
  p_original_filename TEXT,
  p_storage_path TEXT,
  p_file_size BIGINT,
  p_mime_type TEXT DEFAULT NULL,
  p_file_extension TEXT DEFAULT NULL,
  p_checksum TEXT DEFAULT NULL,
  p_change_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_next_version INT;
  v_version_id UUID;
BEGIN
  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  -- Verify user has permission: documents.upload_version or documents.create
  IF NOT (has_permission('documents.upload_version') OR has_permission('documents.create')) THEN
    RAISE EXCEPTION 'Permission denied: documents.upload_version or documents.create required';
  END IF;

  -- Verify user can edit the document
  IF NOT can_edit_document(p_document_id) THEN
    RAISE EXCEPTION 'Permission denied: Cannot edit document';
  END IF;

  -- Concurrency control: Lock the document row during version calculation
  PERFORM 1 FROM documents WHERE id = p_document_id AND organization_id = v_org_id FOR UPDATE;

  -- Calculate next sequential version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM document_versions
  WHERE document_id = p_document_id;

  -- Insert document version
  INSERT INTO document_versions (
    organization_id,
    document_id,
    version_number,
    storage_bucket,
    storage_path,
    original_filename,
    file_extension,
    mime_type,
    file_size,
    checksum,
    change_note,
    uploaded_by
  )
  VALUES (
    v_org_id,
    p_document_id,
    v_next_version,
    'ngo-documents',
    p_storage_path,
    p_original_filename,
    p_file_extension,
    p_mime_type,
    p_file_size,
    p_checksum,
    p_change_note,
    auth.uid()
  )
  RETURNING id INTO v_version_id;

  -- Atomically point documents.current_version_id to newly uploaded version
  UPDATE documents
  SET current_version_id = v_version_id,
      updated_at = NOW(),
      updated_by = auth.uid()
  WHERE id = p_document_id AND organization_id = v_org_id;

  -- Record audit event
  PERFORM log_activity(
    'document.version_uploaded',
    'document',
    p_document_id,
    jsonb_build_object(
      'version_id', v_version_id,
      'version_number', v_next_version,
      'filename', p_original_filename,
      'change_note', p_change_note,
      'is_initial', (v_next_version = 1)
    )
  );

  RETURN jsonb_build_object(
    'version_id', v_version_id,
    'version_number', v_next_version,
    'storage_path', p_storage_path
  );
END;
$$;


-- 2. Secure Document Archival (Rule 50 & 52)
CREATE OR REPLACE FUNCTION archive_document(p_document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_doc_title TEXT;
BEGIN
  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  IF NOT has_permission('documents.archive') THEN
    RAISE EXCEPTION 'Permission denied: documents.archive required';
  END IF;

  IF NOT can_manage_document(p_document_id) THEN
    RAISE EXCEPTION 'Permission denied: Cannot manage document';
  END IF;

  SELECT title INTO v_doc_title
  FROM documents
  WHERE id = p_document_id AND organization_id = v_org_id;

  IF v_doc_title IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  UPDATE documents
  SET archived_at = NOW(),
      status = 'archived',
      updated_at = NOW(),
      updated_by = auth.uid()
  WHERE id = p_document_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'document.archived',
    'document',
    p_document_id,
    jsonb_build_object('title', v_doc_title)
  );

  RETURN TRUE;
END;
$$;


-- 3. Secure Document Restoration (Rule 51 & 52)
CREATE OR REPLACE FUNCTION restore_document(p_document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_doc_title TEXT;
BEGIN
  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  IF NOT has_permission('documents.restore') THEN
    RAISE EXCEPTION 'Permission denied: documents.restore required';
  END IF;

  IF NOT can_manage_document(p_document_id) THEN
    RAISE EXCEPTION 'Permission denied: Cannot manage document';
  END IF;

  SELECT title INTO v_doc_title
  FROM documents
  WHERE id = p_document_id AND organization_id = v_org_id;

  IF v_doc_title IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  UPDATE documents
  SET archived_at = NULL,
      status = 'final',
      updated_at = NOW(),
      updated_by = auth.uid()
  WHERE id = p_document_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'document.restored',
    'document',
    p_document_id,
    jsonb_build_object('title', v_doc_title)
  );

  RETURN TRUE;
END;
$$;


-- 4. Audit Logger for Document Downloads (Rule 39)
CREATE OR REPLACE FUNCTION log_document_download(
  p_document_id UUID,
  p_version_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_doc_title TEXT;
  v_version_num INT;
BEGIN
  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT has_permission('documents.download') OR NOT can_view_document(p_document_id) THEN
    RETURN FALSE;
  END IF;

  SELECT title INTO v_doc_title
  FROM documents
  WHERE id = p_document_id AND organization_id = v_org_id;

  IF p_version_id IS NOT NULL THEN
    SELECT version_number INTO v_version_num
    FROM document_versions
    WHERE id = p_version_id AND document_id = p_document_id;
  END IF;

  PERFORM log_activity(
    'document.downloaded',
    'document',
    p_document_id,
    jsonb_build_object(
      'title', v_doc_title,
      'version_id', p_version_id,
      'version_number', v_version_num
    )
  );

  RETURN TRUE;
END;
$$;


-- 5. Manage Document Access RPC (Rule 42 & 43)
CREATE OR REPLACE FUNCTION manage_document_access(
  p_document_id UUID,
  p_access_mode document_access_mode DEFAULT NULL,
  p_user_grants JSONB DEFAULT '[]'::jsonb,
  p_group_grants JSONB DEFAULT '[]'::jsonb,
  p_role_grants JSONB DEFAULT '[]'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  grant_rec JSONB;
BEGIN
  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  IF NOT has_permission('documents.manage_access') OR NOT can_manage_document(p_document_id) THEN
    RAISE EXCEPTION 'Permission denied: documents.manage_access and manager rights required';
  END IF;

  -- Update access_mode if specified
  IF p_access_mode IS NOT NULL THEN
    UPDATE documents
    SET access_mode = p_access_mode,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = p_document_id AND organization_id = v_org_id;
  END IF;

  -- Apply user grants
  IF jsonb_array_length(p_user_grants) > 0 THEN
    FOR grant_rec IN SELECT * FROM jsonb_array_elements(p_user_grants)
    LOOP
      IF (grant_rec->>'action') = 'revoke' THEN
        DELETE FROM document_user_access
        WHERE document_id = p_document_id AND user_id = (grant_rec->>'user_id')::uuid;
      ELSE
        INSERT INTO document_user_access (
          organization_id, document_id, user_id, access_level, granted_by
        )
        VALUES (
          v_org_id,
          p_document_id,
          (grant_rec->>'user_id')::uuid,
          (grant_rec->>'access_level')::access_level,
          auth.uid()
        )
        ON CONFLICT (document_id, user_id)
        DO UPDATE SET access_level = EXCLUDED.access_level, granted_by = auth.uid();
      END IF;
    END LOOP;
  END IF;

  -- Apply group grants
  IF jsonb_array_length(p_group_grants) > 0 THEN
    FOR grant_rec IN SELECT * FROM jsonb_array_elements(p_group_grants)
    LOOP
      IF (grant_rec->>'action') = 'revoke' THEN
        DELETE FROM document_group_access
        WHERE document_id = p_document_id AND group_id = (grant_rec->>'group_id')::uuid;
      ELSE
        INSERT INTO document_group_access (
          organization_id, document_id, group_id, access_level, granted_by
        )
        VALUES (
          v_org_id,
          p_document_id,
          (grant_rec->>'group_id')::uuid,
          (grant_rec->>'access_level')::access_level,
          auth.uid()
        )
        ON CONFLICT (document_id, group_id)
        DO UPDATE SET access_level = EXCLUDED.access_level, granted_by = auth.uid();
      END IF;
    END LOOP;
  END IF;

  -- Apply role grants
  IF jsonb_array_length(p_role_grants) > 0 THEN
    FOR grant_rec IN SELECT * FROM jsonb_array_elements(p_role_grants)
    LOOP
      IF (grant_rec->>'action') = 'revoke' THEN
        DELETE FROM document_role_access
        WHERE document_id = p_document_id AND role_id = (grant_rec->>'role_id')::uuid;
      ELSE
        INSERT INTO document_role_access (
          organization_id, document_id, role_id, access_level, granted_by
        )
        VALUES (
          v_org_id,
          p_document_id,
          (grant_rec->>'role_id')::uuid,
          (grant_rec->>'access_level')::access_level,
          auth.uid()
        )
        ON CONFLICT (document_id, role_id)
        DO UPDATE SET access_level = EXCLUDED.access_level, granted_by = auth.uid();
      END IF;
    END LOOP;
  END IF;

  -- Record audit log
  PERFORM log_activity(
    'document.access_modified',
    'document',
    p_document_id,
    jsonb_build_object(
      'access_mode', p_access_mode,
      'user_grants_count', jsonb_array_length(p_user_grants),
      'group_grants_count', jsonb_array_length(p_group_grants),
      'role_grants_count', jsonb_array_length(p_role_grants)
    )
  );

  RETURN TRUE;
END;
$$;


-- 6. Get Document Access List RPC
CREATE OR REPLACE FUNCTION get_document_access_list(p_document_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_users JSONB;
  v_groups JSONB;
  v_roles JSONB;
BEGIN
  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  IF NOT can_view_document(p_document_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Fetch user access grants
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', dua.id,
      'user_id', dua.user_id,
      'access_level', dua.access_level,
      'display_name', COALESCE(m.full_name, p.display_name, 'Portal User'),
      'position_title', m.position_title
    )
  ), '[]'::jsonb)
  INTO v_users
  FROM document_user_access dua
  JOIN profiles p ON p.id = dua.user_id
  LEFT JOIN members m ON m.id = p.member_id
  WHERE dua.document_id = p_document_id;

  -- Fetch group access grants
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', dga.id,
      'group_id', dga.group_id,
      'access_level', dga.access_level,
      'group_name', g.name,
      'group_type', g.type
    )
  ), '[]'::jsonb)
  INTO v_groups
  FROM document_group_access dga
  JOIN groups g ON g.id = dga.group_id
  WHERE dga.document_id = p_document_id;

  -- Fetch role access grants
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', dra.id,
      'role_id', dra.role_id,
      'access_level', dra.access_level,
      'role_name', r.name,
      'role_slug', r.slug
    )
  ), '[]'::jsonb)
  INTO v_roles
  FROM document_role_access dra
  JOIN roles r ON r.id = dra.role_id
  WHERE dra.document_id = p_document_id;

  RETURN jsonb_build_object(
    'users', v_users,
    'groups', v_groups,
    'roles', v_roles
  );
END;
$$;
