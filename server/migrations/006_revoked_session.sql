-- Sessões encerradas pelo botão "Sair". O token continua assinado até expirar,
-- então guardamos o identificador dele (jti) para recusá-lo até lá.
-- Bancos novos já recebem esta tabela pelo 001_schema.sql.
USE interact_club;

CREATE TABLE IF NOT EXISTS revoked_session (
  jti VARCHAR(36) PRIMARY KEY,
  expiresAt DATETIME NOT NULL,
  INDEX idx_revoked_session_expires (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
