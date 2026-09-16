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

    const { title, body: msgBody, target, target_user_id, type } = await req.json();

    // Insert notification into DB (use correct column names)
    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id: "00000000-0000-0000-0000-000000000000", // system placeholder
        type: type || "admin",
        title,
        message: msgBody,
        target: target || "all",
        target_user_id: target_user_id || null,
        sent_by: null,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      // If user_id NOT NULL fails, try without it
      if (insertError.message?.includes("user_id")) {
        const { data: notif2, error: err2 } = await supabase
          .from("notifications")
          .insert({
            type: type || "admin",
            title,
            message: msgBody,
            target: target || "all",
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (err2) {
          console.error("Retry insert error:", err2);
        }
        return new Response(JSON.stringify({ success: true, notification: notif2 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Try FCM topic push via legacy API
    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
    if (fcmServerKey) {
      try {
        const topic = target === "all" ? "/topics/all_users" : "";
        if (topic) {
          const fcmResp = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Authorization": `key=${fcmServerKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: topic,
              notification: { title, body: msgBody, sound: "default" },
              data: { type: "admin_notification", notification_id: notification?.id },
            }),
          });
          const fcmResult = await fcmResp.json();
          console.log("FCM result:", JSON.stringify(fcmResult));
        }
      } catch (fcmErr) {
        console.error("FCM error:", fcmErr);
      }
    }

    return new Response(JSON.stringify({ success: true, notification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
