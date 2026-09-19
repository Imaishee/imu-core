'use client';

import { useEffect, useState, useRef } from 'react';

interface AppVersion {
  id: string;
  version: string;
  download_url: string;
  release_notes: string;
  force_update: boolean;
  file_size: number;
  created_at: string;
}

export default function UpdatesPage() {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formVersion, setFormVersion] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formForce, setFormForce] = useState(false);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formUrl, setFormUrl] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchVersions();
  }, []);

  async function fetchVersions() {
    setLoading(true);
    const res = await fetch('/api/app-versions');
    const data = await res.json();
    setVersions(data.versions || []);
    setLoading(false);
  }

  async function handleUpload() {
    if (!formVersion.trim()) {
      setFormError('Version is required');
      return;
    }
    if (!formFile && !formUrl.trim()) {
      setFormError('Either upload an APK file or provide a download URL');
      return;
    }

    setUploading(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('version', formVersion.trim());
      formData.append('release_notes', formNotes);
      formData.append('force_update', String(formForce));
      if (formFile) {
        formData.append('apk', formFile);
      } else {
        formData.append('download_url', formUrl);
      }

      const res = await fetch('/api/app-versions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Upload failed');
        return;
      }

      // Reset form
      setFormVersion('');
      setFormNotes('');
      setFormForce(false);
      setFormFile(null);
      setFormUrl('');
      setShowForm(false);
      fetchVersions();
    } catch (e: any) {
      setFormError(e.message || 'Network error');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, version: string) {
    if (!confirm(`Delete version ${version}? This cannot be undone.`)) return;

    const res = await fetch(`/api/app-versions?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchVersions();
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  const stats = {
    total: versions.length,
    forced: versions.filter(v => v.force_update).length,
    latest: versions[0]?.version || 'None',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">App Updates</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Upload APKs and manage force-updates</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            {showForm ? 'Cancel' : '+ New Version'}
          </button>
          <button
            onClick={fetchVersions}
            className="px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1e] border border-[#1a1a1e] rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Versions', value: stats.total, color: 'text-white' },
          { label: 'Latest', value: stats.latest, color: 'text-green-400' },
          { label: 'Force Updates', value: stats.forced, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="bg-[#0a0a0b] border border-violet-500/30 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">New Version</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1 block">Version *</label>
              <input
                type="text"
                value={formVersion}
                onChange={e => setFormVersion(e.target.value)}
                placeholder="e.g. 1.7.0"
                className="w-full bg-[#141416] border border-[#1a1a1e] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1 block">Download URL (if not uploading)</label>
              <input
                type="url"
                value={formUrl}
                onChange={e => setFormUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#141416] border border-[#1a1a1e] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1 block">Release Notes</label>
            <textarea
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              rows={3}
              placeholder="What's new in this version..."
              className="w-full bg-[#141416] border border-[#1a1a1e] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                ref={fileInputRef}
                accept=".apk"
                onChange={e => setFormFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1e] border border-[#1a1a1e] rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
              >
                📦 {formFile ? formFile.name : 'Choose APK file'}
              </button>
              {formFile && (
                <span className="text-[11px] text-zinc-600">{formatBytes(formFile.size)}</span>
              )}
            </label>

            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={formForce}
                onChange={e => setFormForce(e.target.checked)}
                className="rounded border-zinc-600 bg-[#141416] text-violet-500 focus:ring-violet-500/50"
              />
              <span className="text-xs text-zinc-400">Force update (blocks app until installed)</span>
            </label>
          </div>

          {formError && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{formError}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowForm(false); setFormError(''); }}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
            >
              {uploading ? 'Uploading...' : 'Publish Version'}
            </button>
          </div>
        </div>
      )}

      {/* Version List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="text-sm text-zinc-500 mt-3">No versions published yet</p>
          <p className="text-xs text-zinc-600 mt-1">Upload your first APK to start pushing updates</p>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v, idx) => (
            <div
              key={v.id}
              className={`bg-[#0a0a0b] border rounded-xl p-5 transition-colors hover:border-[#2a2a2e] ${
                idx === 0 ? 'border-green-500/20' : 'border-[#1a1a1e]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">v{v.version}</span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400">
                        LATEST
                      </span>
                    )}
                    {v.force_update && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">
                        FORCE
                      </span>
                    )}
                  </div>
                  {v.release_notes && (
                    <p className="text-sm text-zinc-400 max-w-2xl">{v.release_notes}</p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-zinc-600">
                    <span>📅 {new Date(v.created_at).toLocaleString()}</span>
                    {v.file_size > 0 && <span>💾 {formatBytes(v.file_size)}</span>}
                    <span className="font-mono truncate max-w-[300px]">🔗 {v.download_url}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(v.id, v.version)}
                  className="px-3 py-1.5 text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">How Force Update Works</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          {[
            { step: '1', icon: '📦', label: 'Upload APK', desc: 'Upload APK or paste URL' },
            { step: '2', icon: '🏷️', label: 'Set Version', desc: 'Mark as force or optional' },
            { step: '3', icon: '📲', label: 'App Checks', desc: 'Users check on app launch' },
            { step: '4', icon: '🔄', label: 'Auto Install', desc: 'Downloads & prompts install' },
          ].map(s => (
            <div key={s.step}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-xs font-medium text-white">{s.label}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
