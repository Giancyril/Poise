Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Running Backend Pytest Suite..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Push-Location backend
.\venv\Scripts\pytest -v
$backendExit = $LASTEXITCODE
Pop-Location

if ($backendExit -ne 0) {
    Write-Host "`nBackend tests failed with exit code $backendExit" -ForegroundColor Red
    exit $backendExit
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Running Frontend Vitest Suite..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Push-Location frontend
npm test
$frontendExit = $LASTEXITCODE
Pop-Location

if ($frontendExit -ne 0) {
    Write-Host "`nFrontend tests failed with exit code $frontendExit" -ForegroundColor Red
    exit $frontendExit
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " All Full-Stack Tests Passed Successfully! " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
