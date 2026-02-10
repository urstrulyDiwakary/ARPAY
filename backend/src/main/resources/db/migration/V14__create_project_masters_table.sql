-- SQL Migration Script for Project Master Table
-- Flyway Migration Version 14

CREATE TABLE IF NOT EXISTS project_masters (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    property_name VARCHAR(255) NOT NULL,
    plot_number VARCHAR(100) NOT NULL,
    plot_area DOUBLE PRECISION NOT NULL,
    plot_price DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_name, plot_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_masters_project_name ON project_masters(project_name);
CREATE INDEX IF NOT EXISTS idx_project_masters_property_name ON project_masters(property_name);
CREATE INDEX IF NOT EXISTS idx_project_masters_plot_number ON project_masters(plot_number);
CREATE INDEX IF NOT EXISTS idx_project_masters_is_active ON project_masters(is_active);

-- Insert sample data
INSERT INTO project_masters (project_name, property_name, plot_number, plot_area, plot_price, is_active) VALUES
-- Ananta Giri (10 plots)
('Ananta Giri', 'Ananta Giri Farm Lands', '1', 11.17, 200000, TRUE),
('Ananta Giri', 'Ananta Giri Farm Lands', '2', 11.13, 200000, TRUE),
('Ananta Giri', 'Ananta Giri Farm Lands', '3', 13.94, 200000, TRUE),
('Ananta Giri', 'Ananta Giri Farm Lands', '4', 14.34, 200000, TRUE),
('Ananta Giri', 'Ananta Giri Farm Lands', '5', 14.73, 200000, TRUE),
('Ananta Giri', 'Ananta Giri Farm Lands', '6', 23.64, 200000, TRUE),
('Ananta Giri', 'Ananta Giri Farm Lands', '7', 11.03, 200000, TRUE),
('Ananta Giri', 'Ananta Giri Farm Lands', '8', 17.21, 200000, TRUE),
('Ananta Giri', 'Ananta Giri Farm Lands', '9', 8.61, 200000, TRUE),
('Ananta Giri', 'Ananta Giri Farm Lands', '10to12', 11.47, 200000, TRUE),

-- Ananta Nidhi (5 plots)
('Ananta Nidhi', 'Ananta Nidhi Open Plots', '1', 3.9, 330000, TRUE),
('Ananta Nidhi', 'Ananta Nidhi Open Plots', '2', 3.88, 330000, TRUE),
('Ananta Nidhi', 'Ananta Nidhi Open Plots', '3', 3.87, 330000, TRUE),
('Ananta Nidhi', 'Ananta Nidhi Open Plots', '4to5', 3.85, 330000, TRUE),
('Ananta Nidhi', 'Ananta Nidhi Open Plots', '6', 3.81, 330000, TRUE),

-- Ananta Towers (3 apartments)
('Ananta Towers', 'Ananta Towers - Apartments', 'A101', 1250, 500000, TRUE),
('Ananta Towers', 'Ananta Towers - Apartments', 'A102', 1250, 500000, TRUE),
('Ananta Towers', 'Ananta Towers - Apartments', 'B101', 1500, 500000, TRUE),

-- Ananta Heights (3 flats)
('Ananta Heights', 'Ananta Heights - Flats', '101', 1100, 450000, TRUE),
('Ananta Heights', 'Ananta Heights - Flats', '102', 1100, 450000, TRUE),
('Ananta Heights', 'Ananta Heights - Flats', '201', 1200, 450000, TRUE);

