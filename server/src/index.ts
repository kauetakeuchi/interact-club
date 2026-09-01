import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth";
import eventosRoutes from "./routes/eventos";
import projetosRoutes from "./routes/projetos";
import noticiasRoutes from "./routes/noticias";
import avisosRoutes from "./routes/avisos";
import membrosRoutes from "./routes/membros";
import adminRoutes from "./routes/admin";
import uploadRoutes from "./routes/upload";
import contatoRoutes from "./routes/contato";
import { logError } from "./lib/logger";
import { closePool } from "./lib/db";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Security headers
// CSP desativada: o frontend usa scripts inline e onclick handlers — ativar quebraria o site.
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Muitas requisições. Tente novamente mais tarde." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", apiLimiter);

// Static files
app.use(express.static(path.join(__dirname, "../../public")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/projetos", projetosRoutes);
app.use("/api/noticias", noticiasRoutes);
app.use("/api/avisos", avisosRoutes);
app.use("/api/membros", membrosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contato", contatoRoutes);

// Central error handler (erros async não tratados caem aqui via ah())
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (res.headersSent) return;
  const status = (err as any)?.status ?? 500;
  if (status >= 500) logError("nao-tratado", err);
  res.status(status).json({ message: (err as any)?.message || "Erro interno do servidor" });
});

// SPA fallback (serve index.html for all non-API, non-file routes)
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ message: "Rota não encontrada" });
  const publicDir = path.join(__dirname, "../../public");
  const requested = req.path === "/" ? "index.html" : req.path + ".html";
  const resolved = path.normalize(path.join(publicDir, requested));
  if (!resolved.startsWith(publicDir)) {
    return res.sendFile(path.join(publicDir, "index.html"));
  }
  res.sendFile(resolved, (err) => {
    if (err) res.sendFile(path.join(publicDir, "index.html"));
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} recebido — encerrando...`);
    closePool()
      .catch(() => {})
      .finally(() => process.exit(0));
  });
}
