@echo off
title D-TECH BEAUTY VISION — Clean Release Pipeline
echo ============================================================
echo D-TECH BEAUTY VISION — RELEASE BUILD SYSTEM
echo ============================================================
echo.
echo [1/5] Cleaning old build directories...
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release
echo Done.
echo.
echo [2/5] Running Vitest unit test suite...
call npm run test
if %errorlevel% neq 0 (
    echo [ERROR] Unit tests failed! Aborting release.
    pause
    exit /b %errorlevel%
)
echo.
echo [3/5] Executing Zero-Trust Security Audit...
call npm run security:audit
if %errorlevel% neq 0 (
    echo [ERROR] Security audit failed! Aborting release.
    pause
    exit /b %errorlevel%
)
echo.
echo [4/5] Compiling production build...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Production compilation failed! Aborting release.
    pause
    exit /b %errorlevel%
)
echo.
echo [5/5] Packaging self-contained Electron offline installer...
call npx electron-builder
if %errorlevel% neq 0 (
    echo [ERROR] Installer packaging failed! Aborting release.
    pause
    exit /b %errorlevel%
)
echo.
echo ============================================================
echo BUILD COMPLETE: D-Tech Beauty Vision installer created successfully!
echo Installer path: release\D-Tech Beauty Vision Setup 0.1.0.exe
echo ============================================================
pause
