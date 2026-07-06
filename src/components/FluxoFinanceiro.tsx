import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, DollarSign, Trash2, Pencil, Check, X, CreditCard, 
  Droplet, Lightbulb, Wifi, FileText, CheckSquare, Square, 
  AlertTriangle, Sparkles, CheckCircle2, AlertCircle
} from "lucide-react";
import { ExcelDatabase, Expense } from "../types";

interface FluxoProps {
  data: ExcelDatabase;
  onAddExpense: (exp: Omit<Expense, "id">) => void;
  onEditExpense: (id: string, exp: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  onToggleExpensePaid: (id: string) => void;
}

export default function FluxoFinanceiro({ 
  data, 
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onToggleExpensePaid
}: FluxoProps) {
  // New Bill/Expense Form State
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billCategory, setBillCategory] = useState("Serviços");
  const [billDueDate, setBillDueDate] = useState("");
  const [billIsFixed, setBillIsFixed] = useState(true);

  // Editing States for Bills/Expenses
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editBillName, setEditBillName] = useState("");
  const [editBillAmount, setEditBillAmount] = useState("");
  const [editBillCategory, setEditBillCategory] = useState("Serviços");
  const [editBillDueDate, setEditBillDueDate] = useState("");

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(billAmount);
    if (isNaN(amt) || amt <= 0 || !billName.trim()) return;

    onAddExpense({
      name: billName.trim(),
      category: billCategory,
      amount: amt,
      frequency: "monthly",
      dueDate: billDueDate || new Date().toISOString().split("T")[0],
      isFixed: billIsFixed
    });

    setBillName("");
    setBillAmount("");
    setBillDueDate("");
  };

  const startEditBill = (bill: Expense) => {
    setEditingBillId(bill.id);
    setEditBillName(bill.name);
    setEditBillAmount(bill.amount.toString());
    setEditBillCategory(bill.category);
    setEditBillDueDate(bill.dueDate);
  };

  const saveEditBill = () => {
    const amt = parseFloat(editBillAmount);
    if (isNaN(amt) || amt <= 0 || !editBillName.trim()) return;

    onEditExpense(editingBillId!, {
      name: editBillName.trim(),
      amount: amt,
      category: editBillCategory,
      dueDate: editBillDueDate
    });
    setEditingBillId(null);
  };

  // Icon selector based on bill type
  const getBillIcon = (name: string, cat: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("água") || lowerName.includes("agua") || lowerName.includes("saneamento") || lowerName.includes("sabesp")) {
      return <Droplet className="w-4 h-4 text-sky-400" />;
    }
    if (lowerName.includes("luz") || lowerName.includes("energia") || lowerName.includes("enel") || lowerName.includes("cemig") || lowerName.includes("força")) {
      return <Lightbulb className="w-4 h-4 text-amber-400" />;
    }
    if (lowerName.includes("internet") || lowerName.includes("wifi") || lowerName.includes("net") || lowerName.includes("claro") || lowerName.includes("fibra") || lowerName.includes("vivo")) {
      return <Wifi className="w-4 h-4 text-purple-400" />;
    }
    if (lowerName.includes("cartão") || lowerName.includes("cartao") || lowerName.includes("nubank") || lowerName.includes("crédito") || lowerName.includes("fatura") || lowerName.includes("visa") || lowerName.includes("mastercard")) {
      return <CreditCard className="w-4 h-4 text-rose-400" />;
    }
    return <FileText className="w-4 h-4 text-indigo-400" />;
  };

  // Stats Calculations
  const expenses = data.expenses || [];
  const totalBillsCount = expenses.length;
  
  const paidBills = expenses.filter(b => b.paid);
  const pendingBills = expenses.filter(b => !b.paid);

  const totalPaidAmount = paidBills.reduce((sum, b) => sum + b.amount, 0);
  const totalPendingAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);
  const totalBillsAmount = expenses.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in" id="fluxo-view">
      {/* Visual Header */}
      <div className="text-left space-y-1">
        <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Agenda de Obrigações</span>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Contas do Mês (Vencimentos)</h2>
        <p className="text-xs text-slate-400">Organize suas contas recorrentes (água, luz, telefone, faturas) e controle os vencimentos para evitar juros.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 text-left flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Contas Pagas ({paidBills.length})</span>
            <div className="text-lg md:text-xl font-bold text-emerald-400 font-mono">
              R$ {totalPaidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 block">Quitadas este mês</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="absolute right-0 bottom-0 h-1 bg-emerald-500 w-1/3 group-hover:w-full transition-all duration-300" />
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 text-left flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Contas Pendentes ({pendingBills.length})</span>
            <div className="text-lg md:text-xl font-bold text-amber-400 font-mono">
              R$ {totalPendingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 block">Aguardando pagamento</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="absolute right-0 bottom-0 h-1 bg-amber-500 w-1/3 group-hover:w-full transition-all duration-300" />
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 text-left flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Total Agendado ({totalBillsCount})</span>
            <div className="text-lg md:text-xl font-bold text-white font-mono">
              R$ {totalBillsAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 block">Soma de todos os boletos</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="absolute right-0 bottom-0 h-1 bg-indigo-500 w-1/3 group-hover:w-full transition-all duration-300" />
        </div>
      </div>

      {/* Main Workspace grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Registered Bills List */}
        <div className="lg:col-span-8 space-y-4 text-left">
          <div className="flex items-center justify-between pl-1">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Minhas Contas Cadastradas
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Total de Contas: {totalBillsCount}
            </span>
          </div>

          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="bg-[#111111] border border-dashed border-white/10 rounded-3xl p-10 text-center text-slate-500 text-sm">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                Nenhuma conta cadastrada ainda. Cadastre suas contas de consumo ao lado para organizar seu calendário!
              </div>
            ) : (
              expenses.map(bill => (
                <div 
                  key={bill.id} 
                  className={`bg-[#111111] border rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    bill.paid 
                      ? "border-emerald-500/20 bg-emerald-950/5 text-slate-400" 
                      : "border-white/10 hover:border-white/20 text-white"
                  }`}
                >
                  {editingBillId === bill.id ? (
                    // Edit form for bill
                    <div className="w-full space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-xs text-white"
                          value={editBillName}
                          placeholder="Nome da Conta"
                          onChange={(e) => setEditBillName(e.target.value)}
                        />
                        <input
                          type="number"
                          className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-xs text-white font-mono"
                          value={editBillAmount}
                          placeholder="Valor"
                          onChange={(e) => setEditBillAmount(e.target.value)}
                        />
                        <input
                          type="date"
                          className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-xs text-white font-mono"
                          value={editBillDueDate}
                          onChange={(e) => setEditBillDueDate(e.target.value)}
                        />
                        <select
                          className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-xs text-white"
                          value={editBillCategory}
                          onChange={(e) => setEditBillCategory(e.target.value)}
                        >
                          <option value="Serviços">Serviços / Contas</option>
                          <option value="Moradia">Moradia</option>
                          <option value="Lazer">Lazer / Assinaturas</option>
                          <option value="Transporte">Transporte</option>
                          <option value="Outros">Outras</option>
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={saveEditBill}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition shadow-md shadow-emerald-600/10"
                        >
                          <Check className="w-3.5 h-3.5" /> Salvar
                        </button>
                        <button
                          onClick={() => setEditingBillId(null)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 transition"
                        >
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal display of bill
                    <>
                      <div className="flex items-center gap-3.5">
                        <div className={`p-3 rounded-2xl ${bill.paid ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-200"}`}>
                          {getBillIcon(bill.name, bill.category)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${bill.paid ? "line-through text-slate-500" : "text-white"}`}>
                              {bill.name}
                            </h4>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/5 text-[10px] rounded-md text-slate-400">
                              {bill.category}
                            </span>
                            {bill.isFixed && (
                              <span className="px-2 py-0.5 bg-purple-500/10 text-[9px] rounded-md text-purple-400 font-bold font-mono">
                                FIXO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono">
                            Vence dia: {bill.dueDate.split("-").reverse().join("/")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between md:justify-end shrink-0">
                        <div className="text-left md:text-right">
                          <div className={`text-sm md:text-base font-bold font-mono ${bill.paid ? "text-slate-500" : "text-slate-100"}`}>
                            R$ {bill.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                          <span className={`text-[10px] font-bold ${bill.paid ? "text-emerald-400" : "text-amber-500"}`}>
                            {bill.paid ? "✓ Pago" : "● Pendente"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onToggleExpensePaid(bill.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                              bill.paid 
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25" 
                                : "bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10"
                            }`}
                            title={bill.paid ? "Marcar como Pendente" : "Marcar como Pago"}
                          >
                            {bill.paid ? (
                              <>
                                <CheckSquare className="w-3.5 h-3.5" /> Pago
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5" /> Pagar
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => startEditBill(bill)}
                            className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all"
                            title="Editar Dados da Conta"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteExpense(bill.id)}
                            className="text-slate-400 hover:text-rose-400 p-2 hover:bg-white/5 rounded-xl transition-all"
                            title="Excluir Conta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Register a new bill form */}
        <div className="lg:col-span-4 space-y-4 text-left">
          <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold pl-1">Nova Conta a Vencer</h3>
          
          <form onSubmit={handleAddBill} className="bg-[#111111] border border-white/10 rounded-3xl p-5 space-y-4 shadow-lg" id="bill-add-form">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Agende seus custos mensais programados. O simulador e o consultor de IA usam essas informações para alertar sobre a saúde do seu caixa futuro.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Nome da Obrigação</label>
              <input
                type="text"
                placeholder="Ex: Fatura Internet Vivo, Condomínio, etc."
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white transition font-sans"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white font-mono transition"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Vencimento</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white font-mono transition"
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Categoria</label>
              <select
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white transition font-sans"
                value={billCategory}
                onChange={(e) => setBillCategory(e.target.value)}
              >
                <option value="Serviços">Serviços / Contas de Consumo</option>
                <option value="Moradia">Moradia / Aluguel / Condomínio</option>
                <option value="Lazer">Lazer / Assinaturas / Netflix</option>
                <option value="Transporte">Transporte / Seguro / Combustível</option>
                <option value="Outros">Outras Contas</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="bill-recurring-check"
                type="checkbox"
                className="w-4 h-4 rounded border-white/10 text-indigo-500 focus:ring-indigo-500 bg-[#050505]"
                checked={billIsFixed}
                onChange={(e) => setBillIsFixed(e.target.checked)}
              />
              <label htmlFor="bill-recurring-check" className="text-xs text-slate-400 cursor-pointer select-none">
                Esta conta vence todo mês
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/10 animate-pulse"
            >
              Registrar Vencimento
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
