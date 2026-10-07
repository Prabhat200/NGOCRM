# NGO Portal — V1 Acceptance Test Results

This document records the formal end-to-end acceptance results for the V1 release candidate of the NGO Operations & Document Portal, executed against the production candidate environment on October 7, 2026.

---

## Acceptance Test Summary

| Total Scenarios Tested | Passed | Failed | Manual / Partial | Overall Verdict |
| :---: | :---: | :---: | :---: | :---: |
| **12 Core Scenarios (A - L)** | **12** | **0** | **0** | **PASSED (Production Candidate Ready)** |
| **Integration Security Suite (28 Tests)** | **28** | **0** | **0** | **PASSED (100% Green)** |

---

## Detailed Scenario Breakdown

### Scenario A — Occasion + General Document
* **Description**: Secretary Admin creates *Annual General Meeting 2026* and uploads *AGM Notice* with `access_mode = 'organization'`.
* **Execution**: Tested via automated client queries and UI flows.
* **Verification**:
  - Normal Member can find the document in search and filter views.
  - Normal Member can open document detail.
  - Normal Member can download file if holding `documents.download`.
  - Occasion-to-document relationship is properly indexed and displayed.
* **Result**: **PASS**

---

### Scenario B — Restricted Document Access
* **Description**: Secretary uploads *Executive Committee Minutes* with `access_mode = 'restricted'` granted specifically to the *Executive Committee*.
* **Execution**: Evaluated across Normal Member and Executive Member personas.
* **Verification**:
  - Normal Member: Listing returns 0; search by exact title returns 0; direct fetch via UUID returns empty; Storage download is blocked by RLS.
  - Executive Member: Listing includes document; search discovers document; document detail opens; download succeeds.
* **Result**: **PASS**

---

### Scenario C — Document Versioning & Immutability
* **Description**: Secretary uploads a corrected version (v2) of a document.
* **Execution**: Executed through `upload_document_version` RPC and Storage upload.
* **Verification**:
  - Version 2 becomes `current_version_id` atomically.
  - Version 1 record is preserved in `document_versions` with historical metadata.
  - Version 1 and Version 2 have independent, immutable storage paths (`.../v1/...`, `.../v2/...`).
  - `activity_logs` records `document.version_uploaded` event with previous and new version numbers.
  - Ordinary users cannot overwrite, mutate, or delete historical version records.
* **Result**: **PASS**

---

### Scenario D — Real-Time Access Revocation
* **Description**: Executive Member's membership in the Executive Committee is deactivated.
* **Execution**: Executed without logging the member out or terminating their session.
* **Verification**:
  - Subsequent document query immediately returns 0 records for the restricted document.
  - Direct UUID access fails with empty/not found response.
  - Storage file download is immediately rejected by PostgreSQL Storage RLS.
  - Frontend cache invalidation / re-query reflects revoked state immediately.
* **Result**: **PASS**

---

### Scenario E — Document Archive & Restore Integrity
* **Description**: Secretary Admin archives a restricted document with multiple versions, activity logs, tags, and access grants.
* **Execution**: Executed via `archive_document` and `restore_document` RPCs.
* **Verification**:
  - Document disappears from default active document list.
  - Document remains visible in "Archived" filter for users with `documents.archive` permission.
  - No physical files are deleted from Storage during archival.
  - Version history, tags, occasion linkages, and access ACLs remain 100% intact.
  - Restoring the document immediately returns it to active listings with complete history.
* **Result**: **PASS**

---

### Scenario F — Member + Portal Access Invitation
* **Description**: Secretary adds member *Ram Sharma*, assigns to Executive Committee, and invites Ram to the portal.
* **Execution**: Executed via `invite_member` RPC and Supabase Auth admin invitation.
* **Verification**:
  - Existing member record in `members` is linked via `profiles.member_id`.
  - Zero duplicate member records are created.
  - Selected roles (`member` + `executive_member`) are assigned to `user_roles`.
  - Profile status transitions from `invited` to `active` upon accepting invitation.
* **Result**: **PASS**

---

### Scenario G — Privilege Escalation Prevention
* **Description**: Normal Member attempts unauthorized elevation across roles, groups, documents, and organizations.
* **Execution**: Automated direct PostgREST mutations and RPC attacks.
* **Verification**:
  - Self-assignment of `super_admin` role $\rightarrow$ **DENIED** (`Only Super Admins can assign the super_admin role`).
  - Direct insertion into `group_members` $\rightarrow$ **DENIED** (Violates RLS insert policy).
  - Direct insertion into `document_user_access` $\rightarrow$ **DENIED** (Violates RLS insert policy).
  - Mutation of `profiles.organization_id` or `status` $\rightarrow$ **DENIED** (Enforced by RLS update policy).
* **Result**: **PASS**

---

### Scenario H — Last Super Admin Protection
* **Description**: An organization attempts to demote, remove, or delete its sole active Super Admin.
* **Execution**: Executed via `set_user_roles` RPC in an organization with exactly one active Super Admin.
* **Verification**:
  - Operation is aborted with exception: `"Action denied: At least one active Super Admin is required."`
  - Organization is protected from accidental administrative lockout.
* **Result**: **PASS**

---

### Scenario I — Settings & Category Lifecycle
* **Description**: Admin creates a document category *Grant Documents*, verifies availability, and deactivates it.
* **Execution**: Tested via Category management interface and Document upload forms.
* **Verification**:
  - Category appears in Document Upload category dropdown when active.
  - Deactivating the category removes it from new document upload selection.
  - Existing documents assigned to *Grant Documents* continue displaying the category badge normally without broken foreign keys.
* **Result**: **PASS**

---

### Scenario J — Member Privacy Protection
* **Description**: Normal Member browses the member directory.
* **Execution**: Tested via `get_members_directory` RPC.
* **Verification**:
  - Safe fields returned: `first_name`, `last_name`, `membership_number`, `position_title`, `status`, `joined_date`.
  - Sensitive administrative and personal fields (`phone`, `address`, `notes`, `emergency_contact`) are completely omitted from the network payload.
  - Admins with `members.view_sensitive` can query full records via authorized administrative endpoints.
* **Result**: **PASS**

---

### Scenario K — Notification Privacy & Unread Indicators
* **Description**: Notifications evaluated across User A and User B.
* **Execution**: Cross-user notification queries and `mark_all_notifications_read` RPC.
* **Verification**:
  - User A can only query notifications where `user_id = auth.uid()`.
  - Attempting to query or update User B's notifications returns 0 rows.
  - Marking all notifications as read updates `is_read = TRUE` exclusively for the caller.
  - Topbar unread badge updates in real time.
* **Result**: **PASS**

---

### Scenario L — Audit Log Immutability & Access Control
* **Description**: Admin and Member access to system audit logs.
* **Execution**: Tested via `/activity` route, `activity_logs` queries, and attempted delete mutations.
* **Verification**:
  - Users with `audit.view` can browse, search, and filter activity logs.
  - Normal Members without `audit.view` are denied navigation access and receive 0 records from direct table queries.
  - Ordinary users and Super Admins attempting `DELETE` or `UPDATE` on `activity_logs` are blocked by statement-level database trigger `tr_activity_logs_immutable`.
  - Audit records are strictly append-only.
* **Result**: **PASS**

---

## Automated Security Test Suite Results (scripts/test_task10_final_integration.mjs)

```text
=========================================================================
TASK 10: FINAL INTEGRATION, SECURITY HARDENING & PRODUCTION READINESS
=========================================================================

--- 1. Setting Up Multi-Tenant Environments (Org A & Org B) ---
Using Org A: Himalayan Community Development Initiative (00000000-0000-0000-0000-000000000001)
Using Org B: cf67220c-b27b-4c95-b9b7-4cf1231ea096
Created accounts for Org A personas: Super Admin, Secretary, Executive, Member, Suspended

--- 2. Anonymous Access Audit ---
[PASS] Anonymous cannot SELECT documents
[PASS] Anonymous cannot SELECT members
[PASS] Anonymous cannot SELECT groups
[PASS] Anonymous cannot SELECT activity logs
[PASS] Anonymous cannot SELECT notifications

--- 3. Cross-Organization Isolation Attack ---
[PASS] Org A Member cannot read Org B document
[PASS] Org A Member cannot read Org B member
[PASS] Org A Super Admin cannot read Org B document (tenant scoped)
[PASS] Org A Member cannot download Org B storage file
[PASS] Org B settings remain unmolested after Org A mutation attempt

--- 4. Active Profile Status Enforcement ---
[PASS] Suspended user receives 0 documents (server-side RLS enforced)
[PASS] Suspended user receives 0 members

--- 5. Document Visibility Modes & Direct UUID Attacks ---
[PASS] Normal Member can view organization-wide document
[PASS] Executive Member can view restricted document
[PASS] Normal Member cannot view restricted document (even with direct UUID)
[PASS] Search leakage prevented (0 results when searching exact restricted title)
[PASS] Creator (Secretary) can view private document
[PASS] Unrelated Executive cannot view private document

--- 6. Group Archival Access Revocation ---
[PASS] Archiving group automatically revokes group-derived document access
[PASS] Restoring group automatically restores group-derived document access

--- 7. Current Version Integrity & Immutability ---
[PASS] Database composite FK rejects setting current_version_id to another document’s version
[PASS] Ordinary user cannot UPDATE historical document version (immutable)

--- 8. Member Privacy Directory Protection ---
[PASS] Directory RPC hides sensitive personal fields (phone/address/notes) from ordinary members

--- 9. Privilege Escalation & Last Super Admin Rule ---
[PASS] Member self-insertion into group_members is denied by RLS
[PASS] Member self-insertion into document_user_access is denied by RLS
[PASS] Secretary Admin cannot self-grant Super Admin
[PASS] Demoting the LAST active Super Admin is denied: "At least one active Super Admin is required."

--- 10. Audit Log Immutability ---
[PASS] Trigger strictly prevents DELETE on activity_logs

=========================================================================
TASK 10 FINAL INTEGRATION VERIFICATION: 28 PASSED, 0 FAILED
=========================================================================
```
