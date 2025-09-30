@echo off
echo Copying real monster parts from Downloads folders...

REM Create directories for each monster variant
mkdir "public\monster-parts\v1_monster1" 2>nul
mkdir "public\monster-parts\v1_monster2" 2>nul  
mkdir "public\monster-parts\v1_monster3" 2>nul
mkdir "public\monster-parts\v1_monster4" 2>nul
mkdir "public\monster-parts\v1_monster5" 2>nul

mkdir "public\monster-parts\v2_monster1" 2>nul
mkdir "public\monster-parts\v2_monster2" 2>nul
mkdir "public\monster-parts\v2_monster3" 2>nul
mkdir "public\monster-parts\v2_monster4" 2>nul
mkdir "public\monster-parts\v2_monster5" 2>nul

mkdir "public\monster-parts\v3_monster1" 2>nul
mkdir "public\monster-parts\v3_monster2" 2>nul
mkdir "public\monster-parts\v3_monster3" 2>nul
mkdir "public\monster-parts\v3_monster4" 2>nul
mkdir "public\monster-parts\v3_monster5" 2>nul

REM Copy from additional sprites - v1 monsters
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 1\Images\*.png" "public\monster-parts\v1_monster1\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 2\Images\*.png" "public\monster-parts\v1_monster2\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 3\Images\*.png" "public\monster-parts\v1_monster3\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 4\Images\*.png" "public\monster-parts\v1_monster4\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 5\Images\*.png" "public\monster-parts\v1_monster5\"

REM Copy from additional sprites - v2 monsters
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 1\Images\*.png" "public\monster-parts\v2_monster1\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 2\Images\*.png" "public\monster-parts\v2_monster2\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 3\Images\*.png" "public\monster-parts\v2_monster3\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 4\Images\*.png" "public\monster-parts\v2_monster4\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 5\Images\*.png" "public\monster-parts\v2_monster5\"

REM Copy from additional sprites - v3 monsters  
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 1\Images\*.png" "public\monster-parts\v3_monster1\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 2\Images\*.png" "public\monster-parts\v3_monster2\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 3\Images\*.png" "public\monster-parts\v3_monster3\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 4\Images\*.png" "public\monster-parts\v3_monster4\"
xcopy /y /q "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 5\Images\*.png" "public\monster-parts\v3_monster5\"

REM Copy from moresprites folder - check for (1) suffix versions
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 1\Images\*.png" "public\monster-parts\morev1_m1\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 2\Images\*.png" "public\monster-parts\morev1_m2\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 3\Images\*.png" "public\monster-parts\morev1_m3\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 4\Images\*.png" "public\monster-parts\morev1_m4\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 5\Images\*.png" "public\monster-parts\morev1_m5\"

xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-154190-monster-v2-character-sprites (1)\Spine\Monster 1\Images\*.png" "public\monster-parts\morev2_m1\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-154190-monster-v2-character-sprites (1)\Spine\Monster 2\Images\*.png" "public\monster-parts\morev2_m2\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-154190-monster-v2-character-sprites (1)\Spine\Monster 3\Images\*.png" "public\monster-parts\morev2_m3\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-154190-monster-v2-character-sprites (1)\Spine\Monster 4\Images\*.png" "public\monster-parts\morev2_m4\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-154190-monster-v2-character-sprites (1)\Spine\Monster 5\Images\*.png" "public\monster-parts\morev2_m5\"

xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-205925-monster-v3-character-sprites (1)\Spine\Monster 1\Images\*.png" "public\monster-parts\morev3_m1\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-205925-monster-v3-character-sprites (1)\Spine\Monster 2\Images\*.png" "public\monster-parts\morev3_m2\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-205925-monster-v3-character-sprites (1)\Spine\Monster 3\Images\*.png" "public\monster-parts\morev3_m3\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-205925-monster-v3-character-sprites (1)\Spine\Monster 4\Images\*.png" "public\monster-parts\morev3_m4\"
xcopy /y /q "C:\Users\matt\Downloads\moresprites\craftpix-net-205925-monster-v3-character-sprites (1)\Spine\Monster 5\Images\*.png" "public\monster-parts\morev3_m5\"

echo Monster parts copied successfully!
pause
