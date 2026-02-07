
import React, { useState, useRef } from 'react';
import { UserState, AppView, SyllabusItem, TopicProgress } from '../types';
import { SYLLABUS, SUBJECTS } from '../syllabusData';
import Avatar from './Avatar';
import { getDiplomatRank } from '../constants';
import { explainSubject } from '../services/geminiService';
import { soundService } from '../services/soundService';

interface DashboardProps {
  userState: UserState;
  setView: (v: AppView) => void;
  onUpdateEdital: (topicId: string, progress: Partial<TopicProgress>, xpGain: number) => void;
  onImportState?: (newState: UserState) => void;
  compact?: boolean;
}

const WEEKLY_PLAN: Record<number, string[]> = {
  1: ['Economia', 'Língua Inglesa', 'História do Brasil'],
  2: ['Direito', 'Língua Portuguesa', 'Política Internacional'],
  3: ['História Mundial', 'Economia', 'Língua Francesa'],
  4: ['Direito', 'Geografia', 'Língua Portuguesa'],
  5: ['Política Internacional', 'História Mundial', 'Economia'],
  6: ['Língua Inglesa', 'História do Brasil', 'Direito'],
  0: []
};

const Dashboard: React.FC<DashboardProps> = ({ userState, setView, onUpdateEdital, onImportState, compact }) => {
  const [activeSubject, setActiveSubject] = useState(SUBJECTS[0]);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<{title: string, content: string} | null>(null);
  const [showTelex, setShowTelex] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const dayIndex = now.getDay();
  const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  
  const getNextTopic = (subject: string) => {
    return SYLLABUS.find(item => {
      const isDireito = subject === 'Direito' ? item.subject.includes('Direito') : item.subject === subject;
      return isDireito && !userState.editalProgress[item.id]?.theory;
    });
  };

  const generateTelex = () => {
    const json = JSON.stringify(userState);
    return btoa(json);
  };

  const handleToggle = (id: string, field: 'theory' | 'flashcards', currentVal: boolean) => {
    const xp = field === 'theory' ? 50 : 30;
    const becomingActive = !currentVal;
    if (becomingActive) soundService.playMeow();
    onUpdateEdital(id, { 
      [field]: becomingActive,
      lastStudyDate: becomingActive ? new Date().toISOString() : userState.editalProgress[id]?.lastStudyDate
    }, becomingActive ? xp : 0);
  };

  const handleNumeric = (id: string, field: 'questionsCount' | 'accuracy' | 'studyMinutes', val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    onUpdateEdital(id, { [field]: num, lastStudyDate: new Date().toISOString() }, 0);
  };

  const handleHelp = async (item: SyllabusItem) => {
    setExplainingId(item.id);
    try {
      const text = await explainSubject(item.subject, item.subtopic);
      setExplanation({ title: `${item.subject}: ${item.subtopic}`, content: text });
    } catch (e) {
      alert("Miau! Tive um problema ao consultar meus alfarrábios.");
    } finally {
      setExplainingId(null);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(userState, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup_cacd_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    soundService.playSuccess();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.level && json.editalProgress) {
          onImportState?.(json);
          soundService.playLevelUp();
          alert("Dossiê importado com sucesso!");
        } else {
          throw new Error("Formato inválido");
        }
      } catch (err) {
        alert("Erro ao importar backup.");
      }
    };
    reader.readAsText(file);
  };

  const dailyMissions = WEEKLY_PLAN[dayIndex] || [];
  
  if (compact) {
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6 px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-xl">🎖️</div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Missões: {dayNames[dayIndex]}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sua rota estratégica para hoje</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dailyMissions.map((subject, i) => {
            const next = getNextTopic(subject);
            return (
              <div key={i} className="bg-white p-8 rounded-5xl sticker-shadow border border-slate-50 transition-all group hover:-rotate-2">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">{subject}</span>
                  {next && (
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                      next.incidence === 'Alta' ? 'bg-rose-500 text-white' : 
                      next.incidence === 'Média' ? 'bg-brandGold text-orange-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {next.incidence}
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-slate-800 leading-tight line-clamp-2">
                    {next ? next.subtopic : 'Matéria Concluída! 🎉'}
                  </h4>
                  <button 
                    onClick={() => setView(AppView.DASHBOARD)}
                    className="w-full py-4 bg-slate-50 group-hover:bg-slate-800 group-hover:text-brandPink rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Ver Detalhes 🐾
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-[fadeIn_0.5s_ease-out] pb-24">
       {/* High Level Stats */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Matérias Lidas', val: `${(Object.values(userState.editalProgress) as TopicProgress[]).filter(p => p.theory).length}`, icon: '📚', color: 'bg-brandPink/30' },
            { label: 'Horas Focadas', val: `${((Object.values(userState.editalProgress) as TopicProgress[]).reduce((a, b) => a + (b.studyMinutes || 0), 0) / 60).toFixed(1)}h`, icon: '⏳', color: 'bg-brandTeal/30' },
            { label: 'Precisão', val: `${((Object.values(userState.editalProgress) as TopicProgress[]).filter(p => p.questionsCount > 0).reduce((a, b) => a + b.accuracy, 0) / Math.max(1, (Object.values(userState.editalProgress) as TopicProgress[]).filter(p => p.questionsCount > 0).length)).toFixed(0)}%`, icon: '🎯', color: 'bg-brandGold/30' },
            { label: 'Patente', val: getDiplomatRank(userState.level).title, icon: '🎖️', color: 'bg-slate-800 text-white' }
          ].map((stat, i) => (
            <div key={i} className={`p-8 rounded-5xl ${stat.color} flex flex-col items-center justify-center text-center sticker-shadow border border-white/20`}>
               <span className="text-3xl mb-3">{stat.icon}</span>
               <span className="text-3xl font-black tracking-tighter block">{stat.val}</span>
               <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-2">{stat.label}</span>
            </div>
          ))}
       </div>

       {/* Detailed Agenda */}
       <div className="bg-white p-12 rounded-[4rem] sticker-shadow border border-slate-50 space-y-10 relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
             <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center text-3xl shadow-sm">📅</div>
             <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase italic leading-none tracking-tighter">Agenda de {dayNames[dayIndex]}</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Prioridades táticas de hoje</p>
             </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {dailyMissions.map((subject, idx) => {
              const next = getNextTopic(subject);
              return (
                <div key={idx} className="relative p-10 rounded-[3rem] border-2 border-slate-50 hover:border-brandPink/30 transition-all bg-slate-50/50 group">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">{subject}</span>
                    {next && (
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${
                        next.incidence === 'Alta' ? 'bg-rose-500 text-white' : 
                        next.incidence === 'Média' ? 'bg-brandGold text-orange-700' : 'bg-white text-slate-400'
                      }`}>
                        {next.incidence}
                      </div>
                    )}
                  </div>
                  {next ? (
                    <div className="space-y-4">
                       <h4 className="text-xl font-black text-slate-800 leading-tight">{next.subtopic}</h4>
                       <p className="text-xs text-slate-400 font-medium italic line-clamp-3 leading-relaxed">{next.description}</p>
                    </div>
                  ) : (
                    <div className="py-10 text-center opacity-30">
                      <span className="text-4xl block mb-2">🎉</span>
                      <p className="text-[9px] font-black uppercase tracking-widest">Matéria Concluída</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
       </div>

       {/* DATA MANAGEMENT SECTION */}
       <div className="bg-diplomatBlue p-12 rounded-[4rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="text-9xl">🛡️</span>
          </div>
          <div className="relative z-10">
             <h3 className="text-2xl font-black uppercase italic tracking-tighter">Gerenciamento de Dados</h3>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Seu progresso é salvo localmente. Use o backup ou o Telex para sincronizar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 relative z-10">
             <button 
              onClick={handleExport}
              className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-3xl flex items-center justify-between group transition-all"
             >
                <div className="text-left">
                   <span className="block text-[10px] font-black uppercase text-brandPink tracking-widest mb-1">Arquivo</span>
                   <span className="text-sm font-bold">Backup JSON</span>
                </div>
                <span className="text-2xl">📥</span>
             </button>
             <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-3xl flex items-center justify-between group transition-all"
             >
                <div className="text-left">
                   <span className="block text-[10px] font-black uppercase text-brandTeal tracking-widest mb-1">Arquivo</span>
                   <span className="text-sm font-bold">Importar JSON</span>
                </div>
                <span className="text-2xl">📤</span>
                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
             </button>
             <button 
              onClick={() => { setShowTelex(true); soundService.playPurr(); }}
              className="bg-brandPink/20 hover:bg-brandPink/30 border border-brandPink/30 p-6 rounded-3xl flex items-center justify-between group transition-all"
             >
                <div className="text-left">
                   <span className="block text-[10px] font-black uppercase text-brandPink tracking-widest mb-1">Mobilidade</span>
                   <span className="text-sm font-bold text-white">Gerar Código Telex</span>
                </div>
                <span className="text-2xl">📡</span>
             </button>
          </div>
       </div>

       {/* MODAL TELEX */}
       {showTelex && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[250] p-6">
          <div className="bg-diplomatBlue p-10 rounded-[3rem] max-w-lg w-full space-y-6 shadow-2xl border-2 border-brandPink/30 animate-[scaleIn_0.3s_ease-out]">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black uppercase text-brandPink tracking-[0.5em]">Cifra de Sincronização</span>
              <h3 className="text-2xl font-black text-white uppercase italic">Mensagem Telex</h3>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase text-center leading-relaxed">
              Copie este código e cole na tela de entrada do seu outro dispositivo para sincronizar seu progresso.
            </p>
            <textarea 
              readOnly
              value={generateTelex()}
              className="w-full h-48 bg-black/40 p-4 rounded-2xl text-[10px] font-mono text-brandPink border border-white/10 focus:ring-2 focus:ring-brandPink outline-none resize-none"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => { navigator.clipboard.writeText(generateTelex()); alert("Telex copiado!"); }}
                className="flex-1 bg-brandPink text-diplomatBlue py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                Copiar Cifra
              </button>
              <button 
                onClick={() => setShowTelex(false)}
                className="px-6 py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
       )}

       {/* MAPA DE MISSÕES INTEGRAL (EDITAL VERTICALIZADO) */}
       <div className="space-y-10 pt-10 border-t-2 border-dashed border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
             <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-brandPink rounded-3xl flex items-center justify-center text-3xl shadow-sm">📖</div>
               <div>
                  <h3 className="text-4xl font-black text-diplomatBlue uppercase italic tracking-tighter leading-none">Mapa de Missões</h3>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Edital Verticalizado e Gestão de Progresso</p>
               </div>
             </div>
             
             <div className="flex flex-wrap gap-2 justify-center">
                {SUBJECTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveSubject(s)}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all ${
                      activeSubject === s 
                        ? 'bg-diplomatBlue text-brandPink shadow-xl scale-105' 
                        : 'bg-white text-slate-400 border border-slate-100 hover:border-brandPink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-50">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-8">Tópico Operacional</th>
                  <th className="p-8 text-center w-24">Incidência</th>
                  <th className="p-8 text-center w-20">Lido</th>
                  <th className="p-8 text-center w-24">Minutagem</th>
                  <th className="p-8 text-center w-24">Qtd Questões</th>
                  <th className="p-8 text-center w-24">Aproveitamento</th>
                  <th className="p-8 text-center w-20">Mentor</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {SYLLABUS.filter(item => item.subject === activeSubject).map((item) => {
                  const prog = userState.editalProgress[item.id] || { theory: false, questionsCount: 0, accuracy: 0, flashcards: false, studyMinutes: 0 };
                  return (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-brandTeal uppercase opacity-70 tracking-widest">{item.topic}</span>
                          <h4 className="font-bold text-slate-800 text-lg leading-tight">{item.subtopic}</h4>
                          <p className="text-[11px] text-slate-400 italic leading-snug max-w-md">{item.description}</p>
                          {prog.lastStudyDate && (
                            <div className="mt-3 flex items-center gap-2">
                               <span className="w-1.5 h-1.5 bg-brandPink rounded-full"></span>
                               <span className="text-[8px] font-black text-rose-400 uppercase">Último Despacho: {new Date(prog.lastStudyDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          item.incidence === 'Alta' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-brandGold text-orange-800'
                        }`}>
                          {item.incidence}
                        </span>
                      </td>
                      <td className="p-8 text-center">
                        <button 
                          onClick={() => handleToggle(item.id, 'theory', prog.theory)}
                          className={`w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center text-2xl ${
                            prog.theory ? 'bg-brandTeal border-brandTeal text-teal-700 shadow-lg shadow-brandTeal/20 scale-110' : 'bg-white border-slate-100 text-slate-200'
                          }`}
                        >
                          {prog.theory ? '🐾' : '○'}
                        </button>
                      </td>
                      <td className="p-8">
                        <input 
                          type="number"
                          value={prog.studyMinutes || ''}
                          placeholder="0"
                          onChange={(e) => handleNumeric(item.id, 'studyMinutes', e.target.value)}
                          className="w-full bg-slate-50 border-none p-4 rounded-2xl text-center font-black text-slate-800 focus:ring-2 focus:ring-brandPink outline-none shadow-inner"
                        />
                      </td>
                      <td className="p-8">
                        <input 
                          type="number"
                          value={prog.questionsCount || ''}
                          placeholder="0"
                          onChange={(e) => handleNumeric(item.id, 'questionsCount', e.target.value)}
                          className="w-full bg-slate-50 border-none p-4 rounded-2xl text-center font-black text-slate-800 outline-none shadow-inner"
                        />
                      </td>
                      <td className="p-8">
                        <input 
                          type="number"
                          value={prog.accuracy || ''}
                          placeholder="0"
                          onChange={(e) => handleNumeric(item.id, 'accuracy', e.target.value)}
                          className={`w-full p-4 rounded-2xl text-center font-black outline-none transition-all shadow-inner ${
                            prog.accuracy >= 70 ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-400'
                          }`}
                        />
                      </td>
                      <td className="p-8 text-center">
                        <button 
                          onClick={() => handleHelp(item)}
                          disabled={explainingId === item.id}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 shadow-sm ${
                            explainingId === item.id ? 'bg-slate-100' : 'bg-brandGold border-orange-200 hover:scale-110 text-orange-700 active:scale-95'
                          }`}
                        >
                          {explainingId === item.id ? <span className="animate-spin text-xs">🐱</span> : '💡'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
       </div>

       {/* Modal de Ajuda do Mentor */}
       {explanation && (
        <div className="fixed inset-0 bg-diplomatBlue/60 backdrop-blur-xl flex items-center justify-center z-[200] p-6 overflow-y-auto">
          <div className="bg-white p-12 rounded-[4rem] max-w-3xl w-full space-y-8 shadow-2xl animate-[scaleIn_0.3s_ease-out] border-4 border-brandGold">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-400 tracking-[0.4em]">Briefing Estratégico do Mentor</span>
                <h3 className="text-3xl font-black text-diplomatBlue uppercase italic tracking-tighter mt-2">{explanation.title}</h3>
              </div>
              <button onClick={() => setExplanation(null)} className="text-slate-300 hover:text-rose-400 transition-colors text-3xl">✕</button>
            </div>
            <div className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed text-lg border-l-8 border-brandGold pl-8 italic">
              {explanation.content}
            </div>
            <button 
              onClick={() => setExplanation(null)}
              className="w-full bg-diplomatBlue text-brandPink py-6 rounded-3xl font-black uppercase text-xs tracking-[0.5em] shadow-xl hover:bg-slate-800 transition-all"
            >
              Missão Compreendida, Mentor! 🐾
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
