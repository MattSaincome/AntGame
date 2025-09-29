import Phaser from 'phaser';
import { ResourceChunk } from './ResourceChunk';

export class ColonyHive {
  public x: number;
  public y: number;
  public radius: number;
  private sprite!: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private pulseTimer: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = 24; // Collection radius
    this.pulseTimer = 0;
    
    this.createHiveSprite();
  }

  /**
   * Create the visual representation of the hive
   */
  private createHiveSprite(): void {
    this.sprite = this.scene.add.graphics();
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.drawHive();
  }

  /**
   * Draw the queen monster organism - beating, living hive center
   */
  private drawHive(): void {
    this.sprite.clear();
    
    // Calculate pulsing/breathing effect
    const pulseIntensity = 0.8 + Math.sin(this.pulseTimer) * 0.2;
    const breathingSize = 1 + Math.sin(this.pulseTimer * 0.7) * 0.1;
    
    // Main queen body - organic, living creature
    this.sprite.fillStyle(0x4A0E4E, 0.9); // Deep purple queen color
    this.sprite.fillEllipse(0, 0, this.radius * 2.2 * breathingSize, this.radius * 1.8 * breathingSize);
    
    // Queen's segments - like a large insect queen
    this.sprite.fillStyle(0x5D1A61, 0.8); // Lighter purple
    this.sprite.fillEllipse(0, -this.radius * 0.3, this.radius * 1.8 * breathingSize, this.radius * 0.8);
    this.sprite.fillEllipse(0, 0, this.radius * 1.6 * breathingSize, this.radius * 0.9);
    this.sprite.fillEllipse(0, this.radius * 0.3, this.radius * 1.9 * breathingSize, this.radius * 1.1);
    
    // Queen's head area
    this.sprite.fillStyle(0x6A1B6B, 0.9);
    this.sprite.fillCircle(0, -this.radius * 0.7, this.radius * 0.6 * breathingSize);
    
    // Glowing eyes that watch over the colony
    const eyeGlow = 0.7 + Math.sin(this.pulseTimer * 2) * 0.3;
    this.sprite.fillStyle(0xFF4444, eyeGlow);
    this.sprite.fillCircle(-this.radius * 0.2, -this.radius * 0.8, 3);
    this.sprite.fillCircle(this.radius * 0.2, -this.radius * 0.8, 3);
    
    // Pulsing heart/core - the life force of the colony
    const heartPulse = 0.6 + Math.sin(this.pulseTimer * 3) * 0.4;
    this.sprite.fillStyle(0xFF6B35, heartPulse * 0.8); // Orange heart
    this.sprite.fillCircle(0, 0, this.radius * 0.3 * (1 + heartPulse * 0.2));
    
    // Inner glow showing it's alive
    this.sprite.fillStyle(0xFFAA55, heartPulse * 0.4);
    this.sprite.fillCircle(0, 0, this.radius * 0.5 * breathingSize);
    
    // Queen's feeding tubes/resource collectors
    this.sprite.lineStyle(3, 0x3E1041, 0.7);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const length = this.radius * (0.8 + Math.sin(this.pulseTimer + i) * 0.2);
      const endX = Math.cos(angle) * length;
      const endY = Math.sin(angle) * length;
      
      this.sprite.lineBetween(0, 0, endX, endY);
      
      // Resource collection nodes at the end of tubes
      this.sprite.fillStyle(0x8B4513, 0.6);
      this.sprite.fillCircle(endX, endY, 4);
    }
    
    // Organic texture - queen's skin patterns
    this.sprite.fillStyle(0x2D0A2F, 0.3);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = this.radius * (0.4 + Math.random() * 0.6);
      const size = 2 + Math.random() * 4;
      const x = Math.cos(angle) * distance * breathingSize;
      const y = Math.sin(angle) * distance * breathingSize;
      this.sprite.fillCircle(x, y, size);
    }
    
    // Resource collection area indicator
    this.sprite.lineStyle(2, 0xFFAA00, 0.3);
    this.sprite.strokeCircle(0, 0, this.radius * 0.9);
    
    this.sprite.setDepth(this.y - 10); // Behind monsters but visible
  }

  /**
   * Update the hive (animate pulsing, etc.)
   */
  update(deltaTime: number): void {
    this.pulseTimer += deltaTime * 3; // Pulse speed
    
    // Redraw with new pulse
    this.drawHive();
  }

  /**
   * Check if a position is within the hive's collection radius
   */
  isWithinCollectionRadius(x: number, y: number): boolean {
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.radius;
  }

  /**
   * Check if a chunk can be deposited (is close enough)
   */
  canDepositChunk(chunk: ResourceChunk): boolean {
    return this.isWithinCollectionRadius(chunk.x, chunk.y);
  }

  /**
   * Get the center position for monsters to target when carrying resources
   */
  getDepositPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * Create particle effect when resources are deposited
   */
  createDepositEffect(chunk: ResourceChunk): void {
    // Create simple particle effect
    const particles = this.scene.add.graphics();
    particles.x = chunk.x;
    particles.y = chunk.y;
    
    // Draw several small particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 5 + Math.random() * 10;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      particles.fillStyle(0xFFD700, 0.8); // Gold sparkle
      particles.fillCircle(x, y, 1 + Math.random() * 2);
    }
    
    // Animate particles fading out
    this.scene.tweens.add({
      targets: particles,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        particles.destroy();
      }
    });
  }

  /**
   * Show collection radius for debugging/UI
   */
  showCollectionRadius(show: boolean = true): void {
    if (show) {
      this.sprite.lineStyle(2, 0x00FF00, 0.3);
      this.sprite.strokeCircle(0, 0, this.radius);
    }
  }

  /**
   * Cleanup when hive is destroyed
   */
  destroy(): void {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
