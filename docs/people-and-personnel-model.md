# Canonical People & Personnel Architecture Model

This document specifies the canonical people, employment records, personnel files, and account provisioning architecture established in Phase 2.

---

## 1. Core Architecture Philosophy: The Single Canonical Person

In V1, the application treated `members` as the primary human identity record. While this worked for early member-centric portals, it led to structural limitations when managing:
* Full-time and part-time NGO staff/employees who are not NGO voting members.
* Volunteers and consultants requiring organizational tracking.
* Individuals with dual status (e.g. an active NGO member who is hired as an employee or appointed to an executive committee).

### The Canonical Model
```text
                      Canonical Person (`people`)
                                 │
    ┌────────────────────────────┼───────────────────────────┐
    ▼                            ▼                           ▼
NGO Membership Record   Employment Records        Organizational Relationships
 (`members`)             (`employment_records`)    (`person_relationships`)
 - membership_number      - designation            - volunteer / consultant / advisor
 - joined_at / status     - department (`groups`)  - contract terms
                          - supervisor
                          - start / end dates
                                 │
    ┌────────────────────────────┼───────────────────────────┐
    ▼                            ▼                           ▼
Personnel Files         Emergency Contacts       Portal User Profile
 (`personnel_files`)     (`person_emergency_      (`profiles` -> `auth.users`)
 - category               contacts`)              - display preferences
 - sensitivity           - relationship           - must_change_password
 - immutable versions    - phone / contact        - roles & permissions
```

> [!IMPORTANT]
> **One Human = Exactly One `people` Record.**
> Never create multiple person records for the same human. If a person is both an employee and a member, they have one `people` record, one `members` record, and one or more `employment_records`.

---

## 2. Table Specifications & Relationships

### 2.1 `people` (Canonical Human Entity)
* **Table**: `people`
* **Role**: The single source of truth for individual human identity in the organization.
* **Key Fields**:
  * `id`: UUID primary key.
  * `organization_id`: Organization boundary reference.
  * `first_name`, `middle_name`, `last_name`: Legal name parts.
  * `preferred_name`: Display preference.
  * `primary_email`, `secondary_email`: Contact emails.
  * `primary_phone`, `secondary_phone`: Contact phone numbers.
  * `date_of_birth`, `gender`, `address`: Optional personal identity details.
  * `photo_path`: Reference to portrait in private `people-media` bucket.
  * `status`: Enum (`active`, `inactive`, `former`, `deceased`, `archived`).
  * `archived_at`: Soft archival timestamp.

### 2.2 `members` (Legal NGO Membership)
* **Table**: `members`
* **Role**: Captures official NGO membership details.
* **Key Fields**:
  * `person_id`: Foreign key to `people(id)`.
  * `organization_id`: Organization scope.
  * `membership_number`: Unique membership identifier.
  * `joined_at`, `left_at`: Formal membership start and departure dates.
  * `status`: Member status enum (`active`, `inactive`, `suspended`, `former`).
  * `transitional fields`: `first_name`, `last_name`, `email` are retained for backward compatibility with existing V1 queries.

### 2.3 `employment_records` (Employment History)
* **Table**: `employment_records`
* **Role**: Tracks job positions, appointments, re-hires, and employment changes over time.
* **Key Fields**:
  * `person_id`: Reference to `people(id)`.
  * `employee_number`: Unique employee code within the organization.
  * `employment_type`: `permanent`, `full_time`, `part_time`, `contract`, `temporary`, `intern`, `consultant`.
  * `designation`: Official job title.
  * `department_group_id`: References `groups(id)` of type department.
  * `supervisor_person_id`: References supervisor's `people(id)`. Enforces `supervisor_person_id <> person_id` (no self-supervision).
  * `started_at`, `probation_ends_at`, `ended_at`: Key employment milestones.
  * `status`: `active`, `probation`, `on_leave`, `suspended`, `ended`.
  * `termination_reason`: Reason recorded on conclusion of employment.

### 2.4 `profiles` (Portal User Account Linkage)
* **Table**: `profiles`
* **Role**: Links an authenticated Supabase Auth user (`auth.users`) to application permissions and human identity.
* **Key Fields**:
  * `id`: References `auth.users(id)`.
  * `person_id`: References `people(id)`. Unique constraint guarantees **at most one active portal account per person**.
  * `member_id`: Transitional reference for V1 backward compatibility.
  * `status`: `invited`, `active`, `suspended`, `disabled`.
  * `must_change_password`: Boolean flag enforcing password change upon first login or admin temporary password issuance.

### 2.5 `personnel_files` & `personnel_file_versions`
* **Role**: Dedicated, confidential document management system for HR, employment contracts, identity cards, and employee records.
* **Separation**: Personnel files are stored in a dedicated private storage bucket (`personnel-files`) and do NOT mix with general organizational documents.
* **Sensitivity Levels**:
  * `normal`: Resumes, training credentials, certificates.
  * `private`: Employment contracts, appointment letters, performance appraisals.
  * `highly_restricted`: National identity cards, passports, tax registrations, disciplinary documentation.

---

## 3. Account Provisioning Foundation

Account creation is managed via the trusted `provision-user` edge function:

| Feature | Invitation Mode | Temporary Password Mode |
| :--- | :--- | :--- |
| **Trigger** | Admin sends invite | Admin sets/generates temp password |
| **Auth Method** | `inviteUserByEmail` | `createUser` with temporary credential |
| **Initial Profile Status** | `invited` | `active` |
| **`must_change_password`** | `false` (set during signup) | `true` (enforced on first login) |
| **First Login Route** | `/auth/accept-invite` | `/change-password` |
| **Password Visibility** | Never visible to admin | Generated or admin-specified; shown **ONCE** upon response |

### Security Guardrails
1. **Zero Plaintext Password Storage**: No passwords exist in database columns, logs, or metadata.
2. **Super Admin Guard**: Only callers with active `super_admin` role can provision or assign the `super_admin` role to a user.
3. **Compensating Rollback**: If profile or role creation fails after Supabase Auth user creation, the newly created auth user is immediately deleted to avoid orphaned credentials.

---

## 4. Permissions Catalog

| Code | Description | Role Default |
| :--- | :--- | :--- |
| `people.view_directory` | View public organizational people directory | Member, Staff, HR Admin |
| `people.view_private` | View confidential personal details, emergency contacts | HR Admin, Super Admin |
| `people.create` | Create new person identities | HR Admin, Super Admin |
| `people.edit` | Update person details and identity records | HR Admin, Super Admin |
| `people.archive` | Soft-archive person records | HR Admin, Super Admin |
| `employment.view` | View employment records and job history | HR Admin, Super Admin |
| `employment.manage` | Create and update employment records | HR Admin, Super Admin |
| `personnel_files.view` | View personnel files list and metadata | HR Admin, Super Admin |
| `personnel_files.upload` | Upload personnel files and new versions | HR Admin, Super Admin |
| `personnel_files.download` | Download confidential personnel documents | HR Admin, Super Admin |
| `personnel_files.manage` | Manage categories and highly restricted files | HR Admin, Super Admin |
| `personnel_notes.view` | View confidential personnel notes | HR Admin, Super Admin |
| `personnel_notes.manage` | Create and manage personnel notes | HR Admin, Super Admin |
| `portal_users.provision` | Direct temporary-password provisioning | HR Admin, Super Admin |
| `portal_users.invite` | Send portal invitations to people | HR Admin, Super Admin |
| `portal_users.reset_password` | Trigger password reset or temporary reset | HR Admin, Super Admin |
| `portal_users.manage` | Manage user status and security flags | Super Admin |
