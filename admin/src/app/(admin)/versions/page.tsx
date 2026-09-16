'use client';

import { useEffect, useState } from 'react';

export default function VersionsPage() {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, []);

  async function fetchVersions() {
    const res = await fetch('/api/versions');
    const data = await res.json();
    setVersions(data.versions || []);
    setLoading(false);
  }

  async function handleUpload() {
    if (!version || !downloadUrl) return;
    await fetch('/api/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version, download_url: downloadUrl, release_notes: releaseNotes, force_update: forceUpdate }),
    });
    setVersion('');
    setDownloadUrl('');
    setReleaseNotes('');
    setForceUpdate(false);
    fetchVersions();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">App Versions</h1>
      <p className="text-sm text-zinc-400">Upload APK URLs to trigger auto-update prompts in the app.</p>

      {/* Upload Form */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Publish New Version</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Version (e.g. 1.3.0)"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#a78bfa]"
            />
            <input
              type="text"
              placeholder="APK Download URL"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#a78bfa]"
            />
          </div>
          <textarea
            placeholder="Release notes..."
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            rows={3}
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#a78bfa] resize-none"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={forceUpdate}
                onChange={(e) => setForceUpdate(e.target.checked)}
                className="rounded border-[#3f3f46]"
              />
              Force update
            </label>
            <button
              onClick={handleUpload}
              disabled={!version || !downloadUrl}
              className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-black font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#27272a]">
          <h3 className="text-sm font-medium text-zinc-400">Published Versions</h3>
        </div>
        <div className="divide-y divide-[#27272a]">
          {versions.map((v) => (
            <div key={v.id} className="px-4 py-3 hover:bg-[#27272a] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">v{v.version}</span>
                    {v.force_update && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Force</span>
                    )}
                  </div>
                  {v.release_notes && (
                    <p className="text-xs text-zinc-500 mt-0.5">{v.release_notes}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {versions.length === 0 && (
            <div className="px-4 py-8 text-center text-zinc-500 text-sm">No versions published yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
