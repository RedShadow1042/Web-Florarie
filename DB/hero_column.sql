-- =============================================
-- Adauga coloane noi la hero_slides
-- phpMyAdmin -> floraria_das -> Import -> acest fisier
-- =============================================

USE `floraria_das`;

ALTER TABLE `hero_slides`
    ADD COLUMN `bg_image` MEDIUMTEXT DEFAULT NULL AFTER `bg`,
    ADD COLUMN `pos_x`    INT DEFAULT 5  AFTER `bg_image`,
    ADD COLUMN `pos_y`    INT DEFAULT 30 AFTER `pos_x`,
    ADD COLUMN `grad_dir` VARCHAR(50) DEFAULT 'to right' AFTER `pos_y`,
    ADD COLUMN `grad_str` INT DEFAULT 55 AFTER `grad_dir`;