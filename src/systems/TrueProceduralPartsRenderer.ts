import { Scene } from 'phaser';
import { MonsterAppearance, MonsterLifeStage } from '../genetics/GeneticsTypes';
import { MovementType, MovementTypeDetector } from './MovementTypeDetector';

/**
 * TRUE Spore-like Procedural parts Renderer
 * Combines individual body parts (heads, bodies, arms, legs, faces, wings) to create unique monsters
 */
export class TrueProceduralPartsRenderer {
  private scene: Scene;
  
  // Available monster parts - using actual folder names that exist!
  private availableParts = {
    heads: [
      // Original (verified to exist)
      'monster04', 'monster05', 'monster06', 'flying01',
      // Use correct folder names that actually exist
      'v1_monster1', 'v1_monster2', 'v1_monster3', 'v1_monster4', 'v1_monster5',
      'v2_monster1', 'v2_monster2', 'v2_monster3', 'v2_monster4', 'v2_monster5',
      'v3_monster1', 'v3_monster2', 'v3_monster3', 'v3_monster4', 'v3_monster5',
      'v8_monster1', 'v8_monster2', 'v8_monster3', 'v8_monster4', 'v8_monster5',
      'enemy_monster1', 'enemy_monster2', 'enemy_monster3', 'enemy_monster4', 'enemy_monster5',
      // Special characters (these exist)
      'pumpkin_head', 'skull_knight', 'vampire', 'anubis',
      'skeleton_crusader1', 'skeleton_crusader2', 'skeleton_crusader3'
    ],
    bodies: [
      // Only list ones we know have bodies
      'monster05', 'monster06',
      'v8_monster1', // v8_monster1 has Body.png
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
    // Parts are now preloaded in GameScene.preload()
    console.log('TrueProceduralPartsRenderer: Ready to create procedural monsters!');
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
   * Create a truly procedural monster by combining random parts
   */
  createProceduralMonster(x: number, y: number, appearance: MonsterAppearance, lifeStage: MonsterLifeStage): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Use genetics to select parts
    const headIndex = Math.floor((parseInt(appearance.headType.split('_')[1]) / 3) * this.availableParts.heads.length);
    const bodyIndex = Math.floor((parseInt(appearance.bodyType.split('_')[1]) / 3) * this.availableParts.bodies.length);
    
    const selectedHead = this.availableParts.heads[Math.min(headIndex, this.availableParts.heads.length - 1)];
    // ALL creatures should have bodies for visibility
    const selectedBody = this.availableParts.bodies[Math.min(bodyIndex, this.availableParts.bodies.length - 1)];
    
    // Determine if this monster should have wings (based on mutation)
    const hasWings = appearance.mutations.includes('wings') || Math.random() < 0.1;
    
    // Create body - EVERY MONSTER MUST HAVE A BODY!
    let bodySprite = null;
    const bodyKey = `${selectedBody}_body`;
    
    if (selectedBody && this.scene.textures.exists(bodyKey)) {
      bodySprite = this.scene.add.sprite(0, 0, bodyKey);
      this.applyPartTint(bodySprite, appearance.primaryColor);
      bodySprite.setName('body');
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
      graphics.destroy();
      container.add(bodySprite);
      
      console.log('Created fallback body for monster');
    }
    
    // Create head - EVERY MONSTER MUST HAVE A HEAD!
    const headKey = `${selectedHead}_head`;
    let headSprite = null;
    if (this.scene.textures.exists(headKey)) {
      console.log(`✅ Head texture found: ${headKey}`);
      headSprite = this.scene.add.sprite(0, bodySprite ? -30 : 0, headKey);
      this.applyPartTint(headSprite, appearance.secondaryColor);
      headSprite.setName('head');
      
      // Ensure minimum size for visibility
      if (headSprite.width < 20 || headSprite.height < 20) {
        headSprite.setScale(Math.max(1.5, 20 / Math.min(headSprite.width, headSprite.height)));
      }
      container.add(headSprite);
    } else {
      // FALLBACK: Create a circular head if sprite fails
      console.warn(`❌ Head texture NOT found: ${headKey}, creating fallback head`);
      const graphics = this.scene.add.graphics();
      
      // Create a decent-sized head
      graphics.fillStyle(parseInt(appearance.secondaryColor.replace('#', '0x')), 1);
      graphics.fillCircle(25, 25, 25);
      graphics.generateTexture('fallback_head_' + Date.now(), 50, 50);
      
      headSprite = this.scene.add.sprite(0, bodySprite ? -30 : 0, 'fallback_head_' + Date.now());
      headSprite.setTint(parseInt(appearance.secondaryColor.replace('#', '0x')));
      headSprite.setName('head');
      graphics.destroy();
      container.add(headSprite);
      
      console.log('Created fallback head for monster');
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
        faceSprite.setDepth(1);
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
        graphics.destroy();
        container.addAt(bodySprite, 0); // Add at bottom so head appears on top
      }
      
      // Add wings - SWAPPED! Left wing on RIGHT, right wing on LEFT (they were backwards)
      const leftWingKey = 'flying01_left_wing';
      if (this.scene.textures.exists(leftWingKey)) {
        const leftWingSprite = this.scene.add.sprite(100, 0, leftWingKey); // LEFT wing on RIGHT side
        this.applyPartTint(leftWingSprite, appearance.patternColor);
        leftWingSprite.setDepth(-5); // Far behind everything
        leftWingSprite.setName('leftWing');
        leftWingSprite.setOrigin(0, 0.5); // Attach at left edge (swapped)
        container.add(leftWingSprite);
      }
      
      const rightWingKey = 'flying01_right_wing';
      if (this.scene.textures.exists(rightWingKey)) {
        const rightWingSprite = this.scene.add.sprite(-100, 0, rightWingKey); // RIGHT wing on LEFT side
        this.applyPartTint(rightWingSprite, appearance.patternColor);
        rightWingSprite.setDepth(-5); // Far behind everything
        rightWingSprite.setName('rightWing');
        rightWingSprite.setOrigin(1, 0.5); // Attach at right edge (swapped)
        container.add(rightWingSprite);
      }
    } else {
      // SIMPLIFIED - Skip limbs for now to diagnose visibility issue
      const limbTypes = ['monster04', 'monster05', 'monster06'];
      const selectedLimbType = limbTypes[Math.floor(Math.random() * limbTypes.length)];
      
      // Remove debug circle now that we know containers work
      
      // DYNAMICALLY POSITION LIMBS BASED ON BODY SIZE
      
      // Get actual body dimensions
      let bodyWidth = 80; // Default if no body
      let bodyHeight = 60; // Default if no body
      let shoulderY = 0; // Where arms attach
      let hipY = 30; // Where legs attach
      
      if (bodySprite) {
        // Get actual body sprite dimensions
        const bodyTexture = this.scene.textures.get(bodySprite.texture.key);
        if (bodyTexture && bodyTexture.source[0]) {
          bodyWidth = bodyTexture.source[0].width || 80;
          bodyHeight = bodyTexture.source[0].height || 60;
        }
        
        // Calculate attachment points based on body size
        shoulderY = -bodyHeight * 0.2; // Arms attach at upper 20% of body
        hipY = bodyHeight * 0.4; // Legs attach at lower part of body
      }
      
      // ARM POSITIONING - Attached directly to body edges
      const armSpread = bodyWidth * 0.45; // Arms at edge of body (no gap)
      const armHeight = shoulderY;
      
      const leftArmKey = `${selectedLimbType}_left_upper_arm`;
      if (this.scene.textures.exists(leftArmKey)) {
        const leftArm = this.scene.add.sprite(-armSpread, armHeight, leftArmKey);
        this.applyPartTint(leftArm, appearance.primaryColor);
        leftArm.setDepth(-1);
        leftArm.setName('leftArm');
        leftArm.setOrigin(1, 0.5); // Attach from right edge of arm sprite
        leftArm.setAlpha(0.9);
        leftArm.setScale(0.8);
        container.add(leftArm);
      }
      
      const rightArmKey = `${selectedLimbType}_right_upper_arm`;
      if (this.scene.textures.exists(rightArmKey)) {
        const rightArm = this.scene.add.sprite(armSpread, armHeight, rightArmKey);
        this.applyPartTint(rightArm, appearance.primaryColor);
        rightArm.setDepth(-1);
        rightArm.setName('rightArm');
        rightArm.setOrigin(0, 0.5); // Attach from left edge of arm sprite
        rightArm.setAlpha(0.9);
        rightArm.setScale(0.8);
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
      
      // Leg spread based on body width
      const legSpread = bodyWidth * 0.3 + (Math.random() * 10); // Legs closer to center than arms
      const legY = hipY; // Attach at hip position
      
      const leftLegKey = `${selectedLimbType}_left_leg`;
      if (this.scene.textures.exists(leftLegKey)) {
        const leftLeg = this.scene.add.sprite(-legSpread, legY, leftLegKey);
        this.applyPartTint(leftLeg, appearance.primaryColor);
        leftLeg.setDepth(-2); // Put legs behind body
        leftLeg.setName('leftLeg'); // Name for animation
        leftLeg.setOrigin(0.5, 0); // Anchor at top of leg
        // Slightly vary leg size genetically
        const legScale = 0.9 + (Math.random() * 0.2);
        leftLeg.setScale(legScale);
        container.add(leftLeg);
      }
      
      const rightLegKey = `${selectedLimbType}_right_leg`;
      if (this.scene.textures.exists(rightLegKey)) {
        const rightLeg = this.scene.add.sprite(legSpread, legY, rightLegKey);
        this.applyPartTint(rightLeg, appearance.primaryColor);
        rightLeg.setDepth(-2); // Put legs behind body
        rightLeg.setName('rightLeg'); // Name for animation
        rightLeg.setOrigin(0.5, 0); // Anchor at top of leg
        // Match leg scale for symmetry (with tiny variation)
        const legScale = 0.9 + (Math.random() * 0.2);
        rightLeg.setScale(legScale);
        container.add(rightLeg);
      }
    }
    
    // Add weapon if mutation exists
    if (appearance.mutations.includes('weapon_arm') || appearance.mutations.includes('weapon')) {
      const weaponTypes = ['monster05', 'monster06'];
      const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
      const weaponKey = `${weaponType}_weapon`;
      if (this.scene.textures.exists(weaponKey)) {
        const weapon = this.scene.add.sprite(25, -5, weaponKey);
        weapon.setTint(0xFF0000);
        container.add(weapon);
      }
    }
    
    // Apply life stage scaling - slightly bigger for visibility
    let baseScale = 0.12; // Increased from 0.08 for better visibility
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
      
      // Add emergency head if missing  
      if (!headSprite) {
        const emergencyHead = this.scene.add.circle(0, -30, 25, 0xFFFF00);
        emergencyHead.setStrokeStyle(2, 0xFF0000);
        emergencyHead.setName('emergency_head');
        container.add(emergencyHead);
      }
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
    
    return container;
  }
  
  /**
   * Apply genetic color tinting to a sprite part
   */
  private applyPartTint(sprite: Phaser.GameObjects.Sprite, color: string): void {
    try {
      const tintColor = parseInt(color.replace('#', '0x'));
      sprite.setTint(tintColor);
    } catch (e) {
      // Apply random tint if parsing fails
      sprite.setTint(0xFFFFFF * Math.random());
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
}
