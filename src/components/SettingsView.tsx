import React, { useState } from "react";
import { User, Shield, RefreshCw, Settings, Info, Cloud, Database, Sparkles } from "lucide-react";
import { ExcelDatabase, Profile, Settings as SettingsType } from "../types";

interface SettingsProps {
  data: ExcelDatabase;
  firebaseUser: any;
  onLoginFirebase: () => void;
  onLogoutFirebase: () => void;
  onUpdateProfile: (prof: Partial<Profile>) => void;
  onUpdateSettings: (set: Partial<SettingsType>) => void;
  onResetDatabase: () => void;
}

export default function SettingsView({ 
  data, 
  firebaseUser,
  onLoginFirebase,
  onLogoutFirebase,
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
              <Database className="w-4 h-4 text-amber-400" />
              Conexões de Nuvem
            </h3>

            {/* Firebase Cloud Card */}
            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4" id="firebase-connection-card">
              <div className="flex items-start gap-3">
                <Database className={`w-8 h-8 ${firebaseUser ? "text-amber-400" : "text-slate-500"} shrink-0`} />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {firebaseUser ? "Firebase Firestore Ativo" : "Firebase Firestore Desconectado"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {firebaseUser ? (
                      <span>
                        Sua conta está conectada via Google como <strong>{firebaseUser.displayName || "Usuário"}</strong> ({firebaseUser.email}). Seus dados estão sincronizados em tempo real no banco de dados distribuído globalmente do Firebase Firestore.
                      </span>
                    ) : (
                      "Conecte sua conta do Google para utilizar a nuvem escalável e segura do Firebase Firestore com sincronização instantânea em múltiplos dispositivos."
                    )}
                  </p>
                </div>
              </div>

              {firebaseUser ? (
                <div className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-2xl text-xs leading-relaxed flex gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Sincronização em tempo real ativa no Firebase Firestore. Sinta-se à vontade para gerenciar seus dados com total segurança.</span>
                  </div>
                  <button
                    id="firebase-disconnect-btn"
                    onClick={onLogoutFirebase}
                    className="w-full py-2.5 bg-[#1f1612] hover:bg-[#2c1d14] border border-amber-500/20 text-amber-400 font-bold rounded-xl text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Desconectar Conta Google
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    id="firebase-connect-btn"
                    onClick={onLoginFirebase}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 animate-pulse"
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
