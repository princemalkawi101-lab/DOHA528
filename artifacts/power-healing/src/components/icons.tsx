export function LogoSVG({ className = "", width = "160", height = "42", opacity = "1" }: { className?: string, width?: string | number, height?: string | number, opacity?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" fill="none" width={width} height={height} className={className} style={{ opacity: parseFloat(opacity) }}>
      <defs>
        <linearGradient id="ll-gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f5d060"/><stop offset="50%" stopColor="#e8b923"/><stop offset="100%" stopColor="#c9a000"/></linearGradient>
        <linearGradient id="ll-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7b4bb8"/><stop offset="100%" stopColor="#3d1f6e"/></linearGradient>
        <radialGradient id="ll-core" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fff3c4" stopOpacity="1"/><stop offset="40%" stopColor="#f5d060" stopOpacity="0.9"/><stop offset="100%" stopColor="#c9a000" stopOpacity="0"/></radialGradient>
        <filter id="ll-glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="ll-soft"><feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Soft outer energy auras — gentle, expanding, faded */}
      <circle cx="45" cy="45" r="36" stroke="url(#ll-gold)" strokeWidth="0.6" fill="none" opacity="0.18"/>
      <circle cx="45" cy="45" r="30" stroke="url(#ll-gold)" strokeWidth="0.8" fill="none" opacity="0.28"/>
      <circle cx="45" cy="45" r="24" stroke="url(#ll-gold)" strokeWidth="1" fill="none" opacity="0.4"/>

      {/* Diffuse golden glow at the heart */}
      <circle cx="45" cy="45" r="14" fill="url(#ll-core)"/>

      {/* The flowing spiral — soft golden energy unfolding outward */}
      <path
        d="M 47 45 L 47.46 46.34 L 46.94 48.03 L 45.31 49.39 L 42.84 49.73 L 40.19 48.59 L 38.27 45.96 L 37.88 42.33 L 39.51 38.64 L 43.06 36.00 L 47.84 35.41 L 52.66 37.34 L 56.14 41.76 L 57.18 47.65 L 54.95 53.67 L 49.92 58.11 L 42.85 59.64 L 36.80 58.27 L 30.05 51.76 L 28.04 43.90 L 29.90 35.21 L 35.49 28.38 L 44.91 25.40 L 53.85 26.61 L 62.89 33.62 L 67.11 45.00"
        stroke="url(#ll-gold)"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#ll-glow)"
        opacity="0.95"
      />

      {/* Bright luminous core */}
      <circle cx="45" cy="45" r="2.4" fill="#fff3c4" filter="url(#ll-glow)"/>

      {/* Floating energy particles — soft, varied opacity */}
      <g fill="url(#ll-gold)" filter="url(#ll-soft)">
        <circle cx="18" cy="34" r="1" opacity="0.55"/>
        <circle cx="22" cy="60" r="1.4" opacity="0.7"/>
        <circle cx="70" cy="22" r="1.2" opacity="0.6"/>
        <circle cx="74" cy="58" r="1" opacity="0.5"/>
        <circle cx="50" cy="14" r="1.3" opacity="0.7"/>
        <circle cx="40" cy="76" r="1.1" opacity="0.55"/>
        <circle cx="12" cy="48" r="0.9" opacity="0.45"/>
        <circle cx="78" cy="44" r="0.9" opacity="0.45"/>
      </g>

      {/* Gentle connector to wordmark */}
      <path d="M 75 45 Q 82 45 88 45" stroke="url(#ll-gold)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>

      {/* === DOHA wordmark (unchanged) === */}
      <path d="M 90 20 L 90 70 Q 90 70 110 70 Q 138 70 138 45 Q 138 20 110 20 Z" fill="url(#ll-purple)" stroke="url(#ll-gold)" strokeWidth="1.5"/>
      <path d="M 100 30 L 100 60 Q 100 60 110 60 Q 126 60 126 45 Q 126 30 110 30 Z" fill="#0f051e"/>
      <circle cx="161" cy="45" r="26" fill="url(#ll-purple)" stroke="url(#ll-gold)" strokeWidth="1.5"/>
      <circle cx="161" cy="45" r="15" fill="#0f051e"/>
      <path d="M 161 34 L 163.5 41.5 L 171.5 41.5 L 165 46.5 L 167.5 54 L 161 49 L 154.5 54 L 157 46.5 L 150.5 41.5 L 158.5 41.5 Z" fill="url(#ll-gold)" opacity="0.9" filter="url(#ll-glow)"/>
      <rect x="188" y="20" width="11" height="50" rx="3" fill="url(#ll-purple)" stroke="url(#ll-gold)" strokeWidth="1.5"/>
      <rect x="219" y="20" width="11" height="50" rx="3" fill="url(#ll-purple)" stroke="url(#ll-gold)" strokeWidth="1.5"/>
      <rect x="188" y="38" width="42" height="14" rx="3" fill="url(#ll-purple)" stroke="url(#ll-gold)" strokeWidth="1.5"/>
      <path d="M 249 70 L 270 20 L 291 70 Z" fill="url(#ll-purple)" stroke="url(#ll-gold)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 256 55 L 270 23 L 284 55 Z" fill="#0f051e"/>
      <rect x="258" y="48" width="24" height="9" rx="2" fill="url(#ll-purple)"/>
      <path d="M 90 74 Q 190 82 291 74" stroke="url(#ll-gold)" strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round"/>
      <g fill="url(#ll-gold)" opacity="0.6"><circle cx="114" cy="13" r="2"/><circle cx="161" cy="13" r="2"/><circle cx="208" cy="13" r="2"/><circle cx="270" cy="13" r="2"/></g>
    </svg>
  );
}

export function MasahaLogo({ className = "", width = "78", height = "78", opacity = "1" }: { className?: string, width?: string | number, height?: string | number, opacity?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width, height, opacity: parseFloat(opacity) }}
    >
      <span className="absolute inset-[18%] rounded-full bg-[rgba(212,160,23,0.22)] blur-xl" aria-hidden="true" />
      <img
        src="/img/masaha-n-logo.png"
        alt="مساحة ن"
        className="relative w-full h-full object-contain drop-shadow-[0_0_10px_rgba(212,160,23,0.38)]"
      />
    </span>
  );
}

export function WatermarkSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" fill="none" width="600" height="159">
      <defs>
        <linearGradient id="hw-gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f5d060"/><stop offset="50%" stopColor="#e8b923"/><stop offset="100%" stopColor="#c9a000"/></linearGradient>
        <linearGradient id="hw-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7b4bb8"/><stop offset="100%" stopColor="#3d1f6e"/></linearGradient>
        <radialGradient id="hw-core" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fff3c4" stopOpacity="1"/><stop offset="40%" stopColor="#f5d060" stopOpacity="0.9"/><stop offset="100%" stopColor="#c9a000" stopOpacity="0"/></radialGradient>
        <filter id="hw-glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="hw-soft"><feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <circle cx="45" cy="45" r="36" stroke="url(#hw-gold)" strokeWidth="0.6" fill="none" opacity="0.18"/>
      <circle cx="45" cy="45" r="30" stroke="url(#hw-gold)" strokeWidth="0.8" fill="none" opacity="0.28"/>
      <circle cx="45" cy="45" r="24" stroke="url(#hw-gold)" strokeWidth="1" fill="none" opacity="0.4"/>
      <circle cx="45" cy="45" r="14" fill="url(#hw-core)"/>

      <path
        d="M 47 45 L 47.46 46.34 L 46.94 48.03 L 45.31 49.39 L 42.84 49.73 L 40.19 48.59 L 38.27 45.96 L 37.88 42.33 L 39.51 38.64 L 43.06 36.00 L 47.84 35.41 L 52.66 37.34 L 56.14 41.76 L 57.18 47.65 L 54.95 53.67 L 49.92 58.11 L 42.85 59.64 L 36.80 58.27 L 30.05 51.76 L 28.04 43.90 L 29.90 35.21 L 35.49 28.38 L 44.91 25.40 L 53.85 26.61 L 62.89 33.62 L 67.11 45.00"
        stroke="url(#hw-gold)"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#hw-glow)"
        opacity="0.95"
      />

      <circle cx="45" cy="45" r="2.4" fill="#fff3c4" filter="url(#hw-glow)"/>

      <g fill="url(#hw-gold)" filter="url(#hw-soft)">
        <circle cx="18" cy="34" r="1" opacity="0.55"/>
        <circle cx="22" cy="60" r="1.4" opacity="0.7"/>
        <circle cx="70" cy="22" r="1.2" opacity="0.6"/>
        <circle cx="74" cy="58" r="1" opacity="0.5"/>
        <circle cx="50" cy="14" r="1.3" opacity="0.7"/>
        <circle cx="40" cy="76" r="1.1" opacity="0.55"/>
        <circle cx="12" cy="48" r="0.9" opacity="0.45"/>
        <circle cx="78" cy="44" r="0.9" opacity="0.45"/>
      </g>

      <path d="M 75 45 Q 82 45 88 45" stroke="url(#hw-gold)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>

      <path d="M 90 20 L 90 70 Q 90 70 110 70 Q 138 70 138 45 Q 138 20 110 20 Z" fill="url(#hw-purple)" stroke="url(#hw-gold)" strokeWidth="1.5"/>
      <path d="M 100 30 L 100 60 Q 100 60 110 60 Q 126 60 126 45 Q 126 30 110 30 Z" fill="#0f051e"/>
      <circle cx="161" cy="45" r="26" fill="url(#hw-purple)" stroke="url(#hw-gold)" strokeWidth="1.5"/>
      <circle cx="161" cy="45" r="15" fill="#0f051e"/>
      <path d="M 161 34 L 163.5 41.5 L 171.5 41.5 L 165 46.5 L 167.5 54 L 161 49 L 154.5 54 L 157 46.5 L 150.5 41.5 L 158.5 41.5 Z" fill="url(#hw-gold)" opacity="0.9" filter="url(#hw-glow)"/>
      <rect x="188" y="20" width="11" height="50" rx="3" fill="url(#hw-purple)" stroke="url(#hw-gold)" strokeWidth="1.5"/>
      <rect x="219" y="20" width="11" height="50" rx="3" fill="url(#hw-purple)" stroke="url(#hw-gold)" strokeWidth="1.5"/>
      <rect x="188" y="38" width="42" height="14" rx="3" fill="url(#hw-purple)" stroke="url(#hw-gold)" strokeWidth="1.5"/>
      <path d="M 249 70 L 270 20 L 291 70 Z" fill="url(#hw-purple)" stroke="url(#hw-gold)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 256 55 L 270 23 L 284 55 Z" fill="#0f051e"/>
      <rect x="258" y="48" width="24" height="9" rx="2" fill="url(#hw-purple)"/>
      <path d="M 90 74 Q 190 82 291 74" stroke="url(#hw-gold)" strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round"/>
      <g fill="url(#hw-gold)" opacity="0.6"><circle cx="114" cy="13" r="2"/><circle cx="161" cy="13" r="2"/><circle cx="208" cy="13" r="2"/><circle cx="270" cy="13" r="2"/></g>
    </svg>
  );
}
