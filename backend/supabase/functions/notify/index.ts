import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Push-only.  The notifications row is written by the caller (admin API route)
// so this function must never insert, otherwise every send is duplicated.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { notification_id, title, body, target, target_user_id } =
      await req.json();

    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
    const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
    const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY");
    const serviceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

    // No push credentials → nothing to deliver.  The in-app inbox reads the
    // notifications table directly, so this is non-fatal.
    if (!serviceAccount && !(projectId && clientEmail && privateKey)) {
      return new Response(
        JSON.stringify({
          success: true,
          pushed: false,
          reason: "push_not_configured",
          notification_id: notification_id ?? null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const accessToken = await getAccessToken(serviceAccount, {
      projectId,
      clientEmail,
      privateKey,
    });

    const sa = serviceAccount ? JSON.parse(serviceAccount) : null;
    const project = sa?.project_id ?? projectId;

    // ── Specific user: look up their FCM tokens from the database ──────
    if (target_user_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: tokens, error: lookupErr } = await supabase
        .from("fcm_tokens")
        .select("token")
        .eq("user_id", target_user_id);

      if (lookupErr) {
        console.error("fcm_tokens lookup error:", lookupErr);
      }

      if (!tokens || tokens.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            pushed: false,
            reason: "no_fcm_tokens_for_user",
            notification_id: notification_id ?? null,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Send to every registered device for this user.
      const results = [];
      for (const { token } of tokens) {
        const resp = await fetch(
          `https://fcm.googleapis.com/v1/projects/${project}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body },
                data: {
                  notification_id: String(notification_id ?? ""),
                },
              },
            }),
          },
        );
        results.push(await resp.json());
      }

      console.log(
        `FCM targeted push to ${tokens.length} device(s):`,
        JSON.stringify(results),
      );

      return new Response(
        JSON.stringify({ success: true, pushed: true, results }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── All users: send to the FCM topic ───────────────────────────────
    const message = {
      topic: "all_users",
      notification: { title, body },
      data: { notification_id: String(notification_id ?? "") },
    };

    const resp = await fetch(
      `https://fcm.googleapis.com/v1/projects/${project}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      },
    );

    const result = await resp.json();
    console.log("FCM topic push result:", JSON.stringify(result));

    return new Response(
      JSON.stringify({ success: resp.ok, pushed: resp.ok, result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getAccessToken(
  serviceAccountJson: string | undefined,
  fallback: {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  },
): Promise<string> {
  const sa = serviceAccountJson
    ? JSON.parse(serviceAccountJson)
    : {
        project_id: fallback.projectId,
        client_email: fallback.clientEmail,
        private_key: (fallback.privateKey ?? "").replace(/\\n/g, "\n"),
      };

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = (o: unknown) =>
    btoa(JSON.stringify(o))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const unsigned = `${enc(header)}.${enc(claim)}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const b64sig = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${b64sig}`,
    }),
  });
  const data = await resp.json();
  if (!data.access_token)
    throw new Error(`token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
