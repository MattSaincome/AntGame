import { Scene } from 'phaser';
import { MonsterAppearance, MonsterLifeStage } from '../genetics/GeneticsTypes';

/**
 * TRUE Procedural Monster Renderer - Uses actual sprite files!
 * Each monster randomly combines different creature sprites for unique appearances
 */
export class ProceduralMonsterRenderer {
  private scene: Scene;
  
  // Available monster types from the sprite pack
  private monsterTypes = [
    'BubbleFloat',
    'CrystalGolem', 
    'FireImp',
    'IceShard',
    'LightningBug',
    'MushroomSprout',
    'RockMuncher',
    'ShadowSprite',
    'SlimeBlob',
    'VoidWalker'
  ];
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.preloadMonsterSprites();
  }
  
  /**
   * Preload all monster sprites
   */
  private preloadMonsterSprites(): void {
    console.log('ProceduralMonsterRenderer: Loading actual monster sprites...');
    
    // Load the first frame of each monster for static display
    this.monsterTypes.forEach(type => {
      const key = `monster_${type}`;
      const path = `/monsters/${type}_Walking_000.png`;
      
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, path);
      }
    });
    
    // Start loading
    this.scene.load.start();
  }
  
  /**
   * Create a truly procedural monster using actual sprites
   */
  createProceduralMonster(x: number, y: number, appearance: MonsterAppearance, lifeStage: MonsterLifeStage): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Determine which monster sprite to use based on genetics
    // Use head gene to select primary monster type
    const monsterIndex = Math.floor((appearance.headType.replace('head_', '') as any) * this.monsterTypes.length / 3);
    const monsterType = this.monsterTypes[Math.min(monsterIndex, this.monsterTypes.length - 1)];
    
    // Create the main monster sprite
    const spriteKey = `monster_${monsterType}`;
    
    let mainSprite: Phaser.GameObjects.Sprite;
    if (this.scene.textures.exists(spriteKey)) {
      mainSprite = this.scene.add.sprite(0, 0, spriteKey);
    } else {
      // Fallback to a simple shape if sprite not loaded
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xFF00FF);
      graphics.fillCircle(0, 0, 16);
      graphics.generateTexture('fallback_monster', 32, 32);
      mainSprite = this.scene.add.sprite(0, 0, 'fallback_monster');
      graphics.destroy();
    }
    
    // Apply genetic variations
    this.applyGeneticVariations(mainSprite, appearance);
    
    // Apply life stage scaling
    let scale = appearance.scale;
    switch (lifeStage) {
      case MonsterLifeStage.BABY:
        scale *= 0.5;
        break;
      case MonsterLifeStage.JUVENILE:
        scale *= 0.75;
        break;
    }
    mainSprite.setScale(scale);
    
    container.add(mainSprite);
    
    // Add genetic modifications (extra limbs, effects, etc.)
    this.addGeneticModifications(container, appearance);
    
    // Set container properties
    container.setSize(32, 32);
    container.setDepth(100);
    
    console.log(`Created procedural monster: ${monsterType} at (${x}, ${y}) with scale ${scale}`);
    
    return container;
  }
  
  /**
   * Apply genetic variations to the sprite
   */
  private applyGeneticVariations(sprite: Phaser.GameObjects.Sprite, appearance: MonsterAppearance): void {
    // Apply color tinting based on genetics
    try {
      const tintColor = parseInt(appearance.primaryColor.replace('#', '0x'));
      sprite.setTint(tintColor);
    } catch (e) {
      // Use a random tint if color parsing fails
      const randomTint = Math.floor(Math.random() * 0xFFFFFF);
      sprite.setTint(randomTint);
    }
    
    // Apply rotation based on genetics (slight variation)
    const rotation = (appearance.limbCount - 4) * 0.05; // Slight rotation based on limb count
    sprite.setRotation(rotation);
  }
  
  /**
   * Add genetic modifications like extra parts, effects, etc.
   */
  private addGeneticModifications(container: Phaser.GameObjects.Container, appearance: MonsterAppearance): void {
    // Add extra sprites for high limb counts
    if (appearance.limbCount > 4) {
      // Use body gene to select secondary monster type for hybrid appearance
      const secondaryIndex = Math.floor((appearance.bodyType.replace('body_', '') as any) * this.monsterTypes.length / 3);
      const secondaryType = this.monsterTypes[Math.min(secondaryIndex, this.monsterTypes.length - 1)];
      const secondaryKey = `monster_${secondaryType}`;
      
      if (this.scene.textures.exists(secondaryKey)) {
        const secondarySprite = this.scene.add.sprite(0, 0, secondaryKey);
        secondarySprite.setScale(0.5);
        secondarySprite.setAlpha(0.5);
        secondarySprite.setBlendMode(Phaser.BlendModes.ADD);
        
        // Apply secondary color
        try {
          const tintColor = parseInt(appearance.secondaryColor.replace('#', '0x'));
          secondarySprite.setTint(tintColor);
        } catch (e) {
          secondarySprite.setTint(0x00FFFF);
        }
        
        container.add(secondarySprite);
      }
    }
    
    // Add mutation effects
    appearance.mutations.forEach(mutation => {
      const effect = this.scene.add.graphics();
      
      switch(mutation) {
        case 'extra_limbs':
          // Add small circles around the body
          effect.fillStyle(0xFFFF00, 0.5);
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            effect.fillCircle(x, y, 3);
          }
          break;
          
        case 'weapon_arm':
          // Add a spike
          effect.fillStyle(0xFF0000, 0.7);
          effect.fillTriangle(10, 0, 20, -5, 20, 5);
          break;
          
        case 'smoke_trail':
          // Add smoke particles
          effect.fillStyle(0x666666, 0.3);
          effect.fillCircle(-5, 5, 8);
          effect.fillCircle(-10, 10, 6);
          break;
      }
      
      container.add(effect);
    });
  }
}
