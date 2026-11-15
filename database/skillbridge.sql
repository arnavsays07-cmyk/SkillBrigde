-- =====================================================================
-- SkillBridge Database Schema & Seed Data (MySQL 8.0+ / MariaDB 10.5+)
-- Path: database/skillbridge.sql
-- Features: InnoDB ACID transactions, CHECK constraints, Foreign Keys
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `skillbridge_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `skillbridge_db`;

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `enrollment_no` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `semester` TINYINT NOT NULL,
  `role` ENUM('student', 'admin') DEFAULT 'student',
  `credit_balance` INT NOT NULL DEFAULT 20,
  `average_rating` DECIMAL(3,2) DEFAULT 5.00,
  `total_reviews` INT DEFAULT 0,
  `bio` TEXT NULL,
  `availability` VARCHAR(255) DEFAULT 'Weekday Evenings & Weekends',
  `status` ENUM('active', 'suspended') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `chk_credit_positive` CHECK (`credit_balance` >= 0),
  CONSTRAINT `chk_semester_valid` CHECK (`semester` BETWEEN 1 AND 12)
) ENGINE=InnoDB;

-- 2. MASTER SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS `skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_name` VARCHAR(150) NOT NULL UNIQUE,
  `department` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  INDEX `idx_dept` (`department`)
) ENGINE=InnoDB;

-- 3. USER SKILLS JUNCTION
CREATE TABLE IF NOT EXISTS `user_skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `skill_id` INT NOT NULL,
  `skill_type` ENUM('teach', 'learn') NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_skill_type` (`user_id`, `skill_id`, `skill_type`)
) ENGINE=InnoDB;

-- 4. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `learner_id` INT NOT NULL,
  `tutor_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `topic` VARCHAR(255) NOT NULL,
  `session_date` DATETIME NOT NULL,
  `duration_minutes` INT DEFAULT 60,
  `mode` ENUM('Online (Meet)', 'Campus Library', 'Lab Room', 'Study Commons') DEFAULT 'Online (Meet)',
  `meeting_details` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled') DEFAULT 'pending',
  `credit_cost` INT NOT NULL DEFAULT 10,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`subject_id`) REFERENCES `skills`(`id`),
  INDEX `idx_learner_status` (`learner_id`, `status`),
  INDEX `idx_tutor_status` (`tutor_id`, `status`),
  CONSTRAINT `chk_different_peers` CHECK (`learner_id` <> `tutor_id`)
) ENGINE=InnoDB;

-- 5. DOUBLE-ENTRY AUDIT LEDGER
CREATE TABLE IF NOT EXISTS `credit_ledger` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `session_id` INT NULL,
  `transaction_type` ENUM('earned', 'spent', 'bonus', 'refund') NOT NULL,
  `amount` INT NOT NULL,
  `balance_after` INT NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE SET NULL,
  INDEX `idx_ledger_user` (`user_id`, `created_at`)
) ENGINE=InnoDB;

-- =====================================================================
-- SEED DATA: MASTER SKILLS
-- =====================================================================
INSERT INTO `skills` (`id`, `subject_name`, `department`, `code`) VALUES
(1, 'Data Structures & Algorithms', 'Computer Science', 'CS-201'),
(2, 'Database Management Systems (SQL)', 'Computer Science', 'CS-302'),
(3, 'Web Technologies (PHP & Full Stack)', 'Computer Science', 'CS-405'),
(4, 'Operating Systems & Linux Kernel', 'Computer Science', 'CS-304'),
(5, 'Machine Learning & Python', 'Data Science', 'DS-301'),
(6, 'Probability & Applied Statistics', 'Data Science', 'DS-202'),
(7, 'Digital Signal Processing', 'Electrical Engineering', 'EE-310'),
(8, 'Microprocessors & Microcontrollers', 'Electrical Engineering', 'EE-205'),
(9, 'Thermodynamics & Heat Transfer', 'Mechanical Engineering', 'ME-201'),
(10, 'Fluid Mechanics & CAD Modeling', 'Mechanical Engineering', 'ME-303'),
(11, 'Linear Algebra & Discrete Math', 'Mathematics', 'MA-101'),
(12, 'Financial Accounting & Economics', 'Business & Management', 'BM-204')
ON DUPLICATE KEY UPDATE `subject_name` = VALUES(`subject_name`);

-- =====================================================================
-- SEED DATA: DEMO STUDENT ACCOUNTS (Password for all: password123)
-- =====================================================================
INSERT INTO `users` (`id`, `name`, `email`, `enrollment_no`, `password_hash`, `department`, `semester`, `role`, `credit_balance`, `average_rating`, `total_reviews`, `bio`, `availability`, `status`) VALUES
(1, 'Alex Chen', 'alex.chen@campus.edu', 'CS2023-0182', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Computer Science', 5, 'student', 30, 4.95, 14, 'Junior CS student passionate about backend systems, distributed databases, and competitive programming. TA for CS-201.', 'Weekday Evenings (6 PM - 9 PM) & Saturdays', 'active'),
(2, 'Priya Sharma', 'priya.sharma@campus.edu', 'DS2023-0491', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Data Science', 4, 'student', 40, 4.88, 19, 'Data Science major researching computer vision. Skilled in pandas, scikit-learn, and statistical inference.', 'Monday, Wednesday, Friday afternoons & Sunday mornings', 'active'),
(3, 'Marcus Vance', 'marcus.v@campus.edu', 'ME2022-0099', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mechanical Engineering', 6, 'student', 15, 4.75, 8, 'Formula Student powertrain lead. Happy to help with fluid mechanics, SolidWorks 3D, and thermodynamic cycles.', 'Tuesdays & Thursdays (4 PM - 8 PM)', 'active'),
(4, 'Elena Rostova', 'elena.rostova@campus.edu', 'EE2021-0312', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Electrical Engineering', 7, 'student', 55, 4.98, 26, 'Senior EE specializing in embedded hardware, FPGA programming, and analog circuitry. High distinction.', 'Flexible on Weekends & Monday evenings', 'active'),
(5, 'Devin Kowalski', 'devin.k@campus.edu', 'CS2024-0814', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Computer Science', 3, 'student', 20, 4.60, 5, 'Sophomore learning web engineering and Linux server administration. Great at breaking down complex topics.', 'Weekdays after 5 PM', 'active'),
(6, 'Sophia Martinez', 'sophia.m@campus.edu', 'MA2023-0105', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mathematics', 5, 'student', 35, 4.90, 12, 'Applied math enthusiast. Love mentoring students in linear algebra, matrix decomposition, and proofs.', 'Wednesday & Saturday mornings', 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `user_skills` (`user_id`, `skill_id`, `skill_type`) VALUES
(1, 1, 'teach'), (1, 2, 'teach'), (1, 3, 'teach'), (1, 5, 'learn'),
(2, 5, 'teach'), (2, 6, 'teach'), (2, 11, 'teach'), (2, 4, 'learn'),
(3, 9, 'teach'), (3, 10, 'teach'), (3, 2, 'learn'),
(4, 7, 'teach'), (4, 8, 'teach'), (4, 1, 'learn'),
(5, 3, 'teach'), (5, 4, 'teach'), (5, 5, 'learn'),
(6, 11, 'teach'), (6, 6, 'teach'), (6, 1, 'learn')
ON DUPLICATE KEY UPDATE `skill_type` = VALUES(`skill_type`);

INSERT INTO `sessions` (`id`, `learner_id`, `tutor_id`, `subject_id`, `topic`, `session_date`, `duration_minutes`, `mode`, `meeting_details`, `status`, `credit_cost`) VALUES
(101, 1, 2, 5, 'Gradient Descent Optimization & Cross-Entropy Loss derivation', '2026-11-18 17:00:00', 60, 'Campus Library', '2nd Floor Study Room B4 (Quiet Zone)', 'accepted', 10),
(102, 3, 1, 2, 'Relational Normalization (3NF & BCNF) and indexing strategies', '2026-11-19 18:30:00', 60, 'Online (Meet)', 'https://meet.google.com/sb-alex-marcus', 'accepted', 10),
(103, 4, 1, 1, 'Dynamic Programming on Trees & Bitmask DP', '2026-11-08 19:00:00', 60, 'Lab Room', 'Turing Computer Lab 304', 'completed', 10),
(104, 2, 4, 8, 'ARM Assembly & Interrupt Vector Table setup', '2026-11-20 15:00:00', 60, 'Study Commons', 'Engineering Commons Whiteboard Pod #3', 'pending', 10)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

INSERT INTO `credit_ledger` (`id`, `user_id`, `session_id`, `transaction_type`, `amount`, `balance_after`, `description`) VALUES
(1, 1, NULL, 'bonus', 20, 20, 'Welcome onboarding bonus credits upon enrollment verification'),
(2, 2, NULL, 'bonus', 20, 20, 'Welcome onboarding bonus credits upon enrollment verification'),
(3, 4, NULL, 'bonus', 20, 20, 'Welcome onboarding bonus credits upon enrollment verification'),
(4, 4, 103, 'spent', 10, 55, 'Attended peer study session #103 (Data Structures & Algorithms)'),
(5, 1, 103, 'earned', 10, 30, 'Conducted peer study session #103 (Data Structures & Algorithms)')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);
