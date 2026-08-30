import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Users,
  Key,
  Calendar,
  MapPin,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { HanwhaLogo, HeroBannerCapsule } from './HeaderLogo';
import { HeroTrioVisual } from './HeroTrioImage';

interface QRBannerViewProps {
  onBackToParticipant?: () => void;
  onOpenAdmin?: () => void;
}

interface BannerStats {
  location: string;
  total_participants: number;
  checked_in_count: number;
  attendance_rate: number;
  active_code: string;
}

export function QRBannerView({ onBackToParticipant, onOpenAdmin }: QRBannerViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<'전체' | '거제' | '서울' | '부산'>('전체');
  const [qrUrl, setQrUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState<BannerStats>({
    location: '거제',
    total_participants: 120,
    checked_in_count: 85,
    attendance_rate: 70.8,
    active_code: '맥스',
  });
  const [activeCodeMap, setActiveCodeMap] = useState<Record<string, string>>({
    전체: '맥스',
    거제: '맥스',
    서울: '가드',
    부산: '테크',
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Determine current origin URL for QR code
  useEffect(() => {
    const currentOrigin = window.location.origin;
    const path =
      selectedLocation === '전체'
        ? currentOrigin
        : `${currentOrigin}?site=${selectedLocation === '거제' ? 'geoje' : selectedLocation === '서울' ? 'seoul' : 'busan'}`;

    setQrUrl(path);

    QRCode.toDataURL(path, {
      width: 440,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error', err));
  }, [selectedLocation]);

  // Fetch overview & codes periodically
  const fetchBannerData = async () => {
    try {
      const token = localStorage.getItem('ax_admin_token') || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/overview', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          const locStat =
            selectedLocation === '전체'
              ? null
              : data.stats.location_breakdown?.find((l: { location: string }) => l.location === selectedLocation);

          setStats({
            location: selectedLocation,
            total_participants: locStat ? locStat.total : data.stats.total_participants,
            checked_in_count: locStat ? locStat.checked_in : data.stats.checked_in_count,
            attendance_rate: locStat ? locStat.rate : data.stats.attendance_rate,
            active_code: activeCodeMap[selectedLocation] || '맥스',
          });
        }
      }

      // Fetch codes
      const codeRes = await fetch('/api/admin/attendance-codes', { headers });
      if (codeRes.ok) {
        const cData = await codeRes.json();
        if (cData.success && cData.codes) {
          const map: Record<string, string> = { ...activeCodeMap };
          cData.codes.forEach((c: { location: string; attendance_code: string; is_active: boolean }) => {
            if (c.is_active) {
              map[c.location] = c.attendance_code;
            }
          });
          setActiveCodeMap(map);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBannerData();
    const interval = setInterval(fetchBannerData, 3000);
    return () => clearInterval(interval);
  }, [selectedLocation]);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none relative overflow-hidden font-sans"
    >
      {/* Glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <HanwhaLogo className="h-6" showText={true} />
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <span className="text-xs sm:text-sm font-black tracking-tight text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/60">
            현장 전광판 모드
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Location Selector */}
          <div className="inline-flex p-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs">
            {(['전체', '거제', '서울', '부산'] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocation(loc)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedLocation === loc
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? '전체화면 종료' : '전체화면'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onBackToParticipant && (
            <button
              type="button"
              onClick={onBackToParticipant}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              참여자 모바일 화면
            </button>
          )}

          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              관리자 모드
            </button>
          )}
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-6 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-2 mb-6">
          <HeroBannerCapsule className="mx-auto" />
          <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-slate-400 pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-400" />
              {todayStr}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {selectedLocation === '전체' ? '전 사업장 통합' : `${selectedLocation} 사업장`}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              실시간 동기화 중
            </span>
          </div>
        </div>

        {/* Center Grid: Left (QR Box) & Right (Attendance Code + Trio Character + Live Stats) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
          {/* Left: Huge High-Contrast QR Code */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-slate-900 shadow-2xl shadow-blue-500/10 border-4 border-slate-100 relative group">
            <div className="text-center mb-4">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-black text-xs uppercase tracking-wider">
                Step 1. 스마트폰 카메라로 스캔
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                QR 코드를 스캔하세요
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                카메라로 스캔하면 바로 출석체크 화면으로 이동합니다.
              </p>
            </div>

            {/* QR Image */}
            <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center max-w-[280px] sm:max-w-[340px] aspect-square w-full">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Attendance QR Code"
                  className="w-full h-full object-contain select-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>

            {/* URL bar */}
            <div className="mt-4 w-full flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200">
              <span className="text-xs font-mono text-slate-600 truncate flex-1 text-left">{qrUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer border border-slate-200 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사됨' : '복사'}</span>
              </button>
            </div>
          </div>

          {/* Right: Code & Stats Panel */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            {/* Step 2: Attendance Code Big Banner */}
            <div className="bg-gradient-to-br from-indigo-900/80 via-slate-900/90 to-blue-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-xs uppercase tracking-wider border border-indigo-500/30">
                    Step 2. 출석코드 입력
                  </span>
                  <Key className="w-5 h-5 text-indigo-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-300 mt-3">오늘의 출석코드</h4>
              </div>

              <div className="my-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-center shadow-lg shadow-blue-600/30 border border-blue-400/40">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-widest font-mono select-all">
                  {activeCodeMap[selectedLocation] || '맥스'}
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                사번 입력 후 위의 출석코드를 입력하면 출석 및 좌석 배치가 완료됩니다.
              </p>
            </div>

            {/* Live Attendance Stats Card */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-5 border border-slate-800 shadow-xl grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">총 참석 대상</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {stats.total_participants}
                </span>
                <span className="text-xs text-slate-400 ml-0.5">명</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                <span className="text-[11px] font-bold text-emerald-400 block mb-1">현재 출석</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {stats.checked_in_count}
                </span>
                <span className="text-xs text-emerald-400 ml-0.5">명</span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/40">
                <span className="text-[11px] font-bold text-indigo-300 block mb-1">출석률</span>
                <span className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
                  {stats.attendance_rate}%
                </span>
              </div>
            </div>

            {/* Trio Hero Visual in Banner */}
            <div className="hidden lg:flex items-center justify-center p-2 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <HeroTrioVisual size="sm" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
        <div>Hanwha Ocean HERO 2.0 WORKSHOP Integrated Onsite Display</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBannerData}
            className="hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새로고침</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
