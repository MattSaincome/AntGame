# PowerShell script to copy all Spine Images with structure preservation

Write-Host "Copying ALL Spine Images body parts with structure preservation..." -ForegroundColor Green

# Create base directory
$destBase = "public\monster-parts\spine_images"
New-Item -ItemType Directory -Force -Path $destBase | Out-Null

# Counter for files
$fileCount = 0

# Function to process a directory
function Process-SpineImages {
    param($searchPath)
    
    Write-Host "`nSearching in: $searchPath" -ForegroundColor Yellow
    
    # Find all Images folders
    $imageFolders = Get-ChildItem -Path $searchPath -Directory -Recurse -Filter "Images" -ErrorAction SilentlyContinue
    
    foreach ($imageFolder in $imageFolders) {
        # Get parent folders for context
        $monsterFolder = Split-Path $imageFolder.FullName -Parent
        $monsterName = Split-Path $monsterFolder -Leaf
        $packFolder = Split-Path $monsterFolder -Parent
        $packName = Split-Path $packFolder -Leaf
        
        # Clean up the names
        $cleanPackName = $packName -replace 'craftpix-net-\d+-', ''
        $cleanMonsterName = $monsterName -replace '\s+', '_'
        
        Write-Host "  Found: $cleanPackName / $cleanMonsterName" -ForegroundColor Cyan
        
        # Create destination folder
        $destFolder = Join-Path $destBase "$cleanPackName\$cleanMonsterName"
        New-Item -ItemType Directory -Force -Path $destFolder | Out-Null
        
        # Copy all PNG files from this Images folder
        $pngFiles = Get-ChildItem -Path $imageFolder.FullName -Filter "*.png"
        foreach ($pngFile in $pngFiles) {
            $destFile = Join-Path $destFolder $pngFile.Name
            Copy-Item -Path $pngFile.FullName -Destination $destFile -Force
            Write-Host "    Copied: $($pngFile.Name)" -ForegroundColor Gray
            $script:fileCount++
        }
    }
}

# Process all directories
Process-SpineImages "C:\Users\matt\Downloads\additional sprites"
Process-SpineImages "C:\Users\matt\Downloads\moresprites"
Process-SpineImages "C:\Users\matt\Downloads\Sprites"

Write-Host "`n======================================" -ForegroundColor Green
Write-Host "Complete! Copied $fileCount body part images" -ForegroundColor Green
Write-Host "Files are in: public\monster-parts\spine_images\" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
