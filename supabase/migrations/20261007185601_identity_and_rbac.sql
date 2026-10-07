-- Migration: 20261007185601_identity_and_rbac.sql
-- Description: Members, Profiles, Roles, Permissions, User Roles, and Role Permissions

-- 1. Members Table (NGO organizational records, separate from portal users)
CREATE TABLE members (
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

-- Partial unique index for membership numbers per organization
CREATE UNIQUE INDEX idx_members_org_membership_no
  ON members (organization_id, membership_number)
  WHERE membership_number IS NOT NULL AND archived_at IS NULL;

-- 2. Profiles Table (Portal identities linked to auth.users)
CREATE TABLE profiles (
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
  -- Relational constraint: Profile can only link to a Member in the SAME organization
  CONSTRAINT fk_profiles_member_org
    FOREIGN KEY (organization_id, member_id)
    REFERENCES members(organization_id, id)
    ON DELETE SET NULL
);

-- Ensure a member record can link to at most one active portal account
CREATE UNIQUE INDEX idx_profiles_unique_member
  ON profiles (member_id)
  WHERE member_id IS NOT NULL;

-- 3. Roles Table (Organization-scoped portal roles)
CREATE TABLE roles (
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

-- 4. Permissions Table (Global system catalog)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. User Roles (Assigning roles to portal users)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id),
  -- Relational constraint: User profile and Role must belong to the SAME organization
  CONSTRAINT fk_user_roles_profile_org
    FOREIGN KEY (organization_id, user_id)
    REFERENCES profiles(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role_org
    FOREIGN KEY (organization_id, role_id)
    REFERENCES roles(organization_id, id)
    ON DELETE CASCADE
);

-- 6. Role Permissions (Mapping permissions to roles)
CREATE TABLE role_permissions (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id),
  -- Relational constraint: Role must belong to the designated organization
  CONSTRAINT fk_role_permissions_role_org
    FOREIGN KEY (organization_id, role_id)
    REFERENCES roles(organization_id, id)
    ON DELETE CASCADE
);

-- 7. Seed Global Permission Catalog (Stable machine-readable identifiers)
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
