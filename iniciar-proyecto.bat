@echo off
chcp 65001 >nul
title Turismo Magdalena - Sistema Completo
echo ===================================================================
echo     INICIANDO PROYECTO TURISMO MAGDALENA (BACKEND + FRONTEND)
echo ===================================================================
echo.

echo [1/2] Iniciando Servidor Backend (NestJS en http://localhost:3000)...
start "Turismo BACKEND (Puerto 3000)" cmd /k "cd /d "C:\Users\nvice\Turismo backend" && npm start"

echo [2/2] Iniciando Servidor Frontend (Angular en http://localhost:4200)...
start "Turismo FRONTEND (Puerto 4200)" cmd /k "cd /d "C:\Users\nvice\Turismo front end" && npm start"

echo.
echo Esperando inicializacion de servicios...
timeout /t 6 >nul

echo Abriendo navegador en http://localhost:4200...
start http://localhost:4200

echo.
echo ===================================================================
echo   ESTADO:
echo   - Frontend: http://localhost:4200
echo   - Backend:  http://localhost:3000
echo.
echo   USUARIOS PARA INICIAR SESION:
echo   - Administrador: admin@turismo.magdalena.gov.co / admin2026
echo   - Gestor:        gestor@turismo.magdalena.gov.co / gestor2026
echo.
echo   IMPORTANTE: Manten abiertas las ventanas de consola que se abrieron
echo   mientras uses la aplicacion.
echo ===================================================================
pause
