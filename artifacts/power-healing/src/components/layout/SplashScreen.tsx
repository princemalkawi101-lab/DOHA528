import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

let hasShownSplash = false;

export function SplashScreen() {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(() => {
    // Show only on root path on first load
    if (!hasShownSplash && location === '/') {
      return true;
    }
    return false;
  });

  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Immediately mark as shown
    hasShownSplash = true;

    // Prevent scrolling while splash is active
    document.body.style.overflow = 'hidden';

    // Respect reduced motion: shorten the duration
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const displayDuration = prefersReducedMotion ? 400 : 2000;
    const fadeOutDuration = 800; // Time for the opacity transition

    const startFadeTimer = setTimeout(() => {
      setIsAnimatingOut(true);
    }, displayDuration);

    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, displayDuration + fadeOutDuration);

    return () => {
      clearTimeout(startFadeTimer);
      clearTimeout(unmountTimer);
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#dcf0ea] transition-all duration-700 ease-in-out ${isAnimatingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      role="alert"
      aria-busy="true"
      aria-label="Loading مساحة ن"
    >
      {/* Background radial gradient for subtle premium texture matching gold/purple */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(212,160,23,0.08)_0%,transparent_65%)]" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(123,75,184,0.04)_0%,transparent_50%)]" aria-hidden="true" />

      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center motion-safe:animate-[splash-reveal_1.5s_cubic-bezier(0.16,1,0.3,1)_forwards] motion-reduce:opacity-100 opacity-0">
        <img
          src={`${import.meta.env.BASE_URL}img/masaha-n-logo-hd.png`}
          width="1089"
          height="1445"
          alt="مساحة ن"
          className="w-[190px] sm:w-[210px] h-auto object-contain drop-shadow-[0_10px_24px_rgba(44,91,78,0.12)]"
          style={{ filter: 'contrast(1.07) saturate(1.04)' }}
        />
      </div>
    </div>
  );
}
