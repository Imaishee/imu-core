'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';

type Video = {
  id: string; video_key: string; youtube_id: string; title: string; channel: string;
  url: string; track: string; language: string; duration_display: string;
  oembed_title: string; oembed_author: string; track_label?: string;
};

const TRACK_INFO: Record<string, { label: string; icon: string; color: string }> = {
  geographyExams: { label: 'Geography', icon: '🌍', color: 'gradient-mint' },
  competitive: { label: 'Competitive Exams', icon: '🎯', color: 'gradient-coral' },
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/videos').then(r => r.json()).then(d => {
      setVideos(d.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredVideos = filter ? videos.filter(v => v.track === filter) : videos;
  const tracks = [...new Set(videos.map(v => v.track))];

  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Video Library</h1>
          <p className="text-sm text-gray-500">YouTube lectures &amp; prep videos</p>
        </div>

        {/* Track Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              !filter ? 'tab-active' : 'tab-inactive'
            }`}
          >
            All ({videos.length})
          </button>
          {tracks.map((track) => {
            const info = TRACK_INFO[track] || { label: track, icon: '📹', color: 'gradient-violet' };
            const count = videos.filter(v => v.track === track).length;
            return (
              <button
                key={track}
                onClick={() => setFilter(track)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === track ? 'tab-active' : 'tab-inactive'
                }`}
              >
                {info.icon} {info.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Videos */}
        <div className="space-y-3">
          {filteredVideos.map((video) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-interactive p-3 block group"
            >
              <div className="flex items-start gap-3">
                <div className="w-24 h-16 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <svg className="w-3 h-3 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-violet-primary transition-colors">
                    {video.oembed_title || video.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{video.oembed_author || video.channel}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {video.language && (
                      <span className="tag bg-gray-100 text-gray-600 text-[10px] uppercase">{video.language}</span>
                    )}
                    {video.duration_display && (
                      <span className="text-xs text-gray-400">{video.duration_display}</span>
                    )}
                    <span className="tag bg-violet-glow text-violet-primary text-[10px]">
                      {TRACK_INFO[video.track]?.label || video.track}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
          {filteredVideos.length === 0 && !loading && (
            <div className="card-interactive p-8 text-center">
              <p className="text-4xl mb-2">📹</p>
              <p className="font-bold text-gray-900">No videos yet</p>
              <p className="text-sm text-gray-500">Videos will appear as they&apos;re added</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 w-full" />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
