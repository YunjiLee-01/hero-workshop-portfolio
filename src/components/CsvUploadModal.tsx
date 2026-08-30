import React, { useState } from 'react';
import { Download, FileSpreadsheet, AlertCircle, CheckCircle2, RefreshCw, Upload, X } from 'lucide-react';

const SAMPLE_CSV = `위치,차수,일자,사번,반,조
서울,1,2026-08-26,20262001,1반,2조
거제,1,2026-08-26,20251088,1반,3조
거제,1,2026-08-26,1004755,2반,1조
부산,1,2026-08-27,1012272,1반,3조
서울,2,2026-08-28,20251090,1반,4조
거제,2,2026-08-29,1014432,3반,1조
서울,1,2026-08-26,1006655,2반,4조`;

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminToken: string;
}

export function CsvUploadModal({ isOpen, onClose, onSuccess, adminToken }: CsvUploadModalProps) {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (!buffer) return;

      let decoded = new TextDecoder('utf-8').decode(buffer);
      if (decoded.includes('')) {
        try {
          const eucKr = new TextDecoder('euc-kr').decode(buffer);
          if (!eucKr.includes('')) {
            decoded = eucKr;
          }
        } catch {
          // ignore
        }
      }
      setCsvContent(decoded || '');
      setErrors([]);
      setErrorMessage('');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participants_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = () => {
    setCsvContent(SAMPLE_CSV);
    setFileName('샘플_템플릿.csv');
    setErrors([]);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      setErrorMessage('CSV 데이터를 입력하거나 파일을 업로드해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/participants/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          csv_content: csvContent,
          mode: mode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          setErrors(data.errors);
        } else {
          setErrorMessage(data.message || '업로드 검증에 실패했습니다.');
        }
        return;
      }

      setSuccessMessage(data.message || '참가자 데이터가 성공적으로 등록되었습니다.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch {
      setErrorMessage('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">참가자 명단 CSV 일괄 업로드</h2>
              <p className="text-xs text-gray-500">
                사전 배정된 참가자 명단을 일괄 등록 및 업데이트합니다. (이름 불필요)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                <span>권장 형식: </span>
                <span className="font-mono bg-blue-100/80 px-2 py-0.5 rounded text-blue-900 border border-blue-200">
                  위치,차수,일자,사번,반,조
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-2.5 py-1 rounded bg-white hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 flex items-center gap-1 shadow-2xs cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  샘플 CSV 다운로드
                </button>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 cursor-pointer text-xs"
                >
                  샘플 불러오기
                </button>
              </div>
            </div>
            <div className="text-[11px] text-blue-800 space-y-0.5">
              <p>
                • <b>[위치 | 차수 | 일자 | 사번 | 반 | 조]</b> 6개 열 구조만으로 즉시 처리됩니다.
              </p>
              <p>• 이름(성명) 컬럼은 필요하지 않으며 완전히 생략할 수 있습니다.</p>
              <p>• 엑셀 상단 제목/빈 행(`AX 워크숍 html 반영용` 등)이 있어도 자동으로 헤더를 찾아 정상 처리합니다.</p>
              <p>• 한국어 엑셀(EUC-KR/CP949) 및 UTF-8 인코딩을 자동 감지하여 한글 깨짐을 방지합니다.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase">반영 방식 선택</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  mode === 'replace'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="uploadMode"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900">기존 명단 비우고 이번 CSV만 반영 (권장)</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    기존 테스트 및 이전 명단을 초기화하고 업로드한 파일 명단만 등록합니다. (사번 중복 허용)
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  mode === 'append'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="uploadMode"
                  checked={mode === 'append'}
                  onChange={() => setMode('append')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900">기존 명단 유지하며 추가 등록</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    현재 등록된 참가자 명단을 유지한 채 이번 CSV 데이터를 덧붙여 등록합니다.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">CSV 파일 업로드</label>
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1 bg-slate-50 hover:bg-blue-50/40 transition-colors cursor-pointer">
              <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
              <FileSpreadsheet className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">
                {fileName || '클릭하여 CSV 파일 선택 (드래그 앤 드롭 가능)'}
              </span>
              <span className="text-[11px] text-slate-400">또는 아래 입력창에 직접 붙여넣기</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              CSV 내용 미리보기 / 직접 편집
            </label>
            <textarea
              rows={7}
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                if (errorMessage) setErrorMessage('');
                if (errors.length > 0) setErrors([]);
              }}
              placeholder={`위치,차수,일자,사번,반,조\n서울,1,2026-08-26,20262001,1반,2조\n거제,1,2026-08-26,20251088,1반,3조`}
              className="w-full p-3 font-mono text-xs text-gray-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>업로드 데이터 검증 오류 ({errors.length}건)</span>
              </div>
              <p className="text-[11px] text-red-600">오류가 있는 행을 수정한 후 다시 업로드해주세요.</p>
              <div className="max-h-36 overflow-y-auto space-y-1 mt-1 text-xs text-red-700 font-mono bg-white p-2 rounded border border-red-200">
                {errors.map((err, idx) => (
                  <div key={idx} className="border-b border-red-100 last:border-0 pb-0.5">
                    • {err}
                  </div>
                ))}
              </div>
            </div>
          )}

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
              disabled={isSubmitting || !csvContent.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  검증 및 등록 중...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  명단 일괄 등록
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
