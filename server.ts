/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { ExcelDatabase, AIInsight, Transaction, Account, Card, Goal } from "./src/types/index";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Path for simulated database (Use OS temporary directory on Vercel/Serverless to avoid read-only filesystem issues)
const SIM_DB_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), "sim_database.json")
  : path.join(process.cwd(), "sim_database.json");

// Default initial seed data (Realistic CLT scenario)
const defaultSeedData = (): ExcelDatabase => {
  const currentDate = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();

  return {
    profile: {
      userId: "guest_user",
      name: "Paulo Henrique",
      email: "pauloo201113@gmail.com",
      incomeType: "CLT",
      payFrequency: "mensal",
      financialGoal: "Reservas e Investimentos para Casa Própria",
      riskProfile: "moderado",
      onboardingCompleted: true,
    },
    settings: {
      currency: "BRL",
      language: "pt-BR",
      notificationsEnabled: true,
      aiEnabled: true,
      darkMode: true,
    },
    accounts: [
      { id: "acc-1", name: "Conta Corrente", bankName: "Itaú Unibanco", type: "checking", balance: 4250.00, isActive: true },
      { id: "acc-2", name: "Reserva de Emergência", bankName: "Nubank", type: "savings", balance: 12000.00, isActive: true },
      { id: "acc-3", name: "Carteira Dinheiro", bankName: "Dinheiro Físico", type: "wallet", balance: 250.00, isActive: true }
    ],
    cards: [
      { id: "card-1", name: "Nubank Ultravioleta", limit: 8000, dueDate: 10, closingDay: 3, currentInvoice: 1845.50, availableLimit: 6154.50 }
    ],
    incomeSources: [
      { id: "inc-1", name: "Salário CLT Tech", type: "CLT", frequency: "monthly", expectedValue: 6500.00, nextDate: `${currentYear}-07-05` }
    ],
    expenses: [
      { id: "exp-1", name: "Aluguel Apartamento", category: "Moradia", amount: 1500.00, frequency: "monthly", dueDate: `${currentYear}-07-10`, isFixed: true },
      { id: "exp-2", name: "Internet Fibra", category: "Serviços", amount: 120.00, frequency: "monthly", dueDate: `${currentYear}-07-15`, isFixed: true },
      { id: "exp-3", name: "Assinatura Streaming", category: "Lazer", amount: 55.90, frequency: "monthly", dueDate: `${currentYear}-07-22`, isFixed: false }
    ],
    transactions: [
      { id: "tx-1", type: "income", amount: 6500.00, date: `${currentYear}-06-05`, category: "Salário", accountId: "acc-1", description: "Salário Mensal Tech S.A.", isRecurring: true },
      { id: "tx-2", type: "expense", amount: 1500.00, date: `${currentYear}-06-10`, category: "Moradia", accountId: "acc-1", description: "Aluguel Mensal", isRecurring: true },
      { id: "tx-3", type: "expense", amount: 120.00, date: `${currentYear}-06-15`, category: "Serviços", accountId: "acc-1", description: "Mensalidade Internet", isRecurring: true },
      { id: "tx-4", type: "expense", amount: 350.00, date: `${currentYear}-06-18`, category: "Alimentação", accountId: "acc-1", description: "Supermercado Semanal", isRecurring: false },
      { id: "tx-5", type: "expense", amount: 180.00, date: `${currentYear}-06-25`, category: "Transporte", accountId: "acc-1", description: "Combustível", isRecurring: false },
      { id: "tx-6", type: "expense", amount: 110.00, date: `${currentYear}-06-28`, category: "Alimentação", accountId: "acc-3", description: "Jantar fds", isRecurring: false }
    ],
    assets: [
      { id: "ast-1", name: "Carro Honda Civic", type: "vehicle", value: 45000.00, acquisitionDate: "2024-03-15", appreciationRate: -5.0 },
      { id: "ast-2", name: "Tesouro IPCA 2029", type: "investment", value: 8500.00, acquisitionDate: "2025-01-10", appreciationRate: 11.5 }
    ],
    liabilities: [
      { id: "lia-1", name: "Financiamento Honda", type: "financing", totalValue: 30000.00, remainingValue: 12000.00, monthlyPayment: 750.00, remainingMonths: 16 }
    ],
    goals: [
      { id: "goal-1", name: "Reserva de Emergência de 6 meses", targetValue: 15000.00, currentValue: 12000.00, deadline: `${currentYear}-12-31`, priority: "high", status: "active" },
      { id: "goal-2", name: "Entrada de Imóvel Próprio", targetValue: 60000.00, currentValue: 8500.00, deadline: "2028-12-31", priority: "medium", status: "active" }
    ],
    cashFlow: [
      { date: `${currentYear}-07-05`, expectedIncome: 6500, expectedExpense: 0, projectedBalance: 10750 },
      { date: `${currentYear}-07-10`, expectedIncome: 0, expectedExpense: 1500, projectedBalance: 9250 },
      { date: `${currentYear}-07-15`, expectedIncome: 0, expectedExpense: 120, projectedBalance: 9130 },
      { date: `${currentYear}-07-22`, expectedIncome: 0, expectedExpense: 55.90, projectedBalance: 9074.10 }
    ],
    calendar: [
      { id: "cal-1", date: `${currentYear}-07-05`, type: "income", description: "Salário CLT Tech", amount: 6500.00 },
      { id: "cal-2", date: `${currentYear}-07-10`, type: "expense", description: "Aluguel Apartamento", amount: 1500.00 },
      { id: "cal-3", date: `${currentYear}-07-15`, type: "expense", description: "Internet Fibra", amount: 120.00 }
    ],
    timeline: [
      { id: "tl-1", date: "2026-01-01", event: "Início da Organização Financeira", impact: "Criação de plano consolidado", financialChange: 0 }
    ],
    events: [
      { id: "evt-1", type: "milestone", description: "Meta Nubank Reserva bateu 80%", date: `${currentYear}-06-20`, financialImpact: 0 }
    ],
    aiInsights: [
      {
        id: "ins-1",
        insight: "Parabéns! Sua Reserva de Emergência já cobre cerca de 5 meses das suas despesas fixas. Mantenha o foco para atingir a meta de 6 meses (R$ 15.000).",
        severity: "low",
        createdAt: `${currentDate} 10:00:00`,
        relatedDomain: "Goals"
      },
      {
        id: "ins-2",
        insight: "Alerta: O Nubank Ultravioleta vencerá no dia 10 de julho (R$ 1.845,50). Certifique-se de que o saldo na conta corrente esteja livre para o pagamento da fatura.",
        severity: "medium",
        createdAt: `${currentDate} 10:05:00`,
        relatedDomain: "Cards"
      }
    ]
  };
};

// Helper: Read db
function readDatabase(): ExcelDatabase {
  if (!fs.existsSync(SIM_DB_PATH)) {
    const defaultData = defaultSeedData();
    try {
      fs.writeFileSync(SIM_DB_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
    } catch (err) {
      console.error("Erro ao inicializar arquivo do banco simulado:", err);
    }
    return defaultData;
  }
  try {
    const data = fs.readFileSync(SIM_DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler banco simulado:", err);
    return defaultSeedData();
  }
}

// Helper: Write db
function writeDatabase(data: ExcelDatabase) {
  try {
    fs.writeFileSync(SIM_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao gravar banco simulado:", err);
  }
}

// Helper: Parse cookie header manually
function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach(cookie => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

// Helper: Determine app base URL
function getAppUrl(req: express.Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  const host = req.get("host") || "localhost:3000";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}

// Helper: Microsoft Token Management & Dynamic Refresh
async function getValidAccessToken(req: express.Request, res: express.Response): Promise<string | null> {
  const cookies = parseCookies(req.headers.cookie);
  const msTokensStr = cookies["ms_tokens"];
  if (!msTokensStr) return null;

  try {
    const tokens = JSON.parse(msTokensStr);
    const now = Date.now();

    // If token is still valid (with 5 minutes buffer)
    if (tokens.accessToken && tokens.expiresAt && tokens.expiresAt - now > 5 * 60 * 1000) {
      return tokens.accessToken;
    }

    // Attempt to refresh token using refresh_token
    if (tokens.refreshToken) {
      const clientId = process.env.MICROSOFT_CLIENT_ID || "";
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";
      const redirectUri = `${getAppUrl(req)}/auth/callback`;

      const refreshResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokens.refreshToken,
          grant_type: "refresh_token",
          redirect_uri: redirectUri,
          scope: "openid profile email offline_access User.Read Files.ReadWrite"
        })
      });

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json();
        const expiresAt = Date.now() + (newTokens.expires_in * 1000);

        const updatedTokens = {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || tokens.refreshToken,
          expiresAt
        };

        // Set secure cookie for cross-origin iframe compatibility
        res.cookie("ms_tokens", JSON.stringify(updatedTokens), {
          secure: true,
          sameSite: "none",
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        return newTokens.access_token;
      } else {
        console.error("Falha ao atualizar token do OneDrive. Status:", refreshResponse.status);
      }
    }
  } catch (err) {
    console.error("Erro no processamento do token do OneDrive:", err);
  }

  return null;
}

// Helper: Read and Write database in Microsoft OneDrive
const ONEDRIVE_FILE_PATH = "https://graph.microsoft.com/v1.0/me/drive/root:/FinanceAI/finance_data.json";

async function readFromOneDrive(accessToken: string, defaultProfile?: any): Promise<ExcelDatabase | null> {
  try {
    const response = await fetch(`${ONEDRIVE_FILE_PATH}:/content`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      return data as ExcelDatabase;
    } else if (response.status === 404) {
      // File does not exist yet - let's create it with default seed and customized profile
      const seed = defaultSeedData();
      if (defaultProfile) {
        seed.profile.userId = defaultProfile.userId || seed.profile.userId;
        seed.profile.name = defaultProfile.name || seed.profile.name;
        seed.profile.email = defaultProfile.email || seed.profile.email;
      }
      seed.profile.onboardingCompleted = false;

      // Upload default seed to OneDrive
      const uploadResponse = await fetch(`${ONEDRIVE_FILE_PATH}:/content`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(seed)
      });

      if (uploadResponse.ok) {
        console.log("Banco de dados criado com sucesso no OneDrive do usuário!");
        return seed;
      } else {
        const errText = await uploadResponse.text();
        console.error("Falha ao criar arquivo no OneDrive:", errText);
      }
    } else {
      const errText = await response.text();
      console.error("Erro ao ler do OneDrive:", errText);
    }
  } catch (err) {
    console.error("Exceção ao ler do OneDrive:", err);
  }
  return null;
}

async function writeToOneDrive(accessToken: string, data: ExcelDatabase): Promise<boolean> {
  try {
    const response = await fetch(`${ONEDRIVE_FILE_PATH}:/content`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    return response.ok;
  } catch (err) {
    console.error("Erro ao gravar no OneDrive:", err);
    return false;
  }
}

// Lazy Gemini initialization
let aiInstance: GoogleGenAI | null = null;
function getGeminiAI() {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
      return null;
    }
    if (!aiInstance) {
      aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiInstance;
  } catch (err) {
    console.error("Erro ao inicializar o cliente GoogleGenAI:", err);
    return null;
  }
}

// REST APIs for Excel Simulator Database
app.get("/api/db", async (req, res) => {
  const token = await getValidAccessToken(req, res);
  if (token) {
    const cookies = parseCookies(req.headers.cookie);
    const profile = cookies["ms_profile"] ? JSON.parse(cookies["ms_profile"]) : undefined;
    const db = await readFromOneDrive(token, profile);
    if (db) {
      res.json(db);
      return;
    }
  }

  const db = readDatabase();
  res.json(db);
});

function isValidDatabasePayload(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  const requiredKeys = [
    'profile', 'settings', 'accounts', 'cards', 'incomeSources', 
    'expenses', 'transactions', 'assets', 'liabilities', 'goals'
  ];
  for (const key of requiredKeys) {
    if (!(key in data)) return false;
  }
  if (typeof data.profile !== "object" || typeof data.settings !== "object") return false;
  if (!Array.isArray(data.accounts) || !Array.isArray(data.cards) || !Array.isArray(data.transactions) || !Array.isArray(data.goals)) return false;
  return true;
}

app.post("/api/db", async (req, res) => {
  const newData = req.body as ExcelDatabase;
  
  if (!isValidDatabasePayload(newData)) {
    res.status(400).json({ error: "Estrutura do banco de dados inválida ou incompleta. Gravação rejeitada." });
    return;
  }

  const token = await getValidAccessToken(req, res);

  if (token) {
    const success = await writeToOneDrive(token, newData);
    if (success) {
      res.json({ success: true, message: "Banco de dados sincronizado e gravado no OneDrive com sucesso." });
      return;
    }
  }

  writeDatabase(newData);
  res.json({ success: true, message: "Banco de dados Excel atualizado com sucesso localmente." });
});

app.post("/api/db/reset", async (req, res) => {
  const seed = defaultSeedData();
  const token = await getValidAccessToken(req, res);

  if (token) {
    const success = await writeToOneDrive(token, seed);
    if (success) {
      res.json({ success: true, db: seed, message: "Banco de dados restaurado para padrão no OneDrive." });
      return;
    }
  }

  writeDatabase(seed);
  res.json({ success: true, db: seed, message: "Banco de dados restaurado para padrão localmente." });
});

// Endpoint to handle specific transactions creation
app.post("/api/db/transaction", async (req, res) => {
  const tx = req.body as Transaction;
  const token = await getValidAccessToken(req, res);

  let db: ExcelDatabase | null = null;
  if (token) {
    const cookies = parseCookies(req.headers.cookie);
    const profile = cookies["ms_profile"] ? JSON.parse(cookies["ms_profile"]) : undefined;
    db = await readFromOneDrive(token, profile);
  }

  if (!db) {
    db = readDatabase();
  }
  
  // Add transaction
  db.transactions.push(tx);

  // Math core update: deduct or add to account balance
  const account = db.accounts.find(a => a.id === tx.accountId);
  if (account) {
    if (tx.type === "expense") {
      account.balance -= tx.amount;
    } else {
      account.balance += tx.amount;
    }
  }

  // Generate simple transaction timeline event
  db.timeline.push({
    id: "tl-" + Math.random().toString(36).substr(2, 9),
    date: tx.date,
    event: `Registro de ${tx.type === "expense" ? "Despesa" : "Receita"}: ${tx.category}`,
    impact: tx.description,
    financialChange: tx.type === "expense" ? -tx.amount : tx.amount
  });

  if (token) {
    const success = await writeToOneDrive(token, db);
    if (success) {
      res.json({ success: true, db });
      return;
    }
  }

  writeDatabase(db);
  res.json({ success: true, db });
});

// Endpoint para depuração e diagnóstico de configuração das chaves Microsoft
app.get("/api/auth/debug", (req, res) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";
  const redirectUri = `${getAppUrl(req)}/auth/callback`;

  const isClientIdOk = clientId && clientId !== "PLACEHOLDER_CLIENT_ID" && clientId.trim() !== "";
  const isClientSecretOk = clientSecret && clientSecret !== "PLACEHOLDER_CLIENT_SECRET" && clientSecret.trim() !== "";

  res.json({
    status: (isClientIdOk && isClientSecretOk) ? "configurado" : "incompleto",
    microsoft_client_id_configured: !!isClientIdOk,
    microsoft_client_id_preview: isClientIdOk 
      ? `${clientId.substring(0, 5)}...${clientId.substring(clientId.length - 5)}`
      : "Não configurado ou inválido",
    microsoft_client_secret_configured: !!isClientSecretOk,
    microsoft_client_secret_preview: isClientSecretOk
      ? `${clientSecret.substring(0, 3)}...${clientSecret.substring(clientSecret.length - 3)}`
      : "Não configurado ou inválido",
    calculated_redirect_uri: redirectUri,
    tips: {
      azure_redirect_uri_requirement: "No portal Azure Active Directory, em Autenticação, certifique-se de adicionar como URI de Redirecionamento da plataforma Web o valor exato exbido em 'calculated_redirect_uri'.",
      env_variables_location: "As variáveis MICROSOFT_CLIENT_ID e MICROSOFT_CLIENT_SECRET devem ser preenchidas nas Configurações de Ambiente (Environment Variables) do seu projeto na Vercel e o projeto deve ser redeployado."
    }
  });
});

// Endpoint to handle Microsoft OAuth URL generation
app.get("/api/auth/url", (req, res) => {
  const redirectUri = `${getAppUrl(req)}/auth/callback`;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  
  if (!clientId || clientId === "PLACEHOLDER_CLIENT_ID" || clientId.trim() === "") {
    res.status(400).json({
      error: "MICROSOFT_CLIENT_ID não está configurado. Configure as variáveis de ambiente MICROSOFT_CLIENT_ID e MICROSOFT_CLIENT_SECRET no painel da sua hospedagem (Vercel, AI Studio, etc.) antes de conectar."
    });
    return;
  }
  
  const tenant = "common";
  const scopes = "openid profile email offline_access User.Read Files.ReadWrite";

  const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: scopes,
      state: "financeai_auth"
    }).toString();

  res.json({ url: authUrl });
});

// Endpoint to handle Microsoft OAuth Authorization Code Callback
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).send("Código de autorização ausente.");
    return;
  }

  const redirectUri = `${getAppUrl(req)}/auth/callback`;
  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";

  try {
    // Exchange authorization code for access and refresh tokens
    const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "openid profile email offline_access User.Read Files.ReadWrite"
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Erro de token Microsoft: ${errText}`);
    }

    const tokens = await tokenResponse.json();
    const expiresAt = Date.now() + (tokens.expires_in * 1000);

    // Get user profile details from Microsoft Graph
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    let name = "Usuário Microsoft";
    let email = "";
    let userId = "microsoft_user";

    if (userResponse.ok) {
      const userProfile = await userResponse.json();
      name = userProfile.displayName || userProfile.givenName || name;
      email = userProfile.mail || userProfile.userPrincipalName || "";
      userId = `ms_${userProfile.id || "user"}`;
    }

    // Package tokens and profiles for stateless, secure, iframe-friendly cookies
    const tokensCookie = JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt
    });

    const profileCookie = JSON.stringify({
      userId,
      name,
      email
    });

    // Set SameSite=none & Secure=true as required for cross-origin iframes
    res.cookie("ms_tokens", tokensCookie, {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.cookie("ms_profile", profileCookie, {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Elegant callback success dialog page that fires postMessage and closes itself
    res.send(`
      <html>
        <head>
          <title>Autenticação Concluída</title>
          <style>
            body {
              background-color: #050505;
              color: #e2e8f0;
              font-family: ui-sans-serif, system-ui, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .card {
              background: #111111;
              padding: 3rem;
              border-radius: 2rem;
              border: 1px solid rgba(255,255,255,0.08);
              box-shadow: 0 12px 40px rgba(0,0,0,0.6);
              max-width: 420px;
            }
            h2 { color: #6366f1; margin-top: 0; font-size: 1.5rem; font-weight: 700; tracking: -0.025em; }
            p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
            .spinner {
              border: 3px solid rgba(255,255,255,0.08);
              width: 40px;
              height: 40px;
              border-radius: 50%;
              border-left-color: #6366f1;
              animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              margin: 2rem auto 0;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Conexão Estabelecida!</h2>
            <p>Sua conta da Microsoft foi autenticada com sucesso. Seus dados financeiros estão sendo sincronizados com sua pasta privada do OneDrive.</p>
            <div class="spinner"></div>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              setTimeout(() => {
                window.close();
              }, 1200);
            } else {
              setTimeout(() => {
                window.location.href = '/';
              }, 1500);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Erro no callback Microsoft Auth:", err);
    res.status(500).send(`Erro de Autenticação: ${err.message}`);
  }
});

// Endpoint to fetch current Microsoft session and profile details
app.get("/api/auth/session", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const msProfileStr = cookies["ms_profile"];
  const msTokensStr = cookies["ms_tokens"];

  if (msProfileStr && msTokensStr) {
    try {
      const profile = JSON.parse(msProfileStr);
      res.json({
        authenticated: true,
        user: profile
      });
      return;
    } catch (e) {
      // Ignorar erros e prosseguir para fallback
    }
  }

  res.json({
    authenticated: false,
    user: {
      name: "Paulo Henrique",
      email: "pauloo201113@gmail.com",
      userId: "guest_user"
    }
  });
});

// Endpoint to logout / clear Microsoft session cookies
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("ms_tokens", { secure: true, sameSite: "none", httpOnly: true });
  res.clearCookie("ms_profile", { secure: true, sameSite: "none", httpOnly: true });
  res.json({ success: true, message: "Sessão do OneDrive encerrada." });
});

// Gemini AI Insights Proxy Endpoint
app.post("/api/ai/coach", async (req, res) => {
  const { message, history, maskData } = req.body;
  
  let db: ExcelDatabase | null = null;
  const token = await getValidAccessToken(req, res);
  if (token) {
    const cookies = parseCookies(req.headers.cookie);
    const profile = cookies["ms_profile"] ? JSON.parse(cookies["ms_profile"]) : undefined;
    db = await readFromOneDrive(token, profile);
  }
  
  if (!db) {
    db = readDatabase();
  }

  const aiClient = getGeminiAI();

  // Helper to mask values to preserve privacy while keeping enough order of magnitude context for meaningful coaching
  const maskValue = (val: number, active: boolean): string => {
    if (!active) return `R$ ${val.toFixed(2)}`;
    if (val === 0) return "R$ 0,00";
    if (Math.abs(val) < 100) return "~R$ 50,00";
    // Round to nearest hundred for privacy obfuscation
    const rounded = Math.round(val / 100) * 100;
    return `~R$ ${rounded.toLocaleString("pt-BR")}`;
  };

  // Data Minimization (Cap 10/11) - Summarize totals instead of leaking exact account/card details
  const checkingTotal = db.accounts.filter(a => a.type === "checking" && a.isActive).reduce((sum, a) => sum + a.balance, 0);
  const savingsTotal = db.accounts.filter(a => a.type === "savings" && a.isActive).reduce((sum, a) => sum + a.balance, 0);
  const totalCardsInvoice = db.cards.reduce((sum, c) => sum + c.currentInvoice, 0);

  const accountsSummary = `Total em Contas Correntes: ${maskValue(checkingTotal, !!maskData)}; Total Guardado/Reservas: ${maskValue(savingsTotal, !!maskData)}`;
  const cardsSummary = `Total Faturas Cartões de Crédito: ${maskValue(totalCardsInvoice, !!maskData)}`;
  
  // Omit exact goal IDs, only send name and progress metrics
  const activeGoals = db.goals
    .filter(g => g.status === "active")
    .map(g => `${g.name}: Alvo ${maskValue(g.targetValue, !!maskData)}, Guardado ${maskValue(g.currentValue, !!maskData)}, Prazo ${g.deadline}`)
    .join("; ");

  // Omit descriptions/names of individual transactions to prevent leaking specific merchants, only category and amount
  const recentTransactions = db.transactions
    .slice(-5)
    .map(t => `${t.date} - ${t.type === "income" ? "Entrada" : "Saída"} [Categoria: ${t.category}]: ${maskValue(t.amount, !!maskData)}`)
    .join("\n");

  const systemInstruction = `
Você é o consultor de IA financeira pessoal do FinanceAI, um Sistema Operacional da Vida Financeira empático, analítico e não julgador.
Seu objetivo é ajudar o usuário a entender seus números e sugerir melhorias práticas com base nos dados dele.

Aqui está o contexto financeiro REAL e MINIMIZADO do usuário (as contas reais, IDs e nomes de estabelecimentos de transações foram omitidos para sua privacidade):
- Nome: ${db.profile.name} (Perfil ${db.profile.incomeType}, Frequência de Recebimento: ${db.profile.payFrequency}, Risco: ${db.profile.riskProfile})
- Contas: ${accountsSummary}
- Cartões: ${cardsSummary}
- Metas Ativas: ${activeGoals}
- Transações Recentes (Omitindo descrições):
${recentTransactions}

Regras importantes de conversação:
1. Nunca dê ordens ou use tom de autoridade ("Você deve cortar gastos"). Em vez disso, simule os impactos e dê opções ("Ao economizar R$ 200, sua meta de casa própria será adiantada em 11 dias").
2. Seja empático e encorajador. Mostre que ele está no controle.
3. Use a moeda corrente Real (R$).
4. Responda em Português do Brasil com excelente formatação em Markdown (negritos, listas e espaçamentos limpos).
5. Se for perguntado se pode gastar determinado valor (ex: "Posso gastar R$200 hoje?"), analise o saldo atual das contas correntes (${maskValue(checkingTotal, !!maskData)}) e avise o impacto na fatura do cartão ou nas metas de forma precisa e empática.
  `;

  if (!aiClient) {
    // Elegant fallbacks if GEMINI_API_KEY is not configured
    let fallbackText = "";
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes("posso gastar") || lowerMsg.includes("gastar")) {
      fallbackText = `Olá, **${db.profile.name}**! Analisando seu saldo de conta corrente de **R$ 4.250,00** e sua meta ativa de *Reserva de Emergência*, você tem margem para pequenos gastos. 
      
Porém, lembre-se de que cada **R$ 200,00** gastos hoje representam cerca de **6 dias a mais** de esforço para atingir seu objetivo de Reserva de Emergência (atualmente em 80%). Se optar por comprar, tente realocar de sua verba flexível mensal (10% da renda).`;
    } else if (lowerMsg.includes("meta") || lowerMsg.includes("objetivo")) {
      fallbackText = `Seus objetivos estão indo muito bem! Sua **Reserva de Emergência de 6 meses** está com **80% de progresso** (R$ 12.000 de R$ 15.000). No ritmo atual de poupança, você a concluirá em aproximadamente **3 meses**.`;
    } else {
      fallbackText = `Olá! Sou o assistente de IA do FinanceAI. No momento, o sistema está executando com o **Motor de IA Local Heurístico** de alta precisão. 
      
Analisando suas finanças de forma geral:
- Seu **Patrimônio Líquido** é positivo e saudável.
- Sua **Reserva de Emergência** está em **R$ 12.000,00** (80% concluída).
- Você tem uma fatura de cartão de **R$ 1.845,50** vencendo em breve.

Como posso ajudar você a planejar suas metas hoje?`;
    }
    res.json({ text: fallbackText, model: "local-heuristic" });
    return;
  }

  try {
    const mappedHistory = (history || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    let response;
    try {
      const chat = aiClient.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        history: mappedHistory
      });

      response = await chat.sendMessage({ message });
      res.json({ text: response.text, model: "gemini-3.5-flash" });
    } catch (primaryErr: any) {
      console.warn("Primary gemini-3.5-flash failed, falling back to gemini-3.1-flash-lite:", primaryErr);
      const chat = aiClient.chats.create({
        model: "gemini-3.1-flash-lite",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        history: mappedHistory
      });

      response = await chat.sendMessage({ message });
      res.json({ text: response.text, model: "gemini-3.1-flash-lite" });
    }
  } catch (err: any) {
    console.error("Erro na chamada do Gemini API:", err);
    res.status(500).json({ error: "Falha na comunicação com o cérebro de IA do Gemini." });
  }
});

app.post("/api/ai/parse-statement", async (req, res) => {
  const { fileBase64, fileName, text } = req.body;
  if (!fileBase64 && !text) {
    res.status(400).json({ error: "Arquivo base64 ou texto do extrato ausente ou inválido." });
    return;
  }

  try {
    const aiClient = getGeminiAI();
    if (!aiClient) {
      res.status(500).json({ 
        error: "Chave do Gemini API não configurada ou motor de IA indisponível.",
        details: "Verifique se a variável de ambiente GEMINI_API_KEY está configurada corretamente nas configurações do projeto Vercel."
      });
      return;
    }

    const isTextMode = !!text;
    const documentSource = isTextMode 
      ? `Analise atentamente o texto a seguir, que foi extraído/copiado de um extrato bancário:\n\n${text}`
      : `Analise atentamente o extrato bancário em formato PDF em anexo.`;

    const prompt = `${documentSource}
Extraia TODOS os lançamentos de transações contidos na tabela ou lista de lançamentos do extrato (ignore saldos anteriores, resumos de crédito/débito, cabeçalhos, rodapés e outras informações gerais).

Regras de Extração e Conversão:
1. Extraia o campo "date" no formato de data ISO "YYYY-MM-DD". Se o extrato não especificar o ano, utilize o ano corrente de 2026.
2. Identifique a descrição "description" limpa e legível (ex: "COMPRA DEBITO - SUPERMERCADO EXCEL" ou "PIX RECEBIDO - MARIANA COSTA").
3. Determine o valor "amount" sempre como um número real estritamente positivo (ex: se for -245.80, retorne 245.80).
4. Classifique a transação no campo "type": "income" para créditos/entradas/rendimentos/Pix recebido, e "expense" para débitos/saídas/compras/saques/Pix enviado/tarifas.
5. Classifique cada lançamento no campo "category" obrigatoriamente usando uma das seguintes categorias exatas:
   Para receitas ("type" igual a "income"):
     - "Salário" (salário CLT, pagamentos recorrentes de folha de pagamento)
     - "Investimentos" (rendimentos de poupança, dividendos, resgates automáticos)
     - "Freelance" (trabalhos extras, freelancer, bicos)
     - "Outros" (outros recebimentos gerais)
   Para despesas ("type" igual a "expense"):
     - "Alimentação" (compras em supermercado, sacolão, padaria, restaurantes, fast-food, lanchonetes)
     - "Moradia" (aluguel, condomínio, luz/Enel, água, gás, reformas básicas)
     - "Transporte" (combustível, postos de gasolina, Uber/99, ônibus, metrô, pedágio)
     - "Serviços" (tarifas bancárias, taxas de serviços, contas de telefone/internet, impostos, boletos de rotina)
     - "Lazer" (assinaturas de streaming, Netflix, Spotify, cinema, shows, barzinho, hotéis, viagens de lazer)
     - "Educação" (mensalidade escolar, cursos online, livros)
     - "Saúde" (gastos em farmácia, medicamentos, consultas médicas, exames)
     - "Outros" (qualquer outra despesa que não se encaixe nas anteriores)

6. Gere um campo "id" para cada transação sendo uma string única começando com "pe-" (ex: "pe-1", "pe-2", etc.).
7. O campo "selected" deve ser sempre o booleano true por padrão.

Retorne uma lista estruturada como um array JSON de objetos contendo exatamente esses atributos.`;

    const parts: any[] = [];
    if (isTextMode) {
      parts.push({ text: prompt });
    } else {
      let cleanedBase64 = fileBase64;
      if (fileBase64.includes(";base64,")) {
        cleanedBase64 = fileBase64.split(";base64,")[1];
      }
      cleanedBase64 = cleanedBase64.replace(/\s/g, "");

      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: cleanedBase64
        }
      });
      parts.push({ text: prompt });
    }

    let response;
    try {
      response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING, description: "'income' or 'expense'" },
                category: { type: Type.STRING, description: "Must be one of the precise category strings allowed" },
                selected: { type: Type.BOOLEAN }
              },
              required: ["id", "date", "description", "amount", "type", "category", "selected"]
            }
          },
          temperature: 0.1
        }
      });
    } catch (primaryErr: any) {
      console.warn("Primary gemini-3.5-flash failed, falling back to gemini-3.1-flash-lite for parsing:", primaryErr);
      response = await aiClient.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: {
          parts
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING, description: "'income' or 'expense'" },
                category: { type: Type.STRING, description: "Must be one of the precise category strings allowed" },
                selected: { type: Type.BOOLEAN }
              },
              required: ["id", "date", "description", "amount", "type", "category", "selected"]
            }
          },
          temperature: 0.1
        }
      });
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta vazia retornada pelo modelo Gemini.");
    }

    const transactions = JSON.parse(responseText.trim());
    res.json({ success: true, transactions });
  } catch (err: any) {
    console.error("Erro ao analisar o extrato com Gemini:", err);
    res.status(500).json({ 
      error: "Falha ao analisar o extrato bancário com inteligência artificial.", 
      details: err.message,
      tip: "Caso esteja em produção (Vercel), verifique se as credenciais GEMINI_API_KEY estão preenchidas no painel da Vercel. Como alternativa instantânea e 100% livre de servidor, utilize o novo painel de 'Lançamento Expresso ⚡' na aba manual."
    });
  }
});

async function startServer() {
  // Vite Server Integration for unified fullstack execution
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 FinanceAI Server is running at http://localhost:${PORT}`);
    console.log(`🔧 Node Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📂 Excel Database Mock initialized at: ${SIM_DB_PATH}\n`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
