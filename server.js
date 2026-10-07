const path = require("node:path");
const express = require("express");
const mysql = require("mysql2/promise");
const demo = require("./demo-data");

const app = express();
const port = Number(process.env.PORT || 3000);
const useDatabase = Boolean(process.env.MYSQL_HOST && process.env.MYSQL_DATABASE && process.env.MYSQL_USER);
let pool;

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

function nextId(items, field) {
  return items.reduce((max, item) => Math.max(max, Number(item[field]) || 0), 0) + 1;
}

function requiredText(value, label, maxLength = 255) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`${label} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function nonNegativeNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} must be a non-negative number.`);
  return number;
}

function optionalWebUrl(value, label) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    if (url.protocol === "http:" || url.protocol === "https:") return text;
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }
  throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
}

async function query(sql, params = []) {
  if (!useDatabase) throw new Error("Database queries are unavailable in demo mode.");
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function withCompany(job) {
  const company = demo.companies.find((item) => item.companyId === job.companyId);
  return { ...job, companyName: company?.companyName || "Unknown company" };
}

function demoApplications() {
  return demo.applications.map((application) => {
    const candidate = demo.candidates.find((item) => item.candidateId === application.candidateId);
    const job = demo.jobs.find((item) => item.jobId === application.jobId);
    return { ...application, candidateName: candidate?.fullName || "Unknown", jobTitle: job?.title || "Unknown", companyName: demo.companies.find((item) => item.companyId === job?.companyId)?.companyName || "Unknown" };
  }).sort((a, b) => String(b.appliedAt).localeCompare(String(a.appliedAt)));
}

const reportQueries = {
  "most-applied": {
    title: "Most applied jobs",
    sql: `SELECT j.title AS jobTitle, c.company_name AS companyName, COUNT(a.application_id) AS applicationCount
          FROM Jobs j JOIN Companies c ON c.company_id = j.company_id
          LEFT JOIN Applications a ON a.job_id = j.job_id
          GROUP BY j.job_id, j.title, c.company_name
          ORDER BY applicationCount DESC, j.title LIMIT 10`,
  },
  "top-companies": {
    title: "Companies with the most applications",
    sql: `SELECT c.company_name AS companyName, COUNT(a.application_id) AS applicationCount
          FROM Companies c LEFT JOIN Jobs j ON j.company_id = c.company_id
          LEFT JOIN Applications a ON a.job_id = j.job_id
          GROUP BY c.company_id, c.company_name
          ORDER BY applicationCount DESC, c.company_name LIMIT 10`,
  },
  "average-salary": {
    title: "Average salary by company",
    sql: `SELECT c.company_name AS companyName,
          ROUND(AVG((j.salary_min + j.salary_max) / 2), 0) AS averageSalary,
          COUNT(j.job_id) AS jobCount
          FROM Companies c LEFT JOIN Jobs j ON j.company_id = c.company_id
          GROUP BY c.company_id, c.company_name ORDER BY averageSalary DESC`,
  },
  "open-jobs": {
    title: "Open jobs",
    sql: `SELECT j.title AS jobTitle, c.company_name AS companyName, j.location,
          j.salary_min AS salaryMin, j.salary_max AS salaryMax, j.posted_at AS postedAt
          FROM Jobs j JOIN Companies c ON c.company_id = j.company_id
          WHERE j.status = 'Open' ORDER BY j.posted_at DESC`,
  },
  selected: {
    title: "Selected candidates",
    sql: `SELECT ca.full_name AS candidateName, j.title AS jobTitle, c.company_name AS companyName,
          a.applied_at AS appliedAt
          FROM Applications a JOIN Candidates ca ON ca.candidate_id = a.candidate_id
          JOIN Jobs j ON j.job_id = a.job_id JOIN Companies c ON c.company_id = j.company_id
          WHERE a.status = 'Selected' ORDER BY a.applied_at DESC`,
  },
  "status-summary": {
    title: "Application status summary",
    sql: `SELECT status, COUNT(*) AS applicationCount
          FROM Applications GROUP BY status ORDER BY applicationCount DESC`,
  },
};

function demoReport(type) {
  const applications = demoApplications();
  if (type === "most-applied") {
    const counts = new Map();
    for (const application of applications) {
      const current = counts.get(application.jobId) || { jobTitle: application.jobTitle, companyName: application.companyName, applicationCount: 0 };
      current.applicationCount += 1;
      counts.set(application.jobId, current);
    }
    return [...counts.values()].sort((a, b) => b.applicationCount - a.applicationCount);
  }
  if (type === "top-companies") {
    return demo.companies.map((company) => ({
      companyName: company.companyName,
      applicationCount: applications.filter((application) => application.companyName === company.companyName).length,
    })).sort((a, b) => b.applicationCount - a.applicationCount);
  }
  if (type === "average-salary") {
    return demo.companies.map((company) => {
      const companyJobs = demo.jobs.filter((job) => job.companyId === company.companyId);
      const salaryTotal = companyJobs.reduce((total, job) => total + (job.salaryMin + job.salaryMax) / 2, 0);
      return {
        companyName: company.companyName,
        averageSalary: companyJobs.length ? Math.round(salaryTotal / companyJobs.length) : null,
        jobCount: companyJobs.length,
      };
    }).sort((a, b) => (b.averageSalary || 0) - (a.averageSalary || 0));
  }
  if (type === "open-jobs") {
    return demo.jobs.filter((job) => job.status === "Open").map((job) => ({
      jobTitle: job.title, companyName: withCompany(job).companyName, location: job.location,
      salaryMin: job.salaryMin, salaryMax: job.salaryMax, postedAt: job.postedAt,
    })).sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  }
  if (type === "selected") {
    return applications.filter((application) => application.status === "Selected").map((application) => ({
      candidateName: application.candidateName, jobTitle: application.jobTitle,
      companyName: application.companyName, appliedAt: application.appliedAt,
    }));
  }
  if (type === "status-summary") {
    const counts = new Map();
    for (const application of applications) counts.set(application.status, (counts.get(application.status) || 0) + 1);
    return [...counts].map(([status, applicationCount]) => ({ status, applicationCount }))
      .sort((a, b) => b.applicationCount - a.applicationCount);
  }
  return null;
}

function skillTokens(value) {
  return value.toLowerCase().split(/[,;|]/).map((skill) => skill.trim()).filter(Boolean);
}

function makeRecommendations(jobs, profile) {
  const wanted = skillTokens(profile.skills);
  const location = profile.location.trim().toLowerCase();
  return jobs.filter((job) => job.status === "Open" && Number(job.minExperience) <= profile.experience
      && (!location || job.location.toLowerCase() === location || job.location.toLowerCase() === "remote"))
    .map((job) => {
      const required = skillTokens(job.requiredSkills);
      const matchedSkills = wanted.filter((skill) => required.includes(skill));
      const locationMatch = !location || job.location.toLowerCase() === location || job.location.toLowerCase() === "remote";
      const skillsScore = required.length ? matchedSkills.length / required.length : 0;
      const score = Math.round(skillsScore * 75 + (locationMatch ? 25 : 0));
      return { ...job, matchPercent: Math.min(score, 100), matchedSkills, locationMatch };
    })
    .filter((job) => job.matchedSkills.length > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent || Number(b.salaryMax) - Number(a.salaryMax));
}

function sendError(res, error) {
  const clientInputError = error.message?.includes("required")
    || error.message?.includes("must be")
    || error.message?.includes("valid")
    || error.message?.includes("already exists");
  const databaseInputError = ["ER_DUP_ENTRY", "ER_NO_REFERENCED_ROW_2", "ER_ROW_IS_REFERENCED_2"].includes(error.code);
  const status = error.status || (error.code === "ER_ROW_IS_REFERENCED_2" ? 409 : clientInputError || databaseInputError ? 400 : 500);
  res.status(status).json({ error: error.message || "An unexpected server error occurred." });
}

app.get("/api/health", (_req, res) => {
  res.json({ mode: useDatabase ? "mysql" : "demo", databaseName: useDatabase ? process.env.MYSQL_DATABASE : null });
});

app.get("/api/dashboard", async (_req, res) => {
  try {
    if (useDatabase) {
      const [summary] = await query(`SELECT
        (SELECT COUNT(*) FROM Candidates) AS candidates,
        (SELECT COUNT(*) FROM Companies) AS companies,
        (SELECT COUNT(*) FROM Jobs WHERE status = 'Open') AS openJobs,
        (SELECT COUNT(*) FROM Applications) AS applications`);
      const statuses = await query("SELECT status, COUNT(*) AS count FROM Applications GROUP BY status ORDER BY count DESC");
      const topJobs = await query(`SELECT j.title AS jobTitle, c.company_name AS companyName, COUNT(a.application_id) AS applicationCount
        FROM Jobs j JOIN Companies c ON c.company_id = j.company_id
        LEFT JOIN Applications a ON a.job_id = j.job_id
        GROUP BY j.job_id, j.title, c.company_name ORDER BY applicationCount DESC LIMIT 5`);
      return res.json({ ...summary, statuses, topJobs });
    }
    const statuses = demoReport("status-summary");
    const topJobs = demoReport("most-applied").slice(0, 5);
    res.json({
      candidates: demo.candidates.length,
      companies: demo.companies.length,
      openJobs: demo.jobs.filter((job) => job.status === "Open").length,
      applications: demo.applications.length,
      statuses: statuses.map((row) => ({ status: row.status, count: row.applicationCount })),
      topJobs,
    });
  } catch (error) { sendError(res, error); }
});

app.get("/api/candidates", async (_req, res) => {
  try {
    const rows = useDatabase
      ? await query(`SELECT candidate_id AS candidateId, full_name AS fullName, email, phone, skills,
          experience_years AS experienceYears, location FROM Candidates ORDER BY full_name`)
      : demo.candidates;
    res.json(rows);
  } catch (error) { sendError(res, error); }
});

app.get("/api/companies", async (_req, res) => {
  try {
    const rows = useDatabase
      ? await query(`SELECT company_id AS companyId, company_name AS companyName, industry, location, website
          FROM Companies ORDER BY company_name`)
      : demo.companies;
    res.json(rows);
  } catch (error) { sendError(res, error); }
});

app.get("/api/jobs", async (_req, res) => {
  try {
    const rows = useDatabase
      ? await query(`SELECT j.job_id AS jobId, j.company_id AS companyId, c.company_name AS companyName,
          j.title, j.description, j.required_skills AS requiredSkills, j.min_experience AS minExperience,
          j.location, j.salary_min AS salaryMin, j.salary_max AS salaryMax, j.employment_type AS employmentType,
          j.status, j.posted_at AS postedAt FROM Jobs j JOIN Companies c ON c.company_id = j.company_id
          ORDER BY j.posted_at DESC, j.job_id DESC`)
      : demo.jobs.map(withCompany).sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    res.json(rows);
  } catch (error) { sendError(res, error); }
});

app.get("/api/applications", async (_req, res) => {
  try {
    const rows = useDatabase
      ? await query(`SELECT a.application_id AS applicationId, a.candidate_id AS candidateId,
          a.job_id AS jobId, a.status, a.applied_at AS appliedAt, ca.full_name AS candidateName,
          j.title AS jobTitle, c.company_name AS companyName FROM Applications a
          JOIN Candidates ca ON ca.candidate_id = a.candidate_id JOIN Jobs j ON j.job_id = a.job_id
          JOIN Companies c ON c.company_id = j.company_id ORDER BY a.applied_at DESC`)
      : demoApplications();
    res.json(rows);
  } catch (error) { sendError(res, error); }
});

app.get("/api/reports/export.txt", async (_req, res) => {
  try {
    const title = reportQueries["most-applied"].title;
    const rows = useDatabase ? await query(reportQueries["most-applied"].sql) : demoReport("most-applied");
    const lines = [title, "=".repeat(title.length), `Generated: ${new Date().toLocaleString()}`, ""];
    if (!rows.length) lines.push("No application data available.");
    for (const row of rows) lines.push(`${row.jobTitle} — ${row.companyName} — ${row.applicationCount} applications`);
    res.type("text/plain").set("Content-Disposition", 'attachment; filename="most-applied-jobs.txt"').send(lines.join("\n"));
  } catch (error) { sendError(res, error); }
});

app.get("/api/interviews", async (_req, res) => {
  try {
    const rows = useDatabase
      ? await query(`SELECT i.interview_id AS interviewId, i.application_id AS applicationId,
          i.scheduled_at AS scheduledAt, i.interview_type AS interviewType, i.meeting_link AS meetingLink,
          i.result, ca.full_name AS candidateName, j.title AS jobTitle
          FROM Interviews i JOIN Applications a ON a.application_id = i.application_id
          JOIN Candidates ca ON ca.candidate_id = a.candidate_id JOIN Jobs j ON j.job_id = a.job_id
          ORDER BY i.scheduled_at`)
      : demo.interviews.map((interview) => {
        const application = demo.applications.find((item) => item.applicationId === interview.applicationId);
        return { ...interview, candidateName: demo.candidates.find((item) => item.candidateId === application?.candidateId)?.fullName, jobTitle: demo.jobs.find((item) => item.jobId === application?.jobId)?.title };
      });
    res.json(rows);
  } catch (error) { sendError(res, error); }
});

app.get("/api/recommendations", async (req, res) => {
  try {
    const profile = {
      skills: String(req.query.skills || ""),
      experience: nonNegativeNumber(req.query.experience || 0, "Experience"),
      location: String(req.query.location || ""),
    };
    if (!profile.skills.trim()) throw new Error("Skills are required to find suitable jobs.");
    const jobs = useDatabase
      ? await query(`SELECT j.job_id AS jobId, j.company_id AS companyId, c.company_name AS companyName,
          j.title, j.description, j.required_skills AS requiredSkills, j.min_experience AS minExperience,
          j.location, j.salary_min AS salaryMin, j.salary_max AS salaryMax,
          j.employment_type AS employmentType, j.status, j.posted_at AS postedAt
          FROM Jobs j JOIN Companies c ON c.company_id = j.company_id
          WHERE j.status = 'Open' AND j.min_experience <= ?
            AND (? = '' OR LOWER(j.location) = LOWER(?) OR LOWER(j.location) = 'remote')`,
        [profile.experience, profile.location, profile.location])
      : demo.jobs.map(withCompany);
    res.json(makeRecommendations(jobs, profile));
  } catch (error) { sendError(res, error); }
});

app.get("/api/reports/:type", async (req, res) => {
  try {
    const report = reportQueries[req.params.type];
    if (!report) return res.status(404).json({ error: "Report not found." });
    const rows = useDatabase ? await query(report.sql) : demoReport(req.params.type);
    res.json({ title: report.title, rows });
  } catch (error) { sendError(res, error); }
});

app.post("/api/candidates", async (req, res) => {
  try {
    const candidate = {
      fullName: requiredText(req.body.fullName, "Full name", 120),
      email: requiredText(req.body.email, "Email", 255),
      phone: String(req.body.phone || "").trim(),
      skills: requiredText(req.body.skills, "Skills", 500),
      experienceYears: nonNegativeNumber(req.body.experienceYears, "Experience"),
      location: requiredText(req.body.location, "Location", 120),
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) throw new Error("Enter a valid email address.");
    if (useDatabase) {
      const result = await query(`INSERT INTO Candidates (full_name, email, phone, skills, experience_years, location)
        VALUES (?, ?, ?, ?, ?, ?)`, [candidate.fullName, candidate.email, candidate.phone || null, candidate.skills, candidate.experienceYears, candidate.location]);
      return res.status(201).json({ candidateId: result.insertId, ...candidate });
    }
    if (demo.candidates.some((item) => item.email.toLowerCase() === candidate.email.toLowerCase())) throw new Error("A candidate with this email already exists.");
    const created = { candidateId: nextId(demo.candidates, "candidateId"), ...candidate };
    demo.candidates.push(created);
    res.status(201).json(created);
  } catch (error) { sendError(res, error); }
});

app.post("/api/jobs", async (req, res) => {
  try {
    const job = {
      companyId: nonNegativeNumber(req.body.companyId, "Company"),
      title: requiredText(req.body.title, "Job title", 160),
      description: requiredText(req.body.description, "Description", 5000),
      requiredSkills: requiredText(req.body.requiredSkills, "Required skills", 500),
      minExperience: nonNegativeNumber(req.body.minExperience, "Minimum experience"),
      location: requiredText(req.body.location, "Location", 120),
      salaryMin: nonNegativeNumber(req.body.salaryMin, "Minimum salary"),
      salaryMax: nonNegativeNumber(req.body.salaryMax, "Maximum salary"),
      employmentType: requiredText(req.body.employmentType || "Full-time", "Employment type", 40),
      status: req.body.status === "Closed" ? "Closed" : "Open",
    };
    if (job.salaryMax < job.salaryMin) throw new Error("Maximum salary must be at least the minimum salary.");
    if (useDatabase) {
      const result = await query(`INSERT INTO Jobs (company_id, title, description, required_skills, min_experience,
        location, salary_min, salary_max, employment_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [job.companyId, job.title, job.description, job.requiredSkills, job.minExperience, job.location, job.salaryMin, job.salaryMax, job.employmentType, job.status]);
      const [company] = await query("SELECT company_name AS companyName FROM Companies WHERE company_id = ?", [job.companyId]);
      return res.status(201).json({ jobId: result.insertId, ...job, companyName: company?.companyName });
    }
    const company = demo.companies.find((item) => item.companyId === job.companyId);
    if (!company) throw new Error("Choose a valid company.");
    const created = { jobId: nextId(demo.jobs, "jobId"), ...job, postedAt: new Date().toISOString().slice(0, 10), companyName: company.companyName };
    demo.jobs.push(created);
    res.status(201).json(created);
  } catch (error) { sendError(res, error); }
});

app.post("/api/companies", async (req, res) => {
  try {
    const company = {
      companyName: requiredText(req.body.companyName, "Company name", 160),
      industry: requiredText(req.body.industry, "Industry", 120),
      location: requiredText(req.body.location, "Location", 120),
      website: optionalWebUrl(req.body.website, "Website"),
    };
    if (useDatabase) {
      const result = await query("INSERT INTO Companies (company_name, industry, location, website) VALUES (?, ?, ?, ?)",
        [company.companyName, company.industry, company.location, company.website || null]);
      return res.status(201).json({ companyId: result.insertId, ...company });
    }
    if (demo.companies.some((item) => item.companyName.toLowerCase() === company.companyName.toLowerCase())) throw new Error("A company with this name already exists.");
    const created = { companyId: nextId(demo.companies, "companyId"), ...company };
    demo.companies.push(created);
    res.status(201).json(created);
  } catch (error) { sendError(res, error); }
});

app.post("/api/applications", async (req, res) => {
  try {
    const candidateId = nonNegativeNumber(req.body.candidateId, "Candidate");
    const jobId = nonNegativeNumber(req.body.jobId, "Job");
    if (useDatabase) {
      const result = await query("INSERT INTO Applications (candidate_id, job_id, cover_letter) VALUES (?, ?, ?)", [candidateId, jobId, String(req.body.coverLetter || "").trim() || null]);
      return res.status(201).json({ applicationId: result.insertId, candidateId, jobId, status: "Submitted", appliedAt: new Date().toISOString() });
    }
    if (!demo.candidates.some((candidate) => candidate.candidateId === candidateId)) throw new Error("Choose a valid candidate.");
    if (!demo.jobs.some((job) => job.jobId === jobId && job.status === "Open")) throw new Error("Choose an open job.");
    if (demo.applications.some((application) => application.candidateId === candidateId && application.jobId === jobId)) throw new Error("This candidate has already applied to this job.");
    const created = { applicationId: nextId(demo.applications, "applicationId"), candidateId, jobId, status: "Submitted", appliedAt: new Date().toISOString().slice(0, 10) };
    demo.applications.push(created);
    res.status(201).json(created);
  } catch (error) { sendError(res, error); }
});

app.post("/api/interviews", async (req, res) => {
  try {
    const applicationId = nonNegativeNumber(req.body.applicationId, "Application");
    const scheduledAt = requiredText(req.body.scheduledAt, "Interview date");
    if (Number.isNaN(new Date(scheduledAt).getTime())) throw new Error("Enter a valid interview date and time.");
    const interviewType = requiredText(req.body.interviewType || "Video", "Interview type", 40);
    const meetingLink = optionalWebUrl(req.body.meetingLink, "Meeting link");
    if (useDatabase) {
      const result = await query(`INSERT INTO Interviews (application_id, scheduled_at, interview_type, meeting_link)
        VALUES (?, ?, ?, ?)`, [applicationId, scheduledAt.replace("T", " "), interviewType, meetingLink || null]);
      return res.status(201).json({ interviewId: result.insertId, applicationId, scheduledAt, interviewType, meetingLink, result: "Scheduled" });
    }
    if (!demo.applications.some((application) => application.applicationId === applicationId)) throw new Error("Choose a valid application.");
    const created = { interviewId: nextId(demo.interviews, "interviewId"), applicationId, scheduledAt, interviewType, meetingLink, result: "Scheduled" };
    demo.interviews.push(created);
    res.status(201).json(created);
  } catch (error) { sendError(res, error); }
});

app.patch("/api/applications/:id", async (req, res) => {
  try {
    const applicationId = nonNegativeNumber(req.params.id, "Application ID");
    const statuses = ["Submitted", "Under Review", "Interview", "Selected", "Rejected"];
    if (!statuses.includes(req.body.status)) throw new Error(`Status must be one of: ${statuses.join(", ")}.`);
    if (useDatabase) {
      const [existing] = await query("SELECT application_id FROM Applications WHERE application_id = ?", [applicationId]);
      if (!existing) return res.status(404).json({ error: "Application not found." });
      await query("UPDATE Applications SET status = ? WHERE application_id = ?", [req.body.status, applicationId]);
    } else {
      const application = demo.applications.find((item) => item.applicationId === applicationId);
      if (!application) return res.status(404).json({ error: "Application not found." });
      application.status = req.body.status;
    }
    res.json({ applicationId, status: req.body.status });
  } catch (error) { sendError(res, error); }
});

app.patch("/api/jobs/:id", async (req, res) => {
  try {
    const jobId = nonNegativeNumber(req.params.id, "Job ID");
    if (!["Open", "Closed"].includes(req.body.status)) throw new Error("Status must be Open or Closed.");
    if (useDatabase) {
      const [existing] = await query("SELECT job_id FROM Jobs WHERE job_id = ?", [jobId]);
      if (!existing) return res.status(404).json({ error: "Job not found." });
      await query("UPDATE Jobs SET status = ? WHERE job_id = ?", [req.body.status, jobId]);
    } else {
      const job = demo.jobs.find((item) => item.jobId === jobId);
      if (!job) return res.status(404).json({ error: "Job not found." });
      job.status = req.body.status;
    }
    res.json({ jobId, status: req.body.status });
  } catch (error) { sendError(res, error); }
});

app.patch("/api/interviews/:id", async (req, res) => {
  try {
    const interviewId = nonNegativeNumber(req.params.id, "Interview ID");
    if (!["Scheduled", "Completed", "Cancelled"].includes(req.body.result)) throw new Error("Interview result must be Scheduled, Completed, or Cancelled.");
    if (useDatabase) {
      const [existing] = await query("SELECT interview_id FROM Interviews WHERE interview_id = ?", [interviewId]);
      if (!existing) return res.status(404).json({ error: "Interview not found." });
      await query("UPDATE Interviews SET result = ? WHERE interview_id = ?", [req.body.result, interviewId]);
    } else {
      const interview = demo.interviews.find((item) => item.interviewId === interviewId);
      if (!interview) return res.status(404).json({ error: "Interview not found." });
      interview.result = req.body.result;
    }
    res.json({ interviewId, result: req.body.result });
  } catch (error) { sendError(res, error); }
});

app.delete("/api/candidates/:id", async (req, res) => {
  try {
    const candidateId = nonNegativeNumber(req.params.id, "Candidate ID");
    if (useDatabase) {
      const result = await query("DELETE FROM Candidates WHERE candidate_id = ?", [candidateId]);
      if (!result.affectedRows) return res.status(404).json({ error: "Candidate not found." });
    } else {
      const index = demo.candidates.findIndex((item) => item.candidateId === candidateId);
      if (index < 0) return res.status(404).json({ error: "Candidate not found." });
      demo.candidates.splice(index, 1);
      const removedApplications = demo.applications.filter((item) => item.candidateId === candidateId).map((item) => item.applicationId);
      demo.applications = demo.applications.filter((item) => item.candidateId !== candidateId);
      demo.interviews = demo.interviews.filter((item) => !removedApplications.includes(item.applicationId));
    }
    res.status(204).end();
  } catch (error) { sendError(res, error); }
});

app.delete("/api/companies/:id", async (req, res) => {
  try {
    const companyId = nonNegativeNumber(req.params.id, "Company ID");
    if (useDatabase) {
      const result = await query("DELETE FROM Companies WHERE company_id = ?", [companyId]);
      if (!result.affectedRows) return res.status(404).json({ error: "Company not found or still has job listings." });
    } else {
      if (demo.jobs.some((job) => job.companyId === companyId)) return res.status(409).json({ error: "Remove this company's job listings before removing the company." });
      const index = demo.companies.findIndex((item) => item.companyId === companyId);
      if (index < 0) return res.status(404).json({ error: "Company not found." });
      demo.companies.splice(index, 1);
    }
    res.status(204).end();
  } catch (error) { sendError(res, error); }
});

app.delete("/api/interviews/:id", async (req, res) => {
  try {
    const interviewId = nonNegativeNumber(req.params.id, "Interview ID");
    if (useDatabase) {
      const result = await query("DELETE FROM Interviews WHERE interview_id = ?", [interviewId]);
      if (!result.affectedRows) return res.status(404).json({ error: "Interview not found." });
    } else {
      const index = demo.interviews.findIndex((item) => item.interviewId === interviewId);
      if (index < 0) return res.status(404).json({ error: "Interview not found." });
      demo.interviews.splice(index, 1);
    }
    res.status(204).end();
  } catch (error) { sendError(res, error); }
});

app.delete("/api/jobs/:id", async (req, res) => {
  try {
    const jobId = nonNegativeNumber(req.params.id, "Job ID");
    if (useDatabase) {
      const result = await query("DELETE FROM Jobs WHERE job_id = ?", [jobId]);
      if (!result.affectedRows) return res.status(404).json({ error: "Job not found." });
    } else {
      const index = demo.jobs.findIndex((item) => item.jobId === jobId);
      if (index < 0) return res.status(404).json({ error: "Job not found." });
      demo.jobs.splice(index, 1);
      const removedApplications = demo.applications.filter((item) => item.jobId === jobId).map((item) => item.applicationId);
      demo.applications = demo.applications.filter((item) => item.jobId !== jobId);
      demo.interviews = demo.interviews.filter((item) => !removedApplications.includes(item.applicationId));
    }
    res.status(204).end();
  } catch (error) { sendError(res, error); }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));

async function start() {
  if (useDatabase) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
    });
    await pool.query("SELECT 1");
  }
  app.listen(port, () => {
    console.log(`Job Portal is running at http://localhost:${port}`);
    console.log(useDatabase ? `Database mode: MySQL (${process.env.MYSQL_DATABASE})` : "Database mode: demo data (configure MYSQL_* variables for MySQL).");
  });
}

start().catch((error) => {
  console.error(`Could not start the Job Portal: ${error.message}`);
  process.exitCode = 1;
});
