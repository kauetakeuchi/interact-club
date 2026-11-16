-- Bancos criados antes de project.updatedAt existir no 001_schema.sql.
-- Bancos novos já recebem a coluna pelo 001 e não precisam deste arquivo.
USE interact_club;

ALTER TABLE `project`
  ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt;
