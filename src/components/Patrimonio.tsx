import React, { useState } from "react";
import { DollarSign, ArrowUpRight, ArrowDownRight, Briefcase, TrendingUp } from "lucide-react";
import { ExcelDatabase, Asset, Liability } from "../types";

interface PatrimonioProps {
  data: ExcelDatabase;
  onAddAsset: (asset: Omit<Asset, "id">) => void;
  onAddLiability: (liability: Omit<Liability, "id">) => void;
}

export default function Patrimonio({ data, onAddAsset, onAddLiability }: PatrimonioProps) {
  const [assetName, setAssetName] = useState("");
  const [assetValue, setAssetValue] = useState("");
  const [assetType, setAssetType] = useState<"property" | "vehicle" | "investment" | "cash" | "other">("cash");

  const [liabName, setLiabName] = useState("");
  const [liabValue, setLiabValue] = useState("");
  const [liabPay, setLiabPay] = useState("");
  const [liabMonths, setLiabMonths] = useState("");
  const [liabType, setLiabType] = useState<"loan" | "financing" | "credit_card" | "installment">("credit_card");

  const totalAssets = data.assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = data.liabilities.reduce((sum, l) => sum + l.remainingValue, 0);
  const netWorth = totalValueNetWorth(totalValue(data.accounts), totalValue(data.assets), totalValue(data.liabilities));

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

  return (
    <div className="space-y-6 animate-fade-in" id="patrimonio-view">
      
      {/* Overview Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Ativos Totais</span>
            <span className="text-2xl font-display font-bold text-white">
              R$ {(totalAssets + totalValue(data.accounts)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">Bens + Saldos bancários</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Passivos Totais</span>
            <span className="text-2xl font-display font-bold text-rose-400">
              R$ {totalLiabilities.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">Dívidas + Financiamentos</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-rose-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Patrimônio Líquido</span>
            <span className="text-2xl font-display font-bold text-indigo-400">
              R$ {(totalAssets + totalValue(data.accounts) - totalLiabilities).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">Liquidez real de riqueza</span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ativos Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            Meus Ativos
          </h3>

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="divide-y divide-white/5">
              {data.accounts.map(acc => (
                <div key={acc.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-semibold text-white">{acc.name}</div>
                    <div className="text-xs text-slate-500">{acc.bankName} • Liquidez Diária</div>
                  </div>
                  <div className="font-mono font-bold text-emerald-400">
                    R$ {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {data.assets.map(ast => (
                <div key={ast.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-semibold text-white">{ast.name}</div>
                    <div className="text-xs text-slate-500 capitalize">{ast.type} • Rendimento anual: {ast.appreciationRate}%</div>
                  </div>
                  <div className="font-mono font-bold text-emerald-400">
                    R$ {ast.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add asset */}
            <form onSubmit={handleAddAsset} className="border-t border-white/5 pt-4 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">Novo Ativo</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="asset-name-input"
                  type="text"
                  placeholder="Nome (ex: Tesouro Selic)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                />
                <input
                  id="asset-value-input"
                  type="number"
                  placeholder="Valor (R$)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white"
                  value={assetValue}
                  onChange={(e) => setAssetValue(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 justify-between">
                <select
                  id="asset-type-select"
                  className="bg-[#050505] border border-white/10 rounded-xl text-xs text-white px-3 py-2 outline-none"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as any)}
                >
                  <option value="cash">Dinheiro em Conta</option>
                  <option value="investment">Investimento</option>
                  <option value="property">Imóvel</option>
                  <option value="vehicle">Veículo</option>
                  <option value="other">Outro</option>
                </select>
                <button
                  id="add-asset-submit"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Passivos Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
            Meus Passivos & Dívidas
          </h3>

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="divide-y divide-white/5">
              {data.cards.map(c => (
                <div key={c.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-xs text-slate-500">Fatura vencendo dia {c.dueDate}</div>
                  </div>
                  <div className="font-mono font-bold text-rose-400">
                    R$ {c.currentInvoice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {data.liabilities.map(l => (
                <div key={l.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-semibold text-white">{l.name}</div>
                    <div className="text-xs text-slate-500">{l.remainingMonths} parcelas de R$ {l.monthlyPayment.toLocaleString("pt-BR")} restantes</div>
                  </div>
                  <div className="font-mono font-bold text-rose-400">
                    R$ {l.remainingValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add liability */}
            <form onSubmit={handleAddLiability} className="border-t border-white/5 pt-4 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">Novo Passivo</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="liab-name-input"
                  type="text"
                  placeholder="Nome (ex: Financiamento)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white"
                  value={liabName}
                  onChange={(e) => setLiabName(e.target.value)}
                  required
                />
                <input
                  id="liab-value-input"
                  type="number"
                  placeholder="Saldo Devedor (R$)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white"
                  value={liabValue}
                  onChange={(e) => setLiabValue(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="liab-payment-input"
                  type="number"
                  placeholder="Mensalidade (R$)"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white"
                  value={liabPay}
                  onChange={(e) => setLiabPay(e.target.value)}
                />
                <input
                  id="liab-months-input"
                  type="number"
                  placeholder="Meses restantes"
                  className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-white"
                  value={liabMonths}
                  onChange={(e) => setLiabMonths(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-between">
                <select
                  id="liab-type-select"
                  className="bg-[#050505] border border-white/10 rounded-xl text-xs text-white px-3 py-2 outline-none"
                  value={liabType}
                  onChange={(e) => setLiabType(e.target.value as any)}
                >
                  <option value="financing">Financiamento</option>
                  <option value="loan">Empréstimo</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="installment">Parcelamento</option>
                </select>
                <button
                  id="add-liab-submit"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}

function totalValueNetWorth(accs: number, assets: number, liabs: number) {
  return accs + assets - liabs;
}
