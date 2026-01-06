-- ARPAY Database Initialization Script
-- PostgreSQL Database Setup and Sample Data

-- ============================================
-- 1. DATABASE CREATION
-- ============================================

-- Create database (run as postgres superuser)
CREATE DATABASE arpay_db
    WITH
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Connect to database
\c arpay_db;

-- ============================================
-- 2. SAMPLE USERS
-- ============================================
-- Note: Passwords are hashed with BCrypt
-- Plain text passwords: "password123" for all users

INSERT INTO users (id, name, email, phone, password, role, status, department, created_at, updated_at, last_active) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin User', 'admin@arpay.com', '+1234567890', '$2a$10$xN/cLqkGjGGJvGG8GQ7E7.WQj9qCZxQJ7kZq7vQj7kZq7vQj7kZq7v', 'ADMIN', 'ACTIVE', 'Management', NOW(), NOW(), NOW()),
('b1ffcd88-8b1a-5fg9-cc7e-7cc8ce491b22', 'John Manager', 'john@arpay.com', '+1234567891', '$2a$10$xN/cLqkGjGGJvGG8GQ7E7.WQj9qCZxQJ7kZq7vQj7kZq7vQj7kZq7v', 'MANAGER', 'ACTIVE', 'Finance', NOW(), NOW(), NOW()),
('c2ggde77-7c2b-6gh0-dd8f-8dd9df502c33', 'Jane Employee', 'jane@arpay.com', '+1234567892', '$2a$10$xN/cLqkGjGGJvGG8GQ7E7.WQj9qCZxQJ7kZq7vQj7kZq7vQj7kZq7v', 'EMPLOYEE', 'ACTIVE', 'Sales', NOW(), NOW(), NOW()),
('d3hhef66-6d3c-7hi1-ee9g-9ee0eg613d44', 'Bob Employee', 'bob@arpay.com', '+1234567893', '$2a$10$xN/cLqkGjGGJvGG8GQ7E7.WQj9qCZxQJ7kZq7vQj7kZq7vQj7kZq7v', 'EMPLOYEE', 'ACTIVE', 'IT', NOW(), NOW(), NOW()),
('e4iifg55-5e4d-8ij2-ff0h-0ff1fh724e55', 'Alice Manager', 'alice@arpay.com', '+1234567894', '$2a$10$xN/cLqkGjGGJvGG8GQ7E7.WQj9qCZxQJ7kZq7vQj7kZq7vQj7kZq7v', 'MANAGER', 'ACTIVE', 'Operations', NOW(), NOW(), NOW());

-- ============================================
-- 3. SAMPLE INVOICES
-- ============================================

INSERT INTO invoices (id, invoice_number, client_name, amount, tax, total_amount, status, invoice_type, invoice_date, due_date, notes, created_by, created_at, updated_at) VALUES
('f5jjgh44-4f5e-9jk3-gg1i-1gg2gi835f66', 'INV-2025-001', 'Acme Corporation', 50000.00, 9000.00, 59000.00, 'PAID', 'CUSTOMER', '2025-01-01', '2025-01-31', 'Q1 Consulting Services', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW(), NOW()),
('g6kkhi33-3g6f-0kl4-hh2j-2hh3hj946g77', 'INV-2025-002', 'Tech Solutions Ltd', 35000.00, 6300.00, 41300.00, 'PENDING', 'PROJECT', '2025-01-15', '2025-02-15', 'Website Development', 'b1ffcd88-8b1a-5fg9-cc7e-7cc8ce491b22', NOW(), NOW()),
('h7llij22-2h7g-1lm5-ii3k-3ii4ik057h88', 'INV-2025-003', 'Global Industries', 80000.00, 14400.00, 94400.00, 'OVERDUE', 'CUSTOMER', '2024-12-01', '2024-12-31', 'Annual Support Contract', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW(), NOW()),
('i8mmjk11-1i8h-2mn6-jj4l-4jj5jl168i99', 'INV-2025-004', 'StartUp Inc', 22000.00, 3960.00, 25960.00, 'PENDING', 'EXPENSE', '2025-01-20', '2025-02-20', 'Cloud Infrastructure Setup', 'b1ffcd88-8b1a-5fg9-cc7e-7cc8ce491b22', NOW(), NOW());

-- ============================================
-- 4. SAMPLE PAYMENTS
-- ============================================

INSERT INTO payments (id, invoice_id, amount, payment_mode, payment_date, reference_number, status, notes, processed_by, created_at, updated_at) VALUES
('j9nnkl00-0j9i-3no7-kk5m-5kk6km279j00', 'f5jjgh44-4f5e-9jk3-gg1i-1gg2gi835f66', 59000.00, 'BANK_TRANSFER', '2025-01-25', 'PAY-2025-001', 'COMPLETED', 'Full payment received', 'b1ffcd88-8b1a-5fg9-cc7e-7cc8ce491b22', NOW(), NOW()),
('k0oolm99-9k0j-4op8-ll6n-6ll7ln380k11', 'g6kkhi33-3g6f-0kl4-hh2j-2hh3hj946g77', 20000.00, 'CREDIT_CARD', '2025-01-22', 'PAY-2025-002', 'COMPLETED', 'Partial payment - Milestone 1', 'b1ffcd88-8b1a-5fg9-cc7e-7cc8ce491b22', NOW(), NOW());

-- ============================================
-- 5. SAMPLE EXPENSES
-- ============================================

INSERT INTO expenses (id, title, category, amount, expense_date, paid_by, payment_mode, notes, status, property, created_at, updated_at) VALUES
('l1ppmn88-8l1k-5pq9-mm7o-7mm8mo491l22', 'Client Meeting Travel', 'TRAVEL', 4500.00, '2025-01-10', 'c2ggde77-7c2b-6gh0-dd8f-8dd9df502c33', 'CARD', 'Flight and hotel for NYC meeting', 'APPROVED', NULL, NOW(), NOW()),
('m2qqno77-7m2l-6qr0-nn8p-8nn9np502m33', 'Office Supplies', 'OFFICE', 1200.00, '2025-01-12', 'd3hhef66-6d3c-7hi1-ee9g-9ee0eg613d44', 'CASH', 'Stationery and equipment', 'APPROVED', NULL, NOW(), NOW()),
('n3rrop66-6n3m-7rs1-oo9q-9oo0oq613n44', 'Marketing Campaign', 'MARKETING', 25000.00, '2025-01-15', 'e4iifg55-5e4d-8ij2-ff0h-0ff1fh724e55', 'BANK_TRANSFER', 'Q1 Digital Ads Campaign', 'PENDING', NULL, NOW(), NOW()),
('o4ssqp55-5o4n-8st2-pp0r-0pp1pr724o55', 'New Laptops', 'EQUIPMENT', 180000.00, '2025-01-18', 'd3hhef66-6d3c-7hi1-ee9g-9ee0eg613d44', 'BANK_TRANSFER', '10 new development laptops', 'PENDING', NULL, NOW(), NOW());

-- ============================================
-- 6. SAMPLE APPROVALS
-- ============================================

INSERT INTO approvals (id, module_type, reference_id, requested_by, approved_by, status, priority, description, remarks, amount, department, approved_at, created_at, updated_at) VALUES
('p5ttrq44-4p5o-9tu3-qq1s-1qq2qs835p66', 'EXPENSE', 'n3rrop66-6n3m-7rs1-oo9q-9oo0oq613n44', 'e4iifg55-5e4d-8ij2-ff0h-0ff1fh724e55', NULL, 'PENDING', 'URGENT', 'Approval for Q1 Marketing Campaign', NULL, 25000.00, 'Operations', NULL, NOW(), NOW()),
('q6uusq33-3q6p-0uv4-rr2t-2rr3rt946q77', 'EXPENSE', 'o4ssqp55-5o4n-8st2-pp0r-0pp1pr724o55', 'd3hhef66-6d3c-7hi1-ee9g-9ee0eg613d44', NULL, 'PENDING', 'URGENT', 'New laptops for development team', NULL, 180000.00, 'IT', NULL, NOW(), NOW()),
('r7vvtr22-2r7q-1vw5-ss3u-3ss4su057r88', 'INVOICE', 'g6kkhi33-3g6f-0kl4-hh2j-2hh3hj946g77', 'b1ffcd88-8b1a-5fg9-cc7e-7cc8ce491b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'APPROVED', 'NORMAL', 'Tech Solutions project invoice approval', 'Approved for payment', 41300.00, 'Finance', NOW(), NOW(), NOW());

-- ============================================
-- 7. SAMPLE TIME TRACKING
-- ============================================

INSERT INTO time_tracking (id, user_id, project_name, start_time, end_time, total_hours, work_description, status, created_at, updated_at) VALUES
('s8wwus11-1s8r-2wx6-tt4v-4tt5tv168s99', 'c2ggde77-7c2b-6gh0-dd8f-8dd9df502c33', 'Website Redesign', '2025-01-25 09:00:00', '2025-01-25 12:30:00', 3.5, 'Homepage mockups and design review', 'COMPLETED', NOW(), NOW()),
('t9xxvt00-0t9s-3xy7-uu5w-5uu6uw279t00', 'd3hhef66-6d3c-7hi1-ee9g-9ee0eg613d44', 'Mobile App Development', '2025-01-25 10:00:00', '2025-01-25 17:00:00', 7.0, 'API integration and backend setup', 'COMPLETED', NOW(), NOW()),
('u0yywu99-9u0t-4yz8-vv6x-6vv7vx380u11', 'c2ggde77-7c2b-6gh0-dd8f-8dd9df502c33', 'Website Redesign', '2025-01-25 13:30:00', '2025-01-25 17:00:00', 3.5, 'Responsive design implementation', 'COMPLETED', NOW(), NOW()),
('v1zzxv88-8v1u-5za9-ww7y-7ww8wy491v22', 'd3hhef66-6d3c-7hi1-ee9g-9ee0eg613d44', 'Client Portal', '2025-01-24 08:00:00', '2025-01-24 15:00:00', 7.0, 'Dashboard component development', 'COMPLETED', NOW(), NOW());

-- ============================================
-- 8. SAMPLE NOTIFICATIONS
-- ============================================

INSERT INTO notifications (id, user_id, title, message, severity, type, is_read, read_at, created_at) VALUES
('w2aayy77-7w2v-6ab0-xx8z-8xx9xz502w33', 'b1ffcd88-8b1a-5fg9-cc7e-7cc8ce491b22', 'Invoice Overdue', 'Invoice INV-2025-003 is overdue. Please follow up with client.', 'HIGH', 'WARNING', false, NULL, NOW()),
('x3bbzz66-6x3w-7bc1-yy9a-9yy0ya613x44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'New Approval Request', 'New approval request from Alice Manager for Marketing Campaign', 'MEDIUM', 'INFO', false, NULL, NOW()),
('y4ccaa55-5y4x-8cd2-zz0b-0zz1zb724y55', 'b1ffcd88-8b1a-5fg9-cc7e-7cc8ce491b22', 'Payment Received', 'Payment of ₹59,000 received for INV-2025-001', 'LOW', 'SUCCESS', true, NOW(), NOW() - INTERVAL '1 day'),
('z5ddbb44-4z5y-9de3-aa1c-1aa2ac835z66', 'd3hhef66-6d3c-7hi1-ee9g-9ee0eg613d44', 'Time Entry Reminder', 'Please log your hours for today', 'MEDIUM', 'INFO', false, NULL, NOW());

-- ============================================
-- 9. VERIFY DATA
-- ============================================

-- Count records
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'Approvals', COUNT(*) FROM approvals
UNION ALL
SELECT 'Time Tracking', COUNT(*) FROM time_tracking
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;

-- ============================================
-- 10. USEFUL QUERIES
-- ============================================

-- Get dashboard statistics
SELECT
    (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status IN ('PAID', 'PENDING')) as total_invoices,
    (SELECT COUNT(*) FROM invoices) as invoice_count,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'APPROVED') as total_expenses,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'COMPLETED') as total_payments,
    (SELECT COUNT(*) FROM approvals WHERE status = 'PENDING') as pending_approvals,
    (SELECT COUNT(*) FROM invoices WHERE due_date < CURRENT_DATE AND status != 'PAID') as overdue_invoices,
    (SELECT COUNT(*) FROM users WHERE status = 'ACTIVE') as active_users;

-- Get overdue invoices
SELECT invoice_number, client_name, total_amount, due_date, status
FROM invoices
WHERE due_date < CURRENT_DATE AND status != 'PAID'
ORDER BY due_date;

-- Get pending approvals
SELECT a.description, a.amount, a.priority, u.name as requested_by, a.created_at
FROM approvals a
JOIN users u ON a.requested_by = u.id
WHERE a.status = 'PENDING'
ORDER BY a.priority DESC, a.created_at;

-- Get expense summary by category
SELECT category, COUNT(*) as count, SUM(amount) as total
FROM expenses
GROUP BY category
ORDER BY total DESC;

-- Get user time tracking summary
SELECT u.name, SUM(tt.total_hours) as total_hours, COUNT(*) as entries
FROM time_tracking tt
JOIN users u ON tt.user_id = u.id
GROUP BY u.name
ORDER BY total_hours DESC;

-- ============================================
-- NOTES
-- ============================================
-- 1. All UUIDs are sample values - Hibernate will generate new ones
-- 2. Password hash is for "password123" - update in production
-- 3. Run this script after application creates tables
-- 4. Adjust dates to current date range for testing
-- ============================================

