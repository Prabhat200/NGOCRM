# NGO Operations & Document Portal (V1 Production Candidate)

A secure, multi-tenant operations and document management platform tailored for non-governmental organizations (NGOs), non-profits, and associations.

---

## 1. Project Purpose & Architecture

The NGO Portal delivers secure organizational governance, structured document archiving, occasion coordination, committee administration, and auditable access control.

### Core Architectural Pillars

1. **Member vs. Portal User**:
   * **Member (`members`)**: Represents an individual in the organization (staff, volunteer, board member, advisor). Contains organizational data (membership ID, joined date, position).
   * **Portal User (`profiles` $\leftrightarrow$ `auth.users`)**: Represents an authenticated digital identity with login credentials. A portal user optionally links to a `member_id` and holds portal roles (`user_roles`).
   * Members can exist without portal access; portal users require an `active` status profile to access business records.

2. **Multi-Tenant Organization Isolation**:
   * Every business table is partitioned by `organization_id`.
   * Authorization helpers (`current_organization_id()`) derive tenant identity directly from `auth.uid() -> profiles.organization_id`.
   * Client-supplied organization IDs are never trusted. Cross-tenant foreign keys, queries, and Storage access are completely prohibited.
   * Super Admins are strictly scoped to their own organization.

3. **Dual-Layer Authorization (RBAC + ACL)**:
   * **System Permissions (RBAC)**: Global functional capabilities (e.g., `documents.view`, `documents.upload_version`, `occasions.create`, `users.manage_roles`).
   * **Resource Grants (ACL)**: Specific document access levels (`view`, `edit`, `manage`) assigned via:
     - Direct user grants (`document_user_access`)
     - Committee / Group membership (`document_group_access`)
     - Role assignments (`document_role_access`)

4. **Document Access Modes**:
   * `organization`: Discoverable and readable by any active member in the NGO with `documents.view`.
   * `restricted`: Accessible only to users holding explicit resource access (direct grant, committee grant, or role grant).
   * `private`: Confidential to creator, direct explicit user grants, or Super Admin.

5. **Document Versioning & Immutability**:
   * Version numbers are strictly monotonic and sequential.
   * Physical files are stored at immutable paths: `{org_id}/{doc_id}/v{number}/{filename}`.
   * Historical versions cannot be overwritten or deleted.
   * Composite foreign key `(id, current_version_id)` structurally guarantees that a document can only point to a version belonging to itself.

6. **Private Supabase Storage**:
   * Bucket `ngo-documents` is strictly private (`public = false`).
   * There are **zero** permanent public URLs. All downloads require authenticated RLS evaluation via `storage_can_read_document_file()`.

7. **Soft-Delete & Archive Philosophy**:
   * Archiving preserves full relational history, version files, tags, and audit trails.
   * Inactive or archived groups automatically revoke group-derived document access.

---

## 2. Prerequisites & Tech Stack

* **Node.js**: v20.x or v22.x LTS
* **Package Manager**: `npm` (v10+)
* **Database & Auth**: PostgreSQL 15+ via Supabase
* **Frontend**: React 19, TypeScript 5.8, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide React

---

## 3. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Configure your environment variables:

```bash
# Browser-safe Supabase configuration (Required for frontend)
VITE_SUPABASE_URL=https://<PROJECT-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<SUPABASE-ANON-PUBLIC-KEY>

# Service Role Key (Used ONLY by migration scripts and CI test suites)
# CRITICAL: NEVER expose this key in Vite frontend or bundle into client code!
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE-SERVICE-ROLE-KEY>
```

> [!CAUTION]
> **Security Warning**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security policies. It must **never** be prefixed with `VITE_` and must **never** be bundled into the client application.

---

## 4. Local Development Workflow

Install dependencies:
```bash
npm install
```

Start Vite development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## 5. Database Migrations & Type Generation

### Applying Migrations
All migrations are located in `supabase/migrations/` in sequential timestamp order:

```bash
# Push migrations to remote Supabase project
npx supabase db push
```

### Regenerating TypeScript Database Types
When schema or database functions change, regenerate type definitions:

```bash
npx supabase gen types typescript --project-id <PROJECT-REF> > src/types/database.types.ts
```

---

## 6. Build, Quality & Security Checks

Run the complete verification suite before committing code:

```bash
# 1. TypeScript compilation check
npm run type-check

# 2. Fast Oxlint linter
npm run lint

# 3. Production Vite build
npm run build

# 4. Automated Integration & Security Test Suite
node --experimental-websocket scripts/test_task10_final_integration.mjs
```

---

## 7. Production Documentation & Runbooks

Comprehensive engineering and deployment documentation:

* [**Security & Authorization Model**](docs/security-model.md): Detailed specification of RLS helpers, access hierarchy, and anti-escalation safeguards.
* [**Production Deployment Checklist**](docs/production-checklist.md): Step-by-step verification guide for deploying to production.
* [**Backup & Disaster Recovery Runbook**](docs/backup-and-recovery.md): PostgreSQL backup strategies, independent Storage synchronization, and recovery drills.
* [**V1 Acceptance Test Results**](docs/v1-acceptance-results.md): End-to-end acceptance report for Scenarios A through L and automated security test outcomes.
