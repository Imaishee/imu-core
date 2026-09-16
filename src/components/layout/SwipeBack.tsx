'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export function SwipeBack({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const opacity = useTransform(x, [-200, 0], [0.5, 1]);
  const scale = useTransform(x, [-200, 0], [0.95, 1]);
  const borderRadius = useTransform(x, [0, 200], [0, 16]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let isHorizontal: boolean | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      isHorizontal = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (isHorizontal === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      if (isHorizontal && deltaX > 0 && window.scrollX === 0) {
        e.preventDefault();
        x.set(Math.min(deltaX, 300));
        setIsDragging(true);
      }
    };

    const handleTouchEnd = () => {
      if (isDragging) {
        const currentX = x.get();
        if (currentX > 120) {
          router.back();
        } else {
          animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
        }
        setIsDragging(false);
      }
      isHorizontal = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, router, x]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      <motion.div style={{ x, opacity, scale, borderRadius }}>
        {children}
      </motion.div>

      {/* Swipe indicator */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed left-0 top-0 bottom-0 w-1 z-50"
          style={{
            background: 'linear-gradient(to right, #7C3AED, transparent)',
            opacity: useTransform(x, [0, 120], [0, 1]),
          }}
        />
      )}
    </div>
  );
}
