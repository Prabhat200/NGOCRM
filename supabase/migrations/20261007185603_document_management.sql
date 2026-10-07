-- Migration: 20261007185603_document_management.sql
-- Description: Document Categories, Documents, Document Versions, Tags, Document Access, and Favorites

-- 1. Document Categories Table (Customizable taxonomy: Minutes, Proposals, Agreements, etc.)
CREATE TABLE document_categories (
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

-- 2. Documents Table (Logical organizational record)
CREATE TABLE documents (
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
  -- Document cannot be superseded by itself
  CONSTRAINT chk_documents_not_self_superseding
    CHECK (superseded_by_document_id IS NULL OR id <> superseded_by_document_id),
  -- Relational cross-organization guarantees
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

-- 3. Document Versions Table (Physical file instances)
CREATE TABLE document_versions (
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
  -- Relational constraint: Version belongs to document in the SAME organization
  CONSTRAINT fk_document_versions_document_org
    FOREIGN KEY (organization_id, document_id)
    REFERENCES documents(organization_id, id)
    ON DELETE CASCADE
);

-- 4. Circular current version integrity constraint
-- Enforces that documents.current_version_id MUST belong to that exact document (not Document B)
ALTER TABLE documents
  ADD CONSTRAINT fk_documents_current_version
  FOREIGN KEY (id, current_version_id)
  REFERENCES document_versions(document_id, id)
  DEFERRABLE INITIALLY IMMEDIATE;

-- 5. Tags Table (Organization-scoped taxonomies)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tags_org_name UNIQUE (organization_id, name),
  CONSTRAINT uq_tags_org_id UNIQUE (organization_id, id)
);

-- 6. Document Tags Table (Many-to-many relationship)
CREATE TABLE document_tags (
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

-- 7. Role-Based Document Access
CREATE TABLE document_role_access (
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

-- 8. Group-Based Document Access
CREATE TABLE document_group_access (
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

-- 9. User-Based Document Access
CREATE TABLE document_user_access (
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

-- 10. Document Favorites
CREATE TABLE document_favorites (
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
