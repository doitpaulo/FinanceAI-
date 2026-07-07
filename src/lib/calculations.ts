/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExcelDatabase } from "../types";

/**
 * Safely calculates progress percentage without risk of division-by-zero.
 */
export function safePercent(current: number, target: number): number {
  if (typeof target !== "number" || isNaN(target) || target <= 0) {
    return 0;
  }
  const currentValue = typeof current === "number" && !isNaN(current) ? current : 0;
  const pct = (currentValue / target) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Calculates dynamic financial health score (0 - 100) based on database health metrics.
 */
export function calculateFinancialScore(data: ExcelDatabase): number {
  let score = 50; // Base score

  if (!data) return score;

  const totalAccountsBalance = (data.accounts || []).reduce((sum, acc) => sum + (acc.isActive ? acc.balance : 0), 0);
  const savingsAccounts = (data.accounts || []).filter(acc => acc.type === "savings").reduce((sum, acc) => sum + acc.balance, 0);

  // 1. Savings Ratio
  if (totalAccountsBalance > 0) {
    const savingsRatio = savingsAccounts / totalAccountsBalance;
    score += Math.round(savingsRatio * 20); // Up to +20 points for high savings ratio
  }

  // 2. Debt-to-Asset Ratio
  const totalAssets = (data.assets || []).reduce((sum, ast) => sum + ast.value, 0);
  const totalLiabilities = (data.liabilities || []).reduce((sum, lia) => sum + lia.remainingValue, 0);
  if (totalAssets > 0) {
    const debtRatio = totalLiabilities / totalAssets;
    if (debtRatio <= 0.1) score += 15;
    else if (debtRatio <= 0.3) score += 10;
    else if (debtRatio <= 0.5) score += 5;
    else score -= 15; // Penalty for high debt ratio
  } else if (totalLiabilities > 0) {
    score -= 15;
  } else {
    score += 10; // No assets but also no debts is a good starting point
  }

  // 3. Spending Ratio (Transactions)
  const totalIncomes = (data.transactions || []).filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = (data.transactions || []).filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  if (totalIncomes > 0) {
    const spendingRatio = totalExpenses / totalIncomes;
    if (spendingRatio < 0.4) score += 15;
    else if (spendingRatio < 0.7) score += 10;
    else if (spendingRatio < 0.9) score += 5;
    else score -= 20; // High spending ratio penalty
  }

  // 4. Goals progress
  const activeGoals = (data.goals || []).filter(g => g.status === "active");
  if (activeGoals.length > 0) {
    const avgProgress = activeGoals.reduce((sum, g) => sum + safePercent(g.currentValue, g.targetValue), 0) / (activeGoals.length * 100);
    score += Math.round(avgProgress * 10); // Up to +10 points for goals progress
  }

  return Math.max(10, Math.min(100, score));
}

/**
 * Computes 30-day cash flow projection dynamically from income sources and monthly bills.
 */
export function calculateProjectedCashflow(data: ExcelDatabase, netCashBalance: number): number {
  if (!data) return netCashBalance;

  // Obter o mês atual no formato YYYY-MM
  const currentMonthStr = new Date().toISOString().substring(0, 7);

  // Somar as receitas que o usuário de fato já recebeu este mês
  const actualIncomesThisMonth = (data.transactions || [])
    .filter(t => t.type === "income" && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  // Total das receitas previstas configuradas
  const totalExpectedIncomes = (data.incomeSources || []).reduce((sum, inc) => sum + inc.expectedValue, 0);

  // A receita que ainda se espera receber é o total previsto menos o que já foi recebido
  const remainingExpectedIncomes = Math.max(0, totalExpectedIncomes - actualIncomesThisMonth);

  // Somar apenas as despesas/contas previstas que ainda não foram pagas
  const unpaidExpectedExpenses = (data.expenses || [])
    .filter(exp => !exp.paid)
    .reduce((sum, exp) => sum + exp.amount, 0);

  return netCashBalance + remainingExpectedIncomes - unpaidExpectedExpenses;
}
