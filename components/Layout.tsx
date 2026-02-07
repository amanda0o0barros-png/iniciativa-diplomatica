
import React, { useState } from 'react';
import { AppView, UserState } from '../types';
import ProgressionStats from './ProgressionStats';
import Avatar from './Avatar';
import { soundService } from '../services/soundService';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  setView: (view: AppView) => void;
  userState: UserState;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, userState, onLogout }) => {
  const [isMuted, setIsMuted] = useState(soundService.isMuted());

  const navItems = [
    { view: AppView.HOME, label: 'Início', emoji: '🏠' },
    { view: AppView.DASHBOARD, label: 'Painel', emoji: '📊' },
    { view: AppView.POMODORO, label: 'Foco', emoji: '⏱️' },
    { view: AppView.CORRECTION, label: 'Escrita', emoji: '✍️' },
  ];

  return (
    <div className="min-h-screen w-full flex justify-center selection:bg-brandPink selection:text-diplomatBlue">
      <div className="w-full max-w-[1440px] flex flex-col relative min-h-screen">
        <header className="py-6 px-4 md:px-8 sticky top-0 z-[60] flex items-center justify-between bg-transparent">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView(AppView.HOME)}>
            <div className="w-10 h-10 bg-diplomatBlue rounded-2xl flex items-center justify-center font-black text-brandPink shadow-lg group-hover:scale-110 transition-transform">🐾</div>
            <h1 className="text-xl font-black tracking-tighter uppercase text-diplomatBlue hidden sm:block">Iniciativa <span className="text-rose-400">Diplomática</span></h1>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <ProgressionStats userState={userState} />
            <button 
              onClick={() => {
                const newVal = !isMuted;
                soundService.setMuted(newVal);
                setIsMuted(newVal);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/50 backdrop-blur-xl border border-white/40 text-slate-400 hover:text-rose-400 transition-colors"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <div className="flex items-center gap-2">
              <div onClick={() => setView(AppView.HOME)} className="cursor-pointer hover:scale-105 transition-transform hidden xs:block">
                <Avatar level={userState.level} size="sm" />
              </div>
              <button 
                onClick={onLogout}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all text-xs"
                title="Trocar Credenciais"
              >
                🚪
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 pb-32 pt-4">
          {children}
        </main>

        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-4 md:px-6 py-4 bg-diplomatBlue/90 backdrop-blur-2xl rounded-full dock-shadow border border-white/10 flex items-center gap-1 md:gap-2">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view);
                soundService.playMeow();
              }}
              className={`flex items-center gap-2 px-4 md:px-5 py-3 rounded-full transition-all text-[10px] md:text-xs font-black uppercase tracking-widest ${
                currentView === item.view 
                  ? 'bg-rose-400 text-diplomatBlue shadow-lg scale-105 md:scale-110' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-sm md:text-base">{item.emoji}</span>
              {item.label && <span className={currentView === item.view ? 'block' : 'hidden md:hidden'}>{item.label}</span>}
              {item.label && <span className="hidden md:block">{item.label}</span>}
            </button>
          ))}
        </div>

        <footer className="py-12 text-center opacity-20">
          <div className="text-diplomatBlue font-black uppercase text-[9px] tracking-[0.5em]">
            DIPLOMATCAT • {userState.username.toUpperCase()} • THE DIPLOMATIC INITIATIVE 🐾
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
