
import React, { useState } from 'react';
import { SUBJECTS } from '../syllabusData';
import { PracticeQuestion } from '../types';

interface PracticeAreaProps {
  onStart?: (subject: string, isManual: boolean, manualData?: PracticeQuestion) => void;
  question?: PracticeQuestion | null;
  onSubmit?: (essay: string) => void;
}

const PracticeArea: React.FC<PracticeAreaProps> = ({ onStart, question, onSubmit }) => {
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [essay, setEssay] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  
  // States for manual input
  const [manualTitle, setManualTitle] = useState('');
  const [manualCommand, setManualCommand] = useState('');

  if (question) {
    return (
      <div className="max-w-5xl mx-auto space-y-10 animate-[fadeIn_0.5s_ease-out]">
        <div className="glass-card p-12 rounded-[3.5rem] border-none shadow-2xl space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-diplomatBlue/5 pb-8">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-[0.3em]">Treinamento de Escrita Diplomática</span>
              <h3 className="text-2xl font-black text-diplomatBlue uppercase tracking-tight leading-none">{question.subject}</h3>
            </div>
            <div className="bg-diplomatBlue text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
               {question.topic}
            </div>
          </div>

          <div className="bg-white/50 p-10 rounded-[2.5rem] text-diplomatBlue font-serif leading-relaxed italic shadow-inner border-l-[12px] border-brandGold">
            <p className="text-xl opacity-90 leading-relaxed">{question.command}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end px-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sua Dissertação (Padrão Rio Branco)</label>
              <span className="text-[9px] font-bold text-rose-400 uppercase italic">Registro Culto Obrigatório</span>
            </div>
            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Inicie sua argumentação focada na profundidade conceitual..."
              className="w-full h-[500px] p-10 rounded-[3rem] border-2 border-white focus:border-brandPink outline-none font-medium text-slate-700 leading-relaxed shadow-sm resize-none transition-all bg-white/40 backdrop-blur-sm text-lg"
            />
          </div>

          <button
            onClick={() => onSubmit?.(essay)}
            disabled={essay.length < 50}
            className="w-full py-8 bg-diplomatBlue text-brandPink rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-2xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
          >
            <span>📩</span> Despachar para Correção 🐾
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-[fadeIn_0.5s_ease-out]">
      <div className="bg-white p-12 rounded-[3.5rem] border-2 border-brandPink/10 text-center relative overflow-hidden shadow-sm">
        <h2 className="text-4xl font-black tracking-tighter text-diplomatBlue uppercase italic">Laboratório de Discursivas ✒️</h2>
        <p className="text-slate-400 font-medium text-sm mt-4">Treino rigoroso com correção padrão aprovado Rio Branco</p>
      </div>

      <div className="glass-card p-12 rounded-[3.5rem] space-y-10">
        <div className="flex gap-4 p-2 bg-slate-100 rounded-3xl">
          <button 
            onClick={() => setIsManualMode(false)}
            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!isManualMode ? 'bg-white text-diplomatBlue shadow-sm' : 'text-slate-400'}`}
          >
            Gerar Desafio IA 🐈
          </button>
          <button 
            onClick={() => setIsManualMode(true)}
            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isManualMode ? 'bg-white text-diplomatBlue shadow-sm' : 'text-slate-400'}`}
          >
            Inserir Enunciado Manual ✍️
          </button>
        </div>

        {!isManualMode ? (
          <div className="space-y-8">
            <div className="space-y-6">
              <label className="text-[11px] font-black uppercase text-rose-400 tracking-[0.3em] ml-6">Selecione o Eixo Temático</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SUBJECTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSubject(s)}
                    className={`p-5 rounded-[2rem] border-2 text-[10px] font-black uppercase tracking-tight transition-all ${
                      selectedSubject === s 
                        ? 'bg-diplomatBlue text-brandPink border-diplomatBlue shadow-xl' 
                        : 'bg-white/50 text-slate-400 border-white hover:border-brandPink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => onStart?.(selectedSubject, false)}
              className="w-full py-8 bg-brandPink text-rose-800 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-brandPink/80 transition-all flex items-center justify-center gap-4"
            >
              <span>🐾</span> Iniciar Missão de Escrita
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Assunto/Matéria</label>
              <input 
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Ex: Política Internacional - MERCOSUL"
                className="w-full p-6 rounded-3xl border-2 border-slate-50 focus:border-brandPink outline-none font-bold text-slate-700 bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Enunciado / Comando da Questão</label>
              <textarea 
                value={manualCommand}
                onChange={(e) => setManualCommand(e.target.value)}
                placeholder="Cole aqui o comando da questão discursiva que você deseja responder..."
                className="w-full h-40 p-6 rounded-3xl border-2 border-slate-50 focus:border-brandPink outline-none font-medium text-slate-700 bg-white/50 resize-none"
              />
            </div>
            <button
              onClick={() => onStart?.(manualTitle, true, { subject: manualTitle, command: manualCommand, lines: 60, topic: 'Simulado Livre' })}
              disabled={!manualTitle || !manualCommand}
              className="w-full py-8 bg-diplomatBlue text-brandPink rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Começar Simulado Livre 🚀
            </button>
          </div>
        )}
        
        <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60 leading-relaxed">
          O Mentor Cat corrigirá sua resposta com base nos critérios rigorosos do Instituto Rio Branco.
        </p>
      </div>
    </div>
  );
};

export default PracticeArea;
