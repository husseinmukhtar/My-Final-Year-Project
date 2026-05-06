-- Safe patch for live databases that predate adoption scheduling fields.
-- Run against the same database used by the Node backend.

SET @db_name = DATABASE();

SET @sql = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db_name
              AND TABLE_NAME = 'adoptions'
              AND COLUMN_NAME = 'approval_date'
        ),
        'SELECT ''approval_date already exists''',
        'ALTER TABLE adoptions ADD COLUMN approval_date DATE NULL AFTER application_date'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db_name
              AND TABLE_NAME = 'adoptions'
              AND COLUMN_NAME = 'visit_scheduled_at'
        ),
        'SELECT ''visit_scheduled_at already exists''',
        'ALTER TABLE adoptions ADD COLUMN visit_scheduled_at DATETIME NULL AFTER approval_date'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db_name
              AND TABLE_NAME = 'adoptions'
              AND COLUMN_NAME = 'assigned_staff'
        ),
        'SELECT ''assigned_staff already exists''',
        'ALTER TABLE adoptions ADD COLUMN assigned_staff VARCHAR(200) NULL AFTER visit_scheduled_at'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db_name
              AND TABLE_NAME = 'adoptions'
              AND COLUMN_NAME = 'notes'
        ),
        'SELECT ''notes already exists''',
        'ALTER TABLE adoptions ADD COLUMN notes TEXT NULL AFTER assigned_staff'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db_name
              AND TABLE_NAME = 'adoptions'
              AND COLUMN_NAME = 'adopter_nationality'
        ),
        'SELECT ''adopter_nationality already exists''',
        'ALTER TABLE adoptions ADD COLUMN adopter_nationality VARCHAR(80) NULL AFTER adopter_phone'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db_name
              AND TABLE_NAME = 'adoptions'
              AND COLUMN_NAME = 'adopter_phone_country_iso'
        ),
        'SELECT ''adopter_phone_country_iso already exists''',
        'ALTER TABLE adoptions ADD COLUMN adopter_phone_country_iso VARCHAR(8) NULL AFTER adopter_nationality'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db_name
              AND TABLE_NAME = 'adoptions'
              AND COLUMN_NAME = 'adopter_phone_country_code'
        ),
        'SELECT ''adopter_phone_country_code already exists''',
        'ALTER TABLE adoptions ADD COLUMN adopter_phone_country_code VARCHAR(8) NULL AFTER adopter_phone_country_iso'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE adoptions
SET adoption_status = 'Accepted'
WHERE adoption_status = 'Approved';
