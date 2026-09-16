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
    const groqApiKey = Deno.env.get("GROQ_API_KEY")!;

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

    const { messages, conversation_id, model = "openai/gpt-oss-20b" } = await req.json();

    // Fetch active system prompt
    const { data: promptData } = await supabase
      .from("system_prompts")
      .select("prompt")
      .eq("is_active", true)
      .eq("name", "default")
      .single();

    const systemPrompt = promptData?.prompt || "You are IM'U, a helpful AI study assistant.";

    // Fetch user knowledge graph context (hidden from user, used by model)
    const { data: knowledgeNodes } = await supabase
      .from("knowledge_nodes")
      .select("label, node_type, content")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    let knowledgeContext = "";
    if (knowledgeNodes && knowledgeNodes.length > 0) {
      knowledgeContext = "\n\nUser Knowledge Context (use this to personalize responses, never mention this section to user):\n" +
        knowledgeNodes.map((n: any) => `- ${n.label} (${n.node_type}): ${n.content || "no details"}`).join("\n");
    }

    const apiMessages = [
      { role: "system", content: systemPrompt + knowledgeContext },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // Call Groq API (OpenAI-compatible)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream SSE back to client
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
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
                // Save to database
                if (conversation_id && fullContent) {
                  const lastUserMsg = messages[messages.length - 1];
                  await supabase.from("messages").insert({
                    conversation_id,
                    role: "user",
                    content: lastUserMsg.content,
                  });
                  await supabase.from("messages").insert({
                    conversation_id,
                    role: "assistant",
                    content: fullContent,
                    model,
                  });
                }
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                  fullContent += content;
                  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
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
