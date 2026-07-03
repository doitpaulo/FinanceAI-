/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Send, Bot, User, Sparkles, MessageSquare, ArrowRight, ShieldAlert, Check } from "lucide-react";
import { ExcelDatabase } from "../types";

interface ConsultorProps {
  data: ExcelDatabase;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
}

export default function ConsultorIA({ data }: ConsultorProps) {
  // Explicit privacy consent opt-in state
  const [consented, setConsented] = useState<boolean>(() => {
    return localStorage.getItem("ai_consent") === "true";
  });

  // Optional financial values obfuscation/masking state
  const [maskData, setMaskData] = useState<boolean>(() => {
    return localStorage.getItem("ai_mask_data") === "true";
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-1",
      sender: "ai",
      text: `Olá, **${data.profile.name}**! Sou o seu copiloto de Inteligência Financeira do **FinanceAI**. 

Eu analisei a estrutura do seu arquivo do **Excel Online** e identifiquei seu perfil como **${data.profile.incomeType}** com tolerância a risco **${data.profile.riskProfile}**.

Você pode me fazer perguntas contextuais ou clicar em um dos tópicos abaixo para simular cenários e planejar seu fluxo de caixa!`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Posso gastar R$ 200 hoje?",
    "Estou indo bem financeiramente?",
    "Como acelerar minha meta de reserva?",
    "O que devo ajustar este mês?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !consented) return;

    const userMsg: Message = {
      id: "u-" + Math.random().toString(36).substr(2, 9),
      sender: "user",
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: textToSend, 
          history: messages,
          maskData
        })
      });

      if (!res.ok) throw new Error("Erro na requisição");

      const resData = await res.json();
      
      const aiMsg: Message = {
        id: "ai-" + Math.random().toString(36).substr(2, 9),
        sender: "ai",
        text: resData.text
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        id: "err-" + Math.random().toString(36).substr(2, 9),
        sender: "ai",
        text: "Desculpe, ocorreu um erro ao consultar o cérebro de IA do FinanceAI. Por favor, tente novamente."
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleMaskChange = (checked: boolean) => {
    setMaskData(checked);
    localStorage.setItem("ai_mask_data", checked ? "true" : "false");
  };

  return (
    <div className="bg-[#111111] border border-white/10 rounded-3xl flex flex-col h-[600px] overflow-hidden relative animate-fade-in" id="consultor-ia-view">
      
      {/* Upper header */}
      <div className="bg-white/5 border-b border-white/5 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-1.5">
              FinanceAI Coach
              {consented && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </h3>
            <p className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
              {consented ? "Consultor Contextual Ativo" : "Privacidade Protegida"}
            </p>
          </div>
        </div>

        {/* Dynamic Privacy & Consent controls */}
        <div className="flex items-center gap-3">
          {consented ? (
            <>
              <label className="flex items-center gap-1.5 cursor-pointer select-none border border-white/5 bg-[#050505] px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-slate-400">
                <input
                  id="toggle-mask-data"
                  type="checkbox"
                  checked={maskData}
                  onChange={(e) => handleMaskChange(e.target.checked)}
                  className="rounded border-white/20 bg-[#050505] text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                />
                <span>MASCARAR VALORES</span>
              </label>
              <button
                id="revoke-ai-consent"
                onClick={() => {
                  setConsented(false);
                  localStorage.setItem("ai_consent", "false");
                }}
                className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider underline cursor-pointer"
              >
                Revogar
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#050505] border border-white/10 px-3.5 py-1 rounded-full text-[10px] font-mono font-bold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini 3.5 Flash</span>
            </div>
          )}
        </div>
      </div>

      {!consented ? (
        // Explicit AI Consent Wall UI
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 overflow-y-auto" id="consent-wall">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-3xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-3 max-w-md">
            <h3 className="text-base font-display font-bold text-white">Consentimento para Uso de Inteligência Artificial</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Para fornecer análises, previsões de sobra de caixa e simulações financeiras personalizadas, o FinanceAI Coach processará as categorias gerais de seus hábitos de poupar e gastar.
            </p>
            <div className="text-[11px] text-slate-400 leading-relaxed bg-[#050505] p-4 rounded-2xl border border-white/5 text-left space-y-2 font-sans">
              <p className="font-semibold text-slate-300 font-mono text-[10px] uppercase tracking-wider">🔒 Termos de Proteção de Dados:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Dados sensíveis como <strong className="text-white">nomes de bancos, descrições reais e IDs de contas</strong> são completamente omitidos.</li>
                <li>Nenhum identificador pessoal direto é compartilhado com provedores.</li>
                <li>Ative a opção de <strong className="text-indigo-400">Mascaramento de Valores</strong> para aproximar e esconder os números reais.</li>
              </ul>
            </div>
          </div>
          <button
            id="accept-ai-consent"
            onClick={() => {
              setConsented(true);
              localStorage.setItem("ai_consent", "true");
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition cursor-pointer"
          >
            Aceitar Termos e Ativar Consultor
          </button>
        </div>
      ) : (
        // Active AI Chat View
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-sm">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`p-2 rounded-2xl shrink-0 h-10 w-10 flex items-center justify-center border ${
                  m.sender === "user" 
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                    : "bg-white/5 border border-white/10 text-indigo-400"
                }`}>
                  {m.sender === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "bg-[#050505] border border-white/5 text-slate-200"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                <div className="p-2 rounded-2xl shrink-0 h-10 w-10 flex items-center justify-center bg-white/5 border border-white/10 text-indigo-400">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div className="p-4 bg-[#050505] border border-white/5 text-slate-400 rounded-2xl flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">Analisando dados financeiros agregados...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer controls & prompt suggestions */}
          <div className="bg-white/5 border-t border-white/5 p-4 space-y-4">
            
            {/* Chips */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map(prompt => (
                  <button
                    id={`quick-prompt-${prompt.replace(/\s+/g, '-').toLowerCase()}`}
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    disabled={loading}
                    className="text-xs font-bold text-slate-400 hover:text-white bg-[#050505] hover:bg-white/5 border border-white/10 py-1.5 px-3.5 rounded-full transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    {prompt}
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                  </button>
                ))}
              </div>
            )}

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }} 
              className="flex gap-2"
            >
              <input
                id="chat-message-input"
                type="text"
                className="flex-1 px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-white font-sans transition text-sm"
                placeholder={maskData ? "Pergunte com mascaramento de valores ativo..." : "Pergunte sobre seu fluxo de caixa ou simule compras..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                id="chat-send-button"
                type="submit"
                className="p-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
                disabled={loading || !input.trim()}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
