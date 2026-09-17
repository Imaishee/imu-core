import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import nodemailer from "https://esm.sh/nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Hash the OTP so it's never stored in plaintext.
function hash(code: string, salt: string): string {
  return createHmac("sha256", salt).update(code).digest("hex");
}

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Branded HTML email template (I'MU).
function emailTemplate({ code, purpose }: { code: string; purpose: string }) {
  const title = purpose === "recovery" ? "Reset Your Password" : "Verify Your Email";
  const subtitle =
    purpose === "recovery"
      ? "Use this code to set a new password for your I'MU account."
      : "Use this code to activate your I'MU account and get started.";

  // Split the 6-digit code into individual boxes.
  const digits = code.split("").map((d) =>
    `<td width="52" style="width:52px;background:#FFFFFF;border:2px solid #D8E8DC;border-radius:12px;padding:12px 0;text-align:center;font-size:30px;font-weight:800;color:#1B4332;font-family:monospace">${d}</td>`
  ).join('<td width="10" style="width:10px"></td>');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#EAF4EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#EAF4EE;padding:40px 16px"><tr><td align="center">
<table width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(27,67,50,0.14)">
<tr><td style="background:linear-gradient(135deg,#1B4332,#2D6A4F 55%,#52B788);padding:36px 40px;text-align:center">
<table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
<td width="46" height="46" style="width:46px;height:46px;background:#FFFFFF;border-radius:14px;text-align:center;vertical-align:middle;font-size:24px;font-weight:800;color:#1B4332;font-family:system-ui">I'MU</td>
<td style="padding-left:12px;text-align:left">
<div style="font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.3px">I'MU</div>
<div style="font-size:12px;color:rgba(255,255,255,0.85);letter-spacing:0.5px;text-transform:uppercase">AI Study Companion</div>
</td>
</tr></table>
</td></tr>
<tr><td style="padding:38px 40px 30px">
<h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#1F2A24;text-align:center">${title}</h1>
<p style="margin:0 0 30px;font-size:15px;color:#5C6B62;text-align:center;line-height:1.6">${subtitle}</p>
<div style="background:#F0F7F2;border:1px solid #D8E8DC;border-radius:16px;padding:24px 18px;margin:0 auto 30px;text-align:center">
<div style="font-size:12px;color:#2D6A4F;margin-bottom:16px;letter-spacing:2px;font-weight:700;text-transform:uppercase">Your One-Time Code</div>
<table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>${digits}</tr></table>
</div>
<p style="margin:0 0 6px;font-size:13px;color:#5C6B62;text-align:center"><strong>⏱ ${purpose === "recovery" ? "15" : "10"} minutes</strong> left before this code expires.</p>
<p style="margin:0 0 8px;font-size:13px;color:#5C6B62;text-align:center">Open the I'MU app and enter this code to continue.</p>
<p style="margin:0;font-size:12px;color:#9DB3A6;text-align:center">If you didn't request this, you can safely ignore this email.</p>
</td></tr>
<tr><td style="background:#1B4332;border-radius:0 0 20px 20px;padding:18px 40px;text-align:center">
<p style="margin:0 0 4px;font-size:13px;color:#52B788;font-weight:700">I'MU &mdash; Your AI Study Companion</p>
<p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6)">Study smarter. Live better.</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

// Send the OTP email via Gmail SMTP.
async function sendEmail(
  smtp: { host: string; port: number; user: string; pass: string; from: string },
  to: string,
  code: string,
  purpose: string,
) {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465, // true for 465, false for 587/STARTTLS
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: purpose === "recovery" ? "Reset your I'MU password" : "Verify your I'MU email",
    html: emailTemplate({ code, purpose }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const otpSalt = Deno.env.get("OTP_SALT") || "imu-otp-salt";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gmail SMTP credentials from env.
    const smtp = {
      host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
      port: Number(Deno.env.get("SMTP_PORT") || 465),
      user: Deno.env.get("SMTP_USER") || "",
      pass: Deno.env.get("SMTP_PASS") || "",
      from: Deno.env.get("SMTP_FROM") || "I'MU <hosteler.services@gmail.com>",
    };

    const { action, email, code, purpose = "signup", new_password } = await req.json();
    if (!email || typeof email !== "string") {
      return json({ error: "email is required" }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();

    if (action === "send") {
      const otp = genCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await supabase.from("otp_codes").insert({
        email: cleanEmail,
        code: hash(otp, otpSalt),
        purpose,
        expires_at: expiresAt,
        used: false,
      });

      await sendEmail(smtp, cleanEmail, otp, purpose);
      return json({ ok: true, message: "OTP sent", expires_in: 600 });
    }

    if (action === "verify") {
      if (!code || typeof code !== "string") {
        return json({ error: "code is required" }, 400);
      }
      const cleanCode = code.trim();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("otp_codes")
        .select("id, code, expires_at")
        .eq("email", cleanEmail)
        .eq("purpose", purpose)
        .eq("used", false)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return json({ ok: false, error: "Invalid or expired code" }, 400);
      }

      if (hash(cleanCode, otpSalt) !== data.code) {
        return json({ ok: false, error: "Incorrect code" }, 400);
      }

      await supabase.from("otp_codes").update({ used: true }).eq("id", data.id);

      const { data: userList, error: userErr } = await supabase
        .auth.admin.listUsers({ page: 1, perPage: 1000 });
      let userId: string | null = null;
      if (!userErr && userList) {
        const found = userList.users.find((u: any) => (u.email || "").toLowerCase() === cleanEmail);
        if (found) userId = found.id;
      }

      return json({ ok: true, userId });
    }

    if (action === "reset_password") {
      if (!code || typeof code !== "string" || !new_password) {
        return json({ error: "code and new_password are required" }, 400);
      }
      const cleanCode = code.trim();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("otp_codes")
        .select("id, code, expires_at")
        .eq("email", cleanEmail)
        .eq("purpose", "recovery")
        .eq("used", false)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data || hash(cleanCode, otpSalt) !== data.code) {
        return json({ ok: false, error: "Invalid or expired code" }, 400);
      }

      await supabase.from("otp_codes").update({ used: true }).eq("id", data.id);

      const { data: userList, error: userErr } = await supabase
        .auth.admin.listUsers({ page: 1, perPage: 1000 });
      let userId: string | null = null;
      if (!userErr && userList) {
        const found = userList.users.find((u: any) => (u.email || "").toLowerCase() === cleanEmail);
        if (found) userId = found.id;
      }
      if (!userId) {
        return json({ ok: false, error: "User not found" }, 404);
      }

      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        password: new_password,
      });
      if (updateErr) return json({ ok: false, error: String(updateErr) }, 500);

      return json({ ok: true, message: "Password updated" });
    }

    return json({ error: "unknown action" }, 400);
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});