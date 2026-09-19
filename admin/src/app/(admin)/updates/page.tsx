'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface AppVersion {
  id: string;
  version: string;
  download_url: string;
  release_notes: string;
  force_update: boolean;
  file_size: number;
  created_at: string;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'registering' | 'done' | 'error';
  progress: number;       // 0-100
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  error: string;
  speed: string;          // e.g. "2.4 MB/s"
  eta: string;            // e.g. "12s left"
}

export default function UpdatesPage() {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [upload, setUpload] = useState<UploadState>({
    status: 'idle', progress: 0, fileName: '', fileSize: 0,
    uploadedBytes: 0, error: '', speed: '', eta: '',
  });

  // Form state
  const [formVersion, setFormVersion] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formForce, setFormForce] = useState(false);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formUrl, setFormUrl] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => { fetchVersions(); }, []);

  async function fetchVersions() {
    setLoading(true);
    const res = await fetch('/api/app-versions');
    const data = await res.json();
    setVersions(data.versions || []);
    setLoading(false);
  }

  const handleUpload = useCallback(async () => {
    if (!formVersion.trim()) { setFormError('Version is required'); return; }
    if (!formFile && !formUrl.trim()) { setFormError('Either upload an APK file or provide a download URL'); return; }

    setFormError('');
    let downloadUrl = formUrl.trim();

    // ─── Step 1: Upload APK directly to Supabase Storage (if file chosen) ───
    if (formFile) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxiicvirllfdvcjwwcbj.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const fileName = `IMU-v${formVersion.trim()}-arm64.apk`;
      setUpload({
        status: 'uploading', progress: 0, fileName, fileSize: formFile.size,
        uploadedBytes: 0, error: '', speed: 'Starting...', eta: '',
      });

      try {
        // Use XMLHttpRequest for upload progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              const speedBytes = e.loaded; // We'll calculate speed from timestamps
              const remaining = e.total - e.loaded;

              setUpload(prev => ({
                ...prev,
                progress: pct,
                uploadedBytes: e.loaded,
              }));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: HTTP ${xhr.status} ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxiicvirllfdvcjwwcbj.supabase.co';
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
          const uploadUrl = `${supabaseUrl}/storage/v1/object/apk-downloads/${fileName}`;

          xhr.open('POST', uploadUrl, true);
          xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
          xhr.setRequestHeader('Content-Type', 'application/vnd.android.package-archive');
          xhr.setRequestHeader('x-upsert', 'true');
          xhr.send(formFile);
        });

        // Build public URL
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxiicvirllfdvcjwwcbj.supabase.co';
        downloadUrl = `${supabaseUrl}/storage/v1/object/public/apk-downloads/${fileName}`;
      } catch (e: any) {
        setUpload(prev => ({ ...prev, status: 'error', error: e.message || 'Upload failed' }));
        return;
      }
    }

    // ─── Step 2: Register version via API ─────────────────────────────────────
    setUpload(prev => ({ ...prev, status: 'registering', progress: 100 }));

    try {
      const res = await fetch('/api/app-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: formVersion.trim(),
          release_notes: formNotes,
          force_update: formForce,
          download_url: downloadUrl,
          file_size: formFile?.size || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUpload(prev => ({ ...prev, status: 'error', error: data.error || 'Registration failed' }));
        return;
      }

      // Success!
      setUpload(prev => ({ ...prev, status: 'done', progress: 100 }));

      // Reset form after 2s
      setTimeout(() => {
        setFormVersion('');
        setFormNotes('');
        setFormForce(false);
        setFormFile(null);
        setFormUrl('');
        setShowForm(false);
        setUpload({ status: 'idle', progress: 0, fileName: '', fileSize: 0, uploadedBytes: 0, error: '', speed: '', eta: '' });
        fetchVersions();
      }, 2000);
    } catch (e: any) {
      setUpload(prev => ({ ...prev, status: 'error', error: e.message || 'Network error' }));
    }
  }, [formVersion, formNotes, formForce, formFile, formUrl]);

  async function handleDelete(id: string, version: string) {
    if (!confirm(`Delete version ${version}? This cannot be undone.`)) return;
    const res = await fetch(`/api/app-versions?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchVersions();
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  const isUploading = upload.status === 'uploading' || upload.status === 'registering';

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

      {/* ─── Upload Form ──────────────────────────────────────────────────── */}
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
                disabled={isUploading}
                className="w-full bg-[#141416] border border-[#1a1a1e] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1 block">Download URL (if not uploading)</label>
              <input
                type="url"
                value={formUrl}
                onChange={e => setFormUrl(e.target.value)}
                placeholder="https://..."
                disabled={isUploading}
                className="w-full bg-[#141416] border border-[#1a1a1e] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
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
              disabled={isUploading}
              className="w-full bg-[#141416] border border-[#1a1a1e] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                ref={fileInputRef}
                accept=".apk"
                onChange={e => setFormFile(e.target.files?.[0] || null)}
                disabled={isUploading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1e] border border-[#1a1a1e] rounded-lg text-xs text-zinc-400 hover:text-white transition-all disabled:opacity-50"
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
                disabled={isUploading}
                className="rounded border-zinc-600 bg-[#141416] text-violet-500 focus:ring-violet-500/50"
              />
              <span className="text-xs text-zinc-400">Force update (blocks app until installed)</span>
            </label>
          </div>

          {formError && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{formError}</p>
          )}

          {/* ─── Upload Progress Bar ───────────────────────────────────────── */}
          {upload.status !== 'idle' && (
            <div className="bg-[#141416] border border-[#1a1a1e] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {upload.status === 'uploading' && (
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {upload.status === 'registering' && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {upload.status === 'done' && (
                    <span className="text-green-400 text-sm">✓</span>
                  )}
                  {upload.status === 'error' && (
                    <span className="text-red-400 text-sm">✗</span>
                  )}
                  <span className={`text-xs font-medium ${
                    upload.status === 'uploading' ? 'text-violet-400' :
                    upload.status === 'registering' ? 'text-blue-400' :
                    upload.status === 'done' ? 'text-green-400' :
                    'text-red-400'
                  }`}>
                    {upload.status === 'uploading' && 'Uploading to Supabase Storage...'}
                    {upload.status === 'registering' && 'Registering version in database...'}
                    {upload.status === 'done' && 'Upload complete!'}
                    {upload.status === 'error' && 'Upload failed'}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  {upload.fileName && `${formatBytes(upload.uploadedBytes)} / ${formatBytes(upload.fileSize)}`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#0a0a0b] rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    upload.status === 'error' ? 'bg-red-500' :
                    upload.status === 'done' ? 'bg-green-500' :
                    'bg-gradient-to-r from-violet-500 to-purple-500'
                  }`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-600">
                  {upload.progress}%
                  {upload.status === 'uploading' && ` • ${upload.speed}`}
                </span>
                {upload.error && (
                  <span className="text-[11px] text-red-400">{upload.error}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowForm(false); setFormError(''); setUpload({ status: 'idle', progress: 0, fileName: '', fileSize: 0, uploadedBytes: 0, error: '', speed: '', eta: '' }); }}
              disabled={isUploading}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || (!formFile && !formUrl.trim()) || !formVersion.trim()}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
            >
              {upload.status === 'uploading' ? 'Uploading...' :
               upload.status === 'registering' ? 'Saving...' :
               upload.status === 'done' ? 'Done! ✓' :
               'Publish Version'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Version List ──────────────────────────────────────────────────── */}
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
            { step: '1', icon: '📦', label: 'Upload APK', desc: 'Direct to Supabase Storage' },
            { step: '2', icon: '🏷️', label: 'Set Version', desc: 'Mark as force or optional' },
            { step: '3', icon: '📲', label: 'App Checks', desc: 'Auto-check on app launch' },
            { step: '4', icon: '🔄', label: 'Auto Install', desc: 'Background download + notify' },
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
