import React from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  return (
    <div
      id="app-toast"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#141414] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
        type === 'success' ? 'bg-[#ffd129]/20 text-[#ffd129] border border-[#ffd129]/40' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      }`}>
        <i className={type === 'success' ? 'fa-solid fa-check' : 'fa-solid fa-circle-info'}></i>
      </div>
      <p className="text-xs md:text-sm font-medium pr-2 text-stone-200">{message}</p>
      <button
        id="toast-close-btn"
        onClick={onClose}
        className="text-stone-400 hover:text-white transition p-1 text-sm ml-auto"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};
