import { AlertTriangle, X } from 'lucide-react';

interface SummaryItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  summaryItems?: SummaryItem[];
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  summaryItems = [],
  confirmText = 'Konfirmasi & Simpan',
  cancelText = 'Batal',
  isDanger = false,
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="confirmation-modal-card"
        className="w-full max-w-md bg-white border-2 border-slate-900 shadow-[5px_5px_0px_#0f172a] rounded-xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-900 bg-slate-100">
          <div className="flex items-center gap-2.5">
            {isDanger ? (
              <div className="p-1.5 bg-rose-100 border border-rose-900 rounded-md">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
            ) : (
              <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md">
                <AlertTriangle className="w-5 h-5 text-blue-700" />
              </div>
            )}
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          </div>
          <button
            id="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {description && <p className="text-sm text-slate-700 leading-relaxed">{description}</p>}

          {summaryItems.length > 0 && (
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ringkasan Perubahan</p>
              <div className="space-y-1.5 text-sm">
                {summaryItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-0.5 border-b border-slate-200 last:border-0">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className={`font-bold ${item.highlight ? 'text-blue-700' : 'text-slate-900'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t-2 border-slate-900 bg-slate-50">
          <button
            id="modal-cancel-btn"
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-slate-800 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg hover:bg-slate-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            id="modal-confirm-btn"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-bold text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center gap-2 ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
