import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { email } = await req.json();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: Deno.env.get("PASSWORD_RESET_REDIRECT_TO") ?? "http://localhost:3000/update-password",
    });

    if (error) {
      console.error("Error resetting password:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: "Password reset email sent" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});


