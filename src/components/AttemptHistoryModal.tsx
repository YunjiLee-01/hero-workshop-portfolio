import React from 'react';
import { History, X } from 'lucide-react';
import { Participant } from '../types';

interface AttemptHistoryModalProps {
  participant: Participant | null;
  onClose: () => void;
}

export function AttemptHistoryModal({ participant, onClose }: AttemptHistoryModalProps) {
  if (!participant) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">전체 출석 시도 이력</h3>
              <p className="text-xs text-gray-500">
                사번 <span className="font-mono font-bold text-gray-800">{participant.employee_id}</span>
                {participant.employee_name && participant.employee_name !== '-' ? ` (${participant.employee_name})` : ''}
                님의 출석 시도 타임스탬프
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-xs border border-slate-100">
          <div>
            <span className="text-slate-400 block text-[10px]">워크숍 일자</span>
            <span className="font-bold text-slate-800">{participant.workshop_date}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">장소 / 반</span>
            <span className="font-bold text-slate-800">
              {participant.location} · {participant.class_name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">배정 조</span>
            <span className="font-bold text-blue-700">{participant.group_number}</span>
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          <div className="text-xs font-bold text-slate-700 flex items-center justify-between px-1">
            <span>시도 차수 및 타임스탬프</span>
            <span className="text-indigo-600 font-mono">
              총 {participant.attempt_logs?.length || participant.attempt_count || 1}건 기록
            </span>
          </div>

          {!participant.attempt_logs || participant.attempt_logs.length === 0 ? (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                  1
                </span>
                <span className="font-mono text-slate-800 font-medium">
                  {participant.attendance_time || '-'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                최초 출석
              </span>
            </div>
          ) : (
            participant.attempt_logs.map((log, idx) => (
              <div
                key={log.id || idx}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  idx === 0
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] ${
                      idx === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-mono font-bold text-slate-800">{log.timestamp}</div>
                    <div className="text-[10px] text-slate-400">
                      {idx === 0 ? '최초 출석 인증' : `${idx + 1}차 재접속/시도`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      log.method === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {log.method === 'admin' ? '관리자 수동' : 'QR 스캔'}
                  </span>
                  {idx === 0 && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      인증 완료
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
