import { Tile, TileType, TILE_PROPERTIES, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL, DIRT_DEPTH, STONE_DEPTH, DEEP_STONE_DEPTH, ORE_RARITY, CRYSTAL_RARITY } from './TileTypes';

export class WorldGenerator {
  private noise: number[][];

  constructor() {
    this.noise = this.generateNoise(WORLD_WIDTH, WORLD_HEIGHT);
  }

  /**
   * Generate the initial underground world
   */
  generateWorld(): Tile[][] {
    const world: Tile[][] = [];

    for (let x = 0; x < WORLD_WIDTH; x++) {
      world[x] = [];
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        world[x][y] = this.generateTileAt(x, y);
      }
    }

    // Create the starting chamber in the center-top area
    this.createStartingChamber(world);

    // Add some initial tunnels for variety
    this.createInitialTunnels(world);

    return world;
  }

  /**
   * Generate a tile at specific coordinates
   */
  private generateTileAt(x: number, y: number): Tile {
    const depth = y;
    const noiseValue = this.noise[x][y];
    
    let tileType: TileType;

    // Surface and shallow area (air)
    if (depth < SURFACE_LEVEL) {
      tileType = TileType.AIR;
    }
    // Dirt layer
    else if (depth < SURFACE_LEVEL + DIRT_DEPTH) {
      tileType = TileType.DIRT;
    }
    // Stone layer with ore chances
    else if (depth < SURFACE_LEVEL + STONE_DEPTH) {
      if (Math.random() < ORE_RARITY * (1 + noiseValue * 0.5)) {
        tileType = this.selectOreType(depth, 'shallow');
      } else {
        tileType = TileType.STONE;
      }
    }
    // Deep stone with better ores
    else if (depth < SURFACE_LEVEL + DEEP_STONE_DEPTH) {
      if (Math.random() < ORE_RARITY * (1.5 + noiseValue * 0.3)) {
        tileType = this.selectOreType(depth, 'medium');
      } else {
        tileType = TileType.ROCK;
      }
    }
    // Deep areas with rare materials
    else {
      if (Math.random() < CRYSTAL_RARITY + noiseValue * 0.1) {
        tileType = TileType.CRYSTAL;
      } else if (Math.random() < ORE_RARITY * 2) {
        tileType = this.selectOreType(depth, 'deep');
      } else {
        tileType = TileType.ROCK;
      }
    }

    // COMPLETELY DISABLE WATER GENERATION FOR NOW - STARTING AREA MUST BE CLEAN
    // TODO: Re-enable water in far areas later once starting area is confirmed working
    /*
    const distanceFromCenter = Math.abs(x - WORLD_WIDTH / 2);
    if (depth > SURFACE_LEVEL + 100 && Math.random() < 0.0001 && distanceFromCenter > 100) {
      tileType = TileType.LAVA; // Only lava, no water at all
    }
    */

    // Bedrock at bottom
    if (depth >= WORLD_HEIGHT - 5) {
      tileType = TileType.BEDROCK;
    }

    const properties = TILE_PROPERTIES[tileType];
    
    return {
      type: tileType,
      x,
      y,
      // Much lower integrity for satisfying mining
      // Dirt: 5-10 (1-2 hits), Stone: 15-25 (2-3 hits), Harder ores: 20-40 (3-5 hits)
      integrity: properties.diggable ? properties.hardness * 5 + Math.random() * 5 : 100,
      resources: this.calculateResources(tileType),
      discovered: false,
      lastUpdated: Date.now()
    };
  }

  /**
   * Select ore type based on depth and rarity
   */
  private selectOreType(depth: number, depthCategory: 'shallow' | 'medium' | 'deep'): TileType {
    const random = Math.random();
    
    switch (depthCategory) {
      case 'shallow':
        return random < 0.8 ? TileType.ORE_COPPER : TileType.ORE_IRON;
      case 'medium':
        if (random < 0.5) return TileType.ORE_COPPER;
        if (random < 0.8) return TileType.ORE_IRON;
        return TileType.ORE_GOLD;
      case 'deep':
        if (random < 0.3) return TileType.ORE_COPPER;
        if (random < 0.6) return TileType.ORE_IRON;
        if (random < 0.9) return TileType.ORE_GOLD;
        return TileType.CRYSTAL;
      default:
        return TileType.ORE_COPPER;
    }
  }

  /**
   * Calculate resource amount for a tile
   */
  private calculateResources(tileType: TileType): number {
    const baseValue = TILE_PROPERTIES[tileType].resourceValue;
    if (baseValue === 0) return 0;
    
    // Add some randomness to resource amounts
    return Math.floor(baseValue * (0.5 + Math.random() * 1.5));
  }

  /**
   * Create rectangular starting chamber with flat ground for ground-based creatures
   */
  private createStartingChamber(world: Tile[][]): void {
    const centerX = Math.floor(WORLD_WIDTH / 2);
    const centerY = SURFACE_LEVEL + 12;
    const chamberWidth = 12; // Wide rectangular chamber
    const chamberHeight = 6;  // Not too tall - keeps monsters grounded

    // Create rectangular chamber with flat floor
    for (let x = centerX - chamberWidth; x <= centerX + chamberWidth; x++) {
      for (let y = centerY - chamberHeight; y <= centerY + chamberHeight; y++) {
        if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
          
          if (x > centerX - chamberWidth && x < centerX + chamberWidth && 
              y > centerY - chamberHeight && y < centerY + chamberHeight) {
            // Interior of chamber - air space
            world[x][y] = {
              type: TileType.AIR,
              x,
              y,
              integrity: 0,
              resources: 0,
              discovered: true,
              lastUpdated: Date.now()
            };
          } else {
            // Chamber walls - softer dirt for initial mining
            world[x][y] = {
              type: TileType.DIRT,
              x,
              y,
              integrity: 5, // Super easy to dig - 1 hit
              resources: 0,
              discovered: true,
              lastUpdated: Date.now()
            };
          }
        }
      }
    }
    
    // Create steel pyramid platform for the hive (unminable ramp)
    this.createHivePyramidPlatform(world, centerX, centerY + chamberHeight);

    // Create simple DIRT floor - easy to mine, no massive stone areas
    for (let x = centerX - chamberWidth; x <= centerX + chamberWidth; x++) {
      const floorY = centerY + chamberHeight;
      if (x >= 0 && x < WORLD_WIDTH && floorY >= 0 && floorY < WORLD_HEIGHT) {
        world[x][floorY] = {
          type: TileType.DIRT,
          x,
          y: floorY,
          integrity: 5, // Very easy to mine dirt - 1 hit
          resources: 1,
          discovered: true,
          lastUpdated: Date.now()
        };
      }
    }

    // FORCE REPLACE ANY WATER IN STARTING AREA WITH EASY DIRT
    const safeZoneWidth = chamberWidth + 10; // Moderate safe zone
    const safeZoneHeight = chamberHeight + 8; // Moderate safe zone
    
    for (let x = centerX - safeZoneWidth; x <= centerX + safeZoneWidth; x++) {
      for (let y = centerY - safeZoneHeight; y <= centerY + safeZoneHeight + 5; y++) {
        if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
          const tile = world[x][y];
          
          // Replace any water with EASY DIRT only
          if (tile.type === TileType.WATER) {
            tile.type = TileType.DIRT;
            tile.integrity = 5; // Very easy to mine - 1 hit
            tile.resources = 1;
            tile.discovered = true;
            console.log(`Replaced water with dirt at (${x}, ${y})`);
          }
        }
      }
    }

    // Create small starting tunnels in 3 directions (NOT SOUTH - no ditch below!)
    const directions = [
      { dx: 0, dy: -1 }, // North
      { dx: 1, dy: 0 },  // East
      // REMOVED: { dx: 0, dy: 1 },  // South - NO DITCH BELOW!
      { dx: -1, dy: 0 }  // West
    ];

    directions.forEach(dir => {
      // Create 2-tile starter tunnel extending from chamber walls
      for (let i = 1; i <= 2; i++) {
        const x = centerX + dir.dx * (chamberWidth + i);
        const y = centerY + dir.dy * (chamberHeight + i);
        
        if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
          world[x][y] = {
            type: TileType.DIRT,
            x,
            y,
            integrity: 5, // Very easy to dig - tutorial area - 1 hit
            resources: 0,
            discovered: true,
            lastUpdated: Date.now()
          };
        }
      }
    });
  }

  /**
   * Create a steel pyramid platform for the hive to sit on
   * This prevents monsters from getting stuck underneath
   */
  private createHivePyramidPlatform(world: Tile[][], centerX: number, baseY: number): void {
    // Create a MUCH wider pyramid with gentler slope
    // Single block steps for easier monster navigation
    // Total height: 4 blocks but spread over wider base
    
    const pyramidHeight = 4;
    
    // Simple pyramid with full block steps, very wide base
    // Each level is 2-3 blocks wider for gentler slope
    const stepPattern = [
      { level: 0, width: 17 },  // Very wide base
      { level: 1, width: 13 },  // Step in by 2 blocks each side
      { level: 2, width: 9 },   // Another big step
      { level: 3, width: 5 },   // Getting narrower
      { level: 4, width: 3 }    // Top platform for hive
    ];
    
    // Build each step of the pyramid - solid filled layers
    for (const step of stepPattern) {
      const y = Math.floor(baseY - step.level);
      const halfWidth = Math.floor(step.width / 2);
      
      for (let dx = -halfWidth; dx <= halfWidth; dx++) {
        const x = centerX + dx;
        
        // Fill entire width for each level - creates solid pyramid
        if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
          world[x][y] = {
            type: TileType.BEDROCK, // Use bedrock for unminable steel platform
            x,
            y,
            integrity: 100, // Unbreakable
            resources: 0,
            discovered: true,
            lastUpdated: Date.now()
          };
        }
      }
    }
    
    // Clear air space above the pyramid for the hive
    const topY = baseY - pyramidHeight;
    for (let dx = -2; dx <= 2; dx++) {
      const x = centerX + dx;
      const y = topY - 1;
      
      if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        world[x][y] = {
          type: TileType.AIR,
          x,
          y,
          integrity: 0,
          resources: 0,
          discovered: true,
          lastUpdated: Date.now()
        };
      }
    }
  }

  /**
   * Create some initial tunnels for gameplay variety
   */
  private createInitialTunnels(world: Tile[][]): void {
    const centerX = Math.floor(WORLD_WIDTH / 2);
    const centerY = SURFACE_LEVEL + 5;

    // REMOVED the straight down tunnel - no ditch below starting chamber!
    // Only create side tunnels for exploration
    const tunnelDirections = [
      { dx: -1, dy: 0.3, length: 15 }, // Left-down tunnel
      { dx: 1, dy: 0.3, length: 15 },  // Right-down tunnel
      // REMOVED: { dx: 0, dy: 1, length: 20 } - NO straight down tunnel!
    ];

    tunnelDirections.forEach(({ dx, dy, length }) => {
      let currentX = centerX;
      let currentY = centerY;

      for (let i = 0; i < length; i++) {
        currentX += dx + (Math.random() - 0.5) * 0.5; // Add some randomness
        currentY += dy + (Math.random() - 0.5) * 0.3;

        const tileX = Math.floor(currentX);
        const tileY = Math.floor(currentY);

        // Create tunnel (make air and nearby tiles easier to dig)
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const x = tileX + ox;
            const y = tileY + oy;
            
            if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
              if (ox === 0 && oy === 0) {
                // Center of tunnel - make air
                world[x][y] = {
                  type: TileType.AIR,
                  x,
                  y,
                  integrity: 0,
                  resources: 0,
                  discovered: true,
                  lastUpdated: Date.now()
                };
              } else if (world[x][y].type !== TileType.AIR) {
                // Adjacent to tunnel - reduce integrity for easier mining
                world[x][y].integrity = Math.max(1, world[x][y].integrity * 0.5);
                world[x][y].discovered = true;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Generate Perlin-like noise for world generation
   */
  private generateNoise(width: number, height: number): number[][] {
    const noise: number[][] = [];
    
    for (let x = 0; x < width; x++) {
      noise[x] = [];
      for (let y = 0; y < height; y++) {
        // Simple noise generation using multiple octaves
        let value = 0;
        let frequency = 0.1;
        let amplitude = 1;
        
        for (let octave = 0; octave < 4; octave++) {
          value += this.simpleNoise(x * frequency, y * frequency) * amplitude;
          frequency *= 2;
          amplitude *= 0.5;
        }
        
        noise[x][y] = Math.max(-1, Math.min(1, value));
      }
    }
    
    return noise;
  }

  /**
   * Simple noise function
   */
  private simpleNoise(x: number, y: number): number {
    const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return 2 * (seed - Math.floor(seed)) - 1;
  }
}
