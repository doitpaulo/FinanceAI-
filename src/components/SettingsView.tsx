import React, { useState } from "react";
import { User, Shield, RefreshCw, Settings, Info, Cloud } from "lucide-react";
import { ExcelDatabase, Profile, Settings as SettingsType } from "../types";

interface SettingsProps {
  data: ExcelDatabase;
  session: { authenticated: boolean; user?: { name: string; email: string; userId: string } };
  onLoginMicrosoft: () => void;
  onLogoutMicrosoft: () => void;
  onUpdateProfile: (prof: Partial<Profile>) => void;
  onUpdateSettings: (set: Partial<SettingsType>) => void;
  onResetDatabase: () => void;
}

export default function SettingsView({ 
  data, 
  session, 
  onLoginMicrosoft, 
  onLogoutMicrosoft, 
  onUpdateProfile, 
  onUpdateSettings, 
  onResetDatabase 
}: SettingsProps) {
  const [name, setName] = useState(data.profile.name);
  const [financialGoal, setFinancialGoal] = useState(data.profile.financialGoal);
  const [incomeType, setIncomeType] = useState(data.profile.incomeType);
  const [payFrequency, setPayFrequency] = useState(data.profile.payFrequency);
  const [riskProfile, setRiskProfile] = useState(data.profile.riskProfile);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      financialGoal,
      incomeType,
      payFrequency,
      riskProfile
    });
    alert("Perfil atualizado no Excel simulado com sucesso!");
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-view">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Profile Setup */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Configurações de Perfil
          </h3>

          <form onSubmit={handleProfileSubmit} className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4" id="settings-profile-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Nome</label>
                <input
                  id="settings-name-input"
                  type="text"
                  className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-sans text-white transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">E-mail</label>
                <input
                  id="settings-email-input"
                  type="email"
                  className="w-full px-3 py-2 bg-[#050505]/40 border border-white/5 rounded-xl outline-none text-sm font-sans text-slate-400 cursor-not-allowed"
                  value={data.profile.email}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Objetivo Geral Financeiro</label>
              <input
                id="settings-goal-input"
                type="text"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-sans text-white transition"
                value={financialGoal}
                onChange={(e) => setFinancialGoal(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Tipo de Renda</label>
                <select
                  id="settings-income-type"
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
                  id="settings-frequency"
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
                  id="settings-risk"
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

            <div className="pt-2 flex justify-end">
              <button
                id="save-profile-button"
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-sm transition cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Connections & Reset options */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Cloud className="w-4 h-4 text-indigo-400" />
              Conexões de Nuvem
            </h3>

            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Cloud className={`w-8 h-8 ${session.authenticated ? "text-emerald-400" : "text-indigo-400"} shrink-0`} />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {session.authenticated ? "Microsoft OneDrive Ativo" : "Microsoft OneDrive Desconectado"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {session.authenticated ? (
                      <span>
                        Sua conta está conectada como <strong>{session.user?.name}</strong> ({session.user?.email}). Seus dados estão sendo salvos e lidos diretamente no seu OneDrive em: <code className="text-indigo-400 bg-white/5 px-1.5 py-0.5 rounded font-mono">/FinanceAI/finance_data.json</code>
                      </span>
                    ) : (
                      "Atualmente você está rodando no Modo de Simulação Local. Conecte sua conta da Microsoft para criar e sincronizar sua base de dados diretamente com seus arquivos no OneDrive."
                    )}
                  </p>
                </div>
              </div>

              {session.authenticated ? (
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-2xl text-xs leading-relaxed flex gap-2">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Sincronização em Nuvem Ativa. Seus dados estão salvos com segurança e persistência total em sua conta Microsoft pessoal.</span>
                  </div>
                  <button
                    id="microsoft-disconnect-btn"
                    onClick={onLogoutMicrosoft}
                    className="w-full py-2.5 bg-[#1f1215] hover:bg-[#2c141a] border border-rose-500/20 text-rose-400 font-bold rounded-xl text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Desconectar Conta Microsoft
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-4 rounded-2xl text-xs leading-relaxed flex gap-2">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Ao conectar, criaremos uma pasta segura no seu OneDrive para gerenciar e persistir sua base de dados em formato JSON.</span>
                  </div>
                  <button
                    id="microsoft-connect-btn"
                    onClick={onLoginMicrosoft}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                  >
                    <Cloud className="w-4 h-4" />
                    Conectar com Microsoft OneDrive
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

            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Resetar Banco de Dados</h4>
                <p className="text-xs text-slate-400">
                  Isso irá redefinir todas as contas, cartões, receitas, despesas e transações para os dados iniciais do seed original.
                </p>
              </div>

              <button
                id="reset-db-button"
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

      </div>

    </div>
  );
}
