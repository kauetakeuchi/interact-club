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
  phone: optionalText(50),
  birthDate: z.preprocess(emptyToNull, z.coerce.date({ message: "Data de nascimento inválida" }).nullish()),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().regex(/^[a-f0-9]{64}$/i, "Link de verificação inválido"),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email obrigatório").email("Email inválido").max(255),
});

export const perfilSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(255),
  position: optionalText(255),
  bio: optionalText(2000),
  phone: optionalText(50),
  avatarUrl: optionalText(500),
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
  startDate: z.preprocess(emptyToNull, z.coerce.date({ message: "Data de início inválida" }).nullish()),
  endDate: z.preprocess(emptyToNull, z.coerce.date({ message: "Data de término inválida" }).nullish()),
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
  phone: optionalText(50),
  subject: z.string().trim().min(1, "Assunto obrigatório").max(255, "Assunto muito longo (máx. 255)"),
  message: conteudoField(),
});

// ---------- Admin: membros ----------

export const membroUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Nome obrigatório").max(255).optional(),
    email: z.string().trim().toLowerCase().email("Email inválido").max(255).optional(),
    role: z.enum(["MEMBER", "DIRECTOR", "ADMIN"], { message: "Função inválida" }).optional(),
    status: z.enum(["PENDING", "ACTIVE", "INACTIVE"], { message: "Status inválido" }).optional(),
    position: optionalText(255),
    password: passwordSchema.optional(),
  })
  .refine((obj) => Object.values(obj).some((v) => v !== undefined), {
    message: "Nenhum campo para atualizar",
  });
