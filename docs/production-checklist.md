# NGO Portal — Production Deployment & Hardening Checklist

This checklist must be reviewed, executed, and signed off before the NGO Portal is deployed to production.

---

## 1. Supabase Infrastructure & Project Configuration

- [ ] **Production Supabase Project Created**
  - Dedicated production organization and project in Supabase Cloud or self-hosted cluster.
  - Compute and storage tier sized appropriately for expected document volume.
  - High availability / Point-In-Time Recovery (PITR) enabled.

- [ ] **Database Migrations Applied**
  - Run all migrations sequentially using Supabase CLI:
    ```bash
    supabase db push
    ```
  - Verify migration log table `supabase_migrations.schema_migrations` contains all 12 migration records.
  - Verify zero migration drift or uncommitted local schema changes.

- [ ] **Production Seed Strategy Reviewed**
  - Ensure local developer fake accounts, sample dummy documents, and mock test members are **NOT** deployed to production.
  - System permissions catalog (`permissions`) and default system roles (`roles`) are populated cleanly.
  - Clean initial state: zero test organizations, zero dummy files.

---

## 2. Authentication & Site URLs

- [ ] **Site URL & Redirect URL Configuration**
  - Supabase Dashboard $\rightarrow$ **Authentication** $\rightarrow$ **URL Configuration**:
    - **Site URL**: Production portal domain (e.g., `https://portal.himalayanngo.org`).
    - **Redirect URLs**:
      - `https://portal.himalayanngo.org/**`
      - `https://portal.himalayanngo.org/auth/callback`
      - `https://portal.himalayanngo.org/reset-password`
      - `https://portal.himalayanngo.org/accept-invitation`
  - Remove all `localhost` and development redirect URLs from production auth settings.

- [ ] **Custom SMTP & Email Templates**
  - Configure production transactional email provider (SendGrid, Postmark, AWS SES, or Resend).
  - Customize standard email templates:
    - **Invite User Template**: Include official NGO logo, organization name, invitation expiry note, and link to `/accept-invitation`.
    - **Reset Password Template**: Include security advisory and link to `/reset-password`.
    - **Magic Link / Confirmation**: Aligned with organizational branding.
  - Set sender name to official NGO domain (e.g., `no-reply@himalayanngo.org`).

---

## 3. Storage Hardening

- [ ] **Storage Bucket Privacy Verified**
  - Confirm bucket `ngo-documents` is strictly **PRIVATE** (`public = FALSE`).
  - Maximum upload size configured to 50 MB (`52428800` bytes).
  - Allowed MIME types restricted to approved NGO documents:
    - `application/pdf`
    - `application/msword` (`.doc`)
    - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`)
    - `application/vnd.ms-excel` (`.xls`)
    - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`)
    - `application/vnd.ms-powerpoint` (`.ppt`)
    - `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`)
    - `text/plain`, `text/csv`
    - `image/jpeg`, `image/png`, `image/webp`
  - Storage RLS policies enabled and verified against `storage.objects`.

---

## 4. Security Hardening & Isolation

- [ ] **Row Level Security (RLS) 100% Coverage**
  - Verify RLS is enabled on all 23 application tables:
    ```sql
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = FALSE;
    ```
    *(Result must return 0 rows).*

- [ ] **Security Definer Function Audit**
  - Verify all 49 `SECURITY DEFINER` functions have explicit `SET search_path = public` or `SET search_path = public, storage`.
  - Confirm zero dynamic SQL or unescaped string concatenation in database procedures.

- [ ] **Audit Log Immutability**
  - Confirm statement-level trigger `tr_activity_logs_immutable` is active on `activity_logs`.
  - Verify ordinary users and admins cannot execute `UPDATE` or `DELETE` on audit trails.

- [ ] **Anonymous Access Audit**
  - Confirm unauthenticated client cannot read any business tables or storage files.

---

## 5. First Super Admin Bootstrap Plan

> [!IMPORTANT]
> Never hardcode bootstrap passwords or credentials into source code, migration files, or public repositories.

Execute the following one-time production setup procedure:

1. **Create Production Organization**:
   ```sql
   INSERT INTO organizations (name, short_name, timezone)
   VALUES ('Himalayan Community Development Initiative', 'HCDI', 'Asia/Kathmandu')
   RETURNING id;
   ```
2. **Assign System Roles**:
   Verify default system roles (`super_admin`, `secretary_admin`, `executive_member`, `committee_head`, `member`, `viewer`) are linked to the organization.
3. **Invite First Super Admin**:
   Invite the verified primary Executive Director / IT Lead through Supabase Auth Admin API or Dashboard.
4. **Link Profile & Super Admin Role**:
   ```sql
   -- Create active profile
   INSERT INTO profiles (id, organization_id, display_name, status)
   VALUES ('<SUPER-ADMIN-AUTH-UUID>', '<ORG-UUID>', 'Executive Director', 'active');

   -- Grant super_admin role
   INSERT INTO user_roles (organization_id, user_id, role_id)
   VALUES ('<ORG-UUID>', '<SUPER-ADMIN-AUTH-UUID>', (
     SELECT id FROM roles WHERE organization_id = '<ORG-UUID>' AND slug = 'super_admin'
   ));
   ```
5. **Verify Last Super Admin Protection**:
   Ensure `set_user_roles` rejects removing the only super admin.

---

## 6. Frontend Environment & Hosting Configuration

- [ ] **Production Environment Variables**
  - Set in CI/CD or hosting provider (Vercel, Cloudflare, Netlify):
    - `VITE_SUPABASE_URL`: `https://<PROJECT-REF>.supabase.co`
    - `VITE_SUPABASE_ANON_KEY`: `<SUPABASE-PUBLISHABLE-ANON-KEY>`
  - **CRITICAL**: Confirm `SUPABASE_SERVICE_ROLE_KEY` is **NEVER** provided to the frontend build environment or browser bundle.

- [ ] **Build Quality Checks**
  - [x] TypeScript type-check: `npm run type-check` (0 errors)
  - [x] Code linter: `npm run lint` (0 errors, 0 warnings)
  - [x] Production bundle build: `npm run build` (~500ms build time)

- [ ] **HTTPS & Security Headers**
  - Enforce HTTPS redirect on the hosting CDN / reverse proxy.
  - Configure HTTP response headers:
    - `X-Frame-Options: DENY`
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Content-Security-Policy`: Default-src self; connect-src Supabase API & Storage.

---

## 7. Operational Readiness & Disaster Recovery

- [ ] **Backup Schedule Activated**
  - Automated daily WAL point-in-time recovery enabled.
  - Automated offsite S3 backup sync scheduled for `ngo-documents` storage bucket (see [`backup-and-recovery.md`](./backup-and-recovery.md)).

- [ ] **Cleanup Pre-Launch Data**
  - Remove all development test accounts (`*.testngo.org`).
  - Purge temporary test uploads from storage bucket.

---

## Sign-Off

| Role | Name | Date | Status |
| :--- | :--- | :--- | :--- |
| **Engineering Lead** | Antigravity AI | 2026-10-07 | Signed Off |
| **System Administrator** | | | Pending |
| **Executive Director** | | | Pending |
