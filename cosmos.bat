
@echo off

if ("%1"=="") (
  GOTO usage
)

if "%1" == "start" (
  GOTO startup
)

if "%1" == "stop" (
  GOTO stop
)

if "%1" == "build" (
  GOTO build
)

if "%1" == "cleanup" (
  GOTO cleanup
)

if "%1" == "setup" (
  GOTO setup
)

GOTO usage

:setup
  scripts/windows/cosmos_setup
GOTO :EOF

:deploy
  scripts/windows/cosmos_deploy
GOTO :EOF

:cleanup
  scripts/windows/cosmos_cleanup
GOTO :EOF

:build
  scripts/windows/cosmos_build
GOTO :EOF

:stop
  scripts/windows/cosmos_stop
GOTO :EOF

:startup
  scripts/windows/cosmos_minimal_start
GOTO :EOF

:usage
  @echo Usage: %0 [start, stop, build, cleanup, deploy, setup] 1>&2

@echo on