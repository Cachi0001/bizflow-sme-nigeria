import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create a regular client for user verification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { member_id, owner_id } = await req.json()

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify the user is the owner
    if (user.id !== owner_id) {
      throw new Error('Unauthorized: You can only delete your own team members')
    }

    // 1. Get the salesperson_id from the team_members table
    const { data: memberData, error: fetchError } = await supabaseAdmin
      .from("team_members")
      .select("salesperson_id, name")
      .eq("id", member_id)
      .eq("owner_id", owner_id) // Additional security check
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      throw fetchError
    }
    
    if (!memberData || !memberData.salesperson_id) {
      throw new Error("Salesperson not found or access denied")
    }

    // 2. Delete the user from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(memberData.salesperson_id)
    if (authDeleteError) {
      console.error('Auth delete error:', authDeleteError)
      throw authDeleteError
    }

    // 3. Delete from team_members table
    const { error: teamDeleteError } = await supabaseAdmin
      .from("team_members")
      .delete()
      .eq("id", member_id)
      .eq("owner_id", owner_id) // Additional security check

    if (teamDeleteError) {
      console.error('Team delete error:', teamDeleteError)
      throw teamDeleteError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${memberData.name} has been removed from your team`,
        deleted_member: memberData.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in delete-salesperson function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

