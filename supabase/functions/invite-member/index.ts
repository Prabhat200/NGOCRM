import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteMemberPayload {
  member_id: string
  email: string
  role_id: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
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

    // Client operating in the caller's security context
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

    // 3. Verify caller has users.invite permission (Rule 27)
    const { data: hasInvitePerm, error: permError } = await callerClient.rpc(
      'has_permission',
      { p_permission_code: 'users.invite' }
    )

    if (permError || !hasInvitePerm) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: insufficient permissions to invite users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: InviteMemberPayload = await req.json()
    const { member_id, email, role_id } = body

    if (!member_id || !email || !role_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: member_id, email, role_id.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // 4. Verify member belongs to caller's organization (Rule 28)
    const { data: member, error: memberError } = await callerClient
      .from('members')
      .select('id, organization_id, full_name, email, status')
      .eq('id', member_id)
      .eq('organization_id', callerProfile.organization_id)
      .single()

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: 'Target member not found in your organization.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Verify role belongs to caller's organization (Rule 28)
    const { data: targetRole, error: roleError } = await callerClient
      .from('roles')
      .select('id, organization_id, name, slug')
      .eq('id', role_id)
      .eq('organization_id', callerProfile.organization_id)
      .single()

    if (roleError || !targetRole) {
      return new Response(
        JSON.stringify({ error: 'Target role not found in your organization.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Role escalation protection (Rule 29)
    // Only an existing Super Admin can invite/assign the Super Admin role
    if (targetRole.slug === 'super_admin') {
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

    // 7. Check whether member already has a linked portal profile (Rule 30)
    const { data: existingProfile } = await callerClient
      .from('profiles')
      .select('id, status')
      .eq('member_id', member.id)
      .maybeSingle()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'This member already has portal access.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Administrative Client for Auth operations (Rule 32)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 9. Send invitation via Supabase Auth Admin API (Rule 31 & 33)
    const redirectUrl = `${appUrl.replace(/\/$/, '')}/auth/accept-invite`
    const { data: inviteResult, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(cleanEmail, {
        redirectTo: redirectUrl,
        data: {
          organization_id: callerProfile.organization_id,
          member_id: member.id,
          full_name: member.full_name,
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

    // 10. Create profile and assign role safely (compensating cleanup on failure)
    try {
      // Upsert profile in invited state
      const { error: insertProfileError } = await adminClient.from('profiles').upsert({
        id: newAuthUserId,
        organization_id: callerProfile.organization_id,
        member_id: member.id,
        display_name: member.full_name,
        status: 'invited',
      })

      if (insertProfileError) {
        throw new Error(`Profile creation failed: ${insertProfileError.message}`)
      }

      // Assign initial role
      const { error: insertRoleError } = await adminClient.from('user_roles').insert({
        user_id: newAuthUserId,
        role_id: targetRole.id,
        assigned_by: callerUser.id,
      })

      if (insertRoleError) {
        throw new Error(`Role assignment failed: ${insertRoleError.message}`)
      }

      // Record audit activity log (Rule 50)
      await adminClient.from('activity_logs').insert({
        organization_id: callerProfile.organization_id,
        user_id: callerUser.id,
        action: 'user.invited',
        entity_type: 'user',
        entity_id: newAuthUserId,
        metadata: {
          member_id: member.id,
          member_name: member.full_name,
          email: cleanEmail,
          role_id: targetRole.id,
          role_name: targetRole.name,
          role_slug: targetRole.slug,
        },
      })

      return new Response(
        JSON.stringify({
          success: true,
          user_id: newAuthUserId,
          message: `Invitation successfully sent to ${cleanEmail}.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (compensationErr) {
      console.error('Compensating failure during profile setup:', compensationErr)

      // Compensating action: remove newly invited auth user so state is not dangling
      try {
        await adminClient.auth.admin.deleteUser(newAuthUserId)
      } catch (delErr) {
        console.error('Failed to run compensating deleteUser:', delErr)
      }

      return new Response(
        JSON.stringify({
          error: 'An internal error occurred during profile setup. The invitation was rolled back.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (err: unknown) {
    const error = err as Error
    console.error('Unhandled invitation function error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
