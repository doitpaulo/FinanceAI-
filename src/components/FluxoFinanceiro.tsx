/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ArrowUpRight, ArrowDownRight, Plus, Calendar, DollarSign, 
  Trash2, Filter, ChevronRight, RefreshCw, BarChart2 
} from "lucide-react";
import { ExcelDatabase, Transaction } from "../types";

interface FluxoProps {
  data: ExcelDatabase;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onDeleteTransaction?: (id: string) => void;
}

export default function FluxoFinanceiro({ data, onAddTransaction, onDeleteTransaction }: FluxoProps) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Alimentação");
  const [accountId, setAccountId] = useState("acc-1");
  const [isRecurring, setIsRecurring] = useState(false);

  // Group calculations
  const totalIncomes = data.transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = data.transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || !desc.trim()) return;

    onAddTransaction({
      type,
      amount: amt,
      date: new Date().toISOString().split("T")[0],
      category,
      accountId,
      description: desc,
      isRecurring
    });

    setDesc("");
    setAmount("");
  };

  return (
    <div className="space-y-6 animate-fade-in" id="fluxo-view">
      
      {/* Financial Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Total Receitas</span>
            <span className="text-2xl font-display font-bold text-emerald-400">
              R$ {totalIncomes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Total Despesas</span>
            <span className="text-2xl font-display font-bold text-rose-400">
              R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Saldo Líquido</span>
            <span className={`text-2xl font-display font-bold ${totalIncomes - totalExpenses >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
              R$ {(totalIncomes - totalExpenses).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ledger lists (Livro Razão) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Livro de Transações
            </h3>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Sincronizado Excel</span>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.transactions.slice().reverse().map(tx => (
                    <tr id={`tx-row-${tx.id}`} key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        {tx.date.split("-").reverse().join("/")}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-xs rounded-full font-medium">
                          {tx.category}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold font-mono ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.type === "income" ? "+" : "-"} R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {onDeleteTransaction && (
                          <button
                            id={`delete-tx-${tx.id}`}
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add transaction form */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Novo Lançamento</h3>
          
          <form onSubmit={handleAdd} className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4" id="transaction-add-form">
            
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="type-btn-income"
                  type="button"
                  onClick={() => setType("income")}
                  className={`py-2 px-3 text-sm font-semibold rounded-xl border transition ${
                    type === "income"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  Receita
                </button>
                <button
                  id="type-btn-expense"
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-2 px-3 text-sm font-semibold rounded-xl border transition ${
                    type === "expense"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  Despesa
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Descrição</label>
              <input
                id="tx-desc-input"
                type="text"
                placeholder="Ex: Supermercado"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-sans text-white transition"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Valor (R$)</label>
              <input
                id="tx-amount-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono text-white transition"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Categoria</label>
              <select
                id="tx-category-select"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {type === "income" ? (
                  <>
                    <option value="Salário">Salário</option>
                    <option value="Investimentos">Rendimentos</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Outros">Outros</option>
                  </>
                ) : (
                  <>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Moradia">Moradia</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Educação">Educação</option>
                    <option value="Outros">Outros</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Conta Origem/Destino</label>
              <select
                id="tx-account-select"
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {data.accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="tx-recurring-check"
                type="checkbox"
                className="w-4 h-4 rounded border-white/10 text-indigo-500 focus:ring-indigo-500 bg-[#050505]"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <label htmlFor="tx-recurring-check" className="text-xs text-slate-400 cursor-pointer select-none">
                Lançamento recorrente mensal
              </label>
            </div>

            <button
              id="tx-submit-button"
              type="submit"
              className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-sm transition"
            >
              Adicionar Transação
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
