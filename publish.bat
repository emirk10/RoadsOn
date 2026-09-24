@echo off
chcp 65001 >nul
echo ========================================================
echo   ROADS-ON .NET 8 YAYINLAMA VE PAKETLEME ARACI
echo ========================================================
echo.

set PUBLISH_DIR=.\publish

echo [1/3] Eski publish klasoru temizleniyor...
if exist "%PUBLISH_DIR%" (
    rmdir /s /q "%PUBLISH_DIR%"
)

echo [2/3] .NET 8 Release derlemesi ve yayin paketi hazirlaniyor...
dotnet publish -c Release -o "%PUBLISH_DIR%"
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Derleme veya paketleme sirasinda bir hata olustu!
    pause
    exit /b %errorlevel%
)

echo [3/3] Veritabani ve statik dosyalar kontrol ediliyor...
if not exist "%PUBLISH_DIR%\data" (
    mkdir "%PUBLISH_DIR%\data"
)
if exist ".\data\roadson.db" (
    if not exist "%PUBLISH_DIR%\data\roadson.db" (
        copy ".\data\roadson.db" "%PUBLISH_DIR%\data\roadson.db" >nul
        echo [BILGI] Mevcut roadson.db veritabani pakete dahil edildi.
    )
)
if exist "README_CANLIYA_ALMA.md" (
    copy "README_CANLIYA_ALMA.md" "%PUBLISH_DIR%\README_CANLIYA_ALMA.txt" >nul
    echo [BILGI] Canliya alma rehberi (README_CANLIYA_ALMA.txt) pakete eklendi.
)

echo.
echo ========================================================
echo   TEBRIKLER! Yayin paketi basariyla olusturuldu.
echo   Konum: %PUBLISH_DIR%
echo ========================================================
echo.
pause
