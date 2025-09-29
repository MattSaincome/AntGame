import Phaser from 'phaser';
import { Monster, MonsterState } from './Monster';
import { MonsterGenetics } from '../genetics/GeneticsTypes';

export class MonsterSprite extends Phaser.GameObjects.Container {
  private creatureBody: Phaser.GameObjects.Graphics;
  private healthBar: Phaser.GameObjects.Graphics;
  private selectionCircle: Phaser.GameObjects.Graphics;
  private monster: Monster;
  
  // Visual properties calculated from genetics
  private bodyShape: number = 0;
  private hasStripes: boolean = false;
  private hasSpots: boolean = false;
  private hasGlow: boolean = false;
  private hasSpikes: boolean = false;
  private tentacleCount: number = 0;
  private limbCount: number = 0;
  private limbLength: number = 0;
  private tailLength: number = 0;
  private wingSize: number = 0;
  private hornSize: number = 0;
  private antennaLength: number = 0;
  private eyeCount: number = 2;
  private patternComplexity: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, monster: Monster) {
    super(scene, x, y);
    
    this.monster = monster;
    
    // Calculate visual properties from genetics
    this.calculateVisualTraits();
    
    // Create graphics components
    this.creatureBody = scene.add.graphics();
    this.healthBar = scene.add.graphics();
    this.selectionCircle = scene.add.graphics();
    
    // Setup selection circle
    this.selectionCircle.lineStyle(2, 0x00ff00);
    this.selectionCircle.strokeCircle(0, 0, monster.stats.size * 16);
    this.selectionCircle.setVisible(false);
    
    // Add components to container
    this.add([this.creatureBody, this.healthBar, this.selectionCircle]);
    
    // Initial draw
    this.drawCreatureBody();
    this.updateHealthBar();
    
    scene.add.existing(this);
  }

  /**
   * Calculate visual traits from genetics
   */
  private calculateVisualTraits(): void {
    const genetics = this.monster.genetics;
    
    // Body shape based on genetics
    this.bodyShape = Math.floor((genetics.adaptability.value / 255) * 6);
    
    // Patterns
    this.hasStripes = genetics.speed.value > 180;
    this.hasSpots = genetics.curiosity.value > 170;
    this.patternComplexity = genetics.social.value / 255;
    
    // Special features
    this.hasGlow = genetics.adaptability.value > 200;
    this.hasSpikes = genetics.defense.value > 190;
    
    // Appendages based on genetics
    this.tentacleCount = genetics.social.value > 180 ? Math.floor(genetics.social.value / 50) : 0;
    this.limbCount = Math.floor(2 + (genetics.strength.value / 255) * 4);
    this.limbLength = genetics.speed.value / 255;
    this.tailLength = genetics.speed.value / 255;
    this.wingSize = genetics.speed.value > 200 ? (genetics.speed.value - 200) / 55 : 0;
    this.hornSize = genetics.attack.value > 180 ? (genetics.attack.value - 180) / 75 : 0;
    this.antennaLength = genetics.curiosity.value / 255;
    this.eyeCount = genetics.curiosity.value > 150 ? 2 + Math.floor((genetics.curiosity.value - 150) / 50) : 2;
  }

  /**
   * Draw the creature body with genetics-based features
   */
  private drawCreatureBody(): void {
    this.creatureBody.clear();
    
    // Calculate size based on genetics and age
    const baseSizeFromGenetics = this.monster.stats.size * 16;
    const ageSizeMultiplier = this.getAgeSizeMultiplier(this.monster.age);
    const size = baseSizeFromGenetics * ageSizeMultiplier;
    
    // Parse color from RGB string
    const colorMatch = this.monster.stats.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const color = colorMatch 
      ? Phaser.Display.Color.GetColor32(parseInt(colorMatch[1]), parseInt(colorMatch[2]), parseInt(colorMatch[3]), 255)
      : 0x888888;
    
    // Create color variations
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    const darkColor = Phaser.Display.Color.GetColor(r * 0.6, g * 0.6, b * 0.6);
    const lightColor = Phaser.Display.Color.GetColor(Math.min(255, r * 1.3), Math.min(255, g * 1.3), Math.min(255, b * 1.3));
    
    // Draw glow effect if bioluminescent
    if (this.hasGlow) {
      this.creatureBody.fillStyle(color, 0.3);
      this.creatureBody.fillCircle(0, 0, size * 1.5);
    }
    
    // Draw main body based on body shape
    this.creatureBody.fillStyle(color);
    
    switch (this.bodyShape) {
      case 0:  // Circle (default)
        this.creatureBody.fillCircle(0, 0, size);
        break;
      case 1:  // Elongated oval
        this.creatureBody.fillEllipse(0, 0, size * 0.8, size * 1.3);
        break;
      case 2:  // Segmented (ant-like)
        this.creatureBody.fillCircle(0, size * 0.3, size * 0.5);  // Head
        this.creatureBody.fillCircle(0, 0, size * 0.6);  // Thorax
        this.creatureBody.fillCircle(0, -size * 0.4, size * 0.7);  // Abdomen
        break;
      case 3:  // Square/blocky
        this.creatureBody.fillRect(-size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
        break;
      case 4:  // Star-shaped
        this.drawStar(0, 0, 5, size, size * 0.5, color);
        break;
      case 5:  // Hexagonal
        this.drawPolygon(0, 0, 6, size, color);
        break;
      default:
        this.creatureBody.fillCircle(0, 0, size);
    }
    
    // Draw patterns
    if (this.hasStripes) {
      this.drawStripes(size, darkColor);
    } else if (this.hasSpots) {
      this.drawSpots(size, darkColor, lightColor);
    }
    
    // Draw features
    this.drawCreatureFeatures(size, color, darkColor, lightColor);
  }

  /**
   * Age-based size scaling
   */
  private getAgeSizeMultiplier(age: number): number {
    const MATURITY_AGE = 60; // 1 minute to mature
    
    if (age <= 0) return 0.3; // Small baby size
    if (age >= MATURITY_AGE) return 1.0; // Full adult size
    
    const growthProgress = age / MATURITY_AGE;
    const smoothGrowth = Math.pow(growthProgress, 0.7);
    return 0.3 + (0.7 * smoothGrowth);
  }

  /**
   * Draw creature features based on genetics
   */
  private drawCreatureFeatures(size: number, color: number, darkColor: number, lightColor: number): void {
    // Draw tentacles
    if (this.tentacleCount > 0) {
      this.drawTentacles(size, darkColor, this.tentacleCount);
    }
    
    // Draw limbs
    if (this.limbCount > 0) {
      this.drawLimbs(size, darkColor, this.limbCount, this.limbLength);
    }
    
    // Draw tail
    if (this.tailLength > 0.1) {
      this.drawTail(size, color, darkColor, this.tailLength);
    }
    
    // Draw wings
    if (this.wingSize > 0.1) {
      this.drawWings(size, lightColor, this.wingSize);
    }
    
    // Draw horns
    if (this.hornSize > 0.1) {
      this.drawHorns(size, darkColor, this.hornSize);
    }
    
    // Draw spikes
    if (this.hasSpikes) {
      this.drawSpikes(size, darkColor);
    }
    
    // Draw antennae
    if (this.antennaLength > 0.1) {
      this.drawAntennae(size, darkColor, this.antennaLength);
    }
    
    // Draw eyes
    this.drawEyes(size, this.eyeCount);
  }

  /**
   * Helper drawing methods
   */
  private drawStar(x: number, y: number, points: number, outerRadius: number, innerRadius: number, color: number): void {
    this.creatureBody.fillStyle(color);
    this.creatureBody.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) {
        this.creatureBody.moveTo(px, py);
      } else {
        this.creatureBody.lineTo(px, py);
      }
    }
    this.creatureBody.closePath();
    this.creatureBody.fillPath();
  }

  private drawPolygon(x: number, y: number, sides: number, radius: number, color: number): void {
    this.creatureBody.fillStyle(color);
    this.creatureBody.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) {
        this.creatureBody.moveTo(px, py);
      } else {
        this.creatureBody.lineTo(px, py);
      }
    }
    this.creatureBody.closePath();
    this.creatureBody.fillPath();
  }

  private drawStripes(size: number, color: number): void {
    this.creatureBody.fillStyle(color, 0.5);
    const stripeCount = 3 + Math.floor(this.patternComplexity * 4);
    for (let i = 0; i < stripeCount; i++) {
      const y = -size + (i * size * 2 / stripeCount);
      this.creatureBody.fillRect(-size, y, size * 2, size * 0.2);
    }
  }

  private drawSpots(size: number, darkColor: number, lightColor: number): void {
    const spotCount = 5 + Math.floor(this.patternComplexity * 10);
    for (let i = 0; i < spotCount; i++) {
      const angle = (i / spotCount) * Math.PI * 2;
      const distance = size * (0.3 + Math.random() * 0.5);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const spotSize = size * (0.1 + Math.random() * 0.15);
      this.creatureBody.fillStyle(i % 2 === 0 ? darkColor : lightColor, 0.6);
      this.creatureBody.fillCircle(x, y, spotSize);
    }
  }

  private drawTentacles(size: number, color: number, count: number): void {
    this.creatureBody.lineStyle(size * 0.15, color, 0.8);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const startX = Math.cos(angle) * size * 0.5;
      const startY = Math.sin(angle) * size * 0.5;
      const endX = Math.cos(angle) * size * 1.5;
      const endY = Math.sin(angle) * size * 1.5;
      
      this.creatureBody.lineBetween(startX, startY, endX, endY);
      
      // Tentacle tip
      this.creatureBody.fillStyle(color, 0.7);
      this.creatureBody.fillCircle(endX, endY, size * 0.05);
    }
  }

  private drawLimbs(size: number, color: number, count: number, length: number): void {
    this.creatureBody.lineStyle(size * 0.1, color);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const startX = Math.cos(angle) * size * 0.8;
      const startY = Math.sin(angle) * size * 0.8;
      const limbLength = size * (0.5 + length);
      const endX = Math.cos(angle) * (size * 0.8 + limbLength);
      const endY = Math.sin(angle) * (size * 0.8 + limbLength);
      
      this.creatureBody.lineBetween(startX, startY, endX, endY);
      
      // Foot/claw
      this.creatureBody.fillStyle(color);
      this.creatureBody.fillCircle(endX, endY, size * 0.08);
    }
  }

  private drawTail(size: number, mainColor: number, darkColor: number, length: number): void {
    const tailLength = size * (1 + length * 2);
    this.creatureBody.lineStyle(size * 0.2, darkColor);
    this.creatureBody.lineBetween(0, -size, 0, -size - tailLength);
    
    // Tail tip
    this.creatureBody.fillStyle(mainColor);
    this.creatureBody.fillCircle(0, -size - tailLength, size * 0.1);
  }

  private drawWings(size: number, color: number, wingSize: number): void {
    const wingLength = size * wingSize * 1.5;
    this.creatureBody.fillStyle(color, 0.6);
    
    // Left wing
    this.creatureBody.fillEllipse(-size * 0.5, 0, wingLength, size * 0.8);
    // Right wing
    this.creatureBody.fillEllipse(size * 0.5, 0, wingLength, size * 0.8);
  }

  private drawHorns(size: number, color: number, hornSize: number): void {
    const hornLength = size * hornSize;
    this.creatureBody.lineStyle(size * 0.15, color);
    
    // Left horn
    this.creatureBody.lineBetween(-size * 0.3, -size, -size * 0.3, -size - hornLength);
    // Right horn
    this.creatureBody.lineBetween(size * 0.3, -size, size * 0.3, -size - hornLength);
  }

  private drawSpikes(size: number, color: number): void {
    this.creatureBody.fillStyle(color, 0.8);
    const spikeCount = 8;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2;
      const baseX = Math.cos(angle) * size * 0.9;
      const baseY = Math.sin(angle) * size * 0.9;
      const tipX = Math.cos(angle) * size * 1.3;
      const tipY = Math.sin(angle) * size * 1.3;
      
      this.creatureBody.beginPath();
      this.creatureBody.moveTo(baseX - 2, baseY);
      this.creatureBody.lineTo(tipX, tipY);
      this.creatureBody.lineTo(baseX + 2, baseY);
      this.creatureBody.closePath();
      this.creatureBody.fillPath();
    }
  }

  private drawAntennae(size: number, color: number, length: number): void {
    const antennaLength = size * length;
    this.creatureBody.lineStyle(size * 0.08, color);
    
    // Left antenna
    this.creatureBody.lineBetween(-size * 0.2, -size, -size * 0.4, -size - antennaLength);
    // Right antenna
    this.creatureBody.lineBetween(size * 0.2, -size, size * 0.4, -size - antennaLength);
    
    // Antenna tips
    this.creatureBody.fillStyle(color);
    this.creatureBody.fillCircle(-size * 0.4, -size - antennaLength, size * 0.05);
    this.creatureBody.fillCircle(size * 0.4, -size - antennaLength, size * 0.05);
  }

  private drawEyes(size: number, count: number): void {
    this.creatureBody.fillStyle(0xffffff);
    
    if (count === 1) {
      // Single eye in center
      this.creatureBody.fillCircle(0, -size * 0.2, size * 0.15);
      this.creatureBody.fillStyle(0x000000);
      this.creatureBody.fillCircle(0, -size * 0.2, size * 0.08);
    } else if (count === 2) {
      // Two eyes
      this.creatureBody.fillCircle(-size * 0.2, -size * 0.2, size * 0.12);
      this.creatureBody.fillCircle(size * 0.2, -size * 0.2, size * 0.12);
      this.creatureBody.fillStyle(0x000000);
      this.creatureBody.fillCircle(-size * 0.2, -size * 0.2, size * 0.06);
      this.creatureBody.fillCircle(size * 0.2, -size * 0.2, size * 0.06);
    } else {
      // Multiple eyes in a row
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * size * 0.2;
        this.creatureBody.fillCircle(x, -size * 0.2, size * 0.08);
        this.creatureBody.fillStyle(0x000000);
        this.creatureBody.fillCircle(x, -size * 0.2, size * 0.04);
        this.creatureBody.fillStyle(0xffffff);
      }
    }
  }

  /**
   * Update the health bar
   */
  private updateHealthBar(): void {
    this.healthBar.clear();
    
    const healthPercent = this.monster.stats.currentHealth / this.monster.stats.maxHealth;
    const energyPercent = this.monster.energy / 100;
    
    // Health bar (red/green)
    const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
    this.healthBar.fillStyle(0x000000);
    this.healthBar.fillRect(-12, -25, 24, 4);
    this.healthBar.fillStyle(healthColor);
    this.healthBar.fillRect(-10, -23, 20 * healthPercent, 2);
    
    // Energy bar (blue)
    this.healthBar.fillStyle(0x000000);
    this.healthBar.fillRect(-12, -20, 24, 3);
    this.healthBar.fillStyle(0x0088ff);
    this.healthBar.fillRect(-10, -18, 20 * energyPercent, 1);
  }

  /**
   * Update the sprite each frame
   */
  update(): void {
    // Update position
    this.x = this.monster.position.x;
    this.y = this.monster.position.y;
    
    // Update health bar
    this.updateHealthBar();
    
    // Handle mining animation
    this.updateMiningAnimation();
    
    // Handle wall-crawling visual changes
    this.updateWallCrawlingVisuals();
    
    // Handle resting/sleeping animations
    this.updateRestingVisuals();
    
    // Redraw body if age changed significantly (growth)
    const expectedSize = this.getAgeSizeMultiplier(this.monster.age);
    if (Math.abs(expectedSize - this.getAgeSizeMultiplier(this.monster.age - 1)) > 0.05) {
      this.drawCreatureBody();
    }
    
    // Set depth based on Y position for proper layering
    this.setDepth(this.y);
  }

  /**
   * Update mining animation when monster is mining
   */
  private updateMiningAnimation(): void {
    if (this.monster.state === MonsterState.MINING) {
      // Create subtle shaking effect to show effort
      const shakeIntensity = 0.5; // Much more subtle (was 2)
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      
      this.creatureBody.x = shakeX;
      this.creatureBody.y = shakeY;
      
      // Show strain by adjusting alpha to show effort
      this.alpha = 0.95; // Less extreme alpha change (was 0.9)
    } else if (!this.monster.isWallCrawling) {
      // Reset position and alpha when not mining (unless wall crawling)
      this.creatureBody.x = 0;
      this.creatureBody.y = 0;
      this.alpha = 1.0;
    }
  }

  /**
   * Update visual appearance when wall-crawling
   */
  private updateWallCrawlingVisuals(): void {
    if (this.monster.isWallCrawling) {
      // Flip horizontally to show monster's back (facing the wall)
      this.scaleX = -Math.abs(this.scaleX); // Always negative when wall crawling
      
      // Slightly dim to show it's more difficult
      this.alpha = 0.8;
      
      // Slight upward tilt to show climbing effort
      this.rotation = (Math.random() - 0.5) * 0.1;
      
    } else if (this.monster.facingBackward) {
      // Still showing back but not actively wall crawling
      this.scaleX = -Math.abs(this.scaleX);
      this.alpha = 0.9;
      this.rotation = 0;
      
    } else {
      // Normal forward-facing
      this.scaleX = Math.abs(this.scaleX); // Always positive when facing forward
      this.rotation = 0;
      
      if (this.monster.state !== MonsterState.MINING) {
        this.alpha = 1.0;
      }
    }
  }

  /**
   * Update visual appearance when resting or sleeping
   */
  private updateRestingVisuals(): void {
    if (this.monster.state === MonsterState.RESTING) {
      // Resting at hive - peaceful, upright position
      this.rotation = 0;
      this.alpha = 0.9;
      this.scaleY = 1.0;
      
      // Gentle pulsing to show breathing
      const breathingScale = 0.95 + Math.sin(Date.now() * 0.003) * 0.05;
      this.scaleX = Math.abs(this.scaleX) * breathingScale;
      
    } else if (this.monster.state === MonsterState.SLEEPING) {
      // Sleeping on ground - lying down
      this.alpha = 0.7; // Dimmer when sleeping
      this.scaleY = 0.6; // Flattened to show lying down
      
      // Very slow breathing
      const breathingScale = 0.9 + Math.sin(Date.now() * 0.002) * 0.1;
      this.scaleX = Math.abs(this.scaleX) * breathingScale;
      
      // Slight tilt to show relaxed position
      this.rotation = (Math.random() - 0.5) * 0.05;
      
    } else if (this.monster.state !== MonsterState.MINING && 
               this.monster.state !== MonsterState.RESTING && 
               this.monster.state !== MonsterState.SLEEPING && 
               !this.monster.isWallCrawling) {
      // Normal active state - reset all rest effects
      this.alpha = 1.0;
      this.scaleY = 1.0;
      this.rotation = 0;
    }
  }

  /**
   * Show/hide selection circle
   */
  setSelected(selected: boolean): void {
    this.selectionCircle.setVisible(selected);
  }

  /**
   * Cleanup when monster dies
   */
  destroy(): void {
    this.creatureBody.destroy();
    this.healthBar.destroy();
    this.selectionCircle.destroy();
    super.destroy();
  }
}
