-- Migration: 20261007192500_auth_rpcs.sql
-- Description: RPCs for atomic auth context loading, safe profile updates, status management, and invitation activation

-- 1. Returns effective system permissions array for active authenticated user
CREATE OR REPLACE FUNCTION get_my_permissions()
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_perms TEXT[];
BEGIN
  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  -- If super admin, return all system permissions
  IF is_super_admin() THEN
    SELECT array_agg(code ORDER BY code)
    INTO v_perms
    FROM permissions;
    RETURN COALESCE(v_perms, ARRAY[]::TEXT[]);
  END IF;

  -- Otherwise return distinct permissions mapped through caller's roles
  SELECT array_agg(DISTINCT p.code ORDER BY p.code)
  INTO v_perms
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = auth.uid()
    AND ur.organization_id = v_org_id;

  RETURN COALESCE(v_perms, ARRAY[]::TEXT[]);
END;
$$;

-- 2. Returns complete atomic auth bootstrap context in a single round-trip
CREATE OR REPLACE FUNCTION get_my_auth_context()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_profile RECORD;
  v_member RECORD;
  v_org RECORD;
  v_roles JSONB;
  v_permissions TEXT[];
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;

  -- 1. Load profile
  SELECT p.*
  INTO v_profile
  FROM profiles p
  WHERE p.id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'has_profile', false,
      'user_id', v_uid
    );
  END IF;

  -- 2. Load linked member (if any)
  IF v_profile.member_id IS NOT NULL THEN
    SELECT m.id, m.membership_number, m.first_name, m.middle_name, m.last_name, m.position_title, m.status AS member_status
    INTO v_member
    FROM members m
    WHERE m.id = v_profile.member_id;
  END IF;

  -- 3. Load organization
  SELECT o.id, o.name, o.short_name, o.logo_url, o.timezone
  INTO v_org
  FROM organizations o
  WHERE o.id = v_profile.organization_id;

  -- 4. Load roles
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'slug', r.slug,
    'is_system_role', r.is_system_role
  ) ORDER BY r.name), '[]'::jsonb)
  INTO v_roles
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = v_uid
    AND ur.organization_id = v_profile.organization_id;

  -- 5. Load effective permissions
  v_permissions := get_my_permissions();

  RETURN jsonb_build_object(
    'authenticated', true,
    'has_profile', true,
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'organization_id', v_profile.organization_id,
      'member_id', v_profile.member_id,
      'display_name', v_profile.display_name,
      'avatar_url', v_profile.avatar_url,
      'phone', v_profile.phone,
      'status', v_profile.status,
      'last_active_at', v_profile.last_active_at
    ),
    'member', CASE WHEN v_member.id IS NOT NULL THEN jsonb_build_object(
      'id', v_member.id,
      'membership_number', v_member.membership_number,
      'first_name', v_member.first_name,
      'middle_name', v_member.middle_name,
      'last_name', v_member.last_name,
      'full_name', TRIM(CONCAT(v_member.first_name, ' ', COALESCE(v_member.middle_name, ''), ' ', v_member.last_name)),
      'position_title', v_member.position_title,
      'status', v_member.member_status
    ) ELSE NULL END,
    'organization', jsonb_build_object(
      'id', v_org.id,
      'name', v_org.name,
      'short_name', v_org.short_name,
      'logo_url', v_org.logo_url,
      'timezone', v_org.timezone
    ),
    'roles', v_roles,
    'permissions', to_jsonb(v_permissions)
  );
END;
$$;

-- 3. Safe self-service profile update RPC (Rule 38)
CREATE OR REPLACE FUNCTION update_my_profile(
  p_display_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_updated RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    phone = COALESCE(p_phone, phone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = NOW()
  WHERE id = v_uid
  RETURNING id, display_name, phone, avatar_url INTO v_updated;

  RETURN jsonb_build_object(
    'id', v_updated.id,
    'display_name', v_updated.display_name,
    'phone', v_updated.phone,
    'avatar_url', v_updated.avatar_url
  );
END;
$$;

-- 4. Status management RPC for administrators (Rule 37)
CREATE OR REPLACE FUNCTION set_user_status(
  p_target_user_id UUID,
  p_new_status profile_status
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_org UUID;
  v_target_org UUID;
BEGIN
  v_caller_org := current_organization_id();
  IF v_caller_org IS NULL OR NOT has_permission('users.disable') THEN
    RAISE EXCEPTION 'Permission denied: users.disable required';
  END IF;

  -- Caller cannot disable or suspend themselves
  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Invalid operation: You cannot modify your own portal status';
  END IF;

  SELECT organization_id INTO v_target_org
  FROM profiles
  WHERE id = p_target_user_id;

  IF v_target_org IS NULL OR v_target_org <> v_caller_org THEN
    RAISE EXCEPTION 'Target user not found in this organization';
  END IF;

  UPDATE profiles
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_target_user_id;

  PERFORM log_activity(
    'user.status_changed',
    'profile',
    p_target_user_id,
    jsonb_build_object('new_status', p_new_status)
  );

  RETURN TRUE;
END;
$$;

-- 5. Safe profile activation on invitation acceptance (Rule 35)
CREATE OR REPLACE FUNCTION activate_my_invited_profile()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_curr_status profile_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT status INTO v_curr_status
  FROM profiles
  WHERE id = v_uid;

  IF v_curr_status IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_curr_status = 'active' THEN
    RETURN TRUE;
  END IF;

  IF v_curr_status <> 'invited' THEN
    RAISE EXCEPTION 'Account is not in an invited state';
  END IF;

  UPDATE profiles
  SET status = 'active', updated_at = NOW()
  WHERE id = v_uid;

  PERFORM log_activity(
    'user.activated',
    'profile',
    v_uid,
    jsonb_build_object('status', 'active')
  );

  RETURN TRUE;
END;
$$;
