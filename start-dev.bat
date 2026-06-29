@echo off
title Best American CRM - Next.js dev
cd /d "%~dp0"
echo Starting Next.js at http://localhost:3000 ...
echo Press Ctrl+C to stop the server.
echo.
npm run dev
if errorlevel 1 pause
