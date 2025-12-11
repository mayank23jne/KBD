ALTER TABLE users
ADD COLUMN fullname VARCHAR(255) NULL AFTER username;
UPDATE users
SET fullname = username
WHERE fullname IS NULL OR fullname = '';