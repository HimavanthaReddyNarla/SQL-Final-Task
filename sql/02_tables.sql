USE job_portal;

CREATE TABLE IF NOT EXISTS Candidates (
    candidate_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) DEFAULT NULL,
    skills VARCHAR(500) NOT NULL DEFAULT '',
    experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
    location VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (candidate_id),
    CONSTRAINT chk_candidate_experience CHECK (experience_years >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Companies (
    company_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    company_name VARCHAR(160) NOT NULL UNIQUE,
    industry VARCHAR(120) NOT NULL,
    location VARCHAR(120) NOT NULL,
    website VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Jobs (
    job_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    company_id INT UNSIGNED NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    required_skills VARCHAR(500) NOT NULL DEFAULT '',
    min_experience DECIMAL(4,1) NOT NULL DEFAULT 0,
    location VARCHAR(120) NOT NULL,
    salary_min DECIMAL(12,2) NOT NULL DEFAULT 0,
    salary_max DECIMAL(12,2) NOT NULL DEFAULT 0,
    employment_type VARCHAR(40) NOT NULL DEFAULT 'Full-time',
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
    posted_at DATE NOT NULL DEFAULT (CURRENT_DATE),
    PRIMARY KEY (job_id),
    CONSTRAINT fk_jobs_company FOREIGN KEY (company_id)
        REFERENCES Companies (company_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_job_experience CHECK (min_experience >= 0),
    CONSTRAINT chk_job_salary CHECK (salary_min >= 0 AND salary_max >= salary_min)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Applications (
    application_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    candidate_id INT UNSIGNED NOT NULL,
    job_id INT UNSIGNED NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Submitted', 'Under Review', 'Interview', 'Selected', 'Rejected')
        NOT NULL DEFAULT 'Submitted',
    cover_letter TEXT DEFAULT NULL,
    PRIMARY KEY (application_id),
    UNIQUE KEY uq_candidate_job (candidate_id, job_id),
    CONSTRAINT fk_applications_candidate FOREIGN KEY (candidate_id)
        REFERENCES Candidates (candidate_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_applications_job FOREIGN KEY (job_id)
        REFERENCES Jobs (job_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Interviews (
    interview_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    application_id INT UNSIGNED NOT NULL,
    scheduled_at DATETIME NOT NULL,
    interview_type VARCHAR(40) NOT NULL DEFAULT 'Video',
    meeting_link VARCHAR(500) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    result ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (interview_id),
    CONSTRAINT fk_interviews_application FOREIGN KEY (application_id)
        REFERENCES Applications (application_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
