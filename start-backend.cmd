@echo off
setlocal

cd /d "%~dp0backend"
npm.cmd run dev

endlocal
