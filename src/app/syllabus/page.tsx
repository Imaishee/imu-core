'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TouchFeedback } from '@/components/layout/TouchFeedback';

type Unit = { id: string; name: string; unit_number: number; subject_id: string; };
type Topic = { id: string; name: string; unit_id: string; number: string; importance: string; };
type Subject = { id: string; code: string; name: string; semester_id: string; topic_count: string; done_count: string; };
type Semester = { id: string; semester_number: number; label: string; credits: string; subject_count: string; };

const COLORS = ['bg-violet-glow text-violet-primary', 'bg-coral-50 text-coral-primary', 'bg-mint-50 text-mint-primary', 'bg-amber-50 text-amber-primary', 'bg-rose-50 text-rose-primary'];

function SyllabusContent() {
  const searchParams = useSearchParams();
  const highlightCode = searchParams.get('highlight');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSem, setSelectedSem] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(highlightCode || '');
  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expandedUnit, setExpandedUnit] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/syllabus').then(r => r.json()).then(d => {
      const tree = d.data || [];
      const sems: Semester[] = [];
      tree.forEach((prog: any) => {
        (prog.years || []).forEach((year: any) => {
          (year.semesters || []).forEach((sem: any) => {
            sems.push({
              id: sem.id,
              semester_number: sem.semester_number,
              label: sem.label,
              credits: sem.credits,
              subject_count: (sem.subjects || []).length,
            });
          });
        });
      });
      setSemesters(sems.sort((a, b) => a.semester_number - b.semester_number));
      if (sems.length > 0 && !selectedSem) setSelectedSem(sems[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSem) return;
    fetch('/api/syllabus').then(r => r.json()).then(d => {
      const tree = d.data || [];
      let semSubjects: Subject[] = [];
      tree.forEach((prog: any) => {
        (prog.years || []).forEach((year: any) => {
          (year.semesters || []).forEach((sem: any) => {
            if (sem.id === selectedSem) {
              (sem.subjects || []).forEach((subj: any) => {
                semSubjects.push({
                  id: subj.id, code: subj.code, name: subj.name, semester_id: sem.id,
                  topic_count: countTopics(subj), done_count: '0',
                });
              });
            }
          });
        });
      });
      setSubjects(semSubjects);
      setSelectedSubject('');
      setUnits([]);
      setTopics([]);
    }).catch(() => {});
  }, [selectedSem]);

  useEffect(() => {
    if (!selectedSubject) return;
    fetch('/api/syllabus').then(r => r.json()).then(d => {
      const tree = d.data || [];
      tree.forEach((prog: any) => {
        (prog.years || []).forEach((year: any) => {
          (year.semesters || []).forEach((sem: any) => {
            (sem.subjects || []).forEach((subj: any) => {
              if (subj.code === selectedSubject) {
                const unitsList: Unit[] = (subj.groups || []).map((g: any) => ({
                  id: g.name, name: g.name, unit_number: g.unit_number, subject_id: subj.id,
                }));
                setUnits(unitsList);
                const topicsList: Topic[] = [];
                (subj.groups || []).forEach((g: any) => {
                  (g.topics || []).forEach((t: any) => {
                    topicsList.push({
                      id: t.name, name: t.name, unit_id: g.name,
                      number: t.number, importance: t.importance || 'medium',
                    });
                  });
                });
                setTopics(topicsList);
              }
            });
          });
        });
      });
    }).catch(() => {});
  }, [selectedSubject]);

  function countTopics(subj: any): string {
    let count = 0;
    (subj.groups || []).forEach((g: any) => { count += (g.topics || []).length; });
    return String(count);
  }

  const selectedSubjectObj = subjects.find(s => s.code === selectedSubject);

  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Syllabus</h1>
          <p className="text-sm text-gray-500">Visva-Bharati B.A. Geography (Hons.) NEP 2020</p>
        </div>

        {/* Semester Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {semesters.map((sem) => (
            <button
              key={sem.id}
              onClick={() => setSelectedSem(sem.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedSem === sem.id ? 'tab-active' : 'tab-inactive'
              }`}
            >
              Sem {sem.semester_number}
            </button>
          ))}
        </div>

        {/* Subjects */}
        {!selectedSubject && (
          <section>
            <h3 className="font-bold text-gray-900 mb-2">Subjects ({subjects.length})</h3>
            <div className="space-y-2">
              {subjects.map((subj, i) => (
                <TouchFeedback key={subj.code}>
                  <button
                    onClick={() => setSelectedSubject(subj.code)}
                    className="card-interactive p-3 w-full text-left flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-xl ${COLORS[i % COLORS.length]} flex items-center justify-center font-bold text-xs flex-shrink-0`}>
                      {subj.code.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{subj.name}</p>
                      <p className="text-xs text-gray-500">{subj.code} · {subj.topic_count} topics</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </TouchFeedback>
              ))}
            </div>
          </section>
        )}

        {/* Units + Topics */}
        {selectedSubject && (
          <section>
            <button
              onClick={() => { setSelectedSubject(''); setUnits([]); setTopics([]); }}
              className="flex items-center gap-1 text-sm font-semibold text-violet-primary mb-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to Subjects
            </button>

            <div className="card-interactive p-4 mb-4">
              <h2 className="text-lg font-bold text-gray-900 font-display">{selectedSubjectObj?.name}</h2>
              <p className="text-xs text-gray-500 mt-1">{selectedSubjectObj?.code} · {topics.length} topics · {units.length} units</p>
            </div>

            <div className="space-y-3">
              {units.map((unit) => {
                const unitTopics = topics.filter(t => t.unit_id === unit.name);
                const isExpanded = expandedUnit === unit.name || units.length <= 4;
                return (
                  <TouchFeedback key={unit.name}>
                    <div className="card-interactive overflow-hidden">
                      <button
                        onClick={() => setExpandedUnit(isExpanded && units.length > 4 ? '' : unit.name)}
                        className="w-full p-3 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-violet-glow flex items-center justify-center text-violet-primary font-bold text-xs">
                            U{unit.unit_number}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{unit.name}</p>
                            <p className="text-xs text-gray-500">{unitTopics.length} topics</p>
                          </div>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                          {unitTopics.map((topic) => (
                            <div key={topic.name} className="flex items-start gap-2 py-2">
                              <div className="w-5 h-5 rounded-lg border-2 border-gray-200 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-800">{topic.name}</p>
                                <p className="text-xs text-gray-400">Topic {topic.number}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TouchFeedback>
                );
              })}
            </div>
          </section>
        )}

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SyllabusPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-8"><div className="skeleton h-8 w-32 mb-4" /><div className="skeleton h-12 w-full mb-2" /><div className="skeleton h-12 w-full mb-2" /><div className="skeleton h-12 w-full" /></div>}>
      <SyllabusContent />
    </Suspense>
  );
}
