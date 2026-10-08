-- Migration: 20261008140000_canonical_people_and_personnel.sql
-- Description: Phase 2 Task 11 - Canonical People Model, Employment Records, Personnel Files, and Account Provisioning Foundation

-- ==============================================================================
-- 1. ENUMS & DOMAINS
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'person_status') THEN
    CREATE TYPE person_status AS ENUM (
      'active',
      'inactive',
      'former',
      'deceased',
      'archived'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_status') THEN
    CREATE TYPE employment_status AS ENUM (
      'active',
      'probation',
      'on_leave',
      'suspended',
      'ended'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_type') THEN
    CREATE TYPE employment_type AS ENUM (
      'permanent',
      'full_time',
      'part_time',
      'contract',
      'temporary',
      'intern',
      'consultant'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'personnel_file_sensitivity') THEN
    CREATE TYPE personnel_file_sensitivity AS ENUM (
      'normal',
      'private',
      'highly_restricted'
    );
  END IF;
END $$;


-- ==============================================================================
-- 2. CANONICAL PEOPLE TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  primary_email TEXT,
  secondary_email TEXT,
  primary_phone TEXT,
  secondary_phone TEXT,
  address TEXT,
  photo_path TEXT,
  status person_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_people_org_id UNIQUE (organization_id, id)
);

CREATE INDEX IF NOT EXISTS idx_people_org_archived ON people(organization_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_people_org_last_name ON people(organization_id, last_name);
CREATE INDEX IF NOT EXISTS idx_people_primary_email ON people(primary_email);


-- ==============================================================================
-- 3. LINK EXISTING MEMBERS TO CANONICAL PEOPLE (DATA MIGRATION)
-- ==============================================================================

-- Add person_id to members if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'person_id'
  ) THEN
    ALTER TABLE members ADD COLUMN person_id UUID;
  END IF;
END $$;

-- Populate canonical people for any members missing a person_id
INSERT INTO people (
  organization_id,
  first_name,
  middle_name,
  last_name,
  primary_email,
  primary_phone,
  address,
  status,
  created_by,
  updated_by,
  created_at,
  updated_at,
  archived_at
)
SELECT
  m.organization_id,
  m.first_name,
  m.middle_name,
  m.last_name,
  m.email,
  m.phone,
  m.address,
  CASE
    WHEN m.archived_at IS NOT NULL THEN 'archived'::person_status
    WHEN m.status = 'active' THEN 'active'::person_status
    ELSE 'inactive'::person_status
  END,
  m.created_by,
  m.updated_by,
  m.created_at,
  m.updated_at,
  m.archived_at
FROM members m
WHERE m.person_id IS NULL;

-- Link members to their migrated person record
UPDATE members m
SET person_id = p.id
FROM people p
WHERE m.person_id IS NULL
  AND m.organization_id = p.organization_id
  AND m.first_name = p.first_name
  AND m.last_name = p.last_name
  AND (m.email IS NULL OR m.email = p.primary_email);

-- Add relational constraint between members and people
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_members_person_org'
  ) THEN
    ALTER TABLE members
      ADD CONSTRAINT fk_members_person_org
      FOREIGN KEY (organization_id, person_id)
      REFERENCES people(organization_id, id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_members_person_id ON members(person_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_org_person ON members(organization_id, person_id)
  WHERE person_id IS NOT NULL;


-- ==============================================================================
-- 4. LINK PROFILES TO CANONICAL PEOPLE (DATA MIGRATION)
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'person_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN person_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE profiles ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- 4a. For profiles linked to existing members, link to corresponding person_id
UPDATE profiles p
SET person_id = m.person_id
FROM members m
WHERE p.member_id = m.id
  AND p.person_id IS NULL
  AND m.person_id IS NOT NULL;

-- 4b. For profiles with NO member_id (e.g. administrative staff who are not members),
-- create a canonical person identity so every portal account belongs to a human record
DO $$
DECLARE
  v_prof RECORD;
  v_new_person_id UUID;
  v_first TEXT;
  v_last TEXT;
BEGIN
  FOR v_prof IN
    SELECT p.id, p.organization_id, p.display_name, p.phone, p.avatar_url, p.created_at, u.email
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.person_id IS NULL
  LOOP
    v_first := COALESCE(SPLIT_PART(TRIM(v_prof.display_name), ' ', 1), 'Staff');
    v_last := NULLIF(SUBSTRING(TRIM(v_prof.display_name) FROM LENGTH(v_first) + 2), '');
    IF v_last IS NULL OR v_last = '' THEN
      v_last := 'Member';
    END IF;

    INSERT INTO people (
      organization_id,
      first_name,
      last_name,
      preferred_name,
      primary_email,
      primary_phone,
      photo_path,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_prof.organization_id,
      v_first,
      v_last,
      v_prof.display_name,
      v_prof.email,
      v_prof.phone,
      v_prof.avatar_url,
      'active',
      v_prof.created_at,
      v_prof.created_at
    )
    RETURNING id INTO v_new_person_id;

    UPDATE profiles
    SET person_id = v_new_person_id
    WHERE id = v_prof.id;
  END LOOP;
END $$;

-- Foreign key and unique constraint: One person -> at most one portal profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_profiles_person_org'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT fk_profiles_person_org
      FOREIGN KEY (organization_id, person_id)
      REFERENCES people(organization_id, id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_person
  ON profiles (person_id)
  WHERE person_id IS NOT NULL;


-- ==============================================================================
-- 5. EMPLOYMENT RECORDS TABLE (Historical & Current Employment)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS employment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  person_id UUID NOT NULL,
  employee_number TEXT,
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  designation TEXT NOT NULL,
  department_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  supervisor_person_id UUID,
  work_location TEXT,
  started_at DATE NOT NULL,
  probation_ends_at DATE,
  ended_at DATE,
  status employment_status NOT NULL DEFAULT 'active',
  termination_reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_employment_org_id UNIQUE (organization_id, id),
  CONSTRAINT fk_employment_person_org
    FOREIGN KEY (organization_id, person_id)
    REFERENCES people(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_employment_supervisor_org
    FOREIGN KEY (organization_id, supervisor_person_id)
    REFERENCES people(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT chk_no_self_supervision
    CHECK (supervisor_person_id IS NULL OR supervisor_person_id <> person_id),
  CONSTRAINT chk_employment_dates
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employment_org_employee_number
  ON employment_records (organization_id, employee_number)
  WHERE employee_number IS NOT NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employment_person_status
  ON employment_records (person_id, status);

CREATE INDEX IF NOT EXISTS idx_employment_department
  ON employment_records (department_group_id);


-- ==============================================================================
-- 6. PERSON RELATIONSHIPS (Volunteers, Consultants, Advisors, Contractors)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS person_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  person_id UUID NOT NULL,
  relationship_type TEXT NOT NULL,
  title TEXT,
  started_at DATE,
  ended_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_relationships_person_org
    FOREIGN KEY (organization_id, person_id)
    REFERENCES people(organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_person_relationships_person
  ON person_relationships (person_id, is_active);


-- ==============================================================================
-- 7. EMERGENCY CONTACTS (Private Personnel Information)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS person_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  person_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  secondary_phone TEXT,
  email TEXT,
  address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_emergency_contacts_person_org
    FOREIGN KEY (organization_id, person_id)
    REFERENCES people(organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_person
  ON person_emergency_contacts (person_id);


-- ==============================================================================
-- 8. PERSONNEL FILE CATEGORIES & SENSITIVITY CLASSIFICATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS personnel_file_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sensitivity_level personnel_file_sensitivity NOT NULL DEFAULT 'normal',
  is_system_category BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_personnel_cat_org_slug UNIQUE (organization_id, slug),
  CONSTRAINT uq_personnel_cat_org_id UNIQUE (organization_id, id)
);

-- Seed default standard categories across all organizations
INSERT INTO personnel_file_categories (organization_id, name, slug, description, sensitivity_level, is_system_category)
SELECT
  o.id,
  c.name,
  c.slug,
  c.description,
  c.sensitivity_level::personnel_file_sensitivity,
  TRUE
FROM organizations o
CROSS JOIN (
  VALUES
    ('Profile Photo', 'profile-photo', 'Official portrait or identification image', 'normal'),
    ('CV / Resume', 'cv-resume', 'Curriculum vitae and professional summary', 'normal'),
    ('Employment Contract', 'employment-contract', 'Signed employment contract and agreements', 'private'),
    ('Appointment Letter', 'appointment-letter', 'Official organizational appointment letter', 'private'),
    ('Citizenship / National ID', 'national-id', 'Government national identification document', 'highly_restricted'),
    ('Passport', 'passport', 'Official international passport travel document', 'highly_restricted'),
    ('Tax / PAN Document', 'tax-pan', 'Tax registration or PAN card document', 'highly_restricted'),
    ('Academic Certificate', 'academic-certificate', 'University and academic degree credentials', 'normal'),
    ('Training Certificate', 'training-certificate', 'Professional certifications and course records', 'normal'),
    ('Experience Letter', 'experience-letter', 'Past employer recommendation and service letters', 'normal'),
    ('Performance Record', 'performance-record', 'Annual evaluations and appraisals', 'private'),
    ('Disciplinary Record', 'disciplinary-record', 'Confidential compliance or grievance documentation', 'highly_restricted'),
    ('Leave / Employment Record', 'leave-record', 'Formal leave authorization or attendance record', 'private'),
    ('Exit Document', 'exit-document', 'Resignation, handover, or clearance forms', 'private'),
    ('Other', 'other', 'General unclassified personnel file', 'normal')
) AS c(name, slug, description, sensitivity_level)
ON CONFLICT (organization_id, slug) DO NOTHING;


-- ==============================================================================
-- 9. PERSONNEL FILES & IMMUTABLE VERSIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS personnel_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  person_id UUID NOT NULL,
  category_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_date DATE,
  expires_at DATE,
  sensitivity_level personnel_file_sensitivity NOT NULL DEFAULT 'normal',
  current_version_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_personnel_files_org_id UNIQUE (organization_id, id),
  CONSTRAINT fk_personnel_files_person_org
    FOREIGN KEY (organization_id, person_id)
    REFERENCES people(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_personnel_files_category_org
    FOREIGN KEY (organization_id, category_id)
    REFERENCES personnel_file_categories(organization_id, id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_personnel_files_person ON personnel_files(person_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_personnel_files_category ON personnel_files(category_id);

CREATE TABLE IF NOT EXISTS personnel_file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  personnel_file_id UUID NOT NULL,
  version_number INT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'personnel-files',
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_extension TEXT,
  file_size BIGINT NOT NULL,
  checksum TEXT,
  change_note TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invalidated_at TIMESTAMPTZ,
  invalidated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invalidation_reason TEXT,
  CONSTRAINT uq_personnel_versions_org_id UNIQUE (organization_id, id),
  CONSTRAINT uq_personnel_file_version UNIQUE (personnel_file_id, version_number),
  CONSTRAINT fk_personnel_versions_file_org
    FOREIGN KEY (organization_id, personnel_file_id)
    REFERENCES personnel_files(organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_personnel_versions_file ON personnel_file_versions(personnel_file_id, version_number);


-- ==============================================================================
-- 10. PERSONNEL NOTES & COMPENSATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS person_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  person_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT,
  content TEXT NOT NULL,
  visibility_level TEXT NOT NULL DEFAULT 'hr',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT fk_person_notes_person_org
    FOREIGN KEY (organization_id, person_id)
    REFERENCES people(organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_person_notes_person ON person_notes(person_id, archived_at);

CREATE TABLE IF NOT EXISTS employment_compensation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  employment_record_id UUID NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NPR',
  pay_frequency TEXT NOT NULL DEFAULT 'monthly',
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_compensation_employment_org
    FOREIGN KEY (organization_id, employment_record_id)
    REFERENCES employment_records(organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compensation_employment ON employment_compensation(employment_record_id);


-- ==============================================================================
-- 11. CONFIGURE PRIVATE STORAGE BUCKETS
-- ==============================================================================

-- 11a. 'personnel-files' private bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'personnel-files',
  'personnel-files',
  FALSE,
  52428800, -- 50 MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 11b. 'people-media' private bucket for official employee/staff portraits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'people-media',
  'people-media',
  FALSE,
  10485760, -- 10 MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ==============================================================================
-- 12. PERMISSION CATALOG & HR ADMIN ROLE SETUP
-- ==============================================================================

INSERT INTO permissions (code, description) VALUES
  ('people.view_directory', 'View public organizational people directory'),
  ('people.view_private', 'View confidential personal details, emergency contacts, and private profile data'),
  ('people.create', 'Create new person identities'),
  ('people.edit', 'Update person details and identity records'),
  ('people.archive', 'Archive person records'),
  ('employment.view', 'View employment records and job history'),
  ('employment.manage', 'Create and update employment records, designations, and status'),
  ('personnel_files.view', 'View personnel files list and metadata'),
  ('personnel_files.upload', 'Upload personnel files and new versions'),
  ('personnel_files.download', 'Download confidential personnel documents from storage'),
  ('personnel_files.manage', 'Manage personnel file categories and document lifecycle'),
  ('personnel_notes.view', 'View confidential personnel and HR notes'),
  ('personnel_notes.manage', 'Create and manage personnel and HR notes'),
  ('portal_users.provision', 'Provision portal accounts directly with temporary passwords'),
  ('portal_users.invite', 'Send portal invitation links to people'),
  ('portal_users.reset_password', 'Trigger password resets or issue temporary credentials'),
  ('portal_users.manage', 'Manage portal account security, status, and role assignments')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

-- Create built-in HR Admin role for all organizations
INSERT INTO roles (organization_id, name, slug, description, is_system_role)
SELECT
  o.id,
  'HR Admin',
  'hr_admin',
  'Human Resources and Personnel Administrator with governance over people, employment, and personnel files',
  TRUE
FROM organizations o
ON CONFLICT (organization_id, slug) DO NOTHING;

-- Grant HR Admin permissions
INSERT INTO role_permissions (organization_id, role_id, permission_id)
SELECT
  r.organization_id,
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'hr_admin'
  AND p.code IN (
    'people.view_directory',
    'people.view_private',
    'people.create',
    'people.edit',
    'people.archive',
    'employment.view',
    'employment.manage',
    'personnel_files.view',
    'personnel_files.upload',
    'personnel_files.download',
    'personnel_files.manage',
    'personnel_notes.view',
    'personnel_notes.manage',
    'portal_users.invite',
    'portal_users.provision',
    'portal_users.reset_password',
    'portal_users.manage'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- ==============================================================================
-- 13. CONTEXT & AUTHORIZATION HELPER FUNCTIONS
-- ==============================================================================

-- Returns person_id linked to the current user profile (if any)
CREATE OR REPLACE FUNCTION current_person_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT person_id FROM profiles
  WHERE id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- Evaluates if caller can view a person's private personnel data
CREATE OR REPLACE FUNCTION can_view_person_private(p_person_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_active_user() THEN
    RETURN FALSE;
  END IF;

  -- Caller is the person themselves (self-access to private profile)
  IF current_person_id() = p_person_id THEN
    RETURN TRUE;
  END IF;

  -- Super admin or HR admin with people.view_private
  IF has_permission('people.view_private') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Evaluates if caller can view a personnel file
CREATE OR REPLACE FUNCTION can_view_personnel_file(p_file_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_file RECORD;
BEGIN
  IF NOT is_active_user() THEN
    RETURN FALSE;
  END IF;

  SELECT pf.* INTO v_file
  FROM personnel_files pf
  WHERE pf.id = p_file_id;

  IF NOT FOUND OR v_file.organization_id <> current_organization_id() THEN
    RETURN FALSE;
  END IF;

  IF v_file.archived_at IS NOT NULL AND NOT has_permission('personnel_files.manage') THEN
    RETURN FALSE;
  END IF;

  -- Highly restricted documents require specific personnel_files.manage permission
  IF v_file.sensitivity_level = 'highly_restricted' THEN
    RETURN has_permission('personnel_files.manage');
  END IF;

  -- Private and normal files require personnel_files.view
  RETURN has_permission('personnel_files.view');
END;
$$;


-- ==============================================================================
-- 14. ROW-LEVEL SECURITY POLICIES FOR NEW TABLES
-- ==============================================================================

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_file_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_compensation ENABLE ROW LEVEL SECURITY;

-- 14a. people
DROP POLICY IF EXISTS "people_select_authorized" ON people;
CREATE POLICY "people_select_authorized" ON people
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND is_active_user()
    AND (
      has_permission('people.view_directory')
      OR has_permission('people.view_private')
      OR has_permission('members.view')
    )
  );

DROP POLICY IF EXISTS "people_insert_authorized" ON people;
CREATE POLICY "people_insert_authorized" ON people
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('people.create')
  );

DROP POLICY IF EXISTS "people_update_authorized" ON people;
CREATE POLICY "people_update_authorized" ON people
  FOR UPDATE TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('people.edit') OR id = current_person_id())
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND (has_permission('people.edit') OR id = current_person_id())
  );

-- 14b. employment_records
DROP POLICY IF EXISTS "employment_records_select" ON employment_records;
CREATE POLICY "employment_records_select" ON employment_records
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND is_active_user()
    AND (
      has_permission('employment.view')
      OR person_id = current_person_id()
    )
  );

DROP POLICY IF EXISTS "employment_records_insert" ON employment_records;
CREATE POLICY "employment_records_insert" ON employment_records
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('employment.manage')
  );

DROP POLICY IF EXISTS "employment_records_update" ON employment_records;
CREATE POLICY "employment_records_update" ON employment_records
  FOR UPDATE TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('employment.manage')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('employment.manage')
  );

-- 14c. person_relationships
DROP POLICY IF EXISTS "person_relationships_select" ON person_relationships;
CREATE POLICY "person_relationships_select" ON person_relationships
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND is_active_user()
  );

DROP POLICY IF EXISTS "person_relationships_modify" ON person_relationships;
CREATE POLICY "person_relationships_modify" ON person_relationships
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('people.edit')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('people.edit')
  );

-- 14d. person_emergency_contacts (Confidential)
DROP POLICY IF EXISTS "emergency_contacts_select" ON person_emergency_contacts;
CREATE POLICY "emergency_contacts_select" ON person_emergency_contacts
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND can_view_person_private(person_id)
  );

DROP POLICY IF EXISTS "emergency_contacts_modify" ON person_emergency_contacts;
CREATE POLICY "emergency_contacts_modify" ON person_emergency_contacts
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('people.edit') OR person_id = current_person_id())
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND (has_permission('people.edit') OR person_id = current_person_id())
  );

-- 14e. personnel_file_categories
DROP POLICY IF EXISTS "personnel_categories_select" ON personnel_file_categories;
CREATE POLICY "personnel_categories_select" ON personnel_file_categories
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND is_active_user()
  );

-- 14f. personnel_files
DROP POLICY IF EXISTS "personnel_files_select" ON personnel_files;
CREATE POLICY "personnel_files_select" ON personnel_files
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND can_view_personnel_file(id)
  );

DROP POLICY IF EXISTS "personnel_files_insert" ON personnel_files;
CREATE POLICY "personnel_files_insert" ON personnel_files
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('personnel_files.upload')
  );

DROP POLICY IF EXISTS "personnel_files_update" ON personnel_files;
CREATE POLICY "personnel_files_update" ON personnel_files
  FOR UPDATE TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('personnel_files.manage')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('personnel_files.manage')
  );

-- 14g. personnel_file_versions
DROP POLICY IF EXISTS "personnel_versions_select" ON personnel_file_versions;
CREATE POLICY "personnel_versions_select" ON personnel_file_versions
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND can_view_personnel_file(personnel_file_id)
  );

DROP POLICY IF EXISTS "personnel_versions_insert" ON personnel_file_versions;
CREATE POLICY "personnel_versions_insert" ON personnel_file_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('personnel_files.upload')
  );

-- 14h. person_notes
DROP POLICY IF EXISTS "person_notes_select" ON person_notes;
CREATE POLICY "person_notes_select" ON person_notes
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND is_active_user()
    AND has_permission('personnel_notes.view')
  );

DROP POLICY IF EXISTS "person_notes_modify" ON person_notes;
CREATE POLICY "person_notes_modify" ON person_notes
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('personnel_notes.manage')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('personnel_notes.manage')
  );

-- 14i. employment_compensation
DROP POLICY IF EXISTS "compensation_select" ON employment_compensation;
CREATE POLICY "compensation_select" ON employment_compensation
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND is_active_user()
    AND has_permission('employment.manage')
  );

DROP POLICY IF EXISTS "compensation_modify" ON employment_compensation;
CREATE POLICY "compensation_modify" ON employment_compensation
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('employment.manage')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('employment.manage')
  );


-- ==============================================================================
-- 15. STORAGE RLS VALIDATORS & POLICIES
-- ==============================================================================

-- Validate read access for personnel-files bucket
CREATE OR REPLACE FUNCTION storage_can_read_personnel_file(p_object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_path_parts TEXT[];
  v_org_id UUID;
  v_person_id UUID;
  v_file_id UUID;
BEGIN
  -- Expected Path: {organization_id}/{person_id}/{personnel_file_id}/{version_id}/{filename}
  v_path_parts := string_to_array(p_object_name, '/');
  IF array_length(v_path_parts, 1) < 5 THEN
    RETURN FALSE;
  END IF;

  BEGIN
    v_org_id := v_path_parts[1]::uuid;
    v_person_id := v_path_parts[2]::uuid;
    v_file_id := v_path_parts[3]::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  IF v_org_id <> current_organization_id() THEN
    RETURN FALSE;
  END IF;

  IF NOT has_permission('personnel_files.download') THEN
    RETURN FALSE;
  END IF;

  RETURN can_view_personnel_file(v_file_id);
END;
$$;

-- Validate upload access for personnel-files bucket
CREATE OR REPLACE FUNCTION storage_can_upload_personnel_file(p_object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_path_parts TEXT[];
  v_org_id UUID;
  v_person_id UUID;
  v_file_id UUID;
BEGIN
  v_path_parts := string_to_array(p_object_name, '/');
  IF array_length(v_path_parts, 1) < 5 THEN
    RETURN FALSE;
  END IF;

  BEGIN
    v_org_id := v_path_parts[1]::uuid;
    v_person_id := v_path_parts[2]::uuid;
    v_file_id := v_path_parts[3]::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  IF v_org_id <> current_organization_id() THEN
    RETURN FALSE;
  END IF;

  IF NOT has_permission('personnel_files.upload') THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM personnel_files pf
    WHERE pf.id = v_file_id
      AND pf.organization_id = v_org_id
      AND pf.person_id = v_person_id
  );
END;
$$;

-- Storage policies for 'personnel-files'
DROP POLICY IF EXISTS "storage_personnel_files_select" ON storage.objects;
CREATE POLICY "storage_personnel_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'personnel-files'
    AND storage_can_read_personnel_file(name)
  );

DROP POLICY IF EXISTS "storage_personnel_files_insert" ON storage.objects;
CREATE POLICY "storage_personnel_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'personnel-files'
    AND storage_can_upload_personnel_file(name)
  );

-- Validate read access for people-media bucket
CREATE OR REPLACE FUNCTION storage_can_read_people_media(p_object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_path_parts TEXT[];
  v_org_id UUID;
BEGIN
  -- Expected Path: {organization_id}/{person_id}/profile/{filename}
  v_path_parts := string_to_array(p_object_name, '/');
  IF array_length(v_path_parts, 1) < 4 THEN
    RETURN FALSE;
  END IF;

  BEGIN
    v_org_id := v_path_parts[1]::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  IF v_org_id <> current_organization_id() THEN
    RETURN FALSE;
  END IF;

  RETURN is_active_user();
END;
$$;

-- Validate write access for people-media bucket
CREATE OR REPLACE FUNCTION storage_can_upload_people_media(p_object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_path_parts TEXT[];
  v_org_id UUID;
  v_person_id UUID;
BEGIN
  v_path_parts := string_to_array(p_object_name, '/');
  IF array_length(v_path_parts, 1) < 4 THEN
    RETURN FALSE;
  END IF;

  BEGIN
    v_org_id := v_path_parts[1]::uuid;
    v_person_id := v_path_parts[2]::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  IF v_org_id <> current_organization_id() THEN
    RETURN FALSE;
  END IF;

  -- User can upload their own profile photo or admin with people.edit
  IF current_person_id() = v_person_id THEN
    RETURN TRUE;
  END IF;

  RETURN has_permission('people.edit');
END;
$$;

-- Storage policies for 'people-media'
DROP POLICY IF EXISTS "storage_people_media_select" ON storage.objects;
CREATE POLICY "storage_people_media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'people-media'
    AND storage_can_read_people_media(name)
  );

DROP POLICY IF EXISTS "storage_people_media_insert" ON storage.objects;
CREATE POLICY "storage_people_media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'people-media'
    AND storage_can_upload_people_media(name)
  );

DROP POLICY IF EXISTS "storage_people_media_update" ON storage.objects;
CREATE POLICY "storage_people_media_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'people-media'
    AND storage_can_upload_people_media(name)
  )
  WITH CHECK (
    bucket_id = 'people-media'
    AND storage_can_upload_people_media(name)
  );

DROP POLICY IF EXISTS "storage_people_media_delete" ON storage.objects;
CREATE POLICY "storage_people_media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'people-media'
    AND storage_can_upload_people_media(name)
  );


-- ==============================================================================
-- 16. AUDIT & LIFECYCLE RPCs
-- ==============================================================================

-- 16a. Log personnel file download (Rule 41)
CREATE OR REPLACE FUNCTION log_personnel_file_download(
  p_personnel_file_id UUID,
  p_version_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_org_id UUID;
  v_file RECORD;
  v_ver RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_org_id := current_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Active organization context required';
  END IF;

  SELECT * INTO v_file
  FROM personnel_files
  WHERE id = p_personnel_file_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personnel file not found';
  END IF;

  IF p_version_id IS NOT NULL THEN
    SELECT * INTO v_ver
    FROM personnel_file_versions
    WHERE id = p_version_id AND personnel_file_id = p_personnel_file_id;
  END IF;

  INSERT INTO activity_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_org_id,
    v_uid,
    'personnel_file.downloaded',
    'personnel_file',
    p_personnel_file_id,
    jsonb_build_object(
      'file_title', v_file.title,
      'person_id', v_file.person_id,
      'version_id', p_version_id,
      'version_number', v_ver.version_number,
      'original_filename', v_ver.original_filename
    )
  );

  RETURN TRUE;
END;
$$;

-- 16b. Forced first-login password change completion (Rule 47, 48)
CREATE OR REPLACE FUNCTION complete_first_login_password_change()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_org_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE profiles
  SET
    must_change_password = FALSE,
    updated_at = NOW()
  WHERE id = v_uid
  RETURNING organization_id INTO v_org_id;

  INSERT INTO activity_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_org_id,
    v_uid,
    'portal_user.password_changed',
    'user',
    v_uid,
    jsonb_build_object('event', 'first_login_password_set')
  );

  RETURN TRUE;
END;
$$;


-- ==============================================================================
-- 17. UPDATE AUTH CONTEXT BOOTSTRAP TO RETURN CANONICAL PERSON & PASSWORD FLAG
-- ==============================================================================

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
  v_person_json JSONB := NULL;
  v_member_json JSONB := NULL;
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

  -- 2. Load linked canonical person (if any)
  IF v_profile.person_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', p.id,
      'first_name', p.first_name,
      'middle_name', p.middle_name,
      'last_name', p.last_name,
      'preferred_name', p.preferred_name,
      'full_name', TRIM(CONCAT(p.first_name, ' ', COALESCE(p.middle_name, ''), ' ', p.last_name)),
      'primary_email', p.primary_email,
      'primary_phone', p.primary_phone,
      'photo_path', p.photo_path,
      'status', p.status
    )
    INTO v_person_json
    FROM people p
    WHERE p.id = v_profile.person_id;
  END IF;

  -- 3. Load linked member (if any)
  IF v_profile.member_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', m.id,
      'person_id', m.person_id,
      'membership_number', m.membership_number,
      'first_name', m.first_name,
      'middle_name', m.middle_name,
      'last_name', m.last_name,
      'full_name', TRIM(CONCAT(m.first_name, ' ', COALESCE(m.middle_name, ''), ' ', m.last_name)),
      'position_title', m.position_title,
      'status', m.status
    )
    INTO v_member_json
    FROM members m
    WHERE m.id = v_profile.member_id;
  ELSIF v_profile.person_id IS NOT NULL THEN
    -- Fallback: resolve membership by person_id if member_id was not explicitly set on profile
    SELECT jsonb_build_object(
      'id', m.id,
      'person_id', m.person_id,
      'membership_number', m.membership_number,
      'first_name', m.first_name,
      'middle_name', m.middle_name,
      'last_name', m.last_name,
      'full_name', TRIM(CONCAT(m.first_name, ' ', COALESCE(m.middle_name, ''), ' ', m.last_name)),
      'position_title', m.position_title,
      'status', m.status
    )
    INTO v_member_json
    FROM members m
    WHERE m.person_id = v_profile.person_id
    LIMIT 1;
  END IF;

  -- 4. Load organization
  SELECT o.id, o.name, o.short_name, o.logo_url, o.timezone
  INTO v_org
  FROM organizations o
  WHERE o.id = v_profile.organization_id;

  -- 5. Load roles
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

  -- 6. Load effective permissions
  v_permissions := get_my_permissions();

  RETURN jsonb_build_object(
    'authenticated', true,
    'has_profile', true,
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'organization_id', v_profile.organization_id,
      'person_id', v_profile.person_id,
      'member_id', v_profile.member_id,
      'display_name', v_profile.display_name,
      'avatar_url', v_profile.avatar_url,
      'phone', v_profile.phone,
      'status', v_profile.status,
      'must_change_password', v_profile.must_change_password,
      'last_active_at', v_profile.last_active_at
    ),
    'person', v_person_json,
    'member', v_member_json,
    'organization', CASE WHEN v_org.id IS NOT NULL THEN jsonb_build_object(
      'id', v_org.id,
      'name', v_org.name,
      'short_name', v_org.short_name,
      'logo_url', v_org.logo_url,
      'timezone', v_org.timezone
    ) ELSE NULL END,
    'roles', v_roles,
    'permissions', to_jsonb(v_permissions)
  );
END;
$$;
