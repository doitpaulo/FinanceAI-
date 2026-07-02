/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Send, Bot, User, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
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
    if (!textToSend.trim()) return;

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
        body: JSON.stringify({ message: textToSend, history: messages })
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

  return (
    <div className="bg-[#111111] border border-white/10 rounded-3xl flex flex-col h-[600px] overflow-hidden relative animate-fade-in" id="consultor-ia-view">
      
      {/* Upper header */}
      <div className="bg-white/5 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-1.5">
              FinanceAI Coach
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Consultor Contextual Ativo</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#050505] border border-white/10 px-3.5 py-1 rounded-full text-[10px] font-mono font-bold text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Gemini 3.5 Flash</span>
        </div>
      </div>

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
              <span className="text-xs font-mono font-bold text-slate-500">Analisando planilhas do OneDrive...</span>
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
            placeholder="Pergunte sobre seu fluxo de caixa ou simule compras..."
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

    </div>
  );
}
