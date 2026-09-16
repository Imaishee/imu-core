import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const programmes = await query('SELECT * FROM programmes ORDER BY name');
    const years = await query('SELECT * FROM academic_years ORDER BY year_number');
    const semesters = await query('SELECT * FROM semesters ORDER BY semester_number');
    const subjects = await query('SELECT * FROM subjects ORDER BY code');
    const units = await query('SELECT * FROM units ORDER BY unit_number');
    const topics = await query('SELECT * FROM topics ORDER BY name');

    const tree = programmes.rows.map((prog: any) => ({
      ...prog,
      years: years.rows.filter((y: any) => y.programme_id === prog.id).map((year: any) => ({
        ...year,
        semesters: semesters.rows.filter((s: any) => s.academic_year_id === year.id).map((sem: any) => ({
          ...sem,
          subjects: subjects.rows.filter((s: any) => s.semester_id === sem.id).map((subj: any) => ({
            ...subj,
            units: units.rows.filter((u: any) => u.subject_id === subj.id).map((unit: any) => ({
              ...unit,
              topics: topics.rows.filter((t: any) => t.unit_id === unit.id),
            })),
          })),
        })),
      })),
    }));

    return NextResponse.json({ data: tree });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
