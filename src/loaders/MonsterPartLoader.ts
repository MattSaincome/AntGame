import { 
  MONSTER_PARTS_STATS, 
  SPINE_MONSTER_FOLDERS, 
  COMMON_PART_TYPES, 
  DIRECT_MONSTER_FOLDERS 
} from '../config/MonsterPartsOptimized';

/**
 * Handles loading of all 22,000+ monster parts efficiently
 */
export class MonsterPartLoader {
  private scene: Phaser.Scene;
  private loadedCount = 0;
  private totalToLoad = 0;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Load all monster parts with intelligent batching
   */
  loadAllParts(): void {
    console.log(`🎮 MonsterPartLoader: Loading optimized monster parts...`);
    console.log(`📊 Available: ${MONSTER_PARTS_STATS.totalFiles} files in ${MONSTER_PARTS_STATS.totalFolders} folders`);
    
    // Load Spine folders (these have individual body parts)
    console.log(`📁 Loading ${SPINE_MONSTER_FOLDERS.length} Spine folders with body parts...`);
    
    SPINE_MONSTER_FOLDERS.forEach(folderPath => {
      this.loadSpineFolder(folderPath);
    });
    
    // Load direct monster folders
    console.log(`📁 Loading ${DIRECT_MONSTER_FOLDERS.length} direct monster folders...`);
    
    DIRECT_MONSTER_FOLDERS.forEach(folderName => {
      this.loadDirectFolder(folderName);
    });
    
    // Set up error handler to silently ignore missing files
    this.scene.load.off('loaderror'); // Remove any existing listeners
    this.scene.load.on('loaderror', (file: any) => {
      // Silently ignore - not all parts will load successfully
      // No console output to avoid spam
    });
    
    this.scene.load.on('load', (file: any) => {
      this.loadedCount++;
      if (this.loadedCount % 1000 === 0) {
        console.log(`✅ Loaded ${this.loadedCount} / ${this.totalToLoad} parts...`);
      }
    });
  }
  
  private loadSpineFolder(folderPath: string): void {
    const basePath = `monster-parts/${folderPath}`;
    const folderKey = this.getFolderKey(folderPath);
    
    // Load common part types from this folder
    COMMON_PART_TYPES.forEach(part => {
      const key = `${folderKey}_${this.normalizePartName(part)}`;
      const path = `${basePath}/${part}.png`;
      
      // Only load if not already loaded and not a problematic path
      if (!this.scene.textures.exists(key) && !this.isProblematicPath(path)) {
        try {
          this.scene.load.image(key, path);
          this.totalToLoad++;
        } catch (e) {
          // Silently skip
        }
      }
    });
  }
  
  private loadDirectFolder(folderName: string): void {
    const basePath = `monster-parts/${folderName}`;
    
    // Load common part types from direct folders
    COMMON_PART_TYPES.forEach(part => {
      const key = `${folderName}_${this.normalizePartName(part)}`;
      const path = `${basePath}/${part}.png`;
      
      // Only load if not already loaded and not a problematic path
      if (!this.scene.textures.exists(key) && !this.isProblematicPath(path)) {
        try {
          this.scene.load.image(key, path);
          this.totalToLoad++;
        } catch (e) {
          // Silently skip
        }
      }
    });
  }
  
  private getFolderKey(path: string): string {
    // Extract a meaningful key from the path
    // e.g., "additional sprites/craftpix-net-167954-monster-v1-character-sprites/Spine/Monster 1/Images"
    // becomes "v1_monster1"
    
    if (path.includes('monster-v1')) return 'v1_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v2')) return 'v2_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v3')) return 'v3_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v4')) return 'v4_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v5')) return 'v5_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v6')) return 'v6_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v7')) return 'v7_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v8')) return 'v8_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v9')) return 'v9_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v10')) return 'v10_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-v11')) return 'v11_m' + this.extractMonsterNumber(path);
    if (path.includes('monster-enemy')) return 'enemy_m' + this.extractMonsterNumber(path);
    if (path.includes('chibi-monster')) return 'chibi_m' + this.extractMonsterNumber(path);
    if (path.includes('cartoon-monster')) return 'cartoon_m' + this.extractMonsterNumber(path);
    if (path.includes('cute-chibi')) return 'cute_m' + this.extractMonsterNumber(path);
    if (path.includes('funny-monster')) return 'funny_m' + this.extractMonsterNumber(path);
    if (path.includes('quirky-monster')) return 'quirky_m' + this.extractMonsterNumber(path);
    if (path.includes('mini-monster')) return 'mini_m' + this.extractMonsterNumber(path);
    if (path.includes('skeleton')) return 'skeleton_' + this.extractMonsterNumber(path);
    if (path.includes('wraith')) return 'wraith_' + this.extractMonsterNumber(path);
    if (path.includes('demon')) return 'demon_' + this.extractMonsterNumber(path);
    if (path.includes('anubis')) return 'anubis';
    if (path.includes('mummy')) return 'mummy';
    if (path.includes('pumpkin')) return 'pumpkin';
    if (path.includes('vampire')) return 'vampire';
    if (path.includes('fire-monster')) return 'fire';
    
    // Generic fallback - use folder name
    const parts = path.split('/');
    const lastPart = parts[parts.length - 2] || parts[parts.length - 1];
    return lastPart.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  
  private extractMonsterNumber(path: string): string {
    // Extract monster number from paths like "Monster 1", "Monster1", "Char01", etc.
    const match = path.match(/(?:Monster|Char|monster)\s*(\d+)/i);
    if (match) return match[1];
    return '0';
  }
  
  private normalizePartName(part: string): string {
    // Normalize part names to be consistent
    return part.toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
  
  private shouldSkipPart(part: string): boolean {
    // Skip certain types of parts that aren't useful for procedural generation
    const skipPatterns = [
      'skeleton-', // Animation frames
      'Monster-', // Full sprites
      'Idle_', // Animation frames
      'Walk_', // Animation frames
      'Attack_', // Animation frames
      'Death_', // Animation frames
      'Hurt_', // Animation frames
      'Jump_', // Animation frames
      'Run_', // Animation frames
      '_000', // Animation frame sequences
      '_001', '_002', '_003', // More animation frames
    ];
    
    return skipPatterns.some(pattern => part.includes(pattern));
  }
  
  /**
   * Get statistics about loaded parts
   */
  getStats(): { loaded: number; total: number; percentage: number } {
    const percentage = this.totalToLoad > 0 ? (this.loadedCount / this.totalToLoad) * 100 : 0;
    return {
      loaded: this.loadedCount,
      total: this.totalToLoad,
      percentage: Math.round(percentage)
    };
  }
  
  /**
   * Get list of all available monster types for procedural generation
   */
  static getAvailableMonsterTypes(): string[] {
    const monsterTypes = new Set<string>();
    
    // From Spine folders
    SPINE_MONSTER_FOLDERS.forEach(folder => {
      const key = new MonsterPartLoader(null as any).getFolderKey(folder);
      monsterTypes.add(key);
    });
    
    // From direct folders
    DIRECT_MONSTER_FOLDERS.forEach(folder => {
      monsterTypes.add(folder);
    });
    
    return Array.from(monsterTypes);
  }
  
  /**
   * Get parts available for a specific monster type
   */
  static getMonsterParts(monsterType: string): string[] {
    return COMMON_PART_TYPES;
  }
  
  /**
   * Check if a path is likely to cause 404 errors
   */
  private isProblematicPath(path: string): boolean {
    // Skip paths that we know don't exist to reduce 404 errors
    const problematicPatterns = [
      'undefined',
      'null',
      '///',
      '.png.png',
      'Images/Images',
      'additional sprites/craftpix-net-\*',  // Wildcard paths
    ];
    
    return problematicPatterns.some(pattern => path.includes(pattern));
  }
}
