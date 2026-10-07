-- Migration: 20261007185602_organization_structure.sql
-- Description: Groups (committees/teams), Group Members, Occasion Types, Occasions, and Occasion Members

-- 1. Groups Table (Unified committee/department/team entity)
CREATE TABLE groups (
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

-- 2. Group Members Table (Group roster)
CREATE TABLE group_members (
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
  -- Relational constraint: Group and Member must belong to the SAME organization
  CONSTRAINT fk_group_members_group_org
    FOREIGN KEY (organization_id, group_id)
    REFERENCES groups(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_group_members_member_org
    FOREIGN KEY (organization_id, member_id)
    REFERENCES members(organization_id, id)
    ON DELETE CASCADE
);

-- 3. Occasion Types Table (Customizable event/activity categories)
CREATE TABLE occasion_types (
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

-- 4. Occasions Table (Organizational events, AGMs, meetings, programs)
CREATE TABLE occasions (
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
  -- Relational constraint: Occasion type must belong to the SAME organization
  CONSTRAINT fk_occasions_type_org
    FOREIGN KEY (organization_id, occasion_type_id)
    REFERENCES occasion_types(organization_id, id)
    ON DELETE SET NULL
);

-- 5. Occasion Members Table (Participants / Attendees)
CREATE TABLE occasion_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  occasion_id UUID NOT NULL,
  member_id UUID NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_occasion_members_pair UNIQUE (occasion_id, member_id),
  -- Relational constraint: Occasion and Member must belong to the SAME organization
  CONSTRAINT fk_occasion_members_occasion_org
    FOREIGN KEY (organization_id, occasion_id)
    REFERENCES occasions(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_occasion_members_member_org
    FOREIGN KEY (organization_id, member_id)
    REFERENCES members(organization_id, id)
    ON DELETE CASCADE
);
