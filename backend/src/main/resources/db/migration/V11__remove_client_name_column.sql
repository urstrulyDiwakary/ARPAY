-- Remove client_name column if it exists (it was replaced by customer_name)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='invoices' AND column_name='client_name'
    ) THEN
        -- First, copy any data from client_name to customer_name if customer_name is NULL
        UPDATE invoices
        SET customer_name = COALESCE(customer_name, client_name, 'Unknown')
        WHERE customer_name IS NULL OR customer_name = '';

        -- Now drop the client_name column
        ALTER TABLE invoices DROP COLUMN client_name;
    END IF;
END $$;
