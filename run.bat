@echo off
setlocal
set browserpath="C:\Program Files\Mozilla Firefox\"
set browser=firefox.exe
set browserargs="--new-tab http://localhost:4444"

set pycommand="python -m http.server -d %cd% --bind 0.0.0.0 4444"

powershell .\build.ps1
set ReturnValue=
set ProcessId=
for /f "eol=} skip=5 tokens=1,2 delims=;= " %%a in ('wmic process call create %pycommand% ') do (
    set "%%a=%%b"
)
echo %ReturnValue%
echo %ProcessId%

pushd %browserpath%
%browser% %browserargs%
popd
pause > NUL
taskkill /PID %ProcessId%
endlocal