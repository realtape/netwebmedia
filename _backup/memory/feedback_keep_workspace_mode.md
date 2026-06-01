---
name: Keep Claude Code Workspace mode on — fix VM Platform instead
description: When Claude Code's Workspace/VM dialog errors, Carlos wants the underlying Windows feature fixed, not Workspace mode disabled
type: feedback
originSessionId: 343ec516-033b-4499-9d5f-5b2871e33edf
---
When Claude Code shows the "Virtualization is not available / Workspace requires Virtual Machine Platform" dialog (or similar VM/sandbox errors), do NOT propose disabling Workspace mode as the fix. Carlos wants Workspace mode kept on.

**Why:** Asked 2026-05-14 when the dialog appeared on Computer 1 (Windows 11 Pro). Carlos picked "Enable Virtual Machine Platform" over "Disable Workspace mode" — he wants the VM isolation, not to turn the feature off to make a dialog go away.

**How to apply:** Default to the enable-VM-Platform path: `Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart` + `HypervisorPlatform` + `bcdedit /set hypervisorlaunchtype auto` + reboot. If BIOS virtualization is off, walk him through enabling Intel VT-x / AMD-V in UEFI. Only suggest disabling Workspace mode if he explicitly asks for the quick-dismiss path.
