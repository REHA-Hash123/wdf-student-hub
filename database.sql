-- StudentHub database schema (MySQL 8+ / XAMPP MariaDB compatible)
CREATE DATABASE IF NOT EXISTS studenthub
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studenthub;

CREATE TABLE IF NOT EXISTS students (
  student_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(254) NOT NULL UNIQUE,
  mobile_number VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  course VARCHAR(10) NOT NULL,
  academic_year ENUM('1st Year','2nd Year','3rd Year','4th Year') NOT NULL,
  gender ENUM('Male','Female','Other') NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_tokens (
  token_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  selector CHAR(32) NOT NULL UNIQUE,
  hashed_validator CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_token_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  INDEX idx_auth_token_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  event_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(60) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NULL,
  location VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  capacity INT UNSIGNED NOT NULL DEFAULT 0,
  poster_path VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_events_date (event_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS registrations (
  registration_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  event_id INT UNSIGNED NOT NULL,
  status ENUM('registered','cancelled','attended') NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reg_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  CONSTRAINT uq_student_event UNIQUE (student_id, event_id),
  INDEX idx_registration_event (event_id)
) ENGINE=InnoDB;

-- Optional sample events; INSERT IGNORE avoids duplicates when rerun.
INSERT IGNORE INTO events (event_id,title,category,event_date,event_time,location,description,capacity) VALUES
(1,'AI & Machine Learning Workshop','Workshop','2026-11-15','10:00:00','Engineering Hall, Room 204','Hands-on introduction to neural networks and image classification.',40),
(2,'Careers in Data Science','Career','2026-11-18','13:00:00','Career Center, Main Hall','Alumni panel, resume reviews, and interview practice.',60),
(3,'Web Development Bootcamp','Workshop','2026-11-27','09:00:00','Computer Lab B','Introduction to HTML, CSS, and JavaScript.',35);

-- IMPORTANT: If you imported an older StudentHub schema before username was added,
-- run this once (skip it on a fresh database):
-- ALTER TABLE students ADD COLUMN username VARCHAR(30) NOT NULL UNIQUE AFTER full_name;


-- EXISTING DATABASE MIGRATION (run once if StudentHub was already installed):
-- ALTER TABLE students ADD COLUMN role ENUM('student','admin') NOT NULL DEFAULT 'student';
-- CREATE TABLE auth_tokens (
--   token_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--   student_id INT UNSIGNED NOT NULL,
--   selector CHAR(32) NOT NULL UNIQUE,
--   hashed_validator CHAR(64) NOT NULL,
--   expires_at DATETIME NOT NULL,
--   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT fk_auth_token_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
--   INDEX idx_auth_token_expiry (expires_at)
-- ) ENGINE=InnoDB;
-- Promote an existing account to admin only after verifying its identity:
-- UPDATE students SET role = 'admin' WHERE email = 'your-admin-email@example.com';
