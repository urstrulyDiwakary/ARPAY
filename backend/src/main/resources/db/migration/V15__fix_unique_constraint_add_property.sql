-- Fix unique constraint to include property_name
-- Flyway Migration Version 15

-- Drop the old unique constraint
ALTER TABLE project_masters DROP CONSTRAINT IF EXISTS project_masters_project_name_plot_number_key;

-- Add new unique constraint with all three fields
ALTER TABLE project_masters ADD CONSTRAINT project_masters_unique_plot
    UNIQUE(project_name, property_name, plot_number);

