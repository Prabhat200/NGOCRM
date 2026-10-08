import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProvisionUserPayload {
  person_id: string
  email: string
  role_ids: string[]
  mode: 'invite' | 'temporary_password' | 'reset_password'
  temporary_password?: string
  reset_mode?: 'link' | 'temporary_password'
}

function generateSecureTemporaryPassword(length = 16): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghijkmnpqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%^&*()-_=+'
  const allChars = uppercase + lowercase + numbers + symbols

  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  // Ensure at least one character from each set
  let password =
    uppercase[array[0] % uppercase.length] +
    lowercase[array[1] % lowercase.length] +
    numbers[array[2] % numbers.length] +
    symbols[array[3] % symbols.length]

  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length]
  }

  // Shuffle the result
  return password
    .split('')
    .sort(() => (crypto.getRandomValues(new Uint8Array(1))[0] > 128 ? 1 : -1))
    .join('')
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const appUrl =
      Deno.env.get('PUBLIC_APP_URL') ||
      Deno.env.get('PORTAL_URL') ||
      'http://localhost:5173'

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      console.error('Missing Supabase server environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Verify caller authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: callerUser },
      error: authError,
    } = await callerClient.auth.getUser()

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid or expired session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Fetch caller profile and verify active status
    const { data: callerProfile, error: profileError } = await callerClient
      .from('profiles')
      .select('id, organization_id, status')
      .eq('id', callerUser.id)
      .single()

    if (profileError || !callerProfile || callerProfile.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: caller profile is not active.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerOrgId = callerProfile.organization_id

    // Parse payload
    const body: ProvisionUserPayload = await req.json()
    const { person_id, email, role_ids = [], mode = 'invite' } = body

    if (!person_id || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: person_id and email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // 3. Permission Checks (Rule 50)
    let hasRequiredPerm = false
    if (mode === 'invite') {
      const { data: canInvite } = await callerClient.rpc('has_permission', {
        p_permission_code: 'portal_users.invite',
      })
      const { data: canInviteLegacy } = await callerClient.rpc('has_permission', {
        p_permission_code: 'users.invite',
      })
      const { data: canProvision } = await callerClient.rpc('has_permission', {
        p_permission_code: 'portal_users.provision',
      })
      hasRequiredPerm = Boolean(canInvite || canInviteLegacy || canProvision)
    } else if (mode === 'temporary_password') {
      const { data: canProvision } = await callerClient.rpc('has_permission', {
        p_permission_code: 'portal_users.provision',
      })
      hasRequiredPerm = Boolean(canProvision)
    } else if (mode === 'reset_password') {
      const { data: canReset } = await callerClient.rpc('has_permission', {
        p_permission_code: 'portal_users.reset_password',
      })
      hasRequiredPerm = Boolean(canReset)
    }

    if (!hasRequiredPerm) {
      return new Response(
        JSON.stringify({
          error: `Forbidden: insufficient permissions for portal account operation (${mode}).`,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Verify target person exists in caller's organization (Rule 51)
    const { data: targetPerson, error: personError } = await callerClient
      .from('people')
      .select('id, organization_id, first_name, last_name, preferred_name, primary_email, status')
      .eq('id', person_id)
      .eq('organization_id', callerOrgId)
      .single()

    if (personError || !targetPerson) {
      return new Response(
        JSON.stringify({ error: 'Target person not found in your organization.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const personDisplayName =
      targetPerson.preferred_name ||
      `${targetPerson.first_name} ${targetPerson.last_name}`.trim()

    // 5. Verify person does not already have an active/existing portal profile
    const { data: existingProfile } = await callerClient
      .from('profiles')
      .select('id, status, person_id')
      .eq('person_id', targetPerson.id)
      .maybeSingle()

    if (existingProfile && mode !== 'reset_password') {
      return new Response(
        JSON.stringify({
          error: 'This person already has an associated portal user account.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Verify role assignment & escalation guard (Rule 53)
    if (role_ids.length > 0) {
      const { data: validRoles, error: rolesError } = await callerClient
        .from('roles')
        .select('id, name, slug, organization_id')
        .in('id', role_ids)
        .eq('organization_id', callerOrgId)

      if (rolesError || !validRoles || validRoles.length !== role_ids.length) {
        return new Response(
          JSON.stringify({ error: 'One or more selected roles are invalid or do not exist in your organization.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if any assigned role is super_admin
      const hasSuperAdmin = validRoles.some((r) => r.slug === 'super_admin')
      if (hasSuperAdmin) {
        const { data: callerSuperAdminCheck } = await callerClient
          .from('user_roles')
          .select('roles!inner(slug)')
          .eq('user_id', callerUser.id)
          .eq('roles.slug', 'super_admin')
          .maybeSingle()

        if (!callerSuperAdminCheck) {
          return new Response(
            JSON.stringify({
              error: 'Privilege escalation denied: Only Super Admins can assign the Super Admin role.',
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // 7. Administrative Client for Auth operations
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 8a. MODE: INVITATION
    if (mode === 'invite') {
      const redirectUrl = `${appUrl.replace(/\/$/, '')}/auth/accept-invite`
      const { data: inviteResult, error: inviteError } =
        await adminClient.auth.admin.inviteUserByEmail(cleanEmail, {
          redirectTo: redirectUrl,
          data: {
            organization_id: callerOrgId,
            person_id: targetPerson.id,
            display_name: personDisplayName,
          },
        })

      if (inviteError || !inviteResult.user) {
        console.error('Supabase Auth invite error:', inviteError)
        return new Response(
          JSON.stringify({
            error: inviteError?.message || 'Failed to send invitation to the specified email.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const newAuthUserId = inviteResult.user.id

      try {
        // Create profile in invited state with person_id linked
        const { error: insertProfileError } = await adminClient.from('profiles').upsert({
          id: newAuthUserId,
          organization_id: callerOrgId,
          person_id: targetPerson.id,
          display_name: personDisplayName,
          status: 'invited',
          must_change_password: false,
        })

        if (insertProfileError) {
          throw new Error(`Profile creation failed: ${insertProfileError.message}`)
        }

        // Assign roles
        if (role_ids.length > 0) {
          const roleInserts = role_ids.map((rId) => ({
            organization_id: callerOrgId,
            user_id: newAuthUserId,
            role_id: rId,
            assigned_by: callerUser.id,
          }))
          const { error: insertRolesError } = await adminClient.from('user_roles').insert(roleInserts)
          if (insertRolesError) throw insertRolesError
        }

        // Record audit activity log (no passwords!)
        await adminClient.from('activity_logs').insert({
          organization_id: callerOrgId,
          user_id: callerUser.id,
          action: 'portal_user.invited',
          entity_type: 'user',
          entity_id: newAuthUserId,
          metadata: {
            person_id: targetPerson.id,
            person_name: personDisplayName,
            email: cleanEmail,
            role_ids,
          },
        })

        return new Response(
          JSON.stringify({
            success: true,
            user_id: newAuthUserId,
            mode: 'invite',
            message: `Portal invitation successfully sent to ${cleanEmail}.`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (compensationErr) {
        console.error('Rollback after profile error in invite mode:', compensationErr)
        try {
          await adminClient.auth.admin.deleteUser(newAuthUserId)
        } catch (delErr) {
          console.error('Failed compensating deleteUser:', delErr)
        }
        return new Response(
          JSON.stringify({
            error: 'Failed to configure profile and roles. The invitation was rolled back.',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 8b. MODE: TEMPORARY PASSWORD PROVISIONING
    if (mode === 'temporary_password') {
      const tempPassword =
        body.temporary_password && body.temporary_password.trim().length >= 8
          ? body.temporary_password.trim()
          : generateSecureTemporaryPassword(16)

      // Create user directly via Auth Admin
      const { data: createResult, error: createError } =
        await adminClient.auth.admin.createUser({
          email: cleanEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            organization_id: callerOrgId,
            person_id: targetPerson.id,
            display_name: personDisplayName,
          },
        })

      if (createError || !createResult.user) {
        console.error('Supabase Auth createUser error:', createError)
        return new Response(
          JSON.stringify({
            error: createError?.message || 'Failed to create user account.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const newAuthUserId = createResult.user.id

      try {
        // Create profile in active status with MUST_CHANGE_PASSWORD = TRUE
        const { error: insertProfileError } = await adminClient.from('profiles').upsert({
          id: newAuthUserId,
          organization_id: callerOrgId,
          person_id: targetPerson.id,
          display_name: personDisplayName,
          status: 'active',
          must_change_password: true,
        })

        if (insertProfileError) {
          throw new Error(`Profile creation failed: ${insertProfileError.message}`)
        }

        // Assign roles
        if (role_ids.length > 0) {
          const roleInserts = role_ids.map((rId) => ({
            organization_id: callerOrgId,
            user_id: newAuthUserId,
            role_id: rId,
            assigned_by: callerUser.id,
          }))
          const { error: insertRolesError } = await adminClient.from('user_roles').insert(roleInserts)
          if (insertRolesError) throw insertRolesError
        }

        // Audit log (Notice: temporary password is NEVER logged or saved in metadata!)
        await adminClient.from('activity_logs').insert({
          organization_id: callerOrgId,
          user_id: callerUser.id,
          action: 'portal_user.provisioned',
          entity_type: 'user',
          entity_id: newAuthUserId,
          metadata: {
            person_id: targetPerson.id,
            person_name: personDisplayName,
            email: cleanEmail,
            role_ids,
            must_change_password: true,
            mode: 'temporary_password',
          },
        })

        // Return temporary password ONCE to authorized admin
        return new Response(
          JSON.stringify({
            success: true,
            user_id: newAuthUserId,
            mode: 'temporary_password',
            temporary_password: tempPassword,
            must_change_password: true,
            message:
              'Portal account provisioned successfully with a temporary password. Provide this credential to the user securely; it will not be displayed again.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (compensationErr) {
        console.error('Rollback after profile error in temp password mode:', compensationErr)
        try {
          await adminClient.auth.admin.deleteUser(newAuthUserId)
        } catch (delErr) {
          console.error('Failed compensating deleteUser:', delErr)
        }
        return new Response(
          JSON.stringify({
            error: 'Failed to configure profile and roles. The user account creation was rolled back.',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 8c. MODE: ADMIN PASSWORD RESET
    if (mode === 'reset_password') {
      if (!existingProfile) {
        return new Response(
          JSON.stringify({ error: 'No portal profile found for this person.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const resetMode = body.reset_mode || 'link'

      if (resetMode === 'link') {
        const { error: resetLinkError } = await adminClient.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${appUrl.replace(/\/$/, '')}/change-password`,
        })

        if (resetLinkError) {
          return new Response(
            JSON.stringify({ error: resetLinkError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await adminClient.from('activity_logs').insert({
          organization_id: callerOrgId,
          user_id: callerUser.id,
          action: 'portal_user.password_reset_sent',
          entity_type: 'user',
          entity_id: existingProfile.id,
          metadata: {
            person_id: targetPerson.id,
            email: cleanEmail,
            type: 'reset_link',
          },
        })

        return new Response(
          JSON.stringify({
            success: true,
            message: `Password reset email sent to ${cleanEmail}.`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Issue new temporary password and force password change on next login
        const newTempPassword = generateSecureTemporaryPassword(16)

        const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(existingProfile.id, {
          password: newTempPassword,
        })

        if (updateAuthError) {
          return new Response(
            JSON.stringify({ error: updateAuthError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await adminClient
          .from('profiles')
          .update({ must_change_password: true, updated_at: new Date().toISOString() })
          .eq('id', existingProfile.id)

        await adminClient.from('activity_logs').insert({
          organization_id: callerOrgId,
          user_id: callerUser.id,
          action: 'portal_user.temporary_password_created',
          entity_type: 'user',
          entity_id: existingProfile.id,
          metadata: {
            person_id: targetPerson.id,
            email: cleanEmail,
            must_change_password: true,
          },
        })

        return new Response(
          JSON.stringify({
            success: true,
            temporary_password: newTempPassword,
            must_change_password: true,
            message:
              'New temporary password generated successfully. It will not be shown again.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: `Unsupported mode: ${mode}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const error = err as Error
    console.error('Unhandled provisioning function error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
