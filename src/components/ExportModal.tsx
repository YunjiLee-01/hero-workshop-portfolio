import React from 'react';
import { Download, FileText, Layers, X } from 'lucide-react';
import { Participant } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
}

export function ExportModal({ isOpen, onClose, participants }: ExportModalProps) {
  if (!isOpen) return null;

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportBasic = () => {
    const checkedInList = participants.filter((p) => p.is_checked_in);
    let csv = '사번,출석시간\n';
    checkedInList.forEach((p) => {
      csv += `${p.employee_id},${p.attendance_time || ''}\n`;
    });
    downloadCSV(csv, 'AX_출석결과_사번_출석시간.csv');
  };

  const handleExportDetailed = () => {
    let csv = '사번,이름,장소,차수,일자,반,조,출석여부,출석시간,출석방식\n';
    participants.forEach((p) => {
      const name = p.employee_name && p.employee_name !== '-' ? p.employee_name : '';
      const round = p.round ? (p.round.endsWith('차') ? p.round : `${p.round}차`) : '1차';
      const status = p.is_checked_in ? '출석' : '미출석';
      const time = p.attendance_time || '';
      const method = p.is_checked_in ? (p.attendance_method === 'admin' ? '수동' : 'QR') : '';
      csv += `"${p.employee_id}","${name}","${p.location}","${round}","${p.workshop_date}","${p.class_name}","${p.group_number}","${status}","${time}","${method}"\n`;
    });
    downloadCSV(csv, 'AX_출석_상세명단.csv');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">출석 데이터 다운로드</h3>
              <p className="text-xs text-gray-500">
                다운로드할 형식을 선택해주세요. 현재 설정된 검색/필터 조건이 반영됩니다.
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

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleExportBasic}
            className="w-full p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all flex items-start gap-3 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-700 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">기본 출석 결과 (사번 + 출석시간)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">필수 저장 컬럼만 포함 (출석 완료 인원 대상)</div>
              <div className="text-[10px] font-mono text-blue-600 mt-1 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                사번, 출석시간
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportDetailed}
            className="w-full p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all flex items-start gap-3 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-700 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">상세 출석 결과 (전체 참가자 포함)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">이름, 장소, 반, 조, 출석여부, 출석시간, 출석방식 포함</div>
              <div className="text-[10px] font-mono text-slate-600 mt-1 bg-slate-200/60 px-1.5 py-0.5 rounded inline-block">
                전체 참가자 관리용 통합 데이터
              </div>
            </div>
          </button>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
