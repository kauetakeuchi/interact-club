import { z } from "zod";

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const uuid = z.string().uuid("Identificador inválido");

// Alinhados aos limites do schema SQL: title VARCHAR(255), TEXT suporta 65535 bytes
// (limite de 10k caracteres evita estouro com utf8mb4/emojis)
const tituloField = () =>
  z.string().trim().min(1, "Título obrigatório").max(255, "Título muito longo (máx. 255)");
const descricaoField = () =>
  z.string().trim().min(1, "Descrição obrigatória").max(10000, "Descrição muito longa (máx. 10.000 caracteres)");
const conteudoField = () =>
  z.string().trim().min(1, "Conteúdo obrigatório").max(10000, "Conteúdo muito longo (máx. 10.000 caracteres)");

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullish());

// Datas sem horário (colunas DATE) permanecem como texto YYYY-MM-DD.
// Converter para Date deslocaria o dia ao gravar no fuso do clube.
const dateOnlyField = (message: string) =>
  z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .refine((value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
      }, message)
      .nullish()
  );

// Data de nascimento: mesmo formato YYYY-MM-DD, entre 1900 e hoje.
function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
const birthDateField = () =>
  z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .refine((value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
      }, "Data de nascimento inválida")
      .refine((value) => value >= "1900-01-01" && value <= todayIso(), "Data de nascimento inválida")
      .nullish()
  );

// ---------- Telefone (padrão brasileiro) ----------
// Guardado só com dígitos: DDD + número (10 dígitos fixo, 11 celular).
// A mesma regra está em public/js/lib/phone.js; altere as duas juntas.
const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/** Número sem o DDD (e sem o 9 inicial do celular) é uma sequência óbvia? */
function isObviousSequence(digits: string): boolean {
  if (/^(\d)\1+$/.test(digits)) return true;
  const steps = new Set<number>();
  for (let i = 1; i < digits.length; i++) steps.add((Number(digits[i]) - Number(digits[i - 1]) + 10) % 10);
  // 12345678, 23456789, 87654321...
  return steps.size === 1 && (steps.has(1) || steps.has(9));
}

/** Retorna a mensagem de erro, ou null quando o número é válido. Recebe só dígitos. */
export function phoneProblem(digits: string): string | null {
  if (digits.length !== 10 && digits.length !== 11) {
    return "Telefone deve ter DDD + número: 10 dígitos (fixo) ou 11 (celular)";
  }
  if (!VALID_DDDS.has(Number(digits.slice(0, 2)))) return "DDD inexistente";
  const local = digits.slice(2);
  if (digits.length === 11 && local[0] !== "9") return "Celular deve começar com 9 depois do DDD";
  if (digits.length === 10 && !/^[2-5]/.test(local)) return "Telefone fixo deve começar com 2, 3, 4 ou 5 depois do DDD";
  const subscriber = digits.length === 11 ? local.slice(1) : local;
  if (isObviousSequence(subscriber)) return "Telefone inválido";
  return null;
}

const phoneField = () =>
  z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .max(30, "Telefone inválido")
      .regex(/^\+?[\d\s().-]+$/, "Telefone deve conter só números")
      .transform((value, ctx) => {
        let digits = value.replace(/\D/g, "");
        // +55 / 55 na frente (código do Brasil) é aceito e removido.
        if (value.startsWith("+") || digits.length > 11) {
          if (!digits.startsWith("55")) {
            ctx.addIssue({ code: "custom", message: "Use um telefone do Brasil" });
            return z.NEVER;
          }
          digits = digits.slice(2);
        }
        const problem = phoneProblem(digits);
        if (problem) {
          ctx.addIssue({ code: "custom", message: problem });
          return z.NEVER;
        }
        return digits;
      })
      .nullish()
  );

const passwordSchema = z.string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .max(100, "Senha muito longa")
  .regex(/\p{Lu}/u, "Senha deve ter pelo menos uma letra maiúscula")
  .regex(/\p{Ll}/u, "Senha deve ter pelo menos uma letra minúscula")
  .regex(/\p{Nd}/u, "Senha deve ter pelo menos um número")
  .regex(/[^\p{L}\p{N}\s]/u, "Senha deve ter pelo menos um caractere especial");

// ---------- Auth ----------

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email obrigatório").email("Email inválido").max(255),
  password: z.string().min(1, "Senha obrigatória"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(255),
  email: z.string().trim().toLowerCase().min(1, "Email obrigatório").email("Email inválido").max(255),
  password: passwordSchema,
  emailUpdatesOptIn: z.boolean().default(false),
  phone: phoneField(),
  birthDate: birthDateField(),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().regex(/^[a-f0-9]{64}$/i, "Link de verificação inválido"),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email obrigatório").email("Email inválido").max(255),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email obrigatório").email("Email inválido").max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().regex(/^[a-f0-9]{64}$/i, "Link de redefinição inválido"),
  password: passwordSchema,
});

export const perfilSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(255),
  position: optionalText(255),
  bio: optionalText(2000),
  phone: phoneField(),
  emailUpdatesOptIn: z.boolean().optional(),
});

// ---------- Eventos ----------

export const inscricaoSchema = z.object({
  eventId: uuid,
});

export const cancelamentoSchema = z.object({
  signupId: uuid,
});

// ---------- Admin: eventos / projetos / notícias / avisos ----------

export const eventoSchema = z.object({
  title: tituloField(),
  description: descricaoField(),
  date: z.coerce.date({ message: "Data inválida" }),
  location: optionalText(255),
  imageUrl: optionalText(500),
  isPublic: z.boolean().default(true),
  maxParticipants: z.preprocess(
    emptyToNull,
    z.coerce
      .number({ message: "Vagas deve ser um número" })
      .int("Vagas deve ser um número inteiro")
      .min(1, "Vagas deve ser maior que zero")
      .nullish()
  ),
});

export const projetoSchema = z.object({
  title: tituloField(),
  description: descricaoField(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED"]).default("PLANNING"),
  startDate: dateOnlyField("Data de início inválida"),
  endDate: dateOnlyField("Data de término inválida"),
  imageUrl: optionalText(500),
  isPublic: z.boolean().default(true),
});

export const noticiaSchema = z.object({
  title: tituloField(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug obrigatório")
    .max(255)
    .regex(/^\S+$/, "Slug não pode conter espaços"),
  content: conteudoField(),
  excerpt: optionalText(500),
  imageUrl: optionalText(500),
  category: optionalText(100),
  published: z.boolean().default(false),
});

export const avisoSchema = z.object({
  title: tituloField(),
  content: conteudoField(),
});

// ---------- Contato ----------

export const contatoSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(255, "Nome muito longo (máx. 255)"),
  email: z.string().trim().min(1, "Email obrigatório").email("Email inválido").max(255),
  phone: phoneField(),
  subject: z.string().trim().min(1, "Assunto obrigatório").max(255, "Assunto muito longo (máx. 255)"),
  message: conteudoField(),
  // Campo invisível para humanos: quando preenchido, o envio é descartado.
  website: z.string().max(500).optional(),
});

// ---------- Admin: membros ----------

export const membroUpdateSchema = z
  .object({
    role: z.enum(["MEMBER", "DIRECTOR", "ADMIN"], { message: "Função inválida" }).optional(),
    status: z.enum(["PENDING", "ACTIVE", "INACTIVE"], { message: "Status inválido" }).optional(),
    position: optionalText(255),
  })
  .refine((obj) => Object.values(obj).some((v) => v !== undefined), {
    message: "Nenhum campo para atualizar",
  });
