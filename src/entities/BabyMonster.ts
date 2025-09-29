import { MonsterGenetics } from '../genetics/GeneticsTypes';
import { GeneticsEngine } from '../genetics/GeneticsEngine';

export class BabyMonster {
  public id: string;
  public genetics: MonsterGenetics;
  public position: { x: number; y: number };
  public age: number; // Time since birth
  public growthTime: number; // Time needed to become adult
  public isPlayerOwned: boolean;
  
  // Visual properties
  public sprite: Phaser.GameObjects.Sprite | null = null;

  constructor(genetics: MonsterGenetics, x: number, y: number, isPlayerOwned: boolean = true) {
    this.id = genetics.uniqueId;
    this.genetics = genetics;
    this.position = { x, y };
    this.age = 0;
    this.isPlayerOwned = isPlayerOwned;
    
    // Growth time depends on genetics - fertility affects growth speed
    const fertilityBonus = genetics.fertility.value / 255;
    this.growthTime = 30 + Math.random() * 20 - (fertilityBonus * 10); // 20-40 seconds, faster with high fertility
  }

  /**
   * Update baby monster - just grow older
   */
  update(deltaTime: number): void {
    this.age += deltaTime;
  }

  /**
   * Check if baby is ready to become adult
   */
  isReadyToGrowUp(): boolean {
    return this.age >= this.growthTime;
  }

  /**
   * Get growth progress as percentage
   */
  getGrowthProgress(): number {
    return Math.min(this.age / this.growthTime, 1.0);
  }

  /**
   * Create visual sprite for baby
   */
  createSprite(scene: Phaser.Scene): void {
    // Babies are much smaller and different colored
    const graphics = scene.add.graphics();
    
    // Baby size - much smaller than adults
    const size = 6 + (this.getGrowthProgress() * 4); // Grows from 6 to 10 pixels
    
    // Baby color - lighter/more pastel version of adult colors
    let bodyColor = 0xFFB6C1; // Light pink base
    
    // Slightly different color based on genetics
    const colorVariation = (this.genetics.strength.value + this.genetics.speed.value) / 2;
    if (colorVariation > 170) {
      bodyColor = 0xFFE4E1; // Misty rose for strong babies
    } else if (colorVariation > 85) {
      bodyColor = 0xFFDAB9; // Peach puff for average babies
    }
    
    // Draw baby body - round and cute
    graphics.fillStyle(bodyColor, 0.9);
    graphics.fillCircle(0, 0, size);
    
    // Baby eyes - big and innocent
    graphics.fillStyle(0x000000, 0.8);
    graphics.fillCircle(-size/3, -size/4, size/4);
    graphics.fillCircle(size/3, -size/4, size/4);
    
    // Create sprite from graphics
    const textureKey = `baby_${this.id}_${Date.now()}`;
    const texture = graphics.generateTexture(textureKey, size * 2, size * 2);
    graphics.destroy();
    
    this.sprite = scene.add.sprite(this.position.x, this.position.y, textureKey);
    this.sprite.setDepth(this.position.y + 50); // Above ground but below adults
    
    // Baby animation - gentle bobbing
    scene.tweens.add({
      targets: this.sprite,
      y: this.position.y - 2,
      duration: 1000 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Update sprite position and appearance
   */
  updateSprite(): void {
    if (this.sprite) {
      this.sprite.x = this.position.x;
      this.sprite.y = this.position.y;
      
      // Scale sprite based on growth
      const scale = 0.6 + (this.getGrowthProgress() * 0.4); // Grows from 60% to 100% scale
      this.sprite.setScale(scale);
    }
  }

  /**
   * Cleanup when baby grows up or dies
   */
  destroy(): void {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
