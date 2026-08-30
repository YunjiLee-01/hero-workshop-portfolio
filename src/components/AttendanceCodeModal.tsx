import React, { useState, useEffect } from 'react';
import { Key, Save, AlertCircle, X } from 'lucide-react';
import { AttendanceCode } from '../types';

interface AttendanceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminToken: string;
  editCode: AttendanceCode | null;
}

export function AttendanceCodeModal({
  isOpen,
  onClose,
  onSuccess,
  adminToken,
  editCode,
}: AttendanceCodeModalProps) {
  const [workshopDate, setWorkshopDate] = useState('');
  const [location, setLocation] = useState('거제');
  const [attendanceCode, setAttendanceCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('09:30');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editCode) {
      setWorkshopDate(editCode.workshop_date);
      setLocation(editCode.location || '거제');
      setAttendanceCode(editCode.attendance_code);
      setIsActive(editCode.is_active);
      setTimeLimitEnabled(!!editCode.time_limit_enabled);
      setStartTime(editCode.checkin_start_time || '08:30');
      setEndTime(editCode.checkin_end_time || '09:30');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setWorkshopDate(today);
      setLocation('거제');
      setAttendanceCode('');
      setIsActive(true);
      setTimeLimitEnabled(false);
      setStartTime('08:30');
      setEndTime('09:30');
    }
    setErrorMessage('');
  }, [editCode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshopDate.trim() || !attendanceCode.trim()) {
      setErrorMessage('날짜와 출석코드는 필수 입력 항목입니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const isEdit = !!editCode;
      const url = isEdit
        ? `/api/admin/attendance-codes/${editCode.id}`
        : '/api/admin/attendance-codes';

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          id: editCode?.id,
          workshop_date: workshopDate.trim(),
          location: location.trim(),
          attendance_code: attendanceCode.trim(),
          is_active: isActive,
          time_limit_enabled: timeLimitEnabled,
          checkin_start_time: startTime,
          checkin_end_time: endTime,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || '출석코드 저장에 실패했습니다.');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {editCode ? '출석코드 수정' : '신규 출석코드 등록'}
              </h2>
              <p className="text-xs text-gray-500">당일 참여자에게 구두/화면으로 안내할 코드를 설정합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">워크숍 날짜 (필수)</label>
            <input
              type="date"
              required
              value={workshopDate}
              onChange={(e) => setWorkshopDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">적용 장소</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            >
              <option value="거제">거제</option>
              <option value="서울">서울</option>
              <option value="부산">부산</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              출석코드 (필수, 예: 맥스, 가드, 테크)
            </label>
            <input
              type="text"
              required
              value={attendanceCode}
              onChange={(e) => setAttendanceCode(e.target.value)}
              placeholder="예: 맥스"
              className="w-full px-3 py-2 text-base font-bold text-blue-700 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-gray-900">코드 활성화 상태</div>
              <div className="text-[11px] text-gray-500">비활성화 시 참여자가 출석체크할 수 없습니다.</div>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-900">출석 가능 시간 제한 (선택)</div>
                <div className="text-[11px] text-gray-500">지정된 시간 외 출석 시도 차단</div>
              </div>
              <input
                type="checkbox"
                checked={timeLimitEnabled}
                onChange={(e) => setTimeLimitEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {timeLimitEnabled && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">시작 시간</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">종료 시간</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
