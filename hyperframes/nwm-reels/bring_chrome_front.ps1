Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

$procs = Get-Process -Name chrome -ErrorAction SilentlyContinue
foreach ($p in $procs) {
    if ($p.MainWindowHandle -ne 0) {
        Write-Host "Chrome window: '$($p.MainWindowTitle)' HWND=$($p.MainWindowHandle)"
    }
}

# Find the YouTube Studio upload window
$targetHwnd = $null
foreach ($p in $procs) {
    if ($p.MainWindowTitle -like "*Channel content*YouTube Studio*") {
        $targetHwnd = $p.MainWindowHandle
        Write-Host "TARGET: $($p.MainWindowTitle) HWND=$targetHwnd"
        break
    }
}

if ($targetHwnd -and $targetHwnd -ne [IntPtr]::Zero) {
    [Win32]::ShowWindow($targetHwnd, 9) | Out-Null
    Start-Sleep -Milliseconds 200
    [Win32]::SetForegroundWindow($targetHwnd) | Out-Null
    Write-Host "Brought to front: $targetHwnd"
} else {
    Write-Host "No target found"
}
