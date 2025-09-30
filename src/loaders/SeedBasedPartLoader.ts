import { GENE_POOL_SEEDS, GenePoolSeed, getVerifiedParts } from '../systems/GenePoolSeeds';

/**
 * Seed-based part loader that pre-loads verified working monster parts
 */
export class SeedBasedPartLoader {
  private scene: Phaser.Scene;
  private currentSeeds: GenePoolSeed[]; // Now loading TWO seeds!
  private loadedParts: Set<string> = new Set();
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // 50% chance to use the complete collection for maximum variety
    if (Math.random() < 0.5) {
      // Use complete collection + one other seed
      const completeIndex = GENE_POOL_SEEDS.findIndex(s => s.id === 'complete');
      const otherSeeds = GENE_POOL_SEEDS.filter((_, i) => i !== completeIndex);
      const randomOther = otherSeeds[Math.floor(Math.random() * otherSeeds.length)];
      this.currentSeeds = [GENE_POOL_SEEDS[completeIndex], randomOther];
    } else {
      // Randomly select TWO different seeds for mixing
      const seedIndex1 = Math.floor(Math.random() * GENE_POOL_SEEDS.length);
      let seedIndex2 = Math.floor(Math.random() * GENE_POOL_SEEDS.length);
      // Make sure we get two different seeds if possible
      if (seedIndex2 === seedIndex1 && GENE_POOL_SEEDS.length > 1) {
        seedIndex2 = (seedIndex1 + 1) % GENE_POOL_SEEDS.length;
      }
      this.currentSeeds = [GENE_POOL_SEEDS[seedIndex1], GENE_POOL_SEEDS[seedIndex2]];
    }
  }
  
  /**
   * Pre-load all parts for the selected seed
   */
  preloadSeedParts(): void {
    console.log(`🌱 Loading TWO Gene Pool Seeds for mixing:`);
    console.log(`  1️⃣ ${this.currentSeeds[0].name} - ${this.currentSeeds[0].description}`);
    console.log(`  2️⃣ ${this.currentSeeds[1].name} - ${this.currentSeeds[1].description}`);
    
    const totalMonsters = this.currentSeeds[0].monsterSets.length + this.currentSeeds[1].monsterSets.length;
    console.log(`🧬 Loading ${totalMonsters} monster types total...`);
    
    // Load parts for each monster in BOTH seeds
    this.currentSeeds.forEach(seed => {
      seed.monsterSets.forEach(monsterType => {
        this.loadMonsterParts(monsterType);
      });
    });
    
    // Start loading
    console.log(`✅ Queued ${this.loadedParts.size} parts for loading`);
  }
  
  /**
   * Load parts for a specific monster type
   */
  private loadMonsterParts(monsterType: string): void {
    const parts = getVerifiedParts(monsterType);
    
    // Try both direct path and without spaces
    const possiblePaths = [
      `monster-parts/${monsterType}`,  // Direct path
      `public/monster-parts/${monsterType}`,  // With public prefix
    ];
    
    parts.forEach(part => {
      const key = `${monsterType}_${part.toLowerCase().replace('_', '')}`;
      
      // Try each possible path
      for (const basePath of possiblePaths) {
        const path = `${basePath}/${part}.png`;
        
        // Only load if not already loaded
        if (!this.loadedParts.has(key) && !this.scene.textures.exists(key)) {
          // Check if we should skip this path
          if (!path.includes('additional%20sprites') && !path.includes('undefined')) {
            this.scene.load.image(key, path);
            this.loadedParts.add(key);
            break; // Stop after first successful path
          }
        }
      }
    });
    
    // Don't load common variations - only load verified parts to avoid 404s
  }
  
  // Removed loadCommonVariations to prevent 404 errors
  // Now only loading verified parts from VERIFIED_PARTS configuration
  
  /**
   * Get the current seeds info
   */
  getCurrentSeeds(): GenePoolSeed[] {
    return this.currentSeeds;
  }
  
  /**
   * Get available monster types from both seeds
   */
  getAvailableMonsterTypes(): string[] {
    // Combine monster sets from both seeds
    return [...this.currentSeeds[0].monsterSets, ...this.currentSeeds[1].monsterSets];
  }
  
  /**
   * Switch to different seeds (for testing)
   */
  switchSeeds(seedId1: string, seedId2: string): void {
    const newSeed1 = GENE_POOL_SEEDS.find(s => s.id === seedId1);
    const newSeed2 = GENE_POOL_SEEDS.find(s => s.id === seedId2);
    if (newSeed1 && newSeed2) {
      this.currentSeeds = [newSeed1, newSeed2];
      this.loadedParts.clear();
      this.preloadSeedParts();
    }
  }
  
  /**
   * Check if a specific monster type is in the current seeds
   */
  hasMonsterType(monsterType: string): boolean {
    return this.currentSeeds[0].monsterSets.includes(monsterType) ||
           this.currentSeeds[1].monsterSets.includes(monsterType);
  }
}
