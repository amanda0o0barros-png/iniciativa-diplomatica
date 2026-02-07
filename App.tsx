
import React, { useState, useCallback, useEffect } from 'react';
import { AppView, CorrectionResult, PracticeQuestion, UserState, TopicProgress, DossierHighlight } from './types';
import { correctEssay, generateQuestion, getWeeklyDiplomaticDossier } from './services/geminiService';
import { soundService } from './services/soundService';
import Layout from './components/Layout';
import Avatar from './components/Avatar';
import Dashboard from './components/Dashboard';
import PomodoroTimer from './components/PomodoroTimer';
import DeepFocus from './components/DeepFocus';
import ScheduleGenerator from './components/ScheduleGenerator';
import ChatMentor from './components/ChatMentor';
import PracticeArea from './components/PracticeArea';
import CorrectionResultView from './components/CorrectionResultView';
import AuthScreen from './components/AuthScreen';
import { SYLLABUS } from './syllabusData';

const USER_KEY_PREFIX = 'iniciativa_diplomat_user_';
const AUTH_KEY = 'iniciativa_diplomat_current_user';

const INITIAL_USER_STATE: UserState = {
  username: '',
  xp: 0,
  level: 1,
  submissionsCount: 0,
  unlockedRewardIds: [],
  editalProgress: {},
  studyCycle: [],
  currentCycleIndex: 0
};

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [lastResult, setLastResult] = useState<CorrectionResult | null>(null);
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [dossierHighlights, setDossierHighlights] = useState<DossierHighlight[]>([]);
  const [focusConfig, setFocusConfig] = useState<{mins: number, mode: 'work' | 'break'} | null>(null);

  // Handle Authentication and Data Loading
  useEffect(() => {
    const loggedUser = localStorage.getItem(AUTH_KEY);
    if (loggedUser) {
      handleLogin(loggedUser);
    }
  }, []);

  const handleLogin = (username: string) => {
    localStorage.setItem(AUTH_KEY, username);
    const savedData = localStorage.getItem(USER_KEY_PREFIX + username);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setUserState({ ...INITIAL_USER_STATE, ...parsed, username });
      } catch (e) {
        setUserState({ ...INITIAL_USER_STATE, username });
      }
    } else {
      setUserState({ ...INITIAL_USER_STATE, username });
    }
    setUser(username);
  };

  const handleSync = (newState: UserState) => {
    const username = newState.username;
    localStorage.setItem(AUTH_KEY, username);
    localStorage.setItem(USER_KEY_PREFIX + username, JSON.stringify(newState));
    setUserState(newState);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setUserState(INITIAL_USER_STATE);
  };

  // Auto-save progress
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY_PREFIX + user, JSON.stringify(userState));
    }
  }, [userState, user]);

  useEffect(() => {
    getWeeklyDiplomaticDossier().then(data => {
      setDossierHighlights(data.highlights);
    }).catch(() => {
      setDossierHighlights([
        { text: "Brasil reafirma protagonismo em temas ambientais no G20" },
        { text: "Itamaraty monitora desdobramentos de crises regionais" },
        { text: "Novos acordos de cooperação técnica com países africanos" }
      ]);
    });
  }, []);

  const addXp = useCallback((amount: number) => {
    if (amount <= 0) return;
    setUserState(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let nextLevelXp = newLevel * 200;
      let leveledUp = false;
      while (newXp >= nextLevelXp) {
        newXp -= nextLevelXp;
        newLevel += 1;
        nextLevelXp = newLevel * 200;
        leveledUp = true;
      }
      if (leveledUp) soundService.playLevelUp();
      return { ...prev, xp: newXp, level: newLevel };
    });
  }, []);

  const handleUpdateEdital = (id: string, progress: Partial<TopicProgress>, xp: number) => {
    setUserState(prev => ({
      ...prev,
      editalProgress: {
        ...prev.editalProgress,
        [id]: { ...(prev.editalProgress[id] || { theory: false, questionsCount: 0, accuracy: 0, flashcards: false, studyMinutes: 0 }), ...progress }
      }
    }));
    addXp(xp);
  };

  const handleStudyMinutes = (id: string, minutes: number) => {
    setUserState(prev => {
      const current = prev.editalProgress[id] || { theory: false, questionsCount: 0, accuracy: 0, flashcards: false, studyMinutes: 0 };
      return {
        ...prev,
        editalProgress: {
          ...prev.editalProgress,
          [id]: { 
            ...current, 
            studyMinutes: (current.studyMinutes || 0) + minutes,
            lastStudyDate: new Date().toISOString()
          }
        }
      };
    });
    addXp(Math.floor(minutes / 2));
  };

  const handleImportState = (newState: UserState) => {
    setUserState(newState);
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} onSync={handleSync} />;
  }

  const totalStudyMinutes = (Object.values(userState.editalProgress) as TopicProgress[]).reduce((acc, p) => acc + (p.studyMinutes || 0), 0);
  const totalHours = (totalStudyMinutes / 60).toFixed(1);
  const readTopicsCount = (Object.values(userState.editalProgress) as TopicProgress[]).filter(p => p.theory).length;
  const totalTopics = SYLLABUS.length;
  const coveragePercent = ((readTopicsCount / totalTopics) * 100).toFixed(0);

  const renderView = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[70vh] space-y-12">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-brandPink border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-4xl animate-float">🐈</div>
        </div>
        <div className="text-center">
          <h3 className="text-diplomatBlue font-bold uppercase text-xs tracking-[0.3em] mb-2">Processando Inteligência</h3>
          <p className="text-slate-400 text-sm">Aguarde um momento, Diplomata...</p>
        </div>
      </div>
    );

    switch(view) {
      case AppView.HOME: return (
        <div className="space-y-8 max-w-7xl mx-auto pb-32 animate-[fadeIn_0.5s_ease-out]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8 glass-card p-8 md:p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden group">
              <div className="relative shrink-0">
                <Avatar level={userState.level} size="lg" />
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left z-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.3em]">Operação Rio Branco Ativa</span>
                  <h2 className="text-4xl md:text-5xl font-black text-diplomatBlue tracking-tight leading-tight">Iniciativa <span className="text-rose-400">Diplomática</span></h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">{userState.username}</p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="bg-white/60 px-5 py-2 rounded-2xl border border-white/50 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Cobertura: <span className="text-diplomatBlue font-black">{coveragePercent}%</span></span>
                  </div>
                  <div className="bg-white/60 px-5 py-2 rounded-2xl border border-white/50 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">XP: <span className="text-diplomatBlue font-black">{userState.xp}</span></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 bg-diplomatBlue rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6 shadow-xl relative overflow-hidden group">
               <div className="space-y-1">
                  <span className="text-6xl font-black text-white tracking-tighter">{totalHours}</span>
                  <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Horas de Estudo</p>
               </div>
               <button onClick={() => setView(AppView.POMODORO)} className="w-full bg-rose-400 text-diplomatBlue py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-rose-300 transition-all">
                 Entrar em Foco ⏱️
               </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 sticker-card bg-white p-8 md:p-10 rounded-[2.5rem] flex flex-col gap-8 shadow-sm relative overflow-hidden min-h-[500px]">
               <div className="flex items-center gap-3 relative z-10">
                 <div className="w-10 h-10 bg-slate-800 text-brandPink rounded-xl flex items-center justify-center text-xl shadow-md">📂</div>
                 <div>
                   <h3 className="text-xl font-black text-diplomatBlue uppercase tracking-tight">Agenda Diária</h3>
                 </div>
               </div>
               <div className="space-y-3 relative z-10 flex-1">
                 {SYLLABUS.slice(0, 3).map((m, idx) => (
                   <div key={idx} onClick={() => setView(AppView.DASHBOARD)} className="group/card bg-slate-50 hover:bg-white p-5 rounded-3xl border border-slate-100 transition-all cursor-pointer flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg">{idx + 1}</div>
                     <div className="flex-1 overflow-hidden">
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">{m.subject}</span>
                        <h4 className="text-sm font-bold text-diplomatBlue truncate">{m.subtopic}</h4>
                     </div>
                   </div>
                 ))}
               </div>
               <button onClick={() => setView(AppView.DASHBOARD)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">Ver Painel</button>
            </div>
            <div className="md:col-span-5 flex flex-col gap-6">
               <div className="flex-1 sticker-card bg-brandGold p-8 rounded-[2.5rem] relative overflow-hidden border border-orange-200/50">
                  <div className="space-y-4 relative z-10">
                    <h3 className="text-xl font-black text-orange-950 uppercase tracking-tight leading-none">Manchetes PEB</h3>
                    <div className="space-y-2">
                       {dossierHighlights.slice(0, 2).map((h, i) => (
                         <div key={i} className="bg-white/30 p-4 rounded-2xl border border-orange-900/5 text-xs font-bold text-orange-950 leading-tight">
                            <span className="line-clamp-2">{h.text}</span>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
               <div onClick={() => setView(AppView.CORRECTION)} className="flex-1 sticker-card bg-white p-8 rounded-[2.5rem] cursor-pointer relative overflow-hidden group border-2 border-dashed border-teal-200 hover:border-teal-400 shadow-sm">
                  <div className="space-y-3">
                    <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[8px] font-bold uppercase tracking-widest">Fase Escrita</span>
                    <h3 className="text-xl font-black text-diplomatBlue uppercase tracking-tight">Laboratório de Discursivas</h3>
                    <p className="text-slate-400 text-[10px] font-bold leading-relaxed">Corretor oficial padrão Rio Branco.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      );
      case AppView.CORRECTION: return <PracticeArea onStart={(s, isManual, manualData) => {
        if (isManual && manualData) {
          setCurrentQuestion(manualData);
          setView(AppView.PRACTICE);
        } else {
          setIsLoading(true);
          generateQuestion(s).then(q => { setCurrentQuestion(q); setView(AppView.PRACTICE); }).finally(() => setIsLoading(false));
        }
      }} />;
      case AppView.PRACTICE: return <PracticeArea question={currentQuestion} onSubmit={(e) => {
        setIsLoading(true);
        correctEssay(currentQuestion!.subject, currentQuestion!.command, e).then(r => { 
          setLastResult(r); 
          addXp(100); 
          setView(AppView.RESULT); 
        }).finally(() => setIsLoading(false));
      }} />;
      case AppView.RESULT: return <CorrectionResultView result={lastResult!} onReset={() => setView(AppView.HOME)} />;
      case AppView.DASHBOARD: return <Dashboard userState={userState} setView={setView} onUpdateEdital={handleUpdateEdital} onImportState={handleImportState} />;
      case AppView.POMODORO: return (
        <PomodoroTimer 
          onStudyComplete={handleStudyMinutes} 
          onDeepFocus={(mins, mode) => {
            setFocusConfig({ mins, mode });
            setView(AppView.DEEP_FOCUS);
          }}
        />
      );
      case AppView.DEEP_FOCUS: return (
        <DeepFocus 
          initialMinutes={focusConfig?.mins || 25} 
          mode={focusConfig?.mode || 'work'}
          onExit={() => setView(AppView.POMODORO)}
          onComplete={() => {
            soundService.playTimerEnd();
            setView(AppView.POMODORO);
          }}
        />
      );
      default: return <div onClick={() => setView(AppView.HOME)}>Página não encontrada.</div>;
    }
  };

  return (
    <Layout currentView={view} setView={setView} userState={userState} onLogout={handleLogout}>
      {renderView()}
    </Layout>
  );
}
