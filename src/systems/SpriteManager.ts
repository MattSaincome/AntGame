export interface SpriteConfig {
  name: string;
  src: string;
  tileWidth?: number;
  tileHeight?: number;
  tileCount?: number;
}

export interface TileData {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export class SpriteManager {
  private loadedSprites: Map<string, HTMLImageElement> = new Map();
  private extractedTiles: Map<string, TileData[]> = new Map();
  private canvasTextures: Map<string, HTMLCanvasElement> = new Map();

  async loadSprite(config: SpriteConfig): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedSprites.set(config.name, img);
        
        // If this is a tileset, extract individual tiles
        if (config.tileWidth && config.tileHeight) {
          this.extractTiles(config.name, img, config.tileWidth, config.tileHeight);
        }
        
        resolve(img);
      };
      img.onerror = reject;
      img.src = config.src;
    });
  }

  private extractTiles(name: string, img: HTMLImageElement, tileWidth: number, tileHeight: number): void {
    const tilesPerRow = Math.floor(img.width / tileWidth);
    const tilesPerCol = Math.floor(img.height / tileHeight);
    const tiles: TileData[] = [];

    for (let row = 0; row < tilesPerCol; row++) {
      for (let col = 0; col < tilesPerRow; col++) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        
        canvas.width = tileWidth;
        canvas.height = tileHeight;
        
        // Use NEAREST neighbor scaling to maintain pixel art quality
        ctx.imageSmoothingEnabled = false;
        
        ctx.drawImage(
          img,
          col * tileWidth, row * tileHeight, tileWidth, tileHeight,
          0, 0, tileWidth, tileHeight
        );
        
        tiles.push({
          canvas,
          ctx,
          width: tileWidth,
          height: tileHeight
        });
      }
    }
    
    this.extractedTiles.set(name, tiles);
  }

  getTile(spriteName: string, tileIndex: number): TileData | null {
    const tiles = this.extractedTiles.get(spriteName);
    return tiles && tiles[tileIndex] ? tiles[tileIndex] : null;
  }

  getSprite(name: string): HTMLImageElement | null {
    return this.loadedSprites.get(name) || null;
  }

  // Create WebGL-safe canvas texture for Phaser
  createCanvasTexture(name: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    
    canvas.width = width;
    canvas.height = height;
    
    // Disable image smoothing for pixel art
    ctx.imageSmoothingEnabled = false;
    
    drawFn(ctx);
    
    this.canvasTextures.set(name, canvas);
    return canvas;
  }

  getCanvasTexture(name: string): HTMLCanvasElement | null {
    return this.canvasTextures.get(name) || null;
  }

  // Create dirt/cave tiles based on Caves of Gallet sprites
  createCaveTiles(): void {
    // Create basic dirt tile
    this.createCanvasTexture('dirt', 16, 16, (ctx) => {
      // Brown dirt base
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 0, 16, 16);
      
      // Add some texture with darker brown pixels
      ctx.fillStyle = '#654321';
      for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        ctx.fillRect(x, y, 1, 1);
      }
    });

    // Create stone tile
    this.createCanvasTexture('stone', 16, 16, (ctx) => {
      // Gray stone base
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 16, 16);
      
      // Add stone texture
      ctx.fillStyle = '#696969';
      for (let i = 0; i < 15; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        ctx.fillRect(x, y, 1, 1);
      }
    });

    // Create cave background
    this.createCanvasTexture('cave_bg', 16, 16, (ctx) => {
      // Dark cave background
      ctx.fillStyle = '#2F2F2F';
      ctx.fillRect(0, 0, 16, 16);
      
      // Add some subtle texture
      ctx.fillStyle = '#404040';
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        ctx.fillRect(x, y, 1, 1);
      }
    });

    // Create ore tiles
    this.createCanvasTexture('gold_ore', 16, 16, (ctx) => {
      // Stone base
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 16, 16);
      
      // Gold veins
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(4, 6, 2, 2);
      ctx.fillRect(10, 3, 3, 1);
      ctx.fillRect(7, 11, 2, 3);
    });

    this.createCanvasTexture('coal_ore', 16, 16, (ctx) => {
      // Stone base
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 16, 16);
      
      // Coal veins
      ctx.fillStyle = '#2F2F2F';
      ctx.fillRect(3, 4, 3, 3);
      ctx.fillRect(9, 8, 4, 2);
      ctx.fillRect(5, 12, 2, 2);
    });

    // Create copper ore
    this.createCanvasTexture('copper_ore', 16, 16, (ctx) => {
      // Stone base
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 16, 16);
      
      // Copper veins
      ctx.fillStyle = '#CD853F';
      ctx.fillRect(2, 3, 4, 2);
      ctx.fillRect(8, 7, 3, 4);
      ctx.fillRect(4, 11, 5, 2);
    });

    // Create iron ore
    this.createCanvasTexture('iron_ore', 16, 16, (ctx) => {
      // Stone base
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 16, 16);
      
      // Iron veins
      ctx.fillStyle = '#4682B4';
      ctx.fillRect(1, 2, 3, 4);
      ctx.fillRect(7, 5, 4, 3);
      ctx.fillRect(3, 10, 6, 3);
    });

    // Create crystal
    this.createCanvasTexture('crystal', 16, 16, (ctx) => {
      // Stone base
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 16, 16);
      
      // Crystal formations
      ctx.fillStyle = '#9370DB';
      ctx.fillRect(4, 2, 8, 6);
      ctx.fillRect(6, 8, 4, 6);
      
      // Crystal highlights
      ctx.fillStyle = '#DDA0DD';
      ctx.fillRect(5, 3, 2, 2);
      ctx.fillRect(7, 9, 1, 2);
    });

    // Create water
    this.createCanvasTexture('water', 16, 16, (ctx) => {
      // Water base
      ctx.fillStyle = '#0000FF';
      ctx.fillRect(0, 0, 16, 16);
      
      // Water shimmer
      ctx.fillStyle = '#4169E1';
      for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        ctx.fillRect(x, y, 1, 1);
      }
    });

    // Create lava
    this.createCanvasTexture('lava', 16, 16, (ctx) => {
      // Lava base
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(0, 0, 16, 16);
      
      // Lava bubbles
      ctx.fillStyle = '#FF6347';
      ctx.fillRect(3, 2, 2, 2);
      ctx.fillRect(8, 6, 3, 3);
      ctx.fillRect(5, 11, 2, 2);
      
      // Hot spots
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(4, 3, 1, 1);
      ctx.fillRect(9, 7, 1, 1);
    });

    // Create bedrock/steel platform
    this.createCanvasTexture('bedrock', 16, 16, (ctx) => {
      // Steel gradient base
      const gradient = ctx.createLinearGradient(0, 0, 0, 16);
      gradient.addColorStop(0, '#606060');
      gradient.addColorStop(0.5, '#4A4A4A');
      gradient.addColorStop(1, '#383838');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
      
      // Steel plate edges/rivets
      ctx.fillStyle = '#707070';
      ctx.fillRect(0, 0, 16, 1); // Top edge
      ctx.fillRect(0, 15, 16, 1); // Bottom edge
      
      // Rivet dots
      ctx.fillStyle = '#505050';
      ctx.fillRect(2, 2, 1, 1);
      ctx.fillRect(13, 2, 1, 1);
      ctx.fillRect(2, 13, 1, 1);
      ctx.fillRect(13, 13, 1, 1);
      
      // Highlight for metallic look
      ctx.fillStyle = '#808080';
      ctx.fillRect(1, 1, 1, 1);
      ctx.fillRect(14, 1, 1, 1);
    });
  }
}

// Global sprite manager instance
export const spriteManager = new SpriteManager();
