#!/bin/bash

# ARPAY Admin Panel - Single Port Development
# Everything runs on Port 8080

echo "================================================"
echo "   ARPAY Admin Panel - Starting on Port 8080"
echo "================================================"
echo ""

# Check if port 8080 is available
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "[ERROR] Port 8080 is already in use!"
    echo "Please close the application using this port and try again."
    echo ""
    echo "To find what's using port 8080:"
    echo "  lsof -i :8080"
    echo ""
    echo "To kill the process:"
    echo "  kill -9 <PID>"
    echo ""
    exit 1
fi

echo "[INFO] Port 8080 is available"
echo ""
echo "[STEP 1/3] Building Frontend..."
echo ""

npm run build
if [ $? -ne 0 ]; then
    echo "[ERROR] Frontend build failed!"
    exit 1
fi

echo ""
echo "[SUCCESS] Frontend built successfully!"
echo ""
echo "[STEP 2/3] Compiling Backend..."
echo ""

cd backend
mvn clean compile
if [ $? -ne 0 ]; then
    echo "[ERROR] Backend compilation failed!"
    cd ..
    exit 1
fi

echo ""
echo "[SUCCESS] Backend compiled successfully!"
echo ""
echo "[STEP 3/3] Starting Application on Port 8080..."
echo ""
echo "================================================"
echo "   Application will be available at:"
echo "   http://localhost:8080"
echo "================================================"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

mvn spring-boot:run

cd ..

