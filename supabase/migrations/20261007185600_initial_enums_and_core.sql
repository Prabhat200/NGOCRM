-- Migration: 20261007185600_initial_enums_and_core.sql
-- Description: Core extensions, updated_at trigger, enums, and organizations table

-- 1. Enable required extensions safely
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Generic updated_at trigger function
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

-- 3. Core PostgreSQL Enums

CREATE TYPE profile_status AS ENUM (
  'invited',
  'active',
  'suspended',
  'disabled'
);

CREATE TYPE member_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'former'
);

CREATE TYPE group_type AS ENUM (
  'committee',
  'department',
  'team',
  'custom'
);

CREATE TYPE occasion_status AS ENUM (
  'planned',
  'ongoing',
  'completed',
  'cancelled',
  'archived'
);

CREATE TYPE document_status AS ENUM (
  'draft',
  'under_review',
  'changes_requested',
  'approved',
  'final',
  'superseded',
  'archived'
);

CREATE TYPE document_access_mode AS ENUM (
  'organization',
  'restricted',
  'private'
);

CREATE TYPE document_confidentiality AS ENUM (
  'general',
  'internal',
  'confidential',
  'restricted'
);

CREATE TYPE access_level AS ENUM (
  'view',
  'edit',
  'manage'
);

-- 4. Organizations Table
CREATE TABLE organizations (
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for composite foreign key references across all child tables
ALTER TABLE organizations ADD CONSTRAINT uq_organizations_id UNIQUE (id);
