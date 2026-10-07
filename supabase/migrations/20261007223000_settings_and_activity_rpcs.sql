-- ==============================================================================
-- MIGRATION: 20261007223000_settings_and_activity_rpcs.sql
-- Description: Activity logs query helper, Notifications helpers, 
-- Organization settings, Categories, Occasion Types, Role Permissions,
-- and Last Super Admin guard.
-- ==============================================================================

-- 1. Helper function for activity logs with server-side pagination, search, and actor identity
CREATE OR REPLACE FUNCTION get_activity_logs(
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 25,
  p_action_category TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  user_id UUID,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  actor_name TEXT,
  actor_email TEXT,
  actor_avatar TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_offset INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Organization not resolved';
  END IF;

  IF NOT has_permission('audit.view') THEN
    RAISE EXCEPTION 'Permission denied: audit.view required';
  END IF;

  v_offset := GREATEST(0, (COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 25));

  RETURN QUERY
  WITH filtered_logs AS (
    SELECT
      al.id,
      al.organization_id,
      al.user_id,
      al.action,
      al.entity_type,
      al.entity_id,
      al.metadata,
      al.created_at,
      COALESCE(
        NULLIF(TRIM(COALESCE(m.first_name, '') || ' ' || COALESCE(m.last_name, '')), ''),
        p.display_name,
        u.email,
        'System'
      ) AS actor_name,
      u.email::TEXT AS actor_email,
      p.avatar_url AS actor_avatar
    FROM activity_logs al
    LEFT JOIN profiles p ON p.id = al.user_id
    LEFT JOIN members m ON m.id = p.member_id
    LEFT JOIN auth.users u ON u.id = al.user_id
    WHERE al.organization_id = v_org_id
      AND (
        p_action_category IS NULL
        OR p_action_category = ''
        OR (p_action_category = 'documents' AND al.action LIKE 'document%')
        OR (p_action_category = 'occasions' AND al.action LIKE 'occasion%')
        OR (p_action_category = 'members' AND al.action LIKE 'member%')
        OR (p_action_category = 'groups' AND al.action LIKE 'group%')
        OR (p_action_category = 'users' AND (al.action LIKE 'user%' OR al.action LIKE 'role%'))
        OR (p_action_category = 'settings' AND (al.action LIKE 'organization%' OR al.action LIKE 'document_category%' OR al.action LIKE 'occasion_type%'))
      )
      AND (p_user_id IS NULL OR al.user_id = p_user_id)
      AND (p_start_date IS NULL OR al.created_at >= p_start_date)
      AND (p_end_date IS NULL OR al.created_at <= p_end_date)
      AND (
        p_search IS NULL
        OR p_search = ''
        OR al.action ILIKE '%' || p_search || '%'
        OR al.entity_type ILIKE '%' || p_search || '%'
        OR COALESCE(p.display_name, '') ILIKE '%' || p_search || '%'
        OR COALESCE(m.first_name || ' ' || m.last_name, '') ILIKE '%' || p_search || '%'
        OR COALESCE(al.metadata->>'title', '') ILIKE '%' || p_search || '%'
        OR COALESCE(al.metadata->>'document_title', '') ILIKE '%' || p_search || '%'
        OR COALESCE(al.metadata->>'name', '') ILIKE '%' || p_search || '%'
        OR COALESCE(al.metadata->>'group_name', '') ILIKE '%' || p_search || '%'
      )
  )
  SELECT
    fl.id,
    fl.organization_id,
    fl.user_id,
    fl.action,
    fl.entity_type,
    fl.entity_id,
    fl.metadata,
    fl.created_at,
    fl.actor_name,
    fl.actor_email,
    fl.actor_avatar,
    COUNT(*) OVER() AS total_count
  FROM filtered_logs fl
  ORDER BY fl.created_at DESC
  LIMIT COALESCE(p_page_size, 25)
  OFFSET v_offset;
END;
$$;


-- 2. Notifications: Mark All Read RPC
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_org_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not authenticated';
  END IF;

  v_org_id := current_organization_id();

  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid()
    AND organization_id = v_org_id
    AND is_read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


-- 3. Update Organization Settings RPC
CREATE OR REPLACE FUNCTION update_organization_settings(
  p_name TEXT,
  p_short_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_registration_no TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT 'Asia/Kathmandu',
  p_logo_url TEXT DEFAULT NULL
)
RETURNS organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_updated organizations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Organization not resolved';
  END IF;

  IF NOT has_permission('settings.manage') THEN
    RAISE EXCEPTION 'Permission denied: settings.manage required';
  END IF;

  IF TRIM(COALESCE(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  UPDATE organizations
  SET
    name = TRIM(p_name),
    short_name = NULLIF(TRIM(p_short_name), ''),
    email = NULLIF(TRIM(p_email), ''),
    phone = NULLIF(TRIM(p_phone), ''),
    address = NULLIF(TRIM(p_address), ''),
    registration_no = NULLIF(TRIM(p_registration_no), ''),
    website = NULLIF(TRIM(p_website), ''),
    timezone = COALESCE(NULLIF(TRIM(p_timezone), ''), 'Asia/Kathmandu'),
    logo_url = NULLIF(TRIM(p_logo_url), ''),
    updated_at = NOW()
  WHERE id = v_org_id
  RETURNING * INTO v_updated;

  PERFORM log_activity(
    'organization.updated',
    'organization',
    v_org_id,
    jsonb_build_object(
      'name', v_updated.name,
      'short_name', v_updated.short_name,
      'timezone', v_updated.timezone
    )
  );

  RETURN v_updated;
END;
$$;


-- 4. Document Categories Management RPCs
CREATE OR REPLACE FUNCTION create_document_category(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL
)
RETURNS document_categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_created document_categories;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Organization not resolved';
  END IF;

  IF NOT has_permission('settings.manage') THEN
    RAISE EXCEPTION 'Permission denied: settings.manage required';
  END IF;

  IF TRIM(COALESCE(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Category name is required';
  END IF;

  -- Case-insensitive check in organization
  IF EXISTS (
    SELECT 1 FROM document_categories
    WHERE organization_id = v_org_id
      AND LOWER(name) = LOWER(TRIM(p_name))
  ) THEN
    RAISE EXCEPTION 'A category with this name already exists';
  END IF;

  INSERT INTO document_categories (
    organization_id,
    name,
    description,
    icon,
    is_active
  )
  VALUES (
    v_org_id,
    TRIM(p_name),
    NULLIF(TRIM(p_description), ''),
    NULLIF(TRIM(p_icon), ''),
    TRUE
  )
  RETURNING * INTO v_created;

  PERFORM log_activity(
    'document_category.created',
    'document_category',
    v_created.id,
    jsonb_build_object('name', v_created.name)
  );

  RETURN v_created;
END;
$$;

CREATE OR REPLACE FUNCTION update_document_category(
  p_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS document_categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_existing document_categories;
  v_updated document_categories;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Organization not resolved';
  END IF;

  IF NOT has_permission('settings.manage') THEN
    RAISE EXCEPTION 'Permission denied: settings.manage required';
  END IF;

  IF TRIM(COALESCE(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Category name is required';
  END IF;

  SELECT * INTO v_existing
  FROM document_categories
  WHERE id = p_id AND organization_id = v_org_id;

  IF v_existing.id IS NULL THEN
    RAISE EXCEPTION 'Category not found in current organization';
  END IF;

  -- Case-insensitive check excluding current
  IF EXISTS (
    SELECT 1 FROM document_categories
    WHERE organization_id = v_org_id
      AND id <> p_id
      AND LOWER(name) = LOWER(TRIM(p_name))
  ) THEN
    RAISE EXCEPTION 'Another category with this name already exists';
  END IF;

  UPDATE document_categories
  SET
    name = TRIM(p_name),
    description = NULLIF(TRIM(p_description), ''),
    icon = NULLIF(TRIM(p_icon), ''),
    is_active = COALESCE(p_is_active, TRUE),
    updated_at = NOW()
  WHERE id = p_id AND organization_id = v_org_id
  RETURNING * INTO v_updated;

  IF v_existing.is_active AND NOT v_updated.is_active THEN
    v_action := 'document_category.deactivated';
  ELSIF NOT v_existing.is_active AND v_updated.is_active THEN
    v_action := 'document_category.reactivated';
  ELSE
    v_action := 'document_category.updated';
  END IF;

  PERFORM log_activity(
    v_action,
    'document_category',
    v_updated.id,
    jsonb_build_object('name', v_updated.name, 'is_active', v_updated.is_active)
  );

  RETURN v_updated;
END;
$$;


-- 5. Occasion Types Management RPCs
CREATE OR REPLACE FUNCTION create_occasion_type(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL
)
RETURNS occasion_types
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_created occasion_types;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Organization not resolved';
  END IF;

  IF NOT has_permission('settings.manage') THEN
    RAISE EXCEPTION 'Permission denied: settings.manage required';
  END IF;

  IF TRIM(COALESCE(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Occasion type name is required';
  END IF;

  -- Case-insensitive check in organization
  IF EXISTS (
    SELECT 1 FROM occasion_types
    WHERE organization_id = v_org_id
      AND LOWER(name) = LOWER(TRIM(p_name))
  ) THEN
    RAISE EXCEPTION 'An occasion type with this name already exists';
  END IF;

  INSERT INTO occasion_types (
    organization_id,
    name,
    description,
    icon,
    is_active
  )
  VALUES (
    v_org_id,
    TRIM(p_name),
    NULLIF(TRIM(p_description), ''),
    NULLIF(TRIM(p_icon), ''),
    TRUE
  )
  RETURNING * INTO v_created;

  PERFORM log_activity(
    'occasion_type.created',
    'occasion_type',
    v_created.id,
    jsonb_build_object('name', v_created.name)
  );

  RETURN v_created;
END;
$$;

CREATE OR REPLACE FUNCTION update_occasion_type(
  p_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS occasion_types
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_existing occasion_types;
  v_updated occasion_types;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Organization not resolved';
  END IF;

  IF NOT has_permission('settings.manage') THEN
    RAISE EXCEPTION 'Permission denied: settings.manage required';
  END IF;

  IF TRIM(COALESCE(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Occasion type name is required';
  END IF;

  SELECT * INTO v_existing
  FROM occasion_types
  WHERE id = p_id AND organization_id = v_org_id;

  IF v_existing.id IS NULL THEN
    RAISE EXCEPTION 'Occasion type not found in current organization';
  END IF;

  -- Case-insensitive check excluding current
  IF EXISTS (
    SELECT 1 FROM occasion_types
    WHERE organization_id = v_org_id
      AND id <> p_id
      AND LOWER(name) = LOWER(TRIM(p_name))
  ) THEN
    RAISE EXCEPTION 'Another occasion type with this name already exists';
  END IF;

  UPDATE occasion_types
  SET
    name = TRIM(p_name),
    description = NULLIF(TRIM(p_description), ''),
    icon = NULLIF(TRIM(p_icon), ''),
    is_active = COALESCE(p_is_active, TRUE),
    updated_at = NOW()
  WHERE id = p_id AND organization_id = v_org_id
  RETURNING * INTO v_updated;

  IF v_existing.is_active AND NOT v_updated.is_active THEN
    v_action := 'occasion_type.deactivated';
  ELSIF NOT v_existing.is_active AND v_updated.is_active THEN
    v_action := 'occasion_type.reactivated';
  ELSE
    v_action := 'occasion_type.updated';
  END IF;

  PERFORM log_activity(
    v_action,
    'occasion_type',
    v_updated.id,
    jsonb_build_object('name', v_updated.name, 'is_active', v_updated.is_active)
  );

  RETURN v_updated;
END;
$$;


-- 6. Role Permissions Update & Super Admin Protection
CREATE OR REPLACE FUNCTION update_role_permissions(
  p_role_id UUID,
  p_permission_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_role roles%ROWTYPE;
  v_is_super BOOLEAN;
  v_perm_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Organization not resolved';
  END IF;

  -- Caller must have users.manage_roles or settings.manage
  IF NOT (has_permission('users.manage_roles') OR has_permission('settings.manage')) THEN
    RAISE EXCEPTION 'Permission denied: users.manage_roles or settings.manage required';
  END IF;

  v_is_super := is_super_admin();

  -- Verify role belongs to caller org
  SELECT * INTO v_role
  FROM roles
  WHERE id = p_role_id AND organization_id = v_org_id;

  IF v_role.id IS NULL THEN
    RAISE EXCEPTION 'Role not found in current organization';
  END IF;

  -- Protection: Super Admin role permissions can only be altered by an existing Super Admin
  IF v_role.slug = 'super_admin' AND NOT v_is_super THEN
    RAISE EXCEPTION 'Permission denied: Only a Super Admin can modify Super Admin permissions';
  END IF;

  -- Protection: Super Admin must never have all permissions removed
  IF v_role.slug = 'super_admin' AND (p_permission_ids IS NULL OR array_length(p_permission_ids, 1) IS NULL OR array_length(p_permission_ids, 1) = 0) THEN
    RAISE EXCEPTION 'Denied: Cannot strip all permissions from Super Admin';
  END IF;

  -- Delete existing role_permissions for this role
  DELETE FROM role_permissions
  WHERE role_id = p_role_id AND organization_id = v_org_id;

  -- Insert new permissions
  IF p_permission_ids IS NOT NULL THEN
    FOREACH v_perm_id IN ARRAY p_permission_ids
    LOOP
      -- Verify permission exists in global catalog
      IF EXISTS (SELECT 1 FROM permissions WHERE id = v_perm_id) THEN
        INSERT INTO role_permissions (organization_id, role_id, permission_id)
        VALUES (v_org_id, p_role_id, v_perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  PERFORM log_activity(
    'role.permissions_updated',
    'role',
    p_role_id,
    jsonb_build_object(
      'role_name', v_role.name,
      'permission_count', COALESCE(array_length(p_permission_ids, 1), 0)
    )
  );

  RETURN TRUE;
END;
$$;


-- 7. Create Custom Role RPC
CREATE OR REPLACE FUNCTION create_custom_role(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_permission_ids UUID[] DEFAULT '{}'::uuid[]
)
RETURNS roles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_slug TEXT;
  v_created roles;
  v_perm_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Organization not resolved';
  END IF;

  IF NOT (has_permission('users.manage_roles') OR has_permission('settings.manage')) THEN
    RAISE EXCEPTION 'Permission denied: users.manage_roles or settings.manage required';
  END IF;

  IF TRIM(COALESCE(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Role name is required';
  END IF;

  -- Generate slug from name
  v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '_', 'g'));
  v_slug := trim(both '_' from v_slug);

  IF v_slug = '' THEN
    v_slug := 'role_' || substr(gen_random_uuid()::text, 1, 8);
  END IF;

  -- Disallow collision with reserved system roles
  IF v_slug IN ('super_admin', 'secretary_admin', 'member') THEN
    v_slug := v_slug || '_' || substr(gen_random_uuid()::text, 1, 4);
  END IF;

  -- Check if slug already exists in org
  IF EXISTS (SELECT 1 FROM roles WHERE organization_id = v_org_id AND slug = v_slug) THEN
    v_slug := v_slug || '_' || substr(gen_random_uuid()::text, 1, 4);
  END IF;

  INSERT INTO roles (
    organization_id,
    name,
    slug,
    description,
    is_system_role
  )
  VALUES (
    v_org_id,
    TRIM(p_name),
    v_slug,
    NULLIF(TRIM(p_description), ''),
    FALSE
  )
  RETURNING * INTO v_created;

  -- Assign initial permissions if provided
  IF p_permission_ids IS NOT NULL THEN
    FOREACH v_perm_id IN ARRAY p_permission_ids
    LOOP
      IF EXISTS (SELECT 1 FROM permissions WHERE id = v_perm_id) THEN
        INSERT INTO role_permissions (organization_id, role_id, permission_id)
        VALUES (v_org_id, v_created.id, v_perm_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  PERFORM log_activity(
    'role.created',
    'role',
    v_created.id,
    jsonb_build_object('name', v_created.name, 'slug', v_created.slug)
  );

  RETURN v_created;
END;
$$;


-- 8. Delete Custom Role RPC (Safeguarded against system roles and active assignments)
CREATE OR REPLACE FUNCTION delete_custom_role(p_role_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_role roles%ROWTYPE;
  v_assigned_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Organization not resolved';
  END IF;

  IF NOT (has_permission('users.manage_roles') OR has_permission('settings.manage')) THEN
    RAISE EXCEPTION 'Permission denied: users.manage_roles required';
  END IF;

  SELECT * INTO v_role
  FROM roles
  WHERE id = p_role_id AND organization_id = v_org_id;

  IF v_role.id IS NULL THEN
    RAISE EXCEPTION 'Role not found in current organization';
  END IF;

  IF v_role.is_system_role THEN
    RAISE EXCEPTION 'System roles cannot be deleted';
  END IF;

  -- Check if any users are assigned to this role
  SELECT COUNT(*) INTO v_assigned_count
  FROM user_roles
  WHERE role_id = p_role_id AND organization_id = v_org_id;

  IF v_assigned_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete role: % user(s) currently assigned. Please reassign them first.', v_assigned_count;
  END IF;

  -- Delete role permissions and role
  DELETE FROM role_permissions WHERE role_id = p_role_id AND organization_id = v_org_id;
  DELETE FROM roles WHERE id = p_role_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'role.deleted',
    'role',
    p_role_id,
    jsonb_build_object('name', v_role.name, 'slug', v_role.slug)
  );

  RETURN TRUE;
END;
$$;


-- 9. Update set_user_roles to enforce the LAST SUPER ADMIN rule (Rules 43, 44, 45)
CREATE OR REPLACE FUNCTION set_user_roles(
  p_target_user_id UUID,
  p_role_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_target_org UUID;
  v_role_id UUID;
  v_role_slug TEXT;
  v_is_super BOOLEAN;
  v_target_currently_super BOOLEAN;
  v_target_will_be_super BOOLEAN := FALSE;
  v_active_super_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('users.manage_roles') THEN
    RAISE EXCEPTION 'Permission denied: users.manage_roles required';
  END IF;

  v_is_super := is_super_admin();

  -- Verify target user belongs to same organization
  SELECT organization_id INTO v_target_org
  FROM profiles
  WHERE id = p_target_user_id;

  IF v_target_org IS NULL OR v_target_org <> v_org_id THEN
    RAISE EXCEPTION 'Target user not found in this organization';
  END IF;

  -- Check if target user currently has super_admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_target_user_id
      AND ur.organization_id = v_org_id
      AND r.slug = 'super_admin'
  ) INTO v_target_currently_super;

  -- Verify each new role belongs to organization and check if super_admin is being assigned
  IF p_role_ids IS NOT NULL THEN
    FOREACH v_role_id IN ARRAY p_role_ids
    LOOP
      SELECT slug INTO v_role_slug
      FROM roles
      WHERE id = v_role_id AND organization_id = v_org_id;

      IF v_role_slug IS NULL THEN
        RAISE EXCEPTION 'Invalid role ID % for current organization', v_role_id;
      END IF;

      IF v_role_slug = 'super_admin' THEN
        v_target_will_be_super := TRUE;
        -- Only Super Admins can assign super_admin
        IF NOT v_is_super THEN
          RAISE EXCEPTION 'Permission denied: Only Super Admins can assign the super_admin role';
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- If removing super_admin from someone who had it:
  IF v_target_currently_super AND NOT v_target_will_be_super THEN
    -- Only existing Super Admin can demote a Super Admin
    IF NOT v_is_super THEN
      RAISE EXCEPTION 'Permission denied: Only Super Admins can remove the super_admin role';
    END IF;

    -- LAST SUPER ADMIN CHECK: Ensure at least one ACTIVE super admin remains
    SELECT COUNT(DISTINCT ur.user_id) INTO v_active_super_count
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    JOIN profiles p ON p.id = ur.user_id
    WHERE ur.organization_id = v_org_id
      AND r.slug = 'super_admin'
      AND p.status = 'active';

    IF v_active_super_count <= 1 THEN
      RAISE EXCEPTION 'At least one active Super Admin is required.';
    END IF;
  END IF;

  -- Delete existing roles
  DELETE FROM user_roles
  WHERE user_id = p_target_user_id
    AND organization_id = v_org_id
    AND (
      (SELECT slug FROM roles WHERE id = role_id) <> 'super_admin'
      OR v_is_super
    );

  -- Insert new roles
  IF p_role_ids IS NOT NULL THEN
    FOREACH v_role_id IN ARRAY p_role_ids
    LOOP
      INSERT INTO user_roles (user_id, role_id, organization_id)
      VALUES (p_target_user_id, v_role_id, v_org_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END LOOP;
  END IF;

  PERFORM log_activity(
    'role.assigned',
    'profile',
    p_target_user_id,
    jsonb_build_object('role_count', COALESCE(array_length(p_role_ids, 1), 0))
  );

  RETURN TRUE;
END;
$$;
