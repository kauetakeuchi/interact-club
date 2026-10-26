-- Execute uma vez em bancos existentes, antes de publicar a versão com preferência de emails.
-- Contas já cadastradas ficam sem receber novidades até escolherem receber no perfil.
USE interact_club;

ALTER TABLE `user`
  ADD COLUMN emailUpdatesOptIn BOOLEAN NOT NULL DEFAULT FALSE AFTER emailVerificationExpiresAt,
  ADD COLUMN emailUpdatesOptInAt DATETIME NULL AFTER emailUpdatesOptIn;
