import Phaser from 'phaser';
import { TILE_SIZE } from '../world/TileTypes';

export enum PheromoneType {
  DO_NOT_MINE = 'do_not_mine',
  MINE_HERE = 'mine_here',
  SAFE_ZONE = 'safe_zone',
  DANGER_ZONE = 'danger_zone'
}

export interface PheromoneMarker {
  id: string;
  x: number; // World pixel coordinates
  y: number;
  tileX: number; // Tile coordinates  
  tileY: number;
  type: PheromoneType;
  strength: number; // 0-100, affects how strongly monsters react
  decay: number; // How fast the pheromone fades (0 = permanent)
  timestamp: number;
  playerPlaced: boolean; // true if placed by player, false if automatic
}

export class PheromoneSystem {
  private scene: Phaser.Scene;
  private pheromones: Map<string, PheromoneMarker>;
  private pheromoneSprites: Map<string, Phaser.GameObjects.Graphics>;
  private pheromoneIdCounter: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.pheromones = new Map();
    this.pheromoneSprites = new Map();
    this.pheromoneIdCounter = 0;
  }

  /**
   * Add a pheromone marker at a specific tile location
   */
  addPheromone(tileX: number, tileY: number, type: PheromoneType, 
               strength: number = 100, decay: number = 0, playerPlaced: boolean = true): string {
    
    const pheromoneId = `pheromone_${this.pheromoneIdCounter++}`;
    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;
    
    const pheromone: PheromoneMarker = {
      id: pheromoneId,
      x: worldX,
      y: worldY,
      tileX,
      tileY,
      type,
      strength,
      decay,
      timestamp: Date.now(),
      playerPlaced
    };
    
    this.pheromones.set(pheromoneId, pheromone);
    this.createPheromoneVisual(pheromone);
    
    console.log(`Pheromone placed: ${type} at tile (${tileX}, ${tileY}) with strength ${strength}`);
    return pheromoneId;
  }

  /**
   * Remove a pheromone marker
   */
  removePheromone(pheromoneId: string): void {
    const pheromone = this.pheromones.get(pheromoneId);
    if (pheromone) {
      // Remove visual
      const sprite = this.pheromoneSprites.get(pheromoneId);
      if (sprite) {
        sprite.destroy();
        this.pheromoneSprites.delete(pheromoneId);
      }
      
      this.pheromones.delete(pheromoneId);
      console.log(`Removed pheromone: ${pheromone.type} at (${pheromone.tileX}, ${pheromone.tileY})`);
    }
  }

  /**
   * Check if a tile has a specific pheromone type
   */
  hasPheromone(tileX: number, tileY: number, type?: PheromoneType): boolean {
    for (const pheromone of this.pheromones.values()) {
      if (pheromone.tileX === tileX && pheromone.tileY === tileY) {
        if (!type || pheromone.type === type) {
          return pheromone.strength > 0; // Only count if still has strength
        }
      }
    }
    return false;
  }

  /**
   * Get the strongest pheromone at a tile location
   */
  getPheromoneAt(tileX: number, tileY: number): PheromoneMarker | null {
    let strongest: PheromoneMarker | null = null;
    
    for (const pheromone of this.pheromones.values()) {
      if (pheromone.tileX === tileX && pheromone.tileY === tileY) {
        if (!strongest || pheromone.strength > strongest.strength) {
          strongest = pheromone;
        }
      }
    }
    
    return strongest && strongest.strength > 0 ? strongest : null;
  }

  /**
   * Check if mining is forbidden at a location
   */
  isMiningForbidden(tileX: number, tileY: number): boolean {
    return this.hasPheromone(tileX, tileY, PheromoneType.DO_NOT_MINE);
  }

  /**
   * Check if mining is encouraged at a location  
   */
  isMiningEncouraged(tileX: number, tileY: number): boolean {
    return this.hasPheromone(tileX, tileY, PheromoneType.MINE_HERE);
  }

  /**
   * Create default "do not mine" pheromones under the hive to protect the platform
   */
  protectHivePlatform(hiveX: number, hiveY: number): void {
    const hiveTileX = Math.floor(hiveX / TILE_SIZE);
    const hiveTileY = Math.floor(hiveY / TILE_SIZE);
    
    console.log(`Protecting hive platform at tile (${hiveTileX}, ${hiveTileY})`);
    
    // Create "do not mine" pheromones for ONLY 3 blocks horizontally under the hive (much smaller!)
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      const protectTileX = hiveTileX + offsetX;
      const protectTileY = hiveTileY + 1; // One tile below hive
      
      // Create weaker "do not mine" pheromone - just to protect the hive platform
      this.addPheromone(
        protectTileX, 
        protectTileY,
        PheromoneType.DO_NOT_MINE,
        50,  // Reduced strength
        0,    // No decay - permanent
        false // Not player-placed, it's automatic protection
      );
    }
  }

  /**
   * Update pheromone system - handle decay and visual updates
   */
  update(deltaTime: number): void {
    const currentTime = Date.now();
    const toRemove: string[] = [];
    
    for (const [id, pheromone] of this.pheromones.entries()) {
      // Handle decay for non-permanent pheromones
      if (pheromone.decay > 0) {
        const age = (currentTime - pheromone.timestamp) / 1000; // Age in seconds
        const decayAmount = pheromone.decay * deltaTime;
        pheromone.strength = Math.max(0, pheromone.strength - decayAmount);
        
        // Mark for removal if strength depleted
        if (pheromone.strength <= 0) {
          toRemove.push(id);
        }
      }
      
      // Update visual based on current strength
      this.updatePheromoneVisual(pheromone);
    }
    
    // Remove depleted pheromones
    toRemove.forEach(id => this.removePheromone(id));
  }

  /**
   * Create visual representation of pheromone
   */
  private createPheromoneVisual(pheromone: PheromoneMarker): void {
    const visual = this.scene.add.graphics();
    visual.setDepth(1500); // Above ground but below UI
    visual.setScrollFactor(1); // Moves with camera
    
    this.pheromoneSprites.set(pheromone.id, visual);
    this.updatePheromoneVisual(pheromone);
  }

  /**
   * Update visual appearance based on pheromone properties
   */
  private updatePheromoneVisual(pheromone: PheromoneMarker): void {
    const visual = this.pheromoneSprites.get(pheromone.id);
    if (!visual) return;
    
    visual.clear();
    
    // Set position
    visual.x = pheromone.x;
    visual.y = pheromone.y;
    
    // Calculate alpha based on strength
    const alpha = (pheromone.strength / 100) * 0.7; // Max 70% opacity
    
    // Different colors and shapes for different pheromone types
    switch (pheromone.type) {
      case PheromoneType.DO_NOT_MINE:
        // Red X pattern for "do not mine"
        visual.lineStyle(2, 0xFF4444, alpha);
        visual.moveTo(-6, -6);
        visual.lineTo(6, 6);
        visual.moveTo(-6, 6);
        visual.lineTo(6, -6);
        
        // Red border around tile
        visual.lineStyle(1, 0xFF4444, alpha * 0.5);
        visual.strokeRect(-TILE_SIZE/2, -TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
        break;
        
      case PheromoneType.MINE_HERE:
        // Green mining pick icon
        visual.lineStyle(2, 0x44FF44, alpha);
        visual.moveTo(-4, 4);
        visual.lineTo(0, -4);
        visual.lineTo(4, 4);
        
        // Green highlight around tile
        visual.fillStyle(0x44FF44, alpha * 0.2);
        visual.fillRect(-TILE_SIZE/2, -TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
        break;
        
      case PheromoneType.SAFE_ZONE:
        // Blue circle for safe zone
        visual.fillStyle(0x4444FF, alpha * 0.3);
        visual.fillCircle(0, 0, TILE_SIZE/3);
        visual.lineStyle(1, 0x4444FF, alpha);
        visual.strokeCircle(0, 0, TILE_SIZE/3);
        break;
        
      case PheromoneType.DANGER_ZONE:
        // Orange/yellow warning triangle
        visual.fillStyle(0xFF8800, alpha * 0.3);
        visual.fillTriangle(0, -6, -6, 6, 6, 6);
        visual.lineStyle(2, 0xFF8800, alpha);
        visual.strokeTriangle(0, -6, -6, 6, 6, 6);
        break;
    }
  }

  /**
   * Get all pheromones (for debugging or UI)
   */
  getAllPheromones(): PheromoneMarker[] {
    return Array.from(this.pheromones.values());
  }

  /**
   * Clear all pheromones of a specific type
   */
  clearPheromoneType(type: PheromoneType): void {
    const toRemove: string[] = [];
    
    for (const [id, pheromone] of this.pheromones.entries()) {
      if (pheromone.type === type) {
        toRemove.push(id);
      }
    }
    
    toRemove.forEach(id => this.removePheromone(id));
    console.log(`Cleared all ${type} pheromones (${toRemove.length} removed)`);
  }

  /**
   * Get pheromone count by type (for UI display)
   */
  getPheromoneCount(type?: PheromoneType): number {
    if (!type) {
      return this.pheromones.size;
    }
    
    let count = 0;
    for (const pheromone of this.pheromones.values()) {
      if (pheromone.type === type) {
        count++;
      }
    }
    return count;
  }
}
