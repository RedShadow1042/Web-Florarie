-- =============================================
-- D.A.S Lotus - Baza de date MySQL
-- Importa acest fisier in phpMyAdmin:
-- Selecteaza floraria_das -> Import -> alege fisierul -> Go
-- =============================================

USE `floraria_das`;

-- -----------------------------------------------
-- Tabela: utilizatori
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `name`       VARCHAR(150) NOT NULL,
    `email`      VARCHAR(150) NOT NULL UNIQUE,
    `password`   VARCHAR(255) NOT NULL,
    `role`       ENUM('customer','admin') DEFAULT 'customer',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------
-- Tabela: produse (buchete)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `name`        VARCHAR(200) NOT NULL,
    `price`       INT NOT NULL DEFAULT 0,
    `discount`    INT NOT NULL DEFAULT 0,
    `description` TEXT,
    `image`       MEDIUMTEXT,
    `active`      TINYINT(1) DEFAULT 1,
    `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------
-- Tabela: comenzi
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
    `id`             VARCHAR(30) PRIMARY KEY,
    `user_id`        INT,
    `customer_name`  VARCHAR(150),
    `customer_email` VARCHAR(150),
    `items`          TEXT NOT NULL,
    `total`          INT NOT NULL DEFAULT 0,
    `status`         ENUM('active','completed','Anulata') DEFAULT 'active',
    `date`           VARCHAR(50),
    `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------
-- Tabela: hero slides
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `hero_slides` (
    `id`       INT AUTO_INCREMENT PRIMARY KEY,
    `title`    TEXT,
    `subtitle` TEXT,
    `btn_text` VARCHAR(100),
    `btn_link` VARCHAR(200),
    `bg`       VARCHAR(300) DEFAULT '#f5ebe1',
    `active`   TINYINT(1) DEFAULT 1,
    `sort_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -----------------------------------------------
-- Date initiale: 5 produse demo
-- -----------------------------------------------
INSERT INTO `products` (`name`, `price`, `discount`, `description`, `image`, `active`) VALUES
('Buchet 1',   150,  20, 'Un buchet superb plin de trandafiri rosii proaspeti, perfect aranjati intr-un cos traditional.', 'Imagini/buchet1.jpg', 1),
('Test 2',     3000,  0, 'Un aranjament floral spectaculos de proportii monumentale.', 'Imagini/buchet2.jpg', 1),
('Test3',       123, 15, 'Buchet colorat de primavara alcatuit din flori parfumate.', 'Imagini/buchet3.jpg', 1),
('Test 4',    12313,  0, 'Creatie florala unica destinata ocaziilor de protocol.', 'Imagini/buchet4.jpg', 1),
('Buchet 123',  123,  0, 'Buchet personalizat simplu si elegant.', 'Imagini/blank_image.jpg', 1);
