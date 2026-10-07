const companies = [
  { companyId: 1, companyName: "Northstar Analytics", industry: "Technology", location: "Bengaluru", website: "https://northstar.example" },
  { companyId: 2, companyName: "Greenfield Health", industry: "Healthcare", location: "Hyderabad", website: "https://greenfield.example" },
  { companyId: 3, companyName: "Vertex Financial", industry: "Finance", location: "Mumbai", website: "https://vertex.example" },
  { companyId: 4, companyName: "Cloudline Systems", industry: "Technology", location: "Remote", website: "https://cloudline.example" },
  { companyId: 5, companyName: "BrightPath Learning", industry: "Education", location: "Chennai", website: "https://brightpath.example" },
];

const jobs = [
  { jobId: 1, companyId: 1, title: "Senior Data Analyst", description: "Turn complex datasets into clear product and business insights.", requiredSkills: "SQL, Python, Data Analysis, Tableau", minExperience: 3, location: "Bengaluru", salaryMin: 1200000, salaryMax: 1800000, employmentType: "Full-time", status: "Open", postedAt: "2026-10-04" },
  { jobId: 2, companyId: 1, title: "Machine Learning Engineer", description: "Build and deploy machine learning systems at scale.", requiredSkills: "Python, Machine Learning, SQL", minExperience: 4, location: "Remote", salaryMin: 1800000, salaryMax: 2800000, employmentType: "Full-time", status: "Open", postedAt: "2026-10-01" },
  { jobId: 3, companyId: 2, title: "Product Designer", description: "Create accessible experiences for a growing digital health platform.", requiredSkills: "UX Design, Figma, User Research", minExperience: 2, location: "Hyderabad", salaryMin: 900000, salaryMax: 1400000, employmentType: "Full-time", status: "Open", postedAt: "2026-10-05" },
  { jobId: 4, companyId: 2, title: "Backend Developer", description: "Design secure, reliable services for healthcare applications.", requiredSkills: "Java, Spring Boot, MySQL", minExperience: 2, location: "Hyderabad", salaryMin: 1100000, salaryMax: 1700000, employmentType: "Full-time", status: "Open", postedAt: "2026-09-29" },
  { jobId: 5, companyId: 3, title: "Business Intelligence Analyst", description: "Build financial dashboards and answer questions with data.", requiredSkills: "SQL, Excel, Power BI", minExperience: 1, location: "Mumbai", salaryMin: 800000, salaryMax: 1300000, employmentType: "Full-time", status: "Open", postedAt: "2026-10-06" },
  { jobId: 6, companyId: 4, title: "Cloud Platform Engineer", description: "Automate cloud infrastructure and improve service reliability.", requiredSkills: "AWS, Docker, Kubernetes, Linux", minExperience: 5, location: "Remote", salaryMin: 2000000, salaryMax: 3200000, employmentType: "Full-time", status: "Open", postedAt: "2026-10-03" },
  { jobId: 7, companyId: 4, title: "Frontend Developer", description: "Build intuitive interfaces for modern web products.", requiredSkills: "JavaScript, React, Node.js, TypeScript", minExperience: 3, location: "Remote", salaryMin: 1400000, salaryMax: 2200000, employmentType: "Full-time", status: "Open", postedAt: "2026-10-02" },
  { jobId: 8, companyId: 5, title: "Data Associate", description: "Help our learning teams measure outcomes and improve products.", requiredSkills: "Python, Data Analysis, Statistics", minExperience: 1, location: "Chennai", salaryMin: 700000, salaryMax: 1100000, employmentType: "Full-time", status: "Open", postedAt: "2026-09-28" },
  { jobId: 9, companyId: 3, title: "Junior Data Analyst", description: "Support reporting and research for customer teams.", requiredSkills: "SQL, Excel", minExperience: 0, location: "Remote", salaryMin: 600000, salaryMax: 900000, employmentType: "Full-time", status: "Closed", postedAt: "2026-09-07" },
];

const candidates = [
  { candidateId: 1, fullName: "Aarav Mehta", email: "aarav.mehta@example.com", phone: "+91 98765 10001", skills: "SQL, Python, Data Analysis, Tableau", experienceYears: 3, location: "Bengaluru" },
  { candidateId: 2, fullName: "Diya Sharma", email: "diya.sharma@example.com", phone: "+91 98765 10002", skills: "JavaScript, React, Node.js, TypeScript", experienceYears: 4, location: "Hyderabad" },
  { candidateId: 3, fullName: "Ishaan Rao", email: "ishaan.rao@example.com", phone: "+91 98765 10003", skills: "Python, Machine Learning, SQL", experienceYears: 5, location: "Mumbai" },
  { candidateId: 4, fullName: "Mira Kapoor", email: "mira.kapoor@example.com", phone: "+91 98765 10004", skills: "Java, Spring Boot, MySQL", experienceYears: 2, location: "Chennai" },
  { candidateId: 5, fullName: "Kabir Nair", email: "kabir.nair@example.com", phone: "+91 98765 10005", skills: "AWS, Docker, Kubernetes, Linux", experienceYears: 6, location: "Pune" },
  { candidateId: 6, fullName: "Anaya Reddy", email: "anaya.reddy@example.com", phone: "+91 98765 10006", skills: "UX Design, Figma, User Research", experienceYears: 3, location: "Hyderabad" },
  { candidateId: 7, fullName: "Reyansh Patel", email: "reyansh.patel@example.com", phone: "+91 98765 10007", skills: "SQL, Excel, Power BI", experienceYears: 1, location: "Ahmedabad" },
  { candidateId: 8, fullName: "Sara Thomas", email: "sara.thomas@example.com", phone: "+91 98765 10008", skills: "Python, Data Analysis, Statistics", experienceYears: 2, location: "Remote" },
];

const applications = [
  { applicationId: 1, candidateId: 1, jobId: 1, status: "Interview", appliedAt: "2026-10-02" },
  { applicationId: 2, candidateId: 1, jobId: 5, status: "Submitted", appliedAt: "2026-10-04" },
  { applicationId: 3, candidateId: 2, jobId: 7, status: "Selected", appliedAt: "2026-09-25" },
  { applicationId: 4, candidateId: 3, jobId: 2, status: "Under Review", appliedAt: "2026-10-03" },
  { applicationId: 5, candidateId: 3, jobId: 1, status: "Submitted", appliedAt: "2026-10-05" },
  { applicationId: 6, candidateId: 4, jobId: 4, status: "Interview", appliedAt: "2026-09-29" },
  { applicationId: 7, candidateId: 5, jobId: 6, status: "Selected", appliedAt: "2026-09-25" },
  { applicationId: 8, candidateId: 6, jobId: 3, status: "Submitted", appliedAt: "2026-10-06" },
  { applicationId: 9, candidateId: 7, jobId: 5, status: "Under Review", appliedAt: "2026-10-04" },
  { applicationId: 10, candidateId: 8, jobId: 8, status: "Rejected", appliedAt: "2026-09-26" },
  { applicationId: 11, candidateId: 1, jobId: 8, status: "Submitted", appliedAt: "2026-10-06" },
  { applicationId: 12, candidateId: 2, jobId: 4, status: "Rejected", appliedAt: "2026-09-22" },
];

const interviews = [
  { interviewId: 1, applicationId: 1, scheduledAt: "2026-10-09T10:00:00", interviewType: "Video", meetingLink: "https://meet.example/analytics-101", result: "Scheduled" },
  { interviewId: 2, applicationId: 3, scheduledAt: "2026-10-05T14:00:00", interviewType: "Video", meetingLink: "https://meet.example/frontend-201", result: "Completed" },
  { interviewId: 3, applicationId: 6, scheduledAt: "2026-10-11T11:00:00", interviewType: "On-site", meetingLink: "", result: "Scheduled" },
  { interviewId: 4, applicationId: 7, scheduledAt: "2026-10-02T15:00:00", interviewType: "Video", meetingLink: "https://meet.example/cloud-301", result: "Completed" },
];

module.exports = { applications, candidates, companies, interviews, jobs };
