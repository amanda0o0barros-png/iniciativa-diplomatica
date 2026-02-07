
import React, { useState, useEffect, useRef } from 'react';
import { SYLLABUS } from '../syllabusData';
import { soundService } from '../services/soundService';

interface PomodoroTimerProps {
  onStudyComplete: (topicId: string, minutes: number) => void;
  onDeepFocus?: (minutes: number, mode: 'work' | 'break') => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onStudyComplete, onDeepFocus }) => {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [lastCompletedMinutes, setLastCompletedMinutes] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = mode === 'work' ? workMinutes * 60 : breakMinutes * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerEnd();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerEnd = () => {
    setIsActive(false);
    soundService.playTimerEnd();
    
    if (mode === 'work') {
      setLastCompletedMinutes(workMinutes);
      setShowFinishedModal(true);
      soundService.playPurr();
      setMode('break');
      setTimeLeft(breakMinutes * 60);
    } else {
      setMode('work');
      setTimeLeft(workMinutes * 60);
      soundService.playMeow();
    }
  };

  const toggleTimer = () => {
    if (mode === 'work' && !selectedTopicId) {
      alert("🐾 Miau! Selecione um tópico do edital primeiro para registrar suas patinhas!");
      return;
    }
    const newIsActive = !isActive;
    if (newIsActive) soundService.playMeow();
    setIsActive(newIsActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? workMinutes * 60 : breakMinutes * 60);
  };

  const adjustTime = (type: 'work' | 'break', amount: number) => {
    if (isActive) return;
    if (type === 'work') {
      const newVal = Math.max(1, workMinutes + amount);
      setWorkMinutes(newVal);
      if (mode === 'work') setTimeLeft(newVal * 60);
    } else {
      const newVal = Math.max(1, breakMinutes + amount);
      setBreakMinutes(newVal);
      if (mode === 'break') setTimeLeft(newVal * 60);
    }
  };

  const handleConfirmStudy = () => {
    if (selectedTopicId) {
      onStudyComplete(selectedTopicId, lastCompletedMinutes);
      setShowFinishedModal(false);
      soundService.playSuccess();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-[fadeIn_0.5s_ease-out]">
      <div className="bg-white p-10 rounded-4xl border-2 border-brandPink/20 text-center relative overflow-hidden shadow-sm">
        <h2 className="text-4xl font-extrabold tracking-tighter text-diplomatBlue uppercase italic">Cronômetro do Barão ⏱️</h2>
        <p className="text-slate-400 font-medium text-sm mt-2">Gestão de tempo padrão Rio Branco</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-6">
          <div className="soft-card p-6 rounded-3xl bg-white border-2 border-slate-50 space-y-6">
            <h3 className="text-[10px] font-black uppercase text-rose-400 tracking-[0.2em]">Configurações</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Estudo (min)</span>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl">
                  <button onClick={() => adjustTime('work', -5)} className="w-8 h-8 rounded-xl bg-white shadow-sm font-black text-slate-400 hover:text-brandPink">-</button>
                  <span className="font-black text-slate-700">{workMinutes}</span>
                  <button onClick={() => adjustTime('work', 5)} className="w-8 h-8 rounded-xl bg-white shadow-sm font-black text-slate-400 hover:text-brandPink">+</button>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              if (selectedTopicId) {
                onDeepFocus?.(workMinutes, mode);
              } else {
                alert("Selecione um tópico primeiro!");
              }
            }}
            className="w-full py-6 bg-brandPink/30 text-rose-600 rounded-3xl text-[9px] font-black uppercase tracking-[0.4em] shadow-lg hover:bg-brandPink/50 transition-all"
          >
            ✨ Foco Total ✨
          </button>
        </div>

        <div className="lg:col-span-2 soft-card p-10 rounded-4xl bg-white flex flex-col items-center gap-8 shadow-xl border-2 border-brandPink/10">
          <div className="w-full space-y-2 text-center">
            <label className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Tópico em Missão</label>
            <select 
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              disabled={isActive}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-3xl font-bold text-slate-600 focus:ring-2 focus:ring-brandPink outline-none disabled:opacity-80 appearance-none shadow-inner cursor-pointer text-center"
            >
              <option value="">Selecione o ponto do edital...</option>
              {SYLLABUS.map(item => (
                <option key={item.id} value={item.id}>{item.subject} - {item.subtopic}</option>
              ))}
            </select>
          </div>

          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50"/>
              <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="283%" strokeDashoffset={`${283 - (283 * progress) / 100}%`} className={`transition-all duration-1000 ease-linear ${mode === 'work' ? 'text-brandPink' : 'text-brandTeal'}`}/>
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className="text-6xl font-black text-slate-800 tabular-nums">{formatTime(timeLeft)}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">{mode === 'work' ? 'Estudo' : 'Pausa'}</span>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button onClick={toggleTimer} className={`flex-1 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg ${isActive ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-brandPink'}`}>
              {isActive ? 'Pausar' : 'Iniciar'}
            </button>
            <button onClick={resetTimer} className="px-8 py-6 rounded-3xl border-2 border-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">Reset</button>
          </div>
        </div>
      </div>

      {showFinishedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white p-12 rounded-4xl max-w-md w-full text-center space-y-8 shadow-2xl animate-[scaleIn_0.3s_ease-out]">
            <div className="w-32 h-32 mx-auto bg-slate-50 rounded-full flex items-center justify-center text-6xl shadow-xl">🏆</div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase italic">Missão Cumprida!</h3>
              <p className="text-slate-400 text-sm">Completados {lastCompletedMinutes} minutos focados.</p>
            </div>
            <button onClick={handleConfirmStudy} className="w-full bg-slate-800 text-brandPink py-5 rounded-3xl font-black uppercase text-xs shadow-lg">Registrar Progresso 🐾</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
