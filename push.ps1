# 一键推送到 GitHub
# 运行方式：在 PowerShell 中执行 .\push.ps1

Write-Host "=== GitHub 推送助手 ===" -ForegroundColor Cyan
Write-Host ""

$username = Read-Host "请输入你的 GitHub 用户名"
$token = Read-Host "请输入你的 GitHub Personal Access Token (输入时不显示)" -AsSecureString
$repoName = Read-Host "请输入你想创建的仓库名（例如：gacha-sim）"

# 转换 SecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$remoteUrl = "https://$username`:$plainToken@github.com/$username/$repoName.git"

Write-Host ""
Write-Host "正在推送到 github.com/$username/$repoName ..." -ForegroundColor Yellow

try {
    git remote remove origin 2>$null
    git remote add origin $remoteUrl
    git push -u origin main

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 推送成功！" -ForegroundColor Green
        Write-Host "仓库地址：https://github.com/$username/$repoName" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ 推送失败，可能的原因：" -ForegroundColor Red
        Write-Host "   1. Token 没有 repo 权限" -ForegroundColor Red
        Write-Host "   2. 仓库名已存在但不是你的" -ForegroundColor Red
        Write-Host "   3. 网络问题" -ForegroundColor Red
    }
} catch {
    Write-Host "发生错误：$_" -ForegroundColor Red
} finally {
    # 清理明文 token
    $plainToken = $null
    [System.GC]::Collect()
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
