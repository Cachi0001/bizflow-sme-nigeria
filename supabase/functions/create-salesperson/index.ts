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

    const { name, email, password, owner_id } = await req.json()

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify the user is the owner
    if (user.id !== owner_id) {
      throw new Error('Unauthorized: You can only create salespeople for your own account')
    }

    // 1. Create a new user in Supabase Auth with admin privileges
    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Salesperson email should be confirmed
      user_metadata: { 
        name: name, 
        role: 'Salesperson', 
        created_by_admin: true,
        owner_id: owner_id
      },
    })

    if (authError2) {
      console.error('Auth error:', authError2)
      throw authError2
    }

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    // 2. Insert into team_members table
    const { error: teamError } = await supabaseAdmin
      .from("team_members")
      .insert({
        owner_id: owner_id,
        salesperson_id: authData.user.id,
        name: name,
        email: email,
        is_active: true
      })

    if (teamError) {
      // If team member creation fails, clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Team member creation error:', teamError)
      throw teamError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Salesperson created successfully',
        salesperson_id: authData.user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in create-salesperson function:', error)
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

