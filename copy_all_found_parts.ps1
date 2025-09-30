# PowerShell script to copy all monster parts from all locations

Write-Host "Copying ALL monster parts from Downloads folders..." -ForegroundColor Green

# Create all directories first
$directories = @(
    "public\monster-parts\v1_monster1", "public\monster-parts\v1_monster2", "public\monster-parts\v1_monster3",
    "public\monster-parts\v1_monster4", "public\monster-parts\v1_monster5",
    "public\monster-parts\v2_monster1", "public\monster-parts\v2_monster2", "public\monster-parts\v2_monster3", 
    "public\monster-parts\v2_monster4", "public\monster-parts\v2_monster5",
    "public\monster-parts\v3_monster1", "public\monster-parts\v3_monster2", "public\monster-parts\v3_monster3",
    "public\monster-parts\v3_monster4", "public\monster-parts\v3_monster5",
    "public\monster-parts\v4_m1", "public\monster-parts\v4_m2", "public\monster-parts\v4_m3",
    "public\monster-parts\v4_m4", "public\monster-parts\v4_m5",
    "public\monster-parts\v7_m1", "public\monster-parts\v7_m2", "public\monster-parts\v7_m3",
    "public\monster-parts\v7_m4", "public\monster-parts\v7_m5",
    "public\monster-parts\v8_monster1", "public\monster-parts\v8_monster2", "public\monster-parts\v8_monster3",
    "public\monster-parts\v8_monster4", "public\monster-parts\v8_monster5",
    "public\monster-parts\enemy_monster1", "public\monster-parts\enemy_monster2", "public\monster-parts\enemy_monster3",
    "public\monster-parts\enemy_monster4", "public\monster-parts\enemy_monster5"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# Copy from "additional sprites" folder
$sourcePaths = @{
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 1\Images\*" = "public\monster-parts\v1_monster1\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 2\Images\*" = "public\monster-parts\v1_monster2\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 3\Images\*" = "public\monster-parts\v1_monster3\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 4\Images\*" = "public\monster-parts\v1_monster4\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-167954-monster-v1-character-sprites\Spine\Monster 5\Images\*" = "public\monster-parts\v1_monster5\"
    
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 1\Images\*" = "public\monster-parts\v2_monster1\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 2\Images\*" = "public\monster-parts\v2_monster2\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 3\Images\*" = "public\monster-parts\v2_monster3\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 4\Images\*" = "public\monster-parts\v2_monster4\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-154190-monster-v2-character-sprites\Spine\Monster 5\Images\*" = "public\monster-parts\v2_monster5\"
    
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 1\Images\*" = "public\monster-parts\v3_monster1\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 2\Images\*" = "public\monster-parts\v3_monster2\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 3\Images\*" = "public\monster-parts\v3_monster3\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 4\Images\*" = "public\monster-parts\v3_monster4\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-205925-monster-v3-character-sprites\Spine\Monster 5\Images\*" = "public\monster-parts\v3_monster5\"
    
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-894353-monster-v4-character-sprites\Spine\Monster 1\Images\*" = "public\monster-parts\v4_m1\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-894353-monster-v4-character-sprites\Spine\Monster 2\Images\*" = "public\monster-parts\v4_m2\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-894353-monster-v4-character-sprites\Spine\Monster 3\Images\*" = "public\monster-parts\v4_m3\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-894353-monster-v4-character-sprites\Spine\Monster 4\Images\*" = "public\monster-parts\v4_m4\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-894353-monster-v4-character-sprites\Spine\Monster 5\Images\*" = "public\monster-parts\v4_m5\"
    
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-925935-monster-v7-sprite-pack\Spine\Monster 1\Images\*" = "public\monster-parts\v7_m1\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-925935-monster-v7-sprite-pack\Spine\Monster 2\Images\*" = "public\monster-parts\v7_m2\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-925935-monster-v7-sprite-pack\Spine\Mons 1\Images\*" = "public\monster-parts\v7_m3\"
    "C:\Users\matt\Downloads\additional sprites\craftpix-net-925935-monster-v7-sprite-pack\Spine\Mons 2\Images\*" = "public\monster-parts\v7_m4\"
}

# Copy from "moresprites" folder
$moreSpritePaths = @{
    "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 1\Images\*" = "public\monster-parts\morev1_m1\"
    "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 2\Images\*" = "public\monster-parts\morev1_m2\"
    "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 3\Images\*" = "public\monster-parts\morev1_m3\"
    "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 4\Images\*" = "public\monster-parts\morev1_m4\"
    "C:\Users\matt\Downloads\moresprites\craftpix-net-167954-monster-v1-character-sprites (1)\Spine\Monster 5\Images\*" = "public\monster-parts\morev1_m5\"
}

# Copy all files
foreach ($source in $sourcePaths.Keys) {
    $dest = $sourcePaths[$source]
    if (Test-Path (Split-Path $source -Parent)) {
        Write-Host "Copying from: $source to $dest"
        Copy-Item -Path $source -Destination $dest -Force -ErrorAction SilentlyContinue
    }
}

foreach ($source in $moreSpritePaths.Keys) {
    $dest = $moreSpritePaths[$source]
    if (Test-Path (Split-Path $source -Parent)) {
        Write-Host "Copying from: $source to $dest"
        Copy-Item -Path $source -Destination $dest -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "All monster parts copied!" -ForegroundColor Green
