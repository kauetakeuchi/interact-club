-- Interact Club Database Schema
-- Charset utf8mb4: suporta acentuação completa e emojis

CREATE DATABASE IF NOT EXISTS interact_club CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE interact_club;

CREATE TABLE IF NOT EXISTS `user` (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  passwordChangedAt DATETIME NULL,
  role ENUM('MEMBER', 'DIRECTOR', 'ADMIN') NOT NULL DEFAULT 'MEMBER',
  `status` ENUM('PENDING', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'PENDING',
  avatarUrl VARCHAR(500) NULL,
  `position` VARCHAR(255) NULL,
  bio TEXT NULL,
  phone VARCHAR(50) NULL,
  birthDate DATE NULL,
  emailVerifiedAt TIMESTAMP NULL,
  emailVerificationTokenHash CHAR(64) NULL,
  emailVerificationExpiresAt DATETIME NULL,
  passwordResetTokenHash CHAR(64) NULL,
  passwordResetExpiresAt DATETIME NULL,
  emailUpdatesOptIn BOOLEAN NOT NULL DEFAULT FALSE,
  emailUpdatesOptInAt DATETIME NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_email_verification_token (emailVerificationTokenHash),
  INDEX idx_user_password_reset_token (passwordResetTokenHash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event` (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  `date` DATETIME NOT NULL,
  location VARCHAR(255) NULL,
  imageUrl VARCHAR(500) NULL,
  isPublic BOOLEAN DEFAULT TRUE,
  maxParticipants INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_event_public_date (isPublic, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eventsignup (
  id VARCHAR(36) PRIMARY KEY,
  eventId VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eventId) REFERENCES `event`(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES `user`(id) ON DELETE CASCADE,
  UNIQUE KEY unique_signup (eventId, userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project` (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  `status` ENUM('PLANNING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PLANNING',
  startDate DATE NULL,
  endDate DATE NULL,
  imageUrl VARCHAR(500) NULL,
  isPublic BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_project_public_created (isPublic, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsarticle (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT NULL,
  imageUrl VARCHAR(500) NULL,
  category VARCHAR(100) NULL,
  published BOOLEAN DEFAULT FALSE,
  authorId VARCHAR(36) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (authorId) REFERENCES `user`(id) ON DELETE SET NULL,
  INDEX idx_news_published_created (published, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notice (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  userId VARCHAR(36) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES `user`(id) ON DELETE SET NULL,
  INDEX idx_notice_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_read_created (isRead, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ATUALIZAÇÃO DE BANCO EXISTENTE (versões anteriores do schema)
-- Se você já tinha o banco criado sem essas colunas/charset,
-- descomente e execute os comandos abaixo:
--
-- ALTER TABLE `user` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE `event` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE `eventsignup` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE `project` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE `newsarticle` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE `notice` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--
-- Página de contato (adicionada depois):
-- CREATE TABLE IF NOT EXISTS contact (
--   id VARCHAR(36) PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   email VARCHAR(255) NOT NULL,
--   phone VARCHAR(50) NULL,
--   subject VARCHAR(255) NOT NULL,
--   message TEXT NOT NULL,
--   isRead BOOLEAN DEFAULT FALSE,
--   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ============================================================
