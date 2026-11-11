-- Execute este arquivo UMA VEZ em bancos criados antes da redefinição de senha.
-- Bancos novos já recebem tudo pelo 001_schema.sql e não precisam deste arquivo.
USE interact_club;

ALTER TABLE `user`
  ADD COLUMN passwordChangedAt DATETIME NULL AFTER passwordHash,
  ADD COLUMN passwordResetTokenHash CHAR(64) NULL AFTER emailVerificationExpiresAt,
  ADD COLUMN passwordResetExpiresAt DATETIME NULL AFTER passwordResetTokenHash,
  ADD INDEX idx_user_password_reset_token (passwordResetTokenHash);

ALTER TABLE `event`
  ADD INDEX idx_event_public_date (isPublic, `date`);

ALTER TABLE `project`
  ADD INDEX idx_project_public_created (isPublic, createdAt);

ALTER TABLE `newsarticle`
  ADD INDEX idx_news_published_created (published, createdAt);

ALTER TABLE `notice`
  ADD INDEX idx_notice_created (createdAt);

ALTER TABLE `contact`
  ADD INDEX idx_contact_read_created (isRead, createdAt);

-- Sessões emitidas antes desta atualização continuam válidas; a partir daqui,
-- trocar a senha invalida automaticamente os tokens antigos.
