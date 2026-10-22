@echo off

cd %~dp0..

call npm run autobot:preview

pause
exit /B 0