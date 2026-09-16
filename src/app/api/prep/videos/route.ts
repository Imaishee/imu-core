import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('video_id');
    const prepTopicId = searchParams.get('prep_topic_id');

    if (videoId) {
      const result = await query(
        `SELECT vpm.*, pt.name as topic_name, pe.name as exam_name, pg.name as group_name
         FROM video_prep_map vpm
         JOIN prep_topics pt ON pt.id = vpm.prep_topic_id
         JOIN prep_groups pg ON pg.id = pt.group_id
         JOIN prep_exams pe ON pe.id = pg.exam_id
         WHERE vpm.video_id = $1`,
        [videoId]
      );
      return NextResponse.json({ data: result.rows });
    }

    if (prepTopicId) {
      const result = await query(
        `SELECT vpm.*, yv.title as video_title, yv.youtube_id, yv.url, yv.channel, yv.duration_display
         FROM video_prep_map vpm
         JOIN youtube_videos yv ON yv.id = vpm.video_id
         WHERE vpm.prep_topic_id = $1`,
        [prepTopicId]
      );
      return NextResponse.json({ data: result.rows });
    }

    return NextResponse.json({ error: 'video_id or prep_topic_id required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
