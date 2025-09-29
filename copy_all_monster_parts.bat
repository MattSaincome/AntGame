@echo off
echo Copying ALL monster parts from additional sprites...

:: Create base directories
mkdir "public\monster-parts" 2>nul

:: Monster v1 parts (craftpix-net-167954)
echo Copying Monster v1 parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\v1_monster%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster %%i\Images\*.*" "public\monster-parts\v1_monster%%i\"
)

:: Monster v2 parts (craftpix-net-154190)
echo Copying Monster v2 parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\v2_monster%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster %%i\Images\*.*" "public\monster-parts\v2_monster%%i\"
)

:: Monster v3 parts (craftpix-net-205925)
echo Copying Monster v3 parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\v3_monster%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster %%i\Images\*.*" "public\monster-parts\v3_monster%%i\"
)

:: Monster enemy pack (craftpix-net-101043)
echo Copying Monster enemy pack parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\enemy_monster%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-net-101043-monster-enemy-character-pack\Spine\Monster %%i\Images\*.*" "public\monster-parts\enemy_monster%%i\"
)

:: Monster v8 sprites (craftpix-net-155833)
echo Copying Monster v8 parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\v8_monster%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-net-155833-monster-v8-sprites\Spine\Monster%%i\Images\*.*" "public\monster-parts\v8_monster%%i\"
)

:: Halloween characters
echo Copying Halloween character parts...
mkdir "public\monster-parts\pumpkin_head" 2>nul
xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-664210-halloween-character-chibi-2d-game-sprites\Pumpkin Head Guy\PNG\Vector Parts\*.*" "public\monster-parts\pumpkin_head\"

mkdir "public\monster-parts\skull_knight" 2>nul
xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-664210-halloween-character-chibi-2d-game-sprites\Skull Knight\PNG\Vector Parts\*.*" "public\monster-parts\skull_knight\"

mkdir "public\monster-parts\vampire" 2>nul
xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-664210-halloween-character-chibi-2d-game-sprites\Vampire\PNG\Vector Parts\*.*" "public\monster-parts\vampire\"

:: Egyptian characters
echo Copying Egyptian character parts...
mkdir "public\monster-parts\anubis" 2>nul
xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-941777-egyptian-mummy-anubis-sentry-chibi-2d-game-sprites\Anubis\PNG\Vector Parts\*.*" "public\monster-parts\anubis\"

:: Skeleton Crusaders
echo Copying Skeleton Crusader parts...
for /L %%i in (1,1,3) do (
    mkdir "public\monster-parts\skeleton_crusader%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\additional sprites\craftpix-net-166787-free-chibi-skeleton-crusader-character-sprites\Skeleton_Crusader_%%i\PNG\Vector Parts\*.*" "public\monster-parts\skeleton_crusader%%i\"
)

echo All monster parts copied!
