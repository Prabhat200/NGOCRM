# Finance & Expenditure Architecture Model

This document specifies the architectural model, schema design, data integrity rules, and security controls for the financial records subsystem established in Phase 2 (Task 12).

---

## 1. Core Financial Architecture Principle

In this system, financial concepts are **strictly separated** into four distinct entities:

```text
       ┌────────────────────────┐
       │          Bill          │
       │ (Amount the Org Owes)  │
       └───────────┬────────────┘
                   │
                   │ settled via
                   ▼
       ┌────────────────────────┐
       │   Payment Allocation   │
       └───────────▲────────────┘
                   │
                   │ funds
┌──────────────┐   │           ┌──────────────────────┐
│   Expense    ├───┘           │       Payment        │
│ (Expenditure │               │ (Actual Money Paid   │
│  Recognized) │               │  out of an Account)  │
└──────────────┘               └──────────────────────┘
       │                                  │
       └────────────────┬─────────────────┘
                        ▼
       ┌────────────────────────────────┐
       │   Finance Files & Versions     │
       │ (Receipts, Invoices, Vouchers) │
       └────────────────────────────────┘
```

### Concept Definitions

| Concept | Meaning | Purpose in System |
| :--- | :--- | :--- |
| **`Bill`** | Amount the organization owes to a vendor or payee before payment is executed. | Tracks liabilities and accounts payable. |
| **`Expense`** | Cost / expenditure recognized by the organization (accrual basis). | Represents the operational cost of activities, occasions, or projects. |
| **`Payment`** | Actual money moving out of a bank, cash, petty cash, or wallet account. | Tracks cash outflows and disbursements. |
| **`Payment Allocation`** | Relational link assigning money from a payment to a bill or expense. | Connects cash movements to obligations and prevents double counting. |
| **`Finance File`** | Supporting evidence (receipts, bills, invoices, vouchers, slips). | Private immutable documentary audit evidence. |

---

## 2. Source of Truth & Anti-Double Counting Rule

### The Double-Counting Problem
When an organization receives an electricity bill for Rs. 12,000, enters the bill, records the expense, and pays Rs. 12,000 from the bank account, poorly designed systems sum all rows and report Rs. 24,000 or Rs. 36,000 in expenditure.

### The System Rule
Financial reports observe strict reporting dimensions:

* **Expenditure Reporting** draws exclusively from **`expenses`**.
* **Cash-Flow / Outflow Reporting** draws exclusively from **`payments`**.
* **Outstanding Liabilities / Payables** draws exclusively from **`bills`** (using remaining unpaid balances).

### Workflow Variations

1. **Direct Purchase / Cash Expense (No Bill)**:
   * Field staff or authorized admin makes a direct purchase (e.g. stationery or refreshments for Rs. 4,500).
   * **`Expense`** is recorded directly (status: `approved`).
   * **`Payment`** is recorded with an allocation directly to `expense_id`.
   * The expense is settled and displays `Paid`.

2. **Vendor Invoice / Obligation First (Bill Flow)**:
   * Organization receives a supplier invoice (e.g. Venue lease for Rs. 20,000).
   * **`Bill`** is recorded (status: `received` or `approved`).
   * Payments are executed against the bill in full or partially.
   * When paid, the bill obligation is satisfied. If linked to an expenditure reporting record, payment allocations prevent duplicate recording.

---

## 3. Database Tables

The finance subsystem consists of 11 dedicated PostgreSQL tables:

| Table | Description |
| :--- | :--- |
| `finance_categories` | Organization-configurable expenditure & income categories. |
| `finance_accounts` | Bank, cash, petty cash, and mobile wallet accounts. |
| `vendors` | External suppliers, vendors, and service providers. |
| `funding_sources` | Grants, donation campaigns, and program funds. |
| `expenses` | Recognized organizational expenditures. |
| `bills` | Incoming vendor invoices and liabilities owed. |
| `payments` | Actual monetary disbursements out of financial accounts. |
| `payment_allocations` | Many-to-many allocation of payments to bills or direct expenses. |
| `finance_files` | Private file metadata for receipts, vouchers, and bills. |
| `finance_file_versions` | Immutable file version records pointing to private Supabase Storage. |
| `finance_sequences` | Concurrency-safe sequential numbering engine (`EXP-`, `BILL-`, `PAY-`). |

---

## 4. Accounts, Currencies & Sensitive Data Protection

### Exact Currency Precision
* All monetary amounts use exact `numeric(18,2)`. Floating-point types (`float`, `double precision`) are strictly prohibited.
* Each organization specifies `organizations.default_currency` (defaults to `NPR`, validated by uppercase 3-letter ISO code constraint `chk_organizations_default_currency`).

### Account Types
Supported account types (`finance_account_type`):
* `bank` (Commercial bank accounts)
* `cash` (Physical vault / office cash)
* `petty_cash` (Daily petty cash funds)
* `wallet` (e-Sewa, Khalti, or mobile money)
* `card` (Organizational debit/credit cards)
* `other`

### Payment Currency Match
* Database trigger `tr_payments_currency_check` strictly requires that any payment executed out of an account has the **same currency** as the account. Multi-currency conversions without explicit exchange rate tracking are rejected.

### Banking Credential Guardrail
* The application **never stores** online banking passwords, transaction PINs, OTP secrets, or card CVVs.
* Bank account numbers stored in `account_reference` are masked in UI and helper views (`•••• 5432`) via `mask_account_reference()`.

---

## 5. Payees: External Vendors vs Internal People

Payments and expenditures can be incurred by:
1. **External Vendors** (`vendor_id` referencing `vendors` table): e.g. Hotels, stationery suppliers, utility providers, print shops.
2. **Internal People** (`person_payee_id` referencing canonical `people` table): e.g. Staff reimbursements, volunteer travel advances, member per diems.
3. **Other / One-off Payees** (`payee_name` text fallback).

> [!NOTE]
> Staff members and volunteers must never be created as duplicate records in the `vendors` table. The canonical `people` table is used directly as the internal payee reference.

### Reimbursements
* Expenses paid out-of-pocket by an individual set `is_reimbursable = true` and `reimbursement_person_id = person.id`.
* The expense remains marked unreimbursed until an actual `payment` is created and allocated to that expense.

---

## 6. Payment Allocations & Math Integrity

### Relational Constraints
Each `payment_allocations` row enforces:
* `allocated_amount > 0`
* `CHECK (num_nonnulls(bill_id, expense_id) = 1)` — exactly one target obligation.
* `UNIQUE (payment_id, bill_id)` and `UNIQUE (payment_id, expense_id)`.

### Allocation Overflow & Overpayment Protection
Trigger `tr_validate_payment_allocation` runs `BEFORE INSERT OR UPDATE` and enforces:
1. $\sum \text{Allocations for Payment} \le \text{Payment Amount}$
2. $\sum \text{Active Allocations for Bill} \le \text{Bill Amount}$
3. $\sum \text{Active Allocations for Expense} \le \text{Expense Amount}$
4. Payment currency must match the target Bill or Expense currency.
5. Cross-organization allocations are rejected.

### Status Synchronization
Trigger `tr_sync_payment_allocation_statuses` runs `AFTER INSERT OR UPDATE OR DELETE` on allocations:
* If $\text{Total Paid} \ge \text{Bill Amount} \implies \text{status} = \text{'paid'}$
* If $0 < \text{Total Paid} < \text{Bill Amount} \implies \text{status} = \text{'partially_paid'}$
* If all payments are voided $\implies \text{status}$ safely reverts to `approved`.

---

## 7. Controlled Lifecycle & Void Rules (Immutability)

Financial records **cannot be casually deleted**. Official financial records use a controlled void/archive lifecycle:

### Physical Deletion Prevention
Trigger `tr_prevent_financial_deletion` blocks SQL `DELETE`:
* Payments with status `completed` cannot be deleted.
* Expenses with status `approved`, `paid`, or `void` cannot be deleted.
* Bills with status `approved`, `partially_paid`, `paid`, or `void` cannot be deleted.
* `finance_file_versions` are strictly append-only and cannot be updated or deleted.

### Controlled RPCs
| Operation | RPC Function | Required Permission | State Transitions |
| :--- | :--- | :--- | :--- |
| **Submit Expense** | `submit_expense(expense_id)` | `finance.create` / `finance.edit` | `draft` $\rightarrow$ `submitted` |
| **Approve Expense** | `approve_expense(expense_id)` | `finance.expenses.approve` | `submitted` $\rightarrow$ `approved` |
| **Reject Expense** | `reject_expense(expense_id, reason)` | `finance.expenses.approve` | `submitted` $\rightarrow$ `rejected` |
| **Void Expense** | `void_expense(expense_id, reason)` | `finance.expenses.void` | any non-void $\rightarrow$ `void` |
| **Execute Payment** | `create_payment(...)` | `finance.payments.create` | inserts completed payment & allocations |
| **Void Payment** | `void_payment(payment_id, reason)` | `finance.payments.void` | `completed` $\rightarrow$ `void`, reverts balances |

---

## 8. Private Financial File Storage & Audit

* **Bucket**: `finance-files` (private, non-public, 50MB size limit).
* **Storage Path**: `{organization_id}/{entity_type}/{entity_id}/{finance_file_id}/{version_id}/{filename}`
* **Allowed Types**: PDF, JPG, JPEG, PNG, WEBP, DOCX, XLSX, CSV, TXT.
* **Storage Policies**:
  * Read requires `storage_can_read_finance_file` $\implies$ requires `finance.files.download` or `finance.files.view`.
  * Upload requires `storage_can_upload_finance_file` $\implies$ requires `finance.files.upload`.
  * Update / Overwrite: **Forbidden** on storage objects. Corrected receipts require uploading a new version (v2).
* **Download Auditing**: File downloads trigger `log_finance_file_download` RPC to write `finance.file_downloaded` to `activity_logs`. Signed URLs and secrets are never logged in audit metadata.
