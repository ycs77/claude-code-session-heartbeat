@echo off
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ClaudeCodeSessionHeartbeat" /f
echo.
echo Claude Code Session Heartbeat uninstalled successfully!
pause
