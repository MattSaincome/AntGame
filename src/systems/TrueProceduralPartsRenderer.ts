import { Scene } from 'phaser';
import { MonsterAppearance, MonsterLifeStage, PatternType } from '../genetics/GeneticsTypes';
import { MovementType, MovementTypeDetector } from './MovementTypeDetector';
import { PatternOverlaySystem } from './PatternOverlaySystem';
import { DynamicPartLoader } from '../loaders/DynamicPartLoader';

/**
 * TRUE Spore-like Procedural parts Renderer
 * Combines individual body parts (heads, bodies, arms, legs, faces, wings) to create unique monsters
 */
export class TrueProceduralPartsRenderer {
  private scene: Scene;
  private patternOverlaySystem: PatternOverlaySystem;
  
  // EXCLUSION LIST - heads we don't want to use
  private excludedHeads = [
    'skull_knight',  // User doesn't like this head
    'pumpkin_head',  // User doesn't like this head
    'anubis'         // User doesn't like this head (Monster 4)
  ];
  
  // Available monster parts - ALL folders with equal chance!
  private availableParts = {
    heads: [
      // Original (verified to exist)
      'monster04', 'monster05', 'monster06', 'flying01',
      // V1 series
      'v1_monster1', 'v1_monster2', 'v1_monster3', 'v1_monster4', 'v1_monster5',
      // V2 series
      'v2_monster1', 'v2_monster2', 'v2_monster3', 'v2_monster4', 'v2_monster5',
      // V3 series
      'v3_monster1', 'v3_monster2', 'v3_monster3', 'v3_monster4', 'v3_monster5',
      // V4 series
      'v4_m1', 'v4_m2', 'v4_m3', 'v4_m4', 'v4_m5',
      'v4_monster1', 'v4_monster2', 'v4_monster3', 'v4_monster4', 'v4_monster5',
      // V5 series
      'v5_monster1', 'v5_monster2', 'v5_monster3', 'v5_monster4', 'v5_monster5',
      // V6 series
      'v6_monster1', 'v6_monster2', 'v6_monster3', 'v6_monster4', 'v6_monster5',
      // V7 series - IMPORTANT: These were missing!
      'v7_m1', 'v7_m2', 'v7_m3', 'v7_m4',
      // V8 series
      'v8_monster1', 'v8_monster2', 'v8_monster3', 'v8_monster4', 'v8_monster5',
      // V9 series
      'v9_monster1', 'v9_monster2', 'v9_monster3', 'v9_monster4',
      // Enemy series
      'enemy_monster1', 'enemy_monster2', 'enemy_monster3', 'enemy_monster4', 'enemy_monster5',
      // More series
      'morev2_m1', 'morev2_m2', 'morev2_m3', 'morev2_m4', 'morev2_m5',
      'morev3_m1', 'morev3_m2', 'morev3_m3', 'morev3_m4',
      // Special characters - some excluded via excludedHeads list
      'pumpkin_head', 'skull_knight', 'vampire', 'anubis',
      'skeleton_crusader1', 'skeleton_crusader2', 'skeleton_crusader3'
    ],
    bodies: [
      // Original
      'monster05', 'monster06',
      // V1-V9 bodies (only ones that have Body.png)
      'v1_monster1', 'v1_monster2', 'v1_monster3', 'v1_monster4', 'v1_monster5',
      'v2_monster1', 'v2_monster2', 'v2_monster3', 'v2_monster4', 'v2_monster5',
      'v3_monster1', 'v3_monster2', 'v3_monster3', 'v3_monster4', 'v3_monster5',
      'v4_m1', 'v4_m2', 'v4_m3', 'v4_m4', 'v4_m5',
      'v4_monster1', 'v4_monster2', 'v4_monster3', 'v4_monster4', 'v4_monster5',
      'v5_monster1', 'v5_monster2', 'v5_monster3', 'v5_monster4', 'v5_monster5',
      'v6_monster1', 'v6_monster2', 'v6_monster3', 'v6_monster4', 'v6_monster5',
      'v7_m1', 'v7_m2', 'v7_m3', 'v7_m4',
      'v8_monster1', 'v8_monster2', 'v8_monster3', 'v8_monster4', 'v8_monster5',
      'v9_monster1', 'v9_monster2', 'v9_monster3', 'v9_monster4',
      'enemy_monster1', 'enemy_monster2', 'enemy_monster3', 'enemy_monster4', 'enemy_monster5',
      'morev2_m1', 'morev2_m2', 'morev2_m3', 'morev2_m4', 'morev2_m5',
      'morev3_m1', 'morev3_m2', 'morev3_m3', 'morev3_m4',
      // Special
      'pumpkin_head', 'skull_knight', 'vampire', 'anubis',
      'skeleton_crusader1', 'skeleton_crusader2', 'skeleton_crusader3'
    ],
    faces: [
      { type: 'monster04', variants: ['Face 01', 'Face 02'] },
      { type: 'monster05', variants: ['Face 01', 'Face 02', 'Face 03'] },
      { type: 'monster06', variants: ['Face 01', 'Face 02', 'Face 03'] },
      { type: 'flying01', variants: ['Face 01', 'Face 02'] },
      // New monsters with mouths/eyes
      { type: 'v1_m1', variants: ['mouth'] },
      { type: 'v2_m1', variants: ['mouth', 'eye'] },
      { type: 'v3_m1', variants: ['mouth'] }
    ],
    leftArms: ['monster05', 'monster06'],
    rightArms: ['monster05', 'monster06'],
    leftHands: ['monster04', 'monster05', 'monster06'],
    rightHands: ['monster04', 'monster05', 'monster06'],
    leftLegs: ['monster04', 'monster05', 'monster06'],
    rightLegs: ['monster04', 'monster05', 'monster06'],
    leftWings: ['flying01'],
    rightWings: ['flying01'],
    weapons: ['monster05', 'monster06']
  };
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.patternOverlaySystem = new PatternOverlaySystem(scene);
    // Parts are now preloaded in GameScene.preload()
    console.log('TrueProceduralPartsRenderer: Ready to create procedural monsters with patterns!');
  }
  
  /**
   * Set available monster types from seed loader (for compatibility)
   */
  setSeedMonsterTypes(monsterTypes: string[]): void {
    console.log(`🎨 Seed loader provided ${monsterTypes.length} monster types`);
    // Note: We're using our own comprehensive list above, but this maintains compatibility
  }
  
  /**
   * Preload all individual monster parts
   */
  private preloadAllParts(): void {
    console.log('TrueProceduralPartsRenderer: Loading individual monster parts...');
    
    // Load heads
    this.availableParts.heads.forEach(type => {
      const path = `monster-parts/${type}/Head.png`; // Remove leading slash
      const key = `${type}_head`;
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, path);
        console.log(`Loading head: ${key} from ${path}`);
      }
    });
    
    // Load bodies
    this.availableParts.bodies.forEach(type => {
      const path = `monster-parts/${type}/Body.png`;
      const key = `${type}_body`;
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, path);
      }
    });
    
    // Load faces
    this.availableParts.faces.forEach(face => {
      face.variants.forEach(variant => {
        const path = `monster-parts/${face.type}/${variant}.png`;
        const key = `${face.type}_${variant.replace(' ', '_').toLowerCase()}`;
        if (!this.scene.textures.exists(key)) {
          this.scene.load.image(key, path);
        }
      });
    });
    
    // Load limbs (skip upper arms for monster04 as it doesn't have them)
    ['Left Hand', 'Right Hand', 'Left Leg', 'Right Leg'].forEach(limb => {
      ['monster04', 'monster05', 'monster06'].forEach(type => {
        const path = `monster-parts/${type}/${limb}.png`;
        const key = `${type}_${limb.replace(/ /g, '_').toLowerCase()}`;
        if (!this.scene.textures.exists(key)) {
          this.scene.load.image(key, path);
        }
      });
    });
    
    // Load upper arms only for monster05 and monster06
    ['Left Upper Arm', 'Right Upper Arm'].forEach(limb => {
      ['monster05', 'monster06'].forEach(type => {
        const path = `monster-parts/${type}/${limb}.png`;
        const key = `${type}_${limb.replace(/ /g, '_').toLowerCase()}`;
        if (!this.scene.textures.exists(key)) {
          this.scene.load.image(key, path);
        }
      });
    });
    
    // Load wings
    ['Left Wing', 'Right Wing'].forEach(wing => {
      const path = `monster-parts/flying01/${wing}.png`;
      const key = `flying01_${wing.replace(' ', '_').toLowerCase()}`;
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, path);
      }
    });
    
    // Load weapons
    ['monster05', 'monster06'].forEach(type => {
      const path = `monster-parts/${type}/Weapon.png`;
      const key = `${type}_weapon`;
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, path);
      }
    });
    
    // Start loading and wait for completion
    if (this.scene.load.list.size > 0) {
      this.scene.load.once('complete', () => {
        console.log('TrueProceduralPartsRenderer: All parts loaded successfully!');
      });
      this.scene.load.start();
    }
    console.log('TrueProceduralPartsRenderer: Part loading initiated');
  }
  
  /**
   * Validate a monster container to ensure it has all required parts and no overlaps
   */
  private validateMonster(container: Phaser.GameObjects.Container, hasWings: boolean): { valid: boolean; reason?: string } {
    const parts = {
      head: container.getByName('head') as Phaser.GameObjects.Sprite,
      body: container.getByName('body') as Phaser.GameObjects.Sprite,
      eyes: container.getByName('eyes') as Phaser.GameObjects.Sprite,
      face: container.getByName('face') as Phaser.GameObjects.Sprite,
      mouth: container.getByName('mouth') as Phaser.GameObjects.Sprite,
      leftArm: container.getByName('leftArm') as Phaser.GameObjects.Sprite,
      rightArm: container.getByName('rightArm') as Phaser.GameObjects.Sprite,
      leftLeg: container.getByName('leftLeg') as Phaser.GameObjects.Sprite,
      rightLeg: container.getByName('rightLeg') as Phaser.GameObjects.Sprite,
      leftWing: container.getByName('leftWing') as Phaser.GameObjects.Sprite,
      rightWing: container.getByName('rightWing') as Phaser.GameObjects.Sprite
    };

    // 1. CHECK REQUIRED PARTS
    if (!parts.head) {
      return { valid: false, reason: 'Missing head' };
    }
    if (!parts.body) {
      return { valid: false, reason: 'Missing body' };
    }

    // Facial features are OPTIONAL - some heads are complete on their own
    // (e.g. vampire, skeleton heads have faces built-in)
    // No validation needed for eyes/mouth

    // Check locomotion - winged creatures need wings, non-winged need legs
    if (hasWings) {
      if (!parts.leftWing || !parts.rightWing) {
        return { valid: false, reason: 'Flying creature missing wings' };
      }
    } else {
      if (!parts.leftLeg || !parts.rightLeg) {
        return { valid: false, reason: 'Walking creature missing legs' };
      }
    }

    // 2. CHECK ALL SPRITES LOADED (have valid textures)
    for (const [partName, sprite] of Object.entries(parts)) {
      if (sprite && (!sprite.texture || sprite.texture.key === '__MISSING' || sprite.texture.key === '__WHITE')) {
        return { valid: false, reason: `Sprite failed to load: ${partName}` };
      }
    }

    // 3. MINIMAL FACIAL FEATURE CHECK (allow overlap - it's part of the chaos!)
    // No strict validation - let the random generation create weird monsters!

    // All checks passed!
    return { valid: true };
  }

  /**
   * Create a truly procedural monster by combining random parts
   * NOW WITH VALIDATION - will retry until a valid monster is created
   */
  createProceduralMonster(x: number, y: number, appearance: MonsterAppearance, lifeStage: MonsterLifeStage): Phaser.GameObjects.Container {
    const maxAttempts = 10;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      const container = this.scene.add.container(x, y);
      
      // Use genetics to select parts
      // FILTER out excluded heads
      const availableHeads = this.availableParts.heads.filter(head => !this.excludedHeads.includes(head));
      console.log(`🎨 Available heads after filtering: ${availableHeads.length}/${this.availableParts.heads.length} (excluded: ${this.excludedHeads.join(', ')})`);
      
      // TRUE RANDOM SELECTION - every part has equal chance!
      let selectedHead = availableHeads[Math.floor(Math.random() * availableHeads.length)];
      const selectedBody = this.availableParts.bodies[Math.floor(Math.random() * this.availableParts.bodies.length)];
      
      console.log(`🎲 RANDOM selection: ${selectedHead} head + ${selectedBody} body`);
      
      // Determine if this monster should have wings (based on mutation)
      const hasWings = appearance.mutations.includes('wings') || Math.random() < 0.1;
      
      // Create body - EVERY MONSTER MUST HAVE A BODY!
      let bodySprite = null;
      const bodyKey = `${selectedBody}_body`;
      
      // DEBUG: Log genetics colors to diagnose color coordination
      console.log(`🎨 Colors - Primary: ${appearance.primaryColor}, Secondary: ${appearance.secondaryColor}, Tertiary: ${appearance.tertiaryColor}, Pattern: ${appearance.patternColor}`);
      
      if (selectedBody && this.scene.textures.exists(bodyKey)) {
        bodySprite = this.scene.add.sprite(0, 0, bodyKey);
        this.applyPartTint(bodySprite, appearance.primaryColor);
        bodySprite.setName('body');
        bodySprite.setDepth(0); // Base depth
        container.add(bodySprite);
      } else {
        // FALLBACK: Create a basic body shape if sprite fails
        console.warn(`⚠️ Body texture NOT found: ${bodyKey}, creating fallback body`);
        const graphics = this.scene.add.graphics();
        
        // Create an oval body shape
        graphics.fillStyle(parseInt(appearance.primaryColor.replace('#', '0x')), 1);
        graphics.fillEllipse(40, 30, 80, 60);
        graphics.generateTexture('fallback_body_' + Date.now(), 80, 60);
        
        bodySprite = this.scene.add.sprite(0, 0, 'fallback_body_' + Date.now());
        bodySprite.setTint(parseInt(appearance.primaryColor.replace('#', '0x')));
        bodySprite.setName('body');
        bodySprite.setDepth(0); // Base depth
        graphics.destroy();
        container.add(bodySprite);
        
        console.log('Created fallback body for monster');
      }
    
      // Create head - EVERY MONSTER MUST HAVE A HEAD!
      let headKey = `${selectedHead}_head`;
      let headSprite = null;
      // Keep trying random heads until we find one that exists (up to 10 attempts)
      let headAttempts = 0;
      while (!this.scene.textures.exists(headKey) && headAttempts < 10) {
        selectedHead = availableHeads[Math.floor(Math.random() * availableHeads.length)];
        headKey = `${selectedHead}_head`;
        headAttempts++;
      }
      
      if (this.scene.textures.exists(headKey)) {
        console.log(`✅ Head texture found: ${headKey} (attempts: ${headAttempts})`);
        // Position head ON TOP of body, like a neck connection
        const headY = bodySprite ? -bodySprite.height * 0.5 : 0; // Connect at 50% of body height (higher up)
        headSprite = this.scene.add.sprite(0, headY, headKey);
        this.applyPartTint(headSprite, appearance.secondaryColor);
        headSprite.setName('head');
        
        // Smart scaling for heads - handle both oversized and undersized
        if (bodySprite) {
        const bodyWidth = bodySprite.width;
        const headWidth = headSprite.width;
        const headHeight = headSprite.height;
        
        // Detect oversized heads (especially skulls) - head should not be wider than 1.2x body
        if (headWidth > bodyWidth * 1.2 || headHeight > bodyWidth * 1.2) {
          const scaleRatio = (bodyWidth * 1.0) / Math.max(headWidth, headHeight);
          headSprite.setScale(scaleRatio);
          console.log(`🔧 Scaled down oversized head ${headKey}: ${headWidth}x${headHeight} -> scale ${scaleRatio.toFixed(2)}`);
        }
        // Ensure minimum size for visibility
        else if (headWidth < 20 || headHeight < 20) {
          headSprite.setScale(Math.max(1.5, 20 / Math.min(headWidth, headHeight)));
        }
      } else {
        // No body reference - just ensure minimum size
        if (headSprite.width < 20 || headSprite.height < 20) {
          headSprite.setScale(Math.max(1.5, 20 / Math.min(headSprite.width, headSprite.height)));
        }
      }
      
      headSprite.setDepth(10); // Behind facial features (eyes=25, mouth=25)
      headSprite.setName('head');
      container.add(headSprite);
    } else {
      console.warn(`❌ Could not find ANY head texture after ${attempts} attempts! Skipping head.`);
      // Don't create fallback - just skip the head entirely
    }
    
    // Apply pattern overlays to body and head BEFORE facial features (so patterns render below)
    if (appearance.patternType && appearance.patternType !== PatternType.NONE && appearance.patternIntensity && appearance.patternColor) {
      // Apply pattern to body
      if (bodySprite) {
        const bodyPattern = this.patternOverlaySystem.applyPattern(
          bodySprite,
          appearance.patternType,
          appearance.patternColor,
          appearance.patternIntensity
        );
        if (bodyPattern) {
          bodyPattern.setDepth(5); // Above body but below head
          container.add(bodyPattern);
          (container as any).bodyPattern = bodyPattern; // Store for cleanup
          console.log(`🎨 Applied ${appearance.patternType} pattern to body (intensity: ${(appearance.patternIntensity * 100).toFixed(0)}%)`);
        }
      }
      
      // Apply pattern to head (slightly lower intensity for subtle variety)
      if (headSprite) {
        const headPattern = this.patternOverlaySystem.applyPattern(
          headSprite,
          appearance.patternType,
          appearance.patternColor,
          appearance.patternIntensity * 0.8 // Slightly less intense on head
        );
        if (headPattern) {
          headPattern.setDepth(15); // Above head (10) but below facial features (25)
          container.add(headPattern);
          (container as any).headPattern = headPattern; // Store for cleanup
        }
      }
    }
    
    // Add face with blinking capability
    const faceOptions = this.availableParts.faces.find(f => f.type === selectedHead);
    if (faceOptions && faceOptions.variants.length > 0) {
      // Store all face variants for blinking
      const faceVariants = faceOptions.variants.map(v => 
        `${selectedHead}_${v.replace(' ', '_').toLowerCase()}`
      );
      
      // Start with a random face (open eyes)
      const initialFace = faceVariants[0]; // Usually Face 01 is open eyes
      if (this.scene.textures.exists(initialFace)) {
        const faceSprite = this.scene.add.sprite(0, bodySprite ? -10 : 0, initialFace);
        faceSprite.setDepth(25); // Above patterns (depth 1)
        faceSprite.setName('face');
        container.add(faceSprite);
        
        // Store blinking data
        (container as any).faceVariants = faceVariants;
        (container as any).blinkTimer = 0;
        (container as any).nextBlinkTime = 2000 + Math.random() * 3000; // Blink every 2-5 seconds
        (container as any).isBlinking = false;
        (container as any).blinkDuration = 150; // Blink lasts 150ms
      }
    }
    
    // ADD FACE OR EYES/MOUTH (mutually exclusive)
    // Position eyes/face in the UPPER portion of the head (not center)
    let eyeY = -10; // Default position
    if (headSprite) {
      // Eyes should be in the upper portion of the head - VERY HIGH!
      // Calculate based on head sprite's actual displayed size after scaling
      const headTop = headSprite.y - (headSprite.displayHeight / 2);
      const headBottom = headSprite.y + (headSprite.displayHeight / 2);
      // Position eyes at 10% down from the top (very top of head)
      eyeY = headTop + (headSprite.displayHeight * 0.10);
      console.log(`👁️ Positioning eyes VERY HIGH on head: Y=${eyeY.toFixed(1)} (head: ${headTop.toFixed(1)} to ${headBottom.toFixed(1)})`);
    }
    let eyesAdded = false;
    let faceAdded = false;
    
    // First, try to find a complete FACE sprite
    const faceSearchKeys = [
      `${selectedHead}_Face 01`,
      `${selectedHead}_Face 02`,
      `${selectedHead}_Face 03`,
      `${selectedHead}_face 01`,
      `${selectedHead}_face 02`,
      `${selectedHead}_face 03`,
      `${selectedHead.replace('_head', '')}_Face 01`,
      `${selectedHead.replace('_head', '')}_Face 02`,
      `${selectedHead.replace('_head', '')}_Face 03`
    ];
    
    // Try to add complete face (50% chance if it exists)
    if (Math.random() < 0.5) {
      for (const faceKey of faceSearchKeys) {
        if (faceKey && this.scene.textures.exists(faceKey)) {
          console.log(`✅ Found FACE sprite: ${faceKey}`);
          const faceSprite = this.scene.add.sprite(0, eyeY, faceKey);
          faceSprite.setDepth(25);
          faceSprite.setName('face');
          faceSprite.setScale(1.0);
          
          // Apply color tint to face
          const colorScheme = this.generateColorScheme(appearance);
          const tintedColor = this.blendColors(0xFFFFFF, colorScheme.accentColor, 0.15);
          faceSprite.setTint(tintedColor);
          
          container.add(faceSprite);
          faceAdded = true;
          console.log(`👤 Using complete FACE - skipping separate eyes/mouth`);
          break;
        }
      }
    }
    
    // Only add separate eyes if NO face was added
    if (!faceAdded) {
      // COMPREHENSIVE eye texture search - try EVERY possible variation
      const eyeSearchKeys = [
      // Standard patterns
      `${selectedHead}_eye`,
      `${selectedHead}_eyes`,
      `${selectedHead}_Eye`,
      `${selectedHead}_Eyes`,
      // With underscores
      `${selectedHead}_eye_b`,
      `${selectedHead}_eye_f`,
      `${selectedHead}_Eye_B`,
      `${selectedHead}_Eye_F`,
      // Numbered
      `${selectedHead}_eye1`,
      `${selectedHead}_eye2`,
      `${selectedHead}_Eye1`,
      `${selectedHead}_Eye2`,
      // Body eyes (only if body exists)
      ...(selectedBody ? [
        `${selectedBody}_eye`,
        `${selectedBody}_eyes`,
        `${selectedBody}_Eye`,
        `${selectedBody}_Eyes`,
        `${selectedBody}_eye_b`,
        `${selectedBody}_eye_f`,
        `${selectedBody}_Eye_B`,
        `${selectedBody}_Eye_F`,
        `${selectedBody}_eye1`,
        `${selectedBody}_Eye1`,
        `${selectedBody.replace('_body', '')}_Eye`,
        `${selectedBody.replace('_body', '')}_eye`,
        `${selectedBody.replace('_body', '')}_Eye_B`,
        `${selectedBody.replace('_body', '')}_Eye_F`
      ] : []),
      // Without prefixes (direct)
      `${selectedHead.replace('_head', '')}_Eye`,
      `${selectedHead.replace('_head', '')}_eye`,
      `${selectedHead.replace('_head', '')}_Eye_B`,
      `${selectedHead.replace('_head', '')}_Eye_F`,
      `${selectedHead.replace('_head', '')}_Eye1`
    ];
    
    // Find a valid eye texture
    let eyeTextureKey: string | null = null;
    for (const eyeKey of eyeSearchKeys) {
      if (eyeKey && this.scene.textures.exists(eyeKey)) {
        eyeTextureKey = eyeKey;
        break;
      }
    }
    
    // FALLBACK: If no matching eye found, use ANY available eye texture!
    if (!eyeTextureKey) {
      const fallbackEyes = [
        'v1_monster1_eye', 'v2_monster1_eye', 'v3_monster1_eye',
        'morev2_m1_eye', 'morev2_m2_eye', 'morev2_m3_eye',
        'enemy_monster1_Eye', 'flying01_eye'
      ];
      
      for (const fallback of fallbackEyes) {
        if (this.scene.textures.exists(fallback)) {
          eyeTextureKey = fallback;
          console.log(`⚠️ Using fallback eye texture: ${fallback} for ${selectedHead}`);
          break;
        }
      }
    }
    
    // If we found an eye texture, create MULTIPLE EYES with VARIETY
    let eyeSprite: Phaser.GameObjects.Sprite | null = null;
    if (eyeTextureKey) {
      console.log(`✅ Found eye sprite: ${eyeTextureKey}`);
      
      // DYNAMIC EYE COUNT - 1, 2, 3, 4, or 5 eyes!
      const eyeCountWeights = [
        { count: 1, weight: 15 },  // 15% - cyclops
        { count: 2, weight: 50 },  // 50% - normal
        { count: 3, weight: 20 },  // 20% - triplet
        { count: 4, weight: 10 },  // 10% - quad
        { count: 5, weight: 5 }    // 5% - pentacle
      ];
      
      const totalWeight = eyeCountWeights.reduce((sum, item) => sum + item.weight, 0);
      const random = Math.random() * totalWeight;
      let cumulative = 0;
      let eyeCount = 2; // default
      
      for (const item of eyeCountWeights) {
        cumulative += item.weight;
        if (random <= cumulative) {
          eyeCount = item.count;
          break;
        }
      }
      
      // DYNAMIC EYE SIZING based on head size and eye count
      const headWidth = headSprite ? headSprite.displayWidth : 100;
      
      // Scale eyes relative to head size
      const singleEyeTexture = this.scene.textures.get(eyeTextureKey);
      const eyeTextureWidth = singleEyeTexture.getSourceImage().width;
      
      // Adjust target size based on eye count
      let targetWidthPercent = 0.08; // 8% of head width for 1-2 eyes
      if (eyeCount === 3) targetWidthPercent = 0.07;
      else if (eyeCount === 4) targetWidthPercent = 0.06;
      else if (eyeCount >= 5) targetWidthPercent = 0.05;
      
      const targetEyeWidth = headWidth * targetWidthPercent;
      let eyeScale = targetEyeWidth / eyeTextureWidth;
      
      // NO minimum size restriction - let eyes be naturally small!
      eyeScale = Math.min(0.6, eyeScale); // Only cap maximum at 0.6
      
      console.log(`👁️ Creating ${eyeCount} eyes with scale ${eyeScale.toFixed(2)}`);
      
      // CREATE EYES based on count
      if (eyeCount === 1) {
        // Single centered eye (cyclops)
        eyeSprite = this.scene.add.sprite(0, eyeY, eyeTextureKey);
        eyeSprite.setDepth(25);
        eyeSprite.setName('eyes');
        eyeSprite.setScale(eyeScale * 1.3); // Slightly larger for single eye
        container.add(eyeSprite);
      } else if (eyeCount === 2) {
        // Two eyes (standard)
        const eyeSpacing = headWidth * 0.2;
        eyeSprite = this.scene.add.sprite(-eyeSpacing, eyeY, eyeTextureKey);
        eyeSprite.setDepth(25);
        eyeSprite.setName('eyes');
        eyeSprite.setScale(eyeScale);
        container.add(eyeSprite);
        
        const rightEye = this.scene.add.sprite(eyeSpacing, eyeY, eyeTextureKey);
        rightEye.setDepth(25);
        rightEye.setName('rightEye');
        rightEye.setScale(eyeScale);
        container.add(rightEye);
      } else if (eyeCount === 3) {
        // Three eyes in a triangle
        const eyeSpacing = headWidth * 0.18;
        eyeSprite = this.scene.add.sprite(0, eyeY - 5, eyeTextureKey); // Top center
        eyeSprite.setDepth(25);
        eyeSprite.setName('eyes');
        eyeSprite.setScale(eyeScale);
        container.add(eyeSprite);
        
        const leftEye = this.scene.add.sprite(-eyeSpacing, eyeY + 8, eyeTextureKey);
        leftEye.setDepth(25);
        leftEye.setName('leftEye');
        leftEye.setScale(eyeScale);
        container.add(leftEye);
        
        const rightEye = this.scene.add.sprite(eyeSpacing, eyeY + 8, eyeTextureKey);
        rightEye.setDepth(25);
        rightEye.setName('rightEye');
        rightEye.setScale(eyeScale);
        container.add(rightEye);
      } else if (eyeCount === 4) {
        // Four eyes in a square grid
        const eyeSpacingX = headWidth * 0.15;
        const eyeSpacingY = 10;
        
        const eyes = [
          { x: -eyeSpacingX, y: eyeY - eyeSpacingY, name: 'eyes' },
          { x: eyeSpacingX, y: eyeY - eyeSpacingY, name: 'topRightEye' },
          { x: -eyeSpacingX, y: eyeY + eyeSpacingY, name: 'bottomLeftEye' },
          { x: eyeSpacingX, y: eyeY + eyeSpacingY, name: 'bottomRightEye' }
        ];
        
        eyes.forEach((eyePos, i) => {
          const eye = this.scene.add.sprite(eyePos.x, eyePos.y, eyeTextureKey);
          eye.setDepth(25);
          eye.setName(eyePos.name);
          eye.setScale(eyeScale);
          container.add(eye);
          if (i === 0) eyeSprite = eye;
        });
      } else {
        // Five or more eyes in a circular pattern
        const radius = headWidth * 0.2;
        for (let i = 0; i < eyeCount; i++) {
          const angle = (i / eyeCount) * Math.PI * 2 - Math.PI / 2; // Start at top
          const x = Math.cos(angle) * radius;
          const y = eyeY + Math.sin(angle) * radius;
          
          const eye = this.scene.add.sprite(x, y, eyeTextureKey);
          eye.setDepth(25);
          eye.setName(i === 0 ? 'eyes' : `eye${i}`);
          eye.setScale(eyeScale);
          container.add(eye);
          if (i === 0) eyeSprite = eye;
        }
      }
      
      eyesAdded = true;
    }
    
    // If eyes were added, apply color tinting to ALL eyes
    if (eyesAdded) {
      const colorScheme = this.generateColorScheme(appearance);
      
      // Apply tinting to ALL eye sprites in the container
      const eyeTint = this.blendColors(0xFFFFFF, colorScheme.baseColor, 0.3);
      container.list.forEach((child: any) => {
        if (child.name && (child.name.includes('eye') || child.name.includes('Eye'))) {
          child.setTint(eyeTint);
        }
      });
      console.log(`🎨 Tinted all eyes with body color (30%)`);
      
      // ADD EYEBROWS (50% chance) with color coordination
      if (Math.random() < 0.5 && eyeSprite) {
        const eyebrowKeys = [
          'v5_monster1_EyeBrow01',
          'v5_monster1_EyeBrow02',
          'v5_monster3_EyeBrow01',
          'v5_monster3_EyeBrow02'
        ];
        
        const randomBrow = eyebrowKeys[Math.floor(Math.random() * eyebrowKeys.length)];
        if (this.scene.textures.exists(randomBrow)) {
          const eyebrowSprite = this.scene.add.sprite(0, eyeY - 8, randomBrow);
          eyebrowSprite.setDepth(24); // Behind eyes
          eyebrowSprite.setName('eyebrows');
          eyebrowSprite.setScale(1.0);
          
          // Tint eyebrows to match head/dark color (50% blend for shadow effect)
          const browTint = this.blendColors(0x000000, colorScheme.darkColor, 0.5);
          eyebrowSprite.setTint(browTint);
          
          container.add(eyebrowSprite);
          console.log(`✅ Added color-coordinated eyebrows`);
        }
      }
      
      // ADD MOUTH SPRITES with COLLISION DETECTION to prevent overlap
      const mouthSearchKeys = [
        `${selectedHead}_mouth`,
        `${selectedHead}_Mouth`,
        `${selectedHead}_mouth1`,
        `${selectedHead}_Mouth1`,
        `${selectedHead.replace('_head', '')}_mouth`,
        `${selectedHead.replace('_head', '')}_Mouth`,
        `${selectedBody}_mouth`,
        `${selectedBody}_Mouth`
      ];
      
      for (const mouthKey of mouthSearchKeys) {
        if (mouthKey && this.scene.textures.exists(mouthKey)) {
          // Smart mouth positioning - ALWAYS below eyes with proper spacing
          let mouthY = eyeY + 30; // Default: 30px below eye center
          
          // FACIAL FEATURE COLLISION DETECTION - prevent overlap
          if (eyeSprite) {
            const eyeBottom = eyeY + (eyeSprite.displayHeight / 2);
            const minSeparation = 20; // Minimum gap between eye bottom and mouth center
            
            // Mouth must be AT LEAST minSeparation below the bottom of eyes
            const safeMouthY = eyeBottom + minSeparation;
            
            // Use whichever is LOWER (higher Y value = lower on screen)
            mouthY = Math.max(mouthY, safeMouthY);
            console.log(`👄 Mouth positioned at Y=${mouthY.toFixed(1)} (eyes bottom: ${eyeBottom.toFixed(1)})`);
          }
          
          const mouthSprite = this.scene.add.sprite(0, mouthY, mouthKey);
          mouthSprite.setDepth(25); // Same as eyes
          mouthSprite.setName('mouth');
          mouthSprite.setScale(1.0);
          
          // Tint mouth to match accent color (25% blend)
          const mouthTint = this.blendColors(0xFFFFFF, colorScheme.accentColor, 0.25);
          mouthSprite.setTint(mouthTint);
          
          container.add(mouthSprite);
          console.log(`✅ Mouth added: ${mouthKey}`);
          break;
        }
      }
    }
    } // Close the if (!faceAdded) block
    
    // Add limbs or wings
    if (hasWings) {
      // CRITICAL: Flying creatures MUST have a body too!
      if (!bodySprite) {
        console.warn('Flying creature has no body! Creating fallback flying body');
        const graphics = this.scene.add.graphics();
        
        // Create a streamlined flying body
        graphics.fillStyle(parseInt(appearance.primaryColor.replace('#', '0x')), 1);
        graphics.fillEllipse(30, 20, 60, 40); // Smaller, aerodynamic body
        graphics.generateTexture('fallback_flying_body_' + Date.now(), 60, 40);
        
        bodySprite = this.scene.add.sprite(0, 0, 'fallback_flying_body_' + Date.now());
        bodySprite.setTint(parseInt(appearance.primaryColor.replace('#', '0x')));
        bodySprite.setName('body');
        bodySprite.setDepth(0); // Base depth
        graphics.destroy();
        container.addAt(bodySprite, 0); // Add at bottom so head appears on top
      }
      
      // Add wings - SWAP LEFT AND RIGHT (sprites are designed for opposite sides)
      const bodyWidth = bodySprite ? bodySprite.displayWidth : 80;
      const bodyHeight = bodySprite ? bodySprite.displayHeight : 60;
      
      // Position wings at body edges
      const leftWingX = -(bodyWidth * 0.4); // Left side position
      const rightWingX = (bodyWidth * 0.4); // Right side position
      const wingY = 0; // Center vertically on body
      
      // THE FIX: Left wing sprite goes on RIGHT side, Right wing sprite goes on LEFT side
      // NO FLIPPING - sprites are pre-designed, just swap their positions
      
      // Put LEFT wing sprite on RIGHT side (it naturally points right)
      const leftWingKey = 'flying01_left_wing';
      if (this.scene.textures.exists(leftWingKey)) {
        const leftWingSprite = this.scene.add.sprite(rightWingX, wingY, leftWingKey);
        this.applyPartTint(leftWingSprite, appearance.patternColor);
        leftWingSprite.setName('rightWing');
        leftWingSprite.setOrigin(0.2, 0.5); // Attach near body
        leftWingSprite.setScale(1.0);
        // Add BEFORE body so it appears behind
        const bodyIndex = container.getIndex(bodySprite);
        container.addAt(leftWingSprite, bodyIndex);
      }
      
      // Put RIGHT wing sprite on LEFT side (it naturally points left)
      const rightWingKey = 'flying01_right_wing';
      if (this.scene.textures.exists(rightWingKey)) {
        const rightWingSprite = this.scene.add.sprite(leftWingX, wingY, rightWingKey);
        this.applyPartTint(rightWingSprite, appearance.patternColor);
        rightWingSprite.setName('leftWing');
        rightWingSprite.setOrigin(0.8, 0.5); // Attach near body
        rightWingSprite.setScale(1.0);
        // Add BEFORE body so it appears behind
        const bodyIndex = container.getIndex(bodySprite);
        container.addAt(rightWingSprite, bodyIndex);
      }
    } else {
      // Get ALL available arms for maximum variety!
      const allLeftArms = DynamicPartLoader.getAllArms().filter((arm: string) => arm.includes('left'));
      const allRightArms = DynamicPartLoader.getAllArms().filter((arm: string) => arm.includes('right'));
      
      // Pick random arms (can be from different monsters for variety!)
      const selectedLeftArm = allLeftArms.length > 0 ? 
        allLeftArms[Math.floor(Math.random() * allLeftArms.length)] : null;
      const selectedRightArm = allRightArms.length > 0 ? 
        allRightArms[Math.floor(Math.random() * allRightArms.length)] : null;
      
      // Remove debug circle now that we know containers work
      
      // DYNAMICALLY POSITION LIMBS BASED ON BODY SIZE
      
      // Get actual DISPLAYED body dimensions for perfect attachment
      let bodyWidth = 80; // Default if no body
      let bodyHeight = 60; // Default if no body
      let shoulderY = 0; // Where arms attach
      let hipY = 30; // Where legs attach
      
      if (bodySprite) {
        // Use displayWidth/displayHeight for scaled dimensions
        bodyWidth = bodySprite.displayWidth;
        bodyHeight = bodySprite.displayHeight;
        
        // Calculate attachment points based on body size
        shoulderY = -bodyHeight * 0.2; // Arms attach at upper 20% of body
        hipY = bodyHeight * 0.4; // Legs attach at lower part of body
      }
      
      // Calculate proportional limb scaling based on body size (AFTER getting body dimensions)
      const limbScale = Math.min(1.0, bodyWidth / 100); // Scale limbs relative to body
      const armLengthScale = 0.8 + (Math.random() * 0.4); // Random 0.8-1.2x variation
      
      // ARM POSITIONING - Attached at exact body edges for seamless connection
      const leftArmX = -(bodyWidth * 0.5); // Left edge of body
      const rightArmX = (bodyWidth * 0.5); // Right edge of body
      const armHeight = shoulderY;
      
      // Use selected left arm (random variety!) with PROPORTIONAL sizing
      if (selectedLeftArm && this.scene.textures.exists(selectedLeftArm)) {
        const leftArm = this.scene.add.sprite(leftArmX, armHeight, selectedLeftArm);
        this.applyPartTint(leftArm, appearance.primaryColor); // Same as body for natural look
        leftArm.setDepth(-3); // Behind legs (-2), body (0), and facial features (25)
        leftArm.setName('leftArm');
        leftArm.setOrigin(1, 0.5); // Attach RIGHT edge of arm to LEFT edge of body
        leftArm.setAlpha(0.9);
        // PROPORTIONAL SCALING - arms scale with body size
        leftArm.setScale(limbScale * 0.6, limbScale * armLengthScale); // Width & length proportional
        container.add(leftArm);
      }
      
      // Use selected right arm (random variety!) with PROPORTIONAL sizing
      if (selectedRightArm && this.scene.textures.exists(selectedRightArm)) {
        const rightArm = this.scene.add.sprite(rightArmX, armHeight, selectedRightArm);
        this.applyPartTint(rightArm, appearance.primaryColor); // Same as body for natural look
        rightArm.setDepth(-3); // Behind legs (-2), body (0), and facial features (25)
        rightArm.setName('rightArm');
        rightArm.setOrigin(0, 0.5); // Attach LEFT edge of arm to RIGHT edge of body
        rightArm.setAlpha(0.9);
        // PROPORTIONAL SCALING - arms scale with body size
        rightArm.setScale(limbScale * 0.6, limbScale * armLengthScale); // Width & length proportional
        container.add(rightArm);
      }
      
      // LEG POSITIONING - Attached to hip area
      let limbGeneValue = 2; // Default
      if (appearance.limbCount && !isNaN(appearance.limbCount)) {
        limbGeneValue = Math.max(1, Math.min(6, appearance.limbCount)); // Clamp 1-6
      }
      
      let scaleGeneValue = 1.0;
      if (appearance.scale && !isNaN(appearance.scale)) {
        scaleGeneValue = Math.max(0.5, Math.min(2, appearance.scale)); // Clamp 0.5-2
      }
      
      // LEG POSITIONING - Attached slightly inward from body edges (hip width)
      const leftLegX = -(bodyWidth * 0.35); // Slightly inside left edge
      const rightLegX = (bodyWidth * 0.35); // Slightly inside right edge
      const legY = hipY; // Attach at hip position
      
      // Get ALL available legs for variety
      const allLeftLegs = DynamicPartLoader.getAllLegs().filter((leg: string) => leg.includes('left'));
      const allRightLegs = DynamicPartLoader.getAllLegs().filter((leg: string) => leg.includes('right'));
      
      const selectedLeftLeg = allLeftLegs.length > 0 ? 
        allLeftLegs[Math.floor(Math.random() * allLeftLegs.length)] : null;
      const selectedRightLeg = allRightLegs.length > 0 ? 
        allRightLegs[Math.floor(Math.random() * allRightLegs.length)] : null;
      
      if (selectedLeftLeg && this.scene.textures.exists(selectedLeftLeg)) {
        const leftLeg = this.scene.add.sprite(leftLegX, legY, selectedLeftLeg);
        this.applyPartTint(leftLeg, appearance.primaryColor); // Same as body for natural look
        leftLeg.setDepth(-2); // Put legs behind body
        leftLeg.setName('leftLeg'); // Name for animation
        leftLeg.setOrigin(0.5, 0); // Anchor at top center of leg
        // PROPORTIONAL leg scaling based on body
        const legScale = limbScale * (0.7 + (Math.random() * 0.2)); // Proportional with variation
        leftLeg.setScale(legScale);
        container.add(leftLeg);
      }
      
      if (selectedRightLeg && this.scene.textures.exists(selectedRightLeg)) {
        const rightLeg = this.scene.add.sprite(rightLegX, legY, selectedRightLeg);
        this.applyPartTint(rightLeg, appearance.primaryColor); // Same as body for natural look
        rightLeg.setDepth(-2); // Put legs behind body
        rightLeg.setName('rightLeg'); // Name for animation
        rightLeg.setOrigin(0.5, 0); // Anchor at top center of leg
        // PROPORTIONAL leg scaling based on body
        const legScale = limbScale * (0.7 + (Math.random() * 0.2)); // Proportional with variation
        rightLeg.setScale(legScale);
        container.add(rightLeg);
      }
    }
    
    // Weapons removed - not needed for this game
    
    // Patterns already applied earlier (before facial features) to ensure correct layering
    
    // Apply life stage scaling - 1.5-2 blocks tall (16px = 1 block)
    // Target: 24-32px tall monsters = 0.06-0.08 scale for ~400px sprites
    let baseScale = 0.08085; // 10% bigger (was 0.0735) for better visibility
    let scale = baseScale;
    
    switch (lifeStage) {
      case MonsterLifeStage.BABY:
        scale = baseScale * 0.8; // Babies (0.4)
        break;
      case MonsterLifeStage.JUVENILE:
        scale = baseScale * 0.9; // Juveniles (0.45)
        break;
      case MonsterLifeStage.ADULT:
        scale = baseScale; // Adults (0.5)
        break;
    }
    container.setScale(scale);
    
    // Set container properties for tiny monsters
    container.setSize(16, 16); // One block size
    container.setDepth(500); // High depth to ensure visibility above tiles
    container.setAlpha(1.0); // Ensure full visibility
    container.setVisible(true); // Force visible
    
    // Store references for animation and movement type
    (container as any).leftLeg = container.getByName('leftLeg');
    (container as any).rightLeg = container.getByName('rightLeg');
    (container as any).leftWing = container.getByName('leftWing');
    (container as any).rightWing = container.getByName('rightWing');
    (container as any).animationTime = 0;
    
    // Count legs for movement detection
    let legCount = 0;
    if (container.getByName('leftLeg')) legCount++;
    if (container.getByName('rightLeg')) legCount++;
    
    // Detect movement type using comprehensive system
    const hasWingsActual = !!(container.getByName('leftWing') && container.getByName('rightWing'));
    const hasTentacles = false; // Future expansion
    const hasTail = false; // Future expansion
    const hasBody = !!bodySprite;
    
    const movementType = MovementTypeDetector.detectMovementType({
      legCount,
      hasWings: hasWingsActual,
      hasTentacles,
      hasTail,
      hasBody,
      appearance
    });
    
    (container as any).movementType = movementType;
    (container as any).legCount = legCount;
    
    // CRITICAL FIX: If container has no visible children, add a fallback sprite
    if (container.list.length === 0) {
      console.error('WARNING: Container has no sprites! Adding emergency fallback');
      const fallback = this.scene.add.circle(0, 0, 50, 0xFF0000);
      fallback.setStrokeStyle(3, 0xFFFF00);
      container.add(fallback);
    }
    
    // Force the container to be absolutely visible
    container.setAlpha(1.0);
    container.setVisible(true);
    
    // CRITICAL: Ensure at least head AND body are visible
    if (container.list.length === 0 || !headSprite || !bodySprite) {
      console.error(`CRITICAL: Monster missing essential parts! Head: ${!!headSprite}, Body: ${!!bodySprite}`);
      
      // Add emergency body if missing
      if (!bodySprite) {
        const emergencyBody = this.scene.add.circle(0, 0, 40, 0x808080);
        emergencyBody.setStrokeStyle(2, 0x00FF00);
        emergencyBody.setName('emergency_body');
        container.add(emergencyBody);
      }
      
      // No emergency head - better to have no head than a placeholder circle
    }
    
    // AGGRESSIVE VISIBILITY FIX - Force everything visible
    container.setVisible(true);
    container.setAlpha(1.0);
    container.setDepth(500);
    
    // Force all children visible too
    container.list.forEach((child: any) => {
      if (child && child.setVisible) {
        child.setVisible(true);
        if (child.setAlpha) child.setAlpha(Math.max(0.8, child.alpha || 1));
      }
    });
    
    // Add a simple base if container has too many overlapping parts
    if (container.list.length > 6) {
      console.warn(`Monster has ${container.list.length} parts - adding base for stability`);
      const base = this.scene.add.circle(0, 0, 30, 0x333333, 0.3);
      container.addAt(base, 0); // Add at bottom
    }
    
    console.log(`Created TRUE procedural monster: ${selectedHead} head + ${selectedBody || 'no'} body + ${hasWings ? 'wings' : 'limbs'} at (${x}, ${y}) with scale ${scale}, movement: ${movementType}, children: ${container.list.length}`);
    
      // VALIDATE THE MONSTER
      const validation = this.validateMonster(container, hasWings);
      
      if (validation.valid) {
        console.log(`✅ MONSTER VALIDATION PASSED (attempt ${attempts})`);
        return container;
      } else {
        console.warn(`❌ MONSTER VALIDATION FAILED (attempt ${attempts}/${maxAttempts}): ${validation.reason}`);
        // Destroy the invalid monster and try again
        container.destroy();
      }
    }
    
    // If we get here, all attempts failed - return a basic fallback monster
    console.error(`🚨 FAILED to create valid monster after ${maxAttempts} attempts! Creating minimal fallback.`);
    const fallbackContainer = this.scene.add.container(x, y);
    
    // Create minimal viable monster
    const fallbackBody = this.scene.add.circle(0, 0, 20, 0xFF0000);
    fallbackBody.setName('body');
    const fallbackHead = this.scene.add.circle(0, -25, 15, 0xFF6600);
    fallbackHead.setName('head');
    fallbackContainer.add([fallbackBody, fallbackHead]);
    
    return fallbackContainer;
  }
  
  /**
   * Apply genetic color tinting to a sprite part
   */
  private applyPartTint(sprite: Phaser.GameObjects.Sprite, color: string | undefined): void {
    try {
      if (!color || color === '#FFFFFF' || color === '#ffffff') {
        // White/missing color - generate a vibrant random color
        const vibrantColors = [0xFF6B35, 0x4ECDC4, 0xFF006E, 0x8338EC, 0xFB5607, 0x06FFA5, 0xFF9E00];
        const randomColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
        sprite.setTint(randomColor);
        return;
      }
      
      const tintColor = parseInt(color.replace('#', '0x'));
      sprite.setTint(tintColor);
    } catch (e) {
      // Apply vibrant random tint if parsing fails
      const vibrantColors = [0xFF6B35, 0x4ECDC4, 0xFF006E, 0x8338EC, 0xFB5607, 0x06FFA5, 0xFF9E00];
      const randomColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
      sprite.setTint(randomColor);
    }
  }
  
  /**
   * Animate natural eye blinking
   */
  private animateBlinking(container: Phaser.GameObjects.Container, deltaTime: number): void {
    const faceSprite = container.getByName('face') as Phaser.GameObjects.Sprite;
    if (!faceSprite || !(container as any).faceVariants) return;
    
    const data = container as any;
    const currentTime = this.scene.time.now;
    
    // Check if it's time to blink
    if (!data.isBlinking && currentTime >= data.nextBlinkTime) {
      // Start blinking - switch to closed eyes texture (usually Face 02 or Face 03)
      data.isBlinking = true;
      data.blinkStartTime = currentTime;
      
      // Use Face 02 for closed eyes (or Face 03 for variation)
      const closedFace = data.faceVariants[1] || data.faceVariants[2] || data.faceVariants[0];
      if (this.scene.textures.exists(closedFace)) {
        faceSprite.setTexture(closedFace);
      }
      
      // Sometimes do a double blink
      if (Math.random() < 0.3) {
        data.blinkDuration = 300; // Double blink
      } else {
        data.blinkDuration = 150; // Normal blink
      }
    }
    
    // Check if blink should end
    if (data.isBlinking && currentTime >= data.blinkStartTime + data.blinkDuration) {
      // End blink - return to open eyes
      data.isBlinking = false;
      const openFace = data.faceVariants[0];
      if (this.scene.textures.exists(openFace)) {
        faceSprite.setTexture(openFace);
      }
      
      // Set next blink time (more frequent if active, less if idle)
      const baseInterval = 2000 + Math.random() * 3000; // 2-5 seconds
      
      // Blink more often when tired or hurt
      const monster = (container as any).monster;
      if (monster && monster.energy < 30) {
        data.nextBlinkTime = currentTime + baseInterval * 0.5; // Blink more when tired
      } else {
        data.nextBlinkTime = currentTime + baseInterval;
      }
      
      // Occasionally wink (one eye)
      if (Math.random() < 0.1) {
        // Use Face 03 for winking if available
        const winkFace = data.faceVariants[2];
        if (winkFace && this.scene.textures.exists(winkFace)) {
          faceSprite.setTexture(winkFace);
          setTimeout(() => {
            if (this.scene && this.scene.textures.exists(openFace)) {
              faceSprite.setTexture(openFace);
            }
          }, 200);
        }
      }
    }
  }
  
  /**
   * Animate walking, mining, and carrying for monster sprite container
   */
  animateWalking(container: Phaser.GameObjects.Container, isMoving: boolean, deltaTime: number, isMining: boolean = false, isCarrying: boolean = false): void {
    if (!container) return;
    
    const movementType = (container as any).movementType || 'walk';
    const leftLeg = container.getByName('leftLeg') as Phaser.GameObjects.Sprite;
    const rightLeg = container.getByName('rightLeg') as Phaser.GameObjects.Sprite;
    const leftWing = container.getByName('leftWing') as Phaser.GameObjects.Sprite;
    const rightWing = container.getByName('rightWing') as Phaser.GameObjects.Sprite;
    
    // Handle blinking animation
    this.animateBlinking(container, deltaTime);
    
    // Check for face-plant animation
    if ((container as any).isFacePlanted) {
      // FACE PLANTED - flat on the ground
      container.rotation = 1.57; // 90 degrees - lying flat
      // Don't modify container.y - it breaks positioning!
      
      // All limbs sprawled out - only rotate, don't move
      if (leftLeg) {
        leftLeg.rotation = -0.5;
      }
      if (rightLeg) {
        rightLeg.rotation = 0.5;
      }
      
      const leftArm = container.getByName('leftArm') as Phaser.GameObjects.Sprite;
      const rightArm = container.getByName('rightArm') as Phaser.GameObjects.Sprite;
      const leftHand = container.getByName('leftHand') as Phaser.GameObjects.Sprite;
      const rightHand = container.getByName('rightHand') as Phaser.GameObjects.Sprite;
      
      if (leftArm) leftArm.rotation = -1.5;
      if (rightArm) rightArm.rotation = 1.5;
      // Don't move hands, only rotate arms
      if (leftHand) {
        leftHand.rotation = -0.5;
      }
      if (rightHand) {
        rightHand.rotation = 0.5;
      }
      
      // Check if recovering (pushing up)
      if ((container as any).isRecovering) {
        // PUSHING UP - struggling to stand
        container.rotation = 0.8; // Partially upright
        container.y -= 5;
        
        if (leftHand) {
          leftHand.y = 3; // Pushing against ground (was 60)
          leftHand.x = -4;  // Was -100
        }
        if (rightHand) {
          rightHand.y = 3;  // Was 60
          rightHand.x = 4;  // Was 100
        }
        if (leftArm) leftArm.rotation = 0.5;
        if (rightArm) rightArm.rotation = 0.5;
      }
      
      return; // Skip normal animations when face-planted
    } else {
      // Reset rotation if not face-planted
      if (container.rotation !== 0 && !isMining) {
        container.rotation = 0;
        // Don't modify container.y - it breaks positioning!
      }
    }
    
    if (isMoving) {
      const time = this.scene.time.now * 0.01;
      
      // Get the movement type from the container
      const movementType = (container as any).movementType || 'walk';
      
      // CRITICAL FIX: Always ensure container is visible during movement
      container.setVisible(true);
      container.setAlpha(1.0);
      
      // ALWAYS ANIMATE SOMETHING - Even without legs!
      // Set default animation values
      let legSpeed = 1;
      let legAmplitude = 0.3;
      
      // Handle ALL 50+ movement types with unique animations
      switch(movementType.toLowerCase()) {
        // NO LEGS - Animate container itself
        case 'serpentine':
          container.rotation = Math.sin(time * 2) * 0.3;
          break;
        case 'slug':
          container.scaleX = 1 + Math.sin(time * 0.5) * 0.1;
          break;
        case 'roll':
          container.rotation += 0.1;
          break;
        case 'bounce':
          container.y += Math.abs(Math.sin(time * 3)) * -3;
          break;
        case 'levitate':
        case 'hover':
          container.y += Math.sin(time * 0.5) * 2;
          break;
          
        // ONE LEG
        case 'hop':
        case 'pivot':
        case 'vault':
          container.y += Math.abs(Math.sin(time * 3)) * -2;
          legSpeed = 3; legAmplitude = 0.5;
          break;
          
        // TWO LEGS - Most common
        case 'walk':
          legSpeed = 1; legAmplitude = 0.3;
          break;
        case 'sprint':
          legSpeed = 2.5; legAmplitude = 0.6;
          break;
        case 'leap':
          legSpeed = 1.5; legAmplitude = 0.7;
          container.y += Math.abs(Math.sin(time * 3)) * -1;
          break;
        case 'waddle':
          legSpeed = 0.8; legAmplitude = 0.4;
          container.rotation = Math.sin(time * 1.6) * 0.1;
          break;
        case 'stalk':
          legSpeed = 0.5; legAmplitude = 0.2;
          break;
          
        // MULTI-LEG
        case 'tripod':
        case 'hobble':
        case 'cartwheel':
          legSpeed = 0.7; legAmplitude = 0.3;
          container.rotation = Math.sin(time) * 0.1;
          break;
          
        case 'gallop':
        case 'bound':
          legSpeed = 2.5; legAmplitude = 0.6;
          container.y += Math.abs(Math.sin(time * 5)) * -1;
          break;
        case 'prowl':
          legSpeed = 0.6; legAmplitude = 0.2;
          break;
        case 'scamper':
          legSpeed = 3; legAmplitude = 0.4;
          break;
        case 'lumber':
          legSpeed = 0.5; legAmplitude = 0.5;
          break;
          
        // MANY LEGS
        case 'scuttle':
        case 'swarm':
        case 'climb':
          legSpeed = 4; legAmplitude = 0.3;
          break;
        case 'skitter':
        case 'flow':
        case 'radial':
          legSpeed = 5; legAmplitude = 0.2;
          break;
          
        // FLYING
        case 'fly':
        case 'dive':
        case 'soar':
        case 'flutter_hop':
        case 'glide_walk':
        case 'perch':
        case 'swoop_run':
          container.y += Math.sin(time * 2) * 1;
          legSpeed = 0.5; legAmplitude = 0.1; // Minimal leg movement when flying
          break;
          
        // SPECIAL
        case 'tentacle_walk':
        case 'grapple':
        case 'constrict_pull':
          container.rotation = Math.sin(time) * 0.2;
          legSpeed = 0.8; legAmplitude = 0.4;
          break;
          
        case 'tail_spring':
        case 'tail_whip':
        case 'tail_drag':
          container.y += Math.abs(Math.sin(time * 2)) * -1;
          legSpeed = 1; legAmplitude = 0.2;
          break;
          
        case 'stretch':
        case 'compress':
        case 'phase':
        case 'split':
          container.scaleY = 1 + Math.sin(time) * 0.1;
          legSpeed = 0.5; legAmplitude = 0.2;
          break;
          
        // DEFAULT - Always do SOMETHING
        default:
          legSpeed = 1; legAmplitude = 0.3;
          // Add subtle movement so it's visible
          container.y += Math.sin(time) * 0.5;
          break;
      }
      
      // Apply leg animations if creature has legs
      if (leftLeg) {
        leftLeg.rotation = Math.sin(time * legSpeed) * legAmplitude;
        leftLeg.setVisible(true);
      }
      if (rightLeg) {
        rightLeg.rotation = Math.sin(time * legSpeed + Math.PI) * legAmplitude;
        rightLeg.setVisible(true);
      }
      
      // Also animate wings if they exist (for flying creatures)
      if (leftWing || rightWing) {
        if (leftWing) {
          leftWing.rotation = Math.sin(time * 3) * 0.5;
        }
        if (rightWing) {
          rightWing.rotation = -Math.sin(time * 3) * 0.5;
        }
      }
      
      // Animate arms during movement (arms need animation or they disappear!)
      const leftArm = container.getByName('leftArm') as Phaser.GameObjects.Sprite;
      const rightArm = container.getByName('rightArm') as Phaser.GameObjects.Sprite;
      const leftHand = container.getByName('leftHand') as Phaser.GameObjects.Sprite;
      const rightHand = container.getByName('rightHand') as Phaser.GameObjects.Sprite;
      
      if (leftArm || rightArm) {
        // Arms swing opposite to legs for natural movement
        if (leftArm) {
          leftArm.rotation = Math.sin(time + Math.PI) * 0.2; // Opposite of right leg
          leftArm.setVisible(true);
        }
        if (rightArm) {
          rightArm.rotation = Math.sin(time) * 0.2; // Opposite of left leg
          rightArm.setVisible(true);
        }
        if (leftHand) {
          leftHand.rotation = Math.sin(time + Math.PI) * 0.1;
          leftHand.setVisible(true);
        }
        if (rightHand) {
          rightHand.rotation = Math.sin(time) * 0.1;
          rightHand.setVisible(true);
        }
      }
      
      // ENSURE ALL PARTS ARE VISIBLE during movement
      const head = container.getByName('head') as Phaser.GameObjects.Sprite;
      const body = container.getByName('body') as Phaser.GameObjects.Sprite;
      
      if (head) head.setVisible(true);
      if (body) body.setVisible(true);
      
    } else {
      // NOT MOVING - But still need animations based on movement type!
      const time = this.scene.time.now * 0.01;
      const movementType = (container as any).movementType || 'walk';
      
      // FORCE VISIBILITY
      container.setVisible(true);
      container.setAlpha(1.0);
      
      // Idle animations based on movement type
      switch(movementType.toLowerCase()) {
        case 'hover':
        case 'levitate':
        case 'fly':
          // Floating idle
          container.y += Math.sin(time * 0.5) * 1;
          break;
        case 'bounce':
        case 'hop':
          // Subtle bounce when idle
          container.y += Math.abs(Math.sin(time * 0.5)) * -0.5;
          break;
        case 'serpentine':
        case 'slug':
          // Slight wiggle
          container.rotation = Math.sin(time * 0.3) * 0.05;
          break;
        default:
          // Breathing animation for all others
          container.scaleY = 1 + Math.sin(time * 0.3) * 0.02;
          break;
      }
      
      // Reset leg rotation but keep visible
      if (leftLeg) {
        leftLeg.rotation = 0;
        leftLeg.setVisible(true);
      }
      if (rightLeg) {
        rightLeg.rotation = 0;
        rightLeg.setVisible(true);
      }
      if (leftWing) {
        leftWing.rotation = Math.sin(time * 0.5) * 0.1; // Gentle wing movement
        leftWing.setVisible(true);
      }
      if (rightWing) {
        rightWing.rotation = -Math.sin(time * 0.5) * 0.1;
        rightWing.setVisible(true);
      }
    }
    
    // ABSOLUTELY CRITICAL: Force visibility NO MATTER WHAT
    container.setVisible(true);
    container.setAlpha(1.0);
    
    // Force all children visible
    container.list.forEach((child: any) => {
      if (child && child.setVisible) {
        child.setVisible(true);
      }
    });
    
    // Wing animation is now handled in the movement type section above
    
    // Animate arms for mining or carrying
    const leftArm = container.getByName('leftArm') as Phaser.GameObjects.Sprite;
    const rightArm = container.getByName('rightArm') as Phaser.GameObjects.Sprite;
    const leftHand = container.getByName('leftHand') as Phaser.GameObjects.Sprite;
    const rightHand = container.getByName('rightHand') as Phaser.GameObjects.Sprite;
    
    if (isMining) {
      const miningTime = this.scene.time.now * 0.02; // FASTER animation
      
      // AGGRESSIVE HEAD-BANGING MINING ANIMATION
      // Monster rams its whole body into the block!
      const bangPhase = Math.sin(miningTime * 8); // SUPER fast oscillation - BAM BAM BAM!
      
      // Shake the entire container violently
      container.x += bangPhase * 5; // Strong horizontal shake
      container.rotation = bangPhase * 0.15; // Violent rotation
      
      // Head-bang animation for arms
      if (leftArm) {
        leftArm.rotation = bangPhase * 0.5 - 0.3;
        leftArm.scaleX = 1 + Math.abs(bangPhase) * 0.2;
      }
      if (rightArm) {
        rightArm.rotation = -bangPhase * 0.5 - 0.3;
        rightArm.scaleX = 1 + Math.abs(bangPhase) * 0.2;
      }
      if (leftHand) {
        leftHand.rotation = bangPhase * 0.8;
      }
      if (rightHand) {
        rightHand.rotation = -bangPhase * 0.8;
      }
    } else if (isCarrying && (leftArm || rightArm)) {
      // CARRYING - hands pinned to resource
      const struggleTime = this.scene.time.now * 0.005;
      const struggle = Math.sin(struggleTime) * 0.2;
      
      // Hands gripping resource
      if (leftHand) {
        leftHand.x = -80; // Closer together when carrying
        leftHand.y = 70; // Lower, dragging
        leftHand.rotation = struggle; // Struggling motion
      }
      if (rightHand) {
        rightHand.x = 80;
        rightHand.y = 70;
        rightHand.rotation = -struggle;
      }
      
      // Arms bent from effort
      if (leftArm) leftArm.rotation = 0.3 + struggle * 0.5;
      if (rightArm) rightArm.rotation = 0.3 - struggle * 0.5;
      
    } else if (leftArm || rightArm || leftHand || rightHand) {
      // Reset everything to default position
      container.rotation = 0;
      container.x = 0;
      
      if (leftArm) {
        leftArm.rotation = 0;
        leftArm.scaleX = 1; // Reset scale
      }
      if (rightArm) {
        rightArm.rotation = 0;
        rightArm.scaleX = 1;
      }
      if (leftHand) {
        leftHand.x = -140;
        leftHand.y = 40;
        leftHand.rotation = 0;
        leftHand.scaleX = 1;
        leftHand.scaleY = 1;
      }
      if (rightHand) {
        rightHand.x = 140;
        rightHand.y = 40;
        rightHand.rotation = 0;
        rightHand.scaleX = 1;
        rightHand.scaleY = 1;
      }
    }
  }
  
  /**
   * Create diverse animal-inspired eyes (no white eyeballs)
   * Returns eye graphics based on animal type
   */
  private createAnimalEyes(
    container: Phaser.GameObjects.Container,
    eyeY: number,
    appearance: any,
    colorScheme: any
  ): void {
    // Determine eye type based on genetics
    const eyeTypeSeed = (appearance.primaryColor.charCodeAt(0) * 13 + 
                         appearance.secondaryColor.charCodeAt(1) * 17) % 100;
    
    let eyeType: string;
    if (eyeTypeSeed < 15) eyeType = 'cat';           // 15% Cat eyes (vertical slits)
    else if (eyeTypeSeed < 28) eyeType = 'reptile';  // 13% Reptile (horizontal slits)
    else if (eyeTypeSeed < 40) eyeType = 'goat';     // 12% Goat (rectangular)
    else if (eyeTypeSeed < 50) eyeType = 'insect';   // 10% Insect (compound)
    else if (eyeTypeSeed < 60) eyeType = 'fish';     // 10% Fish (large pupil)
    else if (eyeTypeSeed < 68) eyeType = 'octopus';  // 8% Octopus (W-shaped)
    else if (eyeTypeSeed < 75) eyeType = 'bird';     // 7% Bird (bright colored)
    else if (eyeTypeSeed < 82) eyeType = 'spider';   // 7% Spider (multiple small)
    else if (eyeTypeSeed < 88) eyeType = 'gecko';    // 6% Gecko (no eyelids)
    else if (eyeTypeSeed < 93) eyeType = 'snake';    // 5% Snake (solid color)
    else eyeType = 'alien';                           // 7% Alien (glow)
    
    const eyeSize = 8 + (this.getPartVariation(appearance, 'eye_size') * 6); // 8-14px
    
    console.log(`👁️ Creating ${eyeType} eyes at size ${eyeSize.toFixed(1)}px`);
    
    switch (eyeType) {
      case 'cat':
        // CAT EYES: Vertical slit pupils, colored iris
        this.createCatEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'reptile':
        // REPTILE: Horizontal slit, golden/green iris
        this.createReptileEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'goat':
        // GOAT: Rectangular horizontal pupils
        this.createGoatEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'insect':
        // INSECT: Compound eyes (hexagonal pattern)
        this.createInsectEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'fish':
        // FISH: Large dark pupil, no white
        this.createFishEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'octopus':
        // OCTOPUS: W-shaped pupil
        this.createOctopusEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'bird':
        // BIRD: Bright colored iris with small pupil
        this.createBirdEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'spider':
        // SPIDER: Multiple small black eyes
        this.createSpiderEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'gecko':
        // GECKO: Vertical slit, no eyelids
        this.createGeckoEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'snake':
        // SNAKE: Solid colored, no pupil visible
        this.createSnakeEyes(container, eyeY, eyeSize, colorScheme);
        break;
        
      case 'alien':
        // ALIEN: Glowing, no pupil
        this.createAlienEyes(container, eyeY, eyeSize, colorScheme);
        break;
    }
  }
  
  private createCatEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size, size];
    positions.forEach(x => {
      // Colored iris
      const iris = this.scene.add.circle(x, eyeY, size, colorScheme.accentColor);
      iris.setDepth(25);
      container.add(iris);
      
      // Vertical slit pupil
      const pupil = this.scene.add.rectangle(x, eyeY, size * 0.2, size * 1.4, 0x000000);
      pupil.setDepth(26);
      container.add(pupil);
      
      // Highlight
      const highlight = this.scene.add.circle(x + size * 0.3, eyeY - size * 0.3, size * 0.2, 0xFFFFFF, 0.8);
      highlight.setDepth(27);
      container.add(highlight);
    });
  }
  
  private createReptileEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size, size];
    const irisColor = 0xCCCC00; // Golden/green
    
    positions.forEach(x => {
      // Golden iris
      const iris = this.scene.add.circle(x, eyeY, size, irisColor);
      iris.setDepth(25);
      container.add(iris);
      
      // Horizontal slit pupil
      const pupil = this.scene.add.rectangle(x, eyeY, size * 1.4, size * 0.15, 0x000000);
      pupil.setDepth(26);
      container.add(pupil);
    });
  }
  
  private createGoatEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size, size];
    
    positions.forEach(x => {
      // Light colored iris
      const iris = this.scene.add.circle(x, eyeY, size, 0xDDCC99);
      iris.setDepth(25);
      container.add(iris);
      
      // Rectangular horizontal pupil
      const pupil = this.scene.add.rectangle(x, eyeY, size * 1.2, size * 0.4, 0x000000);
      pupil.setDepth(26);
      container.add(pupil);
    });
  }
  
  private createInsectEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size * 1.2, size * 1.2];
    
    positions.forEach(x => {
      // Large compound eye (dark, multi-faceted look)
      const eye = this.scene.add.circle(x, eyeY, size * 1.3, 0x000000);
      eye.setDepth(25);
      container.add(eye);
      
      // Hexagonal highlights for compound effect
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const hx = x + Math.cos(angle) * size * 0.4;
        const hy = eyeY + Math.sin(angle) * size * 0.4;
        const facet = this.scene.add.circle(hx, hy, size * 0.15, 0x444444);
        facet.setDepth(26);
        container.add(facet);
      }
    });
  }
  
  private createFishEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size, size];
    
    positions.forEach(x => {
      // Large dark eye with metallic sheen
      const eye = this.scene.add.circle(x, eyeY, size, 0x1a1a1a);
      eye.setDepth(25);
      container.add(eye);
      
      // Large pupil
      const pupil = this.scene.add.circle(x, eyeY, size * 0.7, 0x000000);
      pupil.setDepth(26);
      container.add(pupil);
      
      // Bright highlight (underwater reflection)
      const highlight = this.scene.add.circle(x + size * 0.4, eyeY - size * 0.4, size * 0.35, 0xCCFFFF, 0.9);
      highlight.setDepth(27);
      container.add(highlight);
    });
  }
  
  private createOctopusEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size, size];
    
    positions.forEach(x => {
      // Large dark eye
      const eye = this.scene.add.circle(x, eyeY, size, 0x2a2a2a);
      eye.setDepth(25);
      container.add(eye);
      
      // W-shaped pupil (approximated with rectangles)
      const pupilWidth = size * 0.15;
      const p1 = this.scene.add.rectangle(x - size * 0.3, eyeY, pupilWidth, size * 0.8, 0x000000);
      p1.setDepth(26);
      container.add(p1);
      
      const p2 = this.scene.add.rectangle(x, eyeY + size * 0.2, pupilWidth, size * 0.5, 0x000000);
      p2.setDepth(26);
      container.add(p2);
      
      const p3 = this.scene.add.rectangle(x + size * 0.3, eyeY, pupilWidth, size * 0.8, 0x000000);
      p3.setDepth(26);
      container.add(p3);
    });
  }
  
  private createBirdEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size, size];
    const irisColors = [0xFF6600, 0xFFCC00, 0xCC0000, 0x0099FF]; // Bright colors
    const irisColor = irisColors[Math.floor(Math.random() * irisColors.length)];
    
    positions.forEach(x => {
      // Bright colored iris
      const iris = this.scene.add.circle(x, eyeY, size, irisColor);
      iris.setDepth(25);
      container.add(iris);
      
      // Small dark pupil
      const pupil = this.scene.add.circle(x, eyeY, size * 0.3, 0x000000);
      pupil.setDepth(26);
      container.add(pupil);
      
      // Ring around pupil
      const ring = this.scene.add.circle(x, eyeY, size * 0.5, 0x000000, 0);
      ring.setStrokeStyle(1, 0x000000);
      ring.setDepth(26);
      container.add(ring);
    });
  }
  
  private createSpiderEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    // 8 eyes total - 2 large forward, 6 smaller around
    const mainEyes = [
      { x: -size * 0.6, y: eyeY, size: size * 0.8 },
      { x: size * 0.6, y: eyeY, size: size * 0.8 }
    ];
    
    const sideEyes = [
      { x: -size * 1.8, y: eyeY - size * 0.5, size: size * 0.4 },
      { x: size * 1.8, y: eyeY - size * 0.5, size: size * 0.4 },
      { x: -size * 1.5, y: eyeY + size * 0.8, size: size * 0.35 },
      { x: size * 1.5, y: eyeY + size * 0.8, size: size * 0.35 },
      { x: -size * 0.3, y: eyeY + size * 1.2, size: size * 0.3 },
      { x: size * 0.3, y: eyeY + size * 1.2, size: size * 0.3 }
    ];
    
    // Draw all eyes as simple black circles
    [...mainEyes, ...sideEyes].forEach(eye => {
      const eyeCircle = this.scene.add.circle(eye.x, eye.y, eye.size, 0x000000);
      eyeCircle.setDepth(25);
      container.add(eyeCircle);
      
      // Small highlight
      const highlight = this.scene.add.circle(
        eye.x + eye.size * 0.3,
        eye.y - eye.size * 0.3,
        eye.size * 0.2,
        0x666666
      );
      highlight.setDepth(26);
      container.add(highlight);
    });
  }
  
  private createGeckoEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size, size];
    
    positions.forEach(x => {
      // Large colored eye
      const eye = this.scene.add.circle(x, eyeY, size, colorScheme.lightColor);
      eye.setDepth(25);
      container.add(eye);
      
      // Vertical slit
      const pupil = this.scene.add.rectangle(x, eyeY, size * 0.15, size * 1.5, 0x000000);
      pupil.setDepth(26);
      container.add(pupil);
      
      // Gold ring around pupil
      const ring = this.scene.add.circle(x, eyeY, size * 0.5, 0xFFCC00, 0);
      ring.setStrokeStyle(1, 0xFFCC00);
      ring.setDepth(26);
      container.add(ring);
    });
  }
  
  private createSnakeEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size, size];
    const snakeColors = [0x996600, 0x669900, 0xCC9900]; // Brown, green, amber
    const eyeColor = snakeColors[Math.floor(Math.random() * snakeColors.length)];
    
    positions.forEach(x => {
      // Solid colored eye (pupil not easily visible)
      const eye = this.scene.add.circle(x, eyeY, size, eyeColor);
      eye.setDepth(25);
      container.add(eye);
      
      // Subtle darker center
      const center = this.scene.add.circle(x, eyeY, size * 0.5, 0x000000, 0.3);
      center.setDepth(26);
      container.add(center);
      
      // Glassy shine
      const shine = this.scene.add.circle(x + size * 0.4, eyeY - size * 0.4, size * 0.25, 0xFFFFFF, 0.6);
      shine.setDepth(27);
      container.add(shine);
    });
  }
  
  private createAlienEyes(container: Phaser.GameObjects.Container, eyeY: number, size: number, colorScheme: any): void {
    const positions = [-size, size];
    const glowColors = [0x00FF00, 0x00FFFF, 0xFF00FF, 0xFFFF00]; // Bright alien colors
    const glowColor = glowColors[Math.floor(Math.random() * glowColors.length)];
    
    positions.forEach(x => {
      // Large glowing eye
      const eye = this.scene.add.circle(x, eyeY, size, glowColor);
      eye.setDepth(25);
      container.add(eye);
      
      // Bright center (no pupil)
      const glow = this.scene.add.circle(x, eyeY, size * 0.6, 0xFFFFFF, 0.8);
      glow.setDepth(26);
      container.add(glow);
      
      // Outer glow effect
      const outerGlow = this.scene.add.circle(x, eyeY, size * 1.3, glowColor, 0.3);
      outerGlow.setDepth(24);
      container.add(outerGlow);
    });
  }
  
  private getPartVariation(appearance: any, partName: string): number {
    const hash = (appearance.primaryColor.charCodeAt(0) * 31 + 
                  appearance.secondaryColor.charCodeAt(1) * 37 + 
                  partName.charCodeAt(0) * 41) % 100;
    return hash / 100.0;
  }
  
  private generateColorScheme(appearance: any): any {
    const primaryColor = parseInt(appearance.primaryColor?.replace('#', '0x') || '0xFF0000');
    const secondaryColor = parseInt(appearance.secondaryColor?.replace('#', '0x') || '0x00FF00');
    const tertiaryColor = parseInt(appearance.tertiaryColor?.replace('#', '0x') || '0x0000FF');
    const patternColor = parseInt(appearance.patternColor?.replace('#', '0x') || '0xFFFF00');
    
    return {
      baseColor: primaryColor,
      darkColor: secondaryColor,
      lightColor: tertiaryColor,
      accentColor: patternColor
    };
  }
  
  /**
   * Blend two colors together (0.0 = all color1, 1.0 = all color2)
   */
  private blendColors(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;
    
    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;
    
    const r = Math.floor(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.floor(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.floor(b1 * (1 - ratio) + b2 * ratio);
    
    return (r << 16) | (g << 8) | b;
  }
}
