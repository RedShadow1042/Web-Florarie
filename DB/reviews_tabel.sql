-- -----------------------------------------------
-- Tabela: reviews (Varianta corectată)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `reviews` (
    `id`           INT AUTO_INCREMENT PRIMARY KEY,
    `user_id`      INT NOT NULL,
    `user_name`    VARCHAR(150) NOT NULL,
    `type`         ENUM('general','product') NOT NULL DEFAULT 'general',
    `product_id`   INT DEFAULT NULL,
    `product_name` VARCHAR(200) DEFAULT NULL,
    `title`        VARCHAR(200) NOT NULL,
    `body`         TEXT NOT NULL,
    `rating`       TINYINT NOT NULL DEFAULT 5,
    `image`        MEDIUMTEXT DEFAULT NULL,
    `status`       ENUM('pending','approved','rejected') DEFAULT 'pending',
    `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 