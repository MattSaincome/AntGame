import { Scene } from 'phaser';
import { MonsterAppearance, MonsterLifeStage } from '../genetics/GeneticsTypes';

/**
 * Simplified monster renderer that uses basic shapes instead of missing sprites
 * This prevents 404 errors and ensures monsters are always visible
 */
export class SimplifiedMonsterRenderer {
  private scene: Scene;
  
  constructor(scene: Scene) {
    this.scene = scene;
  }
  
  /**
   * Create a simple but visible monster using basic shapes
   */
  createSimpleMonster(x: number, y: number, appearance: MonsterAppearance, lifeStage: MonsterLifeStage): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Calculate life stage scale
    const baseScale = appearance.scale;
    const lifeStageScale = lifeStage === MonsterLifeStage.BABY ? 0.5 :
                           lifeStage === MonsterLifeStage.JUVENILE ? 0.75 : 1.0;
    const finalScale = baseScale * lifeStageScale;
    
    // Parse colors
    const primaryColor = parseInt(appearance.primaryColor.replace('#', '0x'));
    const secondaryColor = parseInt(appearance.secondaryColor.replace('#', '0x'));
    
    // Create body (always visible oval)
    const bodyGraphics = this.scene.add.graphics();
    bodyGraphics.fillStyle(primaryColor, 1);
    bodyGraphics.fillEllipse(0, 0, 40 * finalScale, 30 * finalScale);
    bodyGraphics.setName('body');
    container.add(bodyGraphics);
    
    // Create head (circle on top)
    const headGraphics = this.scene.add.graphics();
    headGraphics.fillStyle(secondaryColor, 1);
    headGraphics.fillCircle(0, -20 * finalScale, 15 * finalScale);
    headGraphics.setName('head');
    container.add(headGraphics);
    
    // Add eyes
    const eyeGraphics = this.scene.add.graphics();
    eyeGraphics.fillStyle(0xFFFFFF, 1);
    eyeGraphics.fillCircle(-5 * finalScale, -20 * finalScale, 3 * finalScale);
    eyeGraphics.fillCircle(5 * finalScale, -20 * finalScale, 3 * finalScale);
    eyeGraphics.fillStyle(0x000000, 1);
    eyeGraphics.fillCircle(-5 * finalScale, -20 * finalScale, 1.5 * finalScale);
    eyeGraphics.fillCircle(5 * finalScale, -20 * finalScale, 1.5 * finalScale);
    container.add(eyeGraphics);
    
    // Add limbs based on genetics
    const limbCount = appearance.limbCount;
    for (let i = 0; i < Math.min(limbCount, 4); i++) {
      const limbGraphics = this.scene.add.graphics();
      limbGraphics.lineStyle(3 * finalScale, primaryColor, 0.8);
      
      const angle = (i / limbCount) * Math.PI - Math.PI / 2;
      const startX = Math.cos(angle) * 15 * finalScale;
      const startY = Math.sin(angle) * 10 * finalScale;
      const endX = startX + Math.cos(angle) * 20 * finalScale;
      const endY = startY + Math.sin(angle) * 20 * finalScale;
      
      limbGraphics.lineBetween(startX, startY, endX, endY);
      container.add(limbGraphics);
    }
    
    // Add wings if mutated
    if (appearance.mutations.includes('wings')) {
      const wingGraphics = this.scene.add.graphics();
      wingGraphics.fillStyle(primaryColor, 0.5);
      
      // Left wing
      wingGraphics.beginPath();
      wingGraphics.moveTo(-20 * finalScale, -10 * finalScale);
      wingGraphics.lineTo(-40 * finalScale, -15 * finalScale);
      wingGraphics.lineTo(-35 * finalScale, 5 * finalScale);
      wingGraphics.lineTo(-20 * finalScale, 0);
      wingGraphics.closePath();
      wingGraphics.fill();
      
      // Right wing
      wingGraphics.beginPath();
      wingGraphics.moveTo(20 * finalScale, -10 * finalScale);
      wingGraphics.lineTo(40 * finalScale, -15 * finalScale);
      wingGraphics.lineTo(35 * finalScale, 5 * finalScale);
      wingGraphics.lineTo(20 * finalScale, 0);
      wingGraphics.closePath();
      wingGraphics.fill();
      
      container.add(wingGraphics);
      container.sendToBack(wingGraphics);
    }
    
    // Add glow effect if mutated
    if (appearance.mutations.includes('glow')) {
      const glowGraphics = this.scene.add.graphics();
      glowGraphics.fillStyle(0xFFFF00, 0.3);
      glowGraphics.fillCircle(0, 0, 45 * finalScale);
      container.add(glowGraphics);
      container.sendToBack(glowGraphics);
    }
    
    container.setScale(finalScale);
    container.setData('appearance', appearance);
    container.setData('movementType', appearance.mutations.includes('wings') ? 'fly' : 'walk');
    
    return container;
  }
}
