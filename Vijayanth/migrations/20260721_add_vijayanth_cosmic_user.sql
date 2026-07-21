-- Create or update the user login for Vijayanth Cosmic Powers Pvt Ltd.
-- Password supplied by the plant administrator is stored only as a bcrypt hash.

INSERT INTO users (email, password, role, plant_id)
VALUES (
    'vijayanth@scada.com',
    '$2y$12$ZQp2HS0jK7EdTY0O/5c6yeAOLv63Jh.U9UhVe7BeqNjMa.LqMYtge',
    'user',
    'vijayanth_cosmic'
)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    role = VALUES(role),
    plant_id = VALUES(plant_id);
