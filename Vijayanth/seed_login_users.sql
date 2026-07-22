-- seed_login_users.sql
-- Import/run this SQL in the Vijayanth dashboard database to create/update default logins.
-- Password hashes below are PHP password_hash()/password_verify() compatible bcrypt hashes.
--
-- Default logins:
--   admin@vijayanth.com / admin@123
--   admin@scada.com     / admin@123
--   vijayanth@scada.com / vijayanth@123
--   krishna@scada.com   / krishna@123
--   bojaraj@scada.com   / bojaraj@123

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user',
    plant_id VARCHAR(64) DEFAULT NULL,
    auth_token VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin: admin@vijayanth.com / admin@123
UPDATE users
SET password = '$2y$12$SHCLxY6HkRcPpGSE8.tJUugb4eEfk68FtBFEO2KHztXbi0suznrBu',
    role = 'admin',
    plant_id = 'vijayanth',
    auth_token = NULL
WHERE LOWER(email) = 'admin@vijayanth.com';

INSERT INTO users (email, password, role, plant_id, auth_token)
SELECT 'admin@vijayanth.com', '$2y$12$SHCLxY6HkRcPpGSE8.tJUugb4eEfk68FtBFEO2KHztXbi0suznrBu', 'admin', 'vijayanth', NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'admin@vijayanth.com');

-- Admin alias: admin@scada.com / admin@123
UPDATE users
SET password = '$2y$12$SHCLxY6HkRcPpGSE8.tJUugb4eEfk68FtBFEO2KHztXbi0suznrBu',
    role = 'admin',
    plant_id = 'vijayanth',
    auth_token = NULL
WHERE LOWER(email) = 'admin@scada.com';

INSERT INTO users (email, password, role, plant_id, auth_token)
SELECT 'admin@scada.com', '$2y$12$SHCLxY6HkRcPpGSE8.tJUugb4eEfk68FtBFEO2KHztXbi0suznrBu', 'admin', 'vijayanth', NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'admin@scada.com');

-- Vijayanth Cosmic: vijayanth@scada.com / vijayanth@123
UPDATE users
SET password = '$2y$12$F7.9ezKh2mUQ1Qo3Fc7eael.YAO3j76KSQ1/cBGH6GF2wIR5AfXne',
    role = 'user',
    plant_id = 'vijayanth_cosmic',
    auth_token = NULL
WHERE LOWER(email) = 'vijayanth@scada.com';

INSERT INTO users (email, password, role, plant_id, auth_token)
SELECT 'vijayanth@scada.com', '$2y$12$F7.9ezKh2mUQ1Qo3Fc7eael.YAO3j76KSQ1/cBGH6GF2wIR5AfXne', 'user', 'vijayanth_cosmic', NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'vijayanth@scada.com');

-- Krishna: krishna@scada.com / krishna@123
UPDATE users
SET password = '$2y$12$W2XEvRVkCNbwQkIySEo3g.Qtl7xLxxdQqPEj3niOBw1M8ztqC0fym',
    role = 'user',
    plant_id = 'krishna',
    auth_token = NULL
WHERE LOWER(email) = 'krishna@scada.com';

INSERT INTO users (email, password, role, plant_id, auth_token)
SELECT 'krishna@scada.com', '$2y$12$W2XEvRVkCNbwQkIySEo3g.Qtl7xLxxdQqPEj3niOBw1M8ztqC0fym', 'user', 'krishna', NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'krishna@scada.com');

-- Bojaraj: bojaraj@scada.com / bojaraj@123
UPDATE users
SET password = '$2y$12$x6jYHVVgfUzhvBMvwQijVO2rIi5BHSVGnUmJO8bXoJ20ROySWW1nG',
    role = 'user',
    plant_id = 'vijayanth',
    auth_token = NULL
WHERE LOWER(email) = 'bojaraj@scada.com';

INSERT INTO users (email, password, role, plant_id, auth_token)
SELECT 'bojaraj@scada.com', '$2y$12$x6jYHVVgfUzhvBMvwQijVO2rIi5BHSVGnUmJO8bXoJ20ROySWW1nG', 'user', 'vijayanth', NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'bojaraj@scada.com');
