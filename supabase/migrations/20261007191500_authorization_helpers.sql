-- Migration: 20261007191500_authorization_helpers.sql
-- Description: Core PostgreSQL authorization helper functions, access calculation, and activity logging

-- ==============================================================================
-- 1. CONTEXT & IDENTITY HELPERS
-- ==============================================================================

-- Returns current authenticated auth.uid()
CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- Checks if current user has an active profile in an organization
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND status = 'active'
  );
$$;

-- Derives organization_id from current active user profile (Never trusts client input)
CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles
  WHERE id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- Returns member_id linked to the current user profile (if any)
CREATE OR REPLACE FUNCTION current_member_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT member_id FROM profiles
  WHERE id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;


-- ==============================================================================
-- 2. ROLE & PERMISSION HELPERS
-- ==============================================================================

-- Checks if user has a specific role by slug within their organization
CREATE OR REPLACE FUNCTION has_role(p_role_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() AND status = 'active')
      AND r.slug = p_role_slug
  );
$$;

-- Checks if current user is Super Admin in their organization
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role('super_admin');
$$;

-- Checks if user has a specific permission code in their current organization
CREATE OR REPLACE FUNCTION has_permission(p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Super admin has all permissions within their organization
  SELECT is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND ur.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() AND status = 'active')
      AND p.code = p_permission_code
  );
$$;

-- Checks if user is an active member of a specific group in the same organization
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN group_members gm ON gm.member_id = p.member_id
    JOIN groups g ON g.id = gm.group_id
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND gm.group_id = p_group_id
      AND gm.is_active = TRUE
      AND g.archived_at IS NULL
      AND gm.organization_id = p.organization_id
  );
$$;


-- ==============================================================================
-- 3. DOCUMENT RESOURCE ACCESS CALCULATION
-- ==============================================================================

-- Converts access_level enum to integer ranking (none=0, view=1, edit=2, manage=3)
CREATE OR REPLACE FUNCTION access_level_to_int(p_level access_level)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_level
    WHEN 'view' THEN 1
    WHEN 'edit' THEN 2
    WHEN 'manage' THEN 3
    ELSE 0
  END;
$$;

-- Calculates effective document access level across user, group, and role grants
CREATE OR REPLACE FUNCTION get_document_access_level(p_document_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_org_id UUID;
  v_member_id UUID;
  v_max_level INTEGER := 0;
  v_direct_level INTEGER := 0;
  v_group_level INTEGER := 0;
  v_role_level INTEGER := 0;
BEGIN
  -- Verify active profile & organization
  SELECT organization_id, member_id
  INTO v_user_org_id, v_member_id
  FROM profiles
  WHERE id = auth.uid() AND status = 'active';

  IF v_user_org_id IS NULL THEN
    RETURN 0;
  END IF;

  -- 1. Direct user grant (ignores expired grants)
  SELECT COALESCE(MAX(access_level_to_int(access_level)), 0)
  INTO v_direct_level
  FROM document_user_access
  WHERE document_id = p_document_id
    AND user_id = auth.uid()
    AND organization_id = v_user_org_id
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_direct_level = 3 THEN
    RETURN 3;
  END IF;

  -- 2. Group grants (via active member association)
  IF v_member_id IS NOT NULL THEN
    SELECT COALESCE(MAX(access_level_to_int(dga.access_level)), 0)
    INTO v_group_level
    FROM document_group_access dga
    JOIN group_members gm ON gm.group_id = dga.group_id
    WHERE dga.document_id = p_document_id
      AND gm.member_id = v_member_id
      AND gm.is_active = TRUE
      AND dga.organization_id = v_user_org_id;

    IF v_group_level = 3 THEN
      RETURN 3;
    END IF;
  END IF;

  -- 3. Role grants (via assigned portal roles)
  SELECT COALESCE(MAX(access_level_to_int(dra.access_level)), 0)
  INTO v_role_level
  FROM document_role_access dra
  JOIN user_roles ur ON ur.role_id = dra.role_id
  WHERE dra.document_id = p_document_id
    AND ur.user_id = auth.uid()
    AND dra.organization_id = v_user_org_id;

  v_max_level := GREATEST(v_direct_level, v_group_level, v_role_level);
  RETURN v_max_level;
END;
$$;


-- ==============================================================================
-- 4. DOCUMENT CAPABILITY EVALUATORS (VIEW, EDIT, MANAGE)
-- ==============================================================================

-- Determines if current user can VIEW a document
CREATE OR REPLACE FUNCTION can_view_document(p_document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_org_id UUID;
  v_doc_org_id UUID;
  v_doc_mode document_access_mode;
  v_doc_creator UUID;
  v_res_level INTEGER;
BEGIN
  -- 1. Check active user
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE id = auth.uid() AND status = 'active';

  IF v_user_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2. Fetch document organization, mode, and creator
  SELECT organization_id, access_mode, created_by
  INTO v_doc_org_id, v_doc_mode, v_doc_creator
  FROM documents
  WHERE id = p_document_id;

  IF v_doc_org_id IS NULL OR v_doc_org_id <> v_user_org_id THEN
    RETURN FALSE;
  END IF;

  -- 3. Check base system permission
  IF NOT has_permission('documents.view') THEN
    RETURN FALSE;
  END IF;

  -- 4. Super Admin in same organization can view all documents
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;

  -- 5. Evaluate access modes
  CASE v_doc_mode
    WHEN 'organization' THEN
      RETURN TRUE;

    WHEN 'restricted' THEN
      -- Creator always has access; otherwise check resource level
      IF v_doc_creator = auth.uid() THEN
        RETURN TRUE;
      END IF;
      v_res_level := get_document_access_level(p_document_id);
      RETURN v_res_level >= 1; -- 1 = view, 2 = edit, 3 = manage

    WHEN 'private' THEN
      -- Conservative: creator, direct user grant, or super admin
      IF v_doc_creator = auth.uid() THEN
        RETURN TRUE;
      END IF;
      -- Only direct user grants apply to private documents
      RETURN EXISTS (
        SELECT 1 FROM document_user_access
        WHERE document_id = p_document_id
          AND user_id = auth.uid()
          AND organization_id = v_user_org_id
          AND (expires_at IS NULL OR expires_at > NOW())
          AND access_level_to_int(access_level) >= 1
      );

    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- Determines if current user can EDIT a document
CREATE OR REPLACE FUNCTION can_edit_document(p_document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_org_id UUID;
  v_doc_org_id UUID;
  v_doc_mode document_access_mode;
  v_doc_creator UUID;
  v_res_level INTEGER;
BEGIN
  -- 1. Check active user
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE id = auth.uid() AND status = 'active';

  IF v_user_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2. Fetch document details
  SELECT organization_id, access_mode, created_by
  INTO v_doc_org_id, v_doc_mode, v_doc_creator
  FROM documents
  WHERE id = p_document_id;

  IF v_doc_org_id IS NULL OR v_doc_org_id <> v_user_org_id THEN
    RETURN FALSE;
  END IF;

  -- 3. Check base system edit permission
  IF NOT has_permission('documents.edit') THEN
    RETURN FALSE;
  END IF;

  -- 4. Super Admin override
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;

  -- 5. Creator has edit access on organization/restricted/private docs
  IF v_doc_creator = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- 6. Evaluate access modes
  CASE v_doc_mode
    WHEN 'organization' THEN
      -- For organization docs, users with documents.edit and resource >= edit
      v_res_level := get_document_access_level(p_document_id);
      RETURN v_res_level >= 2;

    WHEN 'restricted' THEN
      v_res_level := get_document_access_level(p_document_id);
      RETURN v_res_level >= 2;

    WHEN 'private' THEN
      -- Private doc edit requires direct user grant with level >= edit
      RETURN EXISTS (
        SELECT 1 FROM document_user_access
        WHERE document_id = p_document_id
          AND user_id = auth.uid()
          AND organization_id = v_user_org_id
          AND (expires_at IS NULL OR expires_at > NOW())
          AND access_level_to_int(access_level) >= 2
      );

    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- Determines if current user can MANAGE access on a document
CREATE OR REPLACE FUNCTION can_manage_document(p_document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_org_id UUID;
  v_doc_org_id UUID;
  v_doc_creator UUID;
  v_res_level INTEGER;
BEGIN
  -- 1. Check active user
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE id = auth.uid() AND status = 'active';

  IF v_user_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2. Fetch document details
  SELECT organization_id, created_by
  INTO v_doc_org_id, v_doc_creator
  FROM documents
  WHERE id = p_document_id;

  IF v_doc_org_id IS NULL OR v_doc_org_id <> v_user_org_id THEN
    RETURN FALSE;
  END IF;

  -- 3. Super Admin can manage any document in same organization
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;

  -- 4. Must have base documents.manage_access permission
  IF NOT has_permission('documents.manage_access') THEN
    RETURN FALSE;
  END IF;

  -- 5. Creator has manage access
  IF v_doc_creator = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- 6. Resource access level = 3 (manage)
  v_res_level := get_document_access_level(p_document_id);
  RETURN v_res_level >= 3;
END;
$$;


-- ==============================================================================
-- 5. CONTROLLED CREATION & AUDIT RPCs
-- ==============================================================================

-- Atomically creates a document and bootstraps creator manage access (Rule 55)
CREATE OR REPLACE FUNCTION create_document(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_document_number TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_occasion_id UUID DEFAULT NULL,
  p_owner_group_id UUID DEFAULT NULL,
  p_document_date DATE DEFAULT NULL,
  p_fiscal_year TEXT DEFAULT NULL,
  p_status document_status DEFAULT 'draft',
  p_access_mode document_access_mode DEFAULT 'restricted',
  p_confidentiality document_confidentiality DEFAULT 'internal',
  p_expires_at DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_doc_id UUID;
BEGIN
  -- Verify active user with documents.create permission
  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  IF NOT has_permission('documents.create') THEN
    RAISE EXCEPTION 'Permission denied: documents.create required';
  END IF;

  -- Validate taxonomy belongs to same organization
  IF p_category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM document_categories WHERE id = p_category_id AND organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Invalid category for this organization';
  END IF;

  IF p_occasion_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM occasions WHERE id = p_occasion_id AND organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Invalid occasion for this organization';
  END IF;

  IF p_owner_group_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM groups WHERE id = p_owner_group_id AND organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Invalid group for this organization';
  END IF;

  -- Insert Document
  INSERT INTO documents (
    organization_id,
    title,
    description,
    document_number,
    category_id,
    occasion_id,
    owner_group_id,
    document_date,
    fiscal_year,
    status,
    access_mode,
    confidentiality,
    expires_at,
    created_by
  )
  VALUES (
    v_org_id,
    p_title,
    p_description,
    p_document_number,
    p_category_id,
    p_occasion_id,
    p_owner_group_id,
    p_document_date,
    p_fiscal_year,
    p_status,
    p_access_mode,
    p_confidentiality,
    p_expires_at,
    auth.uid()
  )
  RETURNING id INTO v_doc_id;

  -- Bootstrap direct manage access for creator on restricted / private documents
  IF p_access_mode IN ('restricted', 'private') THEN
    INSERT INTO document_user_access (
      organization_id,
      document_id,
      user_id,
      access_level,
      granted_by
    )
    VALUES (
      v_org_id,
      v_doc_id,
      auth.uid(),
      'manage',
      auth.uid()
    )
    ON CONFLICT (document_id, user_id) DO NOTHING;
  END IF;

  -- Record audit log
  PERFORM log_activity(
    'document.created',
    'document',
    v_doc_id,
    jsonb_build_object('title', p_title, 'access_mode', p_access_mode)
  );

  RETURN v_doc_id;
END;
$$;

-- Secure audit logger function (Rule 45)
CREATE OR REPLACE FUNCTION log_activity(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_log_id UUID;
BEGIN
  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO activity_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_org_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;
