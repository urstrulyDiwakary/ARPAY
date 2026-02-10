-- Add reference and lead_source columns to invoices table
-- These fields are used to track the user who referred the customer
-- and the source from which the lead was obtained

-- Add reference column (stores user ID as string reference)
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

-- Add lead_source column (stores enum values)
-- Valid values: Marketing Data, Old Data, Direct Lead, Referral, Social Media, Others
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50);

-- Create index on lead_source for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_lead_source
ON invoices(lead_source);

-- Create index on reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_reference
ON invoices(reference);

-- Add comment to the columns for documentation
COMMENT ON COLUMN invoices.reference IS 'Reference user ID who referred this customer';
COMMENT ON COLUMN invoices.lead_source IS 'Source of the lead: Marketing Data, Old Data, Direct Lead, Referral, Social Media, Others';

