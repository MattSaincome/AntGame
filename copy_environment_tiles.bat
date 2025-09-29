@echo off
echo Copying environment and mine tiles...

:: Create directories
mkdir "public\tiles" 2>nul
mkdir "public\tiles\swamp-cave" 2>nul

:: Copy swamp cave tileset
echo Copying Swamp Cave tileset...
xcopy /s /y "C:\Users\matt\Downloads\enviroment and mine tiles\craftpix-net-730200-swamp-cave-pixel-art-32x32-tileset\1 Tiles\*.png" "public\tiles\swamp-cave\"

:: Copy the main tileset image too
xcopy /y "C:\Users\matt\Downloads\enviroment and mine tiles\craftpix-net-730200-swamp-cave-pixel-art-32x32-tileset\1 Tiles\Tileset.png" "public\tiles\"

echo Environment tiles copied!
