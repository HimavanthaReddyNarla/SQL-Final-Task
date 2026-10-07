USE job_portal;

INSERT INTO Companies (company_id, company_name, industry, location, website) VALUES
(1, 'Northstar Analytics', 'Technology', 'Bengaluru', 'https://northstar.example'),
(2, 'Greenfield Health', 'Healthcare', 'Hyderabad', 'https://greenfield.example'),
(3, 'Vertex Financial', 'Finance', 'Mumbai', 'https://vertex.example'),
(4, 'Cloudline Systems', 'Technology', 'Remote', 'https://cloudline.example'),
(5, 'BrightPath Learning', 'Education', 'Chennai', 'https://brightpath.example')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO Candidates
(candidate_id, full_name, email, phone, skills, experience_years, location) VALUES
(1, 'Aarav Mehta', 'aarav.mehta@example.com', '+91 98765 10001', 'SQL, Python, Data Analysis, Tableau', 3.0, 'Bengaluru'),
(2, 'Diya Sharma', 'diya.sharma@example.com', '+91 98765 10002', 'JavaScript, React, Node.js, TypeScript', 4.0, 'Hyderabad'),
(3, 'Ishaan Rao', 'ishaan.rao@example.com', '+91 98765 10003', 'Python, Machine Learning, SQL', 5.0, 'Mumbai'),
(4, 'Mira Kapoor', 'mira.kapoor@example.com', '+91 98765 10004', 'Java, Spring Boot, MySQL', 2.0, 'Chennai'),
(5, 'Kabir Nair', 'kabir.nair@example.com', '+91 98765 10005', 'AWS, Docker, Kubernetes, Linux', 6.0, 'Pune'),
(6, 'Anaya Reddy', 'anaya.reddy@example.com', '+91 98765 10006', 'UX Design, Figma, User Research', 3.0, 'Hyderabad'),
(7, 'Reyansh Patel', 'reyansh.patel@example.com', '+91 98765 10007', 'SQL, Excel, Power BI', 1.0, 'Ahmedabad'),
(8, 'Sara Thomas', 'sara.thomas@example.com', '+91 98765 10008', 'Python, Data Analysis, Statistics', 2.0, 'Remote')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO Jobs
(job_id, company_id, title, description, required_skills, min_experience, location, salary_min, salary_max, employment_type, status, posted_at) VALUES
(1, 1, 'Senior Data Analyst', 'Turn complex datasets into clear product and business insights.', 'SQL, Python, Data Analysis, Tableau', 3, 'Bengaluru', 1200000, 1800000, 'Full-time', 'Open', CURRENT_DATE - INTERVAL 3 DAY),
(2, 1, 'Machine Learning Engineer', 'Build and deploy machine learning systems at scale.', 'Python, Machine Learning, SQL', 4, 'Remote', 1800000, 2800000, 'Full-time', 'Open', CURRENT_DATE - INTERVAL 6 DAY),
(3, 2, 'Product Designer', 'Create accessible experiences for a growing digital health platform.', 'UX Design, Figma, User Research', 2, 'Hyderabad', 900000, 1400000, 'Full-time', 'Open', CURRENT_DATE - INTERVAL 2 DAY),
(4, 2, 'Backend Developer', 'Design secure, reliable services for healthcare applications.', 'Java, Spring Boot, MySQL', 2, 'Hyderabad', 1100000, 1700000, 'Full-time', 'Open', CURRENT_DATE - INTERVAL 8 DAY),
(5, 3, 'Business Intelligence Analyst', 'Build financial dashboards and answer questions with data.', 'SQL, Excel, Power BI', 1, 'Mumbai', 800000, 1300000, 'Full-time', 'Open', CURRENT_DATE - INTERVAL 1 DAY),
(6, 4, 'Cloud Platform Engineer', 'Automate cloud infrastructure and improve service reliability.', 'AWS, Docker, Kubernetes, Linux', 5, 'Remote', 2000000, 3200000, 'Full-time', 'Open', CURRENT_DATE - INTERVAL 4 DAY),
(7, 4, 'Frontend Developer', 'Build intuitive interfaces for modern web products.', 'JavaScript, React, Node.js, TypeScript', 3, 'Remote', 1400000, 2200000, 'Full-time', 'Open', CURRENT_DATE - INTERVAL 5 DAY),
(8, 5, 'Data Associate', 'Help our learning teams measure outcomes and improve products.', 'Python, Data Analysis, Statistics', 1, 'Chennai', 700000, 1100000, 'Full-time', 'Open', CURRENT_DATE - INTERVAL 9 DAY),
(9, 3, 'Junior Data Analyst', 'Support reporting and research for customer teams.', 'SQL, Excel', 0, 'Remote', 600000, 900000, 'Full-time', 'Closed', CURRENT_DATE - INTERVAL 30 DAY)
ON DUPLICATE KEY UPDATE company_id = VALUES(company_id), title = VALUES(title),
    description = VALUES(description), required_skills = VALUES(required_skills),
    min_experience = VALUES(min_experience), location = VALUES(location),
    salary_min = VALUES(salary_min), salary_max = VALUES(salary_max),
    employment_type = VALUES(employment_type), status = VALUES(status), posted_at = VALUES(posted_at);

INSERT INTO Applications (application_id, candidate_id, job_id, status, applied_at) VALUES
(1, 1, 1, 'Interview', CURRENT_TIMESTAMP - INTERVAL 5 DAY),
(2, 1, 5, 'Submitted', CURRENT_TIMESTAMP - INTERVAL 3 DAY),
(3, 2, 7, 'Selected', CURRENT_TIMESTAMP - INTERVAL 10 DAY),
(4, 3, 2, 'Under Review', CURRENT_TIMESTAMP - INTERVAL 4 DAY),
(5, 3, 1, 'Submitted', CURRENT_TIMESTAMP - INTERVAL 2 DAY),
(6, 4, 4, 'Interview', CURRENT_TIMESTAMP - INTERVAL 8 DAY),
(7, 5, 6, 'Selected', CURRENT_TIMESTAMP - INTERVAL 12 DAY),
(8, 6, 3, 'Submitted', CURRENT_TIMESTAMP - INTERVAL 1 DAY),
(9, 7, 5, 'Under Review', CURRENT_TIMESTAMP - INTERVAL 3 DAY),
(10, 8, 8, 'Rejected', CURRENT_TIMESTAMP - INTERVAL 11 DAY),
(11, 1, 8, 'Submitted', CURRENT_TIMESTAMP - INTERVAL 1 DAY),
(12, 2, 4, 'Rejected', CURRENT_TIMESTAMP - INTERVAL 15 DAY)
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO Interviews (interview_id, application_id, scheduled_at, interview_type, meeting_link, result) VALUES
(1, 1, CURRENT_TIMESTAMP + INTERVAL 2 DAY, 'Video', 'https://meet.example/analytics-101', 'Scheduled'),
(2, 3, CURRENT_TIMESTAMP - INTERVAL 2 DAY, 'Video', 'https://meet.example/frontend-201', 'Completed'),
(3, 6, CURRENT_TIMESTAMP + INTERVAL 4 DAY, 'On-site', NULL, 'Scheduled'),
(4, 7, CURRENT_TIMESTAMP - INTERVAL 5 DAY, 'Video', 'https://meet.example/cloud-301', 'Completed')
ON DUPLICATE KEY UPDATE result = VALUES(result);
