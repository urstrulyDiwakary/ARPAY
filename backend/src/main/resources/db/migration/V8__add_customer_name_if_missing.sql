-- Add customer_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='invoices' AND column_name='customer_name'
    ) THEN
        ALTER TABLE invoices ADD COLUMN customer_name VARCHAR(200) NOT NULL DEFAULT 'Unknown';
    END IF;
END $$;

-- Update any NULL customer_name values to 'Unknown'
UPDATE invoices SET customer_name = 'Unknown' WHERE customer_name IS NULL;
