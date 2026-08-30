import React from 'react';

export function HanwhaLogo({ className = 'h-5', showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <span className="w-2.5 h-2.5 rounded-full bg-[#F37321] inline-block shrink-0 shadow-xs" />
      {showText && (
        <span
          className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base"
          style={{ fontFamily: "'Pretendard', sans-serif" }}
        >
          Hanwha Ocean
        </span>
      )}
    </div>
  );
}

export function HeroBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-xs sm:text-sm ${className}`}
      style={{ fontFamily: "'Pretendard', sans-serif" }}
    >
      HERO 2.0
    </span>
  );
}

export function HeroBannerCapsule({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-md px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 ${className}`}
      style={{ fontFamily: "'Pretendard', sans-serif" }}
    >
      <span className="text-slate-400 font-light text-xl sm:text-2xl shrink-0 leading-none">+</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 truncate">
          HERO 2.0 WORKSHOP
        </span>
      </div>
      <div className="flex items-center gap-2.5 text-slate-400 shrink-0">
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="6" y1="8" x2="6" y2="16" />
          <line x1="10" y1="4" x2="10" y2="20" />
          <line x1="14" y1="6" x2="14" y2="18" />
          <line x1="18" y1="10" x2="18" y2="14" />
        </svg>
      </div>
    </div>
  );
}
