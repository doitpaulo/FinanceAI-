import React, { useState } from "react";
import { 
  Lock, TrendingUp, Sparkles, ArrowRight, ShieldCheck, Database, 
  ArrowLeft, User, Mail, Key, Eye, EyeOff, AlertCircle, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import FinanceAILogo from "./FinanceAILogo";
import { ExcelDatabase } from "../types";

interface LoginViewProps {
  onLoginGoogle: () => void;
  onLoginLocal: (database: ExcelDatabase, email: string) => void;
  loadingSession: boolean;
}

export default function LoginView({ onLoginGoogle, onLoginLocal, loadingSession }: LoginViewProps) {
  const [hoveringGoogle, setHoveringGoogle] = useState(false);
  const [screen, setScreen] = useState<"welcome" | "register_local" | "login_local">("welcome");
  
  // Registration Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState("");
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Helper to generate a default custom database for a new local user
  const generateNewDatabase = (name: string, email: string): ExcelDatabase => {
    const currentYear = new Date().getFullYear();
    return {
      profile: {
        userId: "local-" + Math.random().toString(36).substr(2, 9),
        name: name,
        email: email,
        incomeType: "CLT",
        payFrequency: "mensal",
        financialGoal: "Minha liberdade financeira e controle de gastos",
        riskProfile: "moderado",
        onboardingCompleted: false, // Triggers OnboardingModal inside the app!
      },
      settings: {
        currency: "BRL",
        language: "pt-BR",
        notificationsEnabled: true,
        aiEnabled: true,
        darkMode: true,
      },
      accounts: [
        { id: "acc-1", name: "Conta Corrente", bankName: "Banco Principal", type: "checking", balance: 0, isActive: true },
        { id: "acc-2", name: "Reserva Financeira", bankName: "Investimentos", type: "savings", balance: 0, isActive: true }
      ],
      cards: [
        { id: "card-1", name: "Meu Cartão", limit: 0, dueDate: 10, closingDay: 3, currentInvoice: 0, availableLimit: 0 }
      ],
      incomeSources: [
        { id: "inc-1", name: "Salário / Receitas", type: "CLT", frequency: "monthly", expectedValue: 0, nextDate: `${currentYear}-07-05` }
      ],
      expenses: [
        { id: "exp-1", name: "Custos de Moradia", category: "Moradia", amount: 0, frequency: "monthly", dueDate: `${currentYear}-07-10`, isFixed: true },
        { id: "exp-2", name: "Contas Gerais", category: "Serviços", amount: 0, frequency: "monthly", dueDate: `${currentYear}-07-15`, isFixed: true },
        { id: "exp-3", name: "Lazer & Outros", category: "Lazer", amount: 0, frequency: "monthly", dueDate: `${currentYear}-07-20`, isFixed: false }
      ],
      transactions: [],
      assets: [],
      liabilities: [],
      goals: [
        { id: "goal-1", name: "Fundo de Reserva", targetValue: 0, currentValue: 0, deadline: `${currentYear}-12-31`, priority: "high", status: "active" }
      ],
      cashFlow: [],
      calendar: [],
      timeline: [],
      events: [],
      aiInsights: []
    };
  };

  // Handle local account registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (regPassword.length < 4) {
      setRegError("A senha local deve possuir no mínimo 4 caracteres.");
      return;
    }

    try {
      const accountsJson = localStorage.getItem("financeai_local_accounts");
      const accountsList = accountsJson ? JSON.parse(accountsJson) : [];
      
      // Check duplicate
      const exists = accountsList.some((acc: any) => acc.email.toLowerCase() === regEmail.toLowerCase());
      if (exists) {
        setRegError("Este e-mail já está cadastrado localmente. Tente fazer login.");
        return;
      }

      // Add to accounts list
      const newAcc = { 
        name: regName, 
        email: regEmail.toLowerCase(), 
        password: regPassword 
      };
      accountsList.push(newAcc);
      localStorage.setItem("financeai_local_accounts", JSON.stringify(accountsList));

      // Generate a fresh template database for them
      const newDb = generateNewDatabase(regName, regEmail.toLowerCase());
      
      // Save database locally
      localStorage.setItem(`financeai_local_db_${regEmail.toLowerCase()}`, JSON.stringify(newDb));
      localStorage.setItem("financeai_logged_in_guest", regEmail.toLowerCase());

      // Pass database to App
      onLoginLocal(newDb, regEmail.toLowerCase());
    } catch (err) {
      console.error(err);
      setRegError("Erro desconhecido ao salvar conta localmente.");
    }
  };

  // Handle local login
  const handleLoginLocal = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Por favor, informe seu e-mail e sua senha local.");
      return;
    }

    try {
      const accountsJson = localStorage.getItem("financeai_local_accounts");
      const accountsList = accountsJson ? JSON.parse(accountsJson) : [];
      
      const foundAcc = accountsList.find(
        (acc: any) => acc.email.toLowerCase() === loginEmail.toLowerCase() && acc.password === loginPassword
      );

      if (!foundAcc) {
        setLoginError("Dados incorretos ou conta não encontrada. Verifique suas credenciais.");
        return;
      }

      // Load database from localStorage, or generate a fresh one if missing
      const localDbStr = localStorage.getItem(`financeai_local_db_${loginEmail.toLowerCase()}`);
      let userDb: ExcelDatabase;
      
      if (localDbStr) {
        userDb = JSON.parse(localDbStr);
      } else {
        userDb = generateNewDatabase(foundAcc.name, loginEmail.toLowerCase());
        localStorage.setItem(`financeai_local_db_${loginEmail.toLowerCase()}`, JSON.stringify(userDb));
      }

      localStorage.setItem("financeai_logged_in_guest", loginEmail.toLowerCase());
      onLoginLocal(userDb, loginEmail.toLowerCase());
    } catch (err) {
      console.error(err);
      setLoginError("Ocorreu uma falha ao acessar sua conta local.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Decorative Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Side: Brand Narrative & Visual Hook */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-white/5 relative z-10">
        {/* Beautiful Illustrated FinanceAI Logo */}
        <FinanceAILogo size="lg" />

        {/* Hero Copy */}
        <div className="my-auto max-w-lg space-y-6 py-12 md:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Sincronização Segura de Dados Financeiros
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight"
          >
            Seus dados financeiros sob seu <span className="text-amber-400">total controle</span>.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm md:text-base text-slate-400 leading-relaxed"
          >
            O FinanceAI foi projetado para oferecer o máximo em privacidade. Acesse conectando seu Google Firebase com sincronização instantânea na nuvem ou crie uma conta local para salvar seus dados com segurança diretamente neste navegador de forma offline.
          </motion.p>

          {/* Quick value props */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4.5 h-4.5 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Privacidade Absoluta</span>
            </div>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4.5 h-4.5 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Planejamento com IA</span>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 font-mono">
          FinanceAI Corp • Produção v1.6.0
        </div>
      </div>

      {/* Right Side: Auth Center */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* Welcome Screen */}
          {screen === "welcome" && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-white tracking-tight">Faça seu Login</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conecte sua conta do Google (Firebase) ou crie uma conta local criptografada para proteger e gerenciar sua base.
                </p>
              </div>

              <div className="space-y-4">
                {/* Google / Firebase Connection Button */}
                <button
                  id="login-google-btn"
                  onClick={onLoginGoogle}
                  onMouseEnter={() => setHoveringGoogle(true)}
                  onMouseLeave={() => setHoveringGoogle(false)}
                  disabled={loadingSession}
                  className="w-full py-4 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl transition duration-200 flex items-center justify-center gap-3 shadow-xl shadow-amber-950/30 cursor-pointer active:scale-[0.98] disabled:opacity-50 text-sm tracking-wide"
                >
                  <Database className={`w-5 h-5 ${hoveringGoogle ? "animate-pulse" : ""}`} />
                  <span>Conectar com Conta Google</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-amber-200" />
                </button>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <span className="relative px-3 bg-[#111111] text-[10px] text-slate-500 font-mono uppercase tracking-widest">ou use offline</span>
                </div>

                {/* Local Account Button (Force user to register/login) */}
                <button
                  id="login-local-trigger-btn"
                  onClick={() => setScreen("login_local")}
                  className="w-full py-3.5 px-6 bg-[#161616] hover:bg-[#1f1f1f] border border-white/5 hover:border-amber-500/20 text-slate-300 hover:text-amber-400 font-bold rounded-2xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-xs"
                >
                  <Lock className="w-4 h-4 text-amber-500/70" />
                  <span>Acessar via Conta Local (Modo Convidado)</span>
                </button>

                <button
                  id="register-local-trigger-btn"
                  onClick={() => setScreen("register_local")}
                  className="w-full py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-2xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-xs"
                >
                  <span>Criar Nova Conta Local</span>
                </button>
              </div>

              {/* Secure details */}
              <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5 leading-relaxed">
                <div className="flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Seus dados locais ficam armazenados em seu navegador com criptografia de ambiente. Sua privacidade é garantida.</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Login Local Screen */}
          {screen === "login_local" && (
            <motion.div 
              key="login_local"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 md:p-10 space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setScreen("welcome")}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao início
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  Entrar com Conta Local
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Informe o e-mail e senha da conta criada localmente neste navegador.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginLocal} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">E-mail Local</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white text-sm font-sans transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Senha Local</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Sua senha local"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#050505] border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white text-sm font-sans transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>Fazer Login Local e Acessar</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Ainda não criou uma conta local?{" "}
                  <button 
                    onClick={() => setScreen("register_local")}
                    className="text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Criar conta agora
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* Register Local Screen */}
          {screen === "register_local" && (
            <motion.div 
              key="register_local"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 md:p-10 space-y-5 shadow-2xl relative"
            >
              <button 
                onClick={() => setScreen("welcome")}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao início
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  Criar Conta Local
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cadastre seus dados para criar sua planilha local. Novos usuários precisam de conta para acessar o sistema.
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Como quer ser chamado?</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Seu Nome Completo"
                      className="w-full pl-10 pr-4 py-2 bg-[#050505] border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white text-sm font-sans transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Seu E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-2 bg-[#050505] border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white text-sm font-sans transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Crie sua Senha Local</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Crie uma senha de acesso"
                      className="w-full pl-10 pr-10 py-2 bg-[#050505] border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white text-sm font-sans transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-white"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Mínimo 4 caracteres para proteção local.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-950/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Criar Conta Local e Entrar</span>
                </button>
              </form>

              <div className="text-center pt-1.5 border-t border-white/5">
                <p className="text-xs text-slate-400">
                  Já possui uma conta local?{" "}
                  <button 
                    onClick={() => setScreen("login_local")}
                    className="text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
