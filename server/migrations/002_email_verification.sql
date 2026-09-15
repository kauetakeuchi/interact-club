-- Execute este arquivo UMA VEZ em bancos criados antes da verificação de email.
USE interact_club;

ALTER TABLE `user`
  ADD COLUMN emailVerifiedAt TIMESTAMP NULL AFTER birthDate,
  ADD COLUMN emailVerificationTokenHash CHAR(64) NULL AFTER emailVerifiedAt,
  ADD COLUMN emailVerificationExpiresAt DATETIME NULL AFTER emailVerificationTokenHash,
  ADD INDEX idx_user_email_verification_token (emailVerificationTokenHash);

-- Contas que já existiam antes desta funcionalidade continuam válidas.
UPDATE `user`
SET emailVerifiedAt = COALESCE(createdAt, CURRENT_TIMESTAMP)
WHERE emailVerifiedAt IS NULL;
