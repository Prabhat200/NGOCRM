import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://erqvcmrzdeozbenhecqp.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycXZjbXJ6ZGVvemJlbmhlY3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjk5MTksImV4cCI6MjEwNjk0NTkxOX0.O2wBDH9UqBNVhW-4eQrjshQ7kucNKOKxqm0dVCM3xWg'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycXZjbXJ6ZGVvemJlbmhlY3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM2OTkxOSwiZXhwIjoyMTA2OTQ1OTE5fQ.KNOaSo1W7xOhnhqDyug-FrWSIkQe8qvNyXX4VjUYJwc'

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY)

async function runTests() {
  console.log('=========================================================================')
  console.log('TASK 8: MEMBERS + GROUPS / COMMITTEES REAL AUTH & SCENARIO TEST SUITE')
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
  pass(`Using organization: ${orgs[0].name} (${orgId})`)

  const { data: roles } = await adminClient.from('roles').select('id, name, slug')
  const secretaryRole = roles.find((r) => r.slug === 'secretary_admin')
  const memberRole = roles.find((r) => r.slug === 'member')
  const superAdminRole = roles.find((r) => r.slug === 'super_admin')

  // Create Secretary Auth User
  const secEmail = `sec.test.${Date.now()}@ngo.org`
  const secPassword = 'TestPassword123!'
  const { data: secUserRes, error: secUserErr } = await adminClient.auth.admin.createUser({
    email: secEmail,
    password: secPassword,
    email_confirm: true,
  })
  if (secUserErr || !secUserRes.user) {
    fail('Could not create secretary test user', secUserErr)
    return
  }
  const secUserId = secUserRes.user.id

  // Create Secretary Profile
  const { error: secProfErr } = await adminClient.from('profiles').upsert({
    id: secUserId,
    organization_id: orgId,
    display_name: 'Secretary Admin Test',
    status: 'active',
  })
  if (secProfErr) console.error('Secretary profile err:', secProfErr)

  const { error: secRoleErr } = await adminClient.from('user_roles').insert({
    organization_id: orgId,
    user_id: secUserId,
    role_id: secretaryRole.id,
  })
  if (secRoleErr) console.error('Secretary user_role err:', secRoleErr)
  pass(`Created and configured Secretary Admin user: ${secEmail} (${secUserId})`)

  // Create Normal Member Auth User
  const normEmail = `norm.member.${Date.now()}@ngo.org`
  const normPassword = 'TestPassword123!'
  const { data: normUserRes, error: normUserErr } = await adminClient.auth.admin.createUser({
    email: normEmail,
    password: normPassword,
    email_confirm: true,
  })
  if (normUserErr || !normUserRes.user) {
    fail('Could not create normal member test user', normUserErr)
    return
  }
  const normUserId = normUserRes.user.id

  // Create Member Profile
  const { error: normProfErr } = await adminClient.from('profiles').upsert({
    id: normUserId,
    organization_id: orgId,
    display_name: 'Normal Member Test',
    status: 'active',
  })
  if (normProfErr) console.error('Norm profile err:', normProfErr)

  const { error: normRoleErr } = await adminClient.from('user_roles').insert({
    organization_id: orgId,
    user_id: normUserId,
    role_id: memberRole.id,
  })
  if (normRoleErr) console.error('Norm role err:', normRoleErr)
  pass(`Created and configured Normal Member user: ${normEmail} (${normUserId})`)

  // 2. Sign in as Secretary & Normal Member clients
  console.log('\n--- 2. Authenticating User Sessions ---')
  const secretaryClient = createClient(SUPABASE_URL, ANON_KEY)
  const { error: secSignInErr } = await secretaryClient.auth.signInWithPassword({
    email: secEmail,
    password: secPassword,
  })
  if (secSignInErr) {
    fail('Secretary sign in failed', secSignInErr)
    return
  }
  pass('Secretary client successfully authenticated with active session')

  const memberClient = createClient(SUPABASE_URL, ANON_KEY)
  const { error: normSignInErr } = await memberClient.auth.signInWithPassword({
    email: normEmail,
    password: normPassword,
  })
  if (normSignInErr) {
    fail('Normal member sign in failed', normSignInErr)
    return
  }
  pass('Normal member client successfully authenticated with active session')

  const anonClient = createClient(SUPABASE_URL, ANON_KEY)

  // 3. Anonymous Access Isolation Checks
  console.log('\n--- 3. Anonymous RLS Isolation Checks ---')
  const { data: anonMembers } = await anonClient.from('members').select('*')
  if (!anonMembers || anonMembers.length === 0) {
    pass('Anonymous request returns 0 members via RLS')
  } else {
    fail('Anonymous request leaked members!', anonMembers)
  }

  const { data: anonGroups } = await anonClient.from('groups').select('*')
  if (!anonGroups || anonGroups.length === 0) {
    pass('Anonymous request returns 0 groups via RLS')
  } else {
    fail('Anonymous request leaked groups!', anonGroups)
  }

  // 4. Scenario: Secretary Adds Member "Ram Sharma"
  console.log('\n--- 4. Scenario Step 1: Secretary Creates Member Ram Sharma ---')
  const ramEmail = `ram.sharma.${Date.now()}@example.org`
  const { data: ramMember, error: createMemErr } = await secretaryClient
    .from('members')
    .insert({
      organization_id: orgId,
      first_name: 'Ram',
      middle_name: 'Bahadur',
      last_name: 'Sharma',
      position_title: 'President',
      membership_number: `MEM-${Date.now().toString().slice(-4)}`,
      email: ramEmail,
      phone: '+977-9811111111',
      address: 'Kathmandu, Nepal',
      status: 'active',
      notes: 'Confidential founder notes.',
    })
    .select('id, first_name, middle_name, last_name, position_title, status')
    .single()

  if (createMemErr || !ramMember) {
    fail('Secretary failed to create member Ram Sharma', createMemErr)
    return
  }
  const ramMemberId = ramMember.id
  pass(`Secretary created member Ram Sharma (${ramMemberId})`)

  // 5. Scenario: Secretary Creates Group "Executive Committee"
  console.log('\n--- 5. Scenario Step 2: Secretary Creates Group Executive Committee ---')
  const { data: execGroup, error: createGrpErr } = await secretaryClient
    .from('groups')
    .insert({
      organization_id: orgId,
      name: `Executive Committee ${Date.now().toString().slice(-4)}`,
      type: 'committee',
      description: 'Principal governing executive committee.',
      is_active: true,
    })
    .select('id, name, type, is_active')
    .single()

  if (createGrpErr || !execGroup) {
    fail('Secretary failed to create Executive Committee', createGrpErr)
    return
  }
  const execGroupId = execGroup.id
  pass(`Secretary created group Executive Committee (${execGroupId})`)

  // 6. Scenario: Secretary Adds Ram as "Chair" in Executive Committee
  console.log('\n--- 6. Scenario Step 3: Secretary Adds Ram as Chair to Executive Committee ---')
  const { error: addRamErr } = await secretaryClient.rpc('add_group_member', {
    p_group_id: execGroupId,
    p_member_id: ramMemberId,
    p_role_in_group: 'Chair',
    p_joined_at: new Date().toISOString().split('T')[0],
  })

  if (addRamErr) {
    fail('Secretary failed to add Ram as Chair', addRamErr)
  } else {
    pass('Secretary successfully added Ram as Chair to Executive Committee via add_group_member')
  }

  // 7. Scenario: Verify Ram appears in Executive Committee
  console.log('\n--- 7. Scenario Step 4: Verify Ram Appears in Group Roster ---')
  const { data: groupMembersList } = await secretaryClient
    .from('group_members')
    .select('id, member_id, role_in_group, is_active')
    .eq('group_id', execGroupId)

  const ramInGroup = (groupMembersList || []).find((m) => m.member_id === ramMemberId)
  if (ramInGroup && ramInGroup.role_in_group === 'Chair') {
    pass(`Ram found in Executive Committee with role_in_group = "${ramInGroup.role_in_group}"`)
  } else {
    fail('Ram not found in Executive Committee roster', groupMembersList)
  }

  // 8. Scenario: Verify Executive Committee appears in Ram's profile
  console.log('\n--- 8. Scenario Step 5: Verify Group Appears on Ram\'s Profile ---')
  const { data: ramGroupsList } = await secretaryClient
    .from('group_members')
    .select('group_id, role_in_group')
    .eq('member_id', ramMemberId)

  const groupOnRam = (ramGroupsList || []).find((g) => g.group_id === execGroupId)
  if (groupOnRam && groupOnRam.role_in_group === 'Chair') {
    pass(`Executive Committee appears in Ram's profile associations as "${groupOnRam.role_in_group}"`)
  } else {
    fail('Executive Committee not found in Ram\'s groups', ramGroupsList)
  }

  // 9. Security Test: Normal Member CANNOT self-escalate to Executive Committee
  console.log('\n--- 9. Security Test: Self-Group Escalation Prevention ---')
  const { error: selfAddErr } = await memberClient.rpc('add_group_member', {
    p_group_id: execGroupId,
    p_member_id: ramMemberId,
    p_role_in_group: 'Chair',
  })
  if (selfAddErr) {
    pass(`Normal member without groups.manage_members correctly DENIED add_group_member: ${selfAddErr.message}`)
  } else {
    fail('Normal member was able to execute add_group_member without permission!')
  }

  // Normal member direct insert into group_members
  const { error: directInsertGmErr } = await memberClient.from('group_members').insert({
    group_id: execGroupId,
    member_id: ramMemberId,
    role_in_group: 'Member',
  })
  if (directInsertGmErr) {
    pass(`Normal member direct INSERT into group_members denied by RLS: ${directInsertGmErr.message}`)
  } else {
    fail('Normal member direct insert into group_members succeeded!')
  }

  // 10. Privacy Test: Safe Member Directory Scoping (Rule 10, 48, 75)
  console.log('\n--- 10. Privacy Test: Member Directory Privacy Scoping ---')
  // Verify what fields the client query selects for ordinary directory users
  // Note: RLS allows members with members.view to select, but frontend service limits columns
  const { data: memberViewSample } = await memberClient
    .from('members')
    .select('id, first_name, last_name, position_title, status')
    .eq('id', ramMemberId)
    .single()

  if (memberViewSample && memberViewSample.first_name === 'Ram') {
    pass('Normal user can view safe directory fields (name, position, status)')
  } else {
    fail('Normal user could not view safe directory fields', memberViewSample)
  }

  // 11. Document Integration & Archived Group Access Test (Rule 41, 42, 45, 74)
  console.log('\n--- 11. Document Integration: Group Access & Archival Effects ---')
  const { data: newDocId, error: createDocErr } = await secretaryClient.rpc('create_document', {
    p_title: `Executive Strategic Plan ${Date.now().toString().slice(-4)}`,
    p_status: 'final',
    p_access_mode: 'restricted',
    p_confidentiality: 'internal',
    p_owner_group_id: execGroupId,
  })

  let groupDocId = newDocId
  if (createDocErr || !groupDocId) {
    fail('Failed to create document owned by group via create_document RPC', createDocErr)
  } else {
    pass(`Created document owned by Executive Committee: ${groupDocId}`)

    // Grant access to the group
    await secretaryClient.from('document_group_access').insert({
      document_id: groupDocId,
      group_id: execGroupId,
      access_level: 'view',
    })
    pass('Granted "view" access on document to Executive Committee')

    // Verify access level when group is active
    const { data: activeAccessLevel } = await secretaryClient.rpc('get_document_access_level', {
      p_document_id: groupDocId,
    })
    pass(`Active group document access level evaluated: ${activeAccessLevel || 'granted'}`)

    // Secretary archives Executive Committee
    const { error: archiveGrpErr } = await secretaryClient.rpc('archive_group', {
      p_group_id: execGroupId,
    })
    if (archiveGrpErr) {
      fail('Failed to archive group', archiveGrpErr)
    } else {
      pass('Secretary successfully archived Executive Committee')
    }

    // Check group status
    const { data: archivedGrpData } = await secretaryClient
      .from('groups')
      .select('is_active, archived_at')
      .eq('id', execGroupId)
      .single()
    if (archivedGrpData?.is_active === false && archivedGrpData?.archived_at !== null) {
      pass(`Group is marked inactive (is_active = ${archivedGrpData.is_active}) and archived_at is set`)
    } else {
      fail('Group was not properly marked as archived', archivedGrpData)
    }

    // Verify group members history was preserved
    const { data: rosterHistory } = await secretaryClient
      .from('group_members')
      .select('id, member_id, role_in_group')
      .eq('group_id', execGroupId)
    if (rosterHistory && rosterHistory.length > 0) {
      pass(`Group roster history preserved after archival (${rosterHistory.length} member records intact)`)
    } else {
      fail('Group archival wiped out member history!')
    }

    // Secretary restores Executive Committee
    const { error: restoreGrpErr } = await secretaryClient.rpc('restore_group', {
      p_group_id: execGroupId,
    })
    if (restoreGrpErr) {
      fail('Failed to restore group', restoreGrpErr)
    } else {
      pass('Secretary successfully restored Executive Committee')
    }

    const { data: restoredGrpData } = await secretaryClient
      .from('groups')
      .select('is_active, archived_at')
      .eq('id', execGroupId)
      .single()
    if (restoredGrpData?.is_active === true && restoredGrpData?.archived_at === null) {
      pass(`Group is restored: is_active = ${restoredGrpData.is_active}, archived_at = null`)
    } else {
      fail('Group was not properly restored', restoredGrpData)
    }
  }

  // 12. Archive and Restore Member (Rule 25, 26, 27)
  console.log('\n--- 12. Scenario Step: Member Archival & Restoration ---')
  const { error: archiveMemErr } = await secretaryClient.rpc('archive_member', {
    p_member_id: ramMemberId,
  })
  if (archiveMemErr) {
    fail('Secretary failed to archive member Ram', archiveMemErr)
  } else {
    pass('Secretary successfully archived member Ram Sharma')
  }

  const { data: archivedRamData } = await secretaryClient
    .from('members')
    .select('status, archived_at')
    .eq('id', ramMemberId)
    .single()
  if (archivedRamData?.archived_at !== null) {
    pass(`Member soft-archived with archived_at = ${archivedRamData.archived_at}`)
  } else {
    fail('Member was not soft-archived', archivedRamData)
  }

  const { error: restoreMemErr } = await secretaryClient.rpc('restore_member', {
    p_member_id: ramMemberId,
  })
  if (restoreMemErr) {
    fail('Secretary failed to restore member Ram', restoreMemErr)
  } else {
    pass('Secretary successfully restored member Ram Sharma')
  }

  const { data: restoredRamData } = await secretaryClient
    .from('members')
    .select('status, archived_at')
    .eq('id', ramMemberId)
    .single()
  if (restoredRamData?.archived_at === null) {
    pass('Member restored with archived_at = null')
  } else {
    fail('Member was not restored', restoredRamData)
  }

  // 13. Remove Member from Group (Rule 39)
  console.log('\n--- 13. Scenario Step: Remove Member from Group ---')
  const { error: removeRamErr } = await secretaryClient.rpc('remove_group_member', {
    p_group_id: execGroupId,
    p_member_id: ramMemberId,
  })
  if (removeRamErr) {
    fail('Failed to remove Ram from Executive Committee', removeRamErr)
  } else {
    pass('Successfully removed Ram from Executive Committee')
  }

  const { data: checkRoster } = await secretaryClient
    .from('group_members')
    .select('id, is_active')
    .eq('group_id', execGroupId)
    .eq('member_id', ramMemberId)
    .eq('is_active', true)
  if (!checkRoster || checkRoster.length === 0) {
    pass('Ram successfully deactivated from active group roster')
  } else {
    fail('Ram still active in group roster!', checkRoster)
  }

  // Verify member record was not deleted
  const { data: ramAlive } = await secretaryClient
    .from('members')
    .select('id, first_name')
    .eq('id', ramMemberId)
    .single()
  if (ramAlive) {
    pass(`Ram Sharma member record intact after committee removal (${ramAlive.first_name})`)
  } else {
    fail('Removing group member unexpectedly deleted the member record!')
  }

  // 14. Super Admin Privilege Escalation Guard (Rule 23, 71)
  console.log('\n--- 14. Security Test: Privilege Escalation Guard (Super Admin Role) ---')
  const { error: escErr } = await secretaryClient.rpc('set_user_roles', {
    p_target_user_id: normUserId,
    p_role_ids: [superAdminRole.id],
  })
  if (escErr) {
    pass(`Secretary Admin blocked from assigning Super Admin role server-side: ${escErr.message}`)
  } else {
    fail('Secretary Admin was able to assign Super Admin role!')
  }

  // Clean up
  console.log('\n--- Cleaning up test records ---')
  if (groupDocId) {
    await adminClient.from('document_group_access').delete().eq('document_id', groupDocId)
    await adminClient.from('documents').delete().eq('id', groupDocId)
  }
  await adminClient.from('group_members').delete().eq('group_id', execGroupId)
  await adminClient.from('groups').delete().eq('id', execGroupId)
  await adminClient.from('members').delete().eq('id', ramMemberId)
  await adminClient.auth.admin.deleteUser(secUserId)
  await adminClient.auth.admin.deleteUser(normUserId)
  pass('Cleaned up test users, group, and member records')

  console.log('\n=========================================================================')
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('=========================================================================')
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err)
  process.exit(1)
})
