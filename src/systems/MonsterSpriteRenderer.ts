import { Scene } from 'phaser';
import { MonsterAppearance, MonsterLifeStage, AVAILABLE_PARTS, PROCEDURAL_RANGES } from '../genetics/GeneticsTypes';

/**
 * Handles sprite-based rendering of monsters using genetic appearance data
 */
export class MonsterSpriteRenderer {
  private scene: Scene;
  private spriteCache: Map<string, string> = new Map();
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.loadSpriteParts();
  }
  
  /**
   * Load all sprite parts into Phaser's texture system
   */
  private async loadSpriteParts(): Promise<void> {
    console.log('MonsterSpriteRenderer: Loading craftpix monster parts...');
    
    // For now, let's disable sprite loading and use better fallback graphics
    // The sprite loading needs to be done in the scene preload, not here
    console.log('MonsterSpriteRenderer: Using enhanced procedural graphics with species variation');
  }
  
  /**
   * Create a sprite for a monster based on its genetic appearance
   */
  createMonsterSprite(x: number, y: number, appearance: MonsterAppearance, lifeStage: MonsterLifeStage): Phaser.GameObjects.Container {
    console.log(`Creating monster sprite at (${x}, ${y}) with appearance:`, appearance.headType, appearance.bodyType);
    console.log(`Full appearance:`, appearance); // DEBUG: See what appearance we're getting
    const container = this.scene.add.container(x, y);
    
    // Determine scale based on life stage
    let stageScale = 1.0;
    switch (lifeStage) {
      case MonsterLifeStage.BABY:
        stageScale = 0.5;
        break;
      case MonsterLifeStage.JUVENILE:
        stageScale = 0.75;
        break;
      case MonsterLifeStage.ADULT:
        stageScale = 1.0;
        break;
    }
    
    // Apply genetic scale
    const finalScale = appearance.scale * stageScale;
    
    // Create body sprite (centered)
    const bodySprite = this.createBodySprite(appearance);
    if (bodySprite) {
      bodySprite.x = 0;
      bodySprite.y = 0;
      container.add(bodySprite);
    }
    
    // Create head sprite (centered above body)
    const headSprite = this.createHeadSprite(appearance);
    if (headSprite) {
      headSprite.x = 0;
      headSprite.y = -8; // Position head above body
      container.add(headSprite);
    }
    
    // Remove debug marker - we have proper species graphics now
    
    // Create limb sprites
    const limbSprites = this.createLimbSprites(appearance);
    limbSprites.forEach(limb => container.add(limb));
    
    // Add mutation effects
    const mutationSprites = this.createMutationSprites(appearance);
    mutationSprites.forEach(mutation => container.add(mutation));
    
    // Apply final scale and colors - more reasonable size
    const adjustedScale = Math.max(finalScale, 0.8) * 0.7; // Smaller but still visible
    container.setScale(adjustedScale);
    this.applyColorTinting(container, appearance);
    
    // Ensure container is visible and interactive
    container.setSize(32, 32);
    container.setDepth(100); // Above world tiles
    container.setAlpha(1.0); // Fully opaque
    
    console.log(`Monster sprite created at (${x}, ${y}) with ${container.list.length} parts, scale: ${adjustedScale}`);
    
    return container;
  }
  
  /**
   * Create PROCEDURAL body sprite - random mix of parts!
   */
  private createBodySprite(appearance: MonsterAppearance): Phaser.GameObjects.Sprite | null {
    // Always use procedural generation with random variations
    return this.createProceduralBody(appearance);
  }
  
  /**
   * Create PROCEDURAL head sprite - random genetics!
   */
  private createHeadSprite(appearance: MonsterAppearance): Phaser.GameObjects.Sprite | null {
    // Always use procedural generation with random variations
    return this.createProceduralHead(appearance);
  }
  
  /**
   * Create PROCEDURAL limb sprites - random number and positioning!
   */
  private createLimbSprites(appearance: MonsterAppearance): Phaser.GameObjects.Sprite[] {
    const limbs: Phaser.GameObjects.Sprite[] = [];
    
    // RANDOM limb count from genetics (2-6 limbs)
    const limbCount = appearance.limbCount;
    
    // Create limbs in random positions around body
    for (let i = 0; i < limbCount; i++) {
      const angle = (i / limbCount) * Math.PI * 2;
      const distance = 8 + Math.random() * 4; // Random distance from center
      
      const limb = this.createProceduralLimb(angle);
      if (limb) {
        limb.x = Math.cos(angle) * distance;
        limb.y = Math.sin(angle) * distance;
        limb.setRotation(angle);
        limbs.push(limb);
      }
    }
    
    return limbs;
  }
  
  /**
   * Create arm sprite using craftpix parts
   */
  private createArmSprite(monsterType: string, side: 'left' | 'right'): Phaser.GameObjects.Sprite | null {
    // Try upper arm first, then hand
    const armKey = `${side}_arm_${monsterType}`;
    const handKey = `${side}_hand_${monsterType}`;
    
    if (this.scene.textures.exists(armKey)) {
      const armSprite = this.scene.add.sprite(0, 0, armKey);
      
      // Add hand if available
      if (this.scene.textures.exists(handKey)) {
        const handSprite = this.scene.add.sprite(0, 8, handKey); // Position hand at end of arm
        // Create container for arm + hand
        const armContainer = this.scene.add.container(0, 0);
        armContainer.add([armSprite, handSprite]);
        return armSprite; // Return main sprite for positioning
      }
      
      return armSprite;
    } else if (this.scene.textures.exists(handKey)) {
      return this.scene.add.sprite(0, 0, handKey);
    }
    
    // Fallback to procedural limb
    return this.createProceduralLimb(side === 'left' ? Math.PI : 0);
  }
  
  /**
   * Create leg sprite using craftpix parts
   */
  private createLegSprite(monsterType: string, side: 'left' | 'right'): Phaser.GameObjects.Sprite | null {
    const legKey = `${side}_leg_${monsterType}`;
    
    if (this.scene.textures.exists(legKey)) {
      return this.scene.add.sprite(0, 0, legKey);
    }
    
    // Fallback to procedural limb
    return this.createProceduralLimb(Math.PI / 2); // Point downward
  }
  
  /**
   * Create single limb sprite (fallback method)
   */
  private createLimbSprite(appearance: MonsterAppearance, angle: number): Phaser.GameObjects.Sprite | null {
    // Use our good-looking procedural graphics
    return this.createProceduralLimb(angle);
  }
  
  /**
   * Create mutation effect sprites
   */
  private createMutationSprites(appearance: MonsterAppearance): Phaser.GameObjects.GameObject[] {
    const mutations: Phaser.GameObjects.GameObject[] = [];
    
    appearance.mutations.forEach(mutationType => {
      switch (mutationType) {
        case 'extra_eyes':
          const eyes = this.createExtraEyes();
          eyes.forEach(eye => mutations.push(eye));
          break;
        case 'spikes':
          const spikes = this.createSpikes();
          spikes.forEach(spike => mutations.push(spike));
          break;
        case 'glow':
          // Add glow effect to container
          break;
        case 'armor':
          const armor = this.createArmorPlating();
          armor.forEach(plate => mutations.push(plate));
          break;
        case 'wings':
          const wings = this.createWings();
          wings.forEach(wing => mutations.push(wing));
          break;
      }
    });
    
    return mutations;
  }
  
  /**
   * Apply color tinting to monster sprites
   */
  private applyColorTinting(container: Phaser.GameObjects.Container, appearance: MonsterAppearance): void {
    const children = container.list as Phaser.GameObjects.Sprite[];
    
    children.forEach((sprite, index) => {
      if (sprite.setTint) {
        // Apply different colors to different parts
        switch (index) {
          case 0: // Body
            sprite.setTint(Phaser.Display.Color.HexStringToColor(appearance.primaryColor).color);
            break;
          case 1: // Head
            sprite.setTint(Phaser.Display.Color.HexStringToColor(appearance.secondaryColor).color);
            break;
          default: // Limbs and mutations
            sprite.setTint(Phaser.Display.Color.HexStringToColor(appearance.patternColor).color);
            break;
        }
      }
    });
  }
  
  // PROCEDURAL sprite creation - Spore-like random generation
  private createProceduralBody(appearance: MonsterAppearance): Phaser.GameObjects.Sprite {
    const graphics = this.scene.add.graphics();
    
    // Safe color conversion with fallback
    let bodyColor = 0x8B4513; // Default brown
    try {
      bodyColor = parseInt(appearance.primaryColor.replace('#', '0x'));
    } catch (e) {
      console.warn('Invalid primary color, using random color:', appearance.primaryColor);
      // Use a random color if conversion fails
      bodyColor = Math.floor(Math.random() * 0xFFFFFF);
    }
    
    // Create PROCEDURAL body shapes based on genetic body type
    switch (appearance.bodyType) {
      case 'body_0':
        // Type 0: Spiky fuzzy creature
        graphics.fillStyle(bodyColor);
        graphics.fillEllipse(0, 0, 20, 16);
        // Add spiky texture
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const x = Math.cos(angle) * 8;
          const y = Math.sin(angle) * 6;
          graphics.fillCircle(x, y, 2);
        }
        break;
        
      case 'body_1':
        // Type 1: Smooth oval body
        graphics.fillStyle(bodyColor);
        graphics.fillEllipse(0, 0, 16, 14);
        // Add belly marking
        graphics.fillStyle(0xFFFFFF, 0.2);
        graphics.fillEllipse(0, 2, 8, 6);
        break;
        
      case 'body_2':
        // Type 2: Round geometric body
        graphics.fillStyle(bodyColor);
        graphics.fillCircle(0, 0, 12);
        // Add pattern
        graphics.fillStyle(bodyColor * 0.8);
        graphics.fillCircle(-2, -2, 8);
        break;
        
      default:
        // Fallback: rectangle shape
        graphics.fillStyle(bodyColor);
        graphics.fillRect(-8, -6, 16, 12);
        break;
    }
    
    // Convert graphics to texture and create sprite
    graphics.generateTexture(`fallback_body_${appearance.bodyType}`, 32, 32);
    const sprite = this.scene.add.sprite(0, 0, `fallback_body_${appearance.bodyType}`);
    graphics.destroy();
    
    return sprite;
  }
  
  private createProceduralHead(appearance: MonsterAppearance): Phaser.GameObjects.Sprite {
    const graphics = this.scene.add.graphics();
    
    // Safe color conversion with fallback
    let headColor = 0xFF6B6B; // Default light red  
    try {
      headColor = parseInt(appearance.secondaryColor.replace('#', '0x'));
    } catch (e) {
      console.warn('Invalid secondary color, using random color:', appearance.secondaryColor);
      // Use a random color if conversion fails
      headColor = Math.floor(Math.random() * 0xFFFFFF);
    }
    
    // Create PROCEDURAL head shapes based on genetic head type
    switch (appearance.headType) {
      case 'head_0':
        // Type 0: Spiky fuzzy head
        graphics.fillStyle(headColor);
        graphics.fillEllipse(0, 0, 14, 12);
        // Add spiky hair/fur texture
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI/2;
          const x = Math.cos(angle) * 6;
          const y = Math.sin(angle) * 5 - 3;
          graphics.fillCircle(x, y, 1.5);
        }
        break;
        
      case 'head_1':
        // Type 1: Horned head
        graphics.fillStyle(headColor);
        graphics.fillEllipse(0, 0, 12, 10);
        // Add horns
        graphics.fillStyle(headColor * 0.6); // Darker horns
        graphics.fillEllipse(-4, -6, 3, 8);
        graphics.fillEllipse(4, -6, 3, 8);
        break;
        
      case 'head_2':
        // Type 2: Creature with spike/antenna
        graphics.fillStyle(headColor);
        graphics.fillCircle(0, 0, 8);
        // Add spike/antenna
        graphics.fillStyle(headColor * 1.2); // Lighter spike
        graphics.fillTriangle(-1, -8, 1, -8, 0, -12);
        break;
        
      default:
        // Fallback: simple head
        graphics.fillStyle(headColor);
        graphics.fillCircle(0, 0, 7);
        break;
    }
    
    // Add eyes
    graphics.fillStyle(0x000000);
    graphics.fillCircle(-2, 0, 1);
    graphics.fillCircle(2, 0, 1);
    
    graphics.generateTexture(`fallback_head_${appearance.headType}`, 16, 16);
    const sprite = this.scene.add.sprite(0, 0, `fallback_head_${appearance.headType}`);
    graphics.destroy();
    
    return sprite;
  }
  
  private createProceduralLimb(angle: number): Phaser.GameObjects.Sprite {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x654321); // Brown color for limbs
    graphics.fillEllipse(0, 0, 8, 3);
    
    graphics.generateTexture('fallback_limb', 8, 3);
    const sprite = this.scene.add.sprite(0, 0, 'fallback_limb');
    sprite.setRotation(angle);
    graphics.destroy();
    
    return sprite;
  }
  
  private createExtraEyes(): Phaser.GameObjects.Sprite[] {
    const eyes: Phaser.GameObjects.Sprite[] = [];
    
    // Create additional eye sprites
    for (let i = 0; i < 2; i++) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xff0000); // Red eyes
      graphics.fillCircle(0, 0, 1);
      
      graphics.generateTexture(`extra_eye_${i}`, 3, 3);
      const eye = this.scene.add.sprite((i - 0.5) * 6, -8, `extra_eye_${i}`);
      graphics.destroy();
      
      eyes.push(eye);
    }
    
    return eyes;
  }
  
  private createSpikes(): Phaser.GameObjects.Sprite[] {
    const spikes: Phaser.GameObjects.Sprite[] = [];
    
    // Create spike sprites around the monster
    for (let i = 0; i < 4; i++) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0x888888); // Gray spikes
      graphics.fillTriangle(0, -3, -2, 3, 2, 3);
      
      graphics.generateTexture(`spike_${i}`, 4, 6);
      const angle = (i / 4) * Math.PI * 2;
      const spike = this.scene.add.sprite(Math.cos(angle) * 10, Math.sin(angle) * 10, `spike_${i}`);
      graphics.destroy();
      
      spikes.push(spike);
    }
    
    return spikes;
  }
  
  private createArmorPlating(): Phaser.GameObjects.Sprite[] {
    const armor: Phaser.GameObjects.Sprite[] = [];
    
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0x444444);
    graphics.strokeRect(-10, -8, 20, 16);
    
    graphics.generateTexture('armor_plating', 24, 20);
    const plate = this.scene.add.sprite(0, 0, 'armor_plating');
    graphics.destroy();
    
    armor.push(plate);
    
    return armor;
  }
  
  private createWings(): Phaser.GameObjects.Sprite[] {
    const wings: Phaser.GameObjects.Sprite[] = [];
    
    // Create wing sprites
    for (let i = 0; i < 2; i++) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0x00aaaa); // Cyan wings
      graphics.fillEllipse(0, 0, 8, 12);
      
      graphics.generateTexture(`wing_${i}`, 8, 12);
      const wing = this.scene.add.sprite((i === 0 ? -12 : 12), -4, `wing_${i}`);
      graphics.destroy();
      
      wings.push(wing);
    }
    
    return wings;
  }
  
  /**
   * Update monster sprite based on current genetics
   */
  updateMonsterSprite(container: Phaser.GameObjects.Container, appearance: MonsterAppearance, lifeStage: MonsterLifeStage): void {
    // Update scale based on life stage
    let stageScale = 1.0;
    switch (lifeStage) {
      case MonsterLifeStage.BABY:
        stageScale = 0.5;
        break;
      case MonsterLifeStage.JUVENILE:
        stageScale = 0.75;
        break;
      case MonsterLifeStage.ADULT:
        stageScale = 1.0;
        break;
    }
    
    const finalScale = appearance.scale * stageScale;
    container.setScale(finalScale);
    
    // Update colors
    this.applyColorTinting(container, appearance);
  }
  
  /**
   * Cleanup sprites and textures
   */
  destroy(): void {
    this.spriteCache.clear();
  }
}
