'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen bg-warm-bg">
      {/* TopBar skeleton */}
      <div className="h-14 bg-white/80 backdrop-blur-lg border-b border-gray-100 flex items-center px-4 gap-3">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton w-24 h-4 rounded" />
        <div className="ml-auto flex gap-2">
          <div className="skeleton w-8 h-8 rounded-full" />
          <div className="skeleton w-8 h-8 rounded-full" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        {/* Welcome skeleton */}
        <div className="flex items-center gap-3">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="space-y-1.5">
            <div className="skeleton w-20 h-3 rounded" />
            <div className="skeleton w-32 h-5 rounded" />
          </div>
          <div className="ml-auto skeleton w-16 h-8 rounded-full" />
        </div>

        {/* Stats card skeleton */}
        <div className="skeleton h-32 rounded-3xl" />

        {/* Quick Links skeleton */}
        <div>
          <div className="skeleton w-24 h-5 rounded mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Games skeleton */}
        <div>
          <div className="skeleton w-20 h-5 rounded mb-3" />
          <div className="grid grid-cols-5 gap-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Tasks skeleton */}
        <div>
          <div className="skeleton w-28 h-5 rounded mb-3" />
          {[1,2,3].map(i => (
            <div key={i} className="skeleton h-14 rounded-xl mb-2" />
          ))}
        </div>
      </div>

      {/* BottomNav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="mx-3 mb-3">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-bottom-nav px-2 py-3 flex items-center justify-around">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="skeleton w-6 h-6 rounded" />
                <div className="skeleton w-8 h-2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
