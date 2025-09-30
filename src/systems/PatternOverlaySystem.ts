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
    
    // Shrink pattern significantly to stay well within sprite bounds (70% of size)
    const width = sprite.displayWidth * 0.7;
    const height = sprite.displayHeight * 0.7;
    
    // Create graphics overlay CONSTRAINED to sprite bounds
    const graphics = this.scene.add.graphics();
    // Center the smaller pattern on the sprite
    graphics.setPosition(sprite.x - width / 2, sprite.y - height / 2);
    graphics.setAlpha(intensity);
    graphics.setDepth(1); // Just above body (body=0), below all other parts (eyes=25, etc)
    
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
      case PatternType.WARTS:
        this.drawWarts(graphics, width, height, color);
        break;
      case PatternType.WORMS:
        this.drawWorms(graphics, width, height, color);
        break;
      case PatternType.TUMORS:
        this.drawTumors(graphics, width, height, color);
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
   * Scales pattern - OPTIMIZED simple circles
   */
  private drawScales(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 0.4);
    const scaleSize = Math.max(5, Math.min(width, height) / 12);
    const maxScales = 12; // Limit total scales
    let count = 0;
    
    for (let y = scaleSize; y < height && count < maxScales; y += scaleSize * 1.5) {
      for (let x = scaleSize; x < width && count < maxScales; x += scaleSize * 1.5) {
        graphics.fillCircle(x, y, scaleSize * 0.4);
        count++;
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
   * Gradient pattern (smooth color transition) - CONSTRAINED to sprite bounds
   */
  private drawGradient(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    const steps = 10;
    const stepHeight = height / steps;
    
    for (let i = 0; i < steps; i++) {
      const alpha = 1 - (i / steps);
      graphics.fillStyle(color, alpha);
      // Ensure gradient stays within bounds
      graphics.fillRect(0, i * stepHeight, width, Math.min(stepHeight + 1, height - i * stepHeight));
    }
  }
  
  /**
   * Leopard spots (rosettes) - OPTIMIZED
   */
  private drawLeopardSpots(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 0.6);
    const spotSize = Math.max(4, Math.min(width, height) / 15);
    const spots = Math.min(8, Math.floor((width * height) / (spotSize * spotSize * 15))); // MAX 8 spots
    
    for (let i = 0; i < spots; i++) {
      const x = (Math.random() * 0.8 + 0.1) * width;
      const y = (Math.random() * 0.8 + 0.1) * height;
      const radius = spotSize * (0.7 + Math.random() * 0.3);
      graphics.fillCircle(x, y, radius); // Just one circle per spot
    }
  }
  
  /**
   * Tiger stripes (curved, irregular) - OPTIMIZED
   */
  private drawTigerStripes(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 0.7);
    const stripeCount = 4; // Fixed 4 stripes
    const stripeWidth = 3;
    
    for (let i = 0; i < stripeCount; i++) {
      const y = (height / stripeCount) * i + (height / stripeCount) * 0.5;
      graphics.fillRect(0, y, width, stripeWidth); // Simple rectangles
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
   * Warts pattern - raised bumpy growths (GROSS & DRAMATIC)
   */
  private drawWarts(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 1);
    const wartCount = 15 + Math.floor(Math.random() * 20); // More warts
    
    for (let i = 0; i < wartCount; i++) {
      // Keep warts within bounds with padding
      const padding = width * 0.05;
      const x = padding + Math.random() * (width - padding * 2);
      const y = padding + Math.random() * (height - padding * 2);
      const wartSize = (width * 0.04) + Math.random() * (width * 0.08); // 4-12% of width
      
      // Main wart body - raised bump
      graphics.fillCircle(x, y, wartSize);
      
      // Much darker center for gross effect
      const darkerColor = ((color >> 2) & 0x3F3F3F); // Darken by 75%
      graphics.fillStyle(darkerColor, 1);
      graphics.fillCircle(x, y, wartSize * 0.5);
      
      // Random small bumps around it for texture
      graphics.fillStyle(color, 0.8);
      for (let j = 0; j < 3 + Math.floor(Math.random() * 4); j++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = wartSize * (0.6 + Math.random() * 0.4);
        const bumpX = x + Math.cos(angle) * distance;
        const bumpY = y + Math.sin(angle) * distance;
        const bumpSize = wartSize * (0.25 + Math.random() * 0.35);
        graphics.fillCircle(bumpX, bumpY, bumpSize);
      }
      
      // Reset color for next wart
      graphics.fillStyle(color, 1);
    }
  }
  
  /**
   * Worms pattern - writhing parasites in the skin (GROSS & DRAMATIC)
   */
  private drawWorms(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    const wormCount = 12 + Math.floor(Math.random() * 16); // More worms
    const wormThickness = Math.max(2, width * 0.015); // Thicker worms (1.5% of width)
    
    for (let i = 0; i < wormCount; i++) {
      // Start within bounds with padding
      const padding = width * 0.1;
      const startX = padding + Math.random() * (width - padding * 2);
      const startY = padding + Math.random() * (height - padding * 2);
      const wormLength = width * (0.15 + Math.random() * 0.25); // 15-40% of width
      const segments = 8 + Math.floor(Math.random() * 8);
      
      let x = startX;
      let y = startY;
      let angle = Math.random() * Math.PI * 2;
      
      // Worm body - wriggling motion with thick lines
      graphics.lineStyle(wormThickness, color, 0.9);
      graphics.beginPath();
      graphics.moveTo(startX, startY);
      
      for (let s = 0; s < segments; s++) {
        angle += (Math.random() - 0.5) * 1.5; // More wiggle
        const segmentLength = wormLength / segments;
        x += Math.cos(angle) * segmentLength;
        y += Math.sin(angle) * segmentLength;
        
        // Soft clamping - slow down as approaching edges
        const edgeMargin = width * 0.05;
        if (x < edgeMargin) x = edgeMargin + Math.random() * edgeMargin;
        if (x > width - edgeMargin) x = width - edgeMargin - Math.random() * edgeMargin;
        if (y < edgeMargin) y = edgeMargin + Math.random() * edgeMargin;
        if (y > height - edgeMargin) y = height - edgeMargin - Math.random() * edgeMargin;
        
        graphics.lineTo(x, y);
      }
      
      graphics.strokePath();
      
      // Add gross detail - large visible bulges along the worm
      const darkerColor = ((color >> 1) & 0x7F7F7F);
      graphics.fillStyle(darkerColor, 0.9);
      const bulges = 3 + Math.floor(Math.random() * 4);
      for (let b = 0; b < bulges; b++) {
        const t = (b + 1) / (bulges + 1);
        const bulgeX = startX + (x - startX) * t;
        const bulgeY = startY + (y - startY) * t;
        const bulgeSize = wormThickness * (1.5 + Math.random() * 1);
        graphics.fillCircle(bulgeX, bulgeY, bulgeSize);
      }
    }
  }
  
  /**
   * Tumors pattern - irregular growths (SICK AND SAD & DRAMATIC)
   */
  private drawTumors(graphics: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
    graphics.fillStyle(color, 0.9);
    const tumorCount = 6 + Math.floor(Math.random() * 8); // More tumors
    
    for (let i = 0; i < tumorCount; i++) {
      // Keep tumors within bounds
      const padding = width * 0.08;
      const x = padding + Math.random() * (width - padding * 2);
      const y = padding + Math.random() * (height - padding * 2);
      const tumorSize = width * (0.06 + Math.random() * 0.10); // 6-16% of width
      
      // Irregular tumor shape - multiple overlapping circles
      const lobes = 3 + Math.floor(Math.random() * 4);
      for (let l = 0; l < lobes; l++) {
        const angle = (l / lobes) * Math.PI * 2 + Math.random() * 0.5;
        const distance = tumorSize * (0.3 + Math.random() * 0.4);
        const lobeX = x + Math.cos(angle) * distance;
        const lobeY = y + Math.sin(angle) * distance;
        const lobeSize = tumorSize * (0.6 + Math.random() * 0.5);
        
        // Main lobe
        graphics.fillCircle(lobeX, lobeY, lobeSize);
      }
      
      // Dark veiny center for sick appearance
      const darkColor = ((color >> 2) & 0x3F3F3F); // Much darker
      graphics.fillStyle(darkColor, 1);
      graphics.fillCircle(x, y, tumorSize * 0.3);
      
      // Veins radiating from tumor - thicker and more visible
      const veinThickness = Math.max(1, width * 0.008);
      graphics.lineStyle(veinThickness, darkColor, 0.7);
      const veins = 4 + Math.floor(Math.random() * 5);
      for (let v = 0; v < veins; v++) {
        const veinAngle = (v / veins) * Math.PI * 2 + Math.random() * 0.4;
        const veinLength = tumorSize * (1.2 + Math.random() * 1.8);
        let endX = x + Math.cos(veinAngle) * veinLength;
        let endY = y + Math.sin(veinAngle) * veinLength;
        
        // Clamp veins to stay within bounds
        endX = Math.max(0, Math.min(width, endX));
        endY = Math.max(0, Math.min(height, endY));
        
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(endX, endY);
        graphics.strokePath();
      }
      
      // Reset for next tumor
      graphics.fillStyle(color, 0.9);
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
