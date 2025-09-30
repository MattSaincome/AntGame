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
   * Create body sprite - try to use loaded sprites first, then fallback to procedural
   */
  private createBodySprite(appearance: MonsterAppearance): Phaser.GameObjects.Sprite | null {
    // First try spine images - HUNDREDS of variations!
    const spineBodyKeys = this.getAllSpineKeys('body');
    if (spineBodyKeys.length > 0) {
      const bodyIndex = Math.abs(this.hashCode(appearance.bodyType)) % spineBodyKeys.length;
      const bodyKey = spineBodyKeys[bodyIndex];
      
      if (this.scene.textures.exists(bodyKey)) {
        console.log(`✅ Using SPINE body: ${bodyKey}`);
        return this.scene.add.sprite(0, 0, bodyKey);
      }
    }
    
    // Fallback to original loaded sprite images
    const possibleBodies = [
      'enemy_monster1_body',
      'enemy_monster2_body',
      'enemy_monster3_body', 
      'enemy_monster4_body',
      'enemy_monster5_body',
      'monster05_body',
      'monster06_body',
      'skeleton_crusader1_body',
      'skeleton_crusader2_body',
      'skeleton_crusader3_body',
      'v1_m1_body',
      'v1_m2_body',
      'v1_m3_body',
      'v1_m4_body',
      'v1_m5_body',
      'v2_m1_body',
      'v2_m2_body',
      'v2_m3_body',
      'v2_m4_body',
      'v2_m5_body',
      'v3_m1_body',
      'v3_m2_body',
      'v3_m3_body',
      'v3_m4_body',
      'v3_m5_body',
      'v4_m1_body',
      'v4_m2_body',
      'v4_m3_body',
      'v4_m4_body',
      'v4_m5_body',
      'morev1_m1_body',
      'morev1_m2_body',
      'morev1_m3_body',
      'morev1_m4_body',
      'morev1_m5_body',
      'morev2_m1_body',
      'morev2_m2_body',
      'morev2_m3_body',
      'morev2_m4_body',
      'morev2_m5_body',
      'morev3_m1_body',
      'morev3_m2_body',
      'morev3_m3_body',
      'morev3_m4_body',
      'morev3_m5_body'
    ];
    
    // Check for body sprites based on genetics
    const bodyIndex = Math.abs(this.hashCode(appearance.bodyType)) % possibleBodies.length;
    const bodyKey = possibleBodies[bodyIndex];
    
    if (this.scene.textures.exists(bodyKey)) {
      console.log(`✅ Using sprite body: ${bodyKey}`);
      return this.scene.add.sprite(0, 0, bodyKey);
    } else {
      console.log(`❌ Body sprite not found: ${bodyKey}`);
      // Log first 10 available body textures for debugging
      const availableKeys = Object.keys(this.scene.textures.list);
      const bodyTextures = availableKeys.filter(k => k.includes('body')).slice(0, 10);
      console.log('Available body textures:', bodyTextures);
    }
    
    // Try generic body sprites with monster type in name
    const monsterNum = appearance.bodyType.replace(/\D/g, '');
    const variations = [
      `v1_m${monsterNum}_body`,
      `v2_m${monsterNum}_body`, 
      `v3_m${monsterNum}_body`,
      `v4_m${monsterNum}_body`,
      `morev2_m${monsterNum}_body`
    ];
    
    for (const variant of variations) {
      if (this.scene.textures.exists(variant)) {
        console.log(`Using sprite body variant: ${variant}`);
        return this.scene.add.sprite(0, 0, variant);
      }
    }
    
    // Fallback to procedural generation
    console.log(`No sprite found for body ${appearance.bodyType}, using procedural`);
    return this.createProceduralBody(appearance);
  }
  
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
  
  /**
   * Get all available spine keys for a specific body part type
   */
  private getAllSpineKeys(partType: string): string[] {
    const keys: string[] = [];
    const allTextures = Object.keys(this.scene.textures.list);
    
    // Find all spine images that match the part type
    const searchPattern = `spine_.*_${partType}`;
    allTextures.forEach(key => {
      if (key.startsWith('spine_') && key.includes(`_${partType}`)) {
        keys.push(key);
      }
    });
    
    return keys;
  }
  
  /**
   * Create head sprite - try to use loaded sprites first, then fallback to procedural
   */
  private createHeadSprite(appearance: MonsterAppearance): Phaser.GameObjects.Sprite | null {
    // First try spine head images
    const spineHeadKeys = this.getAllSpineKeys('head');
    const spineEyeKeys = this.getAllSpineKeys('eye');
    const allSpineHeads = [...spineHeadKeys, ...spineEyeKeys];
    
    if (allSpineHeads.length > 0) {
      const headIndex = Math.abs(this.hashCode(appearance.headType)) % allSpineHeads.length;
      const headKey = allSpineHeads[headIndex];
      
      if (this.scene.textures.exists(headKey)) {
        console.log(`✅ Using SPINE head: ${headKey}`);
        return this.scene.add.sprite(0, 0, headKey);
      }
    }
    
    // Fallback to original sprite images
    const possibleHeads = [
      'enemy_monster1_head',
      'enemy_monster2_head',
      'enemy_monster3_head',
      'enemy_monster4_head',
      'enemy_monster5_head',
      'monster04_head',
      'monster05_head',
      'monster06_head',
      'skeleton_crusader1_head',
      'skeleton_crusader2_head',
      'skeleton_crusader3_head',
      'skull_knight_head',
      'anubis_head',
      'pumpkin_head_head',
      'vampire_head',
      'v1_m1_head',
      'v1_m2_head',
      'v1_m3_head',
      'v1_m4_head',
      'v1_m5_head',
      'v2_m1_head',
      'v2_m2_head',
      'v2_m3_head',
      'v2_m4_head',
      'v2_m5_head'
    ];
    
    // Check for head sprites based on genetics
    const headIndex = Math.abs(this.hashCode(appearance.headType)) % possibleHeads.length;
    const headKey = possibleHeads[headIndex];
    
    if (this.scene.textures.exists(headKey)) {
      console.log(`Using sprite head: ${headKey}`);
      return this.scene.add.sprite(0, 0, headKey);
    }
    
    // Try monster-specific heads
    const monsterNum = appearance.headType.replace(/\D/g, '');
    const variations = [
      `v1_m${monsterNum}_head`,
      `v2_m${monsterNum}_head`,
      `v3_m${monsterNum}_head`, 
      `v4_m${monsterNum}_head`,
      `morev2_m${monsterNum}_head`
    ];
    
    for (const variant of variations) {
      if (this.scene.textures.exists(variant)) {
        console.log(`Using sprite head variant: ${variant}`);
        return this.scene.add.sprite(0, 0, variant);
      }
    }
    
    // Try Eye sprites as alternative head parts
    const eyeVariations = [
      `enemy_monster1_eye`,
      `v1_m${monsterNum}_eye`,
      `morev2_m${monsterNum}_eye`
    ];
    
    for (const eyeKey of eyeVariations) {
      if (this.scene.textures.exists(eyeKey)) {
        console.log(`Using eye sprite as head: ${eyeKey}`);
        return this.scene.add.sprite(0, 0, eyeKey);
      }
    }
    
    // Fallback to procedural generation
    console.log(`No sprite found for head ${appearance.headType}, using procedural`);
    return this.createProceduralHead(appearance);
  }
  
  /**
   * Create limb sprites - mix of actual sprites and procedural
   */
  private createLimbSprites(appearance: MonsterAppearance): Phaser.GameObjects.Sprite[] {
    const limbs: Phaser.GameObjects.Sprite[] = [];
    
    // RANDOM limb count from genetics (2-6 limbs)
    const limbCount = appearance.limbCount;
    
    // Get ALL spine limb parts - massive variety!
    const spineLegKeys = this.getAllSpineKeys('leg');
    const spineHandKeys = this.getAllSpineKeys('hand');
    const spineClawKeys = this.getAllSpineKeys('claw');
    const allSpineLimbs = [...spineLegKeys, ...spineHandKeys, ...spineClawKeys];
    
    // Available limb sprites - matching actual loaded keys
    const possibleLimbs = [
      'enemy_monster1_leg',
      'v1_m1_leg_f', 'v1_m1_leg_b', 'v1_m1_hand_f', 'v1_m1_hand_b',
      'v1_m2_leg_f', 'v1_m2_leg_b', 'v1_m2_hand_f', 'v1_m2_hand_b',
      'v1_m3_leg_f', 'v1_m3_leg_b', 'v1_m3_hand_f', 'v1_m3_hand_b',
      'v1_m4_leg_f', 'v1_m4_leg_b', 'v1_m4_hand_f', 'v1_m4_hand_b',
      'v1_m5_leg_f', 'v1_m5_leg_b', 'v1_m5_hand_f', 'v1_m5_hand_b',
      'v2_m1_leg_f', 'v2_m1_leg_b', 'v2_m1_hand_f', 'v2_m1_hand_b',
      'v2_m2_leg_f', 'v2_m2_leg_b', 'v2_m2_hand_f', 'v2_m2_hand_b',
      'v3_m1_leg_f', 'v3_m1_leg_b', 'v3_m1_hand_f', 'v3_m1_hand_b',
      'v4_m1_leg_f', 'v4_m1_leg_b', 'v4_m1_hand_f', 'v4_m1_hand_b',
      'morev1_m1_leg_f', 'morev1_m1_leg_b', 'morev1_m1_hand_f', 'morev1_m1_hand_b',
      'morev2_m1_leg_f', 'morev2_m1_leg_b', 'morev2_m1_hand_f', 'morev2_m1_hand_b',
      'morev2_m2_leg_f', 'morev2_m2_leg_b', 'morev2_m2_hand_f', 'morev2_m2_hand_b',
      'monster05_left_hand', 'monster05_right_hand',
      'monster05_left_leg', 'monster05_right_leg',
      'monster06_left_hand', 'monster06_right_hand',
      'monster06_left_leg', 'monster06_right_leg'
    ];
    
    // Wings for special cases - including spine wings!
    const spineWingKeys = this.getAllSpineKeys('wing');
    const wingSprites = [
      ...spineWingKeys,
      'v1_m1_wing_f', 'v1_m1_wing_b',
      'v1_m2_wing_f', 'v1_m2_wing_b',
      'v1_m3_wing_f', 'v1_m3_wing_b',
      'v2_m1_wing_f', 'v2_m1_wing_b',
      'morev1_m1_wing_f', 'morev1_m1_wing_b',
      'flying01_left_wing', 'flying01_right_wing'
    ];
    
    // Check if monster should have wings based on genetics
    const hasWings = appearance.mutations.includes('wings') || Math.random() < 0.2;
    
    // Create limbs in positions around body
    for (let i = 0; i < limbCount; i++) {
      const angle = (i / limbCount) * Math.PI * 2;
      const distance = 8 + Math.random() * 4;
      
      let limb: Phaser.GameObjects.Sprite | null = null;
      
      // First try spine limbs - HUGE variety!
      if (allSpineLimbs.length > 0 && Math.random() < 0.7) { // 70% chance to use spine limbs
        const limbIndex = Math.abs(this.hashCode(appearance.bodyType + i + 'spine')) % allSpineLimbs.length;
        const limbKey = allSpineLimbs[limbIndex];
        
        if (this.scene.textures.exists(limbKey)) {
          limb = this.scene.add.sprite(0, 0, limbKey);
          console.log(`✅ Using SPINE limb: ${limbKey}`);
        }
      }
      
      // Try to use wings for upper limbs if applicable
      if (!limb && hasWings && (i === 0 || i === 1) && i < wingSprites.length) {
        const wingKey = wingSprites[i];
        if (this.scene.textures.exists(wingKey)) {
          limb = this.scene.add.sprite(0, 0, wingKey);
          console.log(`Using wing sprite: ${wingKey}`);
        }
      }
      
      // Otherwise try regular limbs
      if (!limb) {
        const limbIndex = Math.abs(this.hashCode(appearance.bodyType + i)) % possibleLimbs.length;
        const limbKey = possibleLimbs[limbIndex];
        
        if (this.scene.textures.exists(limbKey)) {
          limb = this.scene.add.sprite(0, 0, limbKey);
          console.log(`Using limb sprite: ${limbKey}`);
        }
      }
      
      // Fallback to procedural
      if (!limb) {
        limb = this.createProceduralLimb(angle);
      }
      
      if (limb) {
        limb.x = Math.cos(angle) * distance;
        limb.y = Math.sin(angle) * distance;
        limb.setRotation(angle);
        limb.setScale(0.5 + Math.random() * 0.5); // Random size variation
        limbs.push(limb);
      }
    }
    
    // Add tail if in genetics - use spine tails!
    if (appearance.mutations.includes('tail') || Math.random() < 0.3) {
      const spineTailKeys = this.getAllSpineKeys('tail');
      const spineTailsKeys = this.getAllSpineKeys('tails');
      const allTails = [...spineTailKeys, ...spineTailsKeys, 'enemy_monster1_tails'];
      
      if (allTails.length > 0) {
        const tailIndex = Math.abs(this.hashCode(appearance.bodyType + 'tail')) % allTails.length;
        const tailKey = allTails[tailIndex];
        
        if (this.scene.textures.exists(tailKey)) {
          const tail = this.scene.add.sprite(0, 12, tailKey);
          tail.setScale(0.5 + Math.random() * 0.5);
          limbs.push(tail);
          console.log(`✅ Added tail sprite: ${tailKey}`);
        }
      }
    }
    
    // Add random special parts from spine collection
    if (Math.random() < 0.3) { // 30% chance for special parts
      const specialParts = ['mouth', 'hat', 'neck', 'tongue', 'antenna', 'fin', 'claw', 'hair'];
      const chosenPart = specialParts[Math.floor(Math.random() * specialParts.length)];
      const specialKeys = this.getAllSpineKeys(chosenPart);
      
      if (specialKeys.length > 0) {
        const specialKey = specialKeys[Math.floor(Math.random() * specialKeys.length)];
        if (this.scene.textures.exists(specialKey)) {
          const special = this.scene.add.sprite(
            Math.random() * 20 - 10, // Random X position
            Math.random() * 20 - 10, // Random Y position
            specialKey
          );
          special.setScale(0.4 + Math.random() * 0.4);
          limbs.push(special);
          console.log(`✅ Added special part: ${specialKey}`);
        }
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
          default: // Limbs and mutations - use tertiary color
            sprite.setTint(Phaser.Display.Color.HexStringToColor(appearance.tertiaryColor).color);
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
