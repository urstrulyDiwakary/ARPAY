-- Flyway Migration: Alter avatar column to support large Base64 images
-- File: V2__Alter_Avatar_Column.sql

ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;

