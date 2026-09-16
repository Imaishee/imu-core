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

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { version } = await req.json();

    // Get latest version from app_versions table
    const { data: latest, error } = await supabase
      .from("app_versions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !latest) {
      return new Response(JSON.stringify({ update_available: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentVersion = version || "0.0.0";
    const latestVersion = latest.version;
    const needsUpdate = currentVersion !== latestVersion;

    return new Response(JSON.stringify({
      update_available: needsUpdate,
      latest_version: latestVersion,
      current_version: currentVersion,
      download_url: latest.download_url,
      release_notes: latest.release_notes,
      force_update: latest.force_update || false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
