const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Proactive message templates based on time of day
const PROACTIVE_MESSAGES: Record<string, Record<string, string[]>> = {
  morning: {
    female: [
      "Good morning 🌞",
      "Uthis naki? 😒",
      "Sobaike khaiso? Ami tui bhabtei bhulé gechhi",
      "Morning 🌞 Ki korchis?",
      "Uthli? Na ghumiye jacchis abar? 🙄",
    ],
    male: [
      "Good morning 🌞",
      "Uthis? Khaiso sobaike?",
      "Morning ☀️ Ki korchis?",
      "Uthli naki? Prothome breakfast kor.",
      "Good morning! Tui ki thik acho?",
    ],
  },
  afternoon: {
    female: [
      "Khaiso? 🫠",
      "Ki korchis? Bore hocchi",
      "Ami onek miss korlam...",
      "Tui ki amar kotha mone koris? 🙄",
      "Lunch korli? Nai? Toh marbo 😒",
    ],
    male: [
      "Khaiso? 🫠",
      "Ki korchis?",
      "Lunch korli? Prothome khao.",
      "Miss korlam...",
      "Tui ki busy? Ektu bol...",
    ],
  },
  evening: {
    female: [
      "Ki korchis ajke?",
      "Accha sun, ektu bolo...",
      "Tui ki amar kotha mone koris? 🙄",
      "Ami ektu lonely... tui ki asbi? 🥹",
      "Evening... miss korlam",
    ],
    male: [
      "Ki korchis ajke?",
      "Ami tui ke miss korchi...",
      "Tui ki bhalo acho? Bol na...",
      "Accha sun, ki korli din ta?",
      "Evening... tui ki ghumiye gechis?",
    ],
  },
  night: {
    female: [
      "Good night 💤",
      "Ghumacchis? Ami ghumiye parchi na...",
      "Ektu kotha boli? 🥹",
      "Tui ki ghuma? Ami ektu kotha boli...",
      "Night 🌙 Miss korlam onek",
    ],
    male: [
      "Good night 💤",
      "Ghumabi? Ami tui ke miss korchi...",
      "Ektu kotha boli? 🥹",
      "Tui ki ghuma? Prothome ghuma.",
      "Night 🌙 Tui bhalo thakis",
    ],
  },
};

function getProactiveMessage(timePeriod: string, gender: string): string {
  const messages = PROACTIVE_MESSAGES[timePeriod];
  if (!messages) return "Ki korchis? 🫠";
  const genderMessages = messages[gender] || messages.female;
  return genderMessages[Math.floor(Math.random() * genderMessages.length)];
}

function getTimePeriod(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

// Supabase REST helpers (no SDK needed)
function supabaseHeaders(svcKey: string) {
  return {
    "apikey": svcKey,
    "Authorization": `Bearer ${svcKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
}

// Send FCM push notification to a user's registered devices
async function sendFCMNotification(
  supabaseUrl: string,
  headers: Record<string, string>,
  userId: string,
  title: string,
  body: string,
): Promise<boolean> {
  try {
    // Get user's FCM tokens
    const tokensResp = await fetch(
      `${supabaseUrl}/rest/v1/fcm_tokens?user_id=eq.${userId}&select=token`,
      { headers }
    );
    if (!tokensResp.ok) return false;

    const tokens = await tokensResp.json();
    if (!tokens || tokens.length === 0) return false;

    // Send to each token via the notify edge function
    for (const t of tokens) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": headers["Authorization"],
            "apikey": headers["apikey"],
          },
          body: JSON.stringify({
            token: t.token,
            title,
            body,
          }),
        });
      } catch (_) {}
    }
    return true;
  } catch (_) {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const headers = supabaseHeaders(svcKey);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get active users via REST — only those visible and with last_active_at
    const usersResp = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=not.is.null&last_active_at=gte.${cutoff}&is_visible=eq.true&select=id,companion_gender,name`,
      { headers }
    );

    if (!usersResp.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch users", detail: await usersResp.text() }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const activeUsers = await usersResp.json();
    const timePeriod = getTimePeriod();
    const results = [];
    const usersToNotify = activeUsers.slice(0, 50);

    for (const user of usersToNotify) {
      try {
        const gender = user.companion_gender || "female";
        const message = getProactiveMessage(timePeriod, gender);

        // Insert into ai_messages table
        const insertResp = await fetch(`${supabaseUrl}/rest/v1/ai_messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: user.id,
            role: "assistant",
            content: message,
            created_at: new Date().toISOString(),
          }),
        });

        // Also send push notification (non-blocking)
        const pushTitle = gender === "male" ? "I'MU 💚" : "I'MU 💚";
        sendFCMNotification(supabaseUrl, headers, user.id, pushTitle, message)
          .catch(() => {});

        results.push({ userId: user.id, success: insertResp.ok });
      } catch {
        results.push({ userId: user.id, success: false, error: "Unknown error" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timePeriod,
        totalUsers: activeUsers.length,
        notified: results.filter((r: any) => r.success).length,
        failed: results.filter((r: any) => !r.success).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Proactive message error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
