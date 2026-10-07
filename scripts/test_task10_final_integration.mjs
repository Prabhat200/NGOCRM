import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://erqvcmrzdeozbenhecqp.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycXZjbXJ6ZGVvemJlbmhlY3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjk5MTksImV4cCI6MjEwNjk0NTkxOX0.O2wBDH9UqBNVhW-4eQrjshQ7kucNKOKxqm0dVCM3xWg'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycXZjbXJ6ZGVvemJlbmhlY3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM2OTkxOSwiZXhwIjoyMTA2OTQ1OTE5fQ.KNOaSo1W7xOhnhqDyug-FrWSIkQe8qvNyXX4VjUYJwc'

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
const anonClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })

async function runFinalIntegrationTests() {
  console.log('=========================================================================')
  console.log('TASK 10: FINAL INTEGRATION, SECURITY HARDENING & PRODUCTION READINESS')
  console.log('=========================================================================\n')

  let passCount = 0
  let failCount = 0
  const results = []

  function record(scenario, passed, note = '') {
    if (passed) {
      console.log(`[PASS] ${scenario}${note ? ` - ${note}` : ''}`)
      passCount++
      results.push({ scenario, status: 'PASS', note })
    } else {
      console.error(`[FAIL] ${scenario}${note ? ` - ${note}` : ''}`)
      failCount++
      results.push({ scenario, status: 'FAIL', note })
    }
  }

  // Helper to create test user with profile & role
  async function createTestAccount(namePrefix, targetOrgId, roleSlug = 'member', status = 'active') {
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

    // Fetch role
    const { data: roleData } = await adminClient
      .from('roles')
      .select('id')
      .eq('organization_id', targetOrgId)
      .eq('slug', roleSlug)
      .single()

    // Create profile
    await adminClient.from('profiles').upsert({
      id: userId,
      organization_id: targetOrgId,
      display_name: `${namePrefix} User`,
      status,
    })

    if (roleData) {
      await adminClient.from('user_roles').insert({
        organization_id: targetOrgId,
        user_id: userId,
        role_id: roleData.id,
      })
    }

    const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
    const { error: loginErr } = await client.auth.signInWithPassword({ email, password })
    if (loginErr) throw new Error(`Sign in failed for ${email}: ${loginErr.message}`)

    return { userId, email, client, orgId: targetOrgId }
  }

  // 1. Setup Test Organizations: Org A & Org B
  console.log('--- 1. Setting Up Multi-Tenant Environments (Org A & Org B) ---')
  const orgAId = '00000000-0000-0000-0000-000000000001'
  await adminClient.from('organizations').update({ name: 'Himalayan Community Development Initiative' }).eq('id', orgAId)
  console.log(`Using Org A: Himalayan Community Development Initiative (${orgAId})`)

  // Ensure Org B exists for cross-tenant testing
  let orgBId
  const { data: orgBCheck } = await adminClient
    .from('organizations')
    .select('id')
    .neq('id', orgAId)
    .limit(1)

  if (orgBCheck && orgBCheck.length > 0) {
    orgBId = orgBCheck[0].id
    await adminClient.from('organizations').update({ name: 'Isolated Second NGO (Org B)' }).eq('id', orgBId)
  } else {
    const { data: newOrgB } = await adminClient
      .from('organizations')
      .insert({
        name: 'Isolated Second NGO (Org B)',
        short_name: 'ISNGO',
        timezone: 'Asia/Kathmandu',
      })
      .select()
      .single()
    orgBId = newOrgB.id

    // Seed basic roles for Org B
    const { data: perms } = await adminClient.from('permissions').select('id, code')
    const { data: bSuperRole } = await adminClient
      .from('roles')
      .insert({
        organization_id: orgBId,
        name: 'Super Admin',
        slug: 'super_admin',
        is_system_role: true,
      })
      .select()
      .single()

    const { data: bMemberRole } = await adminClient
      .from('roles')
      .insert({
        organization_id: orgBId,
        name: 'Member',
        slug: 'member',
        is_system_role: true,
      })
      .select()
      .single()

    // Assign perms
    const bPerms = perms.map((p) => ({ organization_id: orgBId, role_id: bSuperRole.id, permission_id: p.id }))
    await adminClient.from('role_permissions').insert(bPerms)

    const memberPerms = perms
      .filter((p) => ['documents.view', 'members.view', 'occasions.view', 'groups.view'].includes(p.code))
      .map((p) => ({ organization_id: orgBId, role_id: bMemberRole.id, permission_id: p.id }))
    await adminClient.from('role_permissions').insert(memberPerms)
  }
  console.log(`Using Org B: ${orgBId}`)

  // Seed Org B test document & member
  const { data: orgBMember } = await adminClient
    .from('members')
    .insert({
      organization_id: orgBId,
      first_name: 'Confidential',
      last_name: 'Person B',
      email: 'personB@orgB.org',
      status: 'active',
    })
    .select()
    .single()

  const orgBSuperUser = await createTestAccount('superadmin_b', orgBId, 'super_admin')
  const { data: orgBDoc } = await adminClient
    .from('documents')
    .insert({
      organization_id: orgBId,
      title: 'Secret Org B Financial Strategy',
      access_mode: 'organization',
      created_by: orgBSuperUser.userId,
    })
    .select()
    .single()

  // Create Org A Persona Accounts
  const orgASuper = await createTestAccount('superadmin_a', orgAId, 'super_admin')
  const orgASecretary = await createTestAccount('secretary_a', orgAId, 'secretary_admin')
  const orgAExecutive = await createTestAccount('executive_a', orgAId, 'executive_member')
  const orgAMember = await createTestAccount('member_a', orgAId, 'member')
  const orgASuspended = await createTestAccount('suspended_a', orgAId, 'member', 'suspended')
  console.log('Created accounts for Org A personas: Super Admin, Secretary, Executive, Member, Suspended')

  // ==============================================================================
  // SCENARIO 1: Anonymous Access Denial Audit (Section 11)
  // ==============================================================================
  console.log('\n--- 2. Anonymous Access Audit ---')
  const { data: anonDocs } = await anonClient.from('documents').select('*')
  record('Anonymous cannot SELECT documents', !anonDocs || anonDocs.length === 0)

  const { data: anonMembers } = await anonClient.from('members').select('*')
  record('Anonymous cannot SELECT members', !anonMembers || anonMembers.length === 0)

  const { data: anonGroups } = await anonClient.from('groups').select('*')
  record('Anonymous cannot SELECT groups', !anonGroups || anonGroups.length === 0)

  const { data: anonActivity } = await anonClient.from('activity_logs').select('*')
  record('Anonymous cannot SELECT activity logs', !anonActivity || anonActivity.length === 0)

  const { data: anonNotifs } = await anonClient.from('notifications').select('*')
  record('Anonymous cannot SELECT notifications', !anonNotifs || anonNotifs.length === 0)

  // ==============================================================================
  // SCENARIO 2: Cross-Organization Isolation Attack (Section 14)
  // ==============================================================================
  console.log('\n--- 3. Cross-Organization Isolation Attack ---')

  // Org A Member attempts to SELECT Org B document
  const { data: crossDoc } = await orgAMember.client
    .from('documents')
    .select('*')
    .eq('id', orgBDoc.id)
  record('Org A Member cannot read Org B document', !crossDoc || crossDoc.length === 0)

  // Org A Member attempts to SELECT Org B member
  const { data: crossMember } = await orgAMember.client
    .from('members')
    .select('*')
    .eq('id', orgBMember.id)
  record('Org A Member cannot read Org B member', !crossMember || crossMember.length === 0)

  // Org A Super Admin attempts to SELECT Org B document (Super Admin is strictly tenant-scoped)
  const { data: superCrossDoc } = await orgASuper.client
    .from('documents')
    .select('*')
    .eq('id', orgBDoc.id)
  record('Org A Super Admin cannot read Org B document (tenant scoped)', !superCrossDoc || superCrossDoc.length === 0)

  // Org A user attempts Storage download with Org B path
  const crossStoragePath = `${orgBId}/${orgBDoc.id}/fake-version/document.pdf`
  const { error: crossStorageErr } = await orgAMember.client.storage
    .from('ngo-documents')
    .download(crossStoragePath)
  record('Org A Member cannot download Org B storage file', Boolean(crossStorageErr))

  // Org A user attempts update of Org B settings via RPC
  const crossMutationName = `Hacked Org B Test ${Date.now()}`
  await orgASuper.client.rpc('update_organization_settings', {
    p_name: crossMutationName,
  })
  // Because RPC updates current_organization_id(), Org A updates Org A, never Org B
  const { data: orgBVerify } = await adminClient.from('organizations').select('name').eq('id', orgBId).single()
  record('Org B settings remain unmolested after Org A mutation attempt', orgBVerify.name !== crossMutationName)
  // Restore Org A name
  await adminClient.from('organizations').update({ name: 'Himalayan Community Development Initiative' }).eq('id', orgAId)

  // ==============================================================================
  // SCENARIO 3: Active Profile Status Enforcement (Section 12, 13)
  // ==============================================================================
  console.log('\n--- 4. Active Profile Status Enforcement ---')
  const { data: suspendedDocs } = await orgASuspended.client.from('documents').select('*')
  record('Suspended user receives 0 documents (server-side RLS enforced)', !suspendedDocs || suspendedDocs.length === 0)

  const { data: suspendedMembers } = await orgASuspended.client.from('members').select('*')
  record('Suspended user receives 0 members', !suspendedMembers || suspendedMembers.length === 0)

  // ==============================================================================
  // SCENARIO 4: Document Visibility Modes & Direct UUID Attack (Section 15, 26-29)
  // ==============================================================================
  console.log('\n--- 5. Document Visibility Modes & Direct UUID Attacks ---')

  // Create Executive Committee in Org A
  const { data: execGroup } = await adminClient
    .from('groups')
    .insert({
      organization_id: orgAId,
      name: `Executive Committee Test ${Date.now()}`,
      type: 'committee',
    })
    .select()
    .single()

  // Create member record for Executive Member and link to group
  const { data: execMemberRecord } = await adminClient
    .from('members')
    .insert({
      organization_id: orgAId,
      first_name: 'Executive',
      last_name: 'Leader',
      email: orgAExecutive.email,
      status: 'active',
    })
    .select()
    .single()

  await adminClient.from('profiles').update({ member_id: execMemberRecord.id }).eq('id', orgAExecutive.userId)

  await adminClient.from('group_members').insert({
    organization_id: orgAId,
    group_id: execGroup.id,
    member_id: execMemberRecord.id,
    role_in_group: 'Executive Member',
    is_active: true,
  })

  // Document 1: Organization wide
  const { data: orgWideDoc } = await adminClient
    .from('documents')
    .insert({
      organization_id: orgAId,
      title: 'Annual General Meeting Notice 2026',
      access_mode: 'organization',
      created_by: orgASecretary.userId,
    })
    .select()
    .single()

  // Document 2: Restricted to Executive Committee
  const { data: restrictedDoc } = await adminClient
    .from('documents')
    .insert({
      organization_id: orgAId,
      title: 'Executive Committee Confidential Strategy',
      access_mode: 'restricted',
      created_by: orgASecretary.userId,
    })
    .select()
    .single()

  await adminClient.from('document_group_access').insert({
    organization_id: orgAId,
    document_id: restrictedDoc.id,
    group_id: execGroup.id,
    access_level: 'view',
  })

  // Document 3: Private to Secretary only
  const { data: privateDoc } = await adminClient
    .from('documents')
    .insert({
      organization_id: orgAId,
      title: 'Personal Draft Note (Private)',
      access_mode: 'private',
      created_by: orgASecretary.userId,
    })
    .select()
    .single()

  // Verify Organization-wide doc
  const { data: memberSeeOrgDoc } = await orgAMember.client
    .from('documents')
    .select('id, title')
    .eq('id', orgWideDoc.id)
  record('Normal Member can view organization-wide document', memberSeeOrgDoc?.length === 1)

  // Verify Restricted doc: Executive sees it, Normal Member is denied
  const { data: execSeeRestricted } = await orgAExecutive.client
    .from('documents')
    .select('id, title')
    .eq('id', restrictedDoc.id)
  record('Executive Member can view restricted document', execSeeRestricted?.length === 1)

  const { data: memberSeeRestricted } = await orgAMember.client
    .from('documents')
    .select('id, title')
    .eq('id', restrictedDoc.id)
  record('Normal Member cannot view restricted document (even with direct UUID)', !memberSeeRestricted || memberSeeRestricted.length === 0)

  // Search leakage test: Member searches exact restricted title
  const { data: searchLeakage } = await orgAMember.client
    .from('documents')
    .select('id, title')
    .ilike('title', '%Executive Committee Confidential Strategy%')
  record('Search leakage prevented (0 results when searching exact restricted title)', !searchLeakage || searchLeakage.length === 0)

  // Verify Private doc: Secretary sees it, Executive Member denied
  const { data: secSeePrivate } = await orgASecretary.client
    .from('documents')
    .select('id, title')
    .eq('id', privateDoc.id)
  record('Creator (Secretary) can view private document', secSeePrivate?.length === 1)

  const { data: execSeePrivate } = await orgAExecutive.client
    .from('documents')
    .select('id, title')
    .eq('id', privateDoc.id)
  record('Unrelated Executive cannot view private document', !execSeePrivate || execSeePrivate.length === 0)

  // ==============================================================================
  // SCENARIO 5: Group Archival Access Revocation (Section 48)
  // ==============================================================================
  console.log('\n--- 6. Group Archival Access Revocation ---')
  // Before archiving group: Executive can view restricted document (verified above)

  // Secretary archives Executive Committee
  await orgASecretary.client.rpc('archive_group', { p_group_id: execGroup.id })

  // Now Executive Member queries the restricted document:
  const { data: execAfterArchive } = await orgAExecutive.client
    .from('documents')
    .select('id, title')
    .eq('id', restrictedDoc.id)
  record('Archiving group automatically revokes group-derived document access', !execAfterArchive || execAfterArchive.length === 0)

  // Restore group:
  await orgASecretary.client.rpc('restore_group', { p_group_id: execGroup.id })
  const { data: execAfterRestore } = await orgAExecutive.client
    .from('documents')
    .select('id, title')
    .eq('id', restrictedDoc.id)
  record('Restoring group automatically restores group-derived document access', execAfterRestore?.length === 1)

  // ==============================================================================
  // SCENARIO 6: Current Version Integrity & Immutability (Section 34-36)
  // ==============================================================================
  console.log('\n--- 7. Current Version Integrity & Immutability ---')

  // Version 1 of restricted doc
  const { data: v1Res } = await adminClient
    .from('document_versions')
    .insert({
      organization_id: orgAId,
      document_id: restrictedDoc.id,
      version_number: 1,
      storage_path: `${orgAId}/${restrictedDoc.id}/v1/file.pdf`,
      original_filename: 'file.pdf',
      uploaded_by: orgASecretary.userId,
    })
    .select()
    .single()

  await adminClient.from('documents').update({ current_version_id: v1Res.id }).eq('id', restrictedDoc.id)

  // Version 1 of organization doc
  const { data: vOrgDocRes } = await adminClient
    .from('document_versions')
    .insert({
      organization_id: orgAId,
      document_id: orgWideDoc.id,
      version_number: 1,
      storage_path: `${orgAId}/${orgWideDoc.id}/v1/agm.pdf`,
      original_filename: 'agm.pdf',
      uploaded_by: orgASecretary.userId,
    })
    .select()
    .single()

  // Attempt database manipulation causing restrictedDoc.current_version_id -> vOrgDocRes.id (from orgWideDoc)
  const { error: mismatchErr } = await adminClient
    .from('documents')
    .update({ current_version_id: vOrgDocRes.id })
    .eq('id', restrictedDoc.id)
  record(
    'Database composite FK rejects setting current_version_id to another document’s version',
    Boolean(mismatchErr),
    mismatchErr?.message
  )

  // Version immutability: ordinary user cannot UPDATE version metadata
  const { data: tamperedVer, error: verUpdateErr } = await orgAMember.client
    .from('document_versions')
    .update({ version_number: 999 })
    .eq('id', v1Res.id)
    .select()
  record('Ordinary user cannot UPDATE historical document version (immutable)', !tamperedVer || tamperedVer.length === 0 || Boolean(verUpdateErr))

  // ==============================================================================
  // SCENARIO 7: Member Privacy Protection (Section 58)
  // ==============================================================================
  console.log('\n--- 8. Member Privacy Directory Protection ---')
  // Seed private member with sensitive address, phone, notes
  const { data: privateMember } = await adminClient
    .from('members')
    .insert({
      organization_id: orgAId,
      first_name: 'Hari',
      last_name: 'Dahal',
      email: 'hari.dahal@ngo.org',
      phone: '+977-9841234567',
      address: 'Private Residence, Jawalakhel, Lalitpur',
      notes: 'Confidential personal HR notes',
      status: 'active',
    })
    .select()
    .single()

  // Normal member calls safe directory RPC get_members_directory
  const { data: dirResults, error: dirErr } = await orgAMember.client.rpc('get_members_directory', {
    p_page: 1,
    p_page_size: 50,
  })

  if (!dirErr && dirResults) {
    const found = dirResults.find((m) => m.id === privateMember.id)
    const leaksPrivateInfo = found && (found.phone || found.address || found.notes)
    record('Directory RPC hides sensitive personal fields (phone/address/notes) from ordinary members', !leaksPrivateInfo)
  } else {
    record('Directory RPC callable by members', false, dirErr?.message)
  }

  // ==============================================================================
  // SCENARIO 8: Privilege Escalation & Last Super Admin (Section 19, 20, 21, 24)
  // ==============================================================================
  console.log('\n--- 9. Privilege Escalation & Last Super Admin Rule ---')

  // Normal member attempts self-insertion into group_members
  const { error: groupEscErr } = await orgAMember.client.from('group_members').insert({
    organization_id: orgAId,
    group_id: execGroup.id,
    member_id: execMemberRecord.id,
  })
  record('Member self-insertion into group_members is denied by RLS', Boolean(groupEscErr))

  // Normal member attempts self-insertion into document_user_access
  const { error: docAclErr } = await orgAMember.client.from('document_user_access').insert({
    organization_id: orgAId,
    document_id: restrictedDoc.id,
    user_id: orgAMember.userId,
    access_level: 'manage',
  })
  record('Member self-insertion into document_user_access is denied by RLS', Boolean(docAclErr))

  // Secretary Admin attempts to assign self Super Admin
  const { data: superAdminRole } = await adminClient
    .from('roles')
    .select('id')
    .eq('organization_id', orgAId)
    .eq('slug', 'super_admin')
    .single()

  const { error: secEscErr } = await orgASecretary.client.rpc('set_user_roles', {
    p_target_user_id: orgASecretary.userId,
    p_role_ids: [superAdminRole.id],
  })
  record('Secretary Admin cannot self-grant Super Admin', Boolean(secEscErr) && secEscErr.message.includes('Only Super Admins can assign the super_admin role'))

  // Clean up any extra super admins in Org B so orgBSuperUser is truly the ONLY active super admin
  const { data: bSuperRole } = await adminClient
    .from('roles')
    .select('id')
    .eq('organization_id', orgBId)
    .eq('slug', 'super_admin')
    .single()
  await adminClient
    .from('user_roles')
    .delete()
    .eq('role_id', bSuperRole.id)
    .neq('user_id', orgBSuperUser.userId)

  // Last Super Admin Protection in Org B (where exactly 1 super admin exists)
  const { error: lastSuperDemoteErr } = await orgBSuperUser.client.rpc('set_user_roles', {
    p_target_user_id: orgBSuperUser.userId,
    p_role_ids: [],
  })
  record(
    'Demoting the LAST active Super Admin is denied: "At least one active Super Admin is required."',
    Boolean(lastSuperDemoteErr) && lastSuperDemoteErr.message.includes('At least one active Super Admin is required.')
  )

  // ==============================================================================
  // SCENARIO 9: Audit Immutability Enforcement (Section 55)
  // ==============================================================================
  console.log('\n--- 10. Audit Log Immutability ---')
  const { error: actMutErr } = await orgASuper.client
    .from('activity_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  record('Trigger strictly prevents DELETE on activity_logs', Boolean(actMutErr) && actMutErr.message.includes('strictly append-only'))

  console.log('\n=========================================================================')
  console.log(`TASK 10 FINAL INTEGRATION VERIFICATION: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('=========================================================================\n')

  return { passCount, failCount, results }
}

runFinalIntegrationTests()
  .then((res) => {
    if (res.failCount > 0) process.exit(1)
  })
  .catch((err) => {
    console.error('Test execution error:', err)
    process.exit(1)
  })
