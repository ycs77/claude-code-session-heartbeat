@echo off
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ClaudeCodeSessionHeartbeat" /t REG_SZ /d "wscript.exe \"%~dp0start.vbs\" \"%~dp0ping.js\"" /f
echo.
echo Claude Code Session Heartbeat installed successfully!
pause
