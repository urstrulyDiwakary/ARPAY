-- Initial schema for users table matching User.java entity
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    department VARCHAR(100),
    avatar TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_active TIMESTAMP,
    date_of_joining DATE
);

