/**
 * ProceduralTileRenderer - Beautiful tile-based terrain using swamp cave tileset
 * Creates varied, organic-looking cave environments with proper tile sprites
 */

import { TileType } from '../world/TileTypes';

export class ProceduralTileRenderer {
  private scene: Phaser.Scene;
  private tileSprites: Map<string, Phaser.Textures.Texture> = new Map();
  
  // Tile categories for different terrain types
  private readonly TILE_TYPES = {
    // Stone/Rock tiles (main mineable blocks)
    STONE_VARIANTS: [
      'Tile_01', 'Tile_02', 'Tile_03', 'Tile_04', 'Tile_05',
      'Tile_06', 'Tile_07', 'Tile_08', 'Tile_09', 'Tile_10'
    ],
    // Dirt/Soil tiles
    DIRT_VARIANTS: [
      'Tile_11', 'Tile_12', 'Tile_13', 'Tile_14', 'Tile_15',
      'Tile_16', 'Tile_17', 'Tile_18'
    ],
    // Ore/Special tiles (rarer resources)
    ORE_VARIANTS: [
      'Tile_19', 'Tile_20', 'Tile_21', 'Tile_22', 'Tile_23',
      'Tile_24', 'Tile_25', 'Tile_26'
    ],
    // Background/Wall tiles
    WALL_VARIANTS: [
      'Tile_27', 'Tile_28', 'Tile_29', 'Tile_30', 'Tile_31',
      'Tile_32', 'Tile_33', 'Tile_34'
    ],
    // Decorative tiles
    DECO_VARIANTS: [
      'Tile_35', 'Tile_36', 'Tile_37', 'Tile_38', 'Tile_39',
      'Tile_40', 'Tile_41', 'Tile_42'
    ],
    // Crystal/Gem tiles
    CRYSTAL_VARIANTS: [
      'Tile_43', 'Tile_44', 'Tile_45', 'Tile_46', 'Tile_47',
      'Tile_48', 'Tile_49', 'Tile_50'
    ],
    // Moss/Vegetation tiles
    MOSS_VARIANTS: [
      'Tile_51', 'Tile_52', 'Tile_53', 'Tile_54', 'Tile_55',
      'Tile_56', 'Tile_57', 'Tile_58'
    ],
    // Edge/Border tiles
    EDGE_VARIANTS: [
      'Tile_59', 'Tile_60', 'Tile_61', 'Tile_62', 'Tile_63',
      'Tile_64', 'Tile_65'
    ]
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Convert TileType enum to numeric value for sprite selection
   */
  private tileTypeToNumber(tileType: TileType | string | number): number {
    // If it's already a number, return it
    if (typeof tileType === 'number') return tileType;
    
    // Map TileType enum values to numbers
    const typeMap: { [key: string]: number } = {
      [TileType.AIR]: 0,
      [TileType.DIRT]: 2,
      [TileType.STONE]: 1,
      [TileType.ROCK]: 1,
      [TileType.ORE_COPPER]: 3,
      [TileType.ORE_IRON]: 5,
      [TileType.ORE_GOLD]: 6,
      [TileType.CRYSTAL]: 7,
      [TileType.WATER]: 0,
      [TileType.LAVA]: 0,
      [TileType.BEDROCK]: 1
    };
    
    return typeMap[tileType as string] || 0;
  }

  /**
   * Preload all tile sprites
   */
  preloadTiles(): void {
    // Load the main tileset
    this.scene.load.image('tileset', 'tiles/Tileset.png');
    
    // Load individual tiles
    for (let i = 1; i <= 65; i++) {
      const tileName = `Tile_${i.toString().padStart(2, '0')}`;
      this.scene.load.image(tileName, `tiles/swamp-cave/${tileName}.png`);
    }
  }

  /**
   * Check which edges of a tile are exposed to air/empty space
   */
  private getExposedEdges(tiles: any[][], x: number, y: number): { top: boolean, right: boolean, bottom: boolean, left: boolean } {
    const width = tiles.length;
    const height = tiles[0]?.length || 0;
    
    const checkEmpty = (nx: number, ny: number): boolean => {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) return true; // Out of bounds = empty
      const tile = tiles[nx]?.[ny];
      const tileType = tile?.type !== undefined ? tile.type : tile;
      return tileType === TileType.AIR || tileType === 0 || tileType === 'air';
    };
    
    return {
      top: checkEmpty(x, y - 1),
      right: checkEmpty(x + 1, y),
      bottom: checkEmpty(x, y + 1),
      left: checkEmpty(x - 1, y)
    };
  }

  /**
   * Select tile variant based on exposed edges configuration
   */
  private selectTileByEdges(baseVariants: string[], exposedEdges: { top: boolean, right: boolean, bottom: boolean, left: boolean }, noise: number): string {
    const edgeCount = Object.values(exposedEdges).filter(e => e).length;
    
    // Try to pick tiles that visually match the edge configuration
    // For now, use different tiles for different edge counts
    let variants = baseVariants;
    if (edgeCount === 0) {
      // Fully surrounded - use middle tiles
      variants = baseVariants.slice(0, 3);
    } else if (edgeCount === 1) {
      // One edge exposed - use tiles 3-6
      variants = baseVariants.slice(3, Math.min(6, baseVariants.length));
    } else if (edgeCount === 2) {
      // Two edges - use tiles 6-8
      variants = baseVariants.slice(Math.min(6, baseVariants.length - 3), Math.min(8, baseVariants.length));
    } else {
      // Many edges - use later tiles
      variants = baseVariants.slice(-3);
    }
    
    return this.selectVariant(variants.length > 0 ? variants : baseVariants, noise);
  }

  /**
   * Get appropriate tile sprite based on tile type and neighbor configuration
   */
  getTileSprite(tileType: number, x: number, y: number, tiles?: any[][]): string | null {
    // Use noise for natural variation
    const noise = this.perlinNoise(x * 0.1, y * 0.1);
    
    // Get exposed edges if tile data is provided
    const exposedEdges = tiles ? this.getExposedEdges(tiles, x, y) : { top: false, right: false, bottom: false, left: false };
    
    switch(tileType) {
      case 1: // Stone/Rock
        return tiles ? this.selectTileByEdges(this.TILE_TYPES.STONE_VARIANTS, exposedEdges, noise) 
                     : this.selectVariant(this.TILE_TYPES.STONE_VARIANTS, noise);
      
      case 2: // Dirt/Soil  
        return tiles ? this.selectTileByEdges(this.TILE_TYPES.DIRT_VARIANTS, exposedEdges, noise)
                     : this.selectVariant(this.TILE_TYPES.DIRT_VARIANTS, noise);
        
      case 3: // Ore/Resources
        return tiles ? this.selectTileByEdges(this.TILE_TYPES.ORE_VARIANTS, exposedEdges, noise)
                     : this.selectVariant(this.TILE_TYPES.ORE_VARIANTS, noise);
        
      case 4: // Coal
        return tiles ? this.selectTileByEdges(this.TILE_TYPES.CRYSTAL_VARIANTS, exposedEdges, noise)
                     : this.selectVariant(this.TILE_TYPES.CRYSTAL_VARIANTS, noise);
        
      case 5: // Iron
        return tiles ? this.selectTileByEdges(this.TILE_TYPES.ORE_VARIANTS, exposedEdges, noise * 2)
                     : this.selectVariant(this.TILE_TYPES.ORE_VARIANTS, noise * 2);
        
      case 6: // Gold
        return tiles ? this.selectTileByEdges(this.TILE_TYPES.CRYSTAL_VARIANTS, exposedEdges, noise * 3)
                     : this.selectVariant(this.TILE_TYPES.CRYSTAL_VARIANTS, noise * 3);
        
      case 7: // Diamond
        return tiles ? this.selectTileByEdges(this.TILE_TYPES.CRYSTAL_VARIANTS, exposedEdges, noise * 4)
                     : this.selectVariant(this.TILE_TYPES.CRYSTAL_VARIANTS, noise * 4);
        
      default:
        // Background/empty tiles
        if (Math.random() < 0.3) {
          return this.selectVariant(this.TILE_TYPES.WALL_VARIANTS, noise);
        }
        return null; // Empty space
    }
  }

  /**
   * Select a variant from array based on noise value
   */
  private selectVariant(variants: string[], noise: number): string {
    const index = Math.floor(Math.abs(noise) * variants.length) % variants.length;
    return variants[index];
  }

  /**
   * Render a tile with sprite instead of colored rectangle
   */
  renderTile(x: number, y: number, tileType: TileType | string | number, tileSize: number, tiles?: any[][]): Phaser.GameObjects.Sprite | null {
    const numericType = this.tileTypeToNumber(tileType);
    const tileName = this.getTileSprite(numericType, x, y, tiles);
    
    if (!tileName) {
      return null; // Empty tile
    }

    // Create sprite for the tile
    const sprite = this.scene.add.sprite(
      x * tileSize + tileSize/2,
      y * tileSize + tileSize/2,
      tileName
    );
    
    // Scale to fit tile size (tiles are 32x32, scale accordingly)
    sprite.setScale(tileSize / 32);
    
    // Calculate rotation based on exposed edges
    if (tiles) {
      const rotation = this.calculateTileRotation(tiles, x, y);
      sprite.setRotation(rotation);
    }
    
    // Add some visual variation
    this.applyTileEffects(sprite, numericType, x, y, tiles);
    
    return sprite;
  }

  /**
   * Calculate proper rotation for tile based on exposed edges
   */
  private calculateTileRotation(tiles: any[][], x: number, y: number): number {
    const edges = this.getExposedEdges(tiles, x, y);
    
    // Rotate tile so bright edges face exposed sides
    // Priority: bottom > right > top > left (for natural lighting)
    if (edges.bottom && !edges.top) {
      return 0; // Default orientation - bright edge at bottom
    } else if (edges.right && !edges.left) {
      return Math.PI / 2; // 90 degrees - bright edge at right
    } else if (edges.top && !edges.bottom) {
      return Math.PI; // 180 degrees - bright edge at top
    } else if (edges.left && !edges.right) {
      return -Math.PI / 2; // -90 degrees - bright edge at left
    } else if (edges.bottom && edges.right) {
      return Math.PI / 4; // 45 degrees - corner
    } else if (edges.top && edges.right) {
      return 3 * Math.PI / 4; // 135 degrees
    } else if (edges.top && edges.left) {
      return -3 * Math.PI / 4; // -135 degrees
    } else if (edges.bottom && edges.left) {
      return -Math.PI / 4; // -45 degrees
    }
    
    return 0; // Default for fully surrounded or all edges exposed
  }

  /**
   * Apply visual effects to tiles for variety
   */
  private applyTileEffects(sprite: Phaser.GameObjects.Sprite, tileType: number, x: number, y: number, tiles?: any[][]): void {
    const noise = this.perlinNoise(x * 0.2, y * 0.2);
    
    // Only apply slight rotation variation if we didn't already set edge-based rotation
    if (!tiles && tileType !== 0) {
      sprite.rotation = noise * 0.05;
    }
    
    // Depth variation for ore tiles
    if (tileType >= 3) {
      const depth = Math.min(y / 50, 1);
      sprite.setTint(Phaser.Display.Color.GetColor(
        255 - depth * 50,
        255 - depth * 30, 
        255 - depth * 20
      ));
    }
    
    // Add moss/vegetation randomly to stone tiles
    if (tileType === 1 && Math.random() < 0.1) {
      const moss = this.scene.add.sprite(
        sprite.x,
        sprite.y,
        this.selectVariant(this.TILE_TYPES.MOSS_VARIANTS, noise)
      );
      moss.setScale(sprite.scaleX);
      moss.setAlpha(0.6);
    }
    
    // Crystal glow effect
    if (tileType >= 6) {
      sprite.setTint(0x88ffff);
      // Could add particle effects here
    }
  }

  /**
   * Simple Perlin noise implementation for natural variation
   */
  private perlinNoise(x: number, y: number): number {
    // Simple pseudo-random noise based on position
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }

  /**
   * Generate edge/border tiles for smoother transitions
   */
  generateEdgeTiles(tiles: any[][], tileSize: number): void {
    const width = tiles.length;
    const height = tiles[0]?.length || 0;
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tileType = tiles[x][y].type !== undefined ? tiles[x][y].type : tiles[x][y];
        if (tileType === 0 || tileType === TileType.AIR || tileType === 'air') continue; // Skip empty tiles
        
        // Check neighbors
        const hasEmptyNeighbor = this.hasEmptyNeighbor(tiles, x, y);
        
        if (hasEmptyNeighbor) {
          // Add edge decoration
          const edgeTile = this.selectVariant(
            this.TILE_TYPES.EDGE_VARIANTS,
            this.perlinNoise(x * 0.15, y * 0.15)
          );
          
          const edgeSprite = this.scene.add.sprite(
            x * tileSize + tileSize/2,
            y * tileSize + tileSize/2,
            edgeTile
          );
          
          edgeSprite.setScale(tileSize / 32);
          edgeSprite.setAlpha(0.7);
          edgeSprite.setDepth(1); // Above base tiles
        }
      }
    }
  }

  /**
   * Check if tile has empty neighbor
   */
  private hasEmptyNeighbor(tiles: any[][], x: number, y: number): boolean {
    const neighbors = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [1, -1], [-1, 1], [1, 1]
    ];
    
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < tiles.length && 
          ny >= 0 && ny < (tiles[0]?.length || 0)) {
        const tileType = tiles[nx][ny].type !== undefined ? tiles[nx][ny].type : tiles[nx][ny];
        if (tileType === 0 || tileType === TileType.AIR || tileType === 'air') {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Create background layer with wall tiles
   */
  createBackground(width: number, height: number, tileSize: number): void {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const noise = this.perlinNoise(x * 0.08, y * 0.08);
        
        // Random wall tiles for background
        if (Math.random() < 0.7) {
          const wallTile = this.selectVariant(this.TILE_TYPES.WALL_VARIANTS, noise);
          const wallSprite = this.scene.add.sprite(
            x * tileSize + tileSize/2,
            y * tileSize + tileSize/2,
            wallTile
          );
          
          wallSprite.setScale(tileSize / 32);
          wallSprite.setTint(0x666666); // Darken background tiles
          wallSprite.setDepth(-2); // Behind everything
          wallSprite.setAlpha(0.5);
        }
      }
    }
  }

  /**
   * Add decorative elements
   */
  addDecorations(tiles: any[][], tileSize: number): void {
    const width = tiles.length;
    const height = tiles[0]?.length || 0;
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tileType = tiles[x][y].type !== undefined ? tiles[x][y].type : tiles[x][y];
        if ((tileType === 0 || tileType === TileType.AIR || tileType === 'air') && Math.random() < 0.05) {
          // Add random decorations in empty spaces
          const decoTile = this.selectVariant(
            this.TILE_TYPES.DECO_VARIANTS,
            this.perlinNoise(x * 0.3, y * 0.3)
          );
          
          const decoSprite = this.scene.add.sprite(
            x * tileSize + tileSize/2,
            y * tileSize + tileSize/2,
            decoTile
          );
          
          decoSprite.setScale(tileSize / 32 * Phaser.Math.FloatBetween(0.5, 1.2));
          decoSprite.setAlpha(0.8);
          decoSprite.rotation = Math.random() * Math.PI * 2;
        }
      }
    }
  }
}
