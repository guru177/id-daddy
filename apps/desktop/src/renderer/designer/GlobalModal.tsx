import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDesignerStore } from './store';

export function GlobalModal() {
  const modal = useDesignerStore((state) => state.modal);
  const closeModal = useDesignerStore((state) => state.closeModal);

  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={closeModal}
      />
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${modal.type === 'confirm' ? 'bg-amber-50 text-amber-500' :
              modal.type === 'error' ? 'bg-red-50 text-red-500' :
                'bg-green-50 text-green-500'
            }`}>
            {modal.type === 'confirm' ? <AlertCircle size={32} /> :
              modal.type === 'error' ? <AlertCircle size={32} /> :
                <CheckCircle2 size={32} />}
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-2">{modal.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {modal.message}
          </p>

          <div className="flex flex-col w-full gap-3">
            {modal.type === 'confirm' ? (
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
                className="w-full py-3.5 bg-green-500 text-white text-sm font-black rounded-2xl hover:bg-green-600 transition-all active:scale-95 shadow-lg shadow-green-200"
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
