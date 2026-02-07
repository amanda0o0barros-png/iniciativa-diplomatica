
import React, { useState } from 'react';
import { soundService } from '../services/soundService';
import { UserState } from '../types';

interface AuthScreenProps {
  onLogin: (username: string) => void;
  onSync: (state: UserState) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSync }) => {
  const [username, setUsername] = useState('');
  const [isSyncMode, setIsSyncMode] = useState(false);
  const [syncCode, setSyncCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length >= 3) {
      soundService.playSuccess();
      onLogin(username.trim());
    }
  };

  const handleSyncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const decoded = atob(syncCode);
      const parsed = JSON.parse(decoded) as UserState;
      if (parsed.username && parsed.level) {
        soundService.playLevelUp();
        onSync(parsed);
      } else {
        throw new Error();
      }
    } catch (err) {
      alert("⚠️ Cifra inválida! Verifique se copiou o código Telex corretamente.");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-diplomatBlue flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brandGold rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brandPink rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full glass-card p-12 rounded-[4rem] border-white/10 shadow-2xl space-y-10 relative z-10 animate-[scaleIn_0.5s_ease-out]">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-brandGold mx-auto rounded-full flex items-center justify-center text-5xl shadow-lg animate-float">🛡️</div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em]">
              {isSyncMode ? 'Sincronizar Telex' : 'Credenciais Diplomáticas'}
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">
              {isSyncMode ? 'Restaurar Dossiê de outro dispositivo' : 'Acesse seu Dossiê de Aprovação'}
            </p>
          </div>
        </div>

        {!isSyncMode ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-brandPink tracking-widest ml-4">Nome de Guerra</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Candidato_RioBranco"
                className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-white font-bold focus:ring-2 focus:ring-brandPink outline-none transition-all placeholder:text-white/10"
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <button 
                type="submit"
                disabled={username.trim().length < 3}
                className="w-full py-6 bg-brandGold text-orange-900 rounded-3xl font-black uppercase text-xs tracking-[0.5em] shadow-xl hover:bg-white transition-all disabled:opacity-30 active:scale-95"
              >
                Assumir Posto 🐾
              </button>
              <button 
                type="button"
                onClick={() => setIsSyncMode(true)}
                className="w-full py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-brandPink transition-colors"
              >
                Tenho um Código de Sincronização
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSyncSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-brandTeal tracking-widest ml-4">Cifra Telex</label>
              <textarea 
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                placeholder="Cole o código gerado no outro dispositivo aqui..."
                className="w-full h-32 bg-white/5 border border-white/10 p-4 rounded-3xl text-white font-mono text-xs focus:ring-2 focus:ring-brandTeal outline-none transition-all placeholder:text-white/10 resize-none"
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <button 
                type="submit"
                disabled={!syncCode}
                className="w-full py-6 bg-brandTeal text-teal-900 rounded-3xl font-black uppercase text-xs tracking-[0.5em] shadow-xl hover:bg-white transition-all disabled:opacity-30 active:scale-95"
              >
                Restaurar Posto 📡
              </button>
              <button 
                type="button"
                onClick={() => setIsSyncMode(false)}
                className="w-full py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
              >
                Voltar para Login Normal
              </button>
            </div>
          </form>
        )}

        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
            Seus dados são locais e privados. <br/> Use o Telex para portabilidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
