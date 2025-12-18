@echo off
echo Starting TeachAI Backend Server...
echo Firebase Storage Location: gs://try1-7d848.firebasestorage.app/TeachAI/

cd /d "c:\Users\X711046\OneDrive - Nissan Motor Corporation\Desktop\New folder (4)\HTML\teachAI\backend"

echo Current directory: %CD%
echo.

node server.js

pause
