

ALTER TABLE hero_slides
    ADD COLUMN title_x INT NOT NULL DEFAULT 50 AFTER pos_y,
    ADD COLUMN title_y INT NOT NULL DEFAULT 35 AFTER title_x,
    ADD COLUMN sub_x   INT NOT NULL DEFAULT 50 AFTER title_y,
    ADD COLUMN sub_y   INT NOT NULL DEFAULT 55 AFTER sub_x,
    ADD COLUMN btn_x   INT NOT NULL DEFAULT 50 AFTER sub_y,
    ADD COLUMN btn_y   INT NOT NULL DEFAULT 72 AFTER btn_x;

-- Coloanele vechi pos_x / pos_y pot fi lasate (backward compat) sau sterse:
-- ALTER TABLE hero_slides DROP COLUMN pos_x, DROP COLUMN pos_y;