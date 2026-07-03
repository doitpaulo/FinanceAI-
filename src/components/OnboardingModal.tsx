import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DollarSign, Goal, ShieldAlert, ArrowRight, User, Calculator } from "lucide-react";
import { Profile } from "../types";

export interface OnboardingData {
  name: string;
  incomeType: Profile["incomeType"];
  payFrequency: Profile["payFrequency"];
  financialGoal: string;
  riskProfile: Profile["riskProfile"];
  monthlyIncome: number;
  currentSavings: number;
  monthlyExpenses: number;
}

interface OnboardingModalProps {
  onComplete: (data: OnboardingData) => void;
  defaultName?: string;
}

export default function OnboardingModal({ onComplete, defaultName = "" }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(defaultName);
  const [incomeType, setIncomeType] = useState<Profile["incomeType"]>("CLT");
  const [payFrequency, setPayFrequency] = useState<Profile["payFrequency"]>("mensal");
  const [financialGoal, setFinancialGoal] = useState("");
  const [riskProfile, setRiskProfile] = useState<Profile["riskProfile"]>("moderado");
  
  // Real numbers for adaptation
  const [monthlyIncome, setMonthlyIncome] = useState<number>(6500);
  const [currentSavings, setCurrentSavings] = useState<number>(12000);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(1500);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      onComplete({
        name: name || defaultName || "Visitante",
        incomeType,
        payFrequency,
        financialGoal: financialGoal || "Formar reserva de emergência e poupar",
        riskProfile,
        monthlyIncome: Number(monthlyIncome) || 0,
        currentSavings: Number(currentSavings) || 0,
        monthlyExpenses: Number(monthlyExpenses) || 0
      });
    }
  };

  const stepsContent = [
    {
      title: "Boas-vindas ao FinanceAI",
      description: "Vamos configurar seu Sistema Operacional Financeiro pessoal. Para começar, nos diga seu nome.",
      icon: <User className="w-12 h-12 text-indigo-400" />,
      component: (
        <div className="space-y-4 text-left">
          <label className="block text-sm font-bold text-slate-400">Como prefere ser chamado?</label>
          <input
            id="onboarding-name-input"
            type="text"
            className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-white font-sans transition"
            placeholder="Ex: Paulo Henrique"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )
    },
    {
      title: "Origem e Frequência de Renda",
      description: "Para criarmos projeções de fluxo de caixa, precisamos entender como e quando você recebe.",
      icon: <DollarSign className="w-12 h-12 text-indigo-400" />,
      component: (
        <div className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-400">Qual é o seu tipo de receita?</label>
            <div className="grid grid-cols-3 gap-3">
              {(["CLT", "variavel", "misto"] as const).map((type) => (
                <button
                   id={`onboarding-type-${type}`}
                   key={type}
                   type="button"
                   onClick={() => setIncomeType(type)}
                   className={`py-3 px-2 text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                    incomeType === type
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                      : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {type === "CLT" ? "CLT / Fixo" : type === "variavel" ? "Variável" : "Misto"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-400">Com que frequência você recebe?</label>
            <div className="grid grid-cols-2 gap-3">
              {(["mensal", "semanal", "diario", "variavel"] as const).map((freq) => (
                <button
                  id={`onboarding-freq-${freq}`}
                  key={freq}
                  type="button"
                  onClick={() => setPayFrequency(freq)}
                  className={`py-3 px-4 text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                    payFrequency === freq
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                      : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Sua Realidade Financeira",
      description: "Insira seus dados financeiros básicos para criarmos uma planilha 100% personalizada para sua vida real.",
      icon: <Calculator className="w-12 h-12 text-indigo-400" />,
      component: (
        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">1. Renda Mensal Líquida Média (R$)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500 text-sm font-bold">R$</span>
              <input
                id="onboarding-income-val"
                type="number"
                min="0"
                className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-white font-sans font-semibold transition"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
            <p className="text-[10px] text-slate-500">Insira seu salário líquido ou média de faturamento mensal.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">2. Quanto já tem Guardado/Investido (R$)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500 text-sm font-bold">R$</span>
              <input
                id="onboarding-savings-val"
                type="number"
                min="0"
                className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-white font-sans font-semibold transition"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
            <p className="text-[10px] text-slate-500">Seu saldo atual somando contas, poupança e investimentos.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">3. Despesas Fixas Mensais Estimadas (R$)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500 text-sm font-bold">R$</span>
              <input
                id="onboarding-expenses-val"
                type="number"
                min="0"
                className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-white font-sans font-semibold transition"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
            <p className="text-[10px] text-slate-500">Aluguel, contas fixas, assinaturas, compras de rotina básicas.</p>
          </div>
        </div>
      )
    },
    {
      title: "Objetivo Principal",
      description: "Qual é o seu maior foco ou sonho financeiro no momento?",
      icon: <Goal className="w-12 h-12 text-indigo-400" />,
      component: (
        <div className="space-y-4 text-left">
          <label className="block text-sm font-bold text-slate-400">Seu objetivo de vida financeiro</label>
          <input
            id="onboarding-goal-input"
            type="text"
            className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-white font-sans transition"
            placeholder="Ex: Reserva de Emergência ou Comprar Apartamento"
            value={financialGoal}
            onChange={(e) => setFinancialGoal(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            {["Formar Reserva de Emergência", "Comprar um Apartamento", "Quitar minhas Dívidas", "Iniciar nos Investimentos"].map((suggestion) => (
              <button
                id={`onboarding-suggest-${suggestion.replace(/\s+/g, '-').toLowerCase()}`}
                key={suggestion}
                type="button"
                onClick={() => setFinancialGoal(suggestion)}
                className="text-left text-xs font-bold text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-white/10 py-2 px-3 rounded-lg border border-white/10 transition cursor-pointer"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Perfil de Risco",
      description: "Como você se comporta em relação a volatilidade e investimentos?",
      icon: <ShieldAlert className="w-12 h-12 text-indigo-400" />,
      component: (
        <div className="space-y-4 text-left">
          <label className="block text-sm font-bold text-slate-400">Escolha o perfil ideal</label>
          <div className="space-y-3">
            {(["conservador", "moderado", "agressivo"] as const).map((profile) => (
              <button
                id={`onboarding-risk-${profile}`}
                key={profile}
                type="button"
                onClick={() => setRiskProfile(profile)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  riskProfile === profile
                    ? "border-indigo-500 bg-indigo-500/10 text-white"
                    : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <div className="font-bold text-sm">
                  {profile === "conservador" && "Conservador"}
                  {profile === "moderado" && "Moderado"}
                  {profile === "agressivo" && "Arrojado"}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  {profile === "conservador" && "Foco absoluto em segurança, liquidez diária e preservação de capital."}
                  {profile === "moderado" && "Equilíbrio entre segurança e crescimento, aceitando pequenas flutuações por melhor retorno."}
                  {profile === "agressivo" && "Busca de retorno de longo prazo focado em ações, criptomoedas e patrimônio de risco."}
                </div>
              </button>
            ))}
          </div>
        </div>
      )
    }
  ];

  const currentStepData = stepsContent[step - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <motion.div
        id="onboarding-modal-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden relative"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-2xl">
            {currentStepData.icon}
          </div>
          <h2 className="text-xl font-display font-bold tracking-tight text-white mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-sm text-slate-400">
            {currentStepData.description}
          </p>
        </div>

        <div className="my-6 min-h-[160px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -15, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {currentStepData.component}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
          <div className="flex gap-1.5">
            {stepsContent.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === step
                    ? "w-6 bg-indigo-500"
                    : i + 1 < step
                    ? "w-2 bg-indigo-700"
                    : "w-2 bg-white/10"
                }`}
              />
            ))}
          </div>

          <button
            id="onboarding-next-button"
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl transition duration-150 cursor-pointer"
          >
            {step === 5 ? "Concluir" : "Avançar"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
