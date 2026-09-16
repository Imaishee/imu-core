import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(`
      SELECT
        p.id as programme_id, p.name as programme_name,
        ay.id as year_id, ay.year_number, ay.label as year_label,
        s.id as semester_id, s.semester_number, s.label as semester_label, s.credits,
        sub.id as subject_id, sub.code, sub.name as subject_name,
        u.id as unit_id, u.name as unit_name, u.unit_number,
        t.id as topic_id, t.name as topic_name, t.number as topic_number, t.importance
      FROM programmes p
      JOIN academic_years ay ON ay.programme_id = p.id
      JOIN semesters s ON s.academic_year_id = ay.id
      LEFT JOIN subjects sub ON sub.semester_id = s.id
      LEFT JOIN units u ON u.subject_id = sub.id
      LEFT JOIN topics t ON t.unit_id = u.id
      ORDER BY p.name, ay.year_number, s.semester_number, sub.code, u.unit_number, t.name
    `);

    const rows = result.rows;

    // Build nested tree from flat rows
    const progMap = new Map<string, any>();
    const yearMap = new Map<string, any>();
    const semMap = new Map<string, any>();
    const subjMap = new Map<string, any>();
    const unitMap = new Map<string, any>();

    for (const row of rows) {
      // Programme
      if (!progMap.has(row.programme_id)) {
        progMap.set(row.programme_id, {
          id: row.programme_id, name: row.programme_name, years: []
        });
      }
      const prog = progMap.get(row.programme_id);

      // Year
      const yearKey = row.year_id;
      if (yearKey && !yearMap.has(yearKey)) {
        yearMap.set(yearKey, {
          id: row.year_id, year_number: row.year_number, label: row.year_label, semesters: []
        });
        prog.years.push(yearMap.get(yearKey));
      }
      const year = yearMap.get(yearKey);

      // Semester
      const semKey = row.semester_id;
      if (semKey && year && !semMap.has(semKey)) {
        semMap.set(semKey, {
          id: row.semester_id, semester_number: row.semester_number,
          label: row.semester_label, credits: row.credits, subjects: []
        });
        year.semesters.push(semMap.get(semKey));
      }
      const sem = semMap.get(semKey);

      // Subject
      const subjKey = row.subject_id;
      if (subjKey && sem && !subjMap.has(subjKey)) {
        subjMap.set(subjKey, {
          id: row.subject_id, code: row.code, name: row.subject_name,
          semester_id: sem.id, groups: []
        });
        sem.subjects.push(subjMap.get(subjKey));
      }
      const subj = subjMap.get(subjKey);

      // Unit (group)
      const unitKey = row.unit_id;
      if (unitKey && subj && !unitMap.has(unitKey)) {
        unitMap.set(unitKey, {
          id: row.unit_id, name: row.unit_name, unit_number: row.unit_number,
          subject_id: subj.id, topics: []
        });
        subj.groups.push(unitMap.get(unitKey));
      }
      const unit = unitMap.get(unitKey);

      // Topic
      if (row.topic_id && unit) {
        unit.topics.push({
          id: row.topic_id, name: row.topic_name,
          number: row.topic_number, importance: row.importance || 'medium'
        });
      }
    }

    const tree = Array.from(progMap.values());

    // Also return flat topics for game components
    const topics = rows
      .filter(r => r.topic_name)
      .map(r => ({
        id: r.topic_id,
        name: r.topic_name,
        unit: r.unit_name,
        description: r.topic_name + ' — ' + r.unit_name + ', ' + r.subject_name,
        subject: r.subject_name,
        importance: r.importance || 'medium',
      }));

    return NextResponse.json({ data: tree, topics });
  } catch (error: any) {
    console.error('Syllabus API error:', error);
    return NextResponse.json({ error: error.message, data: [], topics: [] }, { status: 500 });
  }
}
