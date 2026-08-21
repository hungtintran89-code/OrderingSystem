import React from 'react';
import { useServiceRequests } from '../../context/ServiceRequestContext';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

export const UndoSnackbar: React.FC = () => {
  const { lastConfirmedRequest, undoTimerSeconds, handleUndoRequest } = useServiceRequests();

  if (!lastConfirmedRequest || undoTimerSeconds <= 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up font-sans select-none">
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 min-w-[280px]">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />

        <div className="flex-1 text-xs font-medium">
          <span>Đã hoàn tất </span>
          <span className="font-extrabold text-amber-400">
            {lastConfirmedRequest.tableName || `Bàn ${lastConfirmedRequest.tableId}`}
          </span>
          <span className="text-slate-400 ml-1">({undoTimerSeconds}s)</span>
        </div>

        {/* 1-Tap Undo Button */}
        <button
          onClick={handleUndoRequest}
          className="px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          title="Khôi phục lại yêu cầu bị bấm nhầm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Hoàn tác ↩</span>
        </button>
      </div>
    </div>
  );
};
