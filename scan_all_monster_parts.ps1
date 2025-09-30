# PowerShell script to scan ALL monster parts and generate a comprehensive list
$basePath = ".\public\monster-parts"
$outputFile = ".\src\config\AllMonsterParts.ts"

Write-Host "Scanning for ALL monster parts in $basePath..." -ForegroundColor Green

# Get all PNG files recursively
$allPngFiles = Get-ChildItem -Path $basePath -Filter "*.png" -Recurse

# Group by directory to understand structure
$monsterFolders = @{}

foreach ($file in $allPngFiles) {
    # Get the relative path from monster-parts
    $relativePath = $file.FullName.Replace((Get-Item $basePath).FullName, "").TrimStart("\")
    $pathParts = $relativePath -split "\\"
    
    # Extract monster folder name (the deepest folder containing the PNG)
    $folderPath = $file.Directory.FullName.Replace((Get-Item $basePath).FullName, "").TrimStart("\")
    
    if (-not $monsterFolders.ContainsKey($folderPath)) {
        $monsterFolders[$folderPath] = @()
    }
    
    # Add the file name (without extension) to this folder's parts
    $partName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    if ($monsterFolders[$folderPath] -notcontains $partName) {
        $monsterFolders[$folderPath] += $partName
    }
}

Write-Host "Found $($monsterFolders.Count) folders with monster parts!" -ForegroundColor Yellow
Write-Host "Total PNG files: $($allPngFiles.Count)" -ForegroundColor Cyan

# Generate TypeScript file
$tsContent = @"
// Auto-generated comprehensive list of ALL monster parts
// Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
// Total folders: $($monsterFolders.Count)
// Total PNG files: $($allPngFiles.Count)

export interface MonsterPartFolder {
  path: string;
  parts: string[];
}

export const ALL_MONSTER_PART_FOLDERS: MonsterPartFolder[] = [
"@

# Sort folders and add to output
$sortedFolders = $monsterFolders.GetEnumerator() | Sort-Object Key

foreach ($folder in $sortedFolders) {
    $folderPath = $folder.Key.Replace("\", "/")
    $parts = $folder.Value | Sort-Object
    
    $tsContent += @"
  {
    path: '$folderPath',
    parts: [
"@
    
    foreach ($part in $parts) {
        $tsContent += "`n      '$part',"
    }
    
    # Remove last comma
    $tsContent = $tsContent.TrimEnd(",")
    
    $tsContent += @"

    ]
  },
"@
}

# Remove last comma
$tsContent = $tsContent.TrimEnd(",")

$tsContent += @"

];

// Extract unique part types across all monsters
export const UNIQUE_PART_TYPES = [
"@

# Get all unique part names
$uniqueParts = @{}
foreach ($folder in $monsterFolders.Values) {
    foreach ($part in $folder) {
        $uniqueParts[$part] = $true
    }
}

$sortedUniqueParts = $uniqueParts.Keys | Sort-Object
foreach ($part in $sortedUniqueParts) {
    $tsContent += "`n  '$part',"
}

$tsContent = $tsContent.TrimEnd(",")

$tsContent += @"

];

// Helper function to load all parts
export function getAllMonsterPartPaths(): string[] {
  const paths: string[] = [];
  ALL_MONSTER_PART_FOLDERS.forEach(folder => {
    folder.parts.forEach(part => {
      paths.push(`monster-parts/`${folder.path}/`${part}.png`);
    });
  });
  return paths;
}

// Stats
export const MONSTER_PARTS_STATS = {
  totalFolders: $($monsterFolders.Count),
  totalFiles: $($allPngFiles.Count),
  uniquePartTypes: $($uniqueParts.Count)
};
"@

# Write to file
$tsContent | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "`nGenerated $outputFile" -ForegroundColor Green
Write-Host "Stats:" -ForegroundColor Yellow
Write-Host "  - Total folders: $($monsterFolders.Count)" -ForegroundColor Cyan
Write-Host "  - Total PNG files: $($allPngFiles.Count)" -ForegroundColor Cyan
Write-Host "  - Unique part types: $($uniqueParts.Count)" -ForegroundColor Cyan

# Show some sample folders
Write-Host "`nSample folders found:" -ForegroundColor Yellow
$sortedFolders | Select-Object -First 10 | ForEach-Object {
    Write-Host "  - $($_.Key) ($(($_.Value).Count) parts)" -ForegroundColor Gray
}
