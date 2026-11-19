import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
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
import { publicDir } from "./lib/storage";

function configuredOrigin(): string {
  try {
    return new URL(process.env.APP_URL || "http://localhost:3001").origin;
  } catch {
    throw new Error("APP_URL inválida. Configure a URL pública do site em server/.env.");
  }
}

export function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  const appOrigin = configuredOrigin();
  const disableRateLimit = process.env.DISABLE_RATE_LIMIT === "1";

  // Atrás de proxy reverso (nginx, Cloudflare etc.) defina TRUST_PROXY=1
  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy === "1" || trustProxy === "true") app.set("trust proxy", 1);
  else if (trustProxy) app.set("trust proxy", trustProxy);

  app.disable("x-powered-by");
  // Evita que respostas JSON quebrem a página ao serem interpretadas como HTML.
  app.set("json escape", true);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
          "font-src": ["'self'"],
          "connect-src": ["'self'"],
          "media-src": ["'self'"],
          // Mapa da página "Sobre" é um iframe do Google Maps.
          "frame-src": ["https://www.google.com"],
          "object-src": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'"],
          "frame-ancestors": ["'none'"],
          ...(isProduction && appOrigin.startsWith("https:") ? { "upgrade-insecure-requests": [] } : {}),
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(compression());
  app.use(cors({ origin: appOrigin, credentials: true }));
  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());

  // Requisições que mudam estado só são aceitas da própria origem (proteção CSRF).
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
    const origin = req.get("origin");
    if (!origin) return next();
    const requestOrigin = `${req.protocol}://${req.get("host")}`;
    if (origin === requestOrigin || origin === appOrigin) return next();
    return res.status(403).json({ message: "Origem não permitida" });
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => disableRateLimit,
    message: { message: "Muitas requisições. Tente novamente mais tarde." },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => disableRateLimit,
    message: { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
  });

  const contactLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => disableRateLimit,
    message: { message: "Muitas mensagens enviadas. Aguarde alguns minutos." },
  });

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/resend-verification", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
  app.use("/api/auth/reset-password", authLimiter);
  app.use("/api/contato", contactLimiter);
  app.use("/api", apiLimiter);

  app.use(
    express.static(publicDir, {
      etag: true,
      lastModified: true,
      setHeaders(res, filePath) {
        const normalized = filePath.split(path.sep).join("/");
        if (normalized.includes("/public/fonts/") || normalized.includes("/public/uploads/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (/\.(?:png|jpe?g|webp|gif|svg|ico)$/i.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=2592000");
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/eventos", eventosRoutes);
  app.use("/api/projetos", projetosRoutes);
  app.use("/api/noticias", noticiasRoutes);
  app.use("/api/avisos", avisosRoutes);
  app.use("/api/membros", membrosRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/contato", contatoRoutes);

  // Rotas de API inexistentes respondem JSON, nunca HTML.
  app.use("/api", (_req, res) => res.status(404).json({ message: "Rota não encontrada" }));

  // Fallback: URLs limpas (/sobre) viram sobre.html; arquivos ausentes dão 404.
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ message: "Rota não encontrada" });
    }
    if (req.path.startsWith("/uploads/") || path.extname(req.path)) {
      return res.status(404).type("text").send("Não encontrado");
    }

    const requested = req.path === "/" ? "index.html" : `${req.path.slice(1)}.html`;
    const resolved = path.resolve(publicDir, requested);
    if (!resolved.startsWith(publicDir + path.sep)) {
      return res.sendFile(path.join(publicDir, "index.html"));
    }
    return res.sendFile(resolved, (err) => {
      if (err) res.sendFile(path.join(publicDir, "index.html"));
    });
  });

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);

    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const maxMb = req.originalUrl.startsWith("/api/upload/avatar") ? 2 : 5;
      const message = err.code === "LIMIT_FILE_SIZE"
        ? `Imagem muito grande (máximo de ${maxMb} MB)`
        : "Não foi possível enviar o arquivo";
      return res.status(status).json({ message });
    }

    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ message: "JSON inválido" });
    }

    const error = err as { status?: number; message?: string; type?: string };
    const status = error.type === "entity.too.large"
      ? 413
      : Number.isInteger(error?.status) && error.status! >= 400 && error.status! < 500
        ? error.status!
        : 500;

    if (status >= 500) logError(`http:${req.method} ${req.path}`, err);
    const message = status === 413
      ? "Conteúdo muito grande"
      : status >= 500
        ? "Erro interno do servidor"
        : error.message || "Requisição inválida";
    return res.status(status).json({ message });
  });

  return app;
}
