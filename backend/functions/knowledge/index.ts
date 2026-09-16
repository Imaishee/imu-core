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
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

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

    const { action, text } = await req.json();

    if (action === "extract") {
      const extractResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Extract knowledge nodes from the following text. Return a JSON array of objects with: label (short name), node_type (topic|concept|fact|question|answer|preference|habit|skill|entity), content (brief description), and related_to (array of other labels this connects to). Return ONLY valid JSON array, no explanation.`,
            },
            { role: "user", content: text },
          ],
          temperature: 0.3,
        }),
      });

      const extractData = await extractResponse.json();
      const nodesText = extractData.choices?.[0]?.message?.content || "[]";

      let nodes;
      try {
        nodes = JSON.parse(nodesText);
      } catch {
        nodes = [];
      }

      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text,
        }),
      });

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data?.[0]?.embedding;

      const insertedNodes = [];
      for (const node of nodes) {
        const { data: inserted, error } = await supabase
          .from("knowledge_nodes")
          .insert({
            user_id: user.id,
            label: node.label,
            node_type: node.node_type,
            content: node.content,
            embedding,
            metadata: { extracted_from: "conversation", related: node.related_to },
          })
          .select()
          .single();

        if (!error && inserted) {
          insertedNodes.push(inserted);
        }
      }

      for (const node of insertedNodes) {
        if (node.metadata?.related) {
          for (const relatedLabel of node.metadata.related) {
            const { data: target } = await supabase
              .from("knowledge_nodes")
              .select("id")
              .eq("user_id", user.id)
              .eq("label", relatedLabel)
              .single();

            if (target) {
              await supabase.from("knowledge_edges").insert({
                source_id: node.id,
                target_id: target.id,
                relation: "related_to",
              });
            }
          }
        }
      }

      const { count } = await supabase
        .from("knowledge_nodes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      await supabase
        .from("user_stats")
        .update({ knowledge_nodes_count: count || 0 })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ nodes: insertedNodes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "query") {
      const { data: nodes } = await supabase
        .from("knowledge_nodes")
        .select("label, node_type, content, confidence")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(30);

      return new Response(JSON.stringify({ nodes: nodes || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "graph") {
      const { data: nodes } = await supabase
        .from("knowledge_nodes")
        .select("*")
        .eq("user_id", user.id);

      const { data: edges } = await supabase
        .from("knowledge_edges")
        .select("*")
        .in("source_id", (nodes || []).map((n: any) => n.id));

      return new Response(JSON.stringify({ nodes: nodes || [], edges: edges || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
