import { NextResponse } from 'next/server';
import { getSystemPrompts, updateSystemPrompt } from '@/lib/supabase';

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
  return NextResponse.json({ success: true });
}
