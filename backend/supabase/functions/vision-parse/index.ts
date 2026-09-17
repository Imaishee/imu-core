import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a timetable extraction engine. The user will provide an image of a class schedule, timetable, or syllabus.

Extract ALL classes/lectures from the image and return a JSON array of classes. Each class must have:
- course_name: string (the subject/class name)
- course_code: string (if visible, otherwise empty string)
- instructor: string (if visible, otherwise empty string)
- room: string (if visible, otherwise empty string)
- building: string (if visible, otherwise empty string)
- day: string (one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
- start_time: string (24h HH:mm format)
- end_time: string (24h HH:mm format)
- reminder_minutes: 10

Rules:
- Extract EVERY class you can see, even if partially visible
- If a class repeats on multiple days, create separate entries for each day
- Convert all times to 24h HH:mm format
- If you cannot determine the end time, estimate based on typical class duration (50-90 minutes)
- If the image is unclear, do your best to extract what you can
- Return ONLY the JSON array, no other text

Return format:
{
  "classes": [
    { "course_name": "...", "course_code": "...", "instructor": "...", "room": "...", "building": "...", "day": "Monday", "start_time": "09:00", "end_time": "10:00", "reminder_minutes": 10 }
  ]
}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const groqApiKey = Deno.env.get("GROQ_API_KEY")!;
    const { image, prompt } = await req.json();

    if (!image || typeof image !== "string") {
      return json({ error: "image (base64 or URL) is required" }, 400);
    }

    // Build user message with image
    const userContent: any[] = [];
    if (prompt) {
      userContent.push({ type: "text", text: prompt });
    }
    userContent.push({
      type: "image_url",
      image_url: {
        url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`,
      },
    });

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return json({ error: err, classes: [] }, 500);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from response
    let classes: any[] = [];
    try {
      // Try direct JSON parse
      const parsed = JSON.parse(content);
      classes = parsed.classes || parsed;
      if (!Array.isArray(classes)) classes = [];
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          classes = parsed.classes || parsed;
          if (!Array.isArray(classes)) classes = [];
        } catch {
          // Try to find array in text
          const arrayMatch = content.match(/\[[\s\S]*?\]/);
          if (arrayMatch) {
            try {
              classes = JSON.parse(arrayMatch[0]);
              if (!Array.isArray(classes)) classes = [];
            } catch {}
          }
        }
      }
    }

    return json({ classes, raw_text: content });
  } catch (error) {
    return json({ error: String(error), classes: [] }, 500);
  }
});
