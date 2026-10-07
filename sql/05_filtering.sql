USE job_portal;

-- WHERE, AND, OR, NOT
SELECT title, location, salary_min, salary_max
FROM Jobs
WHERE status = 'Open' AND (location = 'Remote' OR salary_min >= 1500000)
  AND NOT employment_type = 'Contract';

-- BETWEEN
SELECT title, salary_min, salary_max FROM Jobs
WHERE salary_min BETWEEN 900000 AND 1800000;

-- IN
SELECT title, location FROM Jobs
WHERE location IN ('Bengaluru', 'Hyderabad', 'Remote');

-- LIKE
SELECT full_name, skills FROM Candidates
WHERE skills LIKE '%Python%';

-- ORDER BY and LIMIT
SELECT title, salary_max FROM Jobs
WHERE status = 'Open'
ORDER BY salary_max DESC, posted_at DESC
LIMIT 5;

-- Profile-based job recommendations (adjust the three profile values).
SET @candidate_skills = 'Python';
SET @candidate_experience = 3;
SET @candidate_location = 'Bengaluru';

SELECT j.title, c.company_name, j.location, j.required_skills,
       j.salary_min, j.salary_max, j.min_experience
FROM Jobs AS j
INNER JOIN Companies AS c ON c.company_id = j.company_id
WHERE j.status = 'Open'
  AND j.min_experience <= @candidate_experience
  AND (j.location = @candidate_location OR j.location = 'Remote')
  AND j.required_skills LIKE CONCAT('%', @candidate_skills, '%')
ORDER BY (j.location = @candidate_location) DESC, j.salary_max DESC
LIMIT 10;
