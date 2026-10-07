# TalentFlow — Job Portal Management System

A MySQL-backed job portal with candidate, company, job, application, and interview management; profile-based job recommendations; six hiring reports; and a polished local web dashboard.

## Run it locally

**Requirements:** Node.js 20 or newer and npm. MySQL is optional for the first run.

1. Open this project folder in PowerShell.
2. Run `.\run.ps1` (or `powershell -ExecutionPolicy Bypass -File .\run.ps1` if your PowerShell policy blocks local scripts).
3. The launcher installs the Node dependencies if needed, starts the local server, checks that it responds, and opens **http://localhost:3000** in your browser.

With no MySQL connection configured, the portal opens in interactive **demo mode** with sample data. You can add and remove records, update hiring statuses, try recommendations and export a report; demo changes last until the server stops.

## Connect a MySQL database

Install MySQL Server 8.0.16 or newer and create/import the schema in MySQL Workbench, in this order:

1. `sql/01_database.sql`
2. `sql/02_tables.sql`
3. `sql/03_data.sql`
4. `sql/11_views.sql`

The other numbered scripts are runnable examples for coursework; run them when you want to demonstrate that SQL concept. Some examples deliberately insert, update, or delete sample data.

Set the connection settings in the same PowerShell window before launching:

```powershell
$env:MYSQL_HOST = "localhost"
$env:MYSQL_PORT = "3306"
$env:MYSQL_DATABASE = "job_portal"
$env:MYSQL_USER = "root"
$env:MYSQL_PASSWORD = "your-local-mysql-password"
.\run.ps1
```

When all required MySQL settings are present, the server verifies the connection on startup and uses MySQL instead of demo data. A database connection or SQL error is shown rather than silently switching to demo mode. Keep your password in your local environment; do not add it to project files.

## Portal features

- **Overview:** live candidate, company, open-job and application counts; application pipeline; most-applied roles.
- **Jobs and companies:** browse, search, post and remove listings; manage companies; open or close listings.
- **Candidates:** add and search candidate profiles; remove a profile and its applications.
- **Applications:** create applications and update their hiring status.
- **Interviews:** schedule, update, and remove interviews.
- **Job recommendations:** enter skills, experience, and location; matches are ranked by skill overlap, experience eligibility, and location (including remote roles).
- **Reports:** most-applied jobs, companies with the most applications, average salary by company, open jobs, selected candidates, and application-status totals. **Export top jobs** downloads a plain-text report.

## SQL coursework map

| File | Demonstration |
| --- | --- |
| `sql/01_database.sql` | Database creation and selection |
| `sql/02_tables.sql` | Tables, data types, primary/foreign keys, unique/not-null/default constraints, auto-increment |
| `sql/03_data.sql` | Sample companies, candidates, jobs, applications, and interviews |
| `sql/04_crud.sql` | Insert, select, update, delete |
| `sql/05_filtering.sql` | Where, and/or/not, between, in, like, order by, limit |
| `sql/06_functions.sql` | String, numeric, date, and null-handling functions |
| `sql/07_joins.sql` | Inner, left, right, and multi-table joins |
| `sql/08_aggregation.sql` | Group by, having, count, sum, average, minimum, maximum |
| `sql/09_subqueries.sql` | Single- and multi-row subqueries, in, any, all, exists, not exists |
| `sql/10_transactions.sql` | Start transaction, savepoint, commit, rollback |
| `sql/11_views.sql` | Create, query, and use report views |

The transactional examples use InnoDB tables. InnoDB supports the ACID properties: atomicity (a transaction commits or rolls back as a unit), consistency (constraints preserve valid data), isolation (concurrent transactions are isolated), and durability (committed changes persist). The sample script contains both `COMMIT` and `ROLLBACK` examples.

## Project structure

```text
job-portal/
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── sql/
│   ├── 01_database.sql
│   ├── 02_tables.sql
│   ├── 03_data.sql
│   ├── 04_crud.sql
│   ├── 05_filtering.sql
│   ├── 06_functions.sql
│   ├── 07_joins.sql
│   ├── 08_aggregation.sql
│   ├── 09_subqueries.sql
│   ├── 10_transactions.sql
│   └── 11_views.sql
├── demo-data.js
├── package.json
├── README.md
├── run.ps1
└── server.js
```
