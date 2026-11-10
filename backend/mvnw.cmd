@echo off
setlocal
set "MAVEN_EXE=C:\Users\PAVAN\.m2\wrapper\dists\apache-maven-3.9.6-bin\439sdfsg2nbdob9ciift5h5nse\apache-maven-3.9.6\bin\mvn.cmd"
if exist "%MAVEN_EXE%" (
    call "%MAVEN_EXE%" %*
) else (
    mvn %*
)
