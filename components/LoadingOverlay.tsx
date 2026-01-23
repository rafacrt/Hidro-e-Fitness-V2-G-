import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message = 'Importando arquivos, por favor aguarde...' }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary-200 rounded-full animate-ping opacity-25"></div>
                    <div className="relative bg-primary-50 p-4 rounded-full">
                        <Loader2 size={48} className="text-primary-600 animate-spin" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">Processando</h3>
                    <p className="text-slate-500 font-medium">{message}</p>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-primary-500 rounded-full animate-progress w-full origin-left"></div>
                </div>
            </div>
            <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.5); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 2s infinite linear;
        }
      `}</style>
        </div>
    );
};
