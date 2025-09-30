const fs = require('fs');
const path = require('path');

const monsterPartsDir = path.join(__dirname, '..', 'public', 'monster-parts');

function scanMonsterParts() {
  const monsterParts = {};
  
  // Read all directories
  const dirs = fs.readdirSync(monsterPartsDir);
  
  for (const dir of dirs) {
    const dirPath = path.join(monsterPartsDir, dir);
    const stat = fs.statSync(dirPath);
    
    if (stat.isDirectory()) {
      // Skip some non-monster directories
      if (dir === 'spine_images' || dir === 'Sprites' || dir === 'additional sprites' || 
          dir === 'moresprites' || dir.includes('craftpix')) {
        continue;
      }
      
      // Get all PNG files in this directory
      const files = fs.readdirSync(dirPath);
      const pngFiles = files
        .filter(f => f.endsWith('.png'))
        .map(f => f.replace('.png', '')); // Remove .png extension
      
      if (pngFiles.length > 0) {
        monsterParts[dir] = pngFiles;
        console.log(`${dir}: ${pngFiles.length} parts`);
      }
    }
  }
  
  // Write to a TypeScript file
  const output = `// AUTO-GENERATED: Actual monster parts found by scanning directories
export const ACTUAL_MONSTER_PARTS: Record<string, string[]> = ${JSON.stringify(monsterParts, null, 2)};`;
  
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'systems', 'ActualMonsterParts.ts'), output);
  console.log('\nWrote to src/systems/ActualMonsterParts.ts');
  console.log(`Total monsters with parts: ${Object.keys(monsterParts).length}`);
}

scanMonsterParts();
