$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$port = if ($env:PORT) { [int]$env:PORT } else { 3000 }
$url = "http://localhost:$port"

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    throw "Node.js 20 or newer is required. Install it from https://nodejs.org/ and run this script again."
}

if (-not (Test-Path (Join-Path $projectRoot "node_modules\express"))) {
    $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
    Write-Host "Installing project dependencies..."
    & $npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed. Check the output above and try again." }
}

try {
    $health = Invoke-RestMethod -Uri "$url/api/health" -TimeoutSec 2
    Write-Host "Job Portal is already running in $($health.mode) mode."
    Start-Process $url
    exit 0
} catch {
    # No server is listening yet; start this project's local server below.
}

$stdout = Join-Path $env:TEMP "job-portal-server.log"
$stderr = Join-Path $env:TEMP "job-portal-server-error.log"
$node = (Get-Command node.exe -ErrorAction Stop).Source
$server = Start-Process -FilePath $node -ArgumentList "server.js" -WorkingDirectory $projectRoot `
    -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr

for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 500
    try {
        $health = Invoke-RestMethod -Uri "$url/api/health" -TimeoutSec 2
        Write-Host "Job Portal is running at $url ($($health.mode) mode)."
        Start-Process $url
        exit 0
    } catch {
        $process = Get-Process -Id $server.Id -ErrorAction SilentlyContinue
        if (-not $process) { break }
    }
}

$details = if (Test-Path $stderr) { Get-Content $stderr -Raw } else { "No server log was created." }
throw "The Job Portal did not start on port $port. $details"
