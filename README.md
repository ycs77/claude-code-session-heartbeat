# Claude Code Session Heartbeat

`ping.js` 是一個常駐心跳腳本，登入時透過工作排程器啟動後持續在背景運行，每 1 分鐘檢查一次心跳狀態。若距離上次心跳超過 5 小時，則執行 `claude -p "Say hi"` 以延續 Claude Code Session。

## 安裝

請先安裝 Node.js 24，然後 clone 此儲存庫：

```bash
cd ~
git clone https://github.com/ycs77/claude-code-session-heartbeat.git .claude-code-session-heartbeat
cd .claude-code-session-heartbeat
```

## 設定工作排程器

設定工作排程器，讓使用者登入時自動啟動 `ping.js` 常駐腳本。需要以系統管理員身分執行 PowerShell (將 `[user]` 替換為你的 Windows 使用者名稱)。

建立工作排程器任務：

```ps1
Register-ScheduledTask -TaskName "PingClaudeCodeSessionHeartbeat" -Action (New-ScheduledTaskAction -Execute "powershell" -Argument "-WindowStyle Hidden -Command `"& 'C:\Program Files\nodejs\node.exe' 'C:\Users\[user]\.claude-code-session-heartbeat\ping.js'`"") -Trigger (New-ScheduledTaskTrigger -AtLogOn) -Settings (New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries) -RunLevel Limited
```

## 解除安裝

1. 刪除 `C:\Users\[user]\.claude-code-session-heartbeat` 目錄
2. 使用 PowerShell 刪除工作排程器任務：`Unregister-ScheduledTask -TaskName "PingClaudeCodeSessionHeartbeat" -Confirm:$false`

## 授權

[MIT License](LICENSE.md)
