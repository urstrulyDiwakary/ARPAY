@echo off
REM Quick Start Script for ARPAY Application
REM This script runs the complete application (Frontend + Backend)

echo ======================================
echo   ARPAY Application - Quick Start
echo ======================================
echo.

cd backend

echo Building and starting application...
echo This may take 2-3 minutes on first run.
echo.

mvn clean spring-boot:run

pause

