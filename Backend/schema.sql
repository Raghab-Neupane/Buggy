-- MySQL Schema for Buggy Platform

-- Database 1: Core System Metadata
CREATE DATABASE IF NOT EXISTS buggy_core CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE buggy_core;

CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    device_name VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    session_started_at DATETIME NULL,
    location JSON NULL,
    sdk_version VARCHAR(50) NULL,
    app_version VARCHAR(50) NULL,
    browser VARCHAR(100) NULL,
    browser_version VARCHAR(100) NULL,
    os VARCHAR(100) NULL,
    latitude DOUBLE NULL,
    longitude DOUBLE NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_devices_session_id (session_id),
    INDEX idx_devices_session_id (session_id),
    INDEX idx_devices_last_seen (last_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Database 2: Logs Storage
CREATE DATABASE IF NOT EXISTS buggy_logs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE buggy_logs;

CREATE TABLE IF NOT EXISTS logs (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NULL,
    url TEXT NULL,
    stack_trace TEXT NULL,
    session_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_logs_device_id (device_id),
    INDEX idx_logs_timestamp (timestamp),
    INDEX idx_logs_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
