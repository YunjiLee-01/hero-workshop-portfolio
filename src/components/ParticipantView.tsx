import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  User,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Calendar,
  QrCode,
  Shield,
} from 'lucide-react';
import { HanwhaLogo, HeroBadge } from './HeaderLogo';
import { DecorativeBackground } from './DecorativeBackground';
import { HeroTrioVisual } from './HeroTrioImage';

interface ParticipantViewProps {
  siteParam?: string;
  onOpenAdmin?: () => void;
  onOpenQRBanner?: () => void;
}

interface WorkshopInfo {
  id?: string;
  employee_id: string;
  employee_name?: string;
  location: string;
  workshop_date: string;
  round?: string;
  class_name: string;
  group_number: string;
}

interface CheckInSuccessData {
  status: 'checked_in' | 'already_checked_in' | string;
  employee_id: string;
  employee_name?: string;
  location: string;
  class_name: string;
  group_number: string;
  workshop_date?: string;
  round?: string;
  attendance_time?: string;
}

export function ParticipantView({ siteParam = '', onOpenAdmin, onOpenQRBanner }: ParticipantViewProps) {
  const [step, setStep] = useState<'EMPLOYEE_ID' | 'ATTENDANCE_CODE' | 'SUCCESS'>('EMPLOYEE_ID');
  const [employeeId, setEmployeeId] = useState('');
  const [attendanceCode, setAttendanceCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [workshopInfo, setWorkshopInfo] = useState<WorkshopInfo | undefined>();
  const [checkInResult, setCheckInResult] = useState<CheckInSuccessData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [serverTime, setServerTime] = useState('');

  // Onsite self registration states
  const [isSelfRegisterOpen, setIsSelfRegisterOpen] = useState(false);
  const [registerLocation, setRegisterLocation] = useState(
    siteParam === 'seoul' ? '서울' : siteParam === 'busan' ? '부산' : '거제'
  );
  const [registerClass, setRegisterClass] = useState('1반');
  const [registerGroup, setRegisterGroup] = useState('1조');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    fetch('/api/attendance/info')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.server_time) {
          setServerTime(data.server_time);
        }
      })
      .catch(() => {});
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#2563eb', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } catch {
      // ignore
    }
  };

  const handleVerifyEmployee = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const idToVerify = employeeId.trim();
    if (!idToVerify) {
      setErrorMessage('사번을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setIsUnregistered(false);

    try {
      const res = await fetch('/api/attendance/verify-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: idToVerify,
          site: siteParam || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.is_unregistered) {
          setIsUnregistered(true);
        }
        setErrorMessage(data.message || '사번 확인에 실패했습니다. 사번을 다시 확인해주세요.');
        return;
      }

      if (data.verification_token) {
        setVerificationToken(data.verification_token);
        setWorkshopInfo(data.workshop_info);
        setErrorMessage('');
        setIsUnregistered(false);
        setStep('ATTENDANCE_CODE');
      }
    } catch {
      setErrorMessage('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      alert('사번을 입력해주세요.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/attendance/self-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId.trim(),
          employee_name: '-',
          location: registerLocation,
          class_name: registerLocation === '거제' ? registerClass : '단일반',
          group_number: registerGroup,
          site: siteParam || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || '현장 등록에 실패했습니다.');
        return;
      }

      setVerificationToken(data.verification_token);
      setWorkshopInfo(data.workshop_info);
      setIsSelfRegisterOpen(false);
      setIsUnregistered(false);
      setErrorMessage('');
      setStep('ATTENDANCE_CODE');
    } catch {
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = attendanceCode.trim();
    if (!code) {
      setErrorMessage('출석코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_token: verificationToken,
          attendance_code: code,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.status === 'expired_token') {
          setErrorMessage(data.message || '인증 시간이 만료되었습니다. 사번 입력부터 다시 시도해주세요.');
        } else {
          setErrorMessage(data.message || '출석코드가 올바르지 않습니다. 다시 확인해주세요.');
        }
        return;
      }

      setCheckInResult(data);
      setStep('SUCCESS');
      if (data.status === 'checked_in') {
        triggerConfetti();
      }
    } catch {
      setErrorMessage('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToStart = () => {
    setStep('EMPLOYEE_ID');
    setEmployeeId('');
    setAttendanceCode('');
    setVerificationToken('');
    setWorkshopInfo(undefined);
    setCheckInResult(null);
    setErrorMessage('');
    setIsUnregistered(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#EFF4FF] via-[#F8FAFC] to-[#EEF2FF] flex flex-col justify-between overflow-x-hidden font-sans text-slate-900">
      <DecorativeBackground />

      <header className="relative z-10 w-full max-w-md mx-auto px-5 pt-4 pb-2 flex items-center justify-between">
        <HanwhaLogo className="h-6" showText={true} />
        <div className="flex items-center gap-2">
          {siteParam && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {siteParam}
            </span>
          )}
          {onOpenQRBanner && (
            <button
              type="button"
              onClick={onOpenQRBanner}
              id="btn-header-qr"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-blue-600 transition-all shadow-xs cursor-pointer"
              title="현장 QR 코드 배너 열기"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>현장 QR</span>
            </button>
          )}
          <HeroBadge />
        </div>
      </header>

      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-2 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 'EMPLOYEE_ID' && (
            <motion.div
              key="step-1-employee"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col space-y-3"
            >
              <div className="flex items-end justify-between px-2 pt-1">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-none flex items-baseline gap-1.5">
                    <span>HERO</span>
                    <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      2.0
                    </span>
                  </h1>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 leading-tight">
                    WORKSHOP
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">출석 확인 시스템</p>
                </div>
                <div className="w-56 sm:w-72 -mb-2 flex justify-end">
                  <HeroTrioVisual size="md" />
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/85 rounded-3xl border border-white/90 shadow-xl shadow-indigo-500/10 p-6 sm:p-7 relative overflow-hidden">
                <div className="flex justify-center mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/30">
                    01
                  </span>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
                    사번을 입력해주세요
                  </h3>
                  <p className="text-xs text-slate-500">정확한 본인 확인을 위해 사번을 입력해주세요.</p>
                </div>

                <form onSubmit={handleVerifyEmployee} className="space-y-4">
                  <div>
                    <label htmlFor="employee-id-input" className="block text-xs font-bold text-slate-700 mb-1.5 pl-1">
                      사번
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="employee-id-input"
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        placeholder="사번을 입력하세요"
                        value={employeeId}
                        onChange={(e) => {
                          setEmployeeId(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        className="w-full pl-10 pr-4 py-3.5 bg-white/90 border border-slate-200/90 rounded-2xl text-slate-900 font-medium text-sm sm:text-base placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-xs transition-all"
                      />
                    </div>

                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2.5 p-3 rounded-xl bg-red-50/95 border border-red-200 text-red-700 text-xs space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                          <span className="font-semibold leading-snug">{errorMessage}</span>
                        </div>
                        {isUnregistered && (
                          <div className="pt-2 border-t border-red-200/80 flex items-center justify-between">
                            <span className="text-[11px] text-red-800">사전 명단에 없으신가요?</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsSelfRegisterOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            >
                              <span>+ 현장 즉시 등록 후 출석</span>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <button
                    type="submit"
                    id="btn-employee-next"
                    disabled={isLoading || !employeeId.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        확인 중...
                      </span>
                    ) : (
                      <span>다음 →</span>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelfRegisterOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    + 현장 등록하기
                  </button>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    개인정보는 안전하게 보호됩니다.
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'ATTENDANCE_CODE' && (
            <motion.div
              key="step-2-code"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col space-y-3"
            >
              <div className="backdrop-blur-xl bg-white/85 rounded-3xl border border-white/90 shadow-xl shadow-indigo-500/10 p-6 sm:p-7 relative overflow-hidden">
                <div className="flex justify-center mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/30">
                    02
                  </span>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
                    오늘의 출석코드를
                    <br />
                    입력해주세요
                  </h3>
                  <p className="text-xs text-slate-500">운영진이 안내한 출석코드를 입력해주세요.</p>
                </div>

                {workshopInfo && (
                  <div className="mb-4 p-2.5 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center gap-3 text-xs font-semibold text-blue-900">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {workshopInfo.location} 워크숍
                    </span>
                    <span className="text-blue-300">|</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {workshopInfo.workshop_date}
                    </span>
                  </div>
                )}

                <form onSubmit={handleCheckIn} className="space-y-4">
                  <div>
                    <label
                      htmlFor="attendance-code-input"
                      className="block text-xs font-bold text-slate-700 mb-1.5 pl-1"
                    >
                      출석코드
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="attendance-code-input"
                        type="text"
                        autoFocus
                        placeholder="출석코드를 입력하세요"
                        value={attendanceCode}
                        onChange={(e) => {
                          setAttendanceCode(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        className="w-full pl-10 pr-4 py-3.5 bg-white/90 border border-slate-200/90 rounded-2xl text-slate-900 font-bold text-base placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-xs transition-all"
                      />
                    </div>

                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2.5 p-2.5 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                        <span className="font-semibold leading-snug">{errorMessage}</span>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      id="btn-checkin-submit"
                      disabled={isLoading || !attendanceCode.trim()}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          확인 중...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          출석 확인 <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setStep('EMPLOYEE_ID');
                      }}
                      className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      사번 다시 입력하기
                    </button>
                  </div>
                </form>

                <div className="mt-5 text-center text-[11px] text-slate-400">
                  출석코드를 모를 경우 운영진에게 문의해주세요.
                </div>
              </div>
            </motion.div>
          )}

          {step === 'SUCCESS' && checkInResult && (
            <motion.div
              key="step-3-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col space-y-4"
            >
              <div className="w-full max-w-xs mx-auto flex items-center justify-between px-4 py-1">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 mt-0.5">신원 확인</span>
                </div>
                <div className="flex-1 h-0.5 bg-emerald-500 mx-2 -mt-3" />
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 mt-0.5">출석 인증</span>
                </div>
                <div className="flex-1 h-0.5 bg-emerald-500 mx-2 -mt-3" />
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-500/30">
                    ✓
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 mt-0.5">완료</span>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/90 rounded-3xl border border-white/95 shadow-2xl shadow-indigo-500/10 p-6 sm:p-7 text-center relative overflow-hidden">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-60"
                    style={{ animationDuration: '2.5s' }}
                  />
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />
                  </div>
                </div>

                <h3 className="text-emerald-600 font-extrabold text-sm sm:text-base tracking-tight mb-1">
                  {checkInResult.status === 'already_checked_in'
                    ? '이미 출석이 완료되었습니다!'
                    : '출석이 완료되었습니다!'}
                </h3>

                <p className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
                  {checkInResult.employee_name && checkInResult.employee_name !== '-' ? (
                    <>
                      <span className="text-slate-900 font-black">{checkInResult.employee_name}</span>님은
                    </>
                  ) : (
                    <>
                      사번{' '}
                      <span className="text-slate-900 font-black font-mono">
                        {checkInResult.employee_id || employeeId}
                      </span>
                      님은
                    </>
                  )}
                </p>

                <div className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-200/80">
                  <div className="text-xs font-semibold text-blue-700 mb-1">자리 위치</div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight flex items-center justify-center gap-2">
                    <span>{checkInResult.class_name}</span>
                    <span className="text-blue-400">·</span>
                    <span className="text-indigo-600">{checkInResult.group_number}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">테이블</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left bg-slate-50/90 p-3.5 rounded-2xl border border-slate-100 text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">장소</span>
                    <span className="font-bold text-slate-800">{checkInResult.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">출석 시간</span>
                    <span className="font-mono font-bold text-slate-800">
                      {checkInResult.attendance_time || '방금 완료'}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-600 mb-4">즐거운 워크숍 되세요!</p>

                <button
                  type="button"
                  onClick={handleResetToStart}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  다른 참가자 출석하기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 w-full max-w-md mx-auto px-5 py-4 text-center flex flex-col items-center justify-center gap-2 text-[11px] text-slate-400 border-t border-slate-200/50 mt-auto">
        <div className="flex items-center justify-between w-full">
          <span className="font-semibold text-slate-500">Hanwha Ocean HERO 2.0 WORKSHOP</span>
          <span className="font-mono text-[10px] text-slate-400">{serverTime || 'KST Standard Time'}</span>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
          {onOpenQRBanner && (
            <button
              type="button"
              onClick={onOpenQRBanner}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition-all cursor-pointer"
              title="강의실/현장용 대형 QR 배너 보기"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>현장 대형 QR 배너 열기</span>
            </button>
          )}
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-all cursor-pointer"
              title="관리자 로그인 화면으로 이동"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>관리자 모드</span>
            </button>
          )}
        </div>
      </footer>

      {isSelfRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">현장 참가자 즉시 등록</h3>
                  <p className="text-[11px] text-slate-500">사전 명단에 없는 신규 인원을 등록하고 출석을 진행합니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelfRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSelfRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">사번 *</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="예: 20260999"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">장소</label>
                  <select
                    value={registerLocation}
                    onChange={(e) => setRegisterLocation(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="거제">거제</option>
                    <option value="서울">서울</option>
                    <option value="부산">부산</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">반</label>
                  <select
                    value={registerClass}
                    onChange={(e) => setRegisterClass(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {registerLocation === '거제' ? (
                      <>
                        <option value="1반">1반</option>
                        <option value="2반">2반</option>
                        <option value="3반">3반</option>
                      </>
                    ) : (
                      <option value="단일반">단일반</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">조</label>
                  <select
                    value={registerGroup}
                    onChange={(e) => setRegisterGroup(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="1조">1조</option>
                    <option value="2조">2조</option>
                    <option value="3조">3조</option>
                    <option value="4조">4조</option>
                    <option value="5조">5조</option>
                    <option value="6조">6조</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSelfRegisterOpen(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isRegistering ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    '등록하고 출석 진행 →'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
