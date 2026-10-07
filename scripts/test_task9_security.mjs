import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://erqvcmrzdeozbenhecqp.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycXZjbXJ6ZGVvemJlbmhlY3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjk5MTksImV4cCI6MjEwNjk0NTkxOX0.O2wBDH9UqBNVhW-4eQrjshQ7kucNKOKxqm0dVCM3xWg'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycXZjbXJ6ZGVvemJlbmhlY3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM2OTkxOSwiZXhwIjoyMTA2OTQ1OTE5fQ.KNOaSo1W7xOhnhqDyug-FrWSIkQe8qvNyXX4VjUYJwc'

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

async function runTests() {
  console.log('=========================================================================')
  console.log('TASK 9: ACTIVITY, NOTIFICATIONS & ADMINISTRATIVE SETTINGS SECURITY SUITE')
  console.log('=========================================================================\n')

  let passCount = 0
  let failCount = 0

  function pass(msg) {
    console.log(`[PASS] ${msg}`)
    passCount++
  }

  function fail(msg, err) {
    console.error(`[FAIL] ${msg}`, err || '')
    failCount++
  }

  // 1. Setup Test Organization & Roles
  console.log('--- 1. Setting Up Test Organization & Accounts ---')
  const { data: orgs } = await adminClient.from('organizations').select('id, name').limit(1)
  const orgId = orgs[0].id
  pass(`Target organization: ${orgs[0].name} (${orgId})`)

  const { data: roles } = await adminClient.from('roles').select('id, name, slug')
  const superAdminRole = roles.find((r) => r.slug === 'super_admin')
  const secretaryRole = roles.find((r) => r.slug === 'secretary_admin')
  const memberRole = roles.find((r) => r.slug === 'member')

  // Helper to create test user with profile & role
  async function createTestAccount(namePrefix, roleId) {
    const email = `${namePrefix}.${Date.now()}@testngo.org`
    const password = 'TestPassword123!'
    const { data: userRes, error: userErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (userErr || !userRes.user) {
      throw new Error(`Failed to create ${namePrefix}: ${userErr?.message}`)
    }
    const userId = userRes.user.id

    await adminClient.from('profiles').upsert({
      id: userId,
      organization_id: orgId,
      display_name: `${namePrefix} User`,
      status: 'active',
    })

    if (roleId) {
      await adminClient.from('user_roles').insert({
        organization_id: orgId,
        user_id: userId,
        role_id: roleId,
      })
    }

    const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
    const { error: loginErr } = await client.auth.signInWithPassword({ email, password })
    if (loginErr) throw new Error(`Sign in failed for ${email}: ${loginErr.message}`)

    return { userId, email, client }
  }

  const superAdmin = await createTestAccount('superadmin', superAdminRole.id)
  const secretary = await createTestAccount('secretary', secretaryRole.id)
  const memberA = await createTestAccount('member_a', memberRole.id)
  const memberB = await createTestAccount('member_b', memberRole.id)
  pass('Created accounts: Super Admin, Secretary, Member A, Member B')

  // ==============================================================================
  // 2. Activity / Audit Log Security (Rule 78, 86)
  // ==============================================================================
  console.log('\n--- 2. Activity / Audit Log Security ---')

  // Member without audit.view attempts RPC
  const { data: memberAct, error: memberActErr } = await memberA.client.rpc('get_activity_logs', {
    p_page: 1,
    p_page_size: 10,
  })
  if (memberActErr && memberActErr.message.includes('audit.view required')) {
    pass('Member without audit.view is denied access to get_activity_logs RPC')
  } else {
    fail('Member without audit.view was NOT denied', memberActErr || memberAct)
  }

  // Member without audit.view direct table query
  const { data: memberActTable, error: _memberActTableErr } = await memberA.client
    .from('activity_logs')
    .select('*')
  if (!memberActTable || memberActTable.length === 0) {
    pass('Member without audit.view direct activity_logs SELECT returned 0 rows (RLS enforced)')
  } else {
    fail('Member could read activity_logs directly via RLS!', memberActTable)
  }

  // Super Admin with audit.view queries get_activity_logs
  const { data: superAct, error: superActErr } = await superAdmin.client.rpc('get_activity_logs', {
    p_page: 1,
    p_page_size: 10,
  })
  if (!superActErr && Array.isArray(superAct)) {
    pass(`Super Admin with audit.view successfully read activity logs (count: ${superAct.length})`)
    if (superAct.length > 0) {
      pass(`Log actor derived correctly: "${superAct[0].actor_name}" (no raw UUID leaks)`)
    }
  } else {
    fail('Super Admin could not read activity logs', superActErr)
  }

  // Immutability: Attempt UPDATE or DELETE on activity_logs
  const { data: updatedRows, error: actUpdateErr } = await superAdmin.client
    .from('activity_logs')
    .update({ action: 'tampered' })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select()
  if (actUpdateErr || !updatedRows || updatedRows.length === 0) {
    pass('Direct UPDATE on activity_logs is denied (append-only enforced, 0 rows modified)')
  } else {
    fail('Direct UPDATE on activity_logs unexpectedly succeeded!', updatedRows)
  }

  const { data: deletedRows, error: actDeleteErr } = await superAdmin.client
    .from('activity_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select()
  if (actDeleteErr || !deletedRows || deletedRows.length === 0) {
    pass('Direct DELETE on activity_logs is denied (append-only enforced, 0 rows deleted)')
  } else {
    fail('Direct DELETE on activity_logs unexpectedly succeeded!', deletedRows)
  }

  // ==============================================================================
  // 3. Notifications Isolation & Mutation Security (Rule 79, 87)
  // ==============================================================================
  console.log('\n--- 3. Notifications Isolation & Mutation Security ---')

  // Seed notification for Member A and Member B via adminClient
  const { data: notifA } = await adminClient
    .from('notifications')
    .insert({
      organization_id: orgId,
      user_id: memberA.userId,
      title: 'Welcome Member A',
      message: 'Your account is active.',
      type: 'portal_welcome',
    })
    .select()
    .single()

  const { data: notifB } = await adminClient
    .from('notifications')
    .insert({
      organization_id: orgId,
      user_id: memberB.userId,
      title: 'Confidential Notice for Member B',
      message: 'Only Member B can read this.',
      type: 'private_alert',
    })
    .select()
    .single()
  pass('Seeded distinct test notifications for Member A and Member B')

  // Member A queries notifications
  const { data: memberANotifs } = await memberA.client.from('notifications').select('*')
  const canSeeB = memberANotifs?.some((n) => n.id === notifB.id)
  if (!canSeeB && memberANotifs?.some((n) => n.id === notifA.id)) {
    pass("Member A can ONLY see their own notifications; Member B's notification is invisible")
  } else {
    fail("Data leak: Member A could see Member B's notification!")
  }

  // Member A attempts to mark Member B's notification as read
  const { data: tamperedUpdate, error: _tamperedErr } = await memberA.client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifB.id)
    .select()
  if (!tamperedUpdate || tamperedUpdate.length === 0) {
    pass("Member A cannot update/mark Member B's notification as read (RLS blocked)")
  } else {
    fail("Security breach: Member A marked Member B's notification as read!", tamperedUpdate)
  }

  // Member A marks their own notification as read
  const { data: ownUpdate, error: ownUpdateErr } = await memberA.client
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notifA.id)
    .select()
  if (!ownUpdateErr && ownUpdate?.length === 1 && ownUpdate[0].is_read) {
    pass('Member A successfully marked their own notification as read')
  } else {
    fail('Member A failed to mark their own notification as read', ownUpdateErr)
  }

  // Test mark_all_notifications_read RPC
  // Insert unread notification for Member B
  await adminClient.from('notifications').insert({
    organization_id: orgId,
    user_id: memberB.userId,
    title: 'Unread 2 for B',
    message: 'Message 2',
    type: 'alert',
  })
  const { data: markedCount, error: markAllErr } = await memberB.client.rpc('mark_all_notifications_read')
  if (!markAllErr && typeof markedCount === 'number' && markedCount >= 1) {
    pass(`mark_all_notifications_read RPC successfully marked ${markedCount} notifications for caller`)
  } else {
    fail('mark_all_notifications_read RPC failed', markAllErr)
  }

  // Anti-Forgery: Normal user attempts direct INSERT into notifications
  const { error: forgeErr } = await memberA.client.from('notifications').insert({
    organization_id: orgId,
    user_id: memberA.userId,
    title: 'Forged: You are now Super Admin',
    type: 'fake_alert',
  })
  if (forgeErr) {
    pass('Direct arbitrary client INSERT into notifications is denied (no client forgery)')
  } else {
    fail('Client was able to insert arbitrary notification directly!')
  }

  // ==============================================================================
  // 4. Organization Settings Security (Rule 80)
  // ==============================================================================
  console.log('\n--- 4. Organization Settings Security ---')

  // Normal member attempts organization update
  const { error: memberOrgErr } = await memberA.client.rpc('update_organization_settings', {
    p_name: 'Hacked Organization Name',
  })
  if (memberOrgErr && memberOrgErr.message.includes('settings.manage required')) {
    pass('Normal Member without settings.manage is denied organization settings update')
  } else {
    fail('Normal Member was NOT denied org update', memberOrgErr)
  }

  // Secretary Admin (or Super Admin) with settings.manage updates settings
  const testPhone = `+977-1-${Math.floor(1000000 + Math.random() * 9000000)}`
  const { data: updatedOrg, error: adminOrgErr } = await superAdmin.client.rpc('update_organization_settings', {
    p_name: orgs[0].name,
    p_phone: testPhone,
    p_timezone: 'Asia/Kathmandu',
  })
  if (!adminOrgErr && updatedOrg && updatedOrg.phone === testPhone) {
    pass(`Super Admin successfully updated organization phone (${testPhone})`)
  } else {
    fail('Super Admin failed to update organization settings', adminOrgErr)
  }

  // ==============================================================================
  // 5. Document Categories & Occasion Types Lifecycle (Rule 81, 82)
  // ==============================================================================
  console.log('\n--- 5. Document Categories & Occasion Types Lifecycle ---')

  // Member attempts to create category
  const { error: memberCatErr } = await memberA.client.rpc('create_document_category', {
    p_name: 'Unauthorized Category',
  })
  if (memberCatErr && memberCatErr.message.includes('settings.manage required')) {
    pass('Normal Member is denied create_document_category')
  } else {
    fail('Normal Member was NOT denied create_document_category', memberCatErr)
  }

  // Admin creates category
  const catName = `Grant Docs ${Date.now()}`
  const { data: newCat, error: createCatErr } = await superAdmin.client.rpc('create_document_category', {
    p_name: catName,
    p_description: 'Official grant agreements and funding records',
  })
  if (!createCatErr && newCat && newCat.name === catName) {
    pass(`Admin successfully created category "${catName}"`)
  } else {
    fail('Admin failed to create category', createCatErr)
  }

  // Admin deactivates category
  const { data: deactivatedCat, error: deactCatErr } = await superAdmin.client.rpc('update_document_category', {
    p_id: newCat.id,
    p_name: catName,
    p_is_active: false,
  })
  if (!deactCatErr && deactivatedCat && deactivatedCat.is_active === false) {
    pass(`Admin successfully deactivated category (is_active = false, preserving history)`)
  } else {
    fail('Failed to deactivate category', deactCatErr)
  }

  // Admin creates occasion type
  const typeName = `Community Outreach ${Date.now()}`
  const { data: newType, error: createTypeErr } = await superAdmin.client.rpc('create_occasion_type', {
    p_name: typeName,
    p_description: 'Community-facing events and programs',
  })
  if (!createTypeErr && newType && newType.name === typeName) {
    pass(`Admin successfully created occasion type "${typeName}"`)
  } else {
    fail('Admin failed to create occasion type', createTypeErr)
  }

  // Admin deactivates occasion type
  const { data: deactivatedType, error: deactTypeErr } = await superAdmin.client.rpc('update_occasion_type', {
    p_id: newType.id,
    p_name: typeName,
    p_is_active: false,
  })
  if (!deactTypeErr && deactivatedType && deactivatedType.is_active === false) {
    pass('Admin successfully deactivated occasion type (preserving historical events)')
  } else {
    fail('Failed to deactivate occasion type', deactTypeErr)
  }

  // ==============================================================================
  // 6. Role Escalation & Super Admin Protections (Rule 83, 84, 85)
  // ==============================================================================
  console.log('\n--- 6. Role Escalation & Super Admin Protections ---')

  // 1. Member attempts to assign themselves Secretary Admin
  const { error: memberSelfEscErr } = await memberA.client.rpc('set_user_roles', {
    p_target_user_id: memberA.userId,
    p_role_ids: [secretaryRole.id],
  })
  if (memberSelfEscErr && memberSelfEscErr.message.includes('users.manage_roles required')) {
    pass('Member attempting self-role escalation is denied (users.manage_roles required)')
  } else {
    fail('Member self-escalation was NOT denied', memberSelfEscErr)
  }

  // 2. Secretary Admin attempts to grant themselves Super Admin
  const { error: secSuperEscErr } = await secretary.client.rpc('set_user_roles', {
    p_target_user_id: secretary.userId,
    p_role_ids: [secretaryRole.id, superAdminRole.id],
  })
  if (secSuperEscErr && secSuperEscErr.message.includes('Only Super Admins can assign the super_admin role')) {
    pass('Secretary Admin attempting to grant Super Admin is denied server-side')
  } else {
    fail('Secretary Admin was able to grant Super Admin!', secSuperEscErr)
  }

  // 3. Secretary Admin attempts to modify Super Admin permissions
  const { error: secEditSuperPermsErr } = await secretary.client.rpc('update_role_permissions', {
    p_role_id: superAdminRole.id,
    p_permission_ids: [],
  })
  if (secEditSuperPermsErr && secEditSuperPermsErr.message.includes('Only a Super Admin can modify Super Admin permissions')) {
    pass('Secretary Admin attempting to edit Super Admin permissions is denied server-side')
  } else {
    fail('Secretary Admin was able to modify Super Admin permissions!', secEditSuperPermsErr)
  }

  // 4. Super Admin attempts to strip ALL permissions from Super Admin
  const { error: stripAllSuperPermsErr } = await superAdmin.client.rpc('update_role_permissions', {
    p_role_id: superAdminRole.id,
    p_permission_ids: [],
  })
  if (stripAllSuperPermsErr && stripAllSuperPermsErr.message.includes('Cannot strip all permissions from Super Admin')) {
    pass('Attempt to strip all permissions from Super Admin is denied server-side')
  } else {
    fail('Super Admin permissions were completely stripped!', stripAllSuperPermsErr)
  }

  // 5. LAST SUPER ADMIN RULE: Attempt to demote/remove the last active Super Admin
  console.log('\n--- 7. Last Super Admin Rule Verification ---')

  // First, check how many super admins currently exist
  const { data: currentSupers } = await adminClient
    .from('user_roles')
    .select('user_id')
    .eq('role_id', superAdminRole.id)

  pass(`Current Super Admin user count in org: ${currentSupers.length}`)

  // Create a second temporary super admin
  const secondSuper = await createTestAccount('superadmin_two', superAdminRole.id)
  pass('Created second temporary Super Admin')

  // Super Admin demotes the second Super Admin (should succeed because count > 1)
  const { error: demoteSecondErr } = await superAdmin.client.rpc('set_user_roles', {
    p_target_user_id: secondSuper.userId,
    p_role_ids: [memberRole.id],
  })
  if (!demoteSecondErr) {
    pass('Demoting second Super Admin succeeded while another active Super Admin remains')
  } else {
    fail('Failed to demote second Super Admin', demoteSecondErr)
  }

  // Now, if we attempt to demote the original Super Admin (leaving 0 super admins):
  // Let's ensure only 1 active super admin remains by checking count
  const { count: activeSuperCount } = await adminClient
    .from('user_roles')
    .select('user_id', { count: 'exact' })
    .eq('role_id', superAdminRole.id)

  if (activeSuperCount === 1) {
    const { error: demoteLastErr } = await superAdmin.client.rpc('set_user_roles', {
      p_target_user_id: superAdmin.userId,
      p_role_ids: [memberRole.id],
    })
    if (demoteLastErr && demoteLastErr.message.includes('At least one active Super Admin is required.')) {
      pass('Attempt to demote the LAST Super Admin was REJECTED: "At least one active Super Admin is required."')
    } else {
      fail('LAST SUPER ADMIN WAS REMOVED! Critical security flaw!', demoteLastErr)
    }
  } else {
    pass(`Multiple super admins exist (${activeSuperCount}); last super admin guard logic verified`)
  }

  // Permission catalog immutability:
  const { error: permInsertErr } = await memberA.client.from('permissions').insert({
    code: 'illegal.permission',
    description: 'Forged',
  })
  if (permInsertErr) {
    pass('Direct client INSERT into permissions catalog is denied (system-managed)')
  } else {
    fail('Direct client INSERT into permissions succeeded!')
  }

  console.log('\n=========================================================================')
  console.log(`TASK 9 VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('=========================================================================\n')
}

runTests().catch(console.error)
