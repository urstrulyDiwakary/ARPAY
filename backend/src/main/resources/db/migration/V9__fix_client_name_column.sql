-- Rename client_name to customer_name if it exists and customer_name doesn't
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='invoices' AND column_name='client_name')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name='invoices' AND column_name='customer_name') THEN
        ALTER TABLE invoices RENAME COLUMN client_name TO customer_name;
    END IF;
END $$;

-- Ensure customer_name is not null
ALTER TABLE invoices ALTER COLUMN customer_name SET NOT NULL;
