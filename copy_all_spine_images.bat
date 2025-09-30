@echo off
echo Copying ALL Spine Images body parts from every Images folder...

rem Create destination directories
mkdir "public\monster-parts\spine_images\" 2>nul

rem Find and copy all PNG files from any Images folder
echo Searching for all body part images in Images folders...

rem Additional sprites folders
for /R "C:\Users\matt\Downloads\additional sprites" %%F in (*.png) do (
    echo %%F | findstr /i "\\Images\\" >nul
    if not errorlevel 1 (
        rem Extract the folder structure to preserve monster identity
        for %%D in ("%%~dpF\..\..") do (
            set "parent=%%~nxD"
        )
        for %%D in ("%%~dpF\..") do (
            set "monster=%%~nxD"
        )
        
        rem Copy to a structured folder
        echo Copying %%~nxF from !parent! !monster!
        xcopy "%%F" "public\monster-parts\spine_images\" /Y /Q
    )
)

rem Moresprites folders
for /R "C:\Users\matt\Downloads\moresprites" %%F in (*.png) do (
    echo %%F | findstr /i "\\Images\\" >nul
    if not errorlevel 1 (
        echo Copying %%~nxF from moresprites
        xcopy "%%F" "public\monster-parts\spine_images\" /Y /Q
    )
)

rem Main Sprites folder  
for /R "C:\Users\matt\Downloads\Sprites" %%F in (*.png) do (
    echo %%F | findstr /i "\\Images\\" >nul
    if not errorlevel 1 (
        echo Copying %%~nxF from Sprites
        xcopy "%%F" "public\monster-parts\spine_images\" /Y /Q
    )
)

echo.
echo All Spine Images copied!
echo.
pause
