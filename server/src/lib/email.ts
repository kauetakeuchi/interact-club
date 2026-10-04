import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

const providerPresets = {
  gmail: { host: "smtp.gmail.com", port: 465, secure: true },
  brevo: { host: "smtp-relay.brevo.com", port: 587, secure: false },
  resend: { host: "smtp.resend.com", port: 465, secure: true },
  hostinger: { host: "smtp.hostinger.com", port: 465, secure: true },
} as const;

type PresetProvider = keyof typeof providerPresets;
type EmailProvider = PresetProvider | "smtp";

function env(name: string): string {
  return process.env[name]?.trim() || "";
}

export function getTransporter(): Transporter {
  if (transporter) return transporter;

  const provider = (env("EMAIL_PROVIDER") || "smtp").toLowerCase() as EmailProvider;
  if (provider !== "smtp" && !(provider in providerPresets)) {
    throw new Error("EMAIL_PROVIDER inválido. Use gmail, brevo, resend, hostinger ou smtp.");
  }

  const preset = provider === "smtp" ? null : providerPresets[provider as PresetProvider];
  const host = env("SMTP_HOST") || preset?.host || "";
  const port = Number(env("SMTP_PORT") || preset?.port || 587);
  const secureSetting = env("SMTP_SECURE");
  const secure = secureSetting ? secureSetting.toLowerCase() === "true" : (preset?.secure ?? false);
  const from = env("SMTP_FROM");
  if (!host || !from) {
    throw new Error("Envio de email não configurado. Defina SMTP_HOST e SMTP_FROM.");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT inválida.");
  }

  const user = env("SMTP_USER") || (provider === "resend" ? "resend" : "");
  const pass = env("SMTP_PASS").replace(/\s+/g, "");
  if (provider !== "smtp" && (!user || !pass)) {
    throw new Error(`Credenciais ausentes para o provedor ${provider}. Defina SMTP_USER e SMTP_PASS.`);
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporter;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char]!);
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const appUrl = (env("APP_URL") || "http://localhost:3001").replace(/\/$/, "");
  const verificationUrl = `${appUrl}/verificar-email?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verificationUrl);

  await getTransporter().sendMail({
    from: env("SMTP_FROM"),
    to,
    subject: "Confirme seu email — Interact Club",
    text: [
      `Olá, ${name}!`,
      "",
      "Confirme seu email para concluir seu cadastro no Interact Club:",
      verificationUrl,
      "",
      "Este link expira em 24 horas. Se você não fez este cadastro, ignore esta mensagem.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937;line-height:1.6">
        <h1 style="color:#17458f;font-size:24px">Confirme seu email</h1>
        <p>Olá, ${safeName}!</p>
        <p>Clique no botão abaixo para concluir seu cadastro no Interact Club.</p>
        <p style="margin:28px 0">
          <a href="${safeUrl}" style="background:#17458f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block">Confirmar meu email</a>
        </p>
        <p style="font-size:14px;color:#6b7280">O link expira em 24 horas. Se você não fez este cadastro, ignore esta mensagem.</p>
      </div>
    `,
  });
}

export type ContentKind = "noticia" | "evento" | "projeto";

const contentLabels: Record<ContentKind, { subject: string; heading: string; cta: string }> = {
  noticia: { subject: "Nova notícia publicada", heading: "Nova notícia no Interact Club", cta: "Ler notícia" },
  evento: { subject: "Novo evento publicado", heading: "Novo evento no Interact Club", cta: "Ver evento" },
  projeto: { subject: "Novo projeto publicado", heading: "Novo projeto no Interact Club", cta: "Ver projeto" },
};

export async function sendContentNotificationEmail(
  kind: ContentKind,
  content: { title: string; summary?: string | null; url?: string | null },
  bcc: string[]
): Promise<void> {
  if (bcc.length === 0) return;
  const label = contentLabels[kind];
  const safeTitle = escapeHtml(content.title);
  const safeSummary = content.summary ? escapeHtml(content.summary.slice(0, 500)) : "";
  const safeUrl = content.url ? escapeHtml(content.url) : "";
  const from = env("SMTP_FROM");

  await getTransporter().sendMail({
    from,
    to: from,
    bcc,
    subject: `${label.subject}: ${content.title}`.slice(0, 200),
    text: [
      label.heading,
      "",
      content.title,
      content.summary || "",
      content.url ? `Acesse: ${content.url}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937;line-height:1.6">
        <h1 style="color:#17458f;font-size:22px">${label.heading}</h1>
        <h2 style="font-size:18px;margin:0 0 8px">${safeTitle}</h2>
        ${safeSummary ? `<p>${safeSummary}</p>` : ""}
        ${
          safeUrl
            ? `<p style="margin:24px 0"><a href="${safeUrl}" style="background:#17458f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block">${label.cta}</a></p>`
            : ""
        }
      </div>
    `,
  });
}
