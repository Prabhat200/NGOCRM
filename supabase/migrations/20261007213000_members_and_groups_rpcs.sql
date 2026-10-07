-- ==============================================================================
-- MEMBERS & GROUPS MODULE RPC FUNCTIONS & PRIVACY GUARDS
-- ==============================================================================

-- 1. Update get_document_access_level to ensure archived/inactive groups don't grant access (Rule 45, 74)
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

  -- 2. Group grants (via active member association to active/non-archived group)
  IF v_member_id IS NOT NULL THEN
    SELECT COALESCE(MAX(access_level_to_int(dga.access_level)), 0)
    INTO v_group_level
    FROM document_group_access dga
    JOIN group_members gm ON gm.group_id = dga.group_id
    JOIN groups g ON g.id = dga.group_id
    WHERE dga.document_id = p_document_id
      AND gm.member_id = v_member_id
      AND gm.is_active = TRUE
      AND g.is_active = TRUE
      AND g.archived_at IS NULL
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


-- 2. Archive Member RPC (Rule 25, 26)
CREATE OR REPLACE FUNCTION archive_member(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_member_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('members.archive') THEN
    RAISE EXCEPTION 'Permission denied: members.archive required';
  END IF;

  SELECT first_name || ' ' || last_name INTO v_member_name
  FROM members
  WHERE id = p_member_id AND organization_id = v_org_id;

  IF v_member_name IS NULL THEN
    RAISE EXCEPTION 'Member not found in current organization';
  END IF;

  UPDATE members
  SET
    archived_at = NOW(),
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_member_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'member.archived',
    'member',
    p_member_id,
    jsonb_build_object('name', v_member_name)
  );

  RETURN TRUE;
END;
$$;


-- 3. Restore Member RPC (Rule 27)
CREATE OR REPLACE FUNCTION restore_member(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_member_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('members.archive') AND NOT has_permission('members.edit') THEN
    RAISE EXCEPTION 'Permission denied: members.archive or members.edit required';
  END IF;

  SELECT first_name || ' ' || last_name INTO v_member_name
  FROM members
  WHERE id = p_member_id AND organization_id = v_org_id;

  IF v_member_name IS NULL THEN
    RAISE EXCEPTION 'Member not found in current organization';
  END IF;

  UPDATE members
  SET
    archived_at = NULL,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_member_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'member.restored',
    'member',
    p_member_id,
    jsonb_build_object('name', v_member_name)
  );

  RETURN TRUE;
END;
$$;


-- 4. Archive Group RPC (Rule 44, 45)
CREATE OR REPLACE FUNCTION archive_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_group_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('groups.edit') THEN
    RAISE EXCEPTION 'Permission denied: groups.edit required';
  END IF;

  SELECT name INTO v_group_name
  FROM groups
  WHERE id = p_group_id AND organization_id = v_org_id;

  IF v_group_name IS NULL THEN
    RAISE EXCEPTION 'Group not found in current organization';
  END IF;

  UPDATE groups
  SET
    is_active = FALSE,
    archived_at = NOW(),
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_group_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'group.archived',
    'group',
    p_group_id,
    jsonb_build_object('name', v_group_name)
  );

  RETURN TRUE;
END;
$$;


-- 5. Restore Group RPC (Rule 46)
CREATE OR REPLACE FUNCTION restore_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_group_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('groups.edit') THEN
    RAISE EXCEPTION 'Permission denied: groups.edit required';
  END IF;

  SELECT name INTO v_group_name
  FROM groups
  WHERE id = p_group_id AND organization_id = v_org_id;

  IF v_group_name IS NULL THEN
    RAISE EXCEPTION 'Group not found in current organization';
  END IF;

  UPDATE groups
  SET
    is_active = TRUE,
    archived_at = NULL,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_group_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'group.restored',
    'group',
    p_group_id,
    jsonb_build_object('name', v_group_name)
  );

  RETURN TRUE;
END;
$$;


-- 6. Add/Update Group Member RPC (Rule 37, 38)
CREATE OR REPLACE FUNCTION add_group_member(
  p_group_id UUID,
  p_member_id UUID,
  p_role_in_group TEXT DEFAULT NULL,
  p_joined_at DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_group_name TEXT;
  v_member_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('groups.manage_members') THEN
    RAISE EXCEPTION 'Permission denied: groups.manage_members required';
  END IF;

  -- Validate Group
  SELECT name INTO v_group_name
  FROM groups
  WHERE id = p_group_id AND organization_id = v_org_id;

  IF v_group_name IS NULL THEN
    RAISE EXCEPTION 'Group not found in current organization';
  END IF;

  -- Validate Member
  SELECT first_name || ' ' || last_name INTO v_member_name
  FROM members
  WHERE id = p_member_id AND organization_id = v_org_id;

  IF v_member_name IS NULL THEN
    RAISE EXCEPTION 'Member not found in current organization';
  END IF;

  INSERT INTO group_members (
    organization_id,
    group_id,
    member_id,
    role_in_group,
    joined_at,
    is_active
  )
  VALUES (
    v_org_id,
    p_group_id,
    p_member_id,
    NULLIF(TRIM(p_role_in_group), ''),
    COALESCE(p_joined_at, CURRENT_DATE),
    TRUE
  )
  ON CONFLICT (group_id, member_id)
  DO UPDATE SET
    role_in_group = EXCLUDED.role_in_group,
    joined_at = EXCLUDED.joined_at,
    is_active = TRUE;

  PERFORM log_activity(
    'group.member_added',
    'group',
    p_group_id,
    jsonb_build_object(
      'group_name', v_group_name,
      'member_id', p_member_id,
      'member_name', v_member_name,
      'role', p_role_in_group
    )
  );

  RETURN TRUE;
END;
$$;


-- 7. Remove Group Member RPC (Rule 39)
CREATE OR REPLACE FUNCTION remove_group_member(
  p_group_id UUID,
  p_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_group_name TEXT;
  v_member_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('groups.manage_members') THEN
    RAISE EXCEPTION 'Permission denied: groups.manage_members required';
  END IF;

  SELECT name INTO v_group_name
  FROM groups
  WHERE id = p_group_id AND organization_id = v_org_id;

  SELECT first_name || ' ' || last_name INTO v_member_name
  FROM members
  WHERE id = p_member_id AND organization_id = v_org_id;

  DELETE FROM group_members
  WHERE group_id = p_group_id AND member_id = p_member_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'group.member_removed',
    'group',
    p_group_id,
    jsonb_build_object(
      'group_name', v_group_name,
      'member_id', p_member_id,
      'member_name', v_member_name
    )
  );

  RETURN TRUE;
END;
$$;


-- 8. Assign/Update User Roles with Super Admin privilege escalation prevention (Rule 23, 71)
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

  -- Verify each role belongs to organization and prevent super_admin escalation
  FOREACH v_role_id IN ARRAY p_role_ids
  LOOP
    SELECT slug INTO v_role_slug
    FROM roles
    WHERE id = v_role_id AND organization_id = v_org_id;

    IF v_role_slug IS NULL THEN
      RAISE EXCEPTION 'Invalid role ID % for current organization', v_role_id;
    END IF;

    IF v_role_slug = 'super_admin' AND NOT v_is_super THEN
      RAISE EXCEPTION 'Permission denied: Only Super Admins can assign the super_admin role';
    END IF;
  END LOOP;

  -- Delete existing roles (prevent non-super-admins from removing super_admin if already held)
  DELETE FROM user_roles
  WHERE user_id = p_target_user_id
    AND organization_id = v_org_id
    AND (
      (SELECT slug FROM roles WHERE id = role_id) <> 'super_admin'
      OR v_is_super
    );

  -- Insert new roles
  FOREACH v_role_id IN ARRAY p_role_ids
  LOOP
    INSERT INTO user_roles (user_id, role_id, organization_id)
    VALUES (p_target_user_id, v_role_id, v_org_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END LOOP;

  PERFORM log_activity(
    'user.roles_changed',
    'profile',
    p_target_user_id,
    jsonb_build_object('role_count', array_length(p_role_ids, 1))
  );

  RETURN TRUE;
END;
$$;
