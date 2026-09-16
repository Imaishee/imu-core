'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { setVolume, setMute, getVolume, getMute } from '@/lib/sounds';
import { motion } from 'framer-motion';
import { TouchFeedback } from '@/components/layout/TouchFeedback';

const MAJORS = [
  'Geography', 'Philosophy', 'English', 'History', 'Political Science',
  'Economics', 'Sociology', 'Psychology', 'Hindi', 'Sanskrit',
];

const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const YEARS = ['1', '2', '3', '4'];

const ACCENT_COLORS = [
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Coral', value: '#FF6B6B' },
  { name: 'Mint', value: '#2ABFBF' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Sky', value: '#0EA5E9' },
];

const FONT_SIZES = [
  { label: 'Small', value: 'small', class: 'text-sm' },
  { label: 'Medium', value: 'medium', class: 'text-base' },
  { label: 'Large', value: 'large', class: 'text-lg' },
];

interface Profile {
  name: string;
  major: string;
  minor: string;
  semester: string;
  year: string;
  university: string;
  accentColor: string;
  fontSize: string;
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  major: 'Geography',
  minor: 'Philosophy',
  semester: '1',
  year: '1',
  university: 'Visva-Bharati University',
  accentColor: '#7C3AED',
  fontSize: 'medium',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'sound'>('profile');
  const [volume, setVolumeState] = useState<number>(getVolume());
  const [muted, setMuteState] = useState<boolean>(getMute());

  useEffect(() => {
    const stored = localStorage.getItem('imu_profile');
    if (stored) {
      try {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(stored) });
      } catch {}
    }
  }, []);

  const save = () => {
    localStorage.setItem('imu_profile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolumeState(vol);
    setVolume(vol);
  };

  const handleMuteToggle = () => {
    const newMute = !muted;
    setMuteState(newMute);
    setMute(newMute);
  };

  useEffect(() => {
    localStorage.setItem('imu_sound_volume', volume.toString());
    localStorage.setItem('imu_sound_mute', muted.toString());
  }, [volume, muted]);

  const getVolumeColor = () => {
    if (muted) return 'bg-gray-400';
    if (volume > 0.7) return 'bg-green-500';
    if (volume > 0.3) return 'bg-yellow-500';
    if (volume > 0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getVolumeLabel = () => {
    if (muted) return 'Muted';
    if (volume === 0) return 'Silent';
    if (volume > 0.7) return 'Loud';
    if (volume > 0.3) return 'Medium';
    return 'Soft';
  };

  const tabs = [
    { key: 'profile' as const, label: 'Profile', icon: '👤' },
    { key: 'appearance' as const, label: 'Appearance', icon: '🎨' },
    { key: 'sound' as const, label: 'Sound', icon: '🔊' },
  ];

  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 font-display">Settings</h1>
          <TouchFeedback>
            <button
              onClick={save}
              className={'px-4 py-1.5 rounded-full text-sm font-medium transition-all ' +
                (saved ? 'bg-green-500 text-white' : 'bg-violet-primary text-white hover:bg-violet-dark')}
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </TouchFeedback>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {tabs.map((tab) => (
            <TouchFeedback key={tab.key}>
              <button
                onClick={() => setActiveTab(tab.key)}
                className={'flex-1 py-2 rounded-lg text-sm font-medium transition-all ' +
                  (activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
              >
                {tab.icon} {tab.label}
              </button>
            </TouchFeedback>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }} className="space-y-6">
          {activeTab === 'profile' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Major Subject</label>
                <div className="grid grid-cols-2 gap-2">
                  {MAJORS.map((m) => (
                    <TouchFeedback key={m}>
                      <button
                        onClick={() => update('major', m)}
                        className={'px-3 py-2 rounded-xl text-sm font-medium transition-all w-full ' +
                          (profile.major === m
                            ? 'bg-violet-primary text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-primary/50')}
                      >
                        {m}
                      </button>
                    </TouchFeedback>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Minor Subject</label>
                <div className="grid grid-cols-2 gap-2">
                  {MAJORS.map((m) => (
                    <TouchFeedback key={m}>
                      <button
                        onClick={() => update('minor', m)}
                        className={'px-3 py-2 rounded-xl text-sm font-medium transition-all w-full ' +
                          (profile.minor === m
                            ? 'bg-coral-primary text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-coral-primary/50')}
                      >
                        {m}
                      </button>
                    </TouchFeedback>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SEMESTERS.map((s) => (
                      <TouchFeedback key={s}>
                        <button
                          onClick={() => update('semester', s)}
                          className={'py-2 rounded-lg text-sm font-medium transition-all w-full ' +
                            (profile.semester === s ? 'bg-violet-primary text-white' : 'bg-white text-gray-600 border border-gray-200')}
                        >
                          {s}
                        </button>
                      </TouchFeedback>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {YEARS.map((y) => (
                      <TouchFeedback key={y}>
                        <button
                          onClick={() => update('year', y)}
                          className={'py-2 rounded-lg text-sm font-medium transition-all w-full ' +
                            (profile.year === y ? 'bg-violet-primary text-white' : 'bg-white text-gray-600 border border-gray-200')}
                        >
                          {y}
                        </button>
                      </TouchFeedback>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">University</label>
                <input
                  type="text"
                  value={profile.university}
                  onChange={(e) => update('university', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary/30"
                />
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Accent Color</label>
                <div className="flex gap-3">
                  {ACCENT_COLORS.map((c) => (
                    <TouchFeedback key={c.value}>
                      <button
                        onClick={() => update('accentColor', c.value)}
                        className={'w-10 h-10 rounded-full transition-all ' +
                          (profile.accentColor === c.value
                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                            : 'hover:scale-105')}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    </TouchFeedback>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Font Size</label>
                <div className="flex gap-2">
                  {FONT_SIZES.map((f) => (
                    <TouchFeedback key={f.value}>
                      <button
                        onClick={() => update('fontSize', f.value)}
                        className={'flex-1 py-3 rounded-xl text-sm font-medium transition-all ' +
                          (profile.fontSize === f.value
                            ? 'bg-violet-primary text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200')}
                      >
                        {f.label}
                      </button>
                    </TouchFeedback>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-2">Preview</p>
                <div className={FONT_SIZES.find(f => f.value === profile.fontSize)?.class || 'text-base'}>
                  <p className="font-bold" style={{ color: profile.accentColor }}>Sample Heading</p>
                  <p className="text-gray-600 mt-1">This is how text will appear across the app.</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'sound' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sound Settings</h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Volume</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">{Math.round(volume * 100)}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Adjust the volume for game sounds and effects</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-700 mr-3">Mute Sounds</label>
                    <TouchFeedback>
                      <button
                        onClick={handleMuteToggle}
                        className={'flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all ' +
                          (muted ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}
                      >
                        {muted ? 'Unmute' : 'Mute'}
                        <span className="ml-2">{muted ? '🔇' : '🔊'}</span>
                      </button>
                    </TouchFeedback>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Toggle sound on or off for all games</p>
                </div>

                <div className="mb-4">
                  <TouchFeedback>
                    <button
                      onClick={() => {
                        import('@/lib/sounds').then(({ playSound }) => { playSound('click'); });
                      }}
                      className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all bg-violet-primary text-white hover:bg-violet-dark"
                    >
                      ▶️ Test Sound
                    </button>
                  </TouchFeedback>
                </div>

                <div className="flex items-center">
                  <div className={'w-3 h-3 rounded-full ' + getVolumeColor()} />
                  <span className="ml-2 text-sm font-medium">{getVolumeLabel()}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Data Storage</h3>
                <p className="text-xs text-gray-500">Your sound preferences are stored locally on this device.</p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
