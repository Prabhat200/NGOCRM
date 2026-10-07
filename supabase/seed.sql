-- Supabase Development Seed Data
-- Designed for local development and staging environments only.
-- All operations are idempotent.

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

  -- 1. Development Organization
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

  -- 2. Built-in Roles for Development Org
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

  -- Cache role IDs for permission mappings
  SELECT id INTO v_role_super_admin FROM roles WHERE organization_id = v_org_id AND slug = 'super_admin';
  SELECT id INTO v_role_secretary_admin FROM roles WHERE organization_id = v_org_id AND slug = 'secretary_admin';
  SELECT id INTO v_role_executive_member FROM roles WHERE organization_id = v_org_id AND slug = 'executive_member';
  SELECT id INTO v_role_committee_head FROM roles WHERE organization_id = v_org_id AND slug = 'committee_head';
  SELECT id INTO v_role_member FROM roles WHERE organization_id = v_org_id AND slug = 'member';
  SELECT id INTO v_role_viewer FROM roles WHERE organization_id = v_org_id AND slug = 'viewer';

  -- 3. Role Permissions Mapping for Development Org

  -- Super Admin: All permissions
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_super_admin, p.id
  FROM permissions p
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Secretary Admin: All document, occasion, member, group, user management, audit, and settings
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_secretary_admin, p.id
  FROM permissions p
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

  -- Executive Member: documents (view, create, edit, upload_version, download), occasions.view, members.view, groups.view
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_executive_member, p.id
  FROM permissions p
  WHERE p.code IN (
    'documents.view', 'documents.create', 'documents.edit', 'documents.upload_version', 'documents.download',
    'occasions.view', 'members.view', 'groups.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Committee Head: documents, occasions (view, create, edit), members.view, groups.view
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_committee_head, p.id
  FROM permissions p
  WHERE p.code IN (
    'documents.view', 'documents.create', 'documents.edit', 'documents.upload_version', 'documents.download',
    'occasions.view', 'occasions.create', 'occasions.edit',
    'members.view', 'groups.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Member: documents (view, download), occasions.view, members.view, groups.view
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_member, p.id
  FROM permissions p
  WHERE p.code IN (
    'documents.view', 'documents.download', 'occasions.view', 'members.view', 'groups.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Viewer: documents (view, download), occasions.view
  INSERT INTO role_permissions (organization_id, role_id, permission_id)
  SELECT v_org_id, v_role_viewer, p.id
  FROM permissions p
  WHERE p.code IN (
    'documents.view', 'documents.download', 'occasions.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- 4. Default Document Categories
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

  -- 5. Default Occasion Types
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
