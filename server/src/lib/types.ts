/**
 * Formato das linhas que o MySQL devolve para cada tabela (ver migrations/001_schema.sql).
 * Colunas BOOLEAN chegam como 0/1, por isso `Flag`.
 */
export type Flag = number | boolean;

export type Role = "MEMBER" | "DIRECTOR" | "ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "INACTIVE";
export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordChangedAt: Date | null;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  position: string | null;
  bio: string | null;
  phone: string | null;
  birthDate: Date | null;
  emailVerifiedAt: Date | null;
  emailVerificationTokenHash: string | null;
  emailVerificationExpiresAt: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  emailUpdatesOptIn: Flag;
  emailUpdatesOptInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventRow {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string | null;
  imageUrl: string | null;
  isPublic: Flag;
  maxParticipants: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Evento com o total de inscritos (subconsulta `signupCount`). */
export interface EventWithSignups extends EventRow {
  signupCount: number;
}

export interface ProjectRow {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  imageUrl: string | null;
  isPublic: Flag;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  category: string | null;
  published: Flag;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoticeRow {
  id: string;
  title: string;
  content: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: Flag;
  createdAt: Date;
}

/** Linha com o nome do autor vindo de `LEFT JOIN user` (`u.name as authorName`). */
export type WithAuthorName<T> = T & { authorName: string | null };

/** Troca `authorName` por `author: { name }`, o formato que o frontend usa. */
export function withAuthor<T>({ authorName, ...row }: WithAuthorName<T>) {
  return { ...row, author: { name: authorName } };
}
