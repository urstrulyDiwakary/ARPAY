-- Add missing columns to existing invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_name VARCHAR(200);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS token_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS agreement_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS registration_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS agreement_due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS agreement_due_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS registration_due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS registration_due_amount DECIMAL(15, 2) DEFAULT 0;

-- Rename clientName column to customer_name if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='invoices' AND column_name='clientname') THEN
        ALTER TABLE invoices RENAME COLUMN clientName TO customer_name;
    END IF;
END $$;

-- Update line_items column to JSONB if not already
ALTER TABLE invoices ALTER COLUMN line_items TYPE JSONB USING line_items::jsonb;

-- Update attachments column to JSONB if not already
ALTER TABLE invoices ALTER COLUMN attachments TYPE JSONB USING attachments::jsonb;

-- Create invoice_counter table if not exists
CREATE TABLE IF NOT EXISTS invoice_counter (
    id SERIAL PRIMARY KEY,
    current_counter INTEGER NOT NULL DEFAULT 1,
    prefix VARCHAR(20) NOT NULL DEFAULT 'AR-26-',
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial counter value if table is empty
INSERT INTO invoice_counter (current_counter, prefix)
SELECT 1, 'AR-26-'
WHERE NOT EXISTS (SELECT 1 FROM invoice_counter);

-- Create function to generate invoice numbers if not exists
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_counter INTEGER;
    prefix_val VARCHAR(20);
    invoice_num TEXT;
BEGIN
    -- Lock the row for update
    SELECT current_counter, prefix INTO next_counter, prefix_val
    FROM invoice_counter
    WHERE id = 1
    FOR UPDATE;

    -- Generate invoice number with zero padding
    invoice_num := prefix_val || LPAD(next_counter::TEXT, 2, '0');

    -- Increment counter
    UPDATE invoice_counter
    SET current_counter = current_counter + 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE id = 1;

    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for new columns if not exist
CREATE INDEX IF NOT EXISTS idx_invoices_project_name ON invoices(project_name);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_phone ON invoices(customer_phone);
