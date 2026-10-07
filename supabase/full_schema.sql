-- ==============================================================================
-- NGO PORTAL - COMPLETE CORE SCHEMA & SEED SCRIPT (TASK 2)
-- Run this script directly in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/erqvcmrzdeozbenhecqp/sql/new
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. EXTENSIONS & CORE FUNCTIONS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 2. ENUMS
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE profile_status AS ENUM ('invited', 'active', 'suspended', 'disabled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('active', 'inactive', 'suspended', 'former');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE group_type AS ENUM ('committee', 'department', 'team', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE occasion_status AS ENUM ('planned', 'ongoing', 'completed', 'cancelled', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('draft', 'under_review', 'changes_requested', 'approved', 'final', 'superseded', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE document_access_mode AS ENUM ('organization', 'restricted', 'private');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE document_confidentiality AS ENUM ('general', 'internal', 'confidential', 'restricted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE access_level AS ENUM ('view', 'edit', 'manage');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 3. ORGANIZATIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  registration_no TEXT,
  website TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kathmandu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_organizations_id UNIQUE (id)
);

-- ==============================================================================
-- 4. MEMBERS & PROFILES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  membership_number TEXT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  position_title TEXT,
  joined_at DATE,
  left_at DATE,
  status member_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_members_org_id UNIQUE (organization_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_org_membership_no
  ON members (organization_id, membership_number)
  WHERE membership_number IS NOT NULL AND archived_at IS NULL;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  member_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  status profile_status NOT NULL DEFAULT 'invited',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_profiles_org_id UNIQUE (organization_id, id),
  CONSTRAINT fk_profiles_member_org
    FOREIGN KEY (organization_id, member_id)
    REFERENCES members(organization_id, id)
    ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_member
  ON profiles (member_id)
  WHERE member_id IS NOT NULL;

-- ==============================================================================
-- 5. ROLES & PERMISSIONS (RBAC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_roles_org_slug UNIQUE (organization_id, slug),
  CONSTRAINT uq_roles_org_id UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id),
  CONSTRAINT fk_user_roles_profile_org
    FOREIGN KEY (organization_id, user_id)
    REFERENCES profiles(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role_org
    FOREIGN KEY (organization_id, role_id)
    REFERENCES roles(organization_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS role_permissions (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role_org
    FOREIGN KEY (organization_id, role_id)
    REFERENCES roles(organization_id, id)
    ON DELETE CASCADE
);

-- ==============================================================================
-- 6. GROUPS & OCCASIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  type group_type NOT NULL DEFAULT 'committee',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_groups_org_name UNIQUE (organization_id, name),
  CONSTRAINT uq_groups_org_id UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  group_id UUID NOT NULL,
  member_id UUID NOT NULL,
  role_in_group TEXT,
  joined_at DATE,
  left_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_group_members_group_member UNIQUE (group_id, member_id),
  CONSTRAINT fk_group_members_group_org
    FOREIGN KEY (organization_id, group_id)
    REFERENCES groups(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_group_members_member_org
    FOREIGN KEY (organization_id, member_id)
    REFERENCES members(organization_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS occasion_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_occasion_types_org_name UNIQUE (organization_id, name),
  CONSTRAINT uq_occasion_types_org_id UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  occasion_type_id UUID,
  start_date DATE,
  end_date DATE,
  location TEXT,
  status occasion_status NOT NULL DEFAULT 'planned',
  fiscal_year TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT chk_occasions_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT uq_occasions_org_id UNIQUE (organization_id, id),
  CONSTRAINT fk_occasions_type_org
    FOREIGN KEY (organization_id, occasion_type_id)
    REFERENCES occasion_types(organization_id, id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS occasion_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  occasion_id UUID NOT NULL,
  member_id UUID NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_occasion_members_pair UNIQUE (occasion_id, member_id),
  CONSTRAINT fk_occasion_members_occasion_org
    FOREIGN KEY (organization_id, occasion_id)
    REFERENCES occasions(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_occasion_members_member_org
    FOREIGN KEY (organization_id, member_id)
    REFERENCES members(organization_id, id)
    ON DELETE CASCADE
);

-- ==============================================================================
-- 7. DOCUMENTS & VERSIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_document_categories_org_name UNIQUE (organization_id, name),
  CONSTRAINT uq_document_categories_org_id UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  document_number TEXT,
  category_id UUID,
  occasion_id UUID,
  owner_group_id UUID,
  document_date DATE,
  fiscal_year TEXT,
  status document_status NOT NULL DEFAULT 'draft',
  access_mode document_access_mode NOT NULL DEFAULT 'restricted',
  confidentiality document_confidentiality NOT NULL DEFAULT 'internal',
  current_version_id UUID,
  expires_at DATE,
  superseded_by_document_id UUID,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_documents_org_id UNIQUE (organization_id, id),
  CONSTRAINT chk_documents_not_self_superseding
    CHECK (superseded_by_document_id IS NULL OR id <> superseded_by_document_id),
  CONSTRAINT fk_documents_category_org
    FOREIGN KEY (organization_id, category_id)
    REFERENCES document_categories(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_documents_occasion_org
    FOREIGN KEY (organization_id, occasion_id)
    REFERENCES occasions(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_documents_owner_group_org
    FOREIGN KEY (organization_id, owner_group_id)
    REFERENCES groups(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_documents_superseded_by_org
    FOREIGN KEY (organization_id, superseded_by_document_id)
    REFERENCES documents(organization_id, id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  document_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'ngo-documents',
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_extension TEXT,
  mime_type TEXT,
  file_size BIGINT,
  checksum TEXT,
  change_note TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invalidated_at TIMESTAMPTZ,
  invalidated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invalidation_reason TEXT,
  CONSTRAINT chk_document_versions_version_number CHECK (version_number > 0),
  CONSTRAINT uq_document_versions_doc_ver UNIQUE (document_id, version_number),
  CONSTRAINT uq_document_versions_storage_path UNIQUE (storage_bucket, storage_path),
  CONSTRAINT uq_document_versions_org_id UNIQUE (organization_id, id),
  CONSTRAINT uq_document_versions_doc_id UNIQUE (document_id, id),
  CONSTRAINT fk_document_versions_document_org
    FOREIGN KEY (organization_id, document_id)
    REFERENCES documents(organization_id, id)
    ON DELETE CASCADE
);

DO $$ BEGIN
  ALTER TABLE documents
    ADD CONSTRAINT fk_documents_current_version
    FOREIGN KEY (id, current_version_id)
    REFERENCES document_versions(document_id, id)
    DEFERRABLE INITIALLY IMMEDIATE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 8. TAGS, ACCESS & FAVORITES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tags_org_name UNIQUE (organization_id, name),
  CONSTRAINT uq_tags_org_id UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS document_tags (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  document_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (document_id, tag_id),
  CONSTRAINT fk_document_tags_document_org
    FOREIGN KEY (organization_id, document_id)
    REFERENCES documents(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_document_tags_tag_org
    FOREIGN KEY (organization_id, tag_id)
    REFERENCES tags(organization_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_role_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  document_id UUID NOT NULL,
  role_id UUID NOT NULL,
  access_level access_level NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_document_role_access UNIQUE (document_id, role_id),
  CONSTRAINT fk_document_role_access_doc_org
    FOREIGN KEY (organization_id, document_id)
    REFERENCES documents(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_document_role_access_role_org
    FOREIGN KEY (organization_id, role_id)
    REFERENCES roles(organization_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_group_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  document_id UUID NOT NULL,
  group_id UUID NOT NULL,
  access_level access_level NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_document_group_access UNIQUE (document_id, group_id),
  CONSTRAINT fk_document_group_access_doc_org
    FOREIGN KEY (organization_id, document_id)
    REFERENCES documents(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_document_group_access_group_org
    FOREIGN KEY (organization_id, group_id)
    REFERENCES groups(organization_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  access_level access_level NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_document_user_access UNIQUE (document_id, user_id),
  CONSTRAINT fk_document_user_access_doc_org
    FOREIGN KEY (organization_id, document_id)
    REFERENCES documents(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_document_user_access_user_org
    FOREIGN KEY (organization_id, user_id)
    REFERENCES profiles(organization_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_favorites (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, document_id),
  CONSTRAINT fk_document_favorites_user_org
    FOREIGN KEY (organization_id, user_id)
    REFERENCES profiles(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_document_favorites_doc_org
    FOREIGN KEY (organization_id, document_id)
    REFERENCES documents(organization_id, id)
    ON DELETE CASCADE
);

-- ==============================================================================
-- 9. ACTIVITY LOGS & NOTIFICATIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  resource_type TEXT,
  resource_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  CONSTRAINT fk_notifications_user_org
    FOREIGN KEY (organization_id, user_id)
    REFERENCES profiles(organization_id, id)
    ON DELETE CASCADE
);

-- ==============================================================================
-- 10. PERFORMANCE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles (organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);

CREATE INDEX IF NOT EXISTS idx_members_org_status ON members (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_members_org_archived ON members (organization_id, archived_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_user ON user_roles (organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);

CREATE INDEX IF NOT EXISTS idx_groups_org_type ON groups (organization_id, type);
CREATE INDEX IF NOT EXISTS idx_groups_org_archived ON groups (organization_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_member_id ON group_members (member_id);

CREATE INDEX IF NOT EXISTS idx_occasions_org_status ON occasions (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_occasions_org_start_date ON occasions (organization_id, start_date);
CREATE INDEX IF NOT EXISTS idx_occasions_org_type_id ON occasions (organization_id, occasion_type_id);
CREATE INDEX IF NOT EXISTS idx_occasions_org_archived ON occasions (organization_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_occasion_members_member_id ON occasion_members (member_id);

CREATE INDEX IF NOT EXISTS idx_documents_org_archived ON documents (organization_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_documents_org_status ON documents (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_org_category ON documents (organization_id, category_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_occasion ON documents (organization_id, occasion_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_owner_group ON documents (organization_id, owner_group_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_doc_date ON documents (organization_id, document_date);
CREATE INDEX IF NOT EXISTS idx_documents_org_expires_at ON documents (organization_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents (created_by);

CREATE INDEX IF NOT EXISTS idx_document_versions_org_doc ON document_versions (organization_id, document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_uploaded_by ON document_versions (uploaded_by);

CREATE INDEX IF NOT EXISTS idx_doc_user_access_lookup ON document_user_access (user_id, document_id);
CREATE INDEX IF NOT EXISTS idx_doc_group_access_lookup ON document_group_access (group_id, document_id);
CREATE INDEX IF NOT EXISTS idx_doc_role_access_lookup ON document_role_access (role_id, document_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON activity_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);

-- ==============================================================================
-- 11. AUTOMATIC UPDATED_AT TRIGGERS
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_set_updated_at_organizations ON organizations;
CREATE TRIGGER trg_set_updated_at_organizations
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_members ON members;
CREATE TRIGGER trg_set_updated_at_members
  BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_profiles ON profiles;
CREATE TRIGGER trg_set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_roles ON roles;
CREATE TRIGGER trg_set_updated_at_roles
  BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_groups ON groups;
CREATE TRIGGER trg_set_updated_at_groups
  BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_occasion_types ON occasion_types;
CREATE TRIGGER trg_set_updated_at_occasion_types
  BEFORE UPDATE ON occasion_types FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_occasions ON occasions;
CREATE TRIGGER trg_set_updated_at_occasions
  BEFORE UPDATE ON occasions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_document_categories ON document_categories;
CREATE TRIGGER trg_set_updated_at_document_categories
  BEFORE UPDATE ON document_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_documents ON documents;
CREATE TRIGGER trg_set_updated_at_documents
  BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (SAFE-DENY STATE)
-- ==============================================================================

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

-- ==============================================================================
-- 13. SEED PERMISSIONS CATALOG (GLOBAL)
-- ==============================================================================

INSERT INTO permissions (code, description) VALUES
  ('documents.view', 'View non-restricted and authorized documents'),
  ('documents.create', 'Upload and create new documents'),
  ('documents.edit', 'Update document metadata'),
  ('documents.archive', 'Archive existing documents'),
  ('documents.restore', 'Restore archived documents'),
  ('documents.manage_access', 'Modify role, group, or user document access levels'),
  ('documents.upload_version', 'Upload subsequent document versions'),
  ('documents.download', 'Download document binary files from storage'),
  ('occasions.view', 'View organizational occasions and events'),
  ('occasions.create', 'Create new occasions and linked agendas'),
  ('occasions.edit', 'Update occasion details and participants'),
  ('occasions.archive', 'Archive occasions'),
  ('members.view', 'View organizational members list and profiles'),
  ('members.create', 'Add new organizational member records'),
  ('members.edit', 'Update member personal details and positions'),
  ('members.archive', 'Archive member records'),
  ('groups.view', 'View committees, departments, and groups'),
  ('groups.create', 'Create new organizational groups and committees'),
  ('groups.edit', 'Update group descriptions and settings'),
  ('groups.manage_members', 'Assign and remove members from groups'),
  ('users.view', 'View portal user accounts and their statuses'),
  ('users.invite', 'Invite new portal users to the organization'),
  ('users.disable', 'Suspend or disable portal user accounts'),
  ('users.manage_roles', 'Assign and revoke portal roles for users'),
  ('audit.view', 'View organizational activity and audit logs'),
  ('settings.view', 'View organization configuration and settings'),
  ('settings.manage', 'Manage organization taxonomies, categories, and settings')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

-- ==============================================================================
-- 14. SEED INITIAL DEVELOPMENT ORGANIZATION, ROLES & TAXONOMY
-- ==============================================================================

DO $$
DECLARE
  v_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_role_super_admin UUID;
  v_role_secretary_admin UUID;
  v_role_executive_member UUID;
  v_role_committee_head UUID;
  v_role_member UUID;
  v_role_viewer UUID;
BEGIN

  INSERT INTO organizations (id, name, short_name, email, timezone)
  VALUES (
    v_org_id,
    'Local Development NGO',
    'DevNGO',
    'contact@devngo.local',
    'Asia/Kathmandu'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    timezone = EXCLUDED.timezone;

  INSERT INTO roles (organization_id, name, slug, description, is_system_role)
  VALUES
    (v_org_id, 'Super Admin', 'super_admin', 'Full administrative authority over the portal and organization settings', TRUE),
    (v_org_id, 'Secretary Admin', 'secretary_admin', 'Organizational administration, document management, and member operations', TRUE),
    (v_org_id, 'Executive Member', 'executive_member', 'Executive committee member with document creation and review access', TRUE),
    (v_org_id, 'Committee Head', 'committee_head', 'Lead for specific committees, programs, and related documents', TRUE),
    (v_org_id, 'Member', 'member', 'General NGO member with read and download access to authorized records', TRUE),
    (v_org_id, 'Viewer', 'viewer', 'Read-only access to organization-wide published documents and occasions', TRUE)
  ON CONFLICT (organization_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

  SELECT id INTO v_role_super_admin FROM roles WHERE organization_id = v_org_id AND slug = 'super_admin';
  SELECT id INTO v_role_secretary_admin FROM roles WHERE organization_id = v_org_id AND slug = 'secretary_admin';
  SELECT id INTO v_role_executive_member FROM roles WHERE organization_id = v_org_id AND slug = 'executive_member';
  SELECT id INTO v_role_committee_head FROM roles WHERE organization_id = v_org_id AND slug = 'committee_head';
  SELECT id INTO v_role_member FROM roles WHERE organization_id = v_org_id AND slug = 'member';
  SELECT id INTO v_role_viewer FROM roles WHERE organization_id = v_org_id AND slug = 'viewer';

  -- Super Admin
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_super_admin, p.id FROM permissions p
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Secretary Admin
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_secretary_admin, p.id FROM permissions p
  WHERE p.code IN (
    'documents.view', 'documents.create', 'documents.edit', 'documents.archive',
    'documents.restore', 'documents.manage_access', 'documents.upload_version', 'documents.download',
    'occasions.view', 'occasions.create', 'occasions.edit', 'occasions.archive',
    'members.view', 'members.create', 'members.edit', 'members.archive',
    'groups.view', 'groups.create', 'groups.edit', 'groups.manage_members',
    'users.view', 'users.invite', 'users.disable', 'users.manage_roles',
    'audit.view', 'settings.view', 'settings.manage'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Executive Member
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_executive_member, p.id FROM permissions p
  WHERE p.code IN (
    'documents.view', 'documents.create', 'documents.edit', 'documents.upload_version', 'documents.download',
    'occasions.view', 'members.view', 'groups.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Committee Head
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_committee_head, p.id FROM permissions p
  WHERE p.code IN (
    'documents.view', 'documents.create', 'documents.edit', 'documents.upload_version', 'documents.download',
    'occasions.view', 'occasions.create', 'occasions.edit',
    'members.view', 'groups.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Member
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_member, p.id FROM permissions p
  WHERE p.code IN (
    'documents.view', 'documents.download', 'occasions.view', 'members.view', 'groups.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Viewer
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_viewer, p.id FROM permissions p
  WHERE p.code IN (
    'documents.view', 'documents.download', 'occasions.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Document Categories
  INSERT INTO document_categories (organization_id, name, description)
  VALUES
    (v_org_id, 'Meeting Minutes', 'Official records of executive, committee, and general assembly meetings'),
    (v_org_id, 'Proposal', 'Project, funding, and programmatic proposals'),
    (v_org_id, 'Financial', 'Audits, budget allocations, balance sheets, and expenditure reports'),
    (v_org_id, 'Agreement', 'MoUs, partnership contracts, and vendor agreements'),
    (v_org_id, 'Letter', 'Formal organizational correspondence, communications, and letters'),
    (v_org_id, 'Report', 'Annual, quarterly, and programmatic progress reports'),
    (v_org_id, 'Notice', 'Public notices, official dispatches, and circulars'),
    (v_org_id, 'Certificate', 'Registration certificates, tax exemptions, and accreditations'),
    (v_org_id, 'Policy', 'Constitutional guidelines, bylaws, HR policies, and code of conduct'),
    (v_org_id, 'Legal', 'Statutory documents, government filings, and compliance records'),
    (v_org_id, 'Attendance', 'Meeting attendance registers and participation records'),
    (v_org_id, 'Other', 'General miscellaneous organizational documents')
  ON CONFLICT (organization_id, name) DO NOTHING;

  -- Occasion Types
  INSERT INTO occasion_types (organization_id, name, description)
  VALUES
    (v_org_id, 'Meeting', 'Regular committee and departmental meetings'),
    (v_org_id, 'Annual General Meeting', 'Statutory Annual General Meeting (AGM) of the organization'),
    (v_org_id, 'Program', 'Field initiatives, outreach activities, and community programs'),
    (v_org_id, 'Training', 'Capacity building, workshops, and internal training sessions'),
    (v_org_id, 'Campaign', 'Advocacy campaigns and public awareness drives'),
    (v_org_id, 'Workshop', 'Consultation, planning, and strategy workshops'),
    (v_org_id, 'Election', 'General assembly and committee leadership elections'),
    (v_org_id, 'Audit', 'Internal and statutory annual financial audits'),
    (v_org_id, 'Visit', 'Stakeholder, donor, and monitoring visits'),
    (v_org_id, 'Other', 'Other organizational events and occasions')
  ON CONFLICT (organization_id, name) DO NOTHING;

END $$;

COMMIT;
