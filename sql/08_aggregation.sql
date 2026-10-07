USE job_portal;

-- COUNT and GROUP BY
SELECT status, COUNT(*) AS application_count
FROM Applications
GROUP BY status
ORDER BY application_count DESC;

-- SUM, AVG, MIN and MAX per company
SELECT c.company_name,
       COUNT(j.job_id) AS open_job_count,
       SUM(j.salary_max) AS total_max_salary_budget,
       ROUND(AVG((j.salary_min + j.salary_max) / 2), 0) AS average_midpoint_salary,
       MIN(j.salary_min) AS lowest_salary,
       MAX(j.salary_max) AS highest_salary
FROM Companies AS c
LEFT JOIN Jobs AS j ON j.company_id = c.company_id AND j.status = 'Open'
GROUP BY c.company_id, c.company_name
HAVING COUNT(j.job_id) > 0
ORDER BY average_midpoint_salary DESC;

-- Most applied jobs; HAVING filters aggregated results
SELECT j.title, COUNT(a.application_id) AS application_count
FROM Jobs AS j
LEFT JOIN Applications AS a ON a.job_id = j.job_id
GROUP BY j.job_id, j.title
HAVING COUNT(a.application_id) >= 1
ORDER BY application_count DESC
LIMIT 10;
