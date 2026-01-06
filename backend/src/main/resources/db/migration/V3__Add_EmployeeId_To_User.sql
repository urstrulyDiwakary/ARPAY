-- Add employee_id to users table for human-friendly employee number
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE;

-- Backfill existing rows with generated IDs if empty using CTE
WITH numbered_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM users
  WHERE employee_id IS NULL OR employee_id = ''
)
UPDATE users
SET employee_id = 'EMP' || LPAD(CAST(numbered_users.row_num AS VARCHAR), 4, '0')
FROM numbered_users
WHERE users.id = numbered_users.id;

