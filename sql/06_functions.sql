USE job_portal;

-- String functions
SELECT UPPER(full_name) AS candidate_name,
       CONCAT(full_name, ' — ', location) AS candidate_location,
       CHAR_LENGTH(skills) AS skills_text_length,
       TRIM(skills) AS normalized_skills
FROM Candidates;

-- Numeric functions
SELECT title, ROUND((salary_min + salary_max) / 2, 0) AS midpoint_salary,
       CEIL(min_experience) AS rounded_experience
FROM Jobs;

-- Date functions
SELECT title, DATE_FORMAT(posted_at, '%d %b %Y') AS posted_date,
       DATEDIFF(CURRENT_DATE, posted_at) AS days_since_posted,
       DATE_ADD(posted_at, INTERVAL 30 DAY) AS listing_expiry
FROM Jobs;

-- NULL handling
SELECT company_name, COALESCE(website, 'No website listed') AS website
FROM Companies;
