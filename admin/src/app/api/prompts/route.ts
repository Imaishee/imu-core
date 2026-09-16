import { NextResponse } from 'next/server';
import { getSystemPrompts, updateSystemPrompt, getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await getSystemPrompts();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prompts: data });
}

export async function PATCH(request: Request) {
  const { id, prompt } = await request.json();
  const { error } = await updateSystemPrompt(id, prompt);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const supabase = getSupabase();
  await supabase.from('activity_log').insert({
    action: 'prompt_updated',
    target_type: 'system_prompt',
    target_id: id,
    metadata: { prompt_preview: prompt.substring(0, 100) },
  });

  return NextResponse.json({ success: true });
}
