@echo off
echo Copying missing monster parts from Downloads to public/monster-parts...

REM Create base directory if it doesn't exist
if not exist "public\monster-parts" mkdir "public\monster-parts"

REM Copy v1 monsters (from craftpix-net-167954-monster-v1-character-sprites)
set SOURCE_V1=c:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine

echo Copying v1 monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying v1_monster%%i...
    if not exist "public\monster-parts\v1_monster%%i" mkdir "public\monster-parts\v1_monster%%i"
    if exist "%SOURCE_V1%\Monster %%i\Images" (
        xcopy "%SOURCE_V1%\Monster %%i\Images\*.png" "public\monster-parts\v1_monster%%i\" /Y /Q
    )
)

REM Copy v2 monsters (from craftpix-net-154190-monster-v2-character-sprites)  
set SOURCE_V2=c:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine

echo Copying v2 monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying v2_monster%%i...
    if not exist "public\monster-parts\v2_monster%%i" mkdir "public\monster-parts\v2_monster%%i"
    if exist "%SOURCE_V2%\Monster %%i\Images" (
        xcopy "%SOURCE_V2%\Monster %%i\Images\*.png" "public\monster-parts\v2_monster%%i\" /Y /Q
    )
)

REM Copy v3 monsters (from craftpix-net-205925-monster-v3-character-sprites)
set SOURCE_V3=c:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine

echo Copying v3 monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying v3_monster%%i...
    if not exist "public\monster-parts\v3_monster%%i" mkdir "public\monster-parts\v3_monster%%i"
    if exist "%SOURCE_V3%\Monster %%i\Images" (
        xcopy "%SOURCE_V3%\Monster %%i\Images\*.png" "public\monster-parts\v3_monster%%i\" /Y /Q
    )
)

REM Copy v4 monsters (from craftpix-net-894353-monster-v4-character-sprites)
set SOURCE_V4=c:\Users\matt\Downloads\additional sprites\craftpix-net-894353-monster-v4-character-sprites\Spine

echo Copying v4 monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying v4_monster%%i...
    if not exist "public\monster-parts\v4_monster%%i" mkdir "public\monster-parts\v4_monster%%i"
    if exist "%SOURCE_V4%\Monster %%i\Images" (
        xcopy "%SOURCE_V4%\Monster %%i\Images\*.png" "public\monster-parts\v4_monster%%i\" /Y /Q
    )
)

REM Copy v5 monsters (from craftpix-net-919876-monster-v5-character-sprites)
set SOURCE_V5=c:\Users\matt\Downloads\additional sprites\craftpix-net-919876-monster-v5-character-sprites\Spine

echo Copying v5 monsters...
for %%i in (1 2 3) do (
    echo   Copying v5_monster%%i...
    if not exist "public\monster-parts\v5_monster%%i" mkdir "public\monster-parts\v5_monster%%i"
    if exist "%SOURCE_V5%\Char0%%i\Images" (
        xcopy "%SOURCE_V5%\Char0%%i\Images\*.png" "public\monster-parts\v5_monster%%i\" /Y /Q
    )
)

REM Copy v6 monsters (from craftpix-net-534332-monster-v6-sprite-set)
set SOURCE_V6=c:\Users\matt\Downloads\additional sprites\craftpix-net-534332-monster-v6-sprite-set\Spine

echo Copying v6 monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying v6_monster%%i...
    if not exist "public\monster-parts\v6_monster%%i" mkdir "public\monster-parts\v6_monster%%i"
    if exist "%SOURCE_V6%\Monster%%i\Images" (
        xcopy "%SOURCE_V6%\Monster%%i\Images\*.png" "public\monster-parts\v6_monster%%i\" /Y /Q
    )
)

REM Copy v7 monsters (from craftpix-net-925935-monster-v7-sprite-pack)
set SOURCE_V7=c:\Users\matt\Downloads\additional sprites\craftpix-net-925935-monster-v7-sprite-pack\Spine

echo Copying v7 monsters...
for %%i in (1 2) do (
    echo   Copying v7_monster%%i...
    if not exist "public\monster-parts\v7_monster%%i" mkdir "public\monster-parts\v7_monster%%i"
    if exist "%SOURCE_V7%\Monster %%i\Images" (
        xcopy "%SOURCE_V7%\Monster %%i\Images\*.png" "public\monster-parts\v7_monster%%i\" /Y /Q
    )
)

REM Copy v8 monsters (from craftpix-net-155833-monster-v8-sprites)
set SOURCE_V8=c:\Users\matt\Downloads\additional sprites\craftpix-net-155833-monster-v8-sprites\Spine

echo Copying v8 monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying v8_monster%%i...
    if not exist "public\monster-parts\v8_monster%%i" mkdir "public\monster-parts\v8_monster%%i"
    if exist "%SOURCE_V8%\Monster%%i\Images" (
        xcopy "%SOURCE_V8%\Monster%%i\Images\*.png" "public\monster-parts\v8_monster%%i\" /Y /Q
    )
)

REM Copy v9 monsters (from craftpix-net-376573-monster-v9-character-sprites)
set SOURCE_V9=c:\Users\matt\Downloads\additional sprites\craftpix-net-376573-monster-v9-character-sprites\Spine

echo Copying v9 monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying v9_monster%%i...
    if not exist "public\monster-parts\v9_monster%%i" mkdir "public\monster-parts\v9_monster%%i"
    if exist "%SOURCE_V9%\Monster%%i\Images" (
        xcopy "%SOURCE_V9%\Monster%%i\Images\*.png" "public\monster-parts\v9_monster%%i\" /Y /Q
    )
)

REM Copy v10 monsters (from craftpix-net-810746-monster-v10-enemy-sprite-set)
set SOURCE_V10=c:\Users\matt\Downloads\additional sprites\craftpix-net-810746-monster-v10-enemy-sprite-set\Spine

echo Copying v10 monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying v10_monster%%i...
    if not exist "public\monster-parts\v10_monster%%i" mkdir "public\monster-parts\v10_monster%%i"
    if exist "%SOURCE_V10%\Monster%%i\Images" (
        xcopy "%SOURCE_V10%\Monster%%i\Images\*.png" "public\monster-parts\v10_monster%%i\" /Y /Q
    )
)

REM Copy v11 monsters (from craftpix-net-923854-monster-v11-enemy-sprite-set)
set SOURCE_V11=c:\Users\matt\Downloads\additional sprites\craftpix-net-923854-monster-v11-enemy-sprite-set\Spine

echo Copying v11 monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying v11_monster%%i...
    if not exist "public\monster-parts\v11_monster%%i" mkdir "public\monster-parts\v11_monster%%i"
    if exist "%SOURCE_V11%\Monster%%i\Images" (
        xcopy "%SOURCE_V11%\Monster%%i\Images\*.png" "public\monster-parts\v11_monster%%i\" /Y /Q
    )
)

REM Copy enemy monsters (from craftpix-net-101043-monster-enemy-character-pack)
set SOURCE_ENEMY=c:\Users\matt\Downloads\additional sprites\craftpix-net-101043-monster-enemy-character-pack\Spine

echo Copying enemy monsters...
for %%i in (1 2 3 4 5) do (
    echo   Copying enemy_monster%%i...
    if not exist "public\monster-parts\enemy_monster%%i" mkdir "public\monster-parts\enemy_monster%%i"
    if exist "%SOURCE_ENEMY%\Monster %%i\Images" (
        xcopy "%SOURCE_ENEMY%\Monster %%i\Images\*.png" "public\monster-parts\enemy_monster%%i\" /Y /Q
    )
)

echo.
echo Monster parts copy complete!
echo Run 'npm run dev' to see the monsters with their proper sprites.
pause
