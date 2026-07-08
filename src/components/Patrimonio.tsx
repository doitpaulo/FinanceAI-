/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DollarSign, ArrowDownRight, Briefcase, TrendingUp, Trash2, Pencil, Check, X } from "lucide-react";
import { ExcelDatabase, Asset, Liability, Account, Card } from "../types";

interface PatrimonioProps {
  data: ExcelDatabase;
  onAddAsset: (asset: Omit<Asset, "id">) => void;
  onDeleteAsset?: (id: string) => void;
  onEditAsset?: (id: string, asset: Partial<Asset>) => void;
  onAddLiability: (liability: Omit<Liability, "id">) => void;
  onDeleteLiability?: (id: string) => void;
  onEditLiability?: (id: string, liability: Partial<Liability>) => void;
  onEditAccount?: (id: string, account: Partial<Account>) => void;
  onEditCard?: (id: string, card: Partial<Card>) => void;
}

export default function Patrimonio({ 
  data, 
  onAddAsset, 
  onDeleteAsset, 
  onEditAsset, 
  onAddLiability, 
  onDeleteLiability, 
  onEditLiability,
  onEditAccount,
  onEditCard
}: PatrimonioProps) {
  // New Asset State
  const [assetName, setAssetName] = useState("");
  const [assetValue, setAssetValue] = useState("");
  const [assetType, setAssetType] = useState<"property" | "vehicle" | "investment" | "cash" | "other">("cash");

  // New Liability State
  const [liabName, setLiabName] = useState("");
  const [liabValue, setLiabValue] = useState("");
  const [liabPay, setLiabPay] = useState("");
  const [liabMonths, setLiabMonths] = useState("");
  const [liabType, setLiabType] = useState<"loan" | "financing" | "credit_card" | "installment">("credit_card");

  // Editing States
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editAccountBalance, setEditAccountBalance] = useState("");

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardInvoice, setEditCardInvoice] = useState("");

  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editAssetName, setEditAssetName] = useState("");
  const [editAssetValue, setEditAssetValue] = useState("");
  const [editAssetType, setEditAssetType] = useState<"property" | "vehicle" | "investment" | "cash" | "other">("cash");

  const [editingLiabId, setEditingLiabId] = useState<string | null>(null);
  const [editLiabName, setEditLiabName] = useState("");
  const [editLiabValue, setEditLiabValue] = useState("");
  const [editLiabPay, setEditLiabPay] = useState("");
  const [editLiabMonths, setEditLiabMonths] = useState("");

  const totalAssets = (data.assets || []).reduce((sum, a) => sum + (a?.value || 0), 0);
  const totalLiabilities = (data.liabilities || []).reduce((sum, l) => sum + (l?.remainingValue || 0), 0);

  function totalValue(items: any[]) {
    return items.reduce((acc, curr) => acc + (curr.value || curr.balance || 0), 0);
  }

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetValue) return;
    onAddAsset({
      name: assetName,
      type: assetType,
      value: parseFloat(assetValue),
      acquisitionDate: new Date().toISOString().split("T")[0],
      appreciationRate: 0
    });
    setAssetName("");
    setAssetValue("");
  };

  const handleAddLiability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabName || !liabValue) return;
    onAddLiability({
      name: liabName,
      type: liabType,
      totalValue: parseFloat(liabValue),
      remainingValue: parseFloat(liabValue),
      monthlyPayment: parseFloat(liabPay) || 0,
      remainingMonths: parseInt(liabMonths) || 0
    });
    setLiabName("");
    setLiabValue("");
    setLiabPay("");
    setLiabMonths("");
  };

  const saveEditAccount = (id: string) => {
    const val = parseFloat(editAccountBalance);
    if (!isNaN(val) && onEditAccount) {
      onEditAccount(id, { balance: val });
    }
    setEditingAccountId(null);
  };

  const saveEditCard = (id: string) => {
    const val = parseFloat(editCardInvoice);
    if (!isNaN(val) && onEditCard) {
      onEditCard(id, { currentInvoice: val });
    }
    setEditingCardId(null);
  };

  const saveEditAsset = (id: string) => {
    const val = parseFloat(editAssetValue);
    if (!isNaN(val) && editAssetName.trim() && onEditAsset) {
      onEditAsset(id, { name: editAssetName, value: val, type: editAssetType });
    }
    setEditingAssetId(null);
  };

  const saveEditLiab = (id: string) => {
    const val = parseFloat(editLiabValue);
    const pay = parseFloat(editLiabPay);
    const months = parseInt(editLiabMonths);
    if (!isNaN(val) && editLiabName.trim() && onEditLiability) {
      onEditLiability(id, {
        name: editLiabName,
        remainingValue: val,
        monthlyPayment: isNaN(pay) ? 0 : pay,
        remainingMonths: isNaN(months) ? 0 : months
      });
    }
    setEditingLiabId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="patrimonio-view">
      
      {/* Overview Bento Grid - Simplified Language */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Tudo que eu tenho (Bens)</span>
            <span className="text-2xl font-display font-bold text-white">
              R$ {(totalAssets + totalValue(data.accounts || [])).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">Soma de bens + contas bancárias</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Tudo que eu devo (Dívidas)</span>
            <span className="text-2xl font-display font-bold text-rose-400">
              R$ {(totalLiabilities + totalValue((data.cards || []).map(c => ({ value: c?.currentInvoice || 0 })))).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">Dívidas ativas + faturas abertas</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-rose-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Meu Patrimônio Líquido</span>
            <span className="text-2xl font-display font-bold text-indigo-400">
              R$ {(totalAssets + totalValue(data.accounts || []) - totalLiabilities - totalValue((data.cards || []).map(c => ({ value: c?.currentInvoice || 0 })))).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">O seu saldo real de riqueza atual</span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ativos Column - Simplified Label */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            Meus Bens, Contas e Guardados
          </h3>

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="divide-y divide-white/5">
              
              {/* Accounts balance listing */}
              {(data.accounts || []).map(acc => (
                <div key={acc.id} className="py-3 flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <div className="font-semibold text-white">{acc.name}</div>
                    <div className="text-xs text-slate-500">{acc.bankName} • Conta Corrente</div>
                  </div>
                  {editingAccountId === acc.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="px-2 py-1 bg-[#050505] border border-white/20 rounded text-xs text-white text-right w-24"
                        value={editAccountBalance}
                        onChange={(e) => setEditAccountBalance(e.target.value)}
                      />
                      <button onClick={() => saveEditAccount(acc.id)} className="text-emerald-400 p-1 hover:bg-white/5 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingAccountId(null)} className="text-rose-400 p-1 hover:bg-white/5 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-bold text-emerald-400">
                        R$ {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                      {onEditAccount && (
                        <button
                          onClick={() => {
                            setEditingAccountId(acc.id);
                            setEditAccountBalance(acc.balance.toString());
                          }}
                          className="text-slate-500 hover:text-white p-1"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Assets listing */}
              {(data.assets || []).map(ast => (
                <div key={ast.id} className="py-3 flex justify-between items-center text-sm">
                  {editingAssetId === ast.id ? (
                    <div className="w-full space-y-2 py-1">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="px-2 py-1 bg-[#050505] border border-white/20 rounded text-xs text-white"
                          value={editAssetName}
                          onChange={(e) => setEditAssetName(e.target.value)}
                        />
                        <input
                          type="number"
                          className="px-2 py-1 bg-[#050505] border border-white/20 rounded text-xs text-white"
                          value={editAssetValue}
                          onChange={(e) => setEditAssetValue(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <select
                          className="px-2 py-1 bg-[#050505] border border-white/20 rounded text-[10px] text-white"
                          value={editAssetType}
                          onChange={(e) => setEditAssetType(e.target.value as any)}
                        >
                          <option value="cash">Dinheiro</option>
                          <option value="investment">Investimento</option>
                          <option value="property">Imóvel</option>
                          <option value="vehicle">Veículo</option>
                          <option value="other">Outro</option>
                        </select>
                        <button onClick={() => saveEditAsset(ast.id)} className="text-emerald-400 p-1 bg-emerald-500/10 rounded">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingAssetId(null)} className="text-rose-400 p-1 bg-rose-500/10 rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{ast.name}</div>
                        <div className="text-xs text-slate-500 capitalize">
                          {ast.type === "cash" ? "Dinheiro" : ast.type === "investment" ? "Investimento" : ast.type === "property" ? "Imóvel" : ast.type === "vehicle" ? "Veículo" : "Outro"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-mono font-bold text-emerald-400">
                          R$ {ast.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex gap-1">
                          {onEditAsset && (
                            <button
                              onClick={() => {
                                setEditingAssetId(ast.id);
                                setEditAssetName(ast.name);
                                setEditAssetValue(ast.value.toString());
                                setEditAssetType(ast.type);
                              }}
                              className="text-slate-500 hover:text-white p-1"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteAsset && (
                            <button
                              onClick={() => onDeleteAsset(ast.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Quick add asset */}
            <form onSubmit={handleAddAsset} className="border-t border-white/5 pt-4 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">Novo Bem ou Investimento</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="asset-name-input"
                  type="text"
                  placeholder="Nome (ex: Poupança, Carro)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white placeholder-slate-600 transition"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                />
                <input
                  id="asset-value-input"
                  type="number"
                  placeholder="Valor em R$ (ex: 5000)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white placeholder-slate-600 transition"
                  value={assetValue}
                  onChange={(e) => setAssetValue(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 justify-between">
                <select
                  id="asset-type-select"
                  className="bg-[#050505] border border-white/10 rounded-xl text-xs text-white px-3 py-2 outline-none cursor-pointer"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as any)}
                >
                  <option value="cash">Dinheiro guardado</option>
                  <option value="investment">Investimento / Tesouro</option>
                  <option value="property">Imóvel / Casa</option>
                  <option value="vehicle">Carro / Moto</option>
                  <option value="other">Outros Bens</option>
                </select>
                <button
                  id="add-asset-submit"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Adicionar Bem
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Passivos Column - Simplified Label */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
            Minhas Dívidas, Faturas e Compromissos
          </h3>

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="divide-y divide-white/5">
              
              {/* Cards listing */}
              {(data.cards || []).map(c => (
                <div key={c.id} className="py-3 flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-xs text-slate-500">Cartão de Crédito • Vence dia {c.dueDate}</div>
                  </div>
                  {editingCardId === c.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="px-2 py-1 bg-[#050505] border border-white/20 rounded text-xs text-white text-right w-24"
                        value={editCardInvoice}
                        onChange={(e) => setEditCardInvoice(e.target.value)}
                      />
                      <button onClick={() => saveEditCard(c.id)} className="text-emerald-400 p-1 hover:bg-white/5 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingCardId(null)} className="text-rose-400 p-1 hover:bg-white/5 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-bold text-rose-400">
                        R$ {c.currentInvoice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                      {onEditCard && (
                        <button
                          onClick={() => {
                            setEditingCardId(c.id);
                            setEditCardInvoice(c.currentInvoice.toString());
                          }}
                          className="text-slate-500 hover:text-white p-1"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Liabilities listing */}
              {(data.liabilities || []).map(l => (
                <div key={l.id} className="py-3 flex justify-between items-center text-sm">
                  {editingLiabId === l.id ? (
                    <div className="w-full space-y-2 py-1">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="px-2 py-1 bg-[#050505] border border-white/20 rounded text-xs text-white"
                          value={editLiabName}
                          onChange={(e) => setEditLiabName(e.target.value)}
                        />
                        <input
                          type="number"
                          className="px-2 py-1 bg-[#050505] border border-white/20 rounded text-xs text-white"
                          value={editLiabValue}
                          placeholder="Valor Restante"
                          onChange={(e) => setEditLiabValue(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          className="px-2 py-1 bg-[#050505] border border-white/20 rounded text-xs text-white"
                          value={editLiabPay}
                          placeholder="Valor Parcela"
                          onChange={(e) => setEditLiabPay(e.target.value)}
                        />
                        <input
                          type="number"
                          className="px-2 py-1 bg-[#050505] border border-white/20 rounded text-xs text-white"
                          value={editLiabMonths}
                          placeholder="Parcelas Restantes"
                          onChange={(e) => setEditLiabMonths(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => saveEditLiab(l.id)} className="text-emerald-400 p-1 bg-emerald-500/10 rounded">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingLiabId(null)} className="text-rose-400 p-1 bg-rose-500/10 rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{l.name}</div>
                        <div className="text-xs text-slate-500">
                          {l.remainingMonths > 0 ? `${l.remainingMonths} parcelas de R$ ${l.monthlyPayment.toLocaleString("pt-BR")} restantes` : "Empréstimo sem parcelamento fixo"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-mono font-bold text-rose-400">
                          R$ {l.remainingValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex gap-1">
                          {onEditLiability && (
                            <button
                              onClick={() => {
                                setEditingLiabId(l.id);
                                setEditLiabName(l.name);
                                setEditLiabValue(l.remainingValue.toString());
                                setEditLiabPay(l.monthlyPayment.toString());
                                setEditLiabMonths(l.remainingMonths.toString());
                              }}
                              className="text-slate-500 hover:text-white p-1"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteLiability && (
                            <button
                              onClick={() => onDeleteLiability(l.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Quick add liability */}
            <form onSubmit={handleAddLiability} className="border-t border-white/5 pt-4 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">Nova Dívida ou Financiamento</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="liab-name-input"
                  type="text"
                  placeholder="Nome (ex: Financiamento Carro)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white placeholder-slate-600 transition"
                  value={liabName}
                  onChange={(e) => setLiabName(e.target.value)}
                  required
                />
                <input
                  id="liab-value-input"
                  type="number"
                  placeholder="Valor Total Restante (R$)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white placeholder-slate-600 transition"
                  value={liabValue}
                  onChange={(e) => setLiabValue(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="liab-payment-input"
                  type="number"
                  placeholder="Mensalidade Parcela (R$)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white placeholder-slate-600 transition"
                  value={liabPay}
                  onChange={(e) => setLiabPay(e.target.value)}
                />
                <input
                  id="liab-months-input"
                  type="number"
                  placeholder="Meses / Parcelas restantes"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white placeholder-slate-600 transition"
                  value={liabMonths}
                  onChange={(e) => setLiabMonths(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-between">
                <select
                  id="liab-type-select"
                  className="bg-[#050505] border border-white/10 rounded-xl text-xs text-white px-3 py-2 outline-none cursor-pointer"
                  value={liabType}
                  onChange={(e) => setLiabType(e.target.value as any)}
                >
                  <option value="financing">Financiamento</option>
                  <option value="loan">Empréstimo bancário</option>
                  <option value="credit_card">Fatura de Cartão</option>
                  <option value="installment">Parcelamento de Compra</option>
                </select>
                <button
                  id="add-liab-submit"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Adicionar Dívida
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* --- MODO DÍVIDAS: RECURSOS EXCLUSIVOS DE SOBREVIVÊNCIA FINANCEIRA --- */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-6" id="modo-dividas-section">
        
        <div className="border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-display font-bold text-white">Modo Controle de Dívidas e Acordos</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ferramentas práticas para priorizar pagamentos, simular descontos e respirar com dignidade.
          </p>
        </div>

        {/* ALERTA DE BOLA DE NEVE */}
        {(() => {
          const totalMonthlyIncomeForSnowball = (data.incomeSources || []).reduce((sum, inc) => sum + (inc?.expectedValue || 0), 0) || 1200;
          const totalMonthlyDebtPayments = (data.liabilities || []).reduce((sum, l) => sum + (l?.monthlyPayment || 0), 0) + 
            (data.cards || []).reduce((sum, c) => sum + ((c?.currentInvoice || 0) * 0.15), 0); // assume 15% payment for card
          const debtServiceRatio = Math.round((totalMonthlyDebtPayments / totalMonthlyIncomeForSnowball) * 100);

          return (
            <div className={`p-5 rounded-2xl border ${debtServiceRatio > 30 ? "bg-rose-950/10 border-rose-900/40 text-rose-200" : "bg-emerald-950/10 border-emerald-900/40 text-emerald-200"}`} id="snowball-alert-box">
              <div className="flex gap-3">
                <span className="text-xl">{debtServiceRatio > 30 ? "⚠️" : "🛡️"}</span>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white">Análise de Comprometimento de Renda</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hoje, suas parcelas fixas de dívidas e faturas consomem cerca de <strong className="text-white font-mono">{debtServiceRatio}%</strong> da sua renda mensal média de R$ {totalMonthlyIncomeForSnowball.toLocaleString("pt-BR")}.
                  </p>
                  {debtServiceRatio > 30 ? (
                    <p className="text-xs text-rose-300 font-sans leading-relaxed">
                      <strong>Recomendação de Sobrevivência:</strong> Comprometer mais de 30% da sua renda com parcelas pode apertar muito seu fim de mês. Evite fazer novas compras parceladas ou empréstimos até esse número baixar. Se possível, use nossa ferramenta de renegociação abaixo!
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-300 font-sans leading-relaxed">
                      Sua taxa de parcelamento está dentro de um limite seguro (menos de 30% da renda). Parabéns por manter o controle!
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ORDEM RECOMENDADA DE PAGAMENTO (SNOWBALL VS AVALANCHE) */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              🎯 Sugestão de Prioridade para Pagar
            </h4>
            
            <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Organizamos suas dívidas das mais urgentes e fáceis para você planejar qual quitar primeiro:
              </p>

              {(() => {
                const sortedLiabilities = [
                  ...(data.liabilities || []).map(l => ({ ...l, isCard: false, priority: l.remainingValue < 1000 ? 1 : 2 })),
                  ...(data.cards || []).map(c => ({ id: c.id, name: `Fatura ${c.name}`, remainingValue: c.currentInvoice, monthlyPayment: c.currentInvoice, isCard: true, priority: 3 }))
                ].sort((a, b) => b.priority - a.priority); // prioritize credit cards and smaller ones

                if (sortedLiabilities.length === 0) {
                  return (
                    <div className="text-xs text-slate-500 italic py-4 text-center">
                      Nenhuma dívida ou cartão cadastrado! Você está livre!
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {sortedLiabilities.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-[#111111] border border-white/5 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{item.name}</span>
                            {idx === 0 && (
                              <span className="bg-rose-500/10 text-rose-400 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-md border border-rose-500/10">
                                Quitar Primeiro
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {item.isCard ? "Cartão de crédito (Juros altos se atrasar!)" : "Empréstimo ou Parcela"}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-200">R$ {item.remainingValue.toLocaleString("pt-BR")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="p-3 bg-indigo-500/5 rounded-xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-white block">💡 Qual tática usar?</span>
                <p>
                  <strong>Bola de Neve:</strong> Foque em pagar a dívida de menor valor primeiro. Eliminar contas pequenas dá um ânimo psicológico incrível para continuar!
                </p>
                <p className="mt-1">
                  <strong>Avalanche:</strong> Pague primeiro as dívidas com juros mais altos (como cartão ou cheque especial). Isso economiza muito dinheiro a longo prazo.
                </p>
              </div>
            </div>
          </div>

          {/* SIMULADOR DE RENEGOCIAÇÃO INTEGRADO */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              🤝 Calculadora de Renegociação e Acordo
            </h4>

            {(() => {
              const [simId, setSimId] = useState("");
              const [discount, setDiscount] = useState("40");
              const [installments, setInstallments] = useState("10");

              const activeDebtsForSim = [
                ...(data.liabilities || []).map(l => ({ id: l.id, name: l.name, value: l.remainingValue })),
                ...(data.cards || []).map(c => ({ id: c.id, name: `Cartão ${c.name}`, value: c.currentInvoice }))
              ];

              const selectedDebt = activeDebtsForSim.find(d => d.id === simId);
              const originalVal = selectedDebt ? selectedDebt.value : 0;
              const discPct = parseFloat(discount) || 0;
              const negotiatedSingleVal = Math.max(0, originalVal * (1 - discPct / 100));
              const savingsVal = Math.max(0, originalVal - negotiatedSingleVal);

              const instCount = parseInt(installments) || 1;
              const instVal = Math.max(0, negotiatedSingleVal / instCount);

              return (
                <div className="bg-[#050505] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Selecione uma Dívida:</label>
                    <select
                      id="sim-debt-select"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl text-xs text-white px-3 py-2 outline-none cursor-pointer"
                      value={simId}
                      onChange={(e) => setSimId(e.target.value)}
                    >
                      <option value="">-- Escolha uma dívida para simular --</option>
                      {activeDebtsForSim.map(d => (
                        <option key={d.id} value={d.id}>{d.name} (R$ {d.value.toLocaleString("pt-BR")})</option>
                      ))}
                    </select>
                  </div>

                  {selectedDebt ? (
                    <div className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Proposta de Desconto (%):</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            min="0"
                            max="99"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Número de Parcelas:</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition"
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            min="1"
                            max="60"
                          />
                        </div>
                      </div>

                      {/* SIMULATION RESULTS */}
                      <div className="bg-[#111111] p-4 rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Dívida Original:</span>
                          <span className="text-slate-300 font-mono">R$ {originalVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-emerald-400 font-bold">
                          <span>Quanto você economiza:</span>
                          <span className="font-mono">R$ {savingsVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="border-t border-white/5 pt-2 flex justify-between items-center text-sm">
                          <span className="font-bold text-white">Acordo à vista:</span>
                          <strong className="text-indigo-400 font-mono text-base">
                            R$ {negotiatedSingleVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                          <span>Ou parcelado em {instCount}x de:</span>
                          <span className="font-mono text-slate-200">
                            R$ {instVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / mês
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed">
                        💡 <strong>Como ligar e renegociar:</strong> Ligue para o credor ou use o aplicativo do Serasa e proponha o pagamento do valor de <strong>R$ {negotiatedSingleVal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</strong> à vista. A maioria dos bancos aceita descontos de 40% a 90% para quitar dívidas em atraso!
                      </div>

                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-6 text-center bg-[#111111] rounded-xl border border-white/5">
                      Selecione uma das suas dívidas acima para calcular quanto economizar em uma renegociação.
                    </div>
                  )}

                </div>
              );
            })()}

          </div>

        </div>

      </div>

    </div>
  );
}
