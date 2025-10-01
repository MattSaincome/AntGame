// Dynamic part loader that loads all parts from actual scanned data
import { ACTUAL_MONSTER_PARTS } from '../systems/ActualMonsterParts';

export class DynamicPartLoader {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Load all parts for all monsters
   * Handles parts with spaces correctly
   */
  loadAllMonsterParts(): void {
    let totalParts = 0;
    
    for (const [monsterType, parts] of Object.entries(ACTUAL_MONSTER_PARTS)) {
      for (const part of parts) {
        // Create a key that's safe for Phaser (replace spaces with underscores)
        const safeKey = `${monsterType}_${part.replace(/ /g, '_').toLowerCase()}`;
        
        // The actual path keeps the spaces
        const path = `monster-parts/${monsterType}/${part}.png`;
        
        if (!this.scene.textures.exists(safeKey)) {
          this.scene.load.image(safeKey, path);
          totalParts++;
        }
      }
    }
    
    console.log(`🎮 Loaded ${totalParts} monster parts from ${Object.keys(ACTUAL_MONSTER_PARTS).length} monsters`);
  }
  
  /**
   * Get texture key for a part (handles spaces)
   */
  static getPartKey(monsterType: string, partName: string): string {
    return `${monsterType}_${partName.replace(/ /g, '_').toLowerCase()}`;
  }
  
  /**
   * Check if a part exists
   */
  partExists(monsterType: string, partName: string): boolean {
    const key = DynamicPartLoader.getPartKey(monsterType, partName);
    return this.scene.textures.exists(key);
  }
  
  /**
   * Find any part matching a pattern
   */
  findPart(monsterType: string, patterns: string[]): string | null {
    const parts = ACTUAL_MONSTER_PARTS[monsterType];
    if (!parts) return null;
    
    for (const pattern of patterns) {
      const lowerPattern = pattern.toLowerCase();
      const found = parts.find(p => p.toLowerCase().includes(lowerPattern));
      if (found) {
        return DynamicPartLoader.getPartKey(monsterType, found);
      }
    }
    
    return null;
  }
  
  /**
   * Get all available monster types
   */
  static getAvailableMonsterTypes(): string[] {
    return Object.keys(ACTUAL_MONSTER_PARTS);
  }
  
  /**
   * Get ALL leg textures from all monsters
   */
  static getAllLegs(): string[] {
    const legs: string[] = [];
    const legPatterns = ['leg', 'foot', 'feet', 'limb'];
    
    for (const [monsterType, parts] of Object.entries(ACTUAL_MONSTER_PARTS)) {
      for (const part of parts) {
        const lowerPart = part.toLowerCase();
        // Check if this part is a leg
        if (legPatterns.some(pattern => lowerPart.includes(pattern))) {
          const safeKey = this.getPartKey(monsterType, part);
          legs.push(safeKey);
        }
      }
    }
    
    return legs;
  }
  
  /**
   * Get ALL hand textures from all monsters
   */
  static getAllHands(): string[] {
    const hands: string[] = [];
    const handPatterns = ['hand', 'fist', 'claw', 'paw'];
    
    for (const [monsterType, parts] of Object.entries(ACTUAL_MONSTER_PARTS)) {
      for (const part of parts) {
        const lowerPart = part.toLowerCase();
        // Check if this part is a hand
        if (handPatterns.some(pattern => lowerPart.includes(pattern))) {
          const safeKey = this.getPartKey(monsterType, part);
          hands.push(safeKey);
        }
      }
    }
    
    return hands;
  }
  
  /**
   * Get ALL arm textures from all monsters
   */
  static getAllArms(): string[] {
    const arms: string[] = [];
    const armPatterns = ['arm', 'upper_arm', 'limb'];
    
    for (const [monsterType, parts] of Object.entries(ACTUAL_MONSTER_PARTS)) {
      for (const part of parts) {
        const lowerPart = part.toLowerCase();
        // Check if this part is an arm
        if (armPatterns.some(pattern => lowerPart.includes(pattern)) && 
            !lowerPart.includes('leg')) { // Exclude legs
          const safeKey = this.getPartKey(monsterType, part);
          arms.push(safeKey);
        }
      }
    }
    
    return arms;
  }
}
