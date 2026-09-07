import React, { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import hmmVideo from '../../../hmm22.mp4';
import { useApp } from '../../context';

/**
 * Route condition rules:
 * - HIDE on Landing/Home, Sign-in, Sign-up, Ingest, or external auth pages
 * - SHOW on all internal dashboard, repository, analysis, and authenticated application pages
 */
const EXCLUDED_PREFIXES = ['/login', '/signup', '/ingest'];
const EXCLUDED_EXACT = ['/', '/home', '/landing'];

export const AppBackgroundVideo: React.FC = () => {
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { theme } = useApp();
  const isDark = theme !== 'light';

  // Route condition check
  const isExcluded =
    EXCLUDED_EXACT.includes(location.pathname) ||
    EXCLUDED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  useEffect(() => {
    if (isExcluded) return;

    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy fallback: muted video autoplay handled cleanly
      });
    }
  }, [isExcluded]);

  if (isExcluded) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      <video
        ref={videoRef}
        src={hmmVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`w-full h-full object-cover transition-opacity duration-700 pointer-events-none ${
          isDark ? 'opacity-30' : 'opacity-20 mix-blend-multiply'
        }`}
      >
        <source src={hmmVideo} type="video/mp4" />
        <source src="/hmm22.mp4" type="video/mp4" />
      </video>
    </div>
  );
};
