-- ==============================================================================
-- OCCASIONS MANAGEMENT SECURE RPC FUNCTIONS
-- ==============================================================================
-- Description: Transactional functions for occasion creation, updates, archival,
--              restoration, participant management, and audit logging.

-- 1. Create Occasion RPC (Rule 11, 14, 17)
CREATE OR REPLACE FUNCTION create_occasion(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_occasion_type_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_status occasion_status DEFAULT 'planned',
  p_fiscal_year TEXT DEFAULT NULL,
  p_members JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_occasion_id UUID;
  v_mem_elem JSONB;
  v_mem_id UUID;
  v_mem_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('occasions.create') THEN
    RAISE EXCEPTION 'Permission denied: occasions.create required';
  END IF;

  -- Validate Dates
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL AND p_end_date < p_start_date THEN
    RAISE EXCEPTION 'Validation error: End date cannot precede start date';
  END IF;

  -- Validate Occasion Type belonging to same organization
  IF p_occasion_type_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM occasion_types
      WHERE id = p_occasion_type_id AND organization_id = v_org_id
    ) THEN
      RAISE EXCEPTION 'Invalid occasion type for current organization';
    END IF;
  END IF;

  -- Insert Occasion Record
  INSERT INTO occasions (
    organization_id,
    name,
    description,
    occasion_type_id,
    start_date,
    end_date,
    location,
    status,
    fiscal_year,
    created_by,
    updated_by
  )
  VALUES (
    v_org_id,
    TRIM(p_name),
    NULLIF(TRIM(p_description), ''),
    p_occasion_type_id,
    p_start_date,
    p_end_date,
    NULLIF(TRIM(p_location), ''),
    p_status,
    NULLIF(TRIM(p_fiscal_year), ''),
    v_user_id,
    v_user_id
  )
  RETURNING id INTO v_occasion_id;

  -- Process initial members if provided
  IF jsonb_array_length(p_members) > 0 THEN
    FOR v_mem_elem IN SELECT * FROM jsonb_array_elements(p_members)
    LOOP
      v_mem_id := (v_mem_elem->>'member_id')::uuid;
      v_mem_role := NULLIF(TRIM(v_mem_elem->>'role'), '');

      -- Verify member belongs to same organization
      IF EXISTS (SELECT 1 FROM members WHERE id = v_mem_id AND organization_id = v_org_id) THEN
        INSERT INTO occasion_members (
          organization_id,
          occasion_id,
          member_id,
          role
        )
        VALUES (
          v_org_id,
          v_occasion_id,
          v_mem_id,
          v_mem_role
        )
        ON CONFLICT (occasion_id, member_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- Audit Log
  PERFORM log_activity(
    'occasion.created',
    'occasion',
    v_occasion_id,
    jsonb_build_object(
      'name', TRIM(p_name),
      'status', p_status,
      'start_date', p_start_date
    )
  );

  RETURN v_occasion_id;
END;
$$;


-- 2. Update Occasion RPC (Rule 30)
CREATE OR REPLACE FUNCTION update_occasion(
  p_occasion_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_occasion_type_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_status occasion_status DEFAULT 'planned',
  p_fiscal_year TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('occasions.edit') THEN
    RAISE EXCEPTION 'Permission denied: occasions.edit required';
  END IF;

  -- Validate Dates
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL AND p_end_date < p_start_date THEN
    RAISE EXCEPTION 'Validation error: End date cannot precede start date';
  END IF;

  -- Validate Occasion Type
  IF p_occasion_type_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM occasion_types
      WHERE id = p_occasion_type_id AND organization_id = v_org_id
    ) THEN
      RAISE EXCEPTION 'Invalid occasion type for current organization';
    END IF;
  END IF;

  -- Update record
  UPDATE occasions
  SET
    name = TRIM(p_name),
    description = NULLIF(TRIM(p_description), ''),
    occasion_type_id = p_occasion_type_id,
    start_date = p_start_date,
    end_date = p_end_date,
    location = NULLIF(TRIM(p_location), ''),
    status = p_status,
    fiscal_year = NULLIF(TRIM(p_fiscal_year), ''),
    updated_by = v_user_id,
    updated_at = NOW()
  WHERE id = p_occasion_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Occasion not found in current organization';
  END IF;

  -- Audit Log
  PERFORM log_activity(
    'occasion.updated',
    'occasion',
    p_occasion_id,
    jsonb_build_object(
      'name', TRIM(p_name),
      'status', p_status
    )
  );

  RETURN TRUE;
END;
$$;


-- 3. Archive Occasion RPC (Rule 31, 34)
CREATE OR REPLACE FUNCTION archive_occasion(p_occasion_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_occ_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('occasions.archive') THEN
    RAISE EXCEPTION 'Permission denied: occasions.archive required';
  END IF;

  SELECT name INTO v_occ_name
  FROM occasions
  WHERE id = p_occasion_id AND organization_id = v_org_id;

  IF v_occ_name IS NULL THEN
    RAISE EXCEPTION 'Occasion not found in current organization';
  END IF;

  UPDATE occasions
  SET
    archived_at = NOW(),
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_occasion_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'occasion.archived',
    'occasion',
    p_occasion_id,
    jsonb_build_object('name', v_occ_name)
  );

  RETURN TRUE;
END;
$$;


-- 4. Restore Occasion RPC (Rule 32)
CREATE OR REPLACE FUNCTION restore_occasion(p_occasion_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_occ_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('occasions.archive') AND NOT has_permission('occasions.edit') THEN
    RAISE EXCEPTION 'Permission denied: occasions.archive or occasions.edit required';
  END IF;

  SELECT name INTO v_occ_name
  FROM occasions
  WHERE id = p_occasion_id AND organization_id = v_org_id;

  IF v_occ_name IS NULL THEN
    RAISE EXCEPTION 'Occasion not found in current organization';
  END IF;

  UPDATE occasions
  SET
    archived_at = NULL,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_occasion_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'occasion.restored',
    'occasion',
    p_occasion_id,
    jsonb_build_object('name', v_occ_name)
  );

  RETURN TRUE;
END;
$$;


-- 5. Participant Management RPCs (Rule 28, 29)
CREATE OR REPLACE FUNCTION add_occasion_member(
  p_occasion_id UUID,
  p_member_id UUID,
  p_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_mem_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('occasions.edit') THEN
    RAISE EXCEPTION 'Permission denied: occasions.edit required';
  END IF;

  -- Validate Occasion belongs to current org
  IF NOT EXISTS (
    SELECT 1 FROM occasions WHERE id = p_occasion_id AND organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Occasion not found in current organization';
  END IF;

  -- Validate Member belongs to current org
  SELECT first_name || ' ' || last_name INTO v_mem_name
  FROM members
  WHERE id = p_member_id AND organization_id = v_org_id;

  IF v_mem_name IS NULL THEN
    RAISE EXCEPTION 'Member not found in current organization';
  END IF;

  INSERT INTO occasion_members (
    organization_id,
    occasion_id,
    member_id,
    role
  )
  VALUES (
    v_org_id,
    p_occasion_id,
    p_member_id,
    NULLIF(TRIM(p_role), '')
  )
  ON CONFLICT (occasion_id, member_id)
  DO UPDATE SET role = EXCLUDED.role;

  PERFORM log_activity(
    'occasion.member_added',
    'occasion',
    p_occasion_id,
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_mem_name,
      'role', p_role
    )
  );

  RETURN TRUE;
END;
$$;


CREATE OR REPLACE FUNCTION remove_occasion_member(
  p_occasion_id UUID,
  p_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_mem_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('occasions.edit') THEN
    RAISE EXCEPTION 'Permission denied: occasions.edit required';
  END IF;

  -- Validate Occasion belongs to current org
  IF NOT EXISTS (
    SELECT 1 FROM occasions WHERE id = p_occasion_id AND organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Occasion not found in current organization';
  END IF;

  SELECT first_name || ' ' || last_name INTO v_mem_name
  FROM members
  WHERE id = p_member_id AND organization_id = v_org_id;

  DELETE FROM occasion_members
  WHERE occasion_id = p_occasion_id AND member_id = p_member_id AND organization_id = v_org_id;

  PERFORM log_activity(
    'occasion.member_removed',
    'occasion',
    p_occasion_id,
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_mem_name
    )
  );

  RETURN TRUE;
END;
$$;
