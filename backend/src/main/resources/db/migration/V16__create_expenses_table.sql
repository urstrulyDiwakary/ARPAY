-- Create Expenses Table
-- Flyway Migration Version 16

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    expense_date DATE NOT NULL,
    paid_by UUID NOT NULL,
    payment_mode VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) NOT NULL,
    property VARCHAR(100),
    project_name VARCHAR(255),
    attachments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by) REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_expenses_invoice_number ON expenses(invoice_number);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_project_name ON expenses(project_name);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);


