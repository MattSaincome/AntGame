import { Scene } from 'phaser';
import { PatternType } from '../genetics/GeneticsTypes';

/**
 * Pattern Overlay System
 * Creates procedural textures and patterns that overlay monster sprites
 * Patterns are genetically inheritable and designed to look natural
 */
export class PatternOverlaySystem {
  private scene: Scene;
  private patternCache: Map<string, string> = new Map();
  
  constructor(scene: Scene) {
    this.scene = scene;
  }
  
  /**
   * Apply a pattern overlay to a sprite
   */
  applyPattern(
    sprite: Phaser.GameObjects.Sprite,
    patternType: PatternType,
    patternColor: string,
    intensity: number
  ): Phaser.GameObjects.Graphics | null {
    if (patternType === PatternType.NONE || !sprite || intensity < 0.05) {
      return null;
    }
    
    const width = sprite.displayWidth;
    const height = sprite.displayHeight;
    
    // Create graphics overlay
    const graphics = this.scene.add.graphics();
    graphics.setPosition(sprite.x - width / 2, sprite.y - height / 2);
    graphics.setAlpha(intensity);
    graphics.setDepth(sprite.depth + 0.5); // Slightly above sprite
    
    // Convert hex color to RGB
    const color = parseInt(patternColor.replace('#', '0x'));
    
    // Generate pattern based on type
    switch (patternType) {
      case PatternType.STRIPES_HORIZONTAL:
        this.drawHorizontalStripes(graphics, width, height, color);
        break;
      case PatternType.STRIPES_VERTICAL:
        this.drawVerticalStripes(graphics, width, height, color);
        break;
      case PatternType.SPOTS:
        this.drawSpots(graphics, width, height, color);
        break;
      case PatternType.SCALES:
        this.drawScales(graphics, width, height, color);
        break;
      case PatternType.FUR:
        this.drawFur(graphics, width, height, color);
        break;
      case PatternType.PATCHES:
        this.drawPatches(graphics, width, height, color);
        break;
      case PatternType.GRADIENT:
        this.drawGradient(graphics, width, height, color);
        break;
      case PatternType.LEOPARD:
        this.drawLeopardSpots(graphics, width, height, color);
        break;
      case PatternType.TIGER:
        this.drawTigerStripes(graphics, width, height, color);
        break;
      case PatternType.ZEBRA:
        this.drawZebraStripes(graphics, width, height, color);
        break;
      case PatternType.SNAKE:
        this.drawSnakeScales(graphics, width, height, color);
        break;
      case PatternType.FISH_SCALES:
        this.drawFishScales(graphics, width, height, color);
        break;
      case PatternType.LIZARD:
        this.drawLizardScales(graphics, width, height, color);
        break;
      case PatternType.FEATHERS:
        this.drawFeathers(graphics, width, height, color);
        break;
      case PatternType.MARBLE:
        this.drawMarble(graphics, width, height, color);
        break;
      default:
        break;
    }
    
    return graphics;
  }
  
  /**
   * Horizontal stripes pattern
   */
  private drawHorizontalStripes(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 1);
    const stripeWidth = Math.max(2, height / 8);
    for (let y = 0; y < height; y += stripeWidth * 2) {
      graphics.fillRect(0, y, width, stripeWidth);
    }
  }
  
  /**
   * Vertical stripes pattern
   */
  private drawVerticalStripes(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 1);
    const stripeWidth = Math.max(2, width / 8);
    for (let x = 0; x < width; x += stripeWidth * 2) {
      graphics.fillRect(x, 0, stripeWidth, height);
    }
  }
  
  /**
   * Spots pattern (leopard/cheetah style)
   */
  private drawSpots(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 1);
    const spotSize = Math.max(3, Math.min(width, height) / 12);
    const spots = Math.floor((width * height) / (spotSize * spotSize * 6));
    
    for (let i = 0; i < spots; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = spotSize * (0.7 + Math.random() * 0.6);
      graphics.fillCircle(x, y, radius);
    }
  }
  
  /**
   * Scales pattern (reptilian)
   */
  private drawScales(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.lineStyle(1, color, 1);
    const scaleSize = Math.max(4, Math.min(width, height) / 15);
    
    for (let y = 0; y < height; y += scaleSize) {
      for (let x = 0; x < width; x += scaleSize) {
        const offset = (y / scaleSize) % 2 === 0 ? 0 : scaleSize / 2;
        graphics.strokeCircle(x + offset, y, scaleSize / 2);
      }
    }
  }
  
  /**
   * Fur texture (fine lines)
   */
  private drawFur(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.lineStyle(1, color, 0.5);
    const furCount = Math.floor((width * height) / 30);
    
    for (let i = 0; i < furCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = 2 + Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      
      graphics.lineBetween(
        x,
        y,
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      );
    }
  }
  
  /**
   * Patches pattern (irregular shapes)
   */
  private drawPatches(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 1);
    const patchCount = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < patchCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const patchSize = (Math.min(width, height) / 4) * (0.5 + Math.random() * 0.5);
      
      // Irregular polygon for patch
      const points = 5 + Math.floor(Math.random() * 3);
      const polygon: number[] = [];
      for (let p = 0; p < points; p++) {
        const angle = (p / points) * Math.PI * 2;
        const radius = patchSize * (0.7 + Math.random() * 0.6);
        polygon.push(x + Math.cos(angle) * radius);
        polygon.push(y + Math.sin(angle) * radius);
      }
      graphics.fillPoints(polygon, true);
    }
  }
  
  /**
   * Gradient pattern (smooth color transition)
   */
  private drawGradient(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    const steps = 10;
    const stepHeight = height / steps;
    
    for (let i = 0; i < steps; i++) {
      const alpha = 1 - (i / steps);
      graphics.fillStyle(color, alpha);
      graphics.fillRect(0, i * stepHeight, width, stepHeight + 1);
    }
  }
  
  /**
   * Leopard spots (rosettes)
   */
  private drawLeopardSpots(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.lineStyle(2, color, 1);
    const spotSize = Math.max(5, Math.min(width, height) / 10);
    const spots = Math.floor((width * height) / (spotSize * spotSize * 8));
    
    for (let i = 0; i < spots; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = spotSize * (0.8 + Math.random() * 0.4);
      // Rosette: circle with small spots inside
      graphics.strokeCircle(x, y, radius);
      graphics.fillStyle(color, 1);
      graphics.fillCircle(x - radius * 0.3, y, radius * 0.2);
      graphics.fillCircle(x + radius * 0.3, y, radius * 0.2);
    }
  }
  
  /**
   * Tiger stripes (curved, irregular)
   */
  private drawTigerStripes(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 1);
    const stripeCount = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < stripeCount; i++) {
      const y = (height / stripeCount) * i + Math.random() * (height / stripeCount);
      const stripeWidth = 3 + Math.random() * 4;
      
      // Curved stripe using multiple segments
      const segments = 8;
      for (let s = 0; s < segments; s++) {
        const x1 = (width / segments) * s;
        const x2 = (width / segments) * (s + 1);
        const y1 = y + Math.sin(s * 0.5) * 5;
        const y2 = y + Math.sin((s + 1) * 0.5) * 5;
        
        const polygon = [
          x1, y1,
          x2, y2,
          x2, y2 + stripeWidth,
          x1, y1 + stripeWidth
        ];
        graphics.fillPoints(polygon, true);
      }
    }
  }
  
  /**
   * Zebra stripes (vertical, bold)
   */
  private drawZebraStripes(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 1);
    const stripeWidth = Math.max(4, width / 10);
    
    for (let x = 0; x < width; x += stripeWidth * 2) {
      // Slightly wavy stripes
      const points: number[] = [];
      const segments = 8;
      for (let s = 0; s <= segments; s++) {
        const y = (height / segments) * s;
        const wave = Math.sin(s * 0.8) * 3;
        points.push(x + wave, y);
      }
      for (let s = segments; s >= 0; s--) {
        const y = (height / segments) * s;
        const wave = Math.sin(s * 0.8) * 3;
        points.push(x + stripeWidth + wave, y);
      }
      graphics.fillPoints(points, true);
    }
  }
  
  /**
   * Snake scales (diamond pattern)
   */
  private drawSnakeScales(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.lineStyle(1, color, 1);
    const scaleSize = Math.max(5, Math.min(width, height) / 12);
    
    for (let y = 0; y < height; y += scaleSize) {
      for (let x = 0; x < width; x += scaleSize) {
        const offset = (y / scaleSize) % 2 === 0 ? 0 : scaleSize / 2;
        // Diamond shape
        const points = [
          x + offset, y - scaleSize / 2,
          x + offset + scaleSize / 2, y,
          x + offset, y + scaleSize / 2,
          x + offset - scaleSize / 2, y
        ];
        graphics.strokePoints(points, true);
      }
    }
  }
  
  /**
   * Fish scales (overlapping circles)
   */
  private drawFishScales(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.lineStyle(1, color, 0.8);
    const scaleSize = Math.max(6, Math.min(width, height) / 10);
    
    for (let y = 0; y < height; y += scaleSize * 0.8) {
      for (let x = 0; x < width; x += scaleSize * 0.8) {
        const offset = (y / (scaleSize * 0.8)) % 2 === 0 ? 0 : scaleSize * 0.4;
        // Arc for fish scale
        graphics.beginPath();
        graphics.arc(x + offset, y, scaleSize / 2, Math.PI, 0, false);
        graphics.strokePath();
      }
    }
  }
  
  /**
   * Lizard scales (hexagonal)
   */
  private drawLizardScales(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.lineStyle(1, color, 1);
    const scaleSize = Math.max(5, Math.min(width, height) / 15);
    
    for (let y = 0; y < height; y += scaleSize * 1.5) {
      for (let x = 0; x < width; x += scaleSize * 1.7) {
        const offset = (y / (scaleSize * 1.5)) % 2 === 0 ? 0 : scaleSize * 0.85;
        // Hexagon
        const points: number[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          points.push(x + offset + Math.cos(angle) * scaleSize);
          points.push(y + Math.sin(angle) * scaleSize);
        }
        graphics.strokePoints(points, true);
      }
    }
  }
  
  /**
   * Feathers pattern (layered arcs)
   */
  private drawFeathers(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.lineStyle(1, color, 0.7);
    const featherSize = Math.max(6, Math.min(width, height) / 12);
    
    for (let y = 0; y < height; y += featherSize) {
      for (let x = 0; x < width; x += featherSize) {
        const offset = (y / featherSize) % 2 === 0 ? 0 : featherSize / 2;
        // Feather barbs
        for (let i = 0; i < 3; i++) {
          graphics.beginPath();
          graphics.arc(x + offset, y + i * 2, featherSize / 2, Math.PI * 0.8, Math.PI * 0.2, true);
          graphics.strokePath();
        }
      }
    }
  }
  
  /**
   * Marble pattern (swirls and veins)
   */
  private drawMarble(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.lineStyle(2, color, 0.6);
    const veins = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < veins; i++) {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      
      graphics.beginPath();
      graphics.moveTo(startX, startY);
      
      let x = startX;
      let y = startY;
      const steps = 10 + Math.floor(Math.random() * 10);
      
      for (let s = 0; s < steps; s++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 15;
        x += Math.cos(angle) * distance;
        y += Math.sin(angle) * distance;
        
        // Keep within bounds
        x = Math.max(0, Math.min(width, x));
        y = Math.max(0, Math.min(height, y));
        
        graphics.lineTo(x, y);
      }
      
      graphics.strokePath();
    }
  }
  
  /**
   * Clean up pattern overlay
   */
  destroy(graphics: Phaser.GameObjects.Graphics | null): void {
    if (graphics) {
      graphics.destroy();
    }
  }
}
