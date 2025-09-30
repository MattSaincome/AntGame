/**
 * TerrariaTileRenderer - Terraria-style autotiling system
 * Handles edge detection, fog of war, and dynamic tile updates
 * 
 * Key concepts:
 * - Dugout/mined areas show simple gray background (no patterns)
 * - Solid blocks have edge sprites with light sides facing dugout voids
 * - Fog of war covers undiscovered areas
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

    // Handle undiscovered tiles (fog of war)
    if (!tile.discovered) {
      return this.renderFogOfWar(x, y, tileSize);
    }

    // Remove fog if it exists
    this.removeFog(x, y);

    // Handle empty/air tiles - just show background (no patterns!)
    if (tile.type === TileType.AIR || tile.type === 'air' || tile.type === 0) {
      return null; // Background shows through
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

    // Store reference
    this.tileSprites.set(tileKey, container);
    
    return container;
  }

  /**
   * Render fog of war for undiscovered tiles
   */
  private renderFogOfWar(x: number, y: number, tileSize: number): null {
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
   * This ensures edge sprites update correctly
   */
  updateAdjacentTiles(x: number, y: number, world: any[][], tileSize: number): void {
    // Update all 8 surrounding tiles
    const neighbors = [
      [x-1, y-1], [x, y-1], [x+1, y-1],
      [x-1, y],             [x+1, y],
      [x-1, y+1], [x, y+1], [x+1, y+1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < world.length && ny >= 0 && ny < world[0].length) {
        const neighborTile = world[nx][ny];
        if (neighborTile && neighborTile.discovered && neighborTile.type !== TileType.AIR) {
          // Re-render this neighbor with updated edges
          this.renderTile(nx, ny, neighborTile, tileSize, world);
        }
      }
    }
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
