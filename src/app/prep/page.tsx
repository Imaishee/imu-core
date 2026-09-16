'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';

type PrepExam = { id: string; exam_key: string; name: string; full_name: string; icon: string; color: string; description: string; tags: string[]; };
type PrepGroup = { id: string; name: string; importance: string; group_number: number; topic_count: string; topics: { id: string; name: string; importance: string; }[]; };

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: 'bg-rose-500', high: 'bg-amber-500', medium: 'bg-blue-500',
};

export default function PrepPage() {
  const [exams, setExams] = useState<PrepExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [groups, setGroups] = useState<PrepGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/prep/exams').then(r => r.json()).then(d => {
      setExams(d.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedExam) return;
    fetch(`/api/prep/groups?exam=${selectedExam}`).then(r => r.json()).then(d => {
      setGroups(d.data || []);
      setExpandedGroup('');
    }).catch(() => {});
  }, [selectedExam]);

  const selectedExamObj = exams.find(e => e.exam_key === selectedExam);

  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Exam Prep</h1>
          <p className="text-sm text-gray-500">SSC, UPSC, UGC NET &amp; more</p>
        </div>

        {!selectedExam && (
          <section>
            <h3 className="font-bold text-gray-900 mb-3">Competitive Exams</h3>
            <div className="space-y-3">
              {exams.map((exam) => (
                <button
                  key={exam.exam_key}
                  onClick={() => setSelectedExam(exam.exam_key)}
                  className="card-interactive p-4 w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: exam.color + '15' }}>
                      {exam.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900">{exam.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{exam.full_name}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{exam.description}</p>
                      {exam.tags && exam.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exam.tags.map((tag, i) => (
                            <span key={i} className="tag bg-gray-100 text-gray-600">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {selectedExam && (
          <section>
            <button
              onClick={() => { setSelectedExam(''); setGroups([]); }}
              className="flex items-center gap-1 text-sm font-semibold text-violet-primary mb-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              All Exams
            </button>

            <div className="card-interactive p-4 mb-4" style={{ borderLeft: `4px solid ${selectedExamObj?.color || '#7C3AED'}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{selectedExamObj?.icon}</span>
                <h2 className="text-lg font-bold text-gray-900 font-display">{selectedExamObj?.name}</h2>
              </div>
              <p className="text-xs text-gray-500">{selectedExamObj?.full_name}</p>
              <p className="text-xs text-gray-400 mt-1">{selectedExamObj?.description}</p>
            </div>

            <div className="space-y-3">
              {groups.map((group) => {
                const isExpanded = expandedGroup === group.id;
                return (
                  <div key={group.id} className="card-interactive overflow-hidden">
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? '' : group.id)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${IMPORTANCE_COLORS[group.importance] || 'bg-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{group.name}</p>
                          <p className="text-xs text-gray-500">{group.topic_count} topics · {group.importance}</p>
                        </div>
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                    {isExpanded && group.topics && (
                      <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                        {group.topics.map((topic) => (
                          <div key={topic.id} className="flex items-start gap-2 py-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${IMPORTANCE_COLORS[topic.importance] || 'bg-gray-300'}`} />
                            <p className="text-sm text-gray-800">{topic.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Link
              href={`/videos?track=competitive`}
              className="card-interactive p-3 mt-4 flex items-center gap-3 block"
            >
              <div className="w-10 h-10 rounded-xl gradient-rose flex items-center justify-center text-white text-lg">🎬</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Watch Prep Videos</p>
                <p className="text-xs text-gray-500">YouTube lectures for this exam</p>
              </div>
            </Link>
          </section>
        )}

        {loading && (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 w-full" />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
