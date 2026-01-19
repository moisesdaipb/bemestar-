import React from 'react';
import { Screen, Program } from '../types';
import { getProgramById } from '../storageService';

interface ConfirmationProps {
    programId?: string;
    onHome: () => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ programId, onHome }) => {
    const program = programId ? getProgramById(programId) : null;
    const cor = program?.cor || '#16a34a';

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 bg-background-light dark:bg-background-dark">
            <div
                className="size-24 rounded-full flex items-center justify-center mb-6 animate-bounce-in"
                style={{ backgroundColor: `${cor}20` }}
            >
                <span className="material-symbols-outlined text-5xl" style={{ color: cor }}>check_circle</span>
            </div>

            <h1 className="text-2xl font-bold text-[#131616] dark:text-white text-center">
                Agendamento Confirmado!
            </h1>

            <p className="text-text-muted text-center mt-3 max-w-[280px]">
                Seu agendamento foi realizado com sucesso. Você pode consultar seus agendamentos a qualquer momento.
            </p>

            <div className="w-full mt-8 space-y-3">
                <button
                    onClick={onHome}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: cor }}
                >
                    Voltar ao Início
                </button>
            </div>

            <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
        </div>
    );
};

export default Confirmation;
