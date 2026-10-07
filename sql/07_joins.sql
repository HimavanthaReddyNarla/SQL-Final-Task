USE job_portal;

-- INNER JOIN: jobs with their company
SELECT j.title, c.company_name, j.location, j.salary_min, j.salary_max
FROM Jobs AS j
INNER JOIN Companies AS c ON c.company_id = j.company_id;

-- LEFT JOIN: all jobs, including those with no applications
SELECT j.title, COUNT(a.application_id) AS application_count
FROM Jobs AS j
LEFT JOIN Applications AS a ON a.job_id = j.job_id
GROUP BY j.job_id, j.title
ORDER BY application_count DESC;

-- RIGHT JOIN: include companies even when they have no job postings
SELECT c.company_name, j.title
FROM Jobs AS j
RIGHT JOIN Companies AS c ON c.company_id = j.company_id
ORDER BY c.company_name;

-- Multi-table join: application and interview pipeline
SELECT ca.full_name, j.title, co.company_name, a.status, i.scheduled_at
FROM Applications AS a
INNER JOIN Candidates AS ca ON ca.candidate_id = a.candidate_id
INNER JOIN Jobs AS j ON j.job_id = a.job_id
INNER JOIN Companies AS co ON co.company_id = j.company_id
LEFT JOIN Interviews AS i ON i.application_id = a.application_id
ORDER BY a.applied_at DESC;
