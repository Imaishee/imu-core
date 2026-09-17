import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Non-streaming, tool-calling endpoint. The streaming /chat function can only
// return prose, so it can never actually create a class or an alarm. This
// endpoint turns a natural-language request into structured actions the app
// applies to local state.
const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_class",
      description: "Add one class/recurring lecture to the user's weekly timetable.",
      parameters: {
        type: "object",
        properties: {
          course_name: { type: "string", description: "e.g. Data Structures" },
          course_code: { type: "string", description: "e.g. CSE201" },
          instructor: { type: "string" },
          room: { type: "string" },
          building: { type: "string" },
          day: {
            type: "string",
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          },
          start_time: { type: "string", description: "24h HH:mm" },
          end_time: { type: "string", description: "24h HH:mm" },
          reminder_minutes: { type: "integer", description: "minutes before class, default 10" },
        },
        required: ["course_name", "day", "start_time", "end_time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "parse_timetable",
      description: "Parse a pasted timetable (text/table) into many classes at once.",
      parameters: {
        type: "object",
        properties: {
          classes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                course_name: { type: "string" },
                course_code: { type: "string" },
                instructor: { type: "string" },
                room: { type: "string" },
                building: { type: "string" },
                day: {
                  type: "string",
                  enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                },
                start_time: { type: "string" },
                end_time: { type: "string" },
                reminder_minutes: { type: "integer" },
              },
              required: ["course_name", "day", "start_time", "end_time"],
            },
          },
        },
        required: ["classes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_class",
      description: "Remove classes from the timetable matching the given filters.",
      parameters: {
        type: "object",
        properties: {
          course_name: { type: "string" },
          course_code: { type: "string" },
          day: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_timetable",
      description: "Delete every class in the user's timetable.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_alarm",
      description: "Create an alarm/reminder at a given time, optionally repeating weekly.",
      parameters: {
        type: "object",
        properties: {
          label: { type: "string" },
          time: { type: "string", description: "24h HH:mm" },
          days: {
            type: "array",
            items: { type: "integer", minimum: 1, maximum: 7 },
            description: "ISO weekdays to repeat on (1=Monday..7=Sunday). Omit for a one-time alarm.",
          },
        },
        required: ["label", "time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_alarm",
      description: "Delete alarms whose label matches.",
      parameters: {
        type: "object",
        properties: { label: { type: "string" } },
        required: ["label"],
      },
    },
  },
];

const SYSTEM = `You are I'MU's scheduling engine. Convert the user's request into tool calls.
Rules:
- Only call tools for create/change/delete requests about classes or alarms. For plain chat, reply briefly and call no tools.
- Times are 24-hour "HH:mm".
- Days are full English names (Monday..Sunday) for classes; for alarms use ISO numbers 1=Monday..7=Sunday.
- Infer sensible values (course_code from course name, reminder_minutes 10) but never invent a day or time the user did not imply.
- If the user pastes a timetable blob, use parse_timetable with every class you can extract.
- Resolve relative phrases ("tomorrow", "next Monday", "in 2 hours") against the CURRENT TIME provided.
- After calling tools, reply with one short confirmation sentence.`;

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
    const {
      prompt,
      context,
      model = "openai/gpt-oss-120b",
      categories,
    } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return json({ error: "prompt is required" }, 400);
    }

    const wanted: string[] = Array.isArray(categories) && categories.length
      ? categories
      : ["classes", "alarms"];
    const tools = TOOLS.filter((t) => {
      const n = t.function.name;
      if (wanted.includes("classes") && (n.includes("class") || n === "parse_timetable" || n === "clear_timetable")) return true;
      if (wanted.includes("alarms") && n.includes("alarm")) return true;
      return false;
    });

    const now = new Date();
    const localIso = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(now);
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata", weekday: "long",
    }).format(now);

    let contextBlock = "";
    if (context) {
      const classes = Array.isArray(context.classes) ? context.classes : [];
      const alarms = Array.isArray(context.alarms) ? context.alarms : [];
      if (classes.length) {
        contextBlock += `\n\nCURRENT TIMETABLE:\n${classes.map((c: any) =>
          `- ${c.course_name ?? c.courseName}${c.course_code ? ` (${c.course_code})` : ""} on ${c.day} ${c.start_time ?? c.startTime}-${c.end_time ?? c.endTime}`,
        ).join("\n")}`;
      } else {
        contextBlock += "\n\nCURRENT TIMETABLE: (empty)";
      }
      if (alarms.length) {
        contextBlock += `\n\nCURRENT ALARMS:\n${alarms.map((a: any) =>
          `- ${a.label} at ${a.time}${Array.isArray(a.days) && a.days.length ? ` on days ${a.days.join(",")}` : " (one-time)"}`,
        ).join("\n")}`;
      }
    }

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `CURRENT TIME: ${localIso} (${weekday}, IST)${contextBlock}\n\nUSER REQUEST:\n${prompt}`,
          },
        ],
        tools,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 1500,
        parallel_tool_calls: true,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return json({ error: err, actions: [], reply: "" }, 500);
    }

    const data = await resp.json();
    const message = data.choices?.[0]?.message ?? {};
    const toolCalls = message.tool_calls ?? [];

    const actions = [];
    for (const call of toolCalls) {
      let args: unknown = {};
      try {
        args = JSON.parse(call.function?.arguments ?? "{}");
      } catch {
        args = {};
      }
      actions.push({ name: call.function?.name, args });
    }

    return json({ reply: message.content ?? "", actions });
  } catch (error) {
    return json({ error: String(error), actions: [], reply: "" }, 500);
  }
});
