-- Run once in phpMyAdmin against the existing studenthub database.
USE studenthub;
ALTER TABLE events ADD COLUMN poster_path VARCHAR(255) NULL AFTER capacity;
