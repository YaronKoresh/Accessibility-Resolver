@echo off

cd %~dp0..

call npm run check

pause
exit /B 0