import React, { useState } from "react";
import { Cloud, Lock, Bot, TrendingUp, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface LoginViewProps {
  onLoginMicrosoft: () => void;
  onContinueAsGuest: () => void;
  loadingSession: boolean;
}

export default function LoginView({ onLoginMicrosoft, onContinueAsGuest, loadingSession }: LoginViewProps) {
  const [hoveringMs, setHoveringMs] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Decorative Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Side: Brand Narrative & Visual Hook */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-white/5 relative z-10">
        {/* Logo/Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-white tracking-tight">FinanceAI</h1>
            <p className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Sistema Operacional Financeiro</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="my-auto max-w-lg space-y-6 py-12 md:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-400 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Sincronização Oficial OneDrive Ativa
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight"
          >
            Seus dados financeiros sob seu <span className="text-indigo-400">total controle</span>.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm md:text-base text-slate-400 leading-relaxed"
          >
            Diferente de outras plataformas, o FinanceAI salva seu banco de dados diretamente na sua conta pessoal do Microsoft OneDrive em formato aberto e seguro. Acesse e atualize suas finanças de qualquer dispositivo, mantendo a privacidade total.
          </motion.p>

          {/* Quick value props */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Privacidade Absoluta</span>
            </div>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Planejamento com IA</span>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 font-mono">
          FinanceAI Corp • Produção v1.5.0
        </div>
      </div>

      {/* Right Side: Auth Center */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle inside glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-2">
            <h3 className="text-xl font-display font-bold text-white tracking-tight">Faça seu Login</h3>
            <p className="text-xs text-slate-400">
              Conecte sua conta Microsoft para iniciar ou restaurar sua base existente.
            </p>
          </div>

          <div className="space-y-4">
            {/* Microsoft Connection Button */}
            <button
              id="login-microsoft-btn"
              onClick={onLoginMicrosoft}
              onMouseEnter={() => setHoveringMs(true)}
              onMouseLeave={() => setHoveringMs(false)}
              disabled={loadingSession}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition duration-200 flex items-center justify-center gap-3 shadow-xl shadow-indigo-950/30 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <Cloud className={`w-5 h-5 ${hoveringMs ? "animate-bounce" : ""}`} />
              <span>Conectar com Microsoft OneDrive</span>
              <ArrowRight className="w-4 h-4 ml-auto text-indigo-200" />
            </button>

            {/* Guest Entry Button */}
            <button
              id="login-guest-btn"
              onClick={onContinueAsGuest}
              disabled={loadingSession}
              className="w-full py-3.5 px-6 bg-[#161616] hover:bg-[#1f1f1f] border border-white/5 hover:border-white/10 text-slate-400 hover:text-white font-bold rounded-2xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Entrar como Convidado (Modo Local)</span>
            </button>
          </div>

          {/* Secure details */}
          <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5 leading-relaxed">
            <div className="flex gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>Suas credenciais de login e tokens são processados diretamente pelos servidores de autenticação segura da Microsoft (OAuth 2.0). Nós nunca salvamos suas senhas.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
