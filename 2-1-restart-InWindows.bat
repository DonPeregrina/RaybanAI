@echo off
setlocal enabledelayedexpansion

:: Colores para mensajes (usando caracteres de escape ANSI si está habilitado)
set "GREEN=[92m"
set "BLUE=[94m"
set "RED=[91m"
set "NC=[0m"

:: Funciones para imprimir mensajes
call :print_message "🔄 Reiniciando servidor RaybanAI..."

:: Encontrar y terminar cualquier proceso usando el puerto 3103
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3103 ^| findstr LISTENING') do (
    set PID=%%a
    if not "!PID!"=="" (
        call :print_message "Proceso !PID! encontrado usando puerto 3103. Terminando..."
        taskkill /F /PID !PID!
        timeout /t 1 /nobreak > nul
        call :print_success "Proceso terminado"
    ) else (
        call :print_message "No hay procesos usando el puerto 3103"
    )
)

:: Asegurarse de estar en el directorio correcto
cd /d "%~dp0"
call :print_message "Directorio de trabajo: %cd%"

:: Iniciar servidor
call :print_message "Iniciando servidor RaybanAI..."
cd backend && npm start
goto :eof

:print_message
echo %BLUE%[RaybanAI]%NC% %~1
goto :eof

:print_success
echo %GREEN%[✓] %~1%NC%
goto :eof

:print_error
echo %RED%[✗] %~1%NC%
goto :eof

:eof
endlocal