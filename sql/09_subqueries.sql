USE job_portal;

-- Single-row subquery
SELECT title, salary_max
FROM Jobs
WHERE salary_max > (SELECT AVG(salary_max) FROM Jobs WHERE status = 'Open');

-- Multi-row subquery with IN
SELECT full_name, email
FROM Candidates
WHERE candidate_id IN (
    SELECT candidate_id FROM Applications WHERE status = 'Selected'
);

-- ANY and ALL comparisons
SELECT title, salary_min FROM Jobs
WHERE salary_min > ANY (SELECT salary_min FROM Jobs WHERE company_id = 1);

SELECT title, salary_max FROM Jobs
WHERE salary_max >= ALL (SELECT salary_max FROM Jobs WHERE status = 'Open');

-- Correlated EXISTS
SELECT c.company_name
FROM Companies AS c
WHERE EXISTS (
    SELECT 1 FROM Jobs AS j
    INNER JOIN Applications AS a ON a.job_id = j.job_id
    WHERE j.company_id = c.company_id
);

-- NOT EXISTS: candidates who have not applied to any job
SELECT ca.full_name
FROM Candidates AS ca
WHERE NOT EXISTS (
    SELECT 1 FROM Applications AS a WHERE a.candidate_id = ca.candidate_id
);
