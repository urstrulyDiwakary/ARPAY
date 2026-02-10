-- Ensure attachments column is JSONB
ALTER TABLE invoices ALTER COLUMN attachments TYPE JSONB USING attachments::jsonb;
