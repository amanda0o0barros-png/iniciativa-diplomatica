
import { GoogleGenAI, Type } from "@google/genai";
import { CorrectionResult, PracticeQuestion, DossierHighlight } from "../types";

const SYSTEM_INSTRUCTION = `Você é o Mentor CACD, professor particular e corretor oficial de discursivas do CACD – nível dos melhores aprovados do Instituto Rio Branco.
Você segue estritamente os Guias dos Aprovados, o Edital do CACD e os critérios do IBRJ/Cespe/Cebraspe.

REGRAS DE CORREÇÃO:
1. NOTA: 0,00 a 10,00 com duas casas decimais. Seja RIGOROSO. Notas 5,50–6,50 para respostas medianas. Abaixo de 3,00 para ruins.
2. CRITÉRIOS: Justifique ponto a ponto (Estrutura, Profundidade Conceitual, Autores/Datas/Tratados, Linguagem Diplomática, Equilíbrio, Originalidade Controlada).
3. MODELO NOTA 10: Forneça sempre uma resposta padrão aprovado (Introdução forte com tese, Desenvolvimento em 3–4 parágrafos com fatos históricos/autores, Conclusão prospectiva).
4. PLANO DE MELHORIA: 5–7 itens concretos e práticos.
5. LINGUAGEM: 100% compatível com o CACD (Formal, elegante, precisa, sem gírias).
6. FORMATAÇÃO: NÃO USE MARKDOWN (asteriscos, hashtags). Use APENAS letras MAIÚSCULAS para títulos e hifens (-) para listas.`;

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export async function correctEssay(topic: string, command: string, essay: string): Promise<CorrectionResult> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `TEMA/ASSUNTO: ${topic}\nENUNCIADO DA QUESTÃO: ${command}\n\nRESPOSTA DO ALUNO: ${essay}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          justification: { type: Type.STRING },
          errors: { type: Type.ARRAY, items: { type: Type.STRING } },
          omissions: { type: Type.ARRAY, items: { type: Type.STRING } },
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
          bankGrade: { type: Type.NUMBER },
          approvedGrade: { type: Type.NUMBER },
          modelResponse: { type: Type.STRING },
          improvementPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["score", "justification", "errors", "omissions", "highlights", "bankGrade", "approvedGrade", "modelResponse", "improvementPlan"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as CorrectionResult;
}

export async function generateQuestion(subject: string): Promise<PracticeQuestion> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere uma questão inédita padrão CACD (discursiva) sobre: ${subject}. Use comandos complexos que exijam análise histórica ou política profunda.`,
    config: {
      systemInstruction: "Você é um elaborador de provas do CACD. NÃO USE markdown. Use APENAS texto simples e parágrafos claros.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          command: { type: Type.STRING },
          lines: { type: Type.NUMBER },
          subject: { type: Type.STRING }
        },
        required: ["topic", "command", "lines", "subject"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as PracticeQuestion;
}

export async function explainSubject(subject: string, subtopic: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explique de forma estratégica para o CACD o assunto: ${subject} - ${subtopic}. Foque em conceitos-chave e autores.`,
    config: {
      systemInstruction: "Você é um mentor experiente do CACD. NÃO USE markdown. Use hifens para listas e texto simples.",
    }
  });
  return response.text || "Erro ao processar briefing.";
}

export async function generateStudySchedule(daysRemaining: number, context: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um cronograma de estudos estratégico para o CACD. Dias restantes: ${daysRemaining}. Contexto: ${context}.`,
    config: {
      systemInstruction: "Estrategista de estudos CACD. SEM MARKDOWN. Use MAIÚSCULAS para títulos.",
    }
  });
  return response.text || "Erro ao gerar cronograma.";
}

export interface DossierData {
  current: string;
  previous: string;
  highlights: DossierHighlight[];
  sources: { title: string, uri: string }[];
}

export async function getWeeklyDiplomaticDossier(): Promise<DossierData> {
  const ai = getGeminiClient();
  const today = new Date().toLocaleDateString('pt-BR');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Compilado Diplomático Brasileiro. DATA: ${today}. Pesquise fatos relevantes para o CACD.`,
    config: {
      systemInstruction: "Analista do MRE. SEM MARKDOWN. Retorne JSON.",
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          current: { type: Type.STRING },
          previous: { type: Type.STRING },
          highlights: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["text"]
            }
          },
        },
        required: ["current", "previous", "highlights"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = (groundingChunks as any[])
    .map((chunk: any) => chunk.web)
    .filter((web: any) => web && web.title && web.uri)
    .map((web: any) => ({ title: String(web.title), uri: String(web.uri) }));

  const highlights = (parsed.highlights || []).map((h: DossierHighlight, idx: number) => {
    if (!h.url && sources[idx]) h.url = sources[idx].uri;
    return h;
  });

  return { 
    current: parsed.current, 
    previous: parsed.previous, 
    highlights: highlights, 
    sources: Array.from(new Map(sources.map(s => [s.uri, (s as any)])).values() as any) as any
  };
}
