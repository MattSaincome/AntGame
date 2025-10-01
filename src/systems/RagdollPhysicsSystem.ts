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
  private readonly STEP_HEIGHT = 8; // How high feet lift when stepping (was 15) - human-like
  private readonly STEP_DISTANCE = 18; // How far forward feet step (was 25) - smaller steps
  private readonly STEP_DURATION = 500; // ms per step (was 400) - slower, more human
  private readonly GRAB_DISTANCE = 40; // Max distance for hand grabbing
  private readonly IK_ITERATIONS = 3; // Iterations for IK solver
  private readonly MIN_MOVEMENT_THRESHOLD = 0.5; // Prevent micro-jittering
  private readonly MAX_LIMB_VELOCITY = 3.0; // Cap velocity to prevent fast snapping (legs)
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
    
    const state: RagdollState = {
      leftLeg: leftLeg ? this.createLimb(leftLeg, leftLegRest.x, leftLegRest.y) : null,
      rightLeg: rightLeg ? this.createLimb(rightLeg, rightLegRest.x, rightLegRest.y) : null,
      leftArm: leftArm ? this.createLimb(leftArm, leftArmRest.x, leftArmRest.y) : null,
      rightArm: rightArm ? this.createLimb(rightArm, rightArmRest.x, rightArmRest.y) : null,
      leftWing,
      rightWing,
      body,
      head,
      headOriginalX: (head as any)?.x ?? 0,
      headOriginalY: (head as any)?.y ?? 0,
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
      // Default fallback positions
      if (type === 'leg') {
        return { x: side === 'left' ? -8 : 8, y: 30 };
      } else {
        return { x: side === 'left' ? -12 : 12, y: 5 };
      }
    }
    
    // Use the limb's current position as a starting point
    const currentX = limb.x;
    const currentY = limb.y;
    
    // Legs should be positioned DIRECTLY UNDER the monster (narrow stance)
    if (type === 'leg') {
      // Clamp X to be very close to center (max 12 units from center)
      const clampedX = Math.max(-12, Math.min(12, currentX || (side === 'left' ? -8 : 8)));
      
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
      isGrabbing: false
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
    
    // Arms sway GENTLY and casually while walking - subtle vertical motion
    if (state.leftArm && state.rightArm) {
      // ONLY swing if not grabbing/carrying
      if (!state.leftArm.isGrabbing && !state.rightArm.isGrabbing) {
        // VERY gentle, slow sway (slower than legs for casual look)
        const swingCycle = (state.stepTimer / this.STEP_DURATION) * Math.PI * 0.5; // Quarter speed of legs
        const armSwayAmount = Math.sin(swingCycle) * 5; // Only 5 units - very subtle!
        
        // Arms stay pinned to sides, sway very slightly forward/back
        state.leftArm.targetX = state.leftArm.restX; // Pinned to side
        state.leftArm.targetY = state.leftArm.restY + armSwayAmount; // Subtle sway
        
        state.rightArm.targetX = state.rightArm.restX; // Pinned to side
        state.rightArm.targetY = state.rightArm.restY - armSwayAmount; // Opposite sway
        
        this.applySpringPhysics(state.leftArm, deltaTime, true); // isArm=true for slow movement
        this.applySpringPhysics(state.rightArm, deltaTime, true);
        this.applyIK(state.leftArm, 0, 0);
        this.applyIK(state.rightArm, 0, 0);
      } else {
        // Still apply physics even when grabbing to prevent stuck arms
        this.applySpringPhysics(state.leftArm, deltaTime, true); // isArm=true for slow movement
        this.applySpringPhysics(state.rightArm, deltaTime, true);
        this.applyIK(state.leftArm, 0, 0);
        this.applyIK(state.rightArm, 0, 0);
      }
    }
    
    // Body breathing animation (always active)
    const breatheCycle = Date.now() * 0.0012; // Slower breathing (was 0.0015)
    const breatheScale = 1.0 + Math.sin(breatheCycle) * 0.04; // 4% scale change - MORE VISIBLE (was 0.02)
    
    if (state.body) {
      // Walking bob + breathing
      const bobOffset = Math.abs(Math.sin(state.stepTimer / this.STEP_DURATION * Math.PI * 2)) * 3;
      state.body.y = -bobOffset;
      state.body.setScale(breatheScale); // Breathing animation
    }
    
    // Head ALWAYS bobs during walk (removed speed threshold)
    if (state.head) {
      // Visible bob up and down in sync with steps
      const headBobCycle = (state.stepTimer / this.STEP_DURATION) * Math.PI;
      const headBobOffset = Math.sin(headBobCycle) * 4; // 4 units up/down - very visible!
      
      // Subtle side-to-side sway
      const headSwayOffset = Math.sin(headBobCycle * 0.5) * 2; // 2 unit sway
      
      // CRITICAL: Add bob offset to ORIGINAL position, don't replace it!
      state.head.y = state.headOriginalY + headBobOffset;
      state.head.x = state.headOriginalX + headSwayOffset;
      
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
      // Use arms to hold resource
      if (state.leftArm) {
        state.leftArm.targetX = relativeX - 10; // Left side of block
        state.leftArm.targetY = relativeY;
        state.leftArm.isGrabbing = true; // Mark as grabbing
        this.applySpringPhysics(state.leftArm, deltaTime, true); // isArm=true for slow movement
        this.applyIK(state.leftArm, 0, 0);
      }
      
      if (state.rightArm) {
        state.rightArm.targetX = relativeX + 10; // Right side of block
        state.rightArm.targetY = relativeY;
        state.rightArm.isGrabbing = true; // Mark as grabbing
        this.applySpringPhysics(state.rightArm, deltaTime, true); // isArm=true for slow movement
        this.applyIK(state.rightArm, 0, 0);
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
   * UNIVERSAL leg walking animation - NATURAL walking motion
   */
  private updateLegWalking(state: RagdollState, velocityX: number, deltaTime: number): void {
    if (!state.leftLeg || !state.rightLeg) return;
    
    const isMovingHorizontally = Math.abs(velocityX) > 20; // Moving left/right
    
    if (isMovingHorizontally) {
      // Update step cycle
      state.stepTimer += deltaTime * 1000;
      if (state.stepTimer >= this.STEP_DURATION) {
        state.stepTimer = 0;
        state.currentStep = state.currentStep === 'left' ? 'right' : 'left';
      }
      
      const stepProgress = state.stepTimer / this.STEP_DURATION;
      const steppingLeg = state.currentStep === 'left' ? state.leftLeg : state.rightLeg;
      const plantedLeg = state.currentStep === 'left' ? state.rightLeg : state.leftLeg;
      
      // Stepping leg - SUBTLE, NATURAL walking arc
      if (steppingLeg) {
        // Smoother step arc - ease in/out
        const easeProgress = stepProgress < 0.5 
          ? 2 * stepProgress * stepProgress 
          : 1 - Math.pow(-2 * stepProgress + 2, 2) / 2;
        
        const stepArc = Math.sin(easeProgress * Math.PI) * 6; // Human-like lift (was 9)
        const stepForward = easeProgress * 8; // Small forward step (was 12)
        
        steppingLeg.targetX = steppingLeg.restX + stepForward - 4; // Center the motion
        steppingLeg.targetY = steppingLeg.restY - stepArc;
        steppingLeg.isGrounded = stepProgress > 0.75; // Earlier ground contact
      }
      
      // Planted leg - stays firmly planted with minimal shift
      if (plantedLeg) {
        const backShift = stepProgress * -4; // Minimal backward slide (was -6)
        plantedLeg.targetX = plantedLeg.restX + backShift;
        plantedLeg.targetY = plantedLeg.restY; // Always on ground
        plantedLeg.isGrounded = true;
      }
      
      this.applySpringPhysics(state.leftLeg, deltaTime);
      this.applySpringPhysics(state.rightLeg, deltaTime);
      this.applyIK(state.leftLeg, 0, 0);
      this.applyIK(state.rightLeg, 0, 0);
    } else {
      // Not moving - rest position
      state.leftLeg.targetX = state.leftLeg.restX;
      state.leftLeg.targetY = state.leftLeg.restY;
      state.rightLeg.targetX = state.rightLeg.restX;
      state.rightLeg.targetY = state.rightLeg.restY;
      
      this.applySpringPhysics(state.leftLeg, deltaTime);
      this.applySpringPhysics(state.rightLeg, deltaTime);
      this.applyIK(state.leftLeg, 0, 0);
      this.applyIK(state.rightLeg, 0, 0);
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
    
    // Hands reach for blocks
    if (state.leftArm && state.rightArm) {
      if (isReaching) {
        // Alternate hand reaching
        const reachingArm = state.currentStep === 'left' ? state.leftArm : state.rightArm;
        const otherArm = state.currentStep === 'left' ? state.rightArm : state.leftArm;
        
        // Reaching hand goes to block (convert world coords to container-relative)
        const relativeX = blockX - (container.x + state.centerX);
        const relativeY = blockY - (container.y + state.centerY);
        
        if (Math.abs(relativeX) < this.GRAB_DISTANCE && Math.abs(relativeY) < this.GRAB_DISTANCE) {
          reachingArm.targetX = relativeX;
          reachingArm.targetY = relativeY;
          reachingArm.isGrabbing = true;
          
          // Check if hand reached block
          const dist = Math.hypot(reachingArm.currentX - relativeX, reachingArm.currentY - relativeY);
          if (dist < 5) {
            // Switch to other hand
            state.stepTimer = 0;
            state.currentStep = state.currentStep === 'left' ? 'right' : 'left';
          }
        }
        
        // Other hand stays at rest
        otherArm.targetX = otherArm.restX;
        otherArm.targetY = otherArm.restY;
        otherArm.isGrabbing = false;
      } else {
        // Not reaching - return to rest
        state.leftArm.targetX = state.leftArm.restX;
        state.leftArm.targetY = state.leftArm.restY;
        state.leftArm.isGrabbing = false;
        state.rightArm.targetX = state.rightArm.restX;
        state.rightArm.targetY = state.rightArm.restY;
        state.rightArm.isGrabbing = false;
      }
      
      this.applySpringPhysics(state.leftArm, deltaTime, true); // isArm=true for slow movement
      this.applySpringPhysics(state.rightArm, deltaTime, true);
      this.applyIK(state.leftArm, 0, 0);
      this.applyIK(state.rightArm, 0, 0);
    }
    
    // Eye blinking animation (always active)
    this.updateEyeBlinking(state);
    
    // Legs perform BIG STEP / JUMP motion when climbing (looks natural!)
    if (state.leftLeg && state.rightLeg) {
      // Animate climbing step cycle
      state.stepTimer += deltaTime * 1000;
      if (state.stepTimer >= this.STEP_DURATION) {
        state.stepTimer = 0;
        state.currentStep = state.currentStep === 'left' ? 'right' : 'left';
      }
      
      const stepProgress = state.stepTimer / this.STEP_DURATION;
      const steppingLeg = state.currentStep === 'left' ? state.leftLeg : state.rightLeg;
      const followingLeg = state.currentStep === 'left' ? state.rightLeg : state.leftLeg;
      
      // Leading leg takes BIG STEP UP
      if (steppingLeg) {
        const liftHeight = Math.sin(stepProgress * Math.PI) * 25; // Lift 25 units (higher than normal walk)
        const stepForward = Math.sin(stepProgress * Math.PI) * 15;
        
        steppingLeg.targetX = steppingLeg.restX + stepForward;
        steppingLeg.targetY = steppingLeg.restY - liftHeight; // Big lift up
      }
      
      // Following leg stays on ground, then follows
      if (followingLeg) {
        if (stepProgress > 0.6) {
          // Start following after lead leg is mostly up
          const followProgress = (stepProgress - 0.6) / 0.4; // 0 to 1
          const followLift = Math.sin(followProgress * Math.PI) * 20;
          followingLeg.targetY = followingLeg.restY - followLift;
        } else {
          // Stays grounded
          followingLeg.targetX = followingLeg.restX;
          followingLeg.targetY = followingLeg.restY;
        }
      }
      
      this.applySpringPhysics(state.leftLeg, deltaTime);
      this.applySpringPhysics(state.rightLeg, deltaTime);
      this.applyIK(state.leftLeg, 0, 0);
      this.applyIK(state.rightLeg, 0, 0);
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
    
    // Body bobbing - subtle up/down motion matching wing flaps
    if (state.body) {
      const bobAmount = Math.sin(flapProgress * Math.PI * 2) * 3; // ±3 pixel bob
      state.body.y = bobAmount;
      
      // Subtle body tilt based on horizontal movement
      if (Math.abs(velocityX) > 20) {
        const tilt = (velocityX / 200) * 0.15; // Slight forward tilt when moving
        state.body.rotation = tilt;
      } else {
        state.body.rotation = 0;
      }
      
      // Breathing animation on top of bobbing
      const breatheCycle = Date.now() * 0.0012; // Slower breathing
      const breatheScale = 1.0 + Math.sin(breatheCycle) * 0.04; // MORE VISIBLE (was 0.02)
      state.body.setScale(breatheScale);
    }
    
    // Head slight bobbing (less than body)
    if (state.head) {
      const headBob = Math.sin(flapProgress * Math.PI * 2) * 1.5; // Half the body bob
      state.head.y = state.headOriginalY + headBob;
    }
    
    // Legs tuck up slightly when flying
    if (state.leftLeg && state.rightLeg) {
      const legSway = Math.sin(flapProgress * Math.PI * 2) * 5; // Legs sway slightly
      
      state.leftLeg.targetX = state.leftLeg.restX;
      state.leftLeg.targetY = state.leftLeg.restY - 10 + legSway; // Tucked up 10 pixels
      
      state.rightLeg.targetX = state.rightLeg.restX;
      state.rightLeg.targetY = state.rightLeg.restY - 10 - legSway; // Opposite sway
      
      this.applySpringPhysics(state.leftLeg, deltaTime);
      this.applySpringPhysics(state.rightLeg, deltaTime);
      this.applyIK(state.leftLeg, 0, 0);
      this.applyIK(state.rightLeg, 0, 0);
    }
    
    // Arms/wings hang down or spread
    if (state.leftArm && state.rightArm && !state.leftWing) {
      // Non-winged flying (shouldn't happen, but just in case)
      const armSway = Math.sin(flapProgress * Math.PI * 2) * 8;
      
      state.leftArm.targetX = state.leftArm.restX;
      state.leftArm.targetY = state.leftArm.restY + armSway;
      
      state.rightArm.targetX = state.rightArm.restX;
      state.rightArm.targetY = state.rightArm.restY - armSway;
      
      this.applySpringPhysics(state.leftArm, deltaTime, true); // isArm=true for slow movement
      this.applySpringPhysics(state.rightArm, deltaTime, true);
      this.applyIK(state.leftArm, 0, 0);
      this.applyIK(state.rightArm, 0, 0);
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
        // SLOW, METHODICAL wind-up - pulling back with both arms
        const windupEase = Math.pow(phaseProgress, 2); // Ease in
        
        // Pull both arms back high
        state.rightArm.targetX = relativeX - 35 * windupEase;
        state.rightArm.targetY = relativeY - 40 * windupEase; // Pull up high
        state.leftArm.targetX = relativeX - 40 * windupEase;
        state.leftArm.targetY = relativeY - 35 * windupEase;
        
        state.rightArm.isGrabbing = false;
        state.leftArm.isGrabbing = false;
        
      } else if (bashPhase === 'impact') {
        // EXPLOSIVE FORWARD BASH - VIOLENT impact
        const impactEase = 1 - Math.pow(1 - phaseProgress, 3); // Ease out cubic - FAST!
        
        // LUNGE forward with both arms
        const lungeDistance = 45;
        state.rightArm.targetX = relativeX + lungeDistance * impactEase;
        state.rightArm.targetY = relativeY + 5 * impactEase; // Slight downward bash
        state.leftArm.targetX = relativeX + (lungeDistance - 10) * impactEase;
        state.leftArm.targetY = relativeY;
        
        // GRIPPING at impact
        state.rightArm.isGrabbing = phaseProgress > 0.5;
        state.leftArm.isGrabbing = phaseProgress > 0.5;
        
      } else {
        // SLOW recovery - methodical pull back
        const recoveryEase = Math.pow(phaseProgress, 2);
        
        // Return to rest slowly
        const pullBackX = relativeX + 45;
        const pullBackY = relativeY + 5;
        
        state.rightArm.targetX = pullBackX - pullBackX * recoveryEase;
        state.rightArm.targetY = pullBackY - pullBackY * recoveryEase;
        state.leftArm.targetX = (pullBackX - 10) - (pullBackX - 10) * recoveryEase;
        state.leftArm.targetY = pullBackY - pullBackY * recoveryEase;
        
        state.rightArm.isGrabbing = false;
        state.leftArm.isGrabbing = false;
      }
      
      this.applySpringPhysics(state.rightArm, deltaTime, true);
      this.applySpringPhysics(state.leftArm, deltaTime, true);
      this.applyIK(state.rightArm, 0, 0);
      this.applyIK(state.leftArm, 0, 0);
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
    
    // Head follows the lunge
    if (state.head) {
      if (bashPhase === 'impact') {
        state.head.y = state.headOriginalY + 2 * phaseProgress; // Lunge down
      } else {
        state.head.y = state.headOriginalY;
      }
    }
    
    // Legs brace during bash
    if (state.leftLeg && state.rightLeg) {
      if (bashPhase === 'windup') {
        // Crouch slightly
        state.leftLeg.targetY = state.leftLeg.restY + 5 * phaseProgress;
        state.rightLeg.targetY = state.rightLeg.restY + 5 * phaseProgress;
      } else if (bashPhase === 'impact') {
        // Push off - legs extend
        state.leftLeg.targetY = state.leftLeg.restY - 3 * phaseProgress;
        state.rightLeg.targetY = state.rightLeg.restY - 3 * phaseProgress;
      } else {
        // Return
        state.leftLeg.targetY = state.leftLeg.restY;
        state.rightLeg.targetY = state.rightLeg.restY;
      }
      
      this.applySpringPhysics(state.leftLeg, deltaTime);
      this.applySpringPhysics(state.rightLeg, deltaTime);
      this.applyIK(state.leftLeg, 0, 0);
      this.applyIK(state.rightLeg, 0, 0);
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
    
    if (state.leftLeg) {
      state.leftLeg.targetX = state.leftLeg.restX;
      state.leftLeg.targetY = state.leftLeg.restY;
      this.applySpringPhysics(state.leftLeg, deltaTime);
      this.applyIK(state.leftLeg, 0, 0);
    }
    if (state.rightLeg) {
      state.rightLeg.targetX = state.rightLeg.restX;
      state.rightLeg.targetY = state.rightLeg.restY;
      this.applySpringPhysics(state.rightLeg, deltaTime);
      this.applyIK(state.rightLeg, 0, 0);
    }
    
    // Arms hang DOWN vertically when idle with tiny breathing sway
    if (state.leftArm) {
      state.leftArm.targetX = state.leftArm.restX; // Pinned to side
      state.leftArm.targetY = state.leftArm.restY + breatheOffset * 0.3; // Tiny breathing motion
      state.leftArm.isGrabbing = false; // Release grip
      this.applySpringPhysics(state.leftArm, deltaTime, true); // isArm=true for slow movement
      this.applyIK(state.leftArm, 0, 0);
    }
    if (state.rightArm) {
      state.rightArm.targetX = state.rightArm.restX; // Pinned to side
      state.rightArm.targetY = state.rightArm.restY - breatheOffset * 0.3; // Tiny opposite breathing
      state.rightArm.isGrabbing = false; // Release grip
      this.applySpringPhysics(state.rightArm, deltaTime, true); // isArm=true for slow movement
      this.applyIK(state.rightArm, 0, 0);
    }
    
    if (state.body) {
      state.body.rotation = 0;
      state.body.y = breatheOffset * 0.8; // MORE visible breathing (was 0.5)
      const breatheScale = 1.0 + Math.sin(Date.now() * 0.0012) * 0.04; // 4% scale change
      state.body.setScale(breatheScale);
    }
    if (state.head) {
      state.head.rotation = 0;
    }
    
    // Eye blinking animation (always active)
    this.updateEyeBlinking(state);
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
