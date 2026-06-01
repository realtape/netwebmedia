---
name: claude-workspace-fix
description: "One-click recovery script for \"Failed to start Claude's workspace - VM service not running\" error on Computer 1"
metadata: 
  node_type: memory
  type: reference
  originSessionId: da6317c3-fab4-42cf-af79-82080dae8b22
---

**Symptom**: Claude desktop app shows dialog "Failed to start Claude's workspace — VM service not running. The service failed to start."

**Root cause**: The MSIX-packaged Windows service `CoworkVMService` (display name "Claude") owns the Hyper-V VM that runs Workspace. After idle timeout it stops cleanly; the app gives up after one retry, leaving you stuck on `\\.\pipe\cowork-vm-service` ENOENT.

**Permanent fix already applied (2026-05-28)**: Added a named-pipe trigger so SCM lazy-starts the service when Claude opens the pipe. Visible via `sc qtriggerinfo CoworkVMService` — UUID `1f81d131-3e60-4c76-9860-37334e4ffce3` is Windows' Named Pipe Event Provider. `sc failure` / `sc failureflag` were rejected by the MSIX DACL (Access is denied) and cannot be set without re-signing the package; the trigger covers the real-world failure mode anyway.

**Nuke button** (if it ever breaks again):
- Double-click `D:\Documents\system-utils\fix-claude-workspace.cmd`
- Self-elevates via UAC, stops the service, truncates `C:\ProgramData\Claude\Logs\cowork-service.log` if >50 MB, restarts the service, shows final status.

**Logs to check when debugging**:
- App-side: `C:\Users\Usuario\AppData\Roaming\Claude\logs\cowork_vm_node.log` (look for `connect ENOENT \\.\pipe\cowork-vm-service`)
- Service-side: `C:\ProgramData\Claude\Logs\cowork-service.log` (Hyper-V HCS calls, VM lifecycle)
- Service binary: `C:\Program Files\WindowsApps\Claude_*\app\resources\cowork-svc.exe`

Related: [[user_computers]] (Computer 1 = this Windows machine)
