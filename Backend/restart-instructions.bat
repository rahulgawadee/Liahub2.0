@echo off
echo ========================================
echo   Backend Server Restart Script
echo ========================================
echo.

echo Current directory: %CD%
echo.

echo Files modified and ready to load:
echo   - uploadRoutes.js (NEW upload endpoint)
echo   - JobApplication.js (schema with 'selected')
echo   - index.js (upload route registered)
echo   - jobController.js (updated validation)
echo.

echo ========================================
echo   INSTRUCTIONS
echo ========================================
echo.
echo 1. Go to your Backend terminal (the one showing server logs)
echo 2. Press Ctrl+C to stop the server
echo 3. Run: npm run dev
echo 4. Wait for: "Server listening on port 5000"
echo.

echo After restart:
echo   - Upload endpoint will be at: <your-server-origin>/api/v1/upload (e.g. http://localhost:5000/api/v1/upload locally)
echo   - Accept/Reject will work without errors
echo   - PDF upload will work
echo.

echo ========================================
echo   VERIFICATION
echo ========================================
echo.
echo After restart, try these:
echo   1. Company: Accept applicant (should show 'Selected')
echo   2. Company: Upload PDF (should succeed)
echo   3. Company: Send offer (should work)
echo   4. Student: View offer (should see PDF download)
echo.

pause
