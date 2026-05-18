import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Type } from 'lucide-react';
import { useDesignerStore } from './store';

export function GlobalModal() {
  const modal = useDesignerStore((state) => state.modal);
  const closeModal = useDesignerStore((state) => state.closeModal);
  const [inputValue, setInputValue] = useState('');

  // Reset input when modal opens
  useEffect(() => {
    if (modal.isOpen) {
      setInputValue((modal as any).defaultValue || '');
    }
  }, [modal.isOpen]);

  if (!modal.isOpen) return null;

  const hasInput = (modal as any).hasInput;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 transition-opacity animate-in fade-in duration-300"
        onClick={closeModal}
      />
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
            hasInput ? 'bg-blue-50 text-blue-500' :
            modal.type === 'confirm' ? 'bg-amber-50 text-amber-500' :
            modal.type === 'error' ? 'bg-red-50 text-red-500' :
            'bg-green-50 text-green-500'
          }`}>
            {hasInput ? <Type size={32} /> :
              modal.type === 'confirm' ? <AlertCircle size={32} /> :
              modal.type === 'error' ? <AlertCircle size={32} /> :
              <CheckCircle2 size={32} />
            }
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-2">{modal.title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-5">
            {modal.message}
          </p>

          {hasInput && (
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (modal as any).onConfirmWithValue?.(inputValue);
                  closeModal();
                }
                if (e.key === 'Escape') closeModal();
              }}
              placeholder={(modal as any).placeholder || ''}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-5 text-center font-bold"
            />
          )}

          <div className="flex flex-col w-full gap-3">
            {hasInput ? (
              <>
                <button
                  onClick={() => {
                    (modal as any).onConfirmWithValue?.(inputValue);
                    closeModal();
                  }}
                  className="w-full py-3.5 bg-gray-900 text-white text-sm font-black rounded-2xl hover:bg-gray-800 transition-all active:scale-95"
                >
                  Confirm
                </button>
                <button
                  onClick={closeModal}
                  className="w-full py-3.5 bg-gray-100 text-gray-600 text-sm font-black rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </>
            ) : modal.type === 'confirm' ? (
              <>
                <button
                  onClick={() => {
                    const previousModal = modal;
                    modal.onConfirm?.();
                    if (useDesignerStore.getState().modal.message === previousModal.message) {
                      closeModal();
                    }
                  }}
                  className="w-full py-3.5 bg-gray-900 text-white text-sm font-black rounded-2xl hover:bg-gray-800 transition-all active:scale-95"
                >
                  Yes, Proceed
                </button>
                <button
                  onClick={closeModal}
                  className="w-full py-3.5 bg-gray-100 text-gray-600 text-sm font-black rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={closeModal}
                className="w-full py-3.5 bg-green-500 text-white text-sm font-black rounded-2xl hover:bg-green-600 transition-all active:scale-95 shadow-md shadow-green-200"
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
