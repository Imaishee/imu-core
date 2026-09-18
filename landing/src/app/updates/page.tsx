'use client';

import { useState, useEffect } from 'react';
import {
  Tag,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const SUPABASE_URL = 'https://cxiicvirllfdvcjwwcbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWljdmlybGxmZHZjand3Y2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTI2MjMsImV4cCI6MjEwNTAyODYyM30.XaNaSnX4S8_xqiOg1KvfhUzEcufspv0INMpfowLEcOY';

interface Release {
  version: string;
  release_notes: string;
  force_update: boolean;
  file_size: number;
  created_at: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatSize(bytes: number): string {
  return `~${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UpdatesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReleases() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/app_versions?select=*&order=created_at.desc&limit=10`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        const data = await res.json();
        setReleases(data || []);
      } catch {
        // fallback empty
      } finally {
        setLoading(false);
      }
    }
    fetchReleases();
  }, []);

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1F2A24' }}>
            What&apos;s new
          </h1>
          <p className="text-lg" style={{ color: '#5C6B62' }}>
            Every update, every fix, every improvement. Transparently.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw size={24} className="mx-auto animate-spin mb-3" style={{ color: '#52B788' }} />
            <p className="text-sm" style={{ color: '#5C6B62' }}>Loading release history...</p>
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: '#5C6B62' }}>No releases found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {releases.map((r, i) => (
              <div key={i} className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
                      color: '#FFFFFF',
                    }}
                  >
                    v{r.version}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                    style={
                      r.force_update
                        ? { background: 'rgba(234, 179, 8, 0.1)', color: '#B45309' }
                        : { background: 'rgba(45, 106, 79, 0.08)', color: '#2D6A4F' }
                    }
                  >
                    {r.force_update ? (
                      <>
                        <AlertTriangle size={10} /> Required Update
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={10} /> Optional
                      </>
                    )}
                  </span>
                  <span className="text-sm" style={{ color: '#5C6B62' }}>
                    {formatDate(r.created_at)}
                  </span>
                  <span className="text-xs" style={{ color: '#9DB3A6' }}>
                    {formatSize(r.file_size)}
                  </span>
                </div>

                {r.release_notes && (
                  <div className="space-y-2">
                    {r.release_notes.split('\n').filter(Boolean).map((line, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle2
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: '#52B788' }}
                        />
                        <span className="text-sm leading-relaxed" style={{ color: '#1F2A24' }}>
                          {line.trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
