import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firebaseKey = Deno.env.get("FIREBASE_SERVER_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single();

    if (profile?.preferences?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, body, target, target_user_id, fcm_tokens } = await req.json();

    const { data: notification } = await supabase
      .from("notifications")
      .insert({
        title,
        body,
        target: target || "all",
        target_user_id,
        sent_by: user.id,
      })
      .select()
      .single();

    if (fcm_tokens && fcm_tokens.length > 0) {
      const fcmResponse = await fetch(
        "https://fcm.googleapis.com/v1/projects/im-u-core/messages:send",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firebaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: { notification: { title, body }, token: fcm_tokens[0] } }),
        }
      );

      await supabase
        .from("notifications")
        .update({ status: fcmResponse.ok ? "sent" : "failed", sent_at: new Date().toISOString() })
        .eq("id", notification?.id);
    }

    return new Response(JSON.stringify({ success: true, notification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
