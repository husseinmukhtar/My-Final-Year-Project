-- =============================================================
-- patch_users_password_column.sql
-- Safe production patch: widen users.password to VARCHAR(255).
--
-- Bcrypt hashes are exactly 60 characters ($2a$10$...).
-- A column shorter than 60 causes silent truncation in MySQL
-- non-strict mode, making bcrypt.compare() always return false.
-- VARCHAR(255) gives ample headroom for all common hash formats.
--
-- Safe to re-run: widening a VARCHAR column in MySQL never
-- destroys existing data.
-- =============================================================

ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL;
