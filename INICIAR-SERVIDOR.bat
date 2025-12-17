@echo off
echo ========================================
echo   FinanceFlow - Servidor Local
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Baixe e instale o Node.js em:
    echo   https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo OK - Node.js encontrado
echo.

echo Iniciando servidor local na porta 8000...
echo.
echo ========================================
echo   Servidor iniciado!
echo ========================================
echo.
echo Abra seu navegador e acesse:
echo   http://localhost:8000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

node servidor-local.js

