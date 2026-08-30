import React from 'react';

export function DecorativeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-blue-200/20 blur-2xl" />
      <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-200/40 via-blue-200/30 to-indigo-100/20 blur-2xl" />
      <div className="absolute top-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-white/95 via-purple-200/60 to-indigo-400/40 shadow-lg shadow-purple-500/10 backdrop-blur-xs border border-white/70" />
      <div className="absolute bottom-28 right-3 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-100/90 via-blue-200/50 to-indigo-300/30 shadow-md shadow-blue-500/10 backdrop-blur-xs border border-white/70" />
      <div className="absolute bottom-16 left-4 w-8 h-8 rounded-full bg-gradient-to-br from-purple-100/90 via-pink-100/40 to-blue-200/30 shadow-xs border border-white/60" />
    </div>
  );
}
