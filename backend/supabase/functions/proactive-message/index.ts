import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Proactive message templates based on time of day
const PROACTIVE_MESSAGES = {
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

// Get random message for time period
function getProactiveMessage(timePeriod: string, gender: string): string {
  const messages = PROACTIVE_MESSAGES[timePeriod as keyof typeof PROACTIVE_MESSAGES];
  if (!messages) return "Ki korchis? 🫠";

  const genderMessages = messages[gender as keyof typeof messages] || messages.female;
  return genderMessages[Math.floor(Math.random() * genderMessages.length)];
}

// Determine time period
function getTimePeriod(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // This function should be called by a scheduler (cron job)
    // It sends proactive messages to all active users

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get users who were active in the last 24 hours
    const { data: activeUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id, companion_gender")
      .gte("last_active_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (usersError || !activeUsers) {
      console.error("Error fetching active users:", usersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timePeriod = getTimePeriod();
    const results = [];

    // Send proactive message to each user (limit to avoid rate limiting)
    const usersToNotify = activeUsers.slice(0, 50); // Limit to 50 users per call

    for (const user of usersToNotify) {
      try {
        const gender = user.companion_gender || "female";
        const message = getProactiveMessage(timePeriod, gender);

        // Insert message into ai_messages table
        const { error: insertError } = await supabase
          .from("ai_messages")
          .insert({
            user_id: user.id,
            role: "assistant",
            content: message,
            created_at: new Date().toISOString(),
          });

        if (!insertError) {
          results.push({ userId: user.id, success: true });
        } else {
          results.push({ userId: user.id, success: false, error: insertError.message });
        }
      } catch (e) {
        results.push({ userId: user.id, success: false, error: "Unknown error" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timePeriod,
        totalUsers: activeUsers.length,
        notified: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Proactive message error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
