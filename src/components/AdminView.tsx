import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Percent,
  Search,
  Download,
  Upload,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Edit2,
  History,
  QrCode,
  LogOut,
  AlertCircle,
  Check,
  Calendar,
  Lock,
  UserCheck,
  Shield,
  Key,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { HanwhaLogo, HeroBadge } from './HeaderLogo';
import { DecorativeBackground } from './DecorativeBackground';
import { CsvUploadModal } from './CsvUploadModal';
import { ParticipantModal } from './ParticipantModal';
import { AttendanceCodeModal } from './AttendanceCodeModal';
import { AttemptHistoryModal } from './AttemptHistoryModal';
import { ExportModal } from './ExportModal';
import { Participant, AttendanceCode, OverviewStats } from '../types';

interface AdminViewProps {
  onOpenQRBanner: () => void;
  onOpenParticipantView: () => void;
}

export function AdminView({ onOpenQRBanner, onOpenParticipantView }: AdminViewProps) {
  const [token, setToken] = useState<string>(() => localStorage.getItem('ax_admin_token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tab: PARTICIPANTS or CODES
  const [tab, setTab] = useState<'PARTICIPANTS' | 'CODES'>('PARTICIPANTS');

  // Stats & Lists
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [codes, setCodes] = useState<AttendanceCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Participant Filters
  const [filterDate, setFilterDate] = useState('전체');
  const [filterLocation, setFilterLocation] = useState('전체');
  const [filterRound, setFilterRound] = useState('전체');
  const [filterClass, setFilterClass] = useState('전체');
  const [filterGroup, setFilterGroup] = useState('전체');
  const [filterStatus, setFilterStatus] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Attendance Code Filters
  const [codeFilterLocation, setCodeFilterLocation] = useState('전체');
  const [codeFilterDate, setCodeFilterDate] = useState('전체');
  const [codeFilterStatus, setCodeFilterStatus] = useState('전체');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');

  // Modals
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editParticipant, setEditParticipant] = useState<Participant | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [editCode, setEditCode] = useState<AttendanceCode | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedHistoryParticipant, setSelectedHistoryParticipant] = useState<Participant | null>(null);

  // Custom in-app confirmation modal (works reliably inside iframe sandbox)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Available rounds (dynamically generated from CSV participants up to max round, e.g., 38차)
  const roundOptions = useMemo(() => {
    const set = new Set<string>();
    let maxRoundNum = 10;
    participants.forEach((p) => {
      if (p.round) {
        const num = parseInt(p.round.replace(/[^0-9]/g, ''), 10);
        if (num && num > maxRoundNum) {
          maxRoundNum = num;
        }
        const r = p.round.trim();
        if (r) set.add(r.endsWith('차') ? r : `${r}차`);
      }
    });
    // Generate 1차 to maxRoundNum차 (e.g. 1차 ~ 38차)
    for (let i = 1; i <= maxRoundNum; i++) {
      set.add(`${i}차`);
    }
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [participants]);

  // Code date options
  const codeDateOptions = useMemo(() => {
    const set = new Set<string>();
    codes.forEach((c) => {
      if (c.workshop_date) set.add(c.workshop_date);
    });
    return Array.from(set).sort().reverse();
  }, [codes]);

  // Filtered Codes
  const filteredCodes = useMemo(() => {
    return codes.filter((c) => {
      if (codeFilterLocation !== '전체' && c.location !== codeFilterLocation) return false;
      if (codeFilterDate !== '전체' && c.workshop_date !== codeFilterDate) return false;
      if (codeFilterStatus === 'active' && !c.is_active) return false;
      if (codeFilterStatus === 'inactive' && c.is_active) return false;
      if (codeSearchQuery.trim()) {
        const q = codeSearchQuery.trim().toLowerCase();
        const matchCode = c.attendance_code.toLowerCase().includes(q);
        const matchLoc = (c.location || '').toLowerCase().includes(q);
        const matchDate = (c.workshop_date || '').toLowerCase().includes(q);
        if (!matchCode && !matchLoc && !matchDate) return false;
      }
      return true;
    });
  }, [codes, codeFilterLocation, codeFilterDate, codeFilterStatus, codeSearchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(participants.length / pageSize));
  const paginatedParticipants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return participants.slice(start, start + pageSize);
  }, [participants, currentPage, pageSize]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterLocation, filterRound, filterClass, filterGroup, filterStatus, searchQuery]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || '로그인에 실패했습니다.');
        return;
      }
      setToken(data.token);
      localStorage.setItem('ax_admin_token', data.token);
    } catch {
      setLoginError('서버 연결 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('ax_admin_token');
  };

  const fetchOverview = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (filterDate !== '전체') params.append('date', filterDate);
      if (filterLocation !== '전체') params.append('location', filterLocation);
      if (filterRound !== '전체') params.append('round', filterRound);

      const res = await fetch(`/api/admin/overview?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOverview(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch overview', err);
    }
  }, [token, filterDate, filterLocation, filterRound]);

  const fetchParticipants = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate !== '전체') params.append('date', filterDate);
      if (filterLocation !== '전체') params.append('location', filterLocation);
      if (filterRound !== '전체') params.append('round', filterRound);
      if (filterClass !== '전체') params.append('class_name', filterClass);
      if (filterGroup !== '전체') params.append('group_number', filterGroup);
      if (filterStatus !== '전체') params.append('status', filterStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/participants?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setParticipants(data.participants);
      }
    } catch (err) {
      console.error('Failed to fetch participants', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, filterDate, filterLocation, filterRound, filterClass, filterGroup, filterStatus, searchQuery]);

  const fetchCodes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/attendance-codes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCodes(data.codes);
      }
    } catch (err) {
      console.error('Failed to fetch codes', err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchOverview();
    fetchParticipants();
    fetchCodes();

    const interval = setInterval(() => {
      fetchOverview();
      fetchParticipants();
    }, 2500);

    const onFocus = () => {
      fetchOverview();
      fetchParticipants();
      fetchCodes();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [token, fetchOverview, fetchParticipants, fetchCodes]);

  const handleManualCheckIn = async (employeeId: string) => {
    try {
      const res = await fetch('/api/admin/attendance/manual-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || '출석 처리에 실패했습니다.');
        return;
      }
      showToast(data.message || '수동 출석 처리되었습니다.');
      fetchParticipants();
      fetchOverview();
    } catch {
      showToast('출석 처리 중 오류가 발생했습니다.');
    }
  };

  const handleCancelAttendance = (participant: Participant) => {
    setConfirmModal({
      title: '출석 기록 취소',
      message: `[${participant.employee_name || participant.employee_id} (${participant.employee_id})] 참가자의 출석 기록을 취소하시겠습니까?\n취소 시 참가자가 다시 출석체크할 수 있습니다.`,
      confirmLabel: '출석 취소',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/attendance/cancel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              participant_id: participant.id,
              employee_id: participant.employee_id,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            showToast(data.message || '출석 취소에 실패했습니다.');
            return;
          }
          showToast('출석 기록이 취소되었습니다.');
          fetchParticipants();
          fetchOverview();
        } catch {
          showToast('취소 처리 중 오류가 발생했습니다.');
        }
      },
    });
  };

  const handleDeleteParticipant = (participant: Participant) => {
    setConfirmModal({
      title: '참가자 삭제',
      message: `[${participant.employee_name || participant.employee_id} (${participant.employee_id})] 참가자 정보를 완전히 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/participants/${participant.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            showToast('참가자가 삭제되었습니다.');
            fetchParticipants();
            fetchOverview();
          }
        } catch {
          showToast('삭제 중 오류가 발생했습니다.');
        }
      },
    });
  };

  const handleDeleteCode = (codeId: string) => {
    setConfirmModal({
      title: '출석코드 삭제',
      message: '해당 출석코드를 삭제하시겠습니까? 삭제 후에는 해당 코드로 출석할 수 없습니다.',
      confirmLabel: '코드 삭제',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/attendance-codes/${codeId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            showToast('출석코드가 삭제되었습니다.');
            fetchCodes();
          } else {
            showToast(data.message || '출석코드 삭제 실패');
          }
        } catch {
          showToast('삭제 실패');
        }
      },
    });
  };

  const handleClearAllParticipants = () => {
    setConfirmModal({
      title: '전체 참가자 명단 삭제',
      message: '⚠️ 모든 참가자 명단 및 출석 기록을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 이후 내가 올린 CSV 파일로만 새로 명단을 등록할 수 있습니다.',
      confirmLabel: '전체 삭제',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/participants/clear-all', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            showToast('모든 참가자 명단과 출석 기록이 삭제되었습니다.');
            fetchParticipants();
            fetchOverview();
          } else {
            showToast(data.message || '참가자 전체 삭제 실패');
          }
        } catch {
          showToast('서버 통신 오류');
        }
      },
    });
  };

  const handleClearAllCodes = () => {
    setConfirmModal({
      title: '전체 출석코드 삭제',
      message: '⚠️ 등록된 모든 출석코드를 삭제하시겠습니까?',
      confirmLabel: '모두 삭제',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/attendance-codes/clear-all', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            showToast('모든 출석코드가 삭제되었습니다.');
            fetchCodes();
          } else {
            showToast('출석코드 삭제 실패');
          }
        } catch {
          showToast('출석코드 삭제 실패');
        }
      },
    });
  };

  const handleGenerateDefaultCodes = async () => {
    try {
      const res = await fetch('/api/admin/attendance-codes/generate-defaults', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast('당일 기본 출석코드가 자동 생성되었습니다. (거제: 맥스, 서울: 가드, 부산: 테크)');
        fetchCodes();
      }
    } catch {
      showToast('코드 생성 오류');
    }
  };

  const handleClearAllAttendance = () => {
    setConfirmModal({
      title: '출석 기록 초기화 (0%)',
      message: '⚠️ 참가자 명단은 유지한 채 모든 출석 기록을 초기화(0%)하시겠습니까?\n모든 인원이 미출석 상태로 전환되어 처음부터 새로 출석체크 테스트를 진행할 수 있습니다.',
      confirmLabel: '출석 기록 초기화',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/clear-all-attendance', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            showToast('모든 출석 기록이 비워졌습니다. (출석률 0%)');
            fetchParticipants();
            fetchOverview();
          }
        } catch {
          showToast('출석 기록 초기화 실패');
        }
      },
    });
  };

  const handleResetDemoData = async () => {
    try {
      const res = await fetch('/api/admin/reset-demo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast('데모 샘플 데이터가 성공적으로 복원되었습니다.');
        fetchParticipants();
        fetchOverview();
        fetchCodes();
      }
    } catch {
      showToast('데이터 복원 실패');
    }
  };

  const handleClearFilters = () => {
    setFilterLocation('전체');
    setFilterRound('전체');
    setFilterClass('전체');
    setFilterGroup('전체');
    setFilterStatus('전체');
    setSearchQuery('');
  };

  // Login View
  if (!token) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-[#EFF4FF] via-[#F8FAFC] to-[#EEF2FF] flex items-center justify-center p-4">
        <DecorativeBackground />
        <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl shadow-indigo-500/10 border border-white/90 p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <HanwhaLogo className="h-7" showText={true} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <HeroBadge />
              <span className="text-slate-400 font-normal">|</span>
              <span>관리자 포털</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">관리자 대시보드 로그인</h1>
            <p className="text-slate-500 text-xs mt-1">출석관리 및 실시간 운영 대시보드에 로그인하세요.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 pl-1">아이디</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="w-full px-4 py-3 text-sm bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 pl-1">비밀번호</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 text-sm bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 active:scale-[0.99]"
            >
              {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : '관리자 로그인'}
            </button>
          </form>

          {/* Portfolio Demo Account Info Box */}
          <div className="mt-5 p-3.5 bg-blue-50/90 border border-blue-200/80 rounded-2xl text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center justify-between font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-blue-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                포트폴리오 데모 계정
              </span>
              <button
                type="button"
                onClick={() => {
                  setUsername('demo-admin');
                  setPassword('demo-admin');
                }}
                className="text-[11px] text-blue-700 bg-white hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-300 font-bold transition-all cursor-pointer shadow-2xs"
              >
                데모 계정 자동 입력
              </button>
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              아이디: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900">demo-admin</code> / 비밀번호: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900">demo-admin</code>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onOpenParticipantView}
              className="text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors cursor-pointer"
            >
              ← 참여자 출석 화면으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in Dashboard
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HanwhaLogo className="h-6" showText={true} />
            <div className="hidden md:block h-5 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                  관리자 대시보드
                </span>
                <HeroBadge />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>실시간 출석 현황 모니터링</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenQRBanner}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              title="강의장 벽면에 부착/투사할 QR 배너 화면"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">현장 QR 배너</span>
            </button>

            <button
              type="button"
              onClick={onOpenParticipantView}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">참여자 모바일 화면</span>
              <span className="sm:hidden">출석창</span>
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">관리자 대시보드</h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">실시간 출석 현황</p>
          </div>
        </div>

        {/* Stats Grid */}
        {overview && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-50/80 to-slate-50/80 p-4 sm:p-5 rounded-2xl border border-blue-100/90 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-600">총 인원</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {overview.total_participants}
                <span className="text-sm font-bold text-slate-500 ml-1">명</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/80 to-slate-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-100/90 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-800">출석 인원</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                {overview.checked_in_count}
                <span className="text-sm font-bold text-emerald-700 ml-1">명</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50/80 to-slate-50/80 p-4 sm:p-5 rounded-2xl border border-rose-100/90 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-rose-800">미출석 인원</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600">
                {overview.unchecked_count}
                <span className="text-sm font-bold text-rose-700 ml-1">명</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 p-4 sm:p-5 rounded-2xl border border-indigo-100/90 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
                  <Percent className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-indigo-800">출석률</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600">
                {overview.attendance_rate}
                <span className="text-sm font-bold ml-0.5">%</span>
              </div>
            </div>
          </div>
        )}

        {/* Location Breakdown & Control Bar */}
        {overview && overview.location_breakdown && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-700">장소별 출석 현황:</span>
              <div className="flex flex-wrap gap-2">
                {overview.location_breakdown.map((loc) => (
                  <div
                    key={loc.location}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="font-bold text-slate-800">{loc.location}</span>
                    <span className="text-slate-500 font-medium">
                      {loc.checked_in}/{loc.total}명 ({loc.rate}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                실시간 동기화 중 (2.5초)
              </span>

              <button
                type="button"
                onClick={() => {
                  fetchOverview();
                  fetchParticipants();
                  fetchCodes();
                  showToast('데이터가 새로고침되었습니다.');
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="새로고침"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">새로고침</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllAttendance}
                className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="참가자 명단은 유지하고 모든 출석 기록을 미출석(0%)으로 초기화하여 새로 테스트"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">출석기록 비우기 (0% 시작)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab & Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/80 border border-slate-200">
            <button
              type="button"
              onClick={() => setTab('PARTICIPANTS')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'PARTICIPANTS'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👥 참가자 & 출석 현황 ({participants.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('CODES')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'CODES' ? 'bg-white text-gray-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔑 출석코드 관리 ({codes.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            {tab === 'PARTICIPANTS' ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>출석결과 CSV 다운로드</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(true)}
                  className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>명단 CSV 일괄 업로드</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditParticipant(null);
                    setIsParticipantModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>개별 추가</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllParticipants}
                  className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="참가자 전체 삭제 (내가 올린 CSV 파일로만 새로 명단 등록)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGenerateDefaultCodes}
                  className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>오늘 기본 코드 일괄 생성 (거제/서울/부산)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditCode(null);
                    setIsCodeModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>코드 추가</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllCodes}
                  className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="모든 출석코드 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Participants Table */}
        {tab === 'PARTICIPANTS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="사번 또는 이름 검색..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none hover:border-slate-400 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="전체">장소: 전체</option>
                  <option value="거제">거제</option>
                  <option value="서울">서울</option>
                  <option value="부산">부산</option>
                </select>

                <select
                  value={filterRound}
                  onChange={(e) => setFilterRound(e.target.value)}
                  className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none hover:border-slate-400 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="전체">차수: 전체</option>
                  {roundOptions.map((r) => (
                    <option key={r} value={r.replace(/차$/, '')}>
                      {r}
                    </option>
                  ))}
                </select>

                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none hover:border-slate-400 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="전체">반: 전체</option>
                  <option value="1반">1반</option>
                  <option value="2반">2반</option>
                  <option value="3반">3반</option>
                  <option value="단일반">단일반</option>
                </select>

                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none hover:border-slate-400 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="전체">조: 전체</option>
                  <option value="1조">1조</option>
                  <option value="2조">2조</option>
                  <option value="3조">3조</option>
                  <option value="4조">4조</option>
                  <option value="5조">5조</option>
                  <option value="6조">6조</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none hover:border-slate-400 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="전체">출석상태: 전체</option>
                  <option value="checked_in">출석 완료</option>
                  <option value="unchecked">미출석</option>
                </select>

                {(filterLocation !== '전체' ||
                  filterRound !== '전체' ||
                  filterClass !== '전체' ||
                  filterGroup !== '전체' ||
                  filterStatus !== '전체' ||
                  searchQuery) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-2 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl font-medium transition-colors cursor-pointer text-xs"
                    title="모든 필터 초기화"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">사번</th>
                    <th className="py-3 px-3">장소</th>
                    <th className="py-3 px-2 text-center">차수</th>
                    <th className="py-3 px-3">일자</th>
                    <th className="py-3 px-3">반</th>
                    <th className="py-3 px-3">조</th>
                    <th className="py-3 px-4">출석 여부</th>
                    <th className="py-3 px-4">출석 시간</th>
                    <th className="py-3 px-3">방식</th>
                    <th className="py-3 px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                        {isLoading ? '데이터를 불러오는 중입니다...' : '조건에 해당하는 참가자가 없습니다.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">{p.employee_id}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {p.location}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-semibold text-slate-600 text-[11px]">
                          {p.round ? (p.round.endsWith('차') ? p.round : `${p.round}차`) : '1차'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{p.workshop_date}</td>
                        <td className="py-3 px-3 font-medium text-slate-600">{p.class_name}</td>
                        <td className="py-3 px-3 font-semibold text-blue-700">{p.group_number}</td>
                        <td className="py-3 px-4">
                          {p.is_checked_in ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                              <Check className="w-3 h-3" />
                              출석
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-400 font-semibold text-[11px]">
                              미출석
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {p.attendance_time ? (
                            <div className="flex flex-col gap-0.5">
                              <span>{p.attendance_time}</span>
                              {p.attempt_count && p.attempt_count > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedHistoryParticipant(p)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded-md w-fit transition-colors cursor-pointer"
                                  title="전체 출석 시도 기록 보기"
                                >
                                  <History className="w-2.5 h-2.5" />총 {p.attempt_count}회 시도
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500">
                          {p.is_checked_in ? (p.attendance_method === 'admin' ? '수동' : 'QR') : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {p.is_checked_in ? (
                              <button
                                type="button"
                                onClick={() => handleCancelAttendance(p)}
                                className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[11px] transition-colors cursor-pointer"
                                title="출석 기록 취소"
                              >
                                출석 취소
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleManualCheckIn(p.employee_id)}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors cursor-pointer"
                                title="관리자 수동 출석 처리"
                              >
                                수동 출석
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditParticipant(p);
                                setIsParticipantModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              title="정보 수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteParticipant(p)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="참가자 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {participants.length > 0 && (
              <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <span>
                    총 <strong className="text-gray-900 font-bold">{participants.length.toLocaleString()}</strong>명 중{' '}
                    <strong className="text-gray-900 font-bold">{((currentPage - 1) * pageSize + 1).toLocaleString()}</strong> -{' '}
                    <strong className="text-gray-900 font-bold">
                      {Math.min(currentPage * pageSize, participants.length).toLocaleString()}
                    </strong>
                    명 표시
                  </span>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1">
                    <span>페이지당</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700 outline-none"
                    >
                      <option value={20}>20명</option>
                      <option value={50}>50명</option>
                      <option value={100}>100명</option>
                      <option value={200}>200명</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 cursor-pointer"
                    title="이전 페이지"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-2.5 py-1 text-slate-700 font-bold">
                    {currentPage} / {totalPages} 페이지
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 cursor-pointer"
                    title="다음 페이지"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Attendance Codes Table */}
        {tab === 'CODES' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">출석코드 설정 목록</h3>
                <p className="text-xs text-gray-500">
                  날짜 및 장소별로 설정된 활성 출석코드를 검색 및 필터링하여 관리합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchCodes}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="출석코드 목록 새로고침"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  새로고침
                </button>
              </div>
            </div>

            {/* Attendance Code Filter Bar */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={codeSearchQuery}
                    onChange={(e) => setCodeSearchQuery(e.target.value)}
                    placeholder="코드/날짜/장소 검색"
                    className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                  />
                </div>

                {/* Location Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">장소:</span>
                  <select
                    value={codeFilterLocation}
                    onChange={(e) => setCodeFilterLocation(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 outline-none w-full cursor-pointer"
                  >
                    <option value="전체">장소 전체</option>
                    <option value="거제">거제</option>
                    <option value="서울">서울</option>
                    <option value="부산">부산</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">일자:</span>
                  <select
                    value={codeFilterDate}
                    onChange={(e) => setCodeFilterDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 outline-none w-full cursor-pointer"
                  >
                    <option value="전체">일자 전체</option>
                    {codeDateOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">상태:</span>
                  <select
                    value={codeFilterStatus}
                    onChange={(e) => setCodeFilterStatus(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 outline-none w-full cursor-pointer"
                  >
                    <option value="전체">상태 전체</option>
                    <option value="active">활성 코드만</option>
                    <option value="inactive">비활성 코드만</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                <span>
                  총 <strong className="text-gray-900 font-bold">{codes.length}</strong>개 중{' '}
                  <strong className="text-blue-600 font-bold">{filteredCodes.length}</strong>개 코드 표시
                </span>

                {(codeFilterLocation !== '전체' ||
                  codeFilterDate !== '전체' ||
                  codeFilterStatus !== '전체' ||
                  codeSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCodeFilterLocation('전체');
                      setCodeFilterDate('전체');
                      setCodeFilterStatus('전체');
                      setCodeSearchQuery('');
                    }}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer text-xs"
                    title="출석코드 필터 초기화"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">날짜</th>
                    <th className="py-3 px-4">적용 장소</th>
                    <th className="py-3 px-4">출석코드</th>
                    <th className="py-3 px-4">상태</th>
                    <th className="py-3 px-4">시간 제한</th>
                    <th className="py-3 px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        {codes.length === 0
                          ? "등록된 출석코드가 없습니다. 상단의 '오늘 기본 코드 일괄 생성'을 클릭하거나 새로 추가해주세요."
                          : '조건에 일치하는 출석코드가 없습니다.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">{c.workshop_date}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {c.location}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-black text-sm border border-blue-200 font-mono">
                            {c.attendance_code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {c.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                              활성
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-400 font-semibold text-[11px]">
                              비활성
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {c.time_limit_enabled ? `${c.checkin_start_time} ~ ${c.checkin_end_time}` : '상시 가능'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditCode(c);
                                setIsCodeModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              title="코드 수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCode(c.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="코드 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          fetchParticipants();
          fetchOverview();
        }}
        adminToken={token}
      />

      <ParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => setIsParticipantModalOpen(false)}
        onSuccess={() => {
          fetchParticipants();
          fetchOverview();
        }}
        adminToken={token}
        editParticipant={editParticipant}
        availableRounds={roundOptions}
      />

      <AttendanceCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        onSuccess={() => {
          fetchCodes();
        }}
        adminToken={token}
        editCode={editCode}
      />

      <AttemptHistoryModal
        participant={selectedHistoryParticipant}
        onClose={() => setSelectedHistoryParticipant(null)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        participants={participants}
      />

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${confirmModal.isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{confirmModal.title}</h3>
              </div>
              <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed font-medium">
                {confirmModal.message}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-xs cursor-pointer ${
                  confirmModal.isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmModal.confirmLabel || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
