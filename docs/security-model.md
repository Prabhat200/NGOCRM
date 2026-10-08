# NGO Portal - Security & Authorization Model

This document outlines the security architecture, authorization boundaries, and access rules governing the NGO Operations & Document Portal.

---

## 1. Security Philosophy & The Security Boundary

> [!IMPORTANT]
> **The frontend is NEVER the security boundary.**
> React components and navigation guards (`<Can permission="...">`) exist exclusively for user experience and visual clarity. Actual authorization is enforced unconditionally at the database layer via PostgreSQL **Row Level Security (RLS)** and **Supabase Storage policies**. An unauthorized user cannot discover, query, or download documents by manipulating browser state, crafting API requests, or requesting direct URLs.

---

## 2. Active Profile Requirement

Authentication alone (an entry in `auth.users`) is insufficient for system access:
* Access requires an authenticated user with a profile record where `status = 'active'`.
* Profiles with status `invited`, `suspended`, or `disabled` are rejected by all authorization helpers and cannot read application records.

---

## 3. Organization Boundary (Tenant Isolation)

Every organizational record is strictly scoped by `organization_id`:
* The helper function `current_organization_id()` derives the caller's organization from `auth.uid() -> profiles.organization_id`. Client-provided organization parameters are never trusted.
* Cross-organization foreign keys prevent records in Organization A from referencing entities in Organization B.
* Even **Super Admins** are strictly bound to their own organization and cannot query or manipulate another NGO's data.

---

## 4. Dual-Layer Authorization Architecture

Access control evaluates two distinct layers:

### Layer A: System Permissions (RBAC)
Governed by: `auth.uid()` $\rightarrow$ `user_roles` $\rightarrow$ `roles` $\rightarrow$ `role_permissions` $\rightarrow$ `permissions`.
* Permission codes (e.g., `documents.view`, `documents.create`, `occasions.edit`, `users.manage_roles`) represent global capabilities.
* Checked via `has_permission(p_code)`.

### Layer B: Resource Access Grants (ACL)
Governed by:
* `document_user_access` (Direct user grants, supporting expiration via `expires_at`).
* `document_group_access` (Grants to committees/departments via active membership in `group_members`).
* `document_role_access` (Grants to specific portal roles).

### Access Hierarchy
Resource permissions follow strict hierarchy:
$$\text{manage } (3) > \text{edit } (2) > \text{view } (1) > \text{none } (0)$$
When multiple grants apply, `get_document_access_level(document_id)` returns the highest applicable level.

---

## 5. Document Access Modes

Documents support three distinct access modes:

1. **`organization`**:
   * Readable by any active organization user holding the base `documents.view` permission.
2. **`restricted`**:
   * Requires `documents.view` **AND** an effective resource grant $\ge 1$ (`view`) via direct user grant, group membership, or role assignment (or creator/Super Admin).
3. **`private`**:
   * Highly restricted: visible only to the creator, direct user grant (`document_user_access`), or Super Admin.

---

## 6. Document Operations & Helpers

| Capability | Helper Function | Evaluation Rule |
| :--- | :--- | :--- |
| **View** | `can_view_document(doc_id)` | Active user + same org + `documents.view` + access mode rules. |
| **Edit** | `can_edit_document(doc_id)` | Active user + same org + `documents.edit` + resource level $\ge 2$ (or creator / Super Admin). |
| **Manage** | `can_manage_document(doc_id)` | Active user + same org + `documents.manage_access` + resource level $= 3$ (or creator / Super Admin). |
| **Download**| `storage_can_read_document_file(...)` | `can_view_document(doc_id)` **AND** `has_permission('documents.download')`. |

---

## 7. Storage Security

* **Bucket**: `ngo-documents` is strictly **PRIVATE** (`public = false`).
* **Path Convention**: `{organization_id}/{document_id}/{version_id}/{filename}`
* **Storage Read**: Validates organization match, parses `document_id`, and requires `can_view_document()` + `documents.download`.
* **Storage Upload**: Requires `documents.create` or `documents.upload_version` + `can_edit_document()`.
* **Storage Update & Delete**: **Denied**. Physical version files are immutable. Archiving a document preserves physical versions.

---

## 8. Anti-Escalation Safeguards

1. **No Self-Role Assignment**: `user_roles` policy rejects `user_id = auth.uid()`.
2. **Super Admin Assignment Protection**: Only an existing Super Admin can assign the `super_admin` role.
3. **Self-Profile Protection**: Users cannot modify their own `organization_id`, `status`, or `member_id`.
4. **Append-Only Auditing**: `activity_logs` rejects direct client inserts/updates; records are generated via `log_activity()` deriving the actor server-side.
5. **Creator Bootstrap**: `create_document()` RPC atomically creates the document record and grants initial `manage` access to the creator without exposing open ACL tables.

---

## 9. Canonical People & Personnel Access Model (Phase 2)

### 9.1 The Identity Boundary
* **`people` (Canonical Human)**: Represents a single human identity within the organization. A person may be a member, an employee, a volunteer, an advisor, or hold multiple organizational roles simultaneously without identity duplication.
* **`members` (NGO Membership)**: Governs legal NGO membership parameters (`membership_number`, `joined_at`, `status`). Linked strictly to `people(id)`.
* **`employment_records` (Job History)**: Stores employment contracts, designations, departments (`groups`), supervisors, and statuses (`active`, `probation`, `on_leave`, `suspended`, `ended`).
* **`profiles` (Portal Account)**: Links an authenticated `auth.users` identity to `people.id`. A user is no longer required to be an NGO member to hold an active portal login (e.g. non-member staff or contractors).
* **Single Account Constraint**: Guaranteed by `UNIQUE (person_id)` on `profiles` when non-null.

### 9.2 Personnel Data Classification
1. **Directory Data (`people.view_directory`)**:
   * General employee/member directory: display name, photo, designation, department/group, status.
2. **Private Personnel Data (`people.view_private`)**:
   * Personal email, phone numbers, home address, date of birth, emergency contacts.
   * Access restricted to HR Admins, Super Admins, and self-access for own record.
3. **Personnel Files (`personnel_files.view`, `personnel_files.download`, `personnel_files.manage`)**:
   * Completely separated from normal organizational documents.
   * Categorized by sensitivity level:
     * `normal`: Resumes, certificates, training documents.
     * `private`: Employment contracts, appointment letters, performance appraisals.
     * `highly_restricted`: National IDs, passports, PAN documents, disciplinary records.
   * Highly restricted documents require `personnel_files.manage` authorization.

---

## 10. Personnel Storage Security

1. **`personnel-files` Bucket**:
   * Strictly **PRIVATE** (`public = false`).
   * Path: `{organization_id}/{person_id}/{personnel_file_id}/{version_id}/{filename}`
   * Read access (`storage_can_read_personnel_file`): Requires authenticated profile + same organization + `personnel_files.download` + file visibility validation.
   * Upload access (`storage_can_upload_personnel_file`): Requires `personnel_files.upload`.
   * Update and Delete: Default-deny (immutable versioning).
   * Downloads are audited server-side via `log_personnel_file_download` RPC (`personnel_file.downloaded`).
2. **`people-media` Bucket**:
   * Strictly **PRIVATE** (`public = false`).
   * Path: `{organization_id}/{person_id}/profile/{filename}`
   * Read access (`storage_can_read_people_media`): Allowed for active members of the same organization.
   * Upload access (`storage_can_upload_people_media`): Allowed for the subject themselves or administrators with `people.edit`.

---

## 11. Portal Account Provisioning & Password Security Lifecycle

### 11.1 Zero Password Storage Architecture
* **Under NO circumstance are plaintext or reversible passwords stored in application tables** (`people`, `profiles`, `members`, etc.). Passwords reside exclusively in Supabase Auth's bcrypt/argon2 hashing infrastructure.
* Passwords are never written to `activity_logs`, console logs, HTTP metadata, or localStorage.
* Administrators cannot view existing employee passwords. The system only supports:
  1. Sending a password reset link.
  2. Generating/setting a temporary password.

### 11.2 Account Setup Modes
1. **Invitation Mode (Recommended Default)**:
   * Admin selects person, email, and roles.
   * System triggers `inviteUserByEmail` via trusted `provision-user` edge function.
   * User creates their own password upon accepting the secure invite.
   * Profile created with `status = 'invited'`, `must_change_password = false`.
2. **Temporary Password Mode**:
   * Admin chooses to provision immediately with a temporary password.
   * System generates a cryptographically strong 16-character temporary credential (or validates admin-provided password against security policies).
   * Account created via Admin API with `status = 'active'`, `must_change_password = true`.
   * Temporary password is returned **ONCE** in the provisioning HTTP response to the authorized administrator; never stored or logged.

### 11.3 Forced First-Login Password Change
* Profiles with `must_change_password = true` are blocked by `ProtectedRoute` from accessing any portal routes and immediately redirected to `/change-password`.
* Once the user updates their password via Supabase Auth, the secure `complete_first_login_password_change()` RPC sets `must_change_password = false` and logs `portal_user.password_changed`.

