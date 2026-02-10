-- Create invoice_counter table to manage auto-incrementing invoice numbers
CREATE TABLE IF NOT EXISTS invoice_counter (
    id SERIAL PRIMARY KEY,
    current_counter INTEGER NOT NULL DEFAULT 1,
    prefix VARCHAR(20) NOT NULL DEFAULT 'AR-26-',
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial counter value
INSERT INTO invoice_counter (current_counter, prefix) VALUES (1, 'AR-26-');

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,

    -- Customer Information
    project_name VARCHAR(200),
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20),

    -- Financial Details
    amount DECIMAL(15, 2) NOT NULL,
    tax DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,

    -- Payment Breakdown (for real estate)
    token_amount DECIMAL(15, 2) DEFAULT 0,
    agreement_amount DECIMAL(15, 2) DEFAULT 0,
    registration_amount DECIMAL(15, 2) DEFAULT 0,
    agreement_due_date DATE,
    agreement_due_amount DECIMAL(15, 2) DEFAULT 0,
    registration_due_date DATE,
    registration_due_amount DECIMAL(15, 2) DEFAULT 0,

    -- Status and Type
    status VARCHAR(20) NOT NULL CHECK (status IN ('PAID', 'PENDING', 'OVERDUE', 'PARTIAL')),
    invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('PROJECT', 'CUSTOMER', 'EXPENSE')),

    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Additional Information
    notes TEXT,
    line_items JSONB,
    attachments JSONB,

    -- Audit Fields
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key
    CONSTRAINT fk_invoice_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Create a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for invoices table
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate next invoice number
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
