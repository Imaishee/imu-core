import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = {
  fast: 'openai/gpt-oss-20b',
  reasoning: 'openai/gpt-oss-120b',
} as const;

const INTENT_MODEL: Record<string, keyof typeof MODELS> = {
  simple_chat: 'fast',
  academic_explanation: 'fast',
  planning: 'fast',
  daily_priorities: 'fast',
  complex_reasoning: 'reasoning',
  exam_prep: 'reasoning',
  progress_query: 'fast',
};

const INTENT_KEYWORDS: Record<string, string[]> = {
  simple_chat: ['hello', 'hi', 'hey', 'thanks', 'help'],
  academic_explanation: ['explain', 'what is', 'how does', 'define', 'describe', 'tell me about'],
  planning: ['plan', 'schedule', 'timetable', 'when should', 'how to prepare'],
  daily_priorities: ['today', 'tonight', 'what should', 'priority', 'focus'],
  complex_reasoning: ['analyze', 'compare', 'evaluate', 'critically', 'deep'],
  exam_prep: ['exam', 'test', 'quiz', 'prepare', 'revision', 'review', 'ready'],
  progress_query: ['progress', 'how am i doing', 'performance', 'grades', 'confidence'],
};

const SYSTEM_PROMPTS: Record<string, string> = {
  base: `You are IM'U, a personalized academic AI assistant for a BA Geography student at Visva-Bharati University.
You understand their context: Semester {semester}, Major in Geography, Minor in Philosophy.
Be concise, friendly, and academically focused. Use markdown when helpful.`,
  academic_explanation: `You are IM'U, an academic tutor. Explain concepts clearly with examples.
Relate to the student's Geography curriculum when possible.
Use analogies and simple language. Break complex ideas into steps.`,
  planning: `You are IM'U, a study planning assistant. Create realistic study schedules.
Consider: remaining time, topic difficulty, student's weak areas.
Output structured plans with time blocks and priorities.`,
  daily_priorities: `You are IM'U, a daily study coach. Suggest what to study tonight.
Consider: upcoming exams, weak areas, what was studied recently.
Be specific about topics and time allocation.`,
  complex_reasoning: `You are IM'U, an analytical academic assistant. Think deeply.
Provide multi-perspective analysis, cite relevant theories.
Connect Geography concepts to real-world examples.`,
  exam_prep: `You are IM'U, an exam preparation coach. Help the student prepare effectively.
Focus on high-yield topics, common question patterns.
Suggest practice strategies and self-assessment methods.`,
  progress_query: `You are IM'U, tracking the student's academic progress.
Analyze their completion rates, identify weak areas.
Give actionable recommendations to improve.`,
};

function classifyIntent(message: string): string {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return intent;
    }
  }
  return 'simple_chat';
}

function buildSystemPrompt(intent: string, profile?: Record<string, string>): string {
  const prompt = SYSTEM_PROMPTS[intent] || SYSTEM_PROMPTS.base;
  return prompt.replace('{semester}', profile?.semester || '1').replace('{major}', profile?.major || 'geography');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, history = [], profile } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    const intent = mode === 'ask' ? classifyIntent(message) : mode;

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: buildSystemIntent(intent, profile) },
      ...history.slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const modelKey = INTENT_MODEL[intent] || 'fast';

    const stream = await groq.chat.completions.create({
      model: MODELS[modelKey],
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('AI chat error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

function buildSystemIntent(intent: string, profile?: Record<string, string>): string {
  const prompt = SYSTEM_PROMPTS[intent] || SYSTEM_PROMPTS.base;
  return prompt
    .replace('{semester}', profile?.semester || '1')
    .replace('{major}', profile?.major || 'geography');
}
