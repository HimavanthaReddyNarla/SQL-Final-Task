USE job_portal;

-- INSERT
INSERT INTO Candidates (full_name, email, skills, experience_years, location)
VALUES ('Test Candidate', 'test.candidate@example.com', 'SQL, Python', 2, 'Bengaluru');

-- SELECT
SELECT candidate_id, full_name, email, skills FROM Candidates;

-- UPDATE
UPDATE Candidates SET location = 'Remote' WHERE email = 'test.candidate@example.com';

-- DELETE (remove this example record)
DELETE FROM Candidates WHERE email = 'test.candidate@example.com';

-- Add an application for an existing candidate/job pair.
INSERT INTO Applications (candidate_id, job_id, cover_letter)
VALUES (1, 2, 'I am excited to apply for this role.')
ON DUPLICATE KEY UPDATE cover_letter = VALUES(cover_letter);
