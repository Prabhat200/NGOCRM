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
