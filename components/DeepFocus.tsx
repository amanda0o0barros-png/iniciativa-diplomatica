
import React, { useState, useEffect, useRef } from 'react';
import { soundService } from '../services/soundService';

interface DeepFocusProps {
  initialMinutes: number;
  mode: 'work' | 'break';
  onExit: () => void;
  onComplete: () => void;
}

const DeepFocus: React.FC<DeepFocusProps> = ({ initialMinutes, mode, onExit, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = initialMinutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      onComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-softBg animate-[fadeIn_0.5s_ease-out]">
      <div className="absolute inset-0 bg-gradient-to-b from-brandPink/5 to-brandTeal/10 pointer-events-none"></div>
      
      {/* Mentor Cat flutuante */}
      <div className="mb-8 md:mb-12 relative">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full shadow-2xl flex items-center justify-center text-5xl md:text-6xl animate-float">
          {mode === 'work' ? '🧘' : '💤'}
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-sm border border-slate-100 whitespace-nowrap">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {mode === 'work' ? 'Silêncio... Diplomata em Missão' : 'Pausa para o Ronrom'}
          </span>
        </div>
      </div>

      {/* Timer Circular Gigante e Fofo */}
      <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx="50%" cy="50%" r="45%" 
            stroke="white" strokeWidth="8" fill="transparent"
            className="shadow-inner"
          />
          <circle 
            cx="50%" cy="50%" r="45%" 
            stroke="currentColor" strokeWidth="12" fill="transparent"
            strokeDasharray="283%"
            strokeDashoffset={`${283 - (283 * progress) / 100}%`}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${mode === 'work' ? 'text-brandPink' : 'text-brandTeal'}`}
          />
        </svg>
        
        <div className="flex flex-col items-center z-10 space-y-1">
          <span className="text-6xl md:text-7xl font-black tracking-tighter text-diplomatBlue tabular-nums">
            {formatTime(timeLeft)}
          </span>
          <button 
            onClick={() => setIsActive(!isActive)}
            className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-diplomatBlue transition-colors"
          >
            {isActive ? 'Pausar' : 'Retomar'}
          </button>
        </div>
      </div>

      {/* Frase Motivacional Soft */}
      <p className="mt-12 md:mt-16 text-slate-400 font-medium italic text-xs md:text-sm animate-pulse px-6 text-center">
        {mode === 'work' ? 'Foque no seu propósito, o Itamaraty te espera.' : 'Descanse a mente, a jornada é longa.'}
      </p>

      {/* Botão de Saída Discreto */}
      <button 
        onClick={onExit}
        className="mt-8 md:mt-12 px-8 py-3 rounded-full border border-slate-200 text-slate-300 hover:text-rose-400 hover:border-rose-200 transition-all text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em]"
      >
        Encerrar Foco Total
      </button>
    </div>
  );
};

export default DeepFocus;
