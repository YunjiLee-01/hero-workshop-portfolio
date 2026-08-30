import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, Save, AlertCircle, X } from 'lucide-react';
import { Participant } from '../types';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminToken: string;
  editParticipant: Participant | null;
  availableRounds?: string[];
}

export function ParticipantModal({
  isOpen,
  onClose,
  onSuccess,
  adminToken,
  editParticipant,
  availableRounds,
}: ParticipantModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [round, setRound] = useState('1');
  const [workshopDate, setWorkshopDate] = useState('');
  const [location, setLocation] = useState('서울');
  const [className, setClassName] = useState('1반');
  const [groupNumber, setGroupNumber] = useState('1조');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editParticipant) {
      setEmployeeId(editParticipant.employee_id);
      setRound(
        editParticipant.round
          ? editParticipant.round.replace(/[^0-9]/g, '') || editParticipant.round
          : '1'
      );
      setWorkshopDate(editParticipant.workshop_date);
      setLocation(editParticipant.location || '서울');
      setClassName(editParticipant.class_name);
      setGroupNumber(editParticipant.group_number);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setEmployeeId('');
      setRound('1');
      setWorkshopDate(today);
      setLocation('서울');
      setClassName('1반');
      setGroupNumber('1조');
    }
    setErrorMessage('');
  }, [editParticipant, isOpen]);

  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    setClassName('1반');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim() || !workshopDate.trim()) {
      setErrorMessage('사번과 워크숍 일자는 필수 입력 항목입니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const isEdit = !!editParticipant;
      const url = isEdit
        ? `/api/admin/participants/${editParticipant.id}`
        : '/api/admin/participants';

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          employee_id: employeeId.trim(),
          employee_name: '',
          round: round.trim() || '1',
          workshop_date: workshopDate.trim(),
          workshop_start_time: '09:00',
          workshop_end_time: '17:00',
          location: location,
          class_name: className,
          group_number: groupNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || '저장에 실패했습니다.');
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
              {editParticipant ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {editParticipant ? '참가자 정보 수정' : '신규 참가자 개별 등록'}
              </h2>
              <p className="text-xs text-gray-500">배정된 참가자의 사번 및 워크숍 정보를 입력합니다.</p>
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
            <label className="block text-xs font-bold text-gray-700 mb-1">사번 (필수)</label>
            <input
              type="text"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="예: 20262001"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">차수</label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
              >
                {(availableRounds && availableRounds.length > 0
                  ? availableRounds
                  : ['1차', '2차', '3차', '4차', '5차', '6차', '7차', '8차', '9차', '10차']
                ).map((r) => {
                  const val = r.replace(/[^0-9]/g, '') || r;
                  return (
                    <option key={r} value={val}>
                      {r.endsWith('차') ? r : `${r}차`}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">워크숍 일자 (필수)</label>
              <input
                type="date"
                required
                value={workshopDate}
                onChange={(e) => setWorkshopDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
              >
              </input>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">장소/위치</label>
              <select
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
              >
                <option value="거제">거제</option>
                <option value="서울">서울</option>
                <option value="부산">부산</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">반</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
              >
                {location === '거제' ? (
                  <>
                    <option value="1반">1반</option>
                    <option value="2반">2반</option>
                    <option value="3반">3반</option>
                  </>
                ) : (
                  <>
                    <option value="1반">1반</option>
                    <option value="단일반">단일반</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">조</label>
              <select
                value={groupNumber}
                onChange={(e) => setGroupNumber(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
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
