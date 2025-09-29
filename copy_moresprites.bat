@echo off
echo Copying MORE monster sprites from moresprites folder...

:: Create base directories
mkdir "public\monster-parts" 2>nul

:: Copy the MORE COMPLETE v1 sprites (with heads!)
echo Copying COMPLETE Monster v1 parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\morev1_m%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster %%i\Images\*.*" "public\monster-parts\morev1_m%%i\"
)

:: Copy the MORE COMPLETE v2 sprites
echo Copying COMPLETE Monster v2 parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\morev2_m%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\moresprites\craftpix-net-154190-monster-v2-character-sprites (1)\Spine\Monster %%i\Images\*.*" "public\monster-parts\morev2_m%%i\"
)

:: Copy the MORE COMPLETE v3 sprites
echo Copying COMPLETE Monster v3 parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\morev3_m%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\moresprites\craftpix-net-205925-monster-v3-character-sprites (1)\Spine\Monster %%i\Images\*.*" "public\monster-parts\morev3_m%%i\"
)

:: Copy the NEW v4 sprites
echo Copying NEW Monster v4 parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\v4_m%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\moresprites\craftpix-net-894353-monster-v4-character-sprites (1)\Spine\Monster %%i\Images\*.*" "public\monster-parts\v4_m%%i\"
)

:: Copy the NEW v7 sprites
echo Copying NEW Monster v7 parts...
for /L %%i in (1,1,5) do (
    mkdir "public\monster-parts\v7_m%%i" 2>nul
    xcopy /s /y "c:\Users\matt\Downloads\moresprites\craftpix-net-925935-monster-v7-sprite-pack (1)\Spine\Monster %%i\Images\*.*" "public\monster-parts\v7_m%%i\"
)

echo All MORE sprites copied!
