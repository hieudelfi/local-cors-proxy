' Launches the CORS proxy without showing a CMD window.
' Used by the Windows Task Scheduler startup task.
' To check if it's running: open Task Manager > Details > look for node.exe

Dim scriptDir
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

Dim cmd
cmd = "node """ & scriptDir & "\server.js"""

CreateObject("WScript.Shell").Run cmd, 0, False
