import Phaser from 'phaser';

/**
 * Ragdoll Physics System
 * Provides realistic, physics-based procedural animations for monster limbs
 * - Inverse kinematics for reaching/stepping
 * - Physics constraints for natural movement
 * - Ground contact detection
 * - Grab/climb detection
 */

interface Limb {
  sprite: Phaser.GameObjects.Sprite;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  velocityX: number;
  velocityY: number;
  restX: number;
  restY: number;
  length: number;
  isGrounded?: boolean;
  isGrabbing?: boolean;
  // NEW: For proper rotation-based leg animation
  rotation: number; // Current rotation angle from hip
  targetRotation: number; // Target rotation angle
  rotationVelocity: number; // Rotation velocity for smooth transitions
}

interface RagdollState {
  leftLeg: Limb | null;
  rightLeg: Limb | null;
  leftArm: Limb | null;
  rightArm: Limb | null;
  leftWing: Phaser.GameObjects.Sprite | null;
  rightWing: Phaser.GameObjects.Sprite | null;
  body: Phaser.GameObjects.Sprite | null;
  head: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container | null;
  headOriginalX: number;
  headOriginalY: number;
  stepTimer: number;
  currentStep: 'left' | 'right';
  centerX: number;
  centerY: number;
  // Blinking animation state
  lastBlinkTime?: number;
  nextBlinkTime?: number;
  isBlinking?: boolean;
  blinkStartTime?: number;
  // Flying animation state
  flapTimer?: number;
}

export class RagdollPhysicsSystem {
  private scene: Phaser.Scene;
  private ragdollStates: Map<string, RagdollState> = new Map();
  
  // Physics parameters - tuned for smooth, non-glitchy animations
  private readonly LIMB_SPRING = 0.05; // SLOWER response = smoother arm transitions (was 0.08)
  private readonly LIMB_DAMPING = 0.88; // Higher damping = less overshoot (was 0.85)
  private readonly ARM_SPRING = 0.03; // EXTRA slow for arms specifically
  private readonly ARM_DAMPING = 0.92; // Extra damping for arms
  private readonly ARM_MAX_VELOCITY = 1.5; // Arms move even slower than legs
  // LEG ANIMATION CONSTANTS - Redesigned for realistic 2D side-scroller movement
  private readonly LEG_SWING_ANGLE = 27.5; // Degrees of leg swing - 10% more exaggerated (was 25)
  private readonly STEP_CYCLE_DURATION = 600; // ms per full step cycle
  private readonly LEG_ROTATION_SPEED = 0.15; // How fast legs rotate to target angle
  private readonly JUMP_SQUAT_ANGLE = 45; // Degrees legs bend during jump squat
  private readonly CLIMB_STEP_ANGLE = 60; // Degrees for climbing large steps
  private readonly GRAB_DISTANCE = 40; // Max distance for hand grabbing
  private readonly IK_ITERATIONS = 3; // Iterations for IK solver
  private readonly MIN_MOVEMENT_THRESHOLD = 0.5; // Prevent micro-jittering
  private readonly MAX_LIMB_VELOCITY = 3.0; // Cap velocity to prevent fast snapping (legs)
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Check if a monster has legs (used to determine walk vs fly animation)
   */
  public hasLegs(monsterId: string): boolean {
    const state = this.ragdollStates.get(monsterId);
    return !!(state && (state.leftLeg || state.rightLeg));
  }
  
  /**
   * Check if a monster has wings (flying monsters)
   */
  public hasWings(monsterId: string): boolean {
    const state = this.ragdollStates.get(monsterId);
    return !!(state && (state.leftWing || state.rightWing));
  }
  
  /**
   * Initialize ragdoll physics for a monster container
   */
  public initializeRagdoll(
    monsterId: string,
    container: Phaser.GameObjects.Container,
    centerX: number,
    centerY: number
  ): void {
    // Find limbs - they might be nested or have different names
    let leftLeg: Phaser.GameObjects.Sprite | null = null;
    let rightLeg: Phaser.GameObjects.Sprite | null = null;
    let leftArm: Phaser.GameObjects.Sprite | null = null;
    let rightArm: Phaser.GameObjects.Sprite | null = null;
    let leftWing: Phaser.GameObjects.Sprite | null = null;
    let rightWing: Phaser.GameObjects.Sprite | null = null;
    let body: Phaser.GameObjects.Sprite | null = null;
    let head: Phaser.GameObjects.Sprite | null = null;
    
    // Search through all children to find limbs by name pattern
    container.list.forEach((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Sprite || child instanceof Phaser.GameObjects.Container) {
        const name = (child as any).name || '';
        if (name.includes('leftLeg') || name.includes('left_leg')) leftLeg = child as any;
        else if (name.includes('rightLeg') || name.includes('right_leg')) rightLeg = child as any;
        else if (name.includes('leftArm') || name.includes('left_arm')) leftArm = child as any;
        else if (name.includes('rightArm') || name.includes('right_arm')) rightArm = child as any;
        else if (name.includes('leftWing') || name.includes('left_wing')) leftWing = child as any;
        else if (name.includes('rightWing') || name.includes('right_wing')) rightWing = child as any;
        else if (name.includes('body')) body = child as any;
        else if (name.includes('head')) head = child as any;
      }
    });
    
    // Smart positioning: analyze actual limb positions to determine proper rest positions
    const leftLegRest = this.calculateLimbRestPosition(leftLeg, 'leg', 'left', body);
    const rightLegRest = this.calculateLimbRestPosition(rightLeg, 'leg', 'right', body);
    const leftArmRest = this.calculateLimbRestPosition(leftArm, 'arm', 'left', body);
    const rightArmRest = this.calculateLimbRestPosition(rightArm, 'arm', 'right', body);
    
    console.log(`🦿 Ragdoll init for ${monsterId}: legs=${!!leftLeg}/${!!rightLeg}, arms=${!!leftArm}/${!!rightArm}, wings=${!!leftWing}/${!!rightWing}`);
    console.log(`  Leg rest positions: L(${leftLegRest.x}, ${leftLegRest.y}), R(${rightLegRest.x}, ${rightLegRest.y})`);
    console.log(`  Arm rest positions: L(${leftArmRest.x}, ${leftArmRest.y}), R(${rightArmRest.x}, ${rightArmRest.y})`);
    
    // Store head's INITIAL position for animations
    const headX = head ? (head as any).x : 0;
    const headY = head ? (head as any).y : 0;
    
    if (head) {
      console.log(`📍 Head initialized at (${headX}, ${headY}) for ${monsterId}`);
    }
    
    const state: RagdollState = {
      leftLeg: leftLeg ? this.createLimb(leftLeg, leftLegRest.x, leftLegRest.y) : null,
      rightLeg: rightLeg ? this.createLimb(rightLeg, rightLegRest.x, rightLegRest.y) : null,
      leftArm: leftArm ? this.createLimb(leftArm, leftArmRest.x, leftArmRest.y) : null,
      rightArm: rightArm ? this.createLimb(rightArm, rightArmRest.x, rightArmRest.y) : null,
      leftWing,
      rightWing,
      body,
      head,
      headOriginalX: headX,
      headOriginalY: headY,
      stepTimer: 0,
      currentStep: 'left',
      centerX,
      centerY,
      flapTimer: 0
    };
    
    this.ragdollStates.set(monsterId, state);
  }
  
  /**
   * Calculate intelligent rest position for a limb based on its type and current position
   */
  private calculateLimbRestPosition(
    limb: Phaser.GameObjects.Sprite | null,
    type: 'leg' | 'arm',
    side: 'left' | 'right',
    body: Phaser.GameObjects.Sprite | null
  ): { x: number; y: number } {
    if (!limb) {
      // Default fallback positions - 10% closer together
      if (type === 'leg') {
        return { x: side === 'left' ? -7.2 : 7.2, y: 30 }; // 10% closer (was -8/8)
      } else {
        return { x: side === 'left' ? -12 : 12, y: 5 };
      }
    }
    
    // Use the limb's current position as a starting point
    const currentX = limb.x;
    const currentY = limb.y;
    
    // Legs should be positioned DIRECTLY UNDER the monster (narrow stance)
    if (type === 'leg') {
      // Clamp X to be very close to center - 10% closer together
      const clampedX = Math.max(-10.8, Math.min(10.8, currentX || (side === 'left' ? -7.2 : 7.2))); // 10% closer (was -12/12)
      
      return {
        x: clampedX,
        y: Math.max(currentY, 25) // At least 25 units down for proper leg length
      };
    } 
    // Arms should be positioned AT THE SIDES of the body, HANGING DOWN vertically
    else {
      // Scale down extreme positions but keep arms close to body sides
      let armX = currentX || (side === 'left' ? -20 : 20);
      
      // If arms are too far out, scale them down to reasonable distance
      if (Math.abs(armX) > 50) {
        armX = Math.sign(armX) * (25 + (Math.abs(armX) - 50) * 0.3); // Scale down excess
      }
      
      // Ensure minimum distance from center (arms on sides, not center)
      const minArmDistance = 15;
      if (Math.abs(armX) < minArmDistance) {
        armX = side === 'left' ? -minArmDistance : minArmDistance;
      }
      
      // Arms should hang DOWN naturally (positive Y = down from shoulder)
      return {
        x: armX,
        y: Math.max(currentY, 15) // Arms hang down at least 15 units from shoulder
      };
    }
  }
  
  /**
   * Create a limb with initial physics properties
   */
  private createLimb(sprite: Phaser.GameObjects.Sprite, restX: number, restY: number): Limb {
    // CRITICAL: Set origin to top-center (0.5, 0) so limb rotates from "joint"
    // This makes legs hang down and arms extend from shoulders
    sprite.setOrigin(0.5, 0);
    
    return {
      sprite,
      targetX: restX,
      targetY: restY,
      currentX: restX,
      currentY: restY,
      velocityX: 0,
      velocityY: 0,
      restX,
      restY,
      length: sprite.height || 30,
      isGrounded: false,
      isGrabbing: false,
      // Initialize rotation properties
      rotation: 0,
      targetRotation: 0,
      rotationVelocity: 0
    };
  }
  
  /**
   * Update ragdoll physics for walking
   */
  public updateWalking(
    monsterId: string,
    container: Phaser.GameObjects.Container,
    velocityX: number,
    velocityY: number,
    groundY: number,
    deltaTime: number
  ): void {
    const state = this.ragdollStates.get(monsterId);
    if (!state) {
      console.warn(`⚠️ No ragdoll state for ${monsterId}`);
      return;
    }
    
    const speed = Math.abs(velocityX);
    
    // LEGS - Use universal walking system!
    this.updateLegWalking(state, velocityX, deltaTime);
    
    // Arms sway naturally while walking - more visible movement
    if (state.leftArm && state.rightArm) {
      // Gentle sway - 8 pixels of movement (more visible)
      const swingCycle = (state.stepTimer / this.STEP_CYCLE_DURATION) * Math.PI;
      const armSway = Math.sin(swingCycle) * 8; // 8 pixels - visible but natural!
      
      // Arms hang down and sway forward/back
      state.leftArm.sprite.x = state.leftArm.restX;
      state.leftArm.sprite.y = state.leftArm.restY + armSway;
      
      state.rightArm.sprite.x = state.rightArm.restX;
      state.rightArm.sprite.y = state.rightArm.restY - armSway; // Opposite direction
    }
    
    // Body breathing animation (always active)
    const breatheCycle = Date.now() * 0.0012; // Slower breathing (was 0.0015)
    const breatheScale = 1.0 + Math.sin(breatheCycle) * 0.04; // 4% scale change - MORE VISIBLE (was 0.02)
    
    // Calculate body bob offset (used by both body and head)
    const bobOffset = Math.abs(Math.sin(state.stepTimer / this.STEP_CYCLE_DURATION * Math.PI * 2)) * 5; // Increased to 5 (was 3)
    
    if (state.body) {
      // Walking bob + breathing - MORE VISIBLE
      state.body.y = -bobOffset;
      state.body.setScale(breatheScale); // Breathing animation
      
      // EXTREMELY SUBTLE body sway/lean during walking
      const swayCycle = (state.stepTimer / this.STEP_CYCLE_DURATION) * Math.PI * 2;
      const swayAngle = Math.sin(swayCycle) * 0.015; // Only ±0.015 radians (±0.86°) - very natural
      state.body.rotation = swayAngle;
    }
    
    // Head ALWAYS bobs during walk AND follows body rotation
    if (state.head) {
      // Visible bob up and down in sync with steps - INCREASED visibility
      const headBobCycle = (state.stepTimer / this.STEP_CYCLE_DURATION) * Math.PI;
      const headBobOffset = Math.sin(headBobCycle) * 6; // INCREASED to 6 units (was 4)
      
      // Subtle side-to-side sway
      const headSwayOffset = Math.sin(headBobCycle * 0.5) * 2; // 2 unit sway
      
      // CRITICAL: Add bob offset to ORIGINAL position, don't replace it!
      (state.head as any).y = state.headOriginalY + headBobOffset - bobOffset; // Follow body bob!
      (state.head as any).x = state.headOriginalX + headSwayOffset;
      
      // HEAD MUST FOLLOW BODY ROTATION (connected to body)
      if (state.body) {
        (state.head as any).rotation = state.body.rotation; // Head rotates with body sway
      }
      
      // All facial features (eyes, mouth, etc.) are children of head
      // They automatically move with the head, no extra work needed!
    }
    
    // Eye blinking animation
    this.updateEyeBlinking(state);
  }
  
  /**
   * Update ragdoll physics for carrying - arms OR mouth holds resource
   */
  public updateCarrying(
    monsterId: string,
    container: Phaser.GameObjects.Container,
    resourceX: number,
    resourceY: number,
    deltaTime: number,
    velocityX: number = 0,
    velocityY: number = 0,
    isOnGround: boolean = true
  ): void {
    const state = this.ragdollStates.get(monsterId);
    if (!state) return;
    
    // Convert world resource position to container-relative coordinates
    const relativeX = resourceX - (container.x + state.centerX);
    const relativeY = resourceY - (container.y + state.centerY);
    
    const hasArms = state.leftArm || state.rightArm;
    
    if (hasArms) {
      // Arms MUST reach out and TOUCH the resource - visible grip!
      // Position arms at the sides of the resource block
      const resourceWidth = 16; // Standard resource block width
      const gripOffset = resourceWidth / 2 + 5; // Reach to sides + 5 pixels overlap
      
      if (state.leftArm) {
        // Left arm reaches to LEFT side of resource
        state.leftArm.sprite.x = relativeX - gripOffset;
        state.leftArm.sprite.y = relativeY; // At resource height
      }
      
      if (state.rightArm) {
        // Right arm reaches to RIGHT side of resource
        state.rightArm.sprite.x = relativeX + gripOffset;
        state.rightArm.sprite.y = relativeY; // At resource height
      }
    } else {
      // NO ARMS - use mouth/head to carry!
      if (state.head) {
        // Head tilts down slightly to "bite" the resource
        const carryTilt = 0.2; // Slight downward tilt
        (state.head as any).rotation = carryTilt;
        
        // Find mouth sprite and make it "grab" the resource visually
        const headContainer = state.head as any;
        if (headContainer.list) {
          headContainer.list.forEach((child: any) => {
            if (child.name && child.name.includes('mouth')) {
              // Make mouth slightly larger when carrying (biting/gripping)
              const originalScale = child.scaleX;
              child.setScale(originalScale * 1.1); // 10% bigger
            }
          });
        }
      }
      
      // Body leans forward slightly when carrying with mouth
      if (state.body) {
        state.body.rotation = 0.1; // Lean forward
      }
    }
    
    // LEGS - Use universal walking system!
    this.updateLegWalking(state, velocityX, deltaTime);
    
    // Eye blinking animation (always active)
    this.updateEyeBlinking(state);
  }
  
  /**
   * NEW REALISTIC LEG WALKING ANIMATION
   * Legs rotate from hip joint like pendulums - proper 2D side-scroller style
   * Research-based: Mimics classic 2D platformer leg animation (Mario, Sonic, Celeste style)
   */
  private updateLegWalking(state: RagdollState, velocityX: number, deltaTime: number): void {
    if (!state.leftLeg || !state.rightLeg) return;
    
    const isMovingHorizontally = Math.abs(velocityX) > 5; // Lowered from 20 for smoother animation start
    
    if (isMovingHorizontally) {
      // Step cycle timing - smooth sine wave for pendulum motion
      state.stepTimer += deltaTime * 1000;
      if (state.stepTimer >= this.STEP_CYCLE_DURATION) {
        state.stepTimer = 0;
      }
      
      // Calculate pendulum swing angles for each leg
      // Like a metronome - opposite legs swing opposite directions
      const cycleProgress = state.stepTimer / this.STEP_CYCLE_DURATION;
      const swingAngle = Math.sin(cycleProgress * Math.PI * 2); // -1 to 1 smooth wave
      
      // LEFT LEG swings forward when RIGHT swings back (opposite phase)
      const leftLegAngle = swingAngle * this.LEG_SWING_ANGLE; // -27.5 to +27.5 degrees (10% more)
      const rightLegAngle = -swingAngle * this.LEG_SWING_ANGLE; // Opposite direction
      
      // Apply rotation smoothly
      state.leftLeg.targetRotation = leftLegAngle * (Math.PI / 180); // Convert to radians
      state.rightLeg.targetRotation = rightLegAngle * (Math.PI / 180);
      
      // Smooth rotation interpolation
      this.smoothRotateToTarget(state.leftLeg, deltaTime);
      this.smoothRotateToTarget(state.rightLeg, deltaTime);
      
      // Apply the rotation to the sprite (pivots from hip/top of sprite)
      state.leftLeg.sprite.rotation = state.leftLeg.rotation;
      state.rightLeg.sprite.rotation = state.rightLeg.rotation;
      
    } else {
      // IDLE - legs hang straight down (0 rotation)
      state.leftLeg.targetRotation = 0;
      state.rightLeg.targetRotation = 0;
      
      this.smoothRotateToTarget(state.leftLeg, deltaTime);
      this.smoothRotateToTarget(state.rightLeg, deltaTime);
      
      state.leftLeg.sprite.rotation = state.leftLeg.rotation;
      state.rightLeg.sprite.rotation = state.rightLeg.rotation;
    }
  }
  
  /**
   * Smooth rotation interpolation for natural leg movement
   */
  private smoothRotateToTarget(limb: Limb, deltaTime: number): void {
    const rotationDiff = limb.targetRotation - limb.rotation;
    
    // Apply rotation velocity
    limb.rotationVelocity = rotationDiff * this.LEG_ROTATION_SPEED;
    limb.rotation += limb.rotationVelocity;
    
    // Snap to target if very close
    if (Math.abs(rotationDiff) < 0.01) {
      limb.rotation = limb.targetRotation;
      limb.rotationVelocity = 0;
    }
  }
  
  /**
   * Update ragdoll physics for climbing
   */
  public updateClimbing(
    monsterId: string,
    container: Phaser.GameObjects.Container,
    blockX: number,
    blockY: number,
    isReaching: boolean,
    deltaTime: number,
    velocityX: number = 0
  ): void {
    const state = this.ragdollStates.get(monsterId);
    if (!state) return;
    
    // LEGS ALWAYS WALK when moving horizontally
    this.updateLegWalking(state, velocityX, deltaTime);
    
    // Arms hang down naturally during climbing - SIMPLE
    if (state.leftArm && state.rightArm) {
      // Arms just hang down at sides - no complex reaching animation
      state.leftArm.sprite.x = state.leftArm.restX;
      state.leftArm.sprite.y = state.leftArm.restY;
      
      state.rightArm.sprite.x = state.rightArm.restX;
      state.rightArm.sprite.y = state.rightArm.restY;
    }
    
    // Eye blinking animation (always active)
    this.updateEyeBlinking(state);
    
    // CLIMBING STEP ANIMATION - Big steps up blocks (rotation-based)
    if (state.leftLeg && state.rightLeg) {
      // Alternate legs for climbing steps
      state.stepTimer += deltaTime * 1000;
      if (state.stepTimer >= this.STEP_CYCLE_DURATION) {
        state.stepTimer = 0;
        state.currentStep = state.currentStep === 'left' ? 'right' : 'left';
      }
      
      const stepProgress = state.stepTimer / this.STEP_CYCLE_DURATION;
      const steppingLeg = state.currentStep === 'left' ? state.leftLeg : state.rightLeg;
      const plantedLeg = state.currentStep === 'left' ? state.rightLeg : state.leftLeg;
      
      // STEPPING LEG: Rotate forward and UP for big step
      if (steppingLeg) {
        // Big forward rotation for climbing
        const climbAngle = Math.sin(stepProgress * Math.PI) * this.CLIMB_STEP_ANGLE;
        steppingLeg.targetRotation = climbAngle * (Math.PI / 180);
        this.smoothRotateToTarget(steppingLeg, deltaTime);
        steppingLeg.sprite.rotation = steppingLeg.rotation;
      }
      
      // PLANTED LEG: Stays vertical or slight back lean
      if (plantedLeg) {
        plantedLeg.targetRotation = -10 * (Math.PI / 180); // Slight back lean for stability
        this.smoothRotateToTarget(plantedLeg, deltaTime);
        plantedLeg.sprite.rotation = plantedLeg.rotation;
      }
    }
  }
  
  /**
   * Update ragdoll physics for flying - wing flapping and body bobbing
   */
  public updateFlying(
    monsterId: string,
    velocityX: number,
    velocityY: number,
    deltaTime: number
  ): void {
    const state = this.ragdollStates.get(monsterId);
    if (!state) return;
    
    // Initialize flap timer
    if (state.flapTimer === undefined) state.flapTimer = 0;
    
    // Wing flapping animation - faster when moving, slower when hovering
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    const flapSpeed = speed > 50 ? 200 : 400; // Fast flap when moving, slow when hovering
    
    state.flapTimer += deltaTime * 1000;
    if (state.flapTimer >= flapSpeed) {
      state.flapTimer = 0;
    }
    
    const flapProgress = state.flapTimer / flapSpeed;
    const flapAngle = Math.sin(flapProgress * Math.PI * 2) * 0.6; // Wing flap range: ±0.6 radians (±34°)
    
    // Animate wings
    if (state.leftWing) {
      // Left wing flaps up and down
      state.leftWing.rotation = flapAngle;
      // Slight scale change for wing "power" effect
      const wingScale = 1.0 + Math.abs(flapAngle) * 0.1;
      state.leftWing.setScale(wingScale);
    }
    
    if (state.rightWing) {
      // Right wing flaps opposite to left (or same - both work)
      state.rightWing.rotation = -flapAngle;
      const wingScale = 1.0 + Math.abs(flapAngle) * 0.1;
      state.rightWing.setScale(wingScale);
    }
    
    // Calculate body bob amount (used by both body and head)
    const bobAmount = Math.sin(flapProgress * Math.PI * 2) * 4; // Slightly increased to 4 (was 3)
    
    // Body bobbing - SUBTLE up/down motion matching wing flaps
    if (state.body) {
      state.body.y = bobAmount;
      
      // EXTREMELY SUBTLE body tilt based on horizontal movement
      if (Math.abs(velocityX) > 20) {
        const tilt = (velocityX / 200) * 0.025; // Barely noticeable tilt (was 0.04)
        state.body.rotation = tilt;
      } else {
        state.body.rotation = 0;
      }
      
      // Breathing animation on top of bobbing
      const breatheCycle = Date.now() * 0.0012; // Slower breathing
      const breatheScale = 1.0 + Math.sin(breatheCycle) * 0.04; // MORE VISIBLE (was 0.02)
      state.body.setScale(breatheScale);
    }
    
    // Head follows body bobbing AND rotation - CRITICAL FOR FLYING MONSTERS
    if (state.head) {
      const headBob = Math.sin(flapProgress * Math.PI * 2) * 2; // Slightly more bob (was 1.5)
      
      // APPLY BOTH vertical movement AND rotation
      (state.head as any).y = state.headOriginalY + headBob + bobAmount; // Follow body bob!
      
      // HEAD MUST FOLLOW BODY ROTATION for connected appearance
      if (state.body) {
        (state.head as any).rotation = state.body.rotation; // Head rotates with body tilt
      }
    }
    
    // Legs tuck up slightly when flying - ROTATION BASED
    if (state.leftLeg && state.rightLeg) {
      // Legs tuck forward slightly (small rotation)
      const tuckAngle = 15; // Degrees forward
      state.leftLeg.targetRotation = tuckAngle * (Math.PI / 180);
      state.rightLeg.targetRotation = tuckAngle * (Math.PI / 180);
      
      this.smoothRotateToTarget(state.leftLeg, deltaTime);
      this.smoothRotateToTarget(state.rightLeg, deltaTime);
      
      state.leftLeg.sprite.rotation = state.leftLeg.rotation;
      state.rightLeg.sprite.rotation = state.rightLeg.rotation;
    }
    
    // Arms hang down naturally while flying - SIMPLE
    if (state.leftArm && state.rightArm && !state.leftWing) {
      // Arms just hang straight down - no complex movement
      state.leftArm.sprite.x = state.leftArm.restX;
      state.leftArm.sprite.y = state.leftArm.restY;
      
      state.rightArm.sprite.x = state.rightArm.restX;
      state.rightArm.sprite.y = state.rightArm.restY;
    }
    
    // Eye blinking
    this.updateEyeBlinking(state);
  }
  
  /**
   * Update ragdoll physics for mining - VIOLENT LUNGE/BASH attack
   */
  public updateMining(
    monsterId: string,
    container: Phaser.GameObjects.Container,
    targetBlockX: number,
    targetBlockY: number,
    swingProgress: number, // 0 to 1
    deltaTime: number
  ): void {
    const state = this.ragdollStates.get(monsterId);
    if (!state) return;
    
    // METHODICAL LUNGE BASH - slow wind-up, EXPLOSIVE impact
    // Phase 1 (0-0.4): Slow wind-up, pulling back
    // Phase 2 (0.4-0.6): EXPLOSIVE forward bash
    // Phase 3 (0.6-1.0): Slow recovery
    
    let bashPhase: 'windup' | 'impact' | 'recovery';
    let phaseProgress: number;
    
    if (swingProgress < 0.4) {
      bashPhase = 'windup';
      phaseProgress = swingProgress / 0.4; // 0 to 1
    } else if (swingProgress < 0.6) {
      bashPhase = 'impact';
      phaseProgress = (swingProgress - 0.4) / 0.2; // 0 to 1
    } else {
      bashPhase = 'recovery';
      phaseProgress = (swingProgress - 0.6) / 0.4; // 0 to 1
    }
    
    // Both arms work together for VIOLENT BASH
    if (state.rightArm && state.leftArm) {
      const relativeX = targetBlockX - (container.x + state.centerX);
      const relativeY = targetBlockY - (container.y + state.centerY);
      
      if (bashPhase === 'windup') {
        // Wind-up - pull arms back slightly
        const windupEase = Math.pow(phaseProgress, 2);
        
        // Pull back from rest position
        state.rightArm.sprite.x = state.rightArm.restX - 15 * windupEase;
        state.rightArm.sprite.y = state.rightArm.restY - 20 * windupEase;
        state.leftArm.sprite.x = state.leftArm.restX - 15 * windupEase;
        state.leftArm.sprite.y = state.leftArm.restY - 20 * windupEase;
        
      } else if (bashPhase === 'impact') {
        // Forward bash - move toward target
        const impactEase = 1 - Math.pow(1 - phaseProgress, 3);
        
        // Simple forward movement
        state.rightArm.sprite.x = relativeX * 0.5 * impactEase;
        state.rightArm.sprite.y = relativeY * 0.5 * impactEase;
        state.leftArm.sprite.x = relativeX * 0.5 * impactEase;
        state.leftArm.sprite.y = relativeY * 0.5 * impactEase;
        
      } else {
        // Recovery - return to rest
        const recoveryEase = Math.pow(phaseProgress, 2);
        
        // Lerp back to rest position
        const restProgress = 1 - recoveryEase;
        state.rightArm.sprite.x = relativeX * 0.5 * restProgress + state.rightArm.restX * recoveryEase;
        state.rightArm.sprite.y = relativeY * 0.5 * restProgress + state.rightArm.restY * recoveryEase;
        state.leftArm.sprite.x = relativeX * 0.5 * restProgress + state.leftArm.restX * recoveryEase;
        state.leftArm.sprite.y = relativeY * 0.5 * restProgress + state.leftArm.restY * recoveryEase;
      }
    }
    
    // ENTIRE BODY lunges forward during bash
    if (state.body) {
      if (bashPhase === 'windup') {
        // Lean back during wind-up
        const windupLean = -0.15 * Math.pow(phaseProgress, 2);
        state.body.rotation = windupLean;
        state.body.x = -8 * phaseProgress; // Pull back
      } else if (bashPhase === 'impact') {
        // VIOLENT forward lunge
        const impactLean = 0.3 * (1 - Math.pow(1 - phaseProgress, 3));
        state.body.rotation = impactLean;
        state.body.x = 12 * phaseProgress; // Lunge forward
      } else {
        // Recovery
        const recoveryLean = 0.3 * (1 - phaseProgress);
        state.body.rotation = recoveryLean;
        state.body.x = 12 * (1 - phaseProgress);
      }
    }
    
    // Head MUST follow body movement and rotation during mining
    if (state.head && state.body) {
      // Head follows body's horizontal movement
      (state.head as any).x = state.headOriginalX + state.body.x;
      
      // Head follows body's vertical movement
      if (bashPhase === 'impact') {
        (state.head as any).y = state.headOriginalY + 2 * phaseProgress; // Lunge down
      } else {
        (state.head as any).y = state.headOriginalY;
      }
      
      // Head MUST rotate with body
      (state.head as any).rotation = state.body.rotation;
    }
    
    // Legs brace during bash
    if (state.leftLeg && state.rightLeg) {
      // LEGS: Brace and push during mining bash - ROTATION BASED
      if (bashPhase === 'windup') {
        // Crouch - legs bend outward (bracing)
        const crouchAngle = 20 * phaseProgress; // Up to 20 degrees
        state.leftLeg.targetRotation = -crouchAngle * (Math.PI / 180);
        state.rightLeg.targetRotation = crouchAngle * (Math.PI / 180);
      } else if (bashPhase === 'impact') {
        // Push off - legs straighten
        const straightenAmount = 1 - phaseProgress; // 1 to 0
        const pushAngle = 20 * straightenAmount;
        state.leftLeg.targetRotation = -pushAngle * (Math.PI / 180);
        state.rightLeg.targetRotation = pushAngle * (Math.PI / 180);
      } else {
        // Return to neutral
        state.leftLeg.targetRotation = 0;
        state.rightLeg.targetRotation = 0;
      }
      
      this.smoothRotateToTarget(state.leftLeg, deltaTime);
      this.smoothRotateToTarget(state.rightLeg, deltaTime);
      state.leftLeg.sprite.rotation = state.leftLeg.rotation;
      state.rightLeg.sprite.rotation = state.rightLeg.rotation;
    }
    
    // Eye blinking animation (always active)
    this.updateEyeBlinking(state);
  }
  
  /**
   * Apply spring physics to move limb toward target - SMOOTH transitions
   * isArm parameter enables extra-slow movement for arms
   */
  private applySpringPhysics(limb: Limb, deltaTime: number, isArm: boolean = false): void {
    if (!limb) return;
    
    // Calculate distance to target
    const dx = limb.targetX - limb.currentX;
    const dy = limb.targetY - limb.currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Prevent micro-jittering - if very close to target, snap to it
    if (distance < this.MIN_MOVEMENT_THRESHOLD) {
      limb.currentX = limb.targetX;
      limb.currentY = limb.targetY;
      limb.velocityX *= 0.5; // Dampen velocity when snapping
      limb.velocityY *= 0.5;
      return;
    }
    
    // Use SLOWER physics for arms to prevent bizarre quick movements
    const spring = isArm ? this.ARM_SPRING : this.LIMB_SPRING;
    const damping = isArm ? this.ARM_DAMPING : this.LIMB_DAMPING;
    const maxVelocity = isArm ? this.ARM_MAX_VELOCITY : this.MAX_LIMB_VELOCITY;
    
    // Spring force toward target (smooth, gradual)
    const forceX = dx * spring;
    const forceY = dy * spring;
    
    // Update velocity
    limb.velocityX += forceX;
    limb.velocityY += forceY;
    
    // Apply damping (prevents overshoot and oscillation)
    limb.velocityX *= damping;
    limb.velocityY *= damping;
    
    // CAP velocity to prevent fast snapping (smooth transitions ONLY)
    const velocityMagnitude = Math.sqrt(limb.velocityX * limb.velocityX + limb.velocityY * limb.velocityY);
    if (velocityMagnitude > maxVelocity) {
      const scale = maxVelocity / velocityMagnitude;
      limb.velocityX *= scale;
      limb.velocityY *= scale;
    }
    
    // Update position
    limb.currentX += limb.velocityX;
    limb.currentY += limb.velocityY;
  }
  
  /**
   * Apply inverse kinematics to position limb sprite
   * With origin at (0.5, 0), sprite rotates from its top (joint position)
   */
  private applyIK(limb: Limb, centerX: number, centerY: number): void {
    if (!limb || !limb.sprite) return;
    
    // Calculate angle from center (joint) to target position (foot/hand)
    const dx = limb.targetX - limb.restX;
    const dy = limb.targetY - limb.restY;
    const distance = Math.hypot(dx, dy);
    
    // Clamp distance to limb length (can't stretch beyond length)
    const maxReach = limb.length;
    
    // If target is beyond reach, clamp it
    let finalX = limb.targetX;
    let finalY = limb.targetY;
    if (distance > maxReach) {
      const scale = maxReach / distance;
      finalX = limb.restX + dx * scale;
      finalY = limb.restY + dy * scale;
    }
    
    // Calculate rotation angle pointing from joint to final position
    const finalDx = finalX - limb.restX;
    const finalDy = finalY - limb.restY;
    let angle = Math.atan2(finalDy, finalDx);
    
    // Position sprite at the joint (hip/shoulder)
    limb.sprite.x = limb.restX;
    limb.sprite.y = limb.restY;
    
    // Rotate to point toward target
    // Add 90 degrees (PI/2) because origin is at top, so 0 rotation points right
    // We want the limb to point toward the target
    limb.sprite.rotation = angle + Math.PI / 2;
    
    // Visual feedback for grabbing
    if (limb.isGrabbing) {
      limb.sprite.setTint(0xffff00); // Yellow when grabbing
    } else {
      limb.sprite.clearTint();
    }
  }
  
  /**
   * Reset limb to idle position with gentle breathing animation
   */
  public resetToIdle(monsterId: string, deltaTime: number = 16): void {
    const state = this.ragdollStates.get(monsterId);
    if (!state) return;
    
    // Gentle idle breathing animation
    const breatheCycle = Date.now() * 0.0012; // Slow breathing
    const breatheOffset = Math.sin(breatheCycle) * 4; // Visible breathing movement (was 3)
    
    // IDLE LEGS - Hang straight down with rotation-based animation
    if (state.leftLeg) {
      state.leftLeg.targetRotation = 0; // Straight down
      this.smoothRotateToTarget(state.leftLeg, deltaTime);
      state.leftLeg.sprite.rotation = state.leftLeg.rotation;
    }
    if (state.rightLeg) {
      state.rightLeg.targetRotation = 0; // Straight down
      this.smoothRotateToTarget(state.rightLeg, deltaTime);
      state.rightLeg.sprite.rotation = state.rightLeg.rotation;
    }
    
    // Arms hang DOWN naturally when idle - SIMPLE
    if (state.leftArm) {
      state.leftArm.sprite.x = state.leftArm.restX;
      state.leftArm.sprite.y = state.leftArm.restY + breatheOffset * 0.2; // Tiny breathing sway
    }
    if (state.rightArm) {
      state.rightArm.sprite.x = state.rightArm.restX;
      state.rightArm.sprite.y = state.rightArm.restY - breatheOffset * 0.2; // Opposite
    }
    
    if (state.body) {
      state.body.rotation = 0;
      state.body.y = breatheOffset * 0.8; // MORE visible breathing (was 0.5)
      const breatheScale = 1.0 + Math.sin(Date.now() * 0.0012) * 0.04; // 4% scale change
      state.body.setScale(breatheScale);
    }
    if (state.head) {
      (state.head as any).rotation = 0; // Reset rotation when idle
    }
    
    // Eye blinking animation (always active)
    this.updateEyeBlinking(state);
  }
  
  /**
   * JUMP SQUAT ANIMATION - Legs bend before jumping
   * Call this before a jump to create anticipation
   */
  public updateJumpSquat(monsterId: string, squatProgress: number): void {
    const state = this.ragdollStates.get(monsterId);
    if (!state || !state.leftLeg || !state.rightLeg) return;
    
    // Squat: Legs bend outward (both rotate outward)
    const squatAngle = squatProgress * this.JUMP_SQUAT_ANGLE;
    
    state.leftLeg.targetRotation = -squatAngle * (Math.PI / 180); // Bend left outward
    state.rightLeg.targetRotation = squatAngle * (Math.PI / 180); // Bend right outward
    
    // Quick rotation for responsive jumping
    const quickRotationSpeed = 0.3;
    const leftDiff = state.leftLeg.targetRotation - state.leftLeg.rotation;
    const rightDiff = state.rightLeg.targetRotation - state.rightLeg.rotation;
    
    state.leftLeg.rotation += leftDiff * quickRotationSpeed;
    state.rightLeg.rotation += rightDiff * quickRotationSpeed;
    
    state.leftLeg.sprite.rotation = state.leftLeg.rotation;
    state.rightLeg.sprite.rotation = state.rightLeg.rotation;
    
    // Body crouches down
    if (state.body) {
      state.body.y = squatProgress * 8; // Crouch down
    }
  }
  
  /**
   * Animate eye blinking
   */
  private updateEyeBlinking(state: RagdollState): void {
    if (!state.head) return;
    
    // Find all eye sprites (they are children of the head container)
    const headContainer = state.head as any; // Head might be a Container
    if (!headContainer.list) return; // Not a container, skip
    
    const eyes = headContainer.list.filter((child: any) => 
      child.name && child.name.includes('eye')
    ) as Phaser.GameObjects.Sprite[];
    
    if (eyes.length === 0) return;
    
    // Natural blink every 2-4 seconds (more frequent)
    const now = Date.now();
    if (!state.lastBlinkTime) {
      state.lastBlinkTime = now;
      state.nextBlinkTime = now + 2000 + Math.random() * 2000; // 2-4 seconds
    }
    
    if (state.nextBlinkTime && now >= state.nextBlinkTime) {
      // Start blink
      state.isBlinking = true;
      state.blinkStartTime = now;
      state.nextBlinkTime = now + 2000 + Math.random() * 2000; // Next blink in 2-4 seconds
    }
    
    // Blink animation (150ms total)
    if (state.isBlinking) {
      const blinkDuration = 150; // Fast blink
      const blinkProgress = (now - state.blinkStartTime!) / blinkDuration;
      
      if (blinkProgress < 1.0) {
        // Blink by scaling Y to 0 (eye closing)
        const blinkScale = Math.abs(Math.cos(blinkProgress * Math.PI)); // 1 -> 0 -> 1
        eyes.forEach(eye => {
          eye.setScale(eye.scaleX, eye.scaleX * blinkScale); // Keep X, scale Y
        });
      } else {
        // Blink finished
        state.isBlinking = false;
        eyes.forEach(eye => {
          eye.setScale(eye.scaleX, eye.scaleX); // Restore normal scale
        });
      }
    }
  }
  
  /**
   * Clean up ragdoll state
   */
  public removeRagdoll(monsterId: string): void {
    this.ragdollStates.delete(monsterId);
  }
  
  /**
   * Get ground Y position for a monster
   */
  public getGroundY(worldX: number, worldY: number, tileMap: any, tileSize: number): number {
    // Check tiles below monster for ground
    const tileX = Math.floor(worldX / tileSize);
    let tileY = Math.floor(worldY / tileSize);
    
    // Scan downward for solid tile
    for (let y = tileY; y < tileY + 5; y++) {
      if (tileMap && tileMap[y] && tileMap[y][tileX] > 0) {
        return y * tileSize;
      }
    }
    
    return worldY + 20; // Default if no ground found
  }
}
