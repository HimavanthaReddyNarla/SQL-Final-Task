USE job_portal;

-- COMMIT keeps both the application and its interview.
START TRANSACTION;
INSERT INTO Applications (candidate_id, job_id, cover_letter)
VALUES (2, 1, 'Transaction example application')
ON DUPLICATE KEY UPDATE cover_letter = VALUES(cover_letter);
SET @application_id = (
    SELECT application_id FROM Applications WHERE candidate_id = 2 AND job_id = 1
);
SAVEPOINT application_created;
INSERT INTO Interviews (application_id, scheduled_at, interview_type, result)
VALUES (@application_id, CURRENT_TIMESTAMP + INTERVAL 7 DAY, 'Video', 'Scheduled');
COMMIT;

-- ROLLBACK undoes the following sample insert.
START TRANSACTION;
INSERT INTO Candidates (full_name, email, skills, experience_years, location)
VALUES ('Rollback Example', 'rollback@example.com', 'SQL', 1, 'Remote');
ROLLBACK;

-- SAVEPOINT example: undo the status change but retain the first update.
START TRANSACTION;
UPDATE Applications SET status = 'Under Review' WHERE application_id = 1;
SAVEPOINT before_second_update;
UPDATE Applications SET status = 'Rejected' WHERE application_id = 1;
ROLLBACK TO SAVEPOINT before_second_update;
COMMIT;
