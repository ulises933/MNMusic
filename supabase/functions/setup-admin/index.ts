import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { email } = await req.json();
  
  // Find user by email
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("display_name", email)
    .limit(10);

  // Also search by auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const targetUser = users?.find(u => u.email === email);
  
  if (!targetUser) {
    return new Response(JSON.stringify({ error: "User not found" }), { 
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  // Upsert admin role
  const { error } = await supabase.from("user_roles").upsert({
    user_id: targetUser.id,
    role: "admin",
  }, { onConflict: "user_id" });

  return new Response(JSON.stringify({ success: !error, user_id: targetUser.id, error: error?.message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
