#Requires AutoHotkey v2.0
LOG := A_ScriptDir . "\test_ahk.log"
FileAppend("hello from ahk v2`n", LOG)
MsgBox("done")
ExitApp
