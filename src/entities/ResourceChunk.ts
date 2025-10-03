import Phaser from 'phaser';
import { TileType } from '../world/TileTypes';

export enum ChunkSize {
  SMALL = 'small',   // 1/4 of original - light, easy to carry
  LARGE = 'large'    // 1/2 of original - heavy, needs cooperation
}

export interface ResourceChunk {
  id: string;
  x: number;
  y: number;
  tileType: TileType;
  resourceValue: number;
  size: ChunkSize;
  weight: number;
  carriersNeeded: number;
  currentCarriers: string[]; // Monster IDs currently carrying this chunk
  sprite: Phaser.GameObjects.Sprite;
  
  // Physics properties for gravity
  velocityX: number;
  velocityY: number;
  onGround: boolean;
  isBeingCarried: boolean;
  
  // Public physics accessors for throwing
  vx: number;
  vy: number;
}

export class ResourceChunkManager {
  public chunks: Map<string, ResourceChunk>; // Made public for throwing mechanics
  private scene: Phaser.Scene;
  private chunkIdCounter: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.chunkIdCounter = 0;
  }

  /**
   * Create resource chunks when a tile is mined
   */
  createChunksFromTile(tileType: TileType, tileX: number, tileY: number, resourceValue: number): ResourceChunk[] {
    const createdChunks: ResourceChunk[] = [];
    
    // Determine how many chunks to create and their properties
    const chunkData = this.getChunkDataForTile(tileType, resourceValue);
    
    for (let i = 0; i < chunkData.count; i++) {
      const chunkId = `chunk_${this.chunkIdCounter++}`;
      
      // Position chunks around the mined tile
      const angle = (i / chunkData.count) * Math.PI * 2;
      const radius = 8 + Math.random() * 8; // Scatter chunks slightly
      const chunkX = (tileX * 16) + 8 + Math.cos(angle) * radius;
      const chunkY = (tileY * 16) + 8 + Math.sin(angle) * radius;
      
      const chunk: ResourceChunk = {
        id: chunkId,
        x: chunkX,
        y: chunkY,
        tileType: tileType,
        size: chunkData.size,
        weight: chunkData.weight,
        resourceValue: Math.max(1, Math.floor(resourceValue / chunkData.count)), // MINIMUM 1 resource per chunk
        carriersNeeded: this.calculateCarriersNeeded(chunkData.weight),
        currentCarriers: [],
        sprite: this.createChunkSprite(chunkX, chunkY, tileType, chunkData.size),
        
        // Initialize physics properties for gravity - REDUCED CHAOS
        velocityX: (Math.random() - 0.5) * 8,  // Much smaller random horizontal velocity
        velocityY: -5 + Math.random() * 3,     // Gentler upward velocity from mining
        onGround: false,
        isBeingCarried: false,
        
        // Public physics accessors for throwing
        vx: 0,
        vy: 0
      };
      
      this.chunks.set(chunkId, chunk);
      createdChunks.push(chunk);
    }
    
    return createdChunks;
  }

  /**
   * Determine chunk properties based on tile type - MUCH HEAVIER for teamwork!
   */
  private getChunkDataForTile(tileType: TileType, resourceValue: number): {
    count: number;
    size: ChunkSize;
    weight: number;
  } {
    const random = Math.random();
    
    switch (tileType) {
      case TileType.DIRT:
        // Dirt is LIGHTEST - easy to carry, monster barely slowed
        return {
          count: random < 0.5 ? 2 : 3,
          size: ChunkSize.SMALL,  // Always small
          weight: random < 0.5 ? 12 : 8  // Light: 8-12 weight
        };
        
      case TileType.STONE:
        // Stone is MEDIUM weight - noticeable slowdown
        return {
          count: random < 0.7 ? 2 : 3,
          size: random < 0.7 ? ChunkSize.LARGE : ChunkSize.SMALL,
          weight: random < 0.7 ? 40 : 25  // Medium: 25-40 weight
        };
        
      case TileType.ORE_COPPER:
        // Copper is HEAVIEST (denser than stone) - significant slowdown
        return {
          count: random < 0.8 ? 2 : 3,
          size: ChunkSize.LARGE,
          weight: random < 0.8 ? 70 : 50  // Heavy: 50-70 weight
        };
        
      case TileType.ORE_IRON:
        // Iron even heavier than copper
        return {
          count: random < 0.8 ? 2 : 3,
          size: ChunkSize.LARGE,
          weight: 80 + (resourceValue * 3)  // Very heavy: 80+ weight
        };
        
      case TileType.ORE_GOLD:
        // Gold is extremely dense!
        return {
          count: random < 0.8 ? 2 : 3,
          size: ChunkSize.LARGE,
          weight: 100 + (resourceValue * 5)  // Extremely heavy: 100+ weight
        };
        
      case TileType.ROCK:
        // Rock is heavy but lighter than ores
        return {
          count: random < 0.9 ? 2 : 3,
          size: ChunkSize.LARGE,
          weight: random < 0.9 ? 55 : 35  // Heavy: 35-55 weight
        };
        
      case TileType.CRYSTAL:
        // Crystals are fragile but surprisingly heavy when large
        return {
          count: random < 0.6 ? 2 : 4,
          size: random < 0.6 ? ChunkSize.LARGE : ChunkSize.SMALL,
          weight: random < 0.6 ? 65 : 25  // Much heavier (was 20)
        };
        
      default:
        return {
          count: 3,
          size: ChunkSize.SMALL,
          weight: 25  // Heavier default (was 10)
        };
    }
  }

  /**
   * Calculate how many monsters are needed to carry a chunk - MUCH MORE TEAMWORK REQUIRED!
   */
  private calculateCarriersNeeded(weight: number): number {
    if (weight <= 25) return 1;      // Only very light chunks - 1 monster
    if (weight <= 45) return 2;      // Medium chunks - 2 monsters
    if (weight <= 70) return 3;      // Heavy chunks - 3 monsters  
    return 4;                        // Super heavy chunks - 4 monsters working together!
  }

  /**
   * Create visual sprite for chunk
   */
  private createChunkSprite(x: number, y: number, tileType: TileType, size: ChunkSize): Phaser.GameObjects.Sprite {
    const graphics = this.scene.add.graphics();
    
    // Get color based on tile type
    const colors: Record<TileType, number> = {
      [TileType.AIR]: 0x000000,
      [TileType.DIRT]: 0x8B4513,
      [TileType.STONE]: 0x708090,
      [TileType.ROCK]: 0x2F4F4F,
      [TileType.ORE_COPPER]: 0xB87333,
      [TileType.ORE_IRON]: 0x464451,
      [TileType.ORE_GOLD]: 0xFFD700,
      [TileType.CRYSTAL]: 0xFF69B4,
      [TileType.WATER]: 0x4169E1,
      [TileType.LAVA]: 0xFF4500,
      [TileType.BEDROCK]: 0x000000
    };
    
    const color = colors[tileType] || 0x808080;
    const chunkSize = size === ChunkSize.LARGE ? 12 : 8; // Much bigger chunks (was 6/4)
    
    graphics.fillStyle(color);
    graphics.fillRect(0, 0, chunkSize, chunkSize);
    
    // Add texture based on size and weight
    if (size === ChunkSize.LARGE) {
      // Heavy chunks have more detailed texture
      graphics.fillStyle(color, 0.7);
      graphics.fillRect(1, 1, chunkSize - 2, chunkSize - 2);
      
      // Add weight indicator lines for heavy chunks
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillRect(2, chunkSize/3, chunkSize - 4, 1);
      graphics.fillRect(2, 2*chunkSize/3, chunkSize - 4, 1);
    } else {
      // Small chunks have simpler texture
      graphics.fillStyle(color, 0.8);
      graphics.fillRect(1, 1, chunkSize - 2, chunkSize - 2);
    }
    
    // Convert graphics to texture and create sprite
    const textureKey = `chunk_${tileType}_${size}_${Date.now()}`;
    const texture = graphics.generateTexture(textureKey, chunkSize, chunkSize);
    graphics.destroy();
    
    const sprite = this.scene.add.sprite(x, y, textureKey);
    sprite.setDepth(y + 100); // Above ground but below monsters
    
    return sprite;
  }

  /**
   * Get all chunks in the world
   */
  getAllChunks(): ResourceChunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Get chunks near a position
   */
  getChunksNear(x: number, y: number, radius: number): ResourceChunk[] {
    return this.getAllChunks().filter(chunk => {
      const dx = chunk.x - x;
      const dy = chunk.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius;
    });
  }

  /**
   * Get the closest uncarried chunk to a position
   */
  getClosestAvailableChunk(x: number, y: number): ResourceChunk | null {
    let closest: ResourceChunk | null = null;
    let closestDistance = Infinity;

    for (const chunk of this.chunks.values()) {
      if (!chunk.isBeingCarried || chunk.currentCarriers.length < chunk.carriersNeeded) {
        const dx = chunk.x - x;
        const dy = chunk.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < closestDistance) {
          closest = chunk;
          closestDistance = distance;
        }
      }
    }

    return closest;
  }

  /**
   * Add a monster as a carrier for a chunk
   */
  addCarrier(chunkId: string, monsterId: string): boolean {
    const chunk = this.chunks.get(chunkId);
    if (!chunk || chunk.currentCarriers.includes(monsterId)) {
      return false;
    }

    chunk.currentCarriers.push(monsterId);
    
    if (chunk.currentCarriers.length >= chunk.carriersNeeded) {
      chunk.isBeingCarried = true;
    }

    return true;
  }

  /**
   * Remove a monster as a carrier
   */
  removeCarrier(chunkId: string, monsterId: string): void {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return;

    const index = chunk.currentCarriers.indexOf(monsterId);
    if (index !== -1) {
      chunk.currentCarriers.splice(index, 1);
    }

    if (chunk.currentCarriers.length < chunk.carriersNeeded) {
      chunk.isBeingCarried = false;
    }
  }

  /**
   * Move a chunk (when being carried)
   */
  moveChunk(chunkId: string, newX: number, newY: number): void {
    const chunk = this.chunks.get(chunkId);
    if (!chunk || !chunk.isBeingCarried) return;

    chunk.x = newX;
    chunk.y = newY;
    
    if (chunk.sprite) {
      chunk.sprite.x = newX;
      chunk.sprite.y = newY;
      chunk.sprite.setDepth(newY + 100);
    }
  }

  /**
   * Remove chunk from world (when deposited at hive)
   */
  removeChunk(chunkId: string): ResourceChunk | null {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return null;

    // Clean up sprite
    if (chunk.sprite) {
      chunk.sprite.destroy();
    }

    this.chunks.delete(chunkId);
    return chunk;
  }

  /**
   * Update chunk physics and visuals
   */
  update(): void {
    const deltaTime = 1/60; // Assume 60fps for consistent physics
    const gravity = 400;    // Gravity strength
    const groundFriction = 0.8;
    const airResistance = 0.98;
    const bounceReduction = 0.3;

    for (const chunk of this.chunks.values()) {
      // Sync public physics properties with internal ones
      if (chunk.vx !== 0 || chunk.vy !== 0) {
        chunk.velocityX = chunk.vx;
        chunk.velocityY = chunk.vy;
        chunk.vx = 0; // Reset after applying
        chunk.vy = 0;
      }
      
      // Only apply physics if chunk is not being carried
      if (!chunk.isBeingCarried) {
        this.updateChunkPhysics(chunk, deltaTime, gravity, groundFriction, airResistance, bounceReduction);
      }

      // Update visual effects
      if (chunk.sprite) {
        // Update sprite position to match physics position
        chunk.sprite.x = chunk.x;
        chunk.sprite.y = chunk.y;

        // Add carrying effect if being carried or thrown
        if (chunk.isBeingCarried) {
          chunk.sprite.setTint(0xFFFFAA); // Yellow tint when carried
        } else if (Math.abs(chunk.velocityY) > 100) {
          chunk.sprite.setTint(0xAAFFAA); // Green tint when flying through air
        } else {
          chunk.sprite.clearTint();
        }
      }
    }
  }

  /**
   * Get gravity multiplier based on material type - heavier materials fall faster!
   * Hierarchy: Dirt (lightest) < Stone (medium) < Copper (heaviest)
   */
  private getGravityMultiplier(tileType: TileType): number {
    switch (tileType) {
      case TileType.DIRT:
        return 1.0; // LIGHTEST - floats down gently
        
      case TileType.STONE:
        return 1.4; // MEDIUM - noticeable drop
        
      case TileType.ORE_COPPER:
        return 2.0; // HEAVIEST (from basic materials) - drops fast!
        
      case TileType.ROCK:
        return 1.6; // Heavy but lighter than copper
        
      case TileType.ORE_IRON:
        return 2.2; // Denser than copper
        
      case TileType.ORE_GOLD:
        return 2.5; // Gold is extremely dense!
        
      case TileType.CRYSTAL:
        return 1.3; // Lighter than stone but still solid
        
      default:
        return 1.0; // Default to dirt weight
    }
  }

  /**
   * Apply gravity and collision physics to a single chunk - FIXED BOUNCING!
   */
  private updateChunkPhysics(chunk: ResourceChunk, deltaTime: number, gravity: number, 
                            groundFriction: number, airResistance: number, bounceReduction: number): void {
    
    // If chunk is settled on ground and barely moving, keep it still
    if (chunk.onGround && Math.abs(chunk.velocityX) < 2 && Math.abs(chunk.velocityY) < 2) {
      chunk.velocityX = 0;
      chunk.velocityY = 0;
      return; // Don't apply any more physics - chunk is at rest!
    }
    
    // Material-specific gravity multipliers - heavier materials fall faster!
    const gravityMultiplier = this.getGravityMultiplier(chunk.tileType);
    const materialGravity = gravity * gravityMultiplier;
    
    // Apply gravity if not on ground
    if (!chunk.onGround) {
      chunk.velocityY += materialGravity * deltaTime;
      
      // Air resistance (heavier materials have less air resistance)
      const materialAirResistance = airResistance + ((1 - airResistance) * (gravityMultiplier - 1) * 0.3);
      chunk.velocityX *= materialAirResistance;
      
      // Terminal velocity increases with weight
      const terminalVelocity = 300 * gravityMultiplier;
      chunk.velocityY = Math.min(chunk.velocityY, terminalVelocity);
    } else {
      // On ground - apply strong friction to settle quickly
      chunk.velocityX *= 0.7; // Strong ground friction
      chunk.velocityY = Math.max(0, chunk.velocityY); // No upward movement when on ground
    }
    
    // Calculate new position
    const newX = chunk.x + chunk.velocityX * deltaTime;
    const newY = chunk.y + chunk.velocityY * deltaTime;
    
    // Check collision with world tiles
    const collision = this.checkChunkCollision(newX, newY);
    
    if (collision.hitGround) {
      // Hit ground - PREVENT BOUNCING by killing all velocity
      chunk.onGround = true;
      chunk.velocityY = 0; // No bouncing!
      chunk.velocityX *= 0.5; // Heavy friction on impact
      chunk.y = collision.groundY;
      
      // Settle immediately if moving very slowly
      if (Math.abs(chunk.velocityX) < 8) {
        chunk.velocityX = 0;
      }
    } else if (collision.hitWall) {
      // Hit wall - greatly reduce bouncing
      chunk.velocityX *= -0.1; // Much less bouncing (was -0.3)
      chunk.x = newX; // Still allow position update
    } else {
      // Free movement - but check if we left the ground
      const wasOnGround = chunk.onGround;
      chunk.x = newX;
      chunk.y = newY;
      
      // Only set onGround to false if we're actually moving upward or away from ground
      if (wasOnGround && chunk.velocityY > 10) {
        chunk.onGround = false;
      } else if (!wasOnGround) {
        chunk.onGround = false;
      }
    }
  }

  /**
   * Check collision between chunk and world tiles - IMPROVED ACCURACY
   */
  private checkChunkCollision(x: number, y: number): { hitGround: boolean; hitWall: boolean; groundY: number } {
    const tileSize = 16; // Assuming 16x16 tiles
    const chunkRadius = 6; // Slightly larger radius for better collision detection
    
    // Check tile below chunk
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor((y + chunkRadius) / tileSize);
    
    // Get the GameScene to check tile collision
    const scene = this.scene as any; // Type assertion to access world
    if (scene.world && scene.checkTileCollision) {
      // Check multiple points below the chunk for better ground detection
      const belowCenter = scene.checkTileCollision(x, y + chunkRadius + 2);
      const belowLeft = scene.checkTileCollision(x - chunkRadius/2, y + chunkRadius + 2);
      const belowRight = scene.checkTileCollision(x + chunkRadius/2, y + chunkRadius + 2);
      
      // Hit ground if any bottom point hits a solid tile
      if (belowCenter || belowLeft || belowRight) {
        return { 
          hitGround: true, 
          hitWall: false, 
          groundY: tileY * tileSize - chunkRadius - 1 // Slightly above tile surface
        };
      }
      
      // Check side collision
      const sideLeft = scene.checkTileCollision(x - chunkRadius, y);
      const sideRight = scene.checkTileCollision(x + chunkRadius, y);
      
      if (sideLeft || sideRight) {
        return { 
          hitGround: false, 
          hitWall: true, 
          groundY: y 
        };
      }
    }
    
    // Simple boundary collision if world access fails
    if (y > 800) { // Ground level fallback
      return { 
        hitGround: true, 
        hitWall: false, 
        groundY: 800 - chunkRadius 
      };
    }
    
    return { hitGround: false, hitWall: false, groundY: y };
  }
}
