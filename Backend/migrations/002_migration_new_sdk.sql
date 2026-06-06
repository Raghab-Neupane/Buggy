USE buggy_core;

ALTER TABLE devices
  ADD COLUMN session_started_at DATETIME NULL AFTER session_id,
  ADD COLUMN browser_version VARCHAR(100) NULL AFTER browser,
  MODIFY COLUMN sdk_version VARCHAR(50) NULL,
  MODIFY COLUMN app_version VARCHAR(50) NULL,
  MODIFY COLUMN user_agent TEXT NULL,
  MODIFY COLUMN location JSON NULL;
