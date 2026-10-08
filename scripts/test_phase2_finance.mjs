globalThis.WebSocket = class DummyWebSocket {}
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://erqvcmrzdeozbenhecqp.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycXZjbXJ6ZGVvemJlbmhlY3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjk5MTksImV4cCI6MjEwNjk0NTkxOX0.O2wBDH9UqBNVhW-4eQrjshQ7kucNKOKxqm0dVCM3xWg'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycXZjbXJ6ZGVvemJlbmhlY3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM2OTkxOSwiZXhwIjoyMTA2OTQ1OTE5fQ.KNOaSo1W7xOhnhqDyug-FrWSIkQe8qvNyXX4VjUYJwc'
const orgId = '00000000-0000-0000-0000-000000000001'

const anonClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

async function querySql(query) {
  const token = process.env.SUPABASE_ACCESS_TOKEN || ''
  const res = await fetch(`https://api.supabase.com/v1/projects/erqvcmrzdeozbenhecqp/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  })
  return await res.json()
}

async function runFinanceTests() {
  console.log('=================================================================')
  console.log('   PHASE 2 TASK 12: FINANCE & EXPENDITURE FOUNDATION TESTS      ')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`)
      passed++
    } else {
      console.error(`  ✗ [FAIL] ${message}`)
      failed++
    }
  }

  const createdUsers = []

  async function createTestUser(prefix, roleSlug) {
    const email = `${prefix}.${Date.now()}@testfinance.org`
    const password = 'FinanceTestPass123!'
    const { data: userRes, error: userErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (userErr || !userRes.user) {
      throw new Error(`Failed to create ${prefix}: ${userErr?.message}`)
    }
    const userId = userRes.user.id
    createdUsers.push(userId)

    await adminClient.from('profiles').upsert({
      id: userId,
      organization_id: orgId,
      display_name: `${prefix} Test`,
      status: 'active',
    })

    if (roleSlug) {
      const { data: role } = await adminClient.from('roles').select('id').eq('slug', roleSlug).single()
      if (role) {
        await adminClient.from('user_roles').insert({
          organization_id: orgId,
          user_id: userId,
          role_id: role.id,
        })
      }
    }

    const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
    const { error: loginErr } = await client.auth.signInWithPassword({ email, password })
    if (loginErr) throw new Error(`Sign in failed for ${email}: ${loginErr.message}`)

    return { userId, email, client }
  }

  try {
    // ----------------------------------------------------------------------
    // 1. Schema & Organization Default Currency Guardrails
    // ----------------------------------------------------------------------
    console.log('[1] Schema & Organization Default Currency Guardrails:')
    const { data: orgData, error: orgErr } = await adminClient
      .from('organizations')
      .select('id, name, default_currency')
      .eq('id', orgId)
      .single()
    assert(!orgErr && orgData.default_currency === 'NPR', `Organization default currency is NPR (${orgData?.default_currency})`)

    const badCurrRes = await querySql(`
      DO $$
      BEGIN
        UPDATE organizations SET default_currency = 'npr' WHERE id = '${orgId}';
        RAISE EXCEPTION 'Constraint should have failed';
      EXCEPTION WHEN check_violation THEN
        -- expected
      END $$;
    `)
    assert(!badCurrRes.message, 'chk_organizations_default_currency blocks invalid lowercase currency')

    // ----------------------------------------------------------------------
    // 2. Anonymous Access RLS Enforcement
    // ----------------------------------------------------------------------
    console.log('\n[2] Anonymous Client RLS Enforcement:')
    const { data: anonExpenses } = await anonClient.from('expenses').select('*')
    assert(!anonExpenses || anonExpenses.length === 0, 'Anonymous client receives 0 expenses via RLS')

    const { data: anonBills } = await anonClient.from('bills').select('*')
    assert(!anonBills || anonBills.length === 0, 'Anonymous client receives 0 bills via RLS')

    const { data: anonPayments } = await anonClient.from('payments').select('*')
    assert(!anonPayments || anonPayments.length === 0, 'Anonymous client receives 0 payments via RLS')

    const { data: anonAccounts } = await anonClient.from('finance_accounts').select('*')
    assert(!anonAccounts || anonAccounts.length === 0, 'Anonymous client receives 0 finance accounts via RLS')

    const { error: anonStorageErr } = await anonClient.storage
      .from('finance-files')
      .download(`${orgId}/expense/test/test/v1/receipt.pdf`)
    assert(Boolean(anonStorageErr), 'Anonymous client denied downloading from private finance-files storage bucket')

    // ----------------------------------------------------------------------
    // 3. User Setup (Finance Admin, Finance Viewer, Regular Member)
    // ----------------------------------------------------------------------
    console.log('\n[3] Setting up Authenticated Test Personas:')
    const finAdmin = await createTestUser('finadmin', 'finance_admin')
    const finViewer = await createTestUser('finviewer', 'finance_viewer')
    const regMember = await createTestUser('regmember', 'member')
    assert(finAdmin && finViewer && regMember, 'Created personas: Finance Admin, Finance Viewer, Regular Member')

    // Member RLS test
    const { data: memberExpenses } = await regMember.client.from('expenses').select('*')
    assert(!memberExpenses || memberExpenses.length === 0, 'Regular Member receives 0 expenses via RLS')

    const { data: memberAccounts } = await regMember.client.from('finance_accounts').select('*')
    assert(!memberAccounts || memberAccounts.length === 0, 'Regular Member receives 0 finance accounts via RLS')

    const { data: memberBills } = await regMember.client.from('bills').select('*')
    assert(!memberBills || memberBills.length === 0, 'Regular Member receives 0 bills via RLS')

    const { data: memberPayments } = await regMember.client.from('payments').select('*')
    assert(!memberPayments || memberPayments.length === 0, 'Regular Member receives 0 payments via RLS')

    // ----------------------------------------------------------------------
    // 4. Categories, Accounts, Vendors, & Funding Sources
    // ----------------------------------------------------------------------
    console.log('\n[4] Categories, Accounts, Vendors, Funding Sources & Masking:')
    const { data: categories, error: catErr } = await finAdmin.client
      .from('finance_categories')
      .select('id, name, category_type')
    assert(!catErr && categories.length >= 15, `Finance Admin can view categories (${categories?.length} seeded)`)

    const officeCat = categories.find(c => c.name === 'Office Supplies') || categories[0]

    // Create Account via Finance Admin
    const { data: account, error: accErr } = await finAdmin.client
      .from('finance_accounts')
      .insert({
        organization_id: orgId,
        name: 'Main Operating Bank Account',
        account_type: 'bank',
        bank_name: 'Nepal Investment Mega Bank',
        account_reference: '0190100098765432',
        currency: 'NPR',
        is_active: true
      })
      .select()
      .single()
    assert(!accErr && account?.id, `Finance Admin created Account: ${account?.name}`)

    // Masking check
    const maskRes = await querySql(`SELECT mask_account_reference('${account.account_reference}') as masked;`)
    assert(maskRes[0]?.masked === '•••• 5432', `Account reference masked correctly: ${maskRes[0]?.masked}`)

    // Create Vendor via Finance Admin
    const { data: vendor, error: venErr } = await finAdmin.client
      .from('vendors')
      .insert({
        organization_id: orgId,
        name: `Himalayan Stationers & Print ${Date.now()}`,
        contact_person: 'Ramesh Karki',
        email: 'sales@himalayanstationers.com',
        phone: '+977-1-4455667',
        tax_identifier: 'PAN-109283746'
      })
      .select()
      .single()
    assert(!venErr && vendor?.id, `Finance Admin created Vendor: ${vendor?.name}`)

    // Create Funding Source via Finance Admin
    const { data: fund, error: fundErr } = await finAdmin.client
      .from('funding_sources')
      .insert({
        organization_id: orgId,
        name: 'Community Youth Empowerment Grant',
        reference_code: 'CYE-2026',
        starts_at: '2026-01-01',
        ends_at: '2026-12-31'
      })
      .select()
      .single()
    assert(!fundErr && fund?.id, `Finance Admin created Funding Source: ${fund?.name}`)

    // ----------------------------------------------------------------------
    // 5. Expense Lifecycle & Approval Security
    // ----------------------------------------------------------------------
    console.log('\n[5] Expense Creation, Submission & Controlled Approval:')
    const { data: exp, error: expErr } = await finAdmin.client
      .from('expenses')
      .insert({
        organization_id: orgId,
        title: 'Field Office Stationery & Paper',
        category_id: officeCat.id,
        amount: 4500.00,
        currency: 'NPR',
        expense_date: '2026-10-08',
        vendor_id: vendor.id,
        funding_source_id: fund.id,
        status: 'draft'
      })
      .select()
      .single()
    assert(!expErr && exp?.id, `Expense created in draft: Rs. ${exp?.amount}`)

    // Submit expense via finAdmin client RPC
    const { data: submitRes, error: submitErr } = await finAdmin.client.rpc('submit_expense', {
      p_expense_id: exp.id
    })
    assert(!submitErr && submitRes?.success, `submit_expense RPC succeeded: ${submitRes?.expense_number}`)

    // Non-approver (Finance Viewer) attempts approval
    const { error: unauthApproveErr } = await finViewer.client.rpc('approve_expense', {
      p_expense_id: exp.id
    })
    assert(Boolean(unauthApproveErr), `Non-approver (Finance Viewer) approval denied: ${unauthApproveErr?.message}`)

    // Authorized approval via finAdmin client RPC
    const { data: approveRes, error: approveErr } = await finAdmin.client.rpc('approve_expense', {
      p_expense_id: exp.id
    })
    assert(!approveErr && approveRes?.success, 'approve_expense RPC succeeded for authorized Finance Admin')

    const { data: approvedExp } = await finAdmin.client
      .from('expenses')
      .select('status, approved_at, approved_by')
      .eq('id', exp.id)
      .single()
    assert(approvedExp.status === 'approved' && approvedExp.approved_by === finAdmin.userId, 'Expense approved and approved_by matches finAdmin')

    // ----------------------------------------------------------------------
    // 6. Bills, Partial Payments & Status Synchronization
    // ----------------------------------------------------------------------
    console.log('\n[6] Bills, Partial Payments & Status Synchronization:')
    const dynBillNo = 'BILL-2026-' + String(Date.now()).slice(-6)
    const { data: bill, error: billErr } = await finAdmin.client
      .from('bills')
      .insert({
        organization_id: orgId,
        bill_number: dynBillNo,
        vendor_invoice_number: 'INV-88991',
        vendor_id: vendor.id,
        title: 'Annual Event Hall Lease',
        category_id: officeCat.id,
        amount: 20000.00,
        currency: 'NPR',
        bill_date: '2026-10-01',
        due_date: '2026-11-01',
        status: 'approved'
      })
      .select()
      .single()
    assert(!billErr && bill?.id, `Created Bill: Rs. ${bill?.amount || billErr?.message}`)

    // Initial Bill balance check
    const { data: bal1, error: bal1Err } = await finAdmin.client.rpc('get_bill_balance', { p_bill_id: bill.id })
    assert(!bal1Err && bal1?.total_paid === 0 && bal1?.remaining_balance === 20000, `Initial Bill balance is Rs. 20,000 (Paid: 0)`)

    // Payment 1: Rs. 8,000 via finAdmin client RPC
    const { data: pay1Res, error: pay1Err } = await finAdmin.client.rpc('create_payment', {
      p_account_id: account.id,
      p_amount: 8000.00,
      p_payment_date: '2026-10-08',
      p_payment_method: 'bank_transfer',
      p_allocations: [{ bill_id: bill.id, allocated_amount: 8000.00 }],
      p_vendor_id: vendor.id,
      p_payee_name: vendor.name,
      p_reference_number: 'TRX-001'
    })
    const pay1Id = pay1Res?.payment_id
    assert(!pay1Err && pay1Id, `Payment 1 recorded (Rs. 8,000): ${pay1Res?.payment_number || pay1Err?.message}`)

    // Check Bill balance after Payment 1
    const { data: bal2 } = await finAdmin.client.rpc('get_bill_balance', { p_bill_id: bill.id })
    const { data: billAfterPay1 } = await finAdmin.client.from('bills').select('status').eq('id', bill.id).single()
    assert(
      bal2?.total_paid === 8000 &&
      bal2?.remaining_balance === 12000 &&
      billAfterPay1.status === 'partially_paid',
      `Bill partially paid: total_paid=8000, balance=12000, status=${billAfterPay1?.status}`
    )

    // Payment 2: Rs. 12,000 via finAdmin client RPC
    const { data: pay2Res, error: pay2Err } = await finAdmin.client.rpc('create_payment', {
      p_account_id: account.id,
      p_amount: 12000.00,
      p_payment_date: '2026-10-08',
      p_payment_method: 'bank_transfer',
      p_allocations: [{ bill_id: bill.id, allocated_amount: 12000.00 }],
      p_vendor_id: vendor.id,
      p_payee_name: vendor.name,
      p_reference_number: 'TRX-002'
    })
    const pay2Id = pay2Res?.payment_id
    assert(!pay2Err && pay2Id, `Payment 2 recorded (Rs. 12,000): ${pay2Res?.payment_number || pay2Err?.message}`)

    // Check Bill balance after Payment 2
    const { data: bal3 } = await finAdmin.client.rpc('get_bill_balance', { p_bill_id: bill.id })
    const { data: billAfterPay2 } = await finAdmin.client.from('bills').select('status').eq('id', bill.id).single()
    assert(
      bal3?.total_paid === 20000 &&
      bal3?.remaining_balance === 0 &&
      billAfterPay2.status === 'paid',
      `Bill fully settled: total_paid=20000, balance=0, status=${billAfterPay2?.status}`
    )

    // ----------------------------------------------------------------------
    // 7. Overpayment & Allocation Overflow Guardrails
    // ----------------------------------------------------------------------
    console.log('\n[7] Overpayment and Allocation Overflow Guardrails:')
    // Attempt 3rd payment to overpay bill
    const { error: overpayErr } = await finAdmin.client.rpc('create_payment', {
      p_account_id: account.id,
      p_amount: 500.00,
      p_payment_date: '2026-10-08',
      p_payment_method: 'cash',
      p_allocations: [{ bill_id: bill.id, allocated_amount: 500.00 }]
    })
    assert(Boolean(overpayErr), `Database trigger blocked overpaying a settled bill: ${overpayErr?.message}`)

    // Attempt payment where allocations > payment amount
    const { error: overflowErr } = await finAdmin.client.rpc('create_payment', {
      p_account_id: account.id,
      p_amount: 1000.00,
      p_payment_date: '2026-10-08',
      p_payment_method: 'cash',
      p_allocations: [{ bill_id: bill.id, allocated_amount: 1500.00 }]
    })
    assert(Boolean(overflowErr), `Database trigger blocked allocations exceeding payment amount: ${overflowErr?.message}`)

    // ----------------------------------------------------------------------
    // 8. Direct Expense Settlement Without Bill
    // ----------------------------------------------------------------------
    console.log('\n[8] Direct Expense Settlement Without Bill:')
    const { data: directPayRes, error: directPayErr } = await finAdmin.client.rpc('create_payment', {
      p_account_id: account.id,
      p_amount: 4500.00,
      p_payment_date: '2026-10-08',
      p_payment_method: 'cash',
      p_allocations: [{ expense_id: exp.id, allocated_amount: 4500.00 }],
      p_vendor_id: vendor.id,
      p_payee_name: vendor.name,
      p_reference_number: 'CASH-VOUCHER-01'
    })
    const directPayId = directPayRes?.payment_id
    assert(!directPayErr && directPayId, `Direct cash payment recorded for Expense: Rs. 4,500`)

    const { data: expBal } = await finAdmin.client.rpc('get_expense_balance', { p_expense_id: exp.id })
    const { data: expAfterPay } = await finAdmin.client.from('expenses').select('status').eq('id', exp.id).single()
    assert(
      expBal?.remaining_balance === 0 &&
      expBal?.is_paid === true &&
      expAfterPay.status === 'paid',
      `Expense directly marked paid: balance=0, status=${expAfterPay.status}`
    )

    // ----------------------------------------------------------------------
    // 9. Void Payment & Status Reversion
    // ----------------------------------------------------------------------
    console.log('\n[9] Payment Voiding, Balance Recalculation & Status Reversion:')
    const { data: voidRes, error: voidErr } = await finAdmin.client.rpc('void_payment', {
      p_payment_id: pay2Id,
      p_reason: 'Bank transaction reversed by issuer'
    })
    assert(!voidErr && voidRes?.success, 'void_payment RPC executed with mandatory reason')

    const { data: voidedPayment } = await finAdmin.client
      .from('payments')
      .select('status, voided_at, void_reason')
      .eq('id', pay2Id)
      .single()
    assert(
      voidedPayment.status === 'void' && voidedPayment.void_reason === 'Bank transaction reversed by issuer',
      `Payment status updated to void with reason preserved`
    )

    // Verify Bill balance and status reverted
    const { data: balAfterVoid } = await finAdmin.client.rpc('get_bill_balance', { p_bill_id: bill.id })
    const { data: billAfterVoid } = await finAdmin.client.from('bills').select('status').eq('id', bill.id).single()
    assert(
      balAfterVoid?.total_paid === 8000 &&
      balAfterVoid?.remaining_balance === 12000 &&
      billAfterVoid.status === 'partially_paid',
      `Bill balance safely reverted after void: total_paid=8000, balance=12000, status=${billAfterVoid.status}`
    )

    // ----------------------------------------------------------------------
    // 10. Physical Deletion Prevention
    // ----------------------------------------------------------------------
    console.log('\n[10] Physical Deletion Prevention on Financial Records:')
    // (a) RLS check: Client attempt deletes 0 rows; record remains intact
    await finAdmin.client.from('payments').delete().eq('id', pay1Id)
    const { data: payStillExists } = await adminClient.from('payments').select('id').eq('id', pay1Id).single()
    assert(Boolean(payStillExists), 'RLS policy prevents authenticated client deletion of completed payments')

    // (b) Database trigger check: Direct SQL DELETE raises trigger exception
    const delPaySqlRes = await querySql(`
      DO $$
      BEGIN
        DELETE FROM payments WHERE id = '${pay1Id}';
        RAISE EXCEPTION 'Trigger should have failed!';
      EXCEPTION WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%cannot be physically deleted%' THEN
          RAISE;
        END IF;
      END $$;
    `)
    assert(!delPaySqlRes.message, 'Database trigger tr_prevent_financial_deletion() blocks DELETE on completed payment')

    // (c) Direct SQL DELETE on approved/paid expense raises trigger exception
    const delExpSqlRes = await querySql(`
      DO $$
      BEGIN
        DELETE FROM expenses WHERE id = '${exp.id}';
        RAISE EXCEPTION 'Trigger should have failed!';
      EXCEPTION WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%cannot be physically deleted%' THEN
          RAISE;
        END IF;
      END $$;
    `)
    assert(!delExpSqlRes.message, 'Database trigger tr_prevent_financial_deletion() blocks DELETE on approved/paid expense')

    // ----------------------------------------------------------------------
    // 11. Private Financial Storage & Download Audit
    // ----------------------------------------------------------------------
    console.log('\n[11] Private Financial Storage & Immutable Evidence Versioning:')
    const testFileId = crypto.randomUUID()
    const testVerId = crypto.randomUUID()

    const { data: fFile, error: fErr } = await finAdmin.client
      .from('finance_files')
      .insert({
        id: testFileId,
        organization_id: orgId,
        entity_type: 'expense',
        entity_id: exp.id,
        expense_id: exp.id,
        file_type: 'receipt',
        title: 'Stationery Store VAT Bill & Slip'
      })
      .select()
      .single()
    assert(!fErr && fFile?.id, `Created finance file evidence entry`)

    const { data: fVer, error: fVerErr } = await finAdmin.client
      .from('finance_file_versions')
      .insert({
        id: testVerId,
        organization_id: orgId,
        finance_file_id: testFileId,
        version_number: 1,
        storage_path: `${orgId}/expense/${exp.id}/${testFileId}/${testVerId}/vat_bill.pdf`,
        filename: 'vat_bill.pdf',
        file_size: 4096,
        mime_type: 'application/pdf',
        notes: 'Initial scan of physical receipt'
      })
      .select()
      .single()
    assert(!fVerErr && fVer?.id, `Created immutable finance file version v1`)

    // Verify file version deletion is blocked by both RLS and trigger
    await finAdmin.client.from('finance_file_versions').delete().eq('id', testVerId)
    const { data: verStillExists } = await adminClient.from('finance_file_versions').select('id').eq('id', testVerId).single()
    assert(Boolean(verStillExists), 'RLS policy prevents client deletion of finance_file_versions')

    const delVerSqlRes = await querySql(`
      DO $$
      BEGIN
        DELETE FROM finance_file_versions WHERE id = '${testVerId}';
        RAISE EXCEPTION 'Trigger should have failed!';
      EXCEPTION WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%strictly immutable%' THEN
          RAISE;
        END IF;
      END $$;
    `)
    assert(!delVerSqlRes.message, 'Database trigger tr_file_versions_no_delete blocks DELETE on finance file versions')

    // Audit download RPC
    const { data: auditRpcRes, error: auditRpcErr } = await finAdmin.client.rpc('log_finance_file_download', {
      p_finance_file_id: testFileId,
      p_version_id: testVerId
    })
    assert(!auditRpcErr && auditRpcRes?.success, 'log_finance_file_download RPC executed and audited')

    const { data: auditLogs } = await adminClient
      .from('activity_logs')
      .select('action, entity_type, entity_id, metadata')
      .eq('action', 'finance.file_downloaded')
      .eq('entity_id', testFileId)
      .order('created_at', { ascending: false })
      .limit(1)
    const auditLog = auditLogs?.[0]
    assert(auditLog && auditLog.metadata?.filename === 'vat_bill.pdf', 'Audit log captured finance.file_downloaded event without leaking signed URLs')

    // ----------------------------------------------------------------------
    // 12. Concurrency-Safe Sequential Numbers
    // ----------------------------------------------------------------------
    console.log('\n[12] Concurrency-Safe Sequence Generation:')
    const seqRes = await querySql(`
      SELECT array[
        generate_finance_number('${orgId}', 'payment'),
        generate_finance_number('${orgId}', 'payment'),
        generate_finance_number('${orgId}', 'payment')
      ] as nums;
    `)
    const generatedNums = seqRes[0]?.nums
    const isUnique = new Set(generatedNums).size === 3
    assert(isUnique, `Generated unique sequential payment numbers: ${generatedNums?.join(', ')}`)

  } finally {
    // Cleanup temporary test accounts
    console.log('\n[Cleanup] Cleaning up temporary test user accounts...')
    for (const uid of createdUsers) {
      await adminClient.from('user_roles').delete().eq('user_id', uid)
      await adminClient.from('profiles').delete().eq('id', uid)
      await adminClient.auth.admin.deleteUser(uid)
    }
  }

  // ----------------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------------
  console.log('\n=================================================================')
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runFinanceTests().catch((err) => {
  console.error('Fatal test execution error:', err)
  process.exit(1)
})
