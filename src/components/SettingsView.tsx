import React, { useState, useEffect, useRef } from "react";
import { User, Shield, RefreshCw, Settings, Info, Cloud, Database, Sparkles, Camera, Check, Sliders, HelpCircle, Bell, SlidersHorizontal } from "lucide-react";
import { ExcelDatabase, Profile, Settings as SettingsType } from "../types";

interface SettingsProps {
  data: ExcelDatabase;
  firebaseUser: any;
  onLoginFirebase: () => void;
  onLogoutFirebase: () => void;
  onUpdateProfile: (prof: Partial<Profile> & { expectedIncome?: number }) => void;
  onUpdateSettings: (set: Partial<SettingsType>) => void;
  onResetDatabase: () => void;
}

const AVATAR_PRESETS = ["👤", "🤖", "🦊", "🦁", "🦉", "🚀", "💰", "💸", "📈", "💎"];

export default function SettingsView({ 
  data, 
  firebaseUser,
  onLoginFirebase,
  onLogoutFirebase,
  onUpdateProfile, 
  onUpdateSettings, 
  onResetDatabase 
}: SettingsProps) {
  // Navigation within Settings view
  const [subTab, setSubTab] = useState<"profile" | "budget" | "system">("profile");

  // Profile data states
  const [name, setName] = useState(data.profile.name);
  const [financialGoal, setFinancialGoal] = useState(data.profile.financialGoal);
  const [incomeType, setIncomeType] = useState(data.profile.incomeType);
  const [payFrequency, setPayFrequency] = useState(data.profile.payFrequency);
  const [riskProfile, setRiskProfile] = useState(data.profile.riskProfile);
  const [dailySpendingLimit, setDailySpendingLimit] = useState(data.profile.dailySpendingLimit?.toString() || "");
  const [expectedIncome, setExpectedIncome] = useState(data.incomeSources[0]?.expectedValue?.toString() || "0");
  
  // Custom questionnaire states
  const [avatarUrl, setAvatarUrl] = useState(data.profile.avatarUrl || "");
  const [alertThreshold, setAlertThreshold] = useState<'silent' | 'moderate' | 'strict'>(data.profile.alertThreshold || "moderate");
  const [spendingPersona, setSpendingPersona] = useState<'poupador' | 'gastador' | 'investidor' | 'planejador'>(data.profile.spendingPersona || "planejador");
  const [mainSavingsFocus, setMainSavingsFocus] = useState<'debts' | 'investments' | 'leisure_cut' | 'reserve'>(data.profile.mainSavingsFocus || "reserve");
  const [showProactiveAIHints, setShowProactiveAIHints] = useState<boolean>(data.profile.showProactiveAIHints !== false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep state updated if database prop changes
  useEffect(() => {
    setName(data.profile.name);
    setFinancialGoal(data.profile.financialGoal || "");
    setIncomeType(data.profile.incomeType || "CLT");
    setPayFrequency(data.profile.payFrequency || "mensal");
    setRiskProfile(data.profile.riskProfile || "moderado");
    setDailySpendingLimit(data.profile.dailySpendingLimit?.toString() || "");
    setExpectedIncome(data.incomeSources[0]?.expectedValue?.toString() || "0");
    setAvatarUrl(data.profile.avatarUrl || "");
    setAlertThreshold(data.profile.alertThreshold || "moderate");
    setSpendingPersona(data.profile.spendingPersona || "planejador");
    setMainSavingsFocus(data.profile.mainSavingsFocus || "reserve");
    setShowProactiveAIHints(data.profile.showProactiveAIHints !== false);
  }, [data.profile, data.incomeSources]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha uma foto de até 1.5 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (preset: string) => {
    setAvatarUrl(preset);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      financialGoal,
      incomeType,
      payFrequency,
      riskProfile,
      dailySpendingLimit: dailySpendingLimit ? parseFloat(dailySpendingLimit) : undefined,
      expectedIncome: expectedIncome ? parseFloat(expectedIncome) : undefined,
      avatarUrl,
      alertThreshold,
      spendingPersona,
      mainSavingsFocus,
      showProactiveAIHints
    });
    alert("Perfil de usuário e preferências de co-piloto ajustados com sucesso!");
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-view">
      
      {/* Settings Navigation Sub-tabs */}
      <div className="flex border-b border-white/10 gap-2 pb-px" id="settings-subtabs">
        <button
          type="button"
          onClick={() => setSubTab("profile")}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-all relative ${
            subTab === "profile" 
              ? "text-indigo-400 border-b-2 border-indigo-500" 
              : "text-slate-400 hover:text-white"
          }`}
          id="subtab-profile-config"
        >
          Meu Perfil
        </button>
        <button
          type="button"
          onClick={() => setSubTab("budget")}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-all relative ${
            subTab === "budget" 
              ? "text-indigo-400 border-b-2 border-indigo-500" 
              : "text-slate-400 hover:text-white"
          }`}
          id="subtab-budget-config"
        >
          Orçamento & Alertas
        </button>
        <button
          type="button"
          onClick={() => setSubTab("system")}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-all relative ${
            subTab === "system" 
              ? "text-indigo-400 border-b-2 border-indigo-500" 
              : "text-slate-400 hover:text-white"
          }`}
          id="subtab-system-config"
        >
          Nuvem & Sistema
        </button>
      </div>

      {subTab === "profile" ? (
        <form onSubmit={handleProfileSubmit} className="space-y-6" id="settings-profile-form">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Avatar & Presets */}
            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center space-y-6" id="profile-photo-panel">
              <div className="text-center space-y-2 w-full">
                <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Foto de Perfil</h4>
                <p className="text-[10px] text-slate-400">Escolha um avatar ou envie sua própria foto</p>
              </div>

              {/* Avatar Preview */}
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} id="avatar-preview-container">
                {avatarUrl ? (
                  avatarUrl.length > 2 ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-28 h-28 rounded-full border-2 border-indigo-500 object-cover shadow-lg shadow-indigo-950/20" 
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full border-2 border-indigo-500 bg-indigo-950/30 text-white flex items-center justify-center text-5xl shadow-lg">
                      {avatarUrl}
                    </div>
                  )
                ) : (
                  <div className="w-28 h-28 rounded-full border-2 border-slate-700 bg-[#050505] text-slate-400 flex items-center justify-center text-xl font-bold uppercase">
                    {name ? name.substring(0, 2).toUpperCase() : "AI"}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Invisible File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs border border-white/10 transition cursor-pointer"
              >
                Enviar Foto Personalizada
              </button>

              {/* Presets Grid */}
              <div className="w-full space-y-3 pt-4 border-t border-white/5">
                <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center font-bold">Predefinições Rápidas</h5>
                <div className="grid grid-cols-5 gap-2" id="avatar-presets-grid">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg hover:bg-white/5 transition border cursor-pointer ${
                        avatarUrl === preset ? "bg-indigo-600/10 border-indigo-500/50" : "bg-[#050505] border-white/5"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: User Details and Questionnaire */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Box 1: Core Fields */}
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  Dados Cadastrais
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Nome</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition font-sans"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">E-mail</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-[#050505]/40 border border-white/5 rounded-xl outline-none text-sm text-slate-400 cursor-not-allowed font-sans"
                      value={data.profile.email}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Objetivo Geral Financeiro</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition font-sans"
                    value={financialGoal}
                    onChange={(e) => setFinancialGoal(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Renda Mensal Prevista (R$)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition font-mono"
                      value={expectedIncome}
                      onChange={(e) => setExpectedIncome(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Limite Diário de Gastos (R$)</label>
                    <input
                      type="number"
                      placeholder="Deixe em branco para sem teto"
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition font-mono"
                      value={dailySpendingLimit}
                      onChange={(e) => setDailySpendingLimit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Tipo de Renda</label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-sm text-white"
                      value={incomeType}
                      onChange={(e) => setIncomeType(e.target.value as any)}
                    >
                      <option value="CLT">CLT / Fixo</option>
                      <option value="variavel">Variável (Freelance / Bônus)</option>
                      <option value="misto">Misto</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Frequência</label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-sm text-white"
                      value={payFrequency}
                      onChange={(e) => setPayFrequency(e.target.value as any)}
                    >
                      <option value="mensal">Mensal</option>
                      <option value="semanal">Semanal</option>
                      <option value="diario">Diário</option>
                      <option value="variavel">Variável</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Perfil de Risco</label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-sm text-white"
                      value={riskProfile}
                      onChange={(e) => setRiskProfile(e.target.value as any)}
                    >
                      <option value="conservador">Conservador</option>
                      <option value="moderado">Moderado</option>
                      <option value="agressivo">Agressivo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Box 2: Copilot Personalized Questionnaire */}
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4" id="copilot-questions-panel">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Personalização do Co-Piloto Adaptativo
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Responda a estas perguntas de perfil para que o sistema ative popups, dicas e heurísticas proativas totalmente personalizadas para você.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  {/* Q1: Spending Persona */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Como você se considera ao gastar?
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-sm text-white"
                      value={spendingPersona}
                      onChange={(e) => setSpendingPersona(e.target.value as any)}
                    >
                      <option value="poupador">Poupador Extremo (Economiza muito)</option>
                      <option value="planejador">Planejador Consciente (Tenta seguir regras)</option>
                      <option value="investidor">Investidor de Longo Prazo (Preza rentabilidade)</option>
                      <option value="gastador">Gastador Emocional (Cai em compras por impulso)</option>
                    </select>
                    <span className="text-[10px] text-slate-500 block leading-tight">Muda as advertências de cada despesa no popup.</span>
                  </div>

                  {/* Q2: Alert Sensibility */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      Sensibilidade de Alertas de Gastos
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-sm text-white"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(e.target.value as any)}
                    >
                      <option value="strict">Rígido (Alertar com 50% do limite diário)</option>
                      <option value="moderate">Moderado (Alertar com 80% do limite diário)</option>
                      <option value="silent">Silencioso (Apenas se passar de 100%)</option>
                    </select>
                    <span className="text-[10px] text-slate-500 block leading-tight">Configura quando os alertas invasivos serão disparados.</span>
                  </div>

                  {/* Q3: Savings Focus */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                      Maior Prioridade Financeira Atual
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-sm text-white"
                      value={mainSavingsFocus}
                      onChange={(e) => setMainSavingsFocus(e.target.value as any)}
                    >
                      <option value="reserve">Formar minha Reserva de Emergência</option>
                      <option value="debts">Quitar Dívidas e Empréstimos</option>
                      <option value="investments">Aumentar Aportes em Investimentos</option>
                      <option value="leisure_cut">Cortar gastos com delivery e lazer supérfluo</option>
                    </select>
                    <span className="text-[10px] text-slate-500 block leading-tight">Gera dicas específicas nos popups de confirmação de gastos.</span>
                  </div>

                  {/* Q4: Proactive AI hints */}
                  <div className="space-y-2 flex flex-col justify-between text-left">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        Conselhos e Dicas Proativas
                      </label>
                      <p className="text-[10px] text-slate-500 leading-tight mt-1">
                        Habilitar conselhos do co-piloto e caixas de diálogo proativas no topo da tela do início.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowProactiveAIHints(!showProactiveAIHints)}
                        className={`w-12 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none relative flex items-center ${
                          showProactiveAIHints ? "bg-indigo-600" : "bg-white/10"
                        }`}
                      >
                        <div 
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                            showProactiveAIHints ? "translate-x-6" : "translate-x-0"
                          }`} 
                        />
                      </button>
                      <span className="text-xs font-mono text-slate-300">
                        {showProactiveAIHints ? "Habilitado" : "Desabilitado"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-900/10 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Perfil & Co-Piloto
                </button>
              </div>

            </div>

          </div>
        </form>
      ) : (
        /* Cloud Connections & Reset options */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="settings-system-panel">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Conexão Nuvem Firebase Firestore
              </h3>

              <div className="flex items-start gap-4">
                <Database className={`w-10 h-10 ${firebaseUser ? "text-amber-400" : "text-slate-600"} shrink-0 mt-1`} />
                <div className="space-y-2 text-left">
                  <h4 className="text-sm font-bold text-white">
                    {firebaseUser ? "Firebase Cloud Sync Ativo" : "Firebase Cloud Sync Desconectado"}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {firebaseUser ? (
                      <span>
                        Sua conta está conectada via Google como <strong>{firebaseUser.displayName || "Usuário"}</strong> ({firebaseUser.email}). Todos os dados estão seguros e sincronizados automaticamente na nuvem Firebase Firestore.
                      </span>
                    ) : (
                      "Conecte sua conta do Google para utilizar a nuvem escalável e segura do Firebase Firestore com sincronização instantânea em múltiplos dispositivos."
                    )}
                  </p>
                </div>
              </div>

              {firebaseUser ? (
                <div className="space-y-3 pt-2">
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-2xl text-xs leading-relaxed flex gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Sincronização em tempo real ativa no Firebase Firestore. Sinta-se à vontade para gerenciar seus dados com total segurança.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onLogoutFirebase}
                    className="py-2.5 px-5 bg-[#1f1612] hover:bg-[#2c1d14] border border-amber-500/20 text-amber-400 font-bold rounded-xl text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Desconectar Conta Google
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onLoginFirebase}
                    className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-950/25"
                  >
                    <div className="flex items-center justify-center w-4.5 h-4.5 bg-white rounded-full shrink-0">
                      <span className="text-[10px] font-black text-slate-950 font-sans">G</span>
                    </div>
                    Conectar com Conta Google
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400" />
              Ações Críticas
            </h3>

            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4 text-left">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Resetar Banco de Dados</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Isso irá redefinir todas as contas, cartões, receitas, despesas e transações para os dados iniciais do seed original.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Tem certeza que deseja apagar todas as modificações e restaurar os dados de fábrica?")) {
                    onResetDatabase();
                  }
                }}
                className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold rounded-xl text-xs tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Base para Padrão
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
