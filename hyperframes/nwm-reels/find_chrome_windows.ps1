Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;

public class WinAPI {
    public delegate bool EnumWindowsProc(IntPtr hwnd, IntPtr lParam);

    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hwnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint lpdwProcessId);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hwnd, int nCmdShow);
}
"@

$chromeProcs = Get-Process -Name chrome | Select-Object -ExpandProperty Id
$found = @()

$callback = [WinAPI+EnumWindowsProc]{
    param([IntPtr]$hwnd, [IntPtr]$lParam)
    if ([WinAPI]::IsWindowVisible($hwnd)) {
        $sb = New-Object System.Text.StringBuilder(512)
        [WinAPI]::GetWindowText($hwnd, $sb, 512) | Out-Null
        $title = $sb.ToString()
        if ($title -ne "") {
            $pid = [uint32]0
            [WinAPI]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
            if ($chromeProcs -contains [int]$pid) {
                Write-Host "HWND=$hwnd PID=$pid TITLE='$title'"
                if ($title -like "*YouTube Studio*" -or $title -like "*Upload*") {
                    Write-Host "  *** YOUTUBE STUDIO WINDOW ***"
                }
            }
        }
    }
    return $true
}

[WinAPI]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
