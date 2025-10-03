/**
 * TerrariaTileRenderer - Terraria-style autotiling system
 * Handles edge detection, fog of war, and dynamic tile updates
 * 
 * Key concepts:
 * - Dugout/mined areas show simple gray background (no patterns)
 * - Solid blocks have edge sprites with light sides facing dugout voids
 * - Progressive fog of war based on distance from dug-out areas:
 *   - Layer 0 (dug out): Fully visible
 *   - Layer 1 (adjacent): Clear view
 *   - Layer 2: Somewhat obscured (30% dark overlay)
 *   - Layer 3: More obscured (60% dark overlay)
 *   - Layer 4+: Completely black
 * - Tiles dynamically update edges when neighbors are mined
 */

import { TileType } from '../world/TileTypes';

interface EdgeConfig {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
}

export class TerrariaTileRenderer {
  private scene: Phaser.Scene;
  private tileSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private fogSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private backgroundCreated: boolean = false;
  private visibilityCache: Map<string, number> = new Map(); // Cache for distance calculations
  
  // Map edge configurations to specific tile sprites
  // These should be from the swamp-cave tileset with appropriate edges
  private readonly EDGE_MAPPINGS: { [key: string]: string } = {
    // Format: "TRBL" (Top-Right-Bottom-Left) where 1 = exposed edge, 0 = solid neighbor
    "0000": "Tile_07",  // Fully surrounded (no edges)
    "1000": "Tile_59",  // Top edge only
    "0100": "Tile_60",  // Right edge only  
    "0010": "Tile_61",  // Bottom edge only
    "0001": "Tile_62",  // Left edge only
    
    // Corners (two edges)
    "1100": "Tile_63",  // Top-right corner
    "1001": "Tile_64",  // Top-left corner
    "0110": "Tile_65",  // Bottom-right corner
    "0011": "Tile_01",  // Bottom-left corner
    
    // Three edges
    "1110": "Tile_02",  // Only left solid
    "1101": "Tile_03",  // Only bottom solid
    "1011": "Tile_04",  // Only right solid
    "0111": "Tile_05",  // Only top solid
    
    // All edges exposed
    "1111": "Tile_06",  // Isolated block
    
    // Special cases (opposite edges)
    "1010": "Tile_08",  // Top and bottom edges
    "0101": "Tile_09",  // Left and right edges
  };
  
  // Base material tiles (center tiles without edges)
  private readonly MATERIAL_TILES: { [key: string]: string[] } = {
    [TileType.STONE]: ["Tile_12", "Tile_13", "Tile_14"],
    [TileType.ROCK]: ["Tile_12", "Tile_13", "Tile_14"],
    [TileType.DIRT]: ["Tile_15", "Tile_16", "Tile_17"],
    [TileType.ORE_COPPER]: ["Tile_18", "Tile_19"],
    [TileType.ORE_IRON]: ["Tile_20", "Tile_21"],
    [TileType.ORE_GOLD]: ["Tile_22", "Tile_23"],
    [TileType.CRYSTAL]: ["Tile_24", "Tile_25"],
    [TileType.BEDROCK]: ["Tile_26"]
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Preload all tile sprites
   */
  preloadTiles(): void {
    // Load individual tile sprites (only 64 exist, not 65)
    for (let i = 1; i <= 64; i++) {
      const tileName = `Tile_${i.toString().padStart(2, '0')}`;
      this.scene.load.image(tileName, `tiles/swamp-cave/${tileName}.png`);
    }
  }

  /**
   * Create the simple gray background for dugout areas
   */
  createBackground(width: number, height: number, tileSize: number): void {
    if (this.backgroundCreated) return;
    
    // Simple dark gray background - no patterns!
    const bg = this.scene.add.rectangle(
      width * tileSize / 2,
      height * tileSize / 2,
      width * tileSize,
      height * tileSize,
      0x2a2a2a  // Dark gray color
    );
    bg.setDepth(-10);
    bg.setScrollFactor(1);
    
    this.backgroundCreated = true;
  }

  /**
   * Check if a tile position is empty (air) and discovered
   */
  private isEmptyAndDiscovered(tiles: any[][], x: number, y: number): boolean {
    if (x < 0 || x >= tiles.length || y < 0 || y >= tiles[0].length) {
      return false; // Out of bounds = not discovered
    }
    
    const tile = tiles[x]?.[y];
    if (!tile?.discovered) return false;
    
    const tileType = tile.type !== undefined ? tile.type : tile;
    return tileType === TileType.AIR || tileType === 'air' || tileType === 0;
  }

  /**
   * Calculate visibility layer based on distance from dug-out areas
   * Returns 0 for dug out, 1-3 for progressive obscuring, 4+ for completely black
   */
  private calculateVisibilityLayer(tiles: any[][], x: number, y: number): number {
    const cacheKey = `${x}_${y}`;
    
    // Check cache first
    if (this.visibilityCache.has(cacheKey)) {
      return this.visibilityCache.get(cacheKey)!;
    }
    
    // If tile is dug out (air), it's fully visible
    const tile = tiles[x]?.[y];
    if (!tile) {
      this.visibilityCache.set(cacheKey, 4);
      return 4;
    }
    
    const tileType = tile.type !== undefined ? tile.type : tile;
    if (tileType === TileType.AIR || tileType === 'air' || tileType === 0) {
      this.visibilityCache.set(cacheKey, 0);
      return 0; // Fully visible
    }
    
    // Use BFS to find distance to nearest dug-out tile
    const distance = this.calculateDistanceToDugOut(tiles, x, y);
    this.visibilityCache.set(cacheKey, distance);
    return distance;
  }

  /**
   * Calculate minimum distance to any dug-out (AIR) tile using BFS
   * Optimized to only search up to distance 4
   */
  private calculateDistanceToDugOut(tiles: any[][], startX: number, startY: number): number {
    const maxDistance = 4;
    const visited = new Set<string>();
    const queue: Array<{x: number, y: number, dist: number}> = [{x: startX, y: startY, dist: 0}];
    
    visited.add(`${startX}_${startY}`);
    
    while (queue.length > 0) {
      const {x, y, dist} = queue.shift()!;
      
      // Check if we've reached max distance
      if (dist >= maxDistance) {
        return maxDistance;
      }
      
      // Check all 4 adjacent tiles (no diagonals for more natural spreading)
      const neighbors = [
        {x: x, y: y - 1},  // top
        {x: x + 1, y: y},  // right
        {x: x, y: y + 1},  // bottom
        {x: x - 1, y: y}   // left
      ];
      
      for (const neighbor of neighbors) {
        const {x: nx, y: ny} = neighbor;
        const key = `${nx}_${ny}`;
        
        // Skip if out of bounds or already visited
        if (nx < 0 || nx >= tiles.length || ny < 0 || ny >= tiles[0].length) continue;
        if (visited.has(key)) continue;
        
        visited.add(key);
        
        const neighborTile = tiles[nx]?.[ny];
        if (!neighborTile) continue;
        
        const neighborType = neighborTile.type !== undefined ? neighborTile.type : neighborTile;
        
        // If we found a dug-out tile, return the distance
        if (neighborType === TileType.AIR || neighborType === 'air' || neighborType === 0) {
          return dist + 1;
        }
        
        // Continue searching from this tile
        queue.push({x: nx, y: ny, dist: dist + 1});
      }
    }
    
    // No dug-out tile found within maxDistance
    return maxDistance;
  }

  /**
   * Get the edge configuration for a tile
   */
  private getEdgeConfig(tiles: any[][], x: number, y: number): EdgeConfig {
    return {
      top: this.isEmptyAndDiscovered(tiles, x, y - 1),
      right: this.isEmptyAndDiscovered(tiles, x + 1, y),
      bottom: this.isEmptyAndDiscovered(tiles, x, y + 1),
      left: this.isEmptyAndDiscovered(tiles, x - 1, y),
      topLeft: this.isEmptyAndDiscovered(tiles, x - 1, y - 1),
      topRight: this.isEmptyAndDiscovered(tiles, x + 1, y - 1),
      bottomLeft: this.isEmptyAndDiscovered(tiles, x - 1, y + 1),
      bottomRight: this.isEmptyAndDiscovered(tiles, x + 1, y + 1)
    };
  }

  /**
   * Convert edge configuration to string key for mapping
   */
  private edgeConfigToKey(edges: EdgeConfig): string {
    const top = edges.top ? "1" : "0";
    const right = edges.right ? "1" : "0";
    const bottom = edges.bottom ? "1" : "0";
    const left = edges.left ? "1" : "0";
    return `${top}${right}${bottom}${left}`;
  }

  /**
   * Get the appropriate edge tile based on configuration
   */
  private getEdgeTile(edges: EdgeConfig): string {
    const key = this.edgeConfigToKey(edges);
    return this.EDGE_MAPPINGS[key] || this.EDGE_MAPPINGS["0000"];
  }

  /**
   * Get base material tile with variation
   */
  private getMaterialTile(tileType: TileType | string, x: number, y: number): string | null {
    const tiles = this.MATERIAL_TILES[tileType as string];
    if (!tiles || tiles.length === 0) return null;
    
    // Use position-based pseudo-random for consistent tiles
    const hash = (x * 73856093) ^ (y * 19349663);
    const index = Math.abs(hash) % tiles.length;
    return tiles[index];
  }

  /**
   * Main render function for a single tile
   */
  renderTile(x: number, y: number, tile: any, tileSize: number, world?: any[][]): Phaser.GameObjects.Container | null {
    const tileKey = `tile_${x}_${y}`;
    
    // Clean up existing sprites
    if (this.tileSprites.has(tileKey)) {
      this.tileSprites.get(tileKey)?.destroy();
      this.tileSprites.delete(tileKey);
    }

    // Calculate visibility layer if world is provided
    let visibilityLayer = 4; // Default to completely black
    if (world) {
      visibilityLayer = this.calculateVisibilityLayer(world, x, y);
    }

    // Handle completely obscured tiles (layer 4+) - but only if truly far from any dug area
    if (visibilityLayer >= 4) {
      return this.renderFogOfWar(x, y, tileSize, 4);
    }

    // Remove complete fog if it exists (tile is within visibility range)
    this.removeFog(x, y);

    // Handle empty/air tiles - just show background (no patterns!)
    if (tile.type === TileType.AIR || tile.type === 'air' || tile.type === 0) {
      return null; // Background shows through, fully visible
    }
    
    // Handle ramp tiles - special rendering for diagonal paths
    if (tile.type === TileType.RAMP_UP_RIGHT || tile.type === TileType.RAMP_UP_LEFT) {
      return this.renderRamp(x, y, tile, tileSize);
    }

    // Create container for this tile
    const container = this.scene.add.container(
      x * tileSize + tileSize/2,
      y * tileSize + tileSize/2
    );

    // Add base material sprite
    const materialTile = this.getMaterialTile(tile.type, x, y);
    if (materialTile) {
      const materialSprite = this.scene.add.sprite(0, 0, materialTile);
      materialSprite.setScale(tileSize / 32);
      container.add(materialSprite);
    }

    // Add edge overlay if tile has exposed edges
    if (world) {
      const edges = this.getEdgeConfig(world, x, y);
      const hasExposedEdge = edges.top || edges.right || edges.bottom || edges.left;
      
      if (hasExposedEdge) {
        const edgeTile = this.getEdgeTile(edges);
        const edgeSprite = this.scene.add.sprite(0, 0, edgeTile);
        edgeSprite.setScale(tileSize / 32);
        edgeSprite.setAlpha(0.9); // Slight transparency to blend with base
        container.add(edgeSprite);
      }
    }

    // Apply damage visualization
    if (tile.integrity !== undefined && tile.integrity < 100) {
      const damagePercent = 1 - (tile.integrity / 100);
      container.setAlpha(Math.max(0.3, 1 - damagePercent * 0.7));
      
      // Add cracks for heavily damaged tiles
      if (damagePercent > 0.5) {
        const crackOverlay = this.scene.add.rectangle(0, 0, tileSize, tileSize, 0x000000);
        crackOverlay.setAlpha(damagePercent * 0.3);
        container.add(crackOverlay);
      }
    }

    // Apply progressive fog of war overlay based on visibility layer
    if (visibilityLayer > 0) {
      const fogOverlay = this.createFogOverlay(x, y, tileSize, visibilityLayer);
      if (fogOverlay) {
        container.add(fogOverlay);
      }
    }

    // Store reference
    this.tileSprites.set(tileKey, container);
    
    return container;
  }
  
  /**
   * Render a ramp tile (diagonal path)
   */
  private renderRamp(x: number, y: number, tile: any, tileSize: number): Phaser.GameObjects.Container {
    const tileKey = `tile_${x}_${y}`;
    const container = this.scene.add.container(
      x * tileSize,
      y * tileSize
    );
    
    // Create graphics for the ramp
    const graphics = this.scene.add.graphics();
    const rampColor = 0x9B6B3F; // Dirt path brown color
    
    // Draw triangle based on ramp direction
    graphics.fillStyle(rampColor, 1.0);
    graphics.beginPath();
    
    if (tile.type === TileType.RAMP_UP_RIGHT) {
      // Ramp ascending left to right: /
      graphics.moveTo(0, tileSize); // Bottom left
      graphics.lineTo(tileSize, 0); // Top right
      graphics.lineTo(tileSize, tileSize); // Bottom right
    } else if (tile.type === TileType.RAMP_UP_LEFT) {
      // Ramp ascending right to left: \
      graphics.moveTo(0, 0); // Top left
      graphics.lineTo(tileSize, tileSize); // Bottom right
      graphics.lineTo(0, tileSize); // Bottom left
    }
    
    graphics.closePath();
    graphics.fillPath();
    
    // Add a lighter edge for visibility
    graphics.lineStyle(1, 0xB8855F, 0.8);
    graphics.strokePath();
    
    container.add(graphics);
    this.tileSprites.set(tileKey, container);
    
    return container;
  }

  /**
   * Create a fog overlay for progressive visibility
   * Layer 1: Clear (no overlay)
   * Layer 2: 30% dark
   * Layer 3: 60% dark
   * Layer 4+: Completely black
   */
  private createFogOverlay(x: number, y: number, tileSize: number, layer: number): Phaser.GameObjects.Rectangle | null {
    if (layer <= 0) return null;
    
    let alpha = 0;
    switch (layer) {
      case 1:
        alpha = 0; // Clear view
        break;
      case 2:
        alpha = 0.3; // Somewhat obscured
        break;
      case 3:
        alpha = 0.6; // More obscured
        break;
      default:
        alpha = 1.0; // Completely black
    }
    
    if (alpha === 0) return null;
    
    const overlay = this.scene.add.rectangle(0, 0, tileSize, tileSize, 0x000000);
    overlay.setAlpha(alpha);
    return overlay;
  }

  /**
   * Render fog of war for undiscovered tiles
   * Layer 4 = completely black
   */
  private renderFogOfWar(x: number, y: number, tileSize: number, layer: number = 4): null {
    const fogKey = `fog_${x}_${y}`;
    
    if (!this.fogSprites.has(fogKey)) {
      const fog = this.scene.add.rectangle(
        x * tileSize + tileSize/2,
        y * tileSize + tileSize/2,
        tileSize,
        tileSize,
        0x000000  // Pure black
      );
      fog.setDepth(100); // Above everything else
      fog.setAlpha(1.0); // Completely opaque for layer 4
      this.fogSprites.set(fogKey, fog);
    }
    
    return null;
  }

  /**
   * Remove fog of war when tile is discovered
   */
  private removeFog(x: number, y: number): void {
    const fogKey = `fog_${x}_${y}`;
    
    if (this.fogSprites.has(fogKey)) {
      this.fogSprites.get(fogKey)?.destroy();
      this.fogSprites.delete(fogKey);
    }
  }

  /**
   * Update adjacent tiles when a tile is mined/changed
   * This ensures edge sprites and fog of war update correctly
   */
  updateAdjacentTiles(x: number, y: number, world: any[][], tileSize: number): void {
    // Clear visibility cache for affected area (larger radius for fog updates)
    this.clearVisibilityCache();
    
    // Update tiles in a larger radius to ensure fog of war updates properly
    const updateRadius = 5; // Update up to 5 tiles away for fog updates
    
    for (let dx = -updateRadius; dx <= updateRadius; dx++) {
      for (let dy = -updateRadius; dy <= updateRadius; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < world.length && ny >= 0 && ny < world[0].length) {
          const neighborTile = world[nx][ny];
          if (neighborTile) {
            // Re-render to update visibility layers
            this.renderTile(nx, ny, neighborTile, tileSize, world);
          }
        }
      }
    }
  }

  /**
   * Clear the visibility cache to force recalculation
   */
  private clearVisibilityCache(): void {
    this.visibilityCache.clear();
  }

  /**
   * Clean up all sprites
   */
  destroy(): void {
    this.tileSprites.forEach(sprite => sprite.destroy());
    this.tileSprites.clear();
    
    this.fogSprites.forEach(fog => fog.destroy());
    this.fogSprites.clear();
  }
}
