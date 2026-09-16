import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track');

    let result;
    if (track) {
      result = await query(
        `SELECT * FROM youtube_videos WHERE track = $1 ORDER BY published_at DESC NULLS LAST, title`,
        [track]
      );
    } else {
      result = await query(
        `SELECT *, 
          CASE WHEN track = 'geographyExams' THEN 'Geography' 
               WHEN track = 'competitive' THEN 'Competitive Exams'
               ELSE track END as track_label
         FROM youtube_videos ORDER BY track, title`
      );
    }

    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
