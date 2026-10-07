const appState = {
  candidates: [],
  companies: [],
  jobs: [],
  applications: [],
  interviews: [],
  reportType: "most-applied",
  toastTimer: null,
};

const reportColumns = {
  "most-applied": [["jobTitle", "Job"], ["companyName", "Company"], ["applicationCount", "Applications"]],
  "top-companies": [["companyName", "Company"], ["applicationCount", "Applications"]],
  "average-salary": [["companyName", "Company"], ["averageSalary", "Average salary"], ["jobCount", "Jobs"]],
  "open-jobs": [["jobTitle", "Job"], ["companyName", "Company"], ["location", "Location"], ["salaryMin", "Salary from"], ["salaryMax", "Salary to"], ["postedAt", "Posted"]],
  selected: [["candidateName", "Candidate"], ["jobTitle", "Job"], ["companyName", "Company"], ["appliedAt", "Applied"]],
  "status-summary": [["status", "Status"], ["applicationCount", "Applications"]],
};

const viewNames = {
  overview: "Overview",
  jobs: "Job listings",
  candidates: "Candidates",
  companies: "Companies",
  applications: "Applications",
  interviews: "Interviews",
  recommendations: "Job matches",
  reports: "Reports",
};

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));
const money = (value) => value == null ? "—" : new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(Number(value));
const dateText = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? esc(value) : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const initials = (value) => String(value || "??").split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
const statusClass = (value) => String(value || "").toLowerCase().replace(/\s+/g, "-");

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status}).`);
  }
  return response.status === 204 ? null : response.json();
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(appState.toastTimer);
  appState.toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

async function refreshData() {
  const [candidates, companies, jobs, applications, interviews] = await Promise.all([
    api("/api/candidates"), api("/api/companies"), api("/api/jobs"),
    api("/api/applications"), api("/api/interviews"),
  ]);
  Object.assign(appState, { candidates, companies, jobs, applications, interviews });
  renderCandidates();
  renderCompanies();
  renderJobs();
  renderApplications();
  renderInterviews();
  populateFormOptions();
}

function renderOverview() {
  const dashboard = appState.dashboard;
  const stats = [
    ["Candidates", dashboard.candidates, "People ready for what's next", "♙", ""],
    ["Open positions", dashboard.openJobs, "Opportunities waiting for you", "▤", "peach-bg"],
    ["Applications", dashboard.applications, "Stories in motion", "▣", "blue-bg"],
    ["Companies", dashboard.companies, "Teams building great things", "⌂", "yellow-bg"],
  ];
  document.getElementById("stats-grid").innerHTML = stats.map(([label, value, caption, icon, color]) => `
    <article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon ${color}">${icon}</span></div>
    <div class="stat-value">${Number(value || 0).toLocaleString("en-IN")}</div><div class="stat-foot">${caption}</div></article>`).join("");
  const statusNames = ["Submitted", "Under Review", "Interview", "Selected", "Rejected"];
  const counts = new Map(dashboard.statuses.map((item) => [item.status, Number(item.count)]));
  const maxCount = Math.max(1, ...statusNames.map((status) => counts.get(status) || 0));
  document.getElementById("pipeline-chart").innerHTML = statusNames.map((status) => {
    const count = counts.get(status) || 0;
    const height = Math.max(5, Math.round((count / maxCount) * 82));
    return `<div class="pipeline-column"><strong>${count}</strong><div class="pipeline-bar" style="height:${height}px"></div><small>${esc(status)}</small></div>`;
  }).join("");
  const topJobs = dashboard.topJobs;
  document.getElementById("top-jobs-table").innerHTML = table(
    [["jobTitle", "Job title"], ["companyName", "Company"], ["applicationCount", "Applications"]],
    topJobs,
    (row, key) => key === "applicationCount"
      ? `<span class="match-pill">${Number(row.applicationCount)} applications</span>`
      : esc(row[key] ?? "—"),
  );
}

function table(columns, rows, customCell) {
  if (!rows.length) return '<div class="table-empty">Nothing to show just yet. The next great thing is on its way.</div>';
  return `<div class="data-table-wrap"><table><thead><tr>${columns.map(([, label]) => `<th>${esc(label)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${columns.map(([key]) => `<td>${customCell ? customCell(row, key) : formatCell(key, row[key])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function formatCell(key, value) {
  if (key === "salaryMin" || key === "salaryMax" || key === "averageSalary") return value == null ? "—" : esc(money(value));
  if (key === "appliedAt" || key === "postedAt" || key === "scheduledAt") return esc(dateText(value));
  if (key === "applicationCount" || key === "jobCount") return esc(Number(value || 0).toLocaleString("en-IN"));
  if (key === "status") return `<span class="status-pill ${statusClass(value)}">${esc(value)}</span>`;
  return esc(value ?? "—");
}

function renderJobs() {
  const query = (document.getElementById("job-search")?.value || "").trim().toLowerCase();
  const filter = document.getElementById("job-filter")?.value || "All";
  const jobs = appState.jobs.filter((job) => (filter === "All" || job.status === filter)
    && [job.title, job.companyName, job.location, job.requiredSkills].some((value) => String(value || "").toLowerCase().includes(query)));
  const renderCard = (job, isMatch = false) => `
    <article class="job-card"><div class="job-card-top"><span class="company-mark">${esc(initials(job.companyName))}</span><div class="job-heading"><strong>${esc(job.title)}</strong><span>${esc(job.companyName)}</span></div><span class="status-pill ${statusClass(job.status)}">${esc(job.status)}</span></div>
    <p class="job-description">${esc(job.description || "An opportunity to do meaningful work with a great team.")}</p>
    <div class="job-meta"><span>⌖ ${esc(job.location)}</span><span>${Number(job.minExperience)}+ yrs experience</span><span>${esc(job.employmentType || "Full-time")}</span></div>
    <div class="skill-list">${String(job.requiredSkills || "").split(/[,;|]/).map((skill) => skill.trim()).filter(Boolean).slice(0, 5).map((skill) => `<span class="skill-chip">${esc(skill)}</span>`).join("")}</div>
    <div class="job-card-bottom"><span class="salary">${esc(money(job.salaryMin))} – ${esc(money(job.salaryMax))}<small> / year</small></span>
    <div class="job-actions">${isMatch ? `<span class="match-pill">${Number(job.matchPercent)}% match</span>` : ""}
      ${job.status === "Open" ? `<button class="small-action" data-apply-job="${Number(job.jobId)}">Apply</button>` : ""}
      ${!isMatch ? `<button class="small-action" data-toggle-job="${Number(job.jobId)}">${job.status === "Open" ? "Close" : "Reopen"}</button><button class="small-action danger" data-delete-job="${Number(job.jobId)}">Delete</button>` : ""}
    </div></div></article>`;
  const target = document.getElementById("jobs-list");
  if (target) target.innerHTML = jobs.map((job) => renderCard(job)).join("") || '<div class="table-empty">No jobs match this search.</div>';
  return renderCard;
}

function renderCandidates() {
  const target = document.getElementById("candidates-table");
  if (!target) return;
  const query = (document.getElementById("candidate-search")?.value || "").trim().toLowerCase();
  const candidates = appState.candidates.filter((candidate) =>
    [candidate.fullName, candidate.email, candidate.skills, candidate.location].some((value) => String(value || "").toLowerCase().includes(query)));
  document.getElementById("candidate-count").textContent = `${candidates.length} ${candidates.length === 1 ? "candidate" : "candidates"}`;
  target.innerHTML = table(
    [["fullName", "Candidate"], ["skills", "Skills"], ["experienceYears", "Experience"], ["location", "Location"], ["email", "Email"], ["actions", ""]],
    candidates,
    (row, key) => {
      if (key === "fullName") return `<span class="candidate-name"><span class="candidate-mini">${esc(initials(row.fullName))}</span><strong>${esc(row.fullName)}</strong></span>`;
      if (key === "skills") return esc(row.skills);
      if (key === "experienceYears") return `${Number(row.experienceYears)} yrs`;
      if (key === "location") return esc(row.location);
      if (key === "email") return esc(row.email);
      return `<button class="small-action danger" data-delete-candidate="${Number(row.candidateId)}">Remove</button>`;
    },
  );
}

function renderCompanies() {
  const target = document.getElementById("companies-table");
  if (!target) return;
  target.innerHTML = table(
    [["companyName", "Company"], ["industry", "Industry"], ["location", "Location"], ["website", "Website"], ["jobs", "Open roles"], ["actions", ""]],
    appState.companies,
    (row, key) => {
      if (key === "companyName") return `<span class="candidate-name"><span class="company-mark">${esc(initials(row.companyName))}</span><strong>${esc(row.companyName)}</strong></span>`;
      if (key === "website") return row.website ? `<a class="company-link" href="${esc(row.website)}" target="_blank" rel="noopener noreferrer">${esc(row.website.replace(/^https?:\/\//, ""))} ↗</a>` : "—";
      if (key === "jobs") return appState.jobs.filter((job) => job.companyId === row.companyId && job.status === "Open").length;
      if (key === "actions") return `<button class="small-action danger" data-delete-company="${Number(row.companyId)}">Remove</button>`;
      return esc(row[key] ?? "—");
    },
  );
}

function renderApplications() {
  const target = document.getElementById("applications-table");
  if (!target) return;
  const query = (document.getElementById("application-search")?.value || "").trim().toLowerCase();
  const filter = document.getElementById("application-filter")?.value || "All";
  const applications = appState.applications.filter((application) => (filter === "All" || application.status === filter)
    && [application.candidateName, application.jobTitle, application.companyName].some((value) => String(value || "").toLowerCase().includes(query)));
  target.innerHTML = table(
    [["candidateName", "Candidate"], ["jobTitle", "Position"], ["companyName", "Company"], ["appliedAt", "Applied"], ["status", "Status"], ["actions", "Update"]],
    applications,
    (row, key) => {
      if (key === "candidateName") return `<span class="candidate-name"><span class="candidate-mini">${esc(initials(row.candidateName))}</span><strong>${esc(row.candidateName)}</strong></span>`;
      if (key === "status") return `<span class="status-pill ${statusClass(row.status)}">${esc(row.status)}</span>`;
      if (key === "appliedAt") return esc(dateText(row.appliedAt));
      if (key === "actions") return `<select class="filter-select" data-status-application="${Number(row.applicationId)}" aria-label="Update ${esc(row.candidateName)} application">${["Submitted", "Under Review", "Interview", "Selected", "Rejected"].map((status) => `<option ${status === row.status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
      return esc(row[key] ?? "—");
    },
  );
}

function renderInterviews() {
  const target = document.getElementById("interviews-list");
  if (!target) return;
  const interviews = [...appState.interviews].sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)));
  target.innerHTML = interviews.map((interview) => {
    const date = new Date(interview.scheduledAt);
    const datePart = Number.isNaN(date.getTime()) ? { day: "—", month: "" } : { day: date.toLocaleDateString("en-IN", { day: "numeric" }), month: date.toLocaleDateString("en-IN", { month: "short" }) };
    const when = Number.isNaN(date.getTime()) ? esc(interview.scheduledAt) : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    return `<article class="interview-card"><div class="date-tile"><strong>${datePart.day}</strong><span>${esc(datePart.month)}</span></div><div class="interview-info"><h3>${esc(interview.candidateName || "Candidate")}</h3><p>${esc(interview.jobTitle || "Application")} · ${esc(interview.interviewType)} · ${when}</p><span class="status-pill ${statusClass(interview.result)}">${esc(interview.result)}</span>${interview.meetingLink ? ` <a href="${esc(interview.meetingLink)}" target="_blank" rel="noopener noreferrer">Join meeting ↗</a>` : ""}<div class="job-actions interview-actions"><select class="filter-select" data-status-interview="${Number(interview.interviewId)}" aria-label="Update interview result"><option ${interview.result === "Scheduled" ? "selected" : ""}>Scheduled</option><option ${interview.result === "Completed" ? "selected" : ""}>Completed</option><option ${interview.result === "Cancelled" ? "selected" : ""}>Cancelled</option></select><button class="small-action danger" data-delete-interview="${Number(interview.interviewId)}">Remove</button></div></div></article>`;
  }).join("") || '<div class="table-empty">No interviews on the calendar. Your next great conversation is waiting.</div>';
}

function populateFormOptions() {
  const companySelect = document.getElementById("job-company-select");
  companySelect.innerHTML = appState.companies.map((company) => `<option value="${Number(company.companyId)}">${esc(company.companyName)}</option>`).join("");
  const candidateSelect = document.getElementById("application-candidate-select");
  candidateSelect.innerHTML = appState.candidates.map((candidate) => `<option value="${Number(candidate.candidateId)}">${esc(candidate.fullName)}</option>`).join("");
  const jobSelect = document.getElementById("application-job-select");
  jobSelect.innerHTML = appState.jobs.filter((job) => job.status === "Open").map((job) => `<option value="${Number(job.jobId)}">${esc(job.title)} — ${esc(job.companyName)}</option>`).join("");
  const applicationSelect = document.getElementById("interview-application-select");
  applicationSelect.innerHTML = appState.applications.map((application) => `<option value="${Number(application.applicationId)}">${esc(application.candidateName)} — ${esc(application.jobTitle)}</option>`).join("");
}

async function renderReport(type) {
  appState.reportType = type;
  document.querySelectorAll(".report-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.report === type));
  const response = await api(`/api/reports/${encodeURIComponent(type)}`);
  document.getElementById("report-title").textContent = response.title;
  document.getElementById("report-table").innerHTML = table(reportColumns[type], response.rows);
}

async function loadDashboard() {
  appState.dashboard = await api("/api/dashboard");
  renderOverview();
}

async function switchView(view) {
  if (!viewNames[view]) return;
  document.querySelectorAll(".view").forEach((element) => element.classList.toggle("active", element.id === `view-${view}`));
  document.querySelectorAll(".nav-link").forEach((element) => element.classList.toggle("active", element.dataset.view === view));
  document.getElementById("breadcrumb-current").textContent = viewNames[view];
  if (view === "overview") await loadDashboard();
  if (view === "reports") await renderReport(appState.reportType);
}

function showDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  if (id === "application-dialog" && !appState.candidates.length) return showToast("Add a candidate before creating an application.", true);
  if (id === "application-dialog" && !appState.jobs.some((job) => job.status === "Open")) return showToast("Post an open job before creating an application.", true);
  if (id === "interview-dialog" && !appState.applications.length) return showToast("Add an application before scheduling an interview.", true);
  dialog.showModal();
}

async function submitForm(form, endpoint, transform = (data) => data, successMessage = "Saved successfully.") {
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    const data = Object.fromEntries(new FormData(form));
    await api(endpoint, { method: "POST", body: JSON.stringify(transform(data)) });
    form.closest("dialog").close();
    form.reset();
    await refreshData();
    await loadDashboard();
    showToast(successMessage);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;
  if (target.dataset.view) return switchView(target.dataset.view);
  if (target.dataset.navigate) return switchView(target.dataset.navigate);
  if (target.dataset.openDialog) return showDialog(target.dataset.openDialog);
  if (target.hasAttribute("data-close-dialog")) return target.closest("dialog").close();
  if (target.dataset.report) {
    try { await renderReport(target.dataset.report); } catch (error) { showToast(error.message, true); }
  }
  if (target.dataset.deleteCandidate) {
    if (!window.confirm("Remove this candidate and their applications?")) return;
    try {
      await api(`/api/candidates/${target.dataset.deleteCandidate}`, { method: "DELETE" });
      await refreshData(); await loadDashboard(); showToast("Candidate removed.");
    } catch (error) { showToast(error.message, true); }
  }
  if (target.dataset.deleteJob) {
    if (!window.confirm("Remove this job and its applications?")) return;
    try {
      await api(`/api/jobs/${target.dataset.deleteJob}`, { method: "DELETE" });
      await refreshData(); await loadDashboard(); showToast("Job removed.");
    } catch (error) { showToast(error.message, true); }
  }
  if (target.dataset.toggleJob) {
    const job = appState.jobs.find((item) => item.jobId === Number(target.dataset.toggleJob));
    if (!job) return;
    try {
      await api(`/api/jobs/${job.jobId}`, { method: "PATCH", body: JSON.stringify({ status: job.status === "Open" ? "Closed" : "Open" }) });
      await refreshData(); await loadDashboard(); showToast(`Job ${job.status === "Open" ? "closed" : "reopened"}.`);
    } catch (error) { showToast(error.message, true); }
  }
  if (target.dataset.applyJob) {
    const jobId = Number(target.dataset.applyJob);
    if (!appState.candidates.length) return showToast("Add a candidate before applying to a job.", true);
    document.getElementById("application-job-select").value = String(jobId);
    showDialog("application-dialog");
  }
  if (target.dataset.deleteCompany) {
    if (!window.confirm("Remove this company? Companies with job listings cannot be removed.")) return;
    try {
      await api(`/api/companies/${target.dataset.deleteCompany}`, { method: "DELETE" });
      await refreshData(); await loadDashboard(); showToast("Company removed.");
    } catch (error) { showToast(error.message, true); }
  }
  if (target.dataset.deleteInterview) {
    if (!window.confirm("Remove this interview from the schedule?")) return;
    try {
      await api(`/api/interviews/${target.dataset.deleteInterview}`, { method: "DELETE" });
      await refreshData(); showToast("Interview removed.");
    } catch (error) { showToast(error.message, true); }
  }
});

document.getElementById("company-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, "/api/companies", undefined, "Company added to your workspace.");
});
document.getElementById("candidate-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, "/api/candidates", (data) => ({ ...data, experienceYears: Number(data.experienceYears) }), "Candidate added to your network.");
});
document.getElementById("job-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, "/api/jobs", (data) => ({
    ...data, companyId: Number(data.companyId), minExperience: Number(data.minExperience),
    salaryMin: Number(data.salaryMin), salaryMax: Number(data.salaryMax),
  }), "Your job is live.");
});
document.getElementById("application-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, "/api/applications", (data) => ({ ...data, candidateId: Number(data.candidateId), jobId: Number(data.jobId) }), "Application added.");
});
document.getElementById("interview-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, "/api/interviews", (data) => ({ ...data, applicationId: Number(data.applicationId) }), "Interview scheduled.");
});
document.getElementById("recommendation-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const params = new URLSearchParams({ skills: data.skills, experience: data.experience, location: data.location });
  const results = document.getElementById("recommendation-results");
  results.innerHTML = '<div class="table-empty">Finding your best matches…</div>';
  try {
    const matches = await api(`/api/recommendations?${params}`);
    const renderCard = renderJobs();
    results.innerHTML = matches.map((job) => renderCard(job, true)).join("") || '<div class="table-empty">No close matches yet. Try adding another skill or widening your location.</div>';
    document.getElementById("match-summary").textContent = `${matches.length} ${matches.length === 1 ? "opportunity" : "opportunities"} that fit what matters to you.`;
  } catch (error) {
    results.innerHTML = "";
    showToast(error.message, true);
  }
});
document.getElementById("job-search").addEventListener("input", renderJobs);
document.getElementById("job-filter").addEventListener("change", renderJobs);
document.getElementById("candidate-search").addEventListener("input", renderCandidates);
document.getElementById("application-search").addEventListener("input", renderApplications);
document.getElementById("application-filter").addEventListener("change", renderApplications);
document.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-status-application]");
  const interviewSelect = event.target.closest("[data-status-interview]");
  if (select) {
    try {
      await api(`/api/applications/${select.dataset.statusApplication}`, { method: "PATCH", body: JSON.stringify({ status: select.value }) });
      await refreshData(); await loadDashboard(); showToast("Application status updated.");
    } catch (error) { showToast(error.message, true); }
  }
  if (interviewSelect) {
    try {
      await api(`/api/interviews/${interviewSelect.dataset.statusInterview}`, { method: "PATCH", body: JSON.stringify({ result: interviewSelect.value }) });
      await refreshData(); showToast("Interview updated.");
    } catch (error) { showToast(error.message, true); }
  }
});

document.getElementById("today-label").textContent = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase();
async function startApp() {
  try {
    const health = await api("/api/health");
    document.getElementById("mode-label").textContent = health.mode === "mysql" ? "MySQL connected" : "Interactive demo";
    document.querySelector(".live-indicator i").style.background = health.mode === "mysql" ? "#69a17c" : "#c3a865";
    await refreshData();
    await loadDashboard();
    const recommendationForm = document.getElementById("recommendation-form");
    recommendationForm.requestSubmit();
  } catch (error) {
    document.getElementById("mode-label").textContent = "Connection issue";
    showToast(error.message, true);
  }
}
startApp();
