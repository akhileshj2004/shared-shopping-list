-- Create the database if it doesn't exist (handled by MYSQL_DATABASE env var, but good for clarity)
-- CREATE DATABASE IF NOT EXISTS shopping_list_db;
-- USE shopping_list_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Lists Table (Modified to include owner_id)
CREATE TABLE IF NOT EXISTS lists (
    id VARCHAR(255) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) DEFAULT 'My Shopping List', -- Added a name for lists
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Items Table (No major changes, still links to lists)
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(255) PRIMARY KEY,
    list_id VARCHAR(255) NOT NULL,
    text VARCHAR(255) NOT NULL,
    checked BOOLEAN DEFAULT FALSE,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- Shared Lists Table
-- This table tracks which lists are shared with which users.
CREATE TABLE IF NOT EXISTS shared_lists (
    list_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL, -- The user who the list is shared WITH
    shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (list_id, user_id), -- Composite primary key to ensure unique sharing
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
