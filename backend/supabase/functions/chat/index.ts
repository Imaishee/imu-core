import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Emit a status event the client can show as "thinking" — SSE-safe
function status(step: string, detail?: string) {
  return `data: ${JSON.stringify({ type: "status", step, detail })}\n\n`;
}

// Detect if a message likely needs web search
function needsWebSearch(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    "latest", "news", "today", "current", "price", "weather", "who is", "who won",
    "recent", "search", "find", "look up", "what happened", "when did",
    "stock", "score", "result", "update on", "tell me about", "do you know about",
    "what are", "how much", "view on", "trending", "best", "top", "review",
    "compare", "cost", "rates", "exchange", "crypto", "bitcoin", "recipe",
  ];
  return keywords.some(kw => lower.includes(kw));
}

// Simple free DuckDuckGo instant answer + search results
async function webSearch(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return "";
    const html = await resp.text();

    // Extract result titles + snippets
    const results: string[] = [];
    // DuckDuckGo html format: <a class="result__a" ...>title</a> ... <a class="result__snippet">snippet</a>
    const aMatches = html.match(/<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/g) || [];
    const sMatches = html.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g) || [];

    for (let i = 0; i < Math.min(aMatches.length, 5); i++) {
      const title = aMatches[i].replace(/<[^>]+>/g, "").trim();
      const snippet = sMatches[i] ? sMatches[i].replace(/<[^>]+>/g, "").trim() : "";
      results.push(`${i + 1}. ${title}\n${snippet}`);
    }
    return results.join("\n\n");
  } catch (e) {
    return "";
  }
}

// Simple webpage text extraction (for when user pastes a URL or for search results)
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 2000); // keep context window sensible
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

    // Auth — optional user context
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

    const { messages, conversation_id, model = "openai/gpt-oss-20b" } = await req.json();

    // Fetch active system prompt
    const { data: promptData } = await supabase
      .from("system_prompts")
      .select("prompt")
      .eq("is_active", true)
      .eq("name", "default")
      .single();

    const basePrompt = promptData?.prompt || "You are IM'U, a helpful AI study assistant.";

    // User profile context when authenticated
    let profileContext = "";
    if (userId) {
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("name, programme, year, semester, major, minor, university")
          .eq("id", userId)
          .single();
        if (prof) {
          profileContext = `\n\nUser Profile:\n- Name: ${prof.name}\n- University: ${prof.university}\n- Programme: ${prof.programme}\n- Year: ${prof.year}, Semester: ${prof.semester}\n- Major: ${prof.major}, Minor: ${prof.minor}\n\nAddress them by name when natural. Reference their studies when relevant.`;
        }
      } catch {}
    }

    // Knowledge graph context
    let knowledgeContext = "";
    if (userId) {
      const { data: knowledgeNodes } = await supabase
        .from("knowledge_nodes")
        .select("label, node_type, content")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (knowledgeNodes && knowledgeNodes.length > 0) {
        knowledgeContext = "\n\nUser Knowledge:\n" +
          knowledgeNodes.map((n: any) => `- ${n.label} (${n.node_type}): ${n.content || "no details"}`).join("\n");
      }
    }

    let systemPrompt = basePrompt + profileContext + knowledgeContext;

    // =========== WEB SEARCH LOGIC ===========
    const lastUserMsg = messages[messages.length - 1];
    const msgText = lastUserMsg?.content?.toString() || "";
    let webContext = "";
    const statusSteps: Array<{ step: string; detail?: string }> = [];

    // Check if any message contains a URL the user wants analyzed
    const urls = msgText.match(/https?:\/\/[^\s]+/g);
    if (urls && urls.length > 0) {
      for (const url of urls.slice(0, 3)) {
        try {
          statusSteps.push({ step: "scraping", detail: url });
          const scrapeResp = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
            signal: AbortSignal.timeout(8000),
          });
          if (scrapeResp.ok) {
            const html = await scrapeResp.text();
            const text = stripHtml(html);
            if (text.length > 100) {
              webContext += `\n\nWeb content from ${url}:\n${text}\n`;
            }
          }
        } catch {}
      }
    }

    // Web search if the user is asking about current/factual things
    if (needsWebSearch(msgText)) {
      statusSteps.push({ step: "thinking" });
      statusSteps.push({ step: "searching", detail: msgText.substring(0, 80) });
      const results = await webSearch(msgText);
      if (results) {
        const sources = results.split("\n\n").map(r => {
          const m = r.match(/^\d+\.\s*(.+)/);
          return m ? m[1] : "";
        }).filter(Boolean).slice(0, 3);
        statusSteps.push({ step: "search_done", detail: `${sources.length} sources found` });
        webContext += `\n\nWeb Search Results:\n${results}\n\nUse these sources to answer accurately. Cite which source provides each fact (e.g., "According to Source 1...").`;
      }
    }

    if (webContext) {
      systemPrompt += `\n\n=== WEB CONTEXT ===${webContext}\n\nIMPORTANT: If you used web sources, say where information came from. Do not make up sources.`;
    }
    // ========================================

    // Call Groq
    const groqBody = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      max_tokens: 2048,
      temperature: 0.75,
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
      body: JSON.stringify(groqBody),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Send thinking/status events BEFORE the content
        for (const notif of statusSteps) {
          controller.enqueue(encoder.encode(status(notif.step, notif.detail)));
          await new Promise(r => setTimeout(r, 200)); // slight delay so it feels like thinking
        }

        let fullContent = "";
        let buffer = "";

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
                // Save to DB
                if (conversation_id && fullContent && userId) {
                  await supabase.from("messages").insert({
                    conversation_id, role: "user", content: msgText,
                  });
                  await supabase.from("messages").insert({
                    conversation_id, role: "assistant", content: fullContent, model,
                  });
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
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              } catch {}
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});