import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getUsers();
    return NextResponse.json({ users: result.users, total: result.users.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch users' }, { status: 500 });
  }
}
