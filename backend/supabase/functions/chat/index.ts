import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Available models — client can request any of these; first is default
const MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
];
const DEFAULT_MODEL = MODELS[0];
const FALLBACK_MODEL = MODELS[1];

function status(step: string, detail?: string) {
  return `data: ${JSON.stringify({ type: "status", step, detail })}\n\n`;
}

// Detect if a message likely needs web search
function needsWebSearch(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    "latest", "news", "today", "current", "price", "weather", "who is", "who won",
    "recent", "search", "find", "look up", "what happened", "when did",
    "stock", "score", "result", "trending", "best", "top", "review", "compare",
  ];
  return keywords.some(kw => lower.includes(kw));
}

async function webSearch(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return "";
    const html = await resp.text();
    const aMatches = html.match(/<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/g) || [];
    const sMatches = html.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g) || [];
    const results: string[] = [];
    for (let i = 0; i < Math.min(aMatches.length, 5); i++) {
      const title = aMatches[i].replace(/<[^>]+>/g, "").trim();
      const snippet = sMatches[i] ? sMatches[i].replace(/<[^>]+>/g, "").trim() : "";
      results.push(`${i + 1}. ${title}\n${snippet}`);
    }
    return results.join("\n\n");
  } catch { return ""; }
}

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 1500);
}

// Truncate system prompt to fit within model context limits
function truncatePrompt(prompt: string, maxLen = 4000): string {
  if (prompt.length <= maxLen) return prompt;
  // Keep first 2000 chars (usually the core instructions) + last part
  const keep = maxLen - 200;
  return prompt.substring(0, 2000) + `\n\n[... truncated for speed, ${prompt.length - 2000} chars removed ...]\n\n` + prompt.substring(prompt.length - keep);
}

// Call Groq API with retry + fallback
async function callGroq(
  groqApiKey: string,
  systemPrompt: string,
  userMessages: any[],
  model: string,
  stream = true,
): Promise<Response> {
  const body: any = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...userMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ],
    stream,
    max_tokens: 2048,
    temperature: 0.75,
  };

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
    body: JSON.stringify(body),
  });

  return resp;
}

// Fallback non-streaming call to get at least something back
async function fallbackCall(
  groqApiKey: string,
  systemPrompt: string,
  userMessages: any[],
): Promise<string> {
  try {
    const resp = await callGroq(groqApiKey, systemPrompt, userMessages, FALLBACK_MODEL, false);
    if (!resp.ok) return "";
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } catch { return ""; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const groqApiKey = Deno.env.get("GROQ_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;
    let userProfile: any = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const userClient = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) userId = user.id;
      } catch {}
    }

    const { messages, conversation_id, model = DEFAULT_MODEL, context } = await req.json();

    // Validate requested model
    const requestedModel = MODELS.includes(model) ? model : DEFAULT_MODEL;

    // Fetch active system prompt
    const { data: promptData } = await supabase
      .from("system_prompts")
      .select("prompt")
      .eq("is_active", true)
      .eq("name", "default")
      .single();

    const basePrompt = promptData?.prompt || "You are I'MU, a helpful AI study assistant.";

    // User profile context
    let profileContext = "";
    if (userId) {
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("name, programme, year, semester, major, minor, university")
          .eq("id", userId)
          .single();
        if (prof) {
          profileContext = `\nUser: ${prof.name}. Uni: ${prof.university}. Programme: ${prof.programme}. Year ${prof.year} Sem ${prof.semester}. Major: ${prof.major}.`;
        }
      } catch {}
    }

    // Knowledge context
    let knowledgeContext = "";
    if (userId) {
      const { data: kn } = await supabase
        .from("knowledge_nodes")
        .select("label, node_type, content")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (kn && kn.length > 0) {
        knowledgeContext = "\nKnowledge:\n" + kn.map((n: any) => `- ${n.label} (${n.node_type})`).join("\n");
      }
    }

    // TIMETABLE + ALARM context
    let scheduleContext = "";
    if (context && typeof context === "object") {
      const classes = Array.isArray(context.classes) ? context.classes : [];
      const alarms = Array.isArray(context.alarms) ? context.alarms : [];
      if (classes.length) {
        scheduleContext += `\nTimetable:\n${classes.map((c: any) =>
          `- ${c.course_name}${c.course_code ? ` (${c.course_code})` : ""} ${c.day} ${c.start_time}-${c.end_time}${c.room ? ` ${c.room}` : ""}${c.instructor ? ` ${c.instructor}` : ""}`,
        ).join("\n")}`;
      }
      if (alarms.length) {
        scheduleContext += `\nAlarms:\n${alarms.map((a: any) =>
          `- "${a.label}" ${a.time}${Array.isArray(a.days) && a.days.length ? ` ${a.days.join(",")}` : ""}`,
        ).join("\n")}`;
      }
      scheduleContext += "\nFor schedule/alarm changes, confirm briefly — app handles actual changes.";
    }

    // Build final system prompt and truncate
    let systemPrompt = truncatePrompt(basePrompt + profileContext + knowledgeContext + scheduleContext);

    // Web search
    const lastUserMsg = messages[messages.length - 1];
    const msgText = lastUserMsg?.content?.toString() || "";
    let webContext = "";
    const statusSteps: Array<{ step: string; detail?: string }> = [];

    // URL scraping
    const urls = msgText.match(/https?:\/\/[^\s]+/g);
    if (urls && urls.length > 0) {
      for (const url of urls.slice(0, 2)) {
        try {
          statusSteps.push({ step: "scraping", detail: url.substring(0, 60) });
          const scrapeResp = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
            signal: AbortSignal.timeout(6000),
          });
          if (scrapeResp.ok) {
            const text = stripHtml(await scrapeResp.text());
            if (text.length > 100) webContext += `\nWeb: ${url.substring(0, 50)}\n${text}\n`;
          }
        } catch {}
      }
    }

    // Web search
    if (needsWebSearch(msgText)) {
      statusSteps.push({ step: "searching", detail: msgText.substring(0, 60) });
      const results = await webSearch(msgText);
      if (results) {
        webContext += `\nSearch results:\n${results}`;
      }
    }

    if (webContext) {
      systemPrompt += `\n\n${webContext}`;
      // Re-truncate after adding web context
      systemPrompt = truncatePrompt(systemPrompt);
    }

    // FIRST attempt — primary model, streaming
    let response = await callGroq(groqApiKey, systemPrompt, messages, requestedModel);

    // RETRY — if first call fails, try fallback model
    if (!response.ok) {
      statusSteps.push({ step: "thinking", detail: "Retrying..." });
      response = await callGroq(groqApiKey, systemPrompt, messages, FALLBACK_MODEL);
    }

    if (!response.ok) {
      // Last resort: non-streaming fallback
      const fallbackContent = await fallbackCall(groqApiKey, systemPrompt, messages);
      if (fallbackContent) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fallbackContent } }] })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      }
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for (const notif of statusSteps) {
          controller.enqueue(encoder.encode(status(notif.step, notif.detail)));
          await new Promise(r => setTimeout(r, 150));
        }

        let fullContent = "";
        let buffer = "";
        let receivedAnyContent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                // If AI returned nothing, send a fallback response
                if (!receivedAnyContent || fullContent.length === 0) {
                  const fallback = "I apologize — I couldn't generate a full response. Could you try rephrasing your message?";
                  fullContent = fallback;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fallback } }] })}\n\n`));
                  receivedAnyContent = true;
                }
                // Save to DB
                if (conversation_id && userId) {
                  try {
                    await supabase.from("messages").insert({
                      conversation_id, role: "user", content: msgText,
                    });
                    await supabase.from("messages").insert({
                      conversation_id, role: "assistant", content: fullContent, model: requestedModel,
                    });
                  } catch {}
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                  fullContent += content;
                  receivedAnyContent = true;
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              } catch {}
            }
          }
        }

        // Stream ended without [DONE] — still send fallback if empty
        if (!receivedAnyContent || fullContent.length === 0) {
          const fallback = "I apologize — I couldn't generate a full response. Could you try rephrasing your message?";
          fullContent = fallback;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fallback } }] })}\n\n`));
        }
        if (conversation_id && userId) {
          try {
            await supabase.from("messages").insert({
              conversation_id, role: "user", content: msgText,
            });
            await supabase.from("messages").insert({
              conversation_id, role: "assistant", content: fullContent, model: requestedModel,
            });
          } catch {}
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
