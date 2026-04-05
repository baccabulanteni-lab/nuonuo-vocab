# 在电脑上运行: npm run tablet:url
$ErrorActionPreference = 'SilentlyContinue'
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -ExpandProperty IPAddress -Unique

Write-Host ""
Write-Host "=== 糯糯背单词 · 平板访问地址 ===" -ForegroundColor Cyan
if (-not $ips) {
    Write-Host "未检测到局域网 IP，请手动查看 WLAN IPv4。" -ForegroundColor Yellow
} else {
    foreach ($ip in $ips) {
        Write-Host "  http://$($ip):3001" -ForegroundColor Green
    }
}
Write-Host ""
