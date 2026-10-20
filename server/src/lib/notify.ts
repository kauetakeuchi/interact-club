import { query } from "./db";
import { logError } from "./logger";
import { sendContentNotificationEmail, type ContentKind } from "./email";

export type { ContentKind };

export interface ContentNotification {
  title: string;
  summary?: string | null;
  url?: string | null;
  imageUrl?: string | null;
}

const BCC_BATCH_SIZE = 50;

function appBaseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3001").replace(/\/$/, "");
}

export function buildContentUrl(kind: ContentKind, identifier: string): string {
  const base = appBaseUrl();
  if (kind === "noticia") return `${base}/noticias?slug=${encodeURIComponent(identifier)}`;
  if (kind === "evento") return `${base}/eventos?id=${encodeURIComponent(identifier)}`;
  return `${base}/projetos?id=${encodeURIComponent(identifier)}`;
}

export async function getNotificationRecipients(): Promise<string[]> {
  const rows = await query<{ email: string }[]>(
    "SELECT email FROM `user` WHERE `status` = 'ACTIVE' AND emailVerifiedAt IS NOT NULL"
  );
  return rows.map((r) => r.email).filter(Boolean);
}

export async function notifyContentPublished(kind: ContentKind, content: ContentNotification): Promise<number> {
  try {
    const recipients = await getNotificationRecipients();
    if (recipients.length === 0) return 0;
    for (let i = 0; i < recipients.length; i += BCC_BATCH_SIZE) {
      const batch = recipients.slice(i, i + BCC_BATCH_SIZE);
      try {
        await sendContentNotificationEmail(kind, content, batch);
      } catch (err) {
        logError(`notify/${kind}/batch`, err);
      }
    }
    return recipients.length;
  } catch (err) {
    logError(`notify/${kind}`, err);
    return 0;
  }
}

export function notifyContentPublishedAsync(kind: ContentKind, content: ContentNotification): void {
  void notifyContentPublished(kind, content);
}
