/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Award, AlertCircle, ArrowUpRight, TrendingUp, Trash2, Pencil, Check, X, Sparkles } from "lucide-react";
import { ExcelDatabase, Goal } from "../types";
import { safePercent } from "../lib/calculations";

interface MetasProps {
  data: ExcelDatabase;
  onAddGoal: (goal: Omit<Goal, "id">) => void;
  onDeleteGoal?: (id: string) => void;
  onEditGoal?: (id: string, goal: Partial<Goal>) => void;
}

export default function MetasView({ data, onAddGoal, onDeleteGoal, onEditGoal }: MetasProps) {
  // New Goal Form State
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [savingPlanValue, setSavingPlanValue] = useState("");
  const [savingPlanFrequency, setSavingPlanFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");

  // Editing Goal State
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editCurrent, setEditCurrent] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editSavingPlanValue, setEditSavingPlanValue] = useState("");
  const [editSavingPlanFrequency, setEditSavingPlanFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const tgt = parseFloat(target);
    if (!name.trim()) return;
    if (isNaN(tgt) || tgt <= 0) {
      alert("Por favor, preencha um valor alvo maior que zero.");
      return;
    }
    onAddGoal({
      name,
      targetValue: tgt,
      currentValue: parseFloat(current) || 0,
      deadline: deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority,
      status: "active",
      savingPlanValue: savingPlanValue ? parseFloat(savingPlanValue) : undefined,
      savingPlanFrequency: savingPlanValue ? savingPlanFrequency : undefined
    });
    setName("");
    setTarget("");
    setCurrent("");
    setDeadline("");
    setSavingPlanValue("");
    setSavingPlanFrequency("monthly");
  };

  const startEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditName(goal.name);
    setEditTarget(goal.targetValue.toString());
    setEditCurrent(goal.currentValue.toString());
    setEditDeadline(goal.deadline);
    setEditPriority(goal.priority);
    setEditSavingPlanValue(goal.savingPlanValue ? goal.savingPlanValue.toString() : "");
    setEditSavingPlanFrequency(goal.savingPlanFrequency || "monthly");
  };

  const saveEditGoal = () => {
    const tgt = parseFloat(editTarget);
    const curr = parseFloat(editCurrent);
    if (!editName.trim()) return;
    if (isNaN(tgt) || tgt <= 0) {
      alert("Por favor, preencha um valor alvo maior que zero.");
      return;
    }

    if (onEditGoal && editingGoalId) {
      onEditGoal(editingGoalId, {
        name: editName,
        targetValue: tgt,
        currentValue: isNaN(curr) ? 0 : curr,
        deadline: editDeadline,
        priority: editPriority,
        savingPlanValue: editSavingPlanValue ? parseFloat(editSavingPlanValue) : undefined,
        savingPlanFrequency: editSavingPlanValue ? editSavingPlanFrequency : undefined
      });
    }
    setEditingGoalId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="metas-view">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Goals Progress Lists */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            Meus Sonhos e Objetivos Ativos
          </h3>

          <div className="space-y-4">
            {(data.goals || []).map(goal => {
              const progressPct = safePercent(goal.currentValue, goal.targetValue);
              const remainingValue = goal.targetValue - goal.currentValue;
              
              // Calculate remaining days, weeks, and months
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const deadlineDate = new Date(goal.deadline);
              deadlineDate.setHours(0, 0, 0, 0);
              
              const diffTime = deadlineDate.getTime() - today.getTime();
              const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
              
              const requiredDaily = remainingValue > 0 ? remainingValue / diffDays : 0;
              const requiredWeekly = remainingValue > 0 ? remainingValue / Math.max(1, diffDays / 7) : 0;
              const requiredMonthly = remainingValue > 0 ? remainingValue / Math.max(1, diffDays / 30.41) : 0;

              return (
                <div 
                  id={`goal-view-item-${goal.id}`}
                  key={goal.id} 
                  className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4 relative overflow-hidden"
                >
                  {editingGoalId === goal.id ? (
                    // Editing Form for individual goal
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-slate-500 uppercase">Nome da Meta</label>
                          <input
                            type="text"
                            className="w-full px-2.5 py-1.5 bg-[#050505] border border-white/15 rounded-xl text-xs text-white"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-slate-500 uppercase">Valor Alvo (R$)</label>
                          <input
                            type="number"
                            className="w-full px-2.5 py-1.5 bg-[#050505] border border-white/15 rounded-xl text-xs text-white font-mono"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-slate-500 uppercase">Valor já Guardado (R$)</label>
                          <input
                            type="number"
                            className="w-full px-2.5 py-1.5 bg-[#050505] border border-white/15 rounded-xl text-xs text-white font-mono"
                            value={editCurrent}
                            onChange={(e) => setEditCurrent(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-slate-500 uppercase">Prazo Limite</label>
                          <input
                            type="date"
                            className="w-full px-2.5 py-1.5 bg-[#050505] border border-white/15 rounded-xl text-xs text-white"
                            value={editDeadline}
                            onChange={(e) => setEditDeadline(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-slate-500 uppercase">Pretende Guardar (R$)</label>
                          <input
                            type="number"
                            placeholder="Opcional"
                            className="w-full px-2.5 py-1.5 bg-[#050505] border border-white/15 rounded-xl text-xs text-white font-mono"
                            value={editSavingPlanValue}
                            onChange={(e) => setEditSavingPlanValue(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-slate-500 uppercase">Frequência Planejada</label>
                          <select
                            className="w-full px-2.5 py-1.5 bg-[#050505] border border-white/15 rounded-xl text-xs text-white"
                            value={editSavingPlanFrequency}
                            onChange={(e) => setEditSavingPlanFrequency(e.target.value as any)}
                          >
                            <option value="daily">Diário</option>
                            <option value="weekly">Semanal</option>
                            <option value="monthly">Mensal</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-500 uppercase">Prioridade da Meta</label>
                        <select
                          className="px-2.5 py-1.5 bg-[#050505] border border-white/15 rounded-xl text-xs text-white"
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as any)}
                        >
                          <option value="low">Baixa</option>
                          <option value="medium">Média</option>
                          <option value="high">Alta (Importante)</option>
                        </select>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={saveEditGoal}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Salvar Alterações
                        </button>
                        <button
                          onClick={() => setEditingGoalId(null)}
                          className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal display of Goal card
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-display font-bold text-white mb-1">
                            {goal.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold font-mono border ${
                              goal.priority === "high" 
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                                : goal.priority === "medium"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                            }`}>
                              Prioridade {goal.priority === "high" ? "Alta" : goal.priority === "medium" ? "Média" : "Baixa"}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              Prazo: {goal.deadline && typeof goal.deadline === "string" && goal.deadline.includes("-") ? goal.deadline.split("-").reverse().join("/") : (goal.deadline || "")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-xl font-display font-bold text-indigo-400 font-mono">
                              {progressPct}%
                            </div>
                            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Concluído</div>
                          </div>

                          <div className="flex flex-col gap-1 ml-2">
                            {onEditGoal && (
                              <button
                                onClick={() => startEditGoal(goal)}
                                className="text-slate-500 hover:text-indigo-400 p-1.5 hover:bg-white/5 rounded-lg transition cursor-pointer"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteGoal && (
                              <button
                                id={`delete-goal-${goal.id}`}
                                onClick={() => onDeleteGoal(goal.id)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-white/5 rounded-lg transition cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar tracker */}
                      <div className="space-y-1">
                        <div className="w-full bg-[#050505] h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 font-mono pt-1">
                          <span>R$ {goal.currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} salvos</span>
                          <span>Alvo: R$ {goal.targetValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {remainingValue > 0 ? (
                        <div className="space-y-3 pt-2">
                          {/* Required Savings Grid */}
                          <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 space-y-3">
                            <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                              Quanto você precisa guardar para alcançar a meta:
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
                                <div className="text-[9px] font-sans text-slate-500 font-medium">Diário</div>
                                <div className="text-xs font-mono font-bold text-white mt-1">
                                  R$ {requiredDaily.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
                                <div className="text-[9px] font-sans text-slate-500 font-medium">Semanal</div>
                                <div className="text-xs font-mono font-bold text-white mt-1">
                                  R$ {requiredWeekly.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
                                <div className="text-[9px] font-sans text-slate-500 font-medium">Mensal</div>
                                <div className="text-xs font-mono font-bold text-white mt-1">
                                  R$ {requiredMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-500 font-sans text-center">
                              Baseado em <span className="font-mono text-slate-400 font-semibold">{diffDays} dias</span> restantes até o prazo limite.
                            </div>
                          </div>

                          {/* Planned Savings & Engagement Insight */}
                          {goal.savingPlanValue ? (
                            (() => {
                              let planDailyEquivalent = 0;
                              if (goal.savingPlanFrequency === "daily") {
                                planDailyEquivalent = goal.savingPlanValue;
                              } else if (goal.savingPlanFrequency === "weekly") {
                                planDailyEquivalent = goal.savingPlanValue / 7;
                              } else {
                                planDailyEquivalent = goal.savingPlanValue / 30.41;
                              }

                              const isAhead = planDailyEquivalent >= requiredDaily;
                              const daysWithPlan = Math.ceil(remainingValue / planDailyEquivalent);
                              
                              let planDeadlineText = "";
                              if (daysWithPlan < 30) {
                                planDeadlineText = `${daysWithPlan} ${daysWithPlan === 1 ? "dia" : "dias"}`;
                              } else if (daysWithPlan < 365) {
                                const mos = Math.ceil(daysWithPlan / 30.41);
                                planDeadlineText = `${mos} ${mos === 1 ? "mês" : "meses"}`;
                              } else {
                                const yrs = (daysWithPlan / 365).toFixed(1);
                                planDeadlineText = `${yrs} ${parseFloat(yrs) === 1 ? "ano" : "anos"}`;
                              }

                              const freqLabel = goal.savingPlanFrequency === "daily" ? "por dia" : goal.savingPlanFrequency === "weekly" ? "por semana" : "por mês";

                              return (
                                <div className={`p-4 rounded-2xl border ${
                                  isAhead 
                                    ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                                    : "bg-amber-950/20 border-amber-500/20 text-amber-400"
                                } space-y-2`}>
                                  <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 animate-pulse shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-wider font-sans">
                                      Seu Plano de Economia Ativo
                                    </span>
                                  </div>
                                  
                                  <p className="text-xs font-sans text-slate-300">
                                    Seu objetivo é poupar <strong className="text-white font-mono">R$ {goal.savingPlanValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> {freqLabel}.
                                  </p>

                                  <div className="text-[11px] font-sans text-slate-300 pt-1.5 border-t border-white/5 flex flex-col gap-1">
                                    {isAhead ? (
                                      <>
                                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                                          🌟 Excelente ritmo! Você está no caminho certo!
                                        </span>
                                        <span>
                                          Mantendo este plano, você alcançará seu sonho em aproximadamente <strong className="text-white font-mono">{planDeadlineText}</strong>, antes do prazo estipulado!
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="font-bold text-amber-400 flex items-center gap-1">
                                          ⚠️ Atenção ao Prazo: Ritmo Abaixo do Necessário
                                        </span>
                                        <span>
                                          Neste plano, você levará cerca de <strong className="text-white font-mono">{planDeadlineText}</strong> para conquistar o sonho. Considere guardar um pouco mais ou adiar o prazo limite para garantir a conquista.
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center space-y-2">
                              <div className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                Nenhum plano de economia definido
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed max-w-md mx-auto">
                                Defina quanto você pretende guardar para comparar seu esforço planejado com as metas necessárias!
                              </p>
                              <button
                                onClick={() => startEditGoal(goal)}
                                className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer"
                              >
                                Definir Plano de Economia ⚡
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between text-emerald-400">
                          <span className="text-xs flex items-center gap-1.5 font-bold">
                            🎉 Meta Concluída! Parabéns por realizar este sonho!
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add goal form */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Registrar Novo Sonho</h3>
          
          <form onSubmit={handleAdd} className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4" id="goal-add-form">
            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Nome do Sonho / Meta</label>
              <input
                id="goal-name-input"
                type="text"
                placeholder="Ex: Apartamento Próprio"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-sans text-white transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Valor Alvo (R$)</label>
              <input
                id="goal-target-input"
                type="number"
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono text-white transition"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Valor já guardado (R$)</label>
              <input
                id="goal-current-input"
                type="number"
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono text-white transition"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Data Limite (Deadline)</label>
              <input
                id="goal-deadline-input"
                type="date"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Prioridade</label>
              <select
                id="goal-priority-select"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta (Urgente / Sobrevivência)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Pretende Guardar (R$)</label>
                <input
                  id="goal-plan-value-input"
                  type="number"
                  placeholder="Opcional"
                  className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono text-white transition"
                  value={savingPlanValue}
                  onChange={(e) => setSavingPlanValue(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Frequência</label>
                <select
                  id="goal-plan-frequency-select"
                  className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
                  value={savingPlanFrequency}
                  onChange={(e) => setSavingPlanFrequency(e.target.value as any)}
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>

            <button
              id="goal-submit-button"
              type="submit"
              className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-sm transition cursor-pointer"
            >
              Criar Meta Financeira
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
