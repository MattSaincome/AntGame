import Phaser from 'phaser';
import { TileType } from '../world/TileTypes';

export class MiningEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create mining animation on a monster when they're working on a block
   */
  createMiningAnimation(monsterX: number, monsterY: number, targetTileX: number, targetTileY: number): void {
    // Create mining strike effect
    const strikeEffect = this.scene.add.graphics();
    strikeEffect.x = targetTileX * 16 + 8;
    strikeEffect.y = targetTileY * 16 + 8;
    
    // Flash effect
    strikeEffect.fillStyle(0xFFFFFF, 0.8);
    strikeEffect.fillCircle(0, 0, 3);
    
    // Animate the strike
    this.scene.tweens.add({
      targets: strikeEffect,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => strikeEffect.destroy()
    });

    // Create dust particles from mining
    this.createMiningDust(targetTileX * 16 + 8, targetTileY * 16 + 8);
  }

  /**
   * Create satisfying block break effect with particles and chunks
   */
  createBlockBreakEffect(tileX: number, tileY: number, tileType: TileType): void {
    const centerX = tileX * 16 + 8;
    const centerY = tileY * 16 + 8;
    
    // Get color based on tile type
    const colors = this.getTileColors(tileType);
    
    // Create explosion effect
    const explosion = this.scene.add.graphics();
    explosion.x = centerX;
    explosion.y = centerY;
    
    // Main explosion flash
    explosion.fillStyle(colors.flash, 0.9);
    explosion.fillCircle(0, 0, 8);
    
    // Animate explosion
    this.scene.tweens.add({
      targets: explosion,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => explosion.destroy()
    });

    // Create flying debris particles
    this.createDebrisParticles(centerX, centerY, colors.debris, tileType);
    
    // Create impact shockwave
    this.createShockwave(centerX, centerY);
    
    // Camera shake disabled
  }

  /**
   * Create mining dust effect
   */
  private createMiningDust(x: number, y: number): void {
    const dustParticles = this.scene.add.graphics();
    dustParticles.x = x;
    dustParticles.y = y;
    
    // Create fewer, smaller dust particles
    for (let i = 0; i < 4; i++) { // Fewer particles (was 6)
      const angle = (i / 4) * Math.PI * 2;
      const distance = 3 + Math.random() * 5; // Shorter range (was 5 + Math.random() * 8)
      const px = Math.cos(angle) * distance;
      const py = Math.sin(angle) * distance;
      const size = 0.5 + Math.random() * 1; // Smaller particles (was 1 + Math.random() * 2)
      
      dustParticles.fillStyle(0xBDB76B, 0.4); // More transparent (was 0.6)
      dustParticles.fillCircle(px, py, size);
    }
    
    // Animate dust dispersing
    this.scene.tweens.add({
      targets: dustParticles,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 800,
      ease: 'Power1',
      onComplete: () => dustParticles.destroy()
    });
  }

  /**
   * Create debris particles flying out from broken block
   */
  private createDebrisParticles(x: number, y: number, color: number, tileType: TileType): void {
    const particleCount = tileType === TileType.ORE_GOLD || tileType === TileType.CRYSTAL ? 12 : 8;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.graphics();
      particle.x = x;
      particle.y = y;
      
      // Random particle shape based on material
      const size = tileType === TileType.CRYSTAL ? 3 + Math.random() * 2 : 2 + Math.random() * 3;
      
      if (tileType === TileType.CRYSTAL) {
        // Crystalline particles - sharp edges
        particle.fillStyle(color, 0.9);
        particle.fillRect(-size/2, -size/2, size, size);
        particle.setRotation(Math.random() * Math.PI);
      } else {
        // Regular particles - round
        particle.fillStyle(color, 0.8);
        particle.fillCircle(0, 0, size);
      }
      
      // Random flight direction and distance
      const angle = Math.random() * Math.PI * 2;
      const velocity = 30 + Math.random() * 40;
      const targetX = x + Math.cos(angle) * velocity;
      const targetY = y + Math.sin(angle) * velocity + Math.random() * 20; // Slight downward bias
      
      // Animate particle flying out and fading
      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        rotation: particle.rotation + (Math.random() - 0.5) * 4,
        alpha: 0,
        duration: 600 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Create subtle shockwave effect
   */
  private createShockwave(x: number, y: number): void {
    const shockwave = this.scene.add.graphics();
    shockwave.x = x;
    shockwave.y = y;
    
    shockwave.lineStyle(1, 0xFFFFFF, 0.3); // Thinner line, lower opacity (was 2, 0.6)
    shockwave.strokeCircle(0, 0, 3); // Smaller starting size (was 5)
    
    this.scene.tweens.add({
      targets: shockwave,
      scaleX: 4, // Smaller max scale (was 8)
      scaleY: 4, // Smaller max scale (was 8)
      alpha: 0,
      duration: 300, // Faster animation (was 400)
      ease: 'Power2',
      onComplete: () => shockwave.destroy()
    });
  }

  /**
   * Create excitement effect when valuable resources are found
   */
  createResourceDiscoveryEffect(x: number, y: number, resourceValue: number): void {
    if (resourceValue <= 0) return;
    
    // Create sparkle effect for valuable finds
    const sparkleCount = Math.min(resourceValue, 8);
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = this.scene.add.graphics();
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      
      sparkle.x = x + offsetX;
      sparkle.y = y + offsetY;
      
      // Golden sparkle
      sparkle.fillStyle(0xFFD700, 0.9);
      sparkle.fillCircle(0, 0, 2);
      
      // Animate sparkle
      this.scene.tweens.add({
        targets: sparkle,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        y: sparkle.y - 20,
        duration: 1000 + Math.random() * 500,
        ease: 'Power1',
        delay: i * 100,
        onComplete: () => sparkle.destroy()
      });
    }
    
    // Show resource value popup
    if (resourceValue > 5) {
      this.createResourcePopup(x, y, resourceValue);
    }
  }

  /**
   * Create popup showing resource value
   */
  private createResourcePopup(x: number, y: number, value: number): void {
    const popup = this.scene.add.text(x, y, `+${value}`, {
      fontSize: '12px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    popup.setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: popup,
      y: popup.y - 30,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => popup.destroy()
    });
  }

  /**
   * Get appropriate colors for different tile types
   */
  private getTileColors(tileType: TileType): { flash: number; debris: number } {
    switch (tileType) {
      case TileType.DIRT:
        return { flash: 0x8B4513, debris: 0x654321 };
      case TileType.STONE:
        return { flash: 0x808080, debris: 0x696969 };
      case TileType.ROCK:
        return { flash: 0x2F4F4F, debris: 0x1C1C1C };
      case TileType.ORE_COPPER:
        return { flash: 0xB87333, debris: 0x8B4513 };
      case TileType.ORE_IRON:
        return { flash: 0x464451, debris: 0x2F2F2F };
      case TileType.ORE_GOLD:
        return { flash: 0xFFD700, debris: 0xDAA520 };
      case TileType.CRYSTAL:
        return { flash: 0xFF69B4, debris: 0xFF1493 };
      default:
        return { flash: 0xFFFFFF, debris: 0x808080 };
    }
  }

  /**
   * Create monster effort effect (sweat, strain)
   */
  createEffortEffect(monsterX: number, monsterY: number): void {
    // Create sweat drops
    for (let i = 0; i < 3; i++) {
      const sweat = this.scene.add.graphics();
      sweat.x = monsterX + (Math.random() - 0.5) * 8;
      sweat.y = monsterY - 8 - Math.random() * 4;
      
      sweat.fillStyle(0x87CEEB, 0.7); // Light blue sweat
      sweat.fillCircle(0, 0, 1 + Math.random());
      
      this.scene.tweens.add({
        targets: sweat,
        y: sweat.y + 15,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        ease: 'Power1',
        delay: i * 200,
        onComplete: () => sweat.destroy()
      });
    }
  }
}
