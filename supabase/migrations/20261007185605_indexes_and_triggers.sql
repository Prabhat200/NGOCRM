-- Migration: 20261007185605_indexes_and_triggers.sql
-- Description: Query performance indexes, updated_at triggers, and safe-deny RLS enablement

-- ==============================================================================
-- 1. PERFORMANCE INDEXES
-- ==============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_org_id ON profiles (organization_id);
CREATE INDEX idx_profiles_status ON profiles (status);

-- Members indexes
CREATE INDEX idx_members_org_status ON members (organization_id, status);
CREATE INDEX idx_members_org_archived ON members (organization_id, archived_at);

-- User Roles indexes
CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX idx_user_roles_org_user ON user_roles (organization_id, user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);

-- Groups & Group Members indexes
CREATE INDEX idx_groups_org_type ON groups (organization_id, type);
CREATE INDEX idx_groups_org_archived ON groups (organization_id, archived_at);
CREATE INDEX idx_group_members_group_id ON group_members (group_id);
CREATE INDEX idx_group_members_member_id ON group_members (member_id);

-- Occasions indexes
CREATE INDEX idx_occasions_org_status ON occasions (organization_id, status);
CREATE INDEX idx_occasions_org_start_date ON occasions (organization_id, start_date);
CREATE INDEX idx_occasions_org_type_id ON occasions (organization_id, occasion_type_id);
CREATE INDEX idx_occasions_org_archived ON occasions (organization_id, archived_at);
CREATE INDEX idx_occasion_members_member_id ON occasion_members (member_id);

-- Documents indexes
CREATE INDEX idx_documents_org_archived ON documents (organization_id, archived_at);
CREATE INDEX idx_documents_org_status ON documents (organization_id, status);
CREATE INDEX idx_documents_org_category ON documents (organization_id, category_id);
CREATE INDEX idx_documents_org_occasion ON documents (organization_id, occasion_id);
CREATE INDEX idx_documents_org_owner_group ON documents (organization_id, owner_group_id);
CREATE INDEX idx_documents_org_doc_date ON documents (organization_id, document_date);
CREATE INDEX idx_documents_org_expires_at ON documents (organization_id, expires_at);
CREATE INDEX idx_documents_created_by ON documents (created_by);

-- Document Versions indexes
CREATE INDEX idx_document_versions_org_doc ON document_versions (organization_id, document_id);
CREATE INDEX idx_document_versions_uploaded_by ON document_versions (uploaded_by);

-- Resource Access indexes
CREATE INDEX idx_doc_user_access_lookup ON document_user_access (user_id, document_id);
CREATE INDEX idx_doc_group_access_lookup ON document_group_access (group_id, document_id);
CREATE INDEX idx_doc_role_access_lookup ON document_role_access (role_id, document_id);

-- Activity Logs indexes
CREATE INDEX idx_activity_logs_org_created ON activity_logs (organization_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs (entity_type, entity_id);
CREATE INDEX idx_activity_logs_user_created ON activity_logs (user_id, created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);


-- ==============================================================================
-- 2. AUTOMATIC UPDATED_AT TRIGGERS
-- ==============================================================================

CREATE TRIGGER trg_set_updated_at_organizations
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_members
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_roles
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_groups
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_occasion_types
  BEFORE UPDATE ON occasion_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_occasions
  BEFORE UPDATE ON occasions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_document_categories
  BEFORE UPDATE ON document_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ==============================================================================
-- 3. ROW LEVEL SECURITY (SAFE-DENY STATE)
-- ==============================================================================
-- RLS is enabled across all sensitive tables without any permissive policies.
-- In accordance with Rule 42 & 43, all client access is denied until the formal
-- authorization helpers and RLS policies are implemented in Task 3.

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE occasion_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE occasion_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_role_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_group_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
