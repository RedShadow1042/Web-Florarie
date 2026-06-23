-- Migrare: adauga coloane pentru pozitii independente
-- Ruleaza in phpMyAdmin > SQL
-- Daca ai rulat deja migrarea anterioara (title_x etc exista), sari peste acest fisier.

ALTER TABLE hero_slides
    ADD COLUMN IF NOT EXISTS title_x INT NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS title_y INT NOT NULL DEFAULT 35,
    ADD COLUMN IF NOT EXISTS sub_x   INT NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS sub_y   INT NOT NULL DEFAULT 55,
    ADD COLUMN IF NOT EXISTS btn_x   INT NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS btn_y   INT NOT NULL DEFAULT 72;
