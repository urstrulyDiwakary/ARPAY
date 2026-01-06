@echo off
REM ARPAY Admin Panel - Single Port Development
REM Everything runs on Port 8080

echo ================================================
echo    ARPAY Admin Panel - Starting on Port 8080
echo ================================================
echo.

REM Check if port 8080 is available
netstat -ano | findstr :8080 > nul
if %errorlevel% equ 0 (
    echo [ERROR] Port 8080 is already in use!
    echo Please close the application using this port and try again.
    echo.
    echo To find what's using port 8080:
    echo   netstat -ano ^| findstr :8080
    echo.
    echo To kill the process:
    echo   taskkill /F /PID ^<PID_NUMBER^>
    echo.
    pause
    exit /b 1
)

echo [INFO] Port 8080 is available
echo.
echo [STEP 1/3] Building Frontend...
echo.

call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Frontend built successfully!
echo.
echo [STEP 2/3] Compiling Backend...
echo.

cd backend
call mvn clean compile
if %errorlevel% neq 0 (
    echo [ERROR] Backend compilation failed!
    cd ..
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Backend compiled successfully!
echo.
echo [STEP 3/3] Starting Application on Port 8080...
echo.
echo ================================================
echo    Application will be available at:
echo    http://localhost:8080
echo ================================================
echo.
echo Press Ctrl+C to stop the server
echo.

call mvn spring-boot:run

cd ..

