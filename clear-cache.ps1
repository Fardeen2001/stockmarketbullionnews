# Clear Next.js Cache Script
Write-Host "Stopping any running Next.js processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Clearing Next.js build cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ .next directory removed" -ForegroundColor Green
} else {
    Write-Host "✓ No .next directory found" -ForegroundColor Green
}

Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "`n✓ Cache cleared successfully!" -ForegroundColor Green
Write-Host "Now run: npm run dev" -ForegroundColor Cyan
