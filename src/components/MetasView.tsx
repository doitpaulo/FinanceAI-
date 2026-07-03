/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Award, AlertCircle, ArrowUpRight, TrendingUp, Trash2, Pencil, Check, X } from "lucide-react";
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

  // Editing Goal State
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editCurrent, setEditCurrent] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");

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
      status: "active"
    });
    setName("");
    setTarget("");
    setCurrent("");
    setDeadline("");
  };

  const startEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditName(goal.name);
    setEditTarget(goal.targetValue.toString());
    setEditCurrent(goal.currentValue.toString());
    setEditDeadline(goal.deadline);
    setEditPriority(goal.priority);
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
        priority: editPriority
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
            {data.goals.map(goal => {
              const progressPct = safePercent(goal.currentValue, goal.targetValue);
              const remainingValue = goal.targetValue - goal.currentValue;
              
              // Estimate months remaining (heuristic based on average saving of R$ 1,150)
              const averageMonthlySaving = 1150.00;
              const monthsRemaining = remainingValue > 0 ? Math.ceil(remainingValue / averageMonthlySaving) : 0;

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
                              Prazo: {goal.deadline.split("-").reverse().join("/")}
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
                                className="text-slate-500 hover:text-indigo-400 p-1.5 hover:bg-white/5 rounded-lg transition"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteGoal && (
                              <button
                                id={`delete-goal-${goal.id}`}
                                onClick={() => onDeleteGoal(goal.id)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-white/5 rounded-lg transition"
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

                      <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                          Estimativa de conquista:
                        </span>
                        <span className="text-xs text-white font-bold">
                          {monthsRemaining > 0 ? `Em aproximadamente ${monthsRemaining} meses` : "Meta Concluída!"}
                        </span>
                      </div>
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
