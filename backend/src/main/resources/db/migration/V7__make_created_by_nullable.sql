-- Make created_by nullable temporarily to allow system user creation
ALTER TABLE invoices ALTER COLUMN created_by DROP NOT NULL;
