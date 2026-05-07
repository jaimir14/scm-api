-- Rename column `password` to `password_hash` in users table.
-- All existing values are already bcrypt hashes — no data transformation needed.
ALTER TABLE `users` CHANGE COLUMN `password` `password_hash` VARCHAR(255) NOT NULL;
