'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import {
  Download,
  CheckCircle2,
  Shield,
  Zap,
  HardDrive,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Logo from '@/components/Logo';

const SUPABASE_URL = 'https://cxiicvirllfdvcjwwcbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWljdmlybGxmZHZjand3Y2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTI2MjMsImV4cCI6MjEwNTAyODYyM30.XaNaSnX4S8_xqiOg1KvfhUzEcufspv0INMpfowLEcOY';

interface VersionInfo {
  version: string;
  download_url: string;
  release_notes: string;
  file_size: number;
  created_at: string;
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `~${mb.toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function DownloadPage() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchVersion() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/app_versions?select=*&order=created_at.desc&limit=1`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setVersion(data[0]);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchVersion();
  }, []);

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <Logo size={96} rounded="3xl" className="mx-auto mb-8" />

        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1F2A24' }}>
          Get I&apos;MU
        </h1>
        <p className="text-lg mb-10 max-w-md mx-auto" style={{ color: '#5C6B62' }}>
          Free. No ads. No tracking. Just an AI that actually helps.
        </p>

        {/* Download Card */}
        <div className="glass-card p-8 md:p-12 mb-8">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
              <Logo size={48} rounded="xl" />
              <div className="text-left">
                <p className="font-semibold text-lg" style={{ color: '#1F2A24' }}>
                  Android APK
                </p>
                <p className="text-sm" style={{ color: '#5C6B62' }}>
                  Android 7.0+
                  {version && <span> &middot; {formatSize(version.file_size)}</span>}
                </p>
              </div>
            </div>

            {loading ? (
              <div
                className="w-full max-w-sm px-8 py-4 rounded-full font-semibold text-lg text-center"
                style={{ background: '#E9E0CE', color: '#5C6B62' }}
              >
                <RefreshCw size={18} className="inline animate-spin mr-2" />
                Loading version info...
              </div>
            ) : error || !version ? (
              <div
                className="w-full max-w-sm px-8 py-4 rounded-full font-semibold text-lg text-center"
                style={{ background: '#FEE2E2', color: '#991B1B' }}
              >
                <AlertCircle size={18} className="inline mr-2" />
                Could not load version info
              </div>
            ) : (
              <a
                href={version.download_url}
                download
                className="w-full max-w-sm px-8 py-4 rounded-full font-semibold text-lg text-white transition-all cute-press inline-block text-center"
                style={{
                  background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
                  boxShadow: '0 4px 20px rgba(45, 106, 79, 0.3)',
                }}
              >
                <Download size={18} className="inline mr-2 -mt-0.5" />
                Download v{version.version}
              </a>
            )}

            {version && (
              <p className="text-xs" style={{ color: '#5C6B62' }}>
                Current version: <span style={{ color: '#2D6A4F' }} className="font-medium">v{version.version}</span> &middot; Updated {formatDate(version.created_at)}
              </p>
            )}
          </div>
        </div>

        {/* What's New */}
        {version && version.release_notes && (
          <div className="glass-card p-6 mb-8 text-left">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#1F2A24' }}>
              <RefreshCw size={14} style={{ color: '#2D6A4F' }} />
              What&apos;s New in v{version.version}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#5C6B62' }}>
              {version.release_notes}
            </p>
          </div>
        )}

        {/* Install Instructions */}
        <div className="glass-card p-8 text-left mb-8">
          <h2 className="font-bold text-lg mb-4" style={{ color: '#1F2A24' }}>
            How to install
          </h2>
          <ol className="space-y-3">
            {[
              'Download the APK file using the button above.',
              'Open the file. If prompted, enable "Install from unknown sources" in Settings.',
              'Tap Install and wait a few seconds.',
              'Open I\'MU and start chatting.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                  style={{ background: '#2D6A4F' }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: '#5C6B62' }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, label: 'Instant Updates', desc: 'Auto-updates on launch' },
            { icon: Shield, label: 'Verified APK', desc: 'Checksum verified' },
            { icon: HardDrive, label: 'Lightweight', desc: version ? formatSize(version.file_size) : '~22 MB' },
          ].map((f, i) => (
            <div key={i} className="glass-card p-5 text-center">
              <f.icon size={20} className="mx-auto mb-2" style={{ color: '#2D6A4F' }} />
              <p className="text-sm font-semibold" style={{ color: '#1F2A24' }}>{f.label}</p>
              <p className="text-xs" style={{ color: '#5C6B62' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Auto-update note */}
        <div className="mt-8 glass-card p-6 text-left">
          <p className="text-sm flex items-start gap-2" style={{ color: '#5C6B62' }}>
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: '#2D6A4F' }} />
            <span>
              <span className="font-medium" style={{ color: '#1F2A24' }}>Auto-updates:</span>{' '}
              I&apos;MU checks for new versions on launch. When an update is available,
              it downloads in the background and installs automatically — no extra steps needed.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
