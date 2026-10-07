USE job_portal;

CREATE OR REPLACE VIEW vw_open_jobs AS
SELECT j.job_id, j.title, c.company_name, j.required_skills, j.min_experience,
       j.location, j.salary_min, j.salary_max, j.employment_type, j.posted_at
FROM Jobs AS j
INNER JOIN Companies AS c ON c.company_id = j.company_id
WHERE j.status = 'Open';

CREATE OR REPLACE VIEW vw_application_status_summary AS
SELECT status, COUNT(*) AS application_count
FROM Applications
GROUP BY status;

CREATE OR REPLACE VIEW vw_company_application_report AS
SELECT c.company_id, c.company_name,
       COUNT(DISTINCT a.application_id) AS application_count,
       ROUND(AVG((j.salary_min + j.salary_max) / 2), 0) AS average_salary
FROM Companies AS c
LEFT JOIN Jobs AS j ON j.company_id = c.company_id
LEFT JOIN Applications AS a ON a.job_id = j.job_id
GROUP BY c.company_id, c.company_name;

-- Query the views
SELECT * FROM vw_open_jobs ORDER BY posted_at DESC;
SELECT * FROM vw_application_status_summary ORDER BY application_count DESC;
SELECT * FROM vw_company_application_report ORDER BY application_count DESC;
