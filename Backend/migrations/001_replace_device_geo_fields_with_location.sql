USE buggy_core;

ALTER TABLE devices
  ADD COLUMN location JSON NULL AFTER session_id,
  DROP COLUMN ip,
  DROP COLUMN country,
  DROP COLUMN city,
  DROP COLUMN region,
  DROP COLUMN latitude,
  DROP COLUMN longitude;
