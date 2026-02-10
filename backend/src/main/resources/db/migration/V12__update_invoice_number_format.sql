-- Update invoice counter to use AR-26- prefix with sequential numbering
-- Format: AR-26-001, AR-26-002, ... to infinity

-- Update the prefix in the invoice_counter table to AR-26-
UPDATE invoice_counter
SET prefix = 'AR-26-'
WHERE id = 1;

-- Update the function to generate invoice numbers with proper padding for larger numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_counter INTEGER;
    prefix_val VARCHAR(20);
    invoice_num TEXT;
    padding_length INTEGER;
BEGIN
    -- Lock the row for update
    SELECT current_counter, prefix INTO next_counter, prefix_val
    FROM invoice_counter
    WHERE id = 1
    FOR UPDATE;

    -- Determine padding length based on counter value
    -- Use at least 3 digits (001, 002, ..., 999)
    -- Automatically expands to 4 digits at 1000, 5 digits at 10000, etc.
    IF next_counter < 1000 THEN
        padding_length := 3;
    ELSIF next_counter < 10000 THEN
        padding_length := 4;
    ELSIF next_counter < 100000 THEN
        padding_length := 5;
    ELSE
        padding_length := 6;
    END IF;

    -- Generate invoice number with dynamic zero padding
    invoice_num := prefix_val || LPAD(next_counter::TEXT, padding_length, '0');

    -- Increment counter
    UPDATE invoice_counter
    SET current_counter = current_counter + 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE id = 1;

    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Optional: Reset counter to 1 if you want to start fresh
-- Uncomment the line below if you want to reset the counter
-- UPDATE invoice_counter SET current_counter = 1 WHERE id = 1;

-- Comment: The invoice numbering will now follow this pattern:
-- AR-26-001, AR-26-002, ..., AR-26-999 (3 digits)
-- AR-26-1000, AR-26-1001, ..., AR-26-9999 (4 digits)
-- AR-26-10000, AR-26-10001, ... (5 digits)
-- And so on, infinitely
