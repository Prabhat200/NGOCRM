-- ==============================================================================
-- MIGRATION: 20261007231500_hardening_and_directory_rpc.sql
-- Description: Statement-level immutability for activity_logs and 
-- safe members directory RPC with privacy protection.
-- ==============================================================================

-- 1. Statement-level immutability trigger for activity_logs
CREATE OR REPLACE FUNCTION prevent_activity_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Activity logs are strictly append-only and cannot be updated or deleted';
END;
$$;

DROP TRIGGER IF EXISTS tr_activity_logs_immutable ON activity_logs;
CREATE TRIGGER tr_activity_logs_immutable
  BEFORE UPDATE OR DELETE ON activity_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION prevent_activity_log_mutation();


-- 2. Safe Member Directory RPC (privacy-enforcing: excludes phone, address, notes)
CREATE OR REPLACE FUNCTION get_members_directory(
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 25,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  membership_number TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  position_title TEXT,
  status member_status,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := current_organization_id();
  v_offset INTEGER;
BEGIN
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Current organization not resolved';
  END IF;

  IF NOT has_permission('members.view') THEN
    RAISE EXCEPTION 'Permission denied: members.view required';
  END IF;

  v_offset := GREATEST(0, (COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 25));

  RETURN QUERY
  SELECT 
    m.id,
    m.organization_id,
    m.membership_number,
    m.first_name,
    m.middle_name,
    m.last_name,
    m.position_title,
    m.status,
    COUNT(*) OVER() AS total_count
  FROM members m
  WHERE m.organization_id = v_org_id
    AND m.archived_at IS NULL
    AND (
      p_search IS NULL OR p_search = ''
      OR m.first_name ILIKE '%' || p_search || '%'
      OR m.last_name ILIKE '%' || p_search || '%'
      OR m.position_title ILIKE '%' || p_search || '%'
      OR m.membership_number ILIKE '%' || p_search || '%'
    )
  ORDER BY m.first_name, m.last_name
  LIMIT COALESCE(p_page_size, 25)
  OFFSET v_offset;
END;
$$;
