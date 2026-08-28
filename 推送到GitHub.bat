@echo off
chcp 65001 >nul
title 推送到 GitHub

echo ==========================================
echo    祈愿模拟器 - GitHub 推送工具
echo ==========================================
echo.

cd /d "%~dp0"

echo 当前目录: %cd%
echo.

set /p USERNAME=GitHub 用户名: 
echo.
echo 请输入 GitHub Personal Access Token
echo （创建方式: github.com/settings/tokens -> Generate new token -> 勾选 repo 权限）
echo.
set /p TOKEN=Token: 
echo.
set /p REPO=仓库名（如 gacha-sim）: 
echo.

echo 正在推送，请稍候...
git remote remove origin 2>nul
git remote add origin https://%USERNAME%:%TOKEN%@github.com/%USERNAME%/%REPO%.git
git push -u origin main

if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ 推送成功！
    echo 仓库地址: https://github.com/%USERNAME%/%REPO%
) else (
    echo.
    echo ❌ 推送失败，请检查：
    echo    1. Token 是否有 repo 权限
    echo    2. 仓库名是否正确
    echo    3. 网络连接是否正常
)

echo.
pause
