-- ==============================================================================
-- MIGRATION: 20261007225800_activity_logs_immutability_trigger.sql
-- Description: Absolute immutability enforcement on activity_logs
-- ==============================================================================

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
  FOR EACH ROW
  EXECUTE FUNCTION prevent_activity_log_mutation();
