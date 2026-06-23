-- =============================================
-- Adauga coloana tags la tabela reviews
-- phpMyAdmin -> floraria_das -> Import -> acest fisier
-- =============================================

USE `floraria_das`;

ALTER TABLE `reviews` ADD COLUMN `tags` VARCHAR(300) DEFAULT NULL AFTER `image`;
