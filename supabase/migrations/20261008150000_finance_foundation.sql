-- Migration: 20261008150000_finance_foundation.sql
-- Description: Phase 2 Task 12 - Finance, Expenses, Bills, Payments & Receipts Foundation

-- ==============================================================================
-- 1. ORGANIZATION DEFAULT CURRENCY & ENUMS
-- ==============================================================================

-- 1a. Organizations default currency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'default_currency'
  ) THEN
    ALTER TABLE organizations ADD COLUMN default_currency TEXT NOT NULL DEFAULT 'NPR';
    ALTER TABLE organizations ADD CONSTRAINT chk_organizations_default_currency
      CHECK (length(default_currency) = 3 AND default_currency = upper(default_currency));
  END IF;
END $$;

-- 1b. Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
    CREATE TYPE category_type AS ENUM (
      'expense',
      'income',
      'both'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_account_type') THEN
    CREATE TYPE finance_account_type AS ENUM (
      'bank',
      'cash',
      'petty_cash',
      'wallet',
      'card',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status') THEN
    CREATE TYPE expense_status AS ENUM (
      'draft',
      'submitted',
      'approved',
      'rejected',
      'paid',
      'void'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bill_status') THEN
    CREATE TYPE bill_status AS ENUM (
      'draft',
      'received',
      'approved',
      'partially_paid',
      'paid',
      'overdue',
      'void'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'draft',
      'completed',
      'void'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM (
      'cash',
      'bank_transfer',
      'cheque',
      'card',
      'mobile_wallet',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_file_entity_type') THEN
    CREATE TYPE finance_file_entity_type AS ENUM (
      'expense',
      'bill',
      'payment',
      'vendor'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_file_type') THEN
    CREATE TYPE finance_file_type AS ENUM (
      'bill',
      'invoice',
      'receipt',
      'payment_voucher',
      'cheque_copy',
      'bank_slip',
      'purchase_order',
      'quotation',
      'approval_document',
      'supporting_evidence',
      'other'
    );
  END IF;
END $$;


-- ==============================================================================
-- 2. FINANCE TABLES
-- ==============================================================================

-- 2a. Finance Categories (Configurable per organization)
CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT,
  category_type category_type NOT NULL DEFAULT 'expense',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_finance_categories_org_id UNIQUE (organization_id, id),
  CONSTRAINT uq_finance_categories_org_name UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_finance_categories_org_active
  ON finance_categories(organization_id, is_active);

-- 2b. Finance Accounts (Where money is held or paid from)
CREATE TABLE IF NOT EXISTS finance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  account_type finance_account_type NOT NULL DEFAULT 'bank',
  bank_name TEXT,
  account_reference TEXT, -- Stored securely, never store PIN, password, CVV, OTP
  currency TEXT NOT NULL DEFAULT 'NPR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_finance_accounts_org_id UNIQUE (organization_id, id),
  CONSTRAINT chk_finance_accounts_currency
    CHECK (length(currency) = 3 AND currency = upper(currency))
);

CREATE INDEX IF NOT EXISTS idx_finance_accounts_org_active
  ON finance_accounts(organization_id, is_active);

-- 2c. Vendors / External Payees
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_identifier TEXT,
  registration_number TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_vendors_org_id UNIQUE (organization_id, id),
  CONSTRAINT uq_vendors_org_name UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_vendors_org_name
  ON vendors(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_vendors_org_active
  ON vendors(organization_id, is_active);

-- 2d. Funding Sources
CREATE TABLE IF NOT EXISTS funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  reference_code TEXT,
  starts_at DATE,
  ends_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_funding_sources_org_id UNIQUE (organization_id, id),
  CONSTRAINT chk_funding_sources_dates
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS idx_funding_sources_org_active
  ON funding_sources(organization_id, is_active);

-- 2e. Sequential Number Tracking Table (Concurrency-safe sequence allocator)
CREATE TABLE IF NOT EXISTS finance_sequences (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sequence_type TEXT NOT NULL, -- 'expense', 'bill', 'payment'
  year INT NOT NULL,
  last_val INT NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, sequence_type, year)
);

-- Function to allocate sequential numbers concurrency-safely
CREATE OR REPLACE FUNCTION generate_finance_number(
  p_org_id UUID,
  p_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  v_next_val INT;
  v_prefix TEXT;
BEGIN
  IF p_type = 'expense' THEN
    v_prefix := 'EXP';
  ELSIF p_type = 'bill' THEN
    v_prefix := 'BILL';
  ELSIF p_type = 'payment' THEN
    v_prefix := 'PAY';
  ELSE
    RAISE EXCEPTION 'Unknown finance sequence type: %', p_type;
  END IF;

  INSERT INTO finance_sequences (organization_id, sequence_type, year, last_val)
  VALUES (p_org_id, p_type, v_year, 1)
  ON CONFLICT (organization_id, sequence_type, year)
  DO UPDATE SET last_val = finance_sequences.last_val + 1
  RETURNING last_val INTO v_next_val;

  RETURN v_prefix || '-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 6, '0');
END $$;


-- 2f. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  expense_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NPR',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_id UUID,
  person_payee_id UUID,
  payee_name TEXT,
  occasion_id UUID,
  owner_group_id UUID,
  funding_source_id UUID,
  status expense_status NOT NULL DEFAULT 'draft',
  is_reimbursable BOOLEAN NOT NULL DEFAULT FALSE,
  reimbursement_person_id UUID,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  void_reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,

  CONSTRAINT uq_expenses_org_id UNIQUE (organization_id, id),
  CONSTRAINT uq_expenses_org_number UNIQUE (organization_id, expense_number),
  CONSTRAINT chk_expenses_amount CHECK (amount > 0),
  CONSTRAINT chk_expenses_currency CHECK (length(currency) = 3 AND currency = upper(currency)),

  -- Multi-tenant composite foreign keys
  CONSTRAINT fk_expenses_category_org
    FOREIGN KEY (organization_id, category_id)
    REFERENCES finance_categories(organization_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_expenses_vendor_org
    FOREIGN KEY (organization_id, vendor_id)
    REFERENCES vendors(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_expenses_person_payee_org
    FOREIGN KEY (organization_id, person_payee_id)
    REFERENCES people(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_expenses_reimbursement_person_org
    FOREIGN KEY (organization_id, reimbursement_person_id)
    REFERENCES people(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_expenses_occasion_org
    FOREIGN KEY (organization_id, occasion_id)
    REFERENCES occasions(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_expenses_owner_group_org
    FOREIGN KEY (organization_id, owner_group_id)
    REFERENCES groups(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_expenses_funding_source_org
    FOREIGN KEY (organization_id, funding_source_id)
    REFERENCES funding_sources(organization_id, id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_org_date ON expenses(organization_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_org_status ON expenses(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_person_payee ON expenses(person_payee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_occasion ON expenses(occasion_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner_group ON expenses(owner_group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_funding_source ON expenses(funding_source_id);


-- 2g. Bills Table (Amounts owed before payment)
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  bill_number TEXT,
  vendor_invoice_number TEXT,
  vendor_id UUID,
  person_payee_id UUID,
  payee_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NPR',
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  occasion_id UUID,
  owner_group_id UUID,
  funding_source_id UUID,
  status bill_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,

  CONSTRAINT uq_bills_org_id UNIQUE (organization_id, id),
  CONSTRAINT uq_bills_org_number UNIQUE (organization_id, bill_number),
  CONSTRAINT chk_bills_amount CHECK (amount > 0),
  CONSTRAINT chk_bills_currency CHECK (length(currency) = 3 AND currency = upper(currency)),

  -- Multi-tenant composite foreign keys
  CONSTRAINT fk_bills_category_org
    FOREIGN KEY (organization_id, category_id)
    REFERENCES finance_categories(organization_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_bills_vendor_org
    FOREIGN KEY (organization_id, vendor_id)
    REFERENCES vendors(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_bills_person_payee_org
    FOREIGN KEY (organization_id, person_payee_id)
    REFERENCES people(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_bills_occasion_org
    FOREIGN KEY (organization_id, occasion_id)
    REFERENCES occasions(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_bills_owner_group_org
    FOREIGN KEY (organization_id, owner_group_id)
    REFERENCES groups(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_bills_funding_source_org
    FOREIGN KEY (organization_id, funding_source_id)
    REFERENCES funding_sources(organization_id, id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bills_org_date ON bills(organization_id, bill_date DESC);
CREATE INDEX IF NOT EXISTS idx_bills_org_due ON bills(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_bills_org_status ON bills(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_vendor ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category_id);


-- 2h. Payments Table (Actual cash movement out of an account)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  payment_number TEXT,
  account_id UUID NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NPR',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  vendor_id UUID,
  person_payee_id UUID,
  payee_name TEXT,
  notes TEXT,
  status payment_status NOT NULL DEFAULT 'completed',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  void_reason TEXT,

  CONSTRAINT uq_payments_org_id UNIQUE (organization_id, id),
  CONSTRAINT uq_payments_org_number UNIQUE (organization_id, payment_number),
  CONSTRAINT chk_payments_amount CHECK (amount > 0),
  CONSTRAINT chk_payments_currency CHECK (length(currency) = 3 AND currency = upper(currency)),

  -- Multi-tenant composite foreign keys
  CONSTRAINT fk_payments_account_org
    FOREIGN KEY (organization_id, account_id)
    REFERENCES finance_accounts(organization_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_payments_vendor_org
    FOREIGN KEY (organization_id, vendor_id)
    REFERENCES vendors(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_payments_person_payee_org
    FOREIGN KEY (organization_id, person_payee_id)
    REFERENCES people(organization_id, id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_org_date ON payments(organization_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_org_status ON payments(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_account ON payments(account_id);


-- 2i. Payment Allocations Table (Many-to-many linking payments to bills or direct expenses)
CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  payment_id UUID NOT NULL,
  bill_id UUID,
  expense_id UUID,
  allocated_amount NUMERIC(18,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_payment_allocations_amount CHECK (allocated_amount > 0),
  CONSTRAINT chk_payment_allocations_target CHECK (num_nonnulls(bill_id, expense_id) = 1),

  CONSTRAINT fk_allocations_payment_org
    FOREIGN KEY (organization_id, payment_id)
    REFERENCES payments(organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_allocations_bill_org
    FOREIGN KEY (organization_id, bill_id)
    REFERENCES bills(organization_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_allocations_expense_org
    FOREIGN KEY (organization_id, expense_id)
    REFERENCES expenses(organization_id, id)
    ON DELETE RESTRICT,

  CONSTRAINT uq_allocations_payment_bill UNIQUE (payment_id, bill_id),
  CONSTRAINT uq_allocations_payment_expense UNIQUE (payment_id, expense_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_bill ON payment_allocations(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_expense ON payment_allocations(expense_id);


-- 2j. Finance Files & Versions (Private financial supporting evidence)
CREATE TABLE IF NOT EXISTS finance_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  entity_type finance_file_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  expense_id UUID,
  bill_id UUID,
  payment_id UUID,
  vendor_id UUID,
  file_type finance_file_type NOT NULL DEFAULT 'receipt',
  title TEXT NOT NULL,
  description TEXT,
  current_version_id UUID, -- References finance_file_versions(id)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,

  CONSTRAINT uq_finance_files_org_id UNIQUE (organization_id, id),

  CONSTRAINT fk_finance_files_expense_org
    FOREIGN KEY (organization_id, expense_id)
    REFERENCES expenses(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_finance_files_bill_org
    FOREIGN KEY (organization_id, bill_id)
    REFERENCES bills(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_finance_files_payment_org
    FOREIGN KEY (organization_id, payment_id)
    REFERENCES payments(organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_finance_files_vendor_org
    FOREIGN KEY (organization_id, vendor_id)
    REFERENCES vendors(organization_id, id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_finance_files_org_entity
  ON finance_files(organization_id, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS finance_file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  finance_file_id UUID NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  checksum TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_finance_file_versions_org_id UNIQUE (organization_id, id),
  CONSTRAINT uq_finance_file_version_num UNIQUE (finance_file_id, version_number),

  CONSTRAINT fk_finance_file_versions_file_org
    FOREIGN KEY (organization_id, finance_file_id)
    REFERENCES finance_files(organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_finance_file_versions_file
  ON finance_file_versions(finance_file_id, version_number DESC);

-- Link current_version_id foreign key safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_finance_files_version'
  ) THEN
    ALTER TABLE finance_files
      ADD CONSTRAINT fk_finance_files_version
      FOREIGN KEY (current_version_id)
      REFERENCES finance_file_versions(id)
      ON DELETE SET NULL;
  END IF;
END $$;


-- ==============================================================================
-- 3. PERMISSIONS & ROLES SETUP
-- ==============================================================================

INSERT INTO permissions (code, description) VALUES
  ('finance.view', 'View organizational expenditures, accounts, categories, and funding sources'),
  ('finance.create', 'Create draft expenditures and financial records'),
  ('finance.edit', 'Modify draft expenditures and update details'),
  ('finance.expenses.approve', 'Approve or reject submitted expenditures'),
  ('finance.expenses.void', 'Void approved expenditures with mandatory reason'),
  ('finance.bills.view', 'View bills and invoice obligations'),
  ('finance.bills.manage', 'Create, update, and manage incoming bills and invoices'),
  ('finance.payments.view', 'View payments and cash outflow history'),
  ('finance.payments.create', 'Execute and record finalized payments out of accounts'),
  ('finance.payments.void', 'Void completed payments with mandatory reason'),
  ('finance.files.view', 'View financial receipts and supporting documents metadata'),
  ('finance.files.upload', 'Upload receipts, invoices, and vouchers'),
  ('finance.files.download', 'Download confidential financial evidence and receipts'),
  ('finance.accounts.view', 'View finance accounts and balances'),
  ('finance.accounts.manage', 'Create and configure organizational finance accounts'),
  ('finance.vendors.view', 'View vendor list and suppliers'),
  ('finance.vendors.manage', 'Create and update external vendors and payees'),
  ('finance.categories.manage', 'Configure organization expenditure categories'),
  ('finance.funding_sources.manage', 'Configure grants and funding sources'),
  ('finance.reports.view', 'View financial aggregate reports, cash outflows, and liability summaries')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

-- Create built-in Finance Admin role for all organizations
INSERT INTO roles (organization_id, name, slug, description, is_system_role)
SELECT
  o.id,
  'Finance Admin',
  'finance_admin',
  'Finance and Accounts Administrator with authority over expenditures, bills, payments, and financial accounts',
  TRUE
FROM organizations o
ON CONFLICT (organization_id, slug) DO NOTHING;

-- Grant all finance permissions to Finance Admin
INSERT INTO role_permissions (organization_id, role_id, permission_id)
SELECT
  r.organization_id,
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'finance_admin'
  AND p.code LIKE 'finance.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create built-in Finance Viewer role for all organizations
INSERT INTO roles (organization_id, name, slug, description, is_system_role)
SELECT
  o.id,
  'Finance Viewer',
  'finance_viewer',
  'Auditor or Viewer role with read-only access to organizational expenditures and reports',
  TRUE
FROM organizations o
ON CONFLICT (organization_id, slug) DO NOTHING;

-- Grant read-only permissions to Finance Viewer
INSERT INTO role_permissions (organization_id, role_id, permission_id)
SELECT
  r.organization_id,
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'finance_viewer'
  AND p.code IN (
    'finance.view',
    'finance.bills.view',
    'finance.payments.view',
    'finance.files.view',
    'finance.files.download',
    'finance.accounts.view',
    'finance.vendors.view',
    'finance.reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- ==============================================================================
-- 4. SEED STANDARD CONFIGURABLE FINANCE CATEGORIES
-- ==============================================================================

INSERT INTO finance_categories (organization_id, name, description, category_type)
SELECT
  o.id,
  cat.name,
  cat.description,
  'expense'::category_type
FROM organizations o
CROSS JOIN (
  VALUES
    ('Office Supplies', 'Stationery, desk supplies, and office materials'),
    ('Travel', 'Long-distance travel, per diems, and field accommodation'),
    ('Transportation', 'Local transit, fuel, vehicle hire, and fare reimbursement'),
    ('Food & Refreshments', 'Event catering, meeting refreshments, and meal support'),
    ('Rent', 'Office and venue lease rentals'),
    ('Utilities', 'Electricity, water, heating, and waste services'),
    ('Training', 'Capacity building, workshops, and educational programs'),
    ('Program Expenses', 'Direct project and field programmatic activities'),
    ('Medical / Relief Support', 'Emergency aid, relief packages, and direct beneficiary support'),
    ('Printing', 'Flyers, reports, banners, and promotional print materials'),
    ('Communication', 'Internet, mobile plans, telecommunications, and postage'),
    ('Equipment', 'Hardware, office machinery, and capital assets'),
    ('Maintenance', 'Repairs and ongoing upkeep of facilities or gear'),
    ('Professional Services', 'Legal, audit, accounting, and advisory fees'),
    ('Salary / Personnel', 'Staff payroll, honorariums, and compensation'),
    ('Bank Charges', 'Account maintenance and transaction fees'),
    ('Other', 'Miscellaneous organizational expenditures')
) AS cat(name, description)
ON CONFLICT (organization_id, name) DO NOTHING;


-- ==============================================================================
-- 5. PRIVATE STORAGE BUCKET 'finance-files' & POLICIES
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'finance-files',
  'finance-files',
  FALSE,
  52428800, -- 50 MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Authorization Helpers
CREATE OR REPLACE FUNCTION storage_can_read_finance_file(p_object_name TEXT)
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
  -- Path convention: {organization_id}/{entity_type}/{entity_id}/{finance_file_id}/{version_id}/{filename}
  v_path_parts := string_to_array(p_object_name, '/');
  IF array_length(v_path_parts, 1) < 6 THEN
    RETURN FALSE;
  END IF;

  BEGIN
    v_org_id := v_path_parts[1]::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  IF v_org_id <> current_organization_id() THEN
    RETURN FALSE;
  END IF;

  RETURN has_permission('finance.files.download') OR has_permission('finance.files.view');
END $$;

CREATE OR REPLACE FUNCTION storage_can_upload_finance_file(p_object_name TEXT)
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
  v_path_parts := string_to_array(p_object_name, '/');
  IF array_length(v_path_parts, 1) < 6 THEN
    RETURN FALSE;
  END IF;

  BEGIN
    v_org_id := v_path_parts[1]::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  IF v_org_id <> current_organization_id() THEN
    RETURN FALSE;
  END IF;

  RETURN has_permission('finance.files.upload');
END $$;

-- Storage object policies for 'finance-files'
DROP POLICY IF EXISTS "finance_files_select" ON storage.objects;
CREATE POLICY "finance_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'finance-files'
    AND storage_can_read_finance_file(name)
  );

DROP POLICY IF EXISTS "finance_files_insert" ON storage.objects;
CREATE POLICY "finance_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'finance-files'
    AND storage_can_upload_finance_file(name)
  );

-- No UPDATE or DELETE allowed on storage objects in 'finance-files' to ensure immutability


-- ==============================================================================
-- 6. DATA INTEGRITY TRIGGERS & BALANCE RECALCULATION
-- ==============================================================================

-- 6a. Ensure payment currency strictly matches account currency
CREATE OR REPLACE FUNCTION tr_check_payment_account_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acc_currency TEXT;
BEGIN
  SELECT currency INTO v_acc_currency
  FROM finance_accounts
  WHERE id = NEW.account_id AND organization_id = NEW.organization_id;

  IF v_acc_currency IS NULL THEN
    RAISE EXCEPTION 'Target finance account does not exist in this organization';
  END IF;

  IF NEW.currency <> v_acc_currency THEN
    RAISE EXCEPTION 'Payment currency (%) must match finance account currency (%)',
      NEW.currency, v_acc_currency;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_payments_currency_check ON payments;
CREATE TRIGGER tr_payments_currency_check
  BEFORE INSERT OR UPDATE OF account_id, currency ON payments
  FOR EACH ROW
  EXECUTE FUNCTION tr_check_payment_account_currency();

-- 6b. Prevent physical deletion of completed payments or official expenditures
CREATE OR REPLACE FUNCTION tr_prevent_financial_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'payments' THEN
    IF OLD.status = 'completed' THEN
      RAISE EXCEPTION 'Completed payments cannot be physically deleted. Use void_payment() instead.';
    END IF;
  ELSIF TG_TABLE_NAME = 'expenses' THEN
    IF OLD.status IN ('approved', 'paid', 'void') THEN
      RAISE EXCEPTION 'Approved or finalized expenses cannot be physically deleted. Use void_expense() or archive.';
    END IF;
  ELSIF TG_TABLE_NAME = 'bills' THEN
    IF OLD.status IN ('approved', 'partially_paid', 'paid', 'void') THEN
      RAISE EXCEPTION 'Approved or paid bills cannot be physically deleted. Use void or archive.';
    END IF;
  ELSIF TG_TABLE_NAME = 'finance_file_versions' THEN
    RAISE EXCEPTION 'Financial file versions are strictly immutable and cannot be deleted.';
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS tr_payments_no_delete ON payments;
CREATE TRIGGER tr_payments_no_delete
  BEFORE DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION tr_prevent_financial_deletion();

DROP TRIGGER IF EXISTS tr_expenses_no_delete ON expenses;
CREATE TRIGGER tr_expenses_no_delete
  BEFORE DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION tr_prevent_financial_deletion();

DROP TRIGGER IF EXISTS tr_bills_no_delete ON bills;
CREATE TRIGGER tr_bills_no_delete
  BEFORE DELETE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION tr_prevent_financial_deletion();

DROP TRIGGER IF EXISTS tr_file_versions_no_delete ON finance_file_versions;
CREATE TRIGGER tr_file_versions_no_delete
  BEFORE DELETE ON finance_file_versions
  FOR EACH ROW
  EXECUTE FUNCTION tr_prevent_financial_deletion();

DROP TRIGGER IF EXISTS tr_file_versions_no_update ON finance_file_versions;
CREATE TRIGGER tr_file_versions_no_update
  BEFORE UPDATE ON finance_file_versions
  FOR EACH ROW
  EXECUTE FUNCTION tr_prevent_financial_deletion();


-- 6c. Validate Payment Allocation integrity
-- (1) Sum of allocations for a payment <= payment amount
-- (2) Sum of allocations for a bill <= bill amount
-- (3) Sum of allocations for an expense <= expense amount
-- (4) Cross-organization match
CREATE OR REPLACE FUNCTION tr_validate_payment_allocation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_bill RECORD;
  v_expense RECORD;
  v_current_alloc_sum NUMERIC(18,2);
  v_existing_target_sum NUMERIC(18,2);
BEGIN
  -- Fetch payment details
  SELECT id, organization_id, amount, currency, status
  INTO v_payment
  FROM payments
  WHERE id = NEW.payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment.organization_id <> NEW.organization_id THEN
    RAISE EXCEPTION 'Cross-organization allocation is strictly forbidden';
  END IF;

  -- 1. Check total allocated for this payment
  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_current_alloc_sum
  FROM payment_allocations
  WHERE payment_id = NEW.payment_id
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF (v_current_alloc_sum + NEW.allocated_amount) > v_payment.amount THEN
    RAISE EXCEPTION 'Total payment allocations (% + %) exceed payment amount (%)',
      v_current_alloc_sum, NEW.allocated_amount, v_payment.amount;
  END IF;

  -- 2. If allocating to a Bill:
  IF NEW.bill_id IS NOT NULL THEN
    SELECT id, organization_id, amount, currency, status
    INTO v_bill
    FROM bills
    WHERE id = NEW.bill_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Bill not found';
    END IF;

    IF v_bill.organization_id <> NEW.organization_id THEN
      RAISE EXCEPTION 'Bill belongs to a different organization';
    END IF;

    IF v_bill.currency <> v_payment.currency THEN
      RAISE EXCEPTION 'Cannot allocate payment in currency % to bill in currency %',
        v_payment.currency, v_bill.currency;
    END IF;

    IF v_bill.status = 'void' THEN
      RAISE EXCEPTION 'Cannot allocate payment to a voided bill';
    END IF;

    -- Calculate all active allocations to this bill from non-void payments
    SELECT COALESCE(SUM(pa.allocated_amount), 0)
    INTO v_existing_target_sum
    FROM payment_allocations pa
    JOIN payments p ON p.id = pa.payment_id
    WHERE pa.bill_id = NEW.bill_id
      AND p.status <> 'void'
      AND pa.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF (v_existing_target_sum + NEW.allocated_amount) > v_bill.amount THEN
      RAISE EXCEPTION 'Payment allocation of % causes total paid (%) to exceed bill amount (%)',
        NEW.allocated_amount, (v_existing_target_sum + NEW.allocated_amount), v_bill.amount;
    END IF;
  END IF;

  -- 3. If allocating to an Expense:
  IF NEW.expense_id IS NOT NULL THEN
    SELECT id, organization_id, amount, currency, status
    INTO v_expense
    FROM expenses
    WHERE id = NEW.expense_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Expense not found';
    END IF;

    IF v_expense.organization_id <> NEW.organization_id THEN
      RAISE EXCEPTION 'Expense belongs to a different organization';
    END IF;

    IF v_expense.currency <> v_payment.currency THEN
      RAISE EXCEPTION 'Cannot allocate payment in currency % to expense in currency %',
        v_payment.currency, v_expense.currency;
    END IF;

    IF v_expense.status = 'void' THEN
      RAISE EXCEPTION 'Cannot allocate payment to a voided expense';
    END IF;

    -- Calculate all active allocations to this expense from non-void payments
    SELECT COALESCE(SUM(pa.allocated_amount), 0)
    INTO v_existing_target_sum
    FROM payment_allocations pa
    JOIN payments p ON p.id = pa.payment_id
    WHERE pa.expense_id = NEW.expense_id
      AND p.status <> 'void'
      AND pa.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF (v_existing_target_sum + NEW.allocated_amount) > v_expense.amount THEN
      RAISE EXCEPTION 'Payment allocation of % causes total paid (%) to exceed expense amount (%)',
        NEW.allocated_amount, (v_existing_target_sum + NEW.allocated_amount), v_expense.amount;
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_allocations_validate ON payment_allocations;
CREATE TRIGGER tr_allocations_validate
  BEFORE INSERT OR UPDATE ON payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION tr_validate_payment_allocation();


-- 6d. Trigger to keep Bill and Expense payment statuses synchronized
CREATE OR REPLACE FUNCTION tr_sync_payment_allocation_statuses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill_id UUID;
  v_expense_id UUID;
  v_bill_amount NUMERIC(18,2);
  v_bill_paid NUMERIC(18,2);
  v_expense_amount NUMERIC(18,2);
  v_expense_paid NUMERIC(18,2);
  v_curr_bill_status bill_status;
  v_curr_exp_status expense_status;
BEGIN
  v_bill_id := COALESCE(NEW.bill_id, OLD.bill_id);
  v_expense_id := COALESCE(NEW.expense_id, OLD.expense_id);

  -- 1. Sync Bill status
  IF v_bill_id IS NOT NULL THEN
    SELECT amount, status INTO v_bill_amount, v_curr_bill_status
    FROM bills WHERE id = v_bill_id;

    IF v_curr_bill_status <> 'void' THEN
      SELECT COALESCE(SUM(pa.allocated_amount), 0)
      INTO v_bill_paid
      FROM payment_allocations pa
      JOIN payments p ON p.id = pa.payment_id
      WHERE pa.bill_id = v_bill_id AND p.status <> 'void';

      IF v_bill_paid >= v_bill_amount THEN
        UPDATE bills SET status = 'paid', updated_at = NOW() WHERE id = v_bill_id;
      ELSIF v_bill_paid > 0 THEN
        UPDATE bills SET status = 'partially_paid', updated_at = NOW() WHERE id = v_bill_id;
      ELSE
        -- If all payments voided or allocations deleted, revert back if was paid/partially_paid
        IF v_curr_bill_status IN ('paid', 'partially_paid') THEN
          UPDATE bills SET status = 'approved', updated_at = NOW() WHERE id = v_bill_id;
        END IF;
      END IF;
    END IF;
  END IF;

  -- 2. Sync Expense status
  IF v_expense_id IS NOT NULL THEN
    SELECT amount, status INTO v_expense_amount, v_curr_exp_status
    FROM expenses WHERE id = v_expense_id;

    IF v_curr_exp_status <> 'void' THEN
      SELECT COALESCE(SUM(pa.allocated_amount), 0)
      INTO v_expense_paid
      FROM payment_allocations pa
      JOIN payments p ON p.id = pa.payment_id
      WHERE pa.expense_id = v_expense_id AND p.status <> 'void';

      IF v_expense_paid >= v_expense_amount THEN
        UPDATE expenses SET status = 'paid', updated_at = NOW() WHERE id = v_expense_id;
      ELSE
        IF v_curr_exp_status = 'paid' THEN
          UPDATE expenses SET status = 'approved', updated_at = NOW() WHERE id = v_expense_id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS tr_allocations_sync_status ON payment_allocations;
CREATE TRIGGER tr_allocations_sync_status
  AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION tr_sync_payment_allocation_statuses();


-- 6e. Trigger on payments void to re-sync all allocated bills and expenses
CREATE OR REPLACE FUNCTION tr_sync_payment_void_statuses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alloc RECORD;
  v_paid NUMERIC(18,2);
  v_total NUMERIC(18,2);
  v_b_status bill_status;
  v_e_status expense_status;
BEGIN
  IF NEW.status = 'void' AND OLD.status <> 'void' THEN
    -- For each allocation linked to this payment, recompute target status
    FOR v_alloc IN
      SELECT bill_id, expense_id FROM payment_allocations WHERE payment_id = NEW.id
    LOOP
      IF v_alloc.bill_id IS NOT NULL THEN
        SELECT amount, status INTO v_total, v_b_status FROM bills WHERE id = v_alloc.bill_id;
        IF v_b_status <> 'void' THEN
          SELECT COALESCE(SUM(pa.allocated_amount), 0) INTO v_paid
          FROM payment_allocations pa
          JOIN payments p ON p.id = pa.payment_id
          WHERE pa.bill_id = v_alloc.bill_id AND p.status <> 'void';

          IF v_paid >= v_total THEN
            UPDATE bills SET status = 'paid', updated_at = NOW() WHERE id = v_alloc.bill_id;
          ELSIF v_paid > 0 THEN
            UPDATE bills SET status = 'partially_paid', updated_at = NOW() WHERE id = v_alloc.bill_id;
          ELSE
            UPDATE bills SET status = 'approved', updated_at = NOW() WHERE id = v_alloc.bill_id;
          END IF;
        END IF;
      END IF;

      IF v_alloc.expense_id IS NOT NULL THEN
        SELECT amount, status INTO v_total, v_e_status FROM expenses WHERE id = v_alloc.expense_id;
        IF v_e_status <> 'void' THEN
          SELECT COALESCE(SUM(pa.allocated_amount), 0) INTO v_paid
          FROM payment_allocations pa
          JOIN payments p ON p.id = pa.payment_id
          WHERE pa.expense_id = v_alloc.expense_id AND p.status <> 'void';

          IF v_paid >= v_total THEN
            UPDATE expenses SET status = 'paid', updated_at = NOW() WHERE id = v_alloc.expense_id;
          ELSE
            UPDATE expenses SET status = 'approved', updated_at = NOW() WHERE id = v_alloc.expense_id;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_payments_void_sync ON payments;
CREATE TRIGGER tr_payments_void_sync
  AFTER UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION tr_sync_payment_void_statuses();


-- ==============================================================================
-- 7. CALCULATION & REPORTING FUNCTIONS
-- ==============================================================================

-- 7a. Get Bill Balance
CREATE OR REPLACE FUNCTION get_bill_balance(p_bill_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill RECORD;
  v_paid NUMERIC(18,2);
  v_balance NUMERIC(18,2);
  v_is_overdue BOOLEAN;
BEGIN
  SELECT id, organization_id, bill_number, amount, currency, due_date, status
  INTO v_bill
  FROM bills
  WHERE id = p_bill_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found';
  END IF;

  IF v_bill.organization_id <> current_organization_id() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COALESCE(SUM(pa.allocated_amount), 0)
  INTO v_paid
  FROM payment_allocations pa
  JOIN payments p ON p.id = pa.payment_id
  WHERE pa.bill_id = p_bill_id AND p.status <> 'void';

  v_balance := GREATEST(0, v_bill.amount - v_paid);
  v_is_overdue := (v_bill.due_date IS NOT NULL AND v_bill.due_date < CURRENT_DATE AND v_balance > 0);

  RETURN jsonb_build_object(
    'bill_id', v_bill.id,
    'bill_number', v_bill.bill_number,
    'amount', v_bill.amount,
    'currency', v_bill.currency,
    'total_paid', v_paid,
    'remaining_balance', v_balance,
    'stored_status', v_bill.status,
    'is_overdue', v_is_overdue
  );
END $$;

-- 7b. Get Expense Balance
CREATE OR REPLACE FUNCTION get_expense_balance(p_expense_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exp RECORD;
  v_paid NUMERIC(18,2);
  v_balance NUMERIC(18,2);
BEGIN
  SELECT id, organization_id, expense_number, amount, currency, status
  INTO v_exp
  FROM expenses
  WHERE id = p_expense_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  IF v_exp.organization_id <> current_organization_id() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COALESCE(SUM(pa.allocated_amount), 0)
  INTO v_paid
  FROM payment_allocations pa
  JOIN payments p ON p.id = pa.payment_id
  WHERE pa.expense_id = p_expense_id AND p.status <> 'void';

  v_balance := GREATEST(0, v_exp.amount - v_paid);

  RETURN jsonb_build_object(
    'expense_id', v_exp.id,
    'expense_number', v_exp.expense_number,
    'amount', v_exp.amount,
    'currency', v_exp.currency,
    'total_paid', v_paid,
    'remaining_balance', v_balance,
    'is_paid', (v_balance = 0 AND v_paid > 0)
  );
END $$;

-- 7c. Mask account reference (protect banking credentials)
CREATE OR REPLACE FUNCTION mask_account_reference(p_ref TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_ref IS NULL OR length(p_ref) = 0 THEN ''
    WHEN length(p_ref) <= 4 THEN p_ref
    ELSE '•••• ' || substring(p_ref from length(p_ref) - 3)
  END;
$$;


-- ==============================================================================
-- 8. CONTROLLED FINANCE RPCS (APPROVAL, LIFECYCLE & PAYMENTS)
-- ==============================================================================

-- 8a. Submit Expense for approval
CREATE OR REPLACE FUNCTION submit_expense(p_expense_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := current_organization_id();
  v_user_id UUID := auth.uid();
  v_expense expenses%ROWTYPE;
BEGIN
  IF NOT (has_permission('finance.create') OR has_permission('finance.edit')) THEN
    RAISE EXCEPTION 'Permission denied: Cannot submit expense';
  END IF;

  SELECT * INTO v_expense
  FROM expenses
  WHERE id = p_expense_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  IF v_expense.status NOT IN ('draft', 'rejected') THEN
    RAISE EXCEPTION 'Only draft or rejected expenses can be submitted (current: %)', v_expense.status;
  END IF;

  -- Ensure sequential expense_number is assigned if missing
  IF v_expense.expense_number IS NULL THEN
    v_expense.expense_number := generate_finance_number(v_org_id, 'expense');
  END IF;

  UPDATE expenses
  SET
    expense_number = v_expense.expense_number,
    status = 'submitted',
    submitted_at = NOW(),
    submitted_by = v_user_id,
    updated_by = v_user_id,
    updated_at = NOW()
  WHERE id = p_expense_id;

  -- Audit log
  INSERT INTO activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_org_id,
    v_user_id,
    'finance.expense_submitted',
    'expense',
    p_expense_id,
    jsonb_build_object('expense_number', v_expense.expense_number, 'amount', v_expense.amount)
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'expense_id', p_expense_id,
    'expense_number', v_expense.expense_number,
    'status', 'submitted'
  );
END $$;

-- 8b. Approve Expense
CREATE OR REPLACE FUNCTION approve_expense(p_expense_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := current_organization_id();
  v_user_id UUID := auth.uid();
  v_expense expenses%ROWTYPE;
BEGIN
  IF NOT has_permission('finance.expenses.approve') THEN
    RAISE EXCEPTION 'Permission denied: finance.expenses.approve required';
  END IF;

  SELECT * INTO v_expense
  FROM expenses
  WHERE id = p_expense_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  IF v_expense.status <> 'submitted' THEN
    RAISE EXCEPTION 'Only submitted expenses can be approved (current: %)', v_expense.status;
  END IF;

  UPDATE expenses
  SET
    status = 'approved',
    approved_at = NOW(),
    approved_by = v_user_id,
    rejected_at = NULL,
    rejected_by = NULL,
    rejection_reason = NULL,
    updated_by = v_user_id,
    updated_at = NOW()
  WHERE id = p_expense_id;

  -- Audit log
  INSERT INTO activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_org_id,
    v_user_id,
    'finance.expense_approved',
    'expense',
    p_expense_id,
    jsonb_build_object('expense_number', v_expense.expense_number, 'amount', v_expense.amount)
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'expense_id', p_expense_id,
    'status', 'approved'
  );
END $$;

-- 8c. Reject Expense
CREATE OR REPLACE FUNCTION reject_expense(p_expense_id UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := current_organization_id();
  v_user_id UUID := auth.uid();
  v_expense expenses%ROWTYPE;
BEGIN
  IF NOT has_permission('finance.expenses.approve') THEN
    RAISE EXCEPTION 'Permission denied: finance.expenses.approve required';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;

  SELECT * INTO v_expense
  FROM expenses
  WHERE id = p_expense_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  IF v_expense.status <> 'submitted' THEN
    RAISE EXCEPTION 'Only submitted expenses can be rejected (current: %)', v_expense.status;
  END IF;

  UPDATE expenses
  SET
    status = 'rejected',
    rejected_at = NOW(),
    rejected_by = v_user_id,
    rejection_reason = trim(p_reason),
    updated_by = v_user_id,
    updated_at = NOW()
  WHERE id = p_expense_id;

  -- Audit log
  INSERT INTO activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_org_id,
    v_user_id,
    'finance.expense_rejected',
    'expense',
    p_expense_id,
    jsonb_build_object('expense_number', v_expense.expense_number, 'reason', trim(p_reason))
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'expense_id', p_expense_id,
    'status', 'rejected'
  );
END $$;

-- 8d. Void Expense
CREATE OR REPLACE FUNCTION void_expense(p_expense_id UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := current_organization_id();
  v_user_id UUID := auth.uid();
  v_expense expenses%ROWTYPE;
  v_active_payments INT;
BEGIN
  IF NOT has_permission('finance.expenses.void') THEN
    RAISE EXCEPTION 'Permission denied: finance.expenses.void required';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Void reason is mandatory';
  END IF;

  SELECT * INTO v_expense
  FROM expenses
  WHERE id = p_expense_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  IF v_expense.status = 'void' THEN
    RAISE EXCEPTION 'Expense is already voided';
  END IF;

  -- Verify if active completed payments are allocated to this expense
  SELECT COUNT(*) INTO v_active_payments
  FROM payment_allocations pa
  JOIN payments p ON p.id = pa.payment_id
  WHERE pa.expense_id = p_expense_id AND p.status <> 'void';

  IF v_active_payments > 0 THEN
    RAISE EXCEPTION 'Cannot void an expense that has active completed payments allocated to it. Void the payments first.';
  END IF;

  UPDATE expenses
  SET
    status = 'void',
    voided_at = NOW(),
    voided_by = v_user_id,
    void_reason = trim(p_reason),
    updated_by = v_user_id,
    updated_at = NOW()
  WHERE id = p_expense_id;

  -- Audit log
  INSERT INTO activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_org_id,
    v_user_id,
    'finance.expense_voided',
    'expense',
    p_expense_id,
    jsonb_build_object('expense_number', v_expense.expense_number, 'reason', trim(p_reason))
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'expense_id', p_expense_id,
    'status', 'void'
  );
END $$;

-- 8e. Create Payment with Allocations (Controlled Atomic Operation)
CREATE OR REPLACE FUNCTION create_payment(
  p_account_id UUID,
  p_amount NUMERIC(18,2),
  p_payment_date DATE,
  p_payment_method payment_method,
  p_allocations JSONB DEFAULT '[]'::jsonb,
  p_vendor_id UUID DEFAULT NULL,
  p_person_payee_id UUID DEFAULT NULL,
  p_payee_name TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := current_organization_id();
  v_user_id UUID := auth.uid();
  v_acc RECORD;
  v_payment_id UUID;
  v_payment_num TEXT;
  v_elem JSONB;
  v_alloc_bill_id UUID;
  v_alloc_expense_id UUID;
  v_alloc_amount NUMERIC(18,2);
  v_total_allocated NUMERIC(18,2) := 0;
BEGIN
  IF NOT has_permission('finance.payments.create') THEN
    RAISE EXCEPTION 'Permission denied: finance.payments.create required';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- Validate target account
  SELECT id, organization_id, currency, is_active
  INTO v_acc
  FROM finance_accounts
  WHERE id = p_account_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Finance account not found in this organization';
  END IF;

  IF NOT v_acc.is_active THEN
    RAISE EXCEPTION 'Target finance account is inactive';
  END IF;

  -- Concurrency-safe payment number
  v_payment_num := generate_finance_number(v_org_id, 'payment');

  -- Insert Payment record
  INSERT INTO payments (
    organization_id,
    payment_number,
    account_id,
    amount,
    currency,
    payment_date,
    payment_method,
    reference_number,
    vendor_id,
    person_payee_id,
    payee_name,
    notes,
    status,
    created_by,
    updated_by
  )
  VALUES (
    v_org_id,
    v_payment_num,
    p_account_id,
    p_amount,
    v_acc.currency,
    p_payment_date,
    p_payment_method,
    p_reference_number,
    p_vendor_id,
    p_person_payee_id,
    p_payee_name,
    p_notes,
    'completed',
    v_user_id,
    v_user_id
  )
  RETURNING id INTO v_payment_id;

  -- Process allocations if provided
  IF p_allocations IS NOT NULL AND jsonb_array_length(p_allocations) > 0 THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      v_alloc_bill_id := (v_elem->>'bill_id')::UUID;
      v_alloc_expense_id := (v_elem->>'expense_id')::UUID;
      v_alloc_amount := (v_elem->>'allocated_amount')::NUMERIC(18,2);

      IF v_alloc_amount <= 0 THEN
        RAISE EXCEPTION 'Allocated amount must be greater than zero';
      END IF;

      INSERT INTO payment_allocations (
        organization_id,
        payment_id,
        bill_id,
        expense_id,
        allocated_amount
      )
      VALUES (
        v_org_id,
        v_payment_id,
        v_alloc_bill_id,
        v_alloc_expense_id,
        v_alloc_amount
      );

      v_total_allocated := v_total_allocated + v_alloc_amount;
    END LOOP;
  END IF;

  IF v_total_allocated > p_amount THEN
    RAISE EXCEPTION 'Total allocations (%) exceed payment amount (%)', v_total_allocated, p_amount;
  END IF;

  -- Audit log
  INSERT INTO activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_org_id,
    v_user_id,
    'finance.payment_created',
    'payment',
    v_payment_id,
    jsonb_build_object(
      'payment_number', v_payment_num,
      'amount', p_amount,
      'currency', v_acc.currency,
      'method', p_payment_method,
      'allocated_count', jsonb_array_length(p_allocations)
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'payment_id', v_payment_id,
    'payment_number', v_payment_num,
    'amount', p_amount,
    'currency', v_acc.currency,
    'total_allocated', v_total_allocated
  );
END $$;

-- 8f. Void Payment (Preserves history, recalculates linked obligations, records audit)
CREATE OR REPLACE FUNCTION void_payment(p_payment_id UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := current_organization_id();
  v_user_id UUID := auth.uid();
  v_payment payments%ROWTYPE;
BEGIN
  IF NOT has_permission('finance.payments.void') THEN
    RAISE EXCEPTION 'Permission denied: finance.payments.void required';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Void reason is mandatory';
  END IF;

  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment.status = 'void' THEN
    RAISE EXCEPTION 'Payment is already voided';
  END IF;

  UPDATE payments
  SET
    status = 'void',
    voided_at = NOW(),
    voided_by = v_user_id,
    void_reason = trim(p_reason),
    updated_by = v_user_id,
    updated_at = NOW()
  WHERE id = p_payment_id;

  -- Audit log
  INSERT INTO activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_org_id,
    v_user_id,
    'finance.payment_voided',
    'payment',
    p_payment_id,
    jsonb_build_object(
      'payment_number', v_payment.payment_number,
      'amount', v_payment.amount,
      'reason', trim(p_reason)
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'payment_id', p_payment_id,
    'status', 'void'
  );
END $$;

-- 8g. Log Finance File Download
CREATE OR REPLACE FUNCTION log_finance_file_download(
  p_finance_file_id UUID,
  p_version_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := current_organization_id();
  v_user_id UUID := auth.uid();
  v_file finance_files%ROWTYPE;
  v_ver finance_file_versions%ROWTYPE;
BEGIN
  IF NOT has_permission('finance.files.download') THEN
    RAISE EXCEPTION 'Permission denied: finance.files.download required';
  END IF;

  SELECT * INTO v_file
  FROM finance_files
  WHERE id = p_finance_file_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Finance file not found';
  END IF;

  SELECT * INTO v_ver
  FROM finance_file_versions
  WHERE id = p_version_id AND finance_file_id = p_finance_file_id AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Finance file version not found';
  END IF;

  -- Audit log (Do NOT log signed URLs or security secrets)
  INSERT INTO activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_org_id,
    v_user_id,
    'finance.file_downloaded',
    'finance_file',
    p_finance_file_id,
    jsonb_build_object(
      'version_id', p_version_id,
      'filename', v_ver.filename,
      'file_type', v_file.file_type,
      'entity_type', v_file.entity_type,
      'entity_id', v_file.entity_id
    )
  );

  RETURN jsonb_build_object('success', TRUE);
END $$;


-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_sequences ENABLE ROW LEVEL SECURITY;

-- 9a. finance_categories
DROP POLICY IF EXISTS "finance_categories_select" ON finance_categories;
CREATE POLICY "finance_categories_select" ON finance_categories
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.view')
  );

DROP POLICY IF EXISTS "finance_categories_manage" ON finance_categories;
CREATE POLICY "finance_categories_manage" ON finance_categories
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.categories.manage')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.categories.manage')
  );

-- 9b. finance_accounts
DROP POLICY IF EXISTS "finance_accounts_select" ON finance_accounts;
CREATE POLICY "finance_accounts_select" ON finance_accounts
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('finance.accounts.view') OR has_permission('finance.view'))
  );

DROP POLICY IF EXISTS "finance_accounts_manage" ON finance_accounts;
CREATE POLICY "finance_accounts_manage" ON finance_accounts
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.accounts.manage')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.accounts.manage')
  );

-- 9c. vendors
DROP POLICY IF EXISTS "vendors_select" ON vendors;
CREATE POLICY "vendors_select" ON vendors
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('finance.vendors.view') OR has_permission('finance.view'))
  );

DROP POLICY IF EXISTS "vendors_manage" ON vendors;
CREATE POLICY "vendors_manage" ON vendors
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.vendors.manage')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.vendors.manage')
  );

-- 9d. funding_sources
DROP POLICY IF EXISTS "funding_sources_select" ON funding_sources;
CREATE POLICY "funding_sources_select" ON funding_sources
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.view')
  );

DROP POLICY IF EXISTS "funding_sources_manage" ON funding_sources;
CREATE POLICY "funding_sources_manage" ON funding_sources
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.funding_sources.manage')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.funding_sources.manage')
  );

-- 9e. expenses
DROP POLICY IF EXISTS "expenses_select" ON expenses;
CREATE POLICY "expenses_select" ON expenses
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.view')
  );

DROP POLICY IF EXISTS "expenses_insert" ON expenses;
CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.create')
  );

DROP POLICY IF EXISTS "expenses_update" ON expenses;
CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (
      has_permission('finance.edit')
      OR (has_permission('finance.create') AND status = 'draft')
    )
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND (
      has_permission('finance.edit')
      OR (has_permission('finance.create') AND status = 'draft')
    )
  );

DROP POLICY IF EXISTS "expenses_delete" ON expenses;
CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE TO authenticated
  USING (
    organization_id = current_organization_id()
    AND status = 'draft'
    AND has_permission('finance.edit')
  );

-- 9f. bills
DROP POLICY IF EXISTS "bills_select" ON bills;
CREATE POLICY "bills_select" ON bills
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('finance.bills.view') OR has_permission('finance.view'))
  );

DROP POLICY IF EXISTS "bills_insert" ON bills;
CREATE POLICY "bills_insert" ON bills
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.bills.manage')
  );

DROP POLICY IF EXISTS "bills_update" ON bills;
CREATE POLICY "bills_update" ON bills
  FOR UPDATE TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.bills.manage')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.bills.manage')
  );

DROP POLICY IF EXISTS "bills_delete" ON bills;
CREATE POLICY "bills_delete" ON bills
  FOR DELETE TO authenticated
  USING (
    organization_id = current_organization_id()
    AND status = 'draft'
    AND has_permission('finance.bills.manage')
  );

-- 9g. payments
DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('finance.payments.view') OR has_permission('finance.view'))
  );

DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_insert" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.payments.create')
  );

-- 9h. payment_allocations
DROP POLICY IF EXISTS "payment_allocations_select" ON payment_allocations;
CREATE POLICY "payment_allocations_select" ON payment_allocations
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('finance.payments.view') OR has_permission('finance.view'))
  );

DROP POLICY IF EXISTS "payment_allocations_insert" ON payment_allocations;
CREATE POLICY "payment_allocations_insert" ON payment_allocations
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.payments.create')
  );

-- 9i. finance_files
DROP POLICY IF EXISTS "finance_files_select" ON finance_files;
CREATE POLICY "finance_files_select" ON finance_files
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('finance.files.view') OR has_permission('finance.view'))
  );

DROP POLICY IF EXISTS "finance_files_insert" ON finance_files;
CREATE POLICY "finance_files_insert" ON finance_files
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.files.upload')
  );

DROP POLICY IF EXISTS "finance_files_update" ON finance_files;
CREATE POLICY "finance_files_update" ON finance_files
  FOR UPDATE TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.files.upload')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.files.upload')
  );

-- 9j. finance_file_versions
DROP POLICY IF EXISTS "finance_file_versions_select" ON finance_file_versions;
CREATE POLICY "finance_file_versions_select" ON finance_file_versions
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('finance.files.view') OR has_permission('finance.view'))
  );

DROP POLICY IF EXISTS "finance_file_versions_insert" ON finance_file_versions;
CREATE POLICY "finance_file_versions_insert" ON finance_file_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.files.upload')
  );

-- 9k. finance_sequences (System internal, accessible only via security definer or admin)
DROP POLICY IF EXISTS "finance_sequences_admin" ON finance_sequences;
CREATE POLICY "finance_sequences_admin" ON finance_sequences
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('finance.create')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('finance.create')
  );
