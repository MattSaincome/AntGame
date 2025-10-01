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
  body: Phaser.GameObjects.Sprite | null;
  head: Phaser.GameObjects.Sprite | null;
  stepTimer: number;
  currentStep: 'left' | 'right';
  centerX: number;
  centerY: number;
}

export class RagdollPhysicsSystem {
  private scene: Phaser.Scene;
  private ragdollStates: Map<string, RagdollState> = new Map();
  
  // Physics parameters
  private readonly LIMB_SPRING = 0.15; // How quickly limbs reach targets
  private readonly LIMB_DAMPING = 0.7; // Velocity damping
  private readonly STEP_HEIGHT = 15; // How high feet lift when stepping
  private readonly STEP_DISTANCE = 25; // How far forward feet step
  private readonly STEP_DURATION = 300; // ms per step
  private readonly GRAB_DISTANCE = 40; // Max distance for hand grabbing
  private readonly IK_ITERATIONS = 3; // Iterations for IK solver
  
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
    const leftLeg = container.getByName('leftLeg') as Phaser.GameObjects.Sprite;
    const rightLeg = container.getByName('rightLeg') as Phaser.GameObjects.Sprite;
    const leftArm = container.getByName('leftArm') as Phaser.GameObjects.Sprite;
    const rightArm = container.getByName('rightArm') as Phaser.GameObjects.Sprite;
    const body = container.getByName('body') as Phaser.GameObjects.Sprite;
    const head = container.getByName('head') as Phaser.GameObjects.Sprite;
    
    const state: RagdollState = {
      leftLeg: leftLeg ? this.createLimb(leftLeg, -10, 20) : null,
      rightLeg: rightLeg ? this.createLimb(rightLeg, 10, 20) : null,
      leftArm: leftArm ? this.createLimb(leftArm, -15, 5) : null,
      rightArm: rightArm ? this.createLimb(rightArm, 15, 5) : null,
      body,
      head,
      stepTimer: 0,
      currentStep: 'left',
      centerX,
      centerY
    };
    
    this.ragdollStates.set(monsterId, state);
  }
  
  /**
   * Create a limb with initial physics properties
   */
  private createLimb(sprite: Phaser.GameObjects.Sprite, restX: number, restY: number): Limb {
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
    if (!state) return;
    
    const speed = Math.abs(velocityX);
    const movingRight = velocityX > 0;
    
    if (state.leftLeg && state.rightLeg) {
      // Update step timer
      state.stepTimer += deltaTime * 1000;
      
      if (state.stepTimer >= this.STEP_DURATION) {
        state.stepTimer = 0;
        state.currentStep = state.currentStep === 'left' ? 'right' : 'left';
      }
      
      const stepProgress = state.stepTimer / this.STEP_DURATION;
      
      // Determine which leg is stepping
      const steppingLeg = state.currentStep === 'left' ? state.leftLeg : state.rightLeg;
      const plantedLeg = state.currentStep === 'left' ? state.rightLeg : state.leftLeg;
      
      // Stepping leg - arc motion
      if (steppingLeg) {
        const stepOffset = movingRight ? this.STEP_DISTANCE : -this.STEP_DISTANCE;
        const stepArc = Math.sin(stepProgress * Math.PI) * this.STEP_HEIGHT;
        
        steppingLeg.targetX = state.centerX + (state.currentStep === 'left' ? -10 : 10) + stepOffset * 0.5;
        steppingLeg.targetY = groundY - stepArc;
        steppingLeg.isGrounded = stepProgress > 0.8; // Touch ground at end of step
      }
      
      // Planted leg - stays on ground
      if (plantedLeg) {
        const plantOffset = movingRight ? -this.STEP_DISTANCE * 0.3 : this.STEP_DISTANCE * 0.3;
        plantedLeg.targetX = state.centerX + (state.currentStep === 'left' ? 10 : -10) + plantOffset;
        plantedLeg.targetY = groundY;
        plantedLeg.isGrounded = true;
      }
      
      // Apply spring physics to legs
      this.applySpringPhysics(state.leftLeg, deltaTime);
      this.applySpringPhysics(state.rightLeg, deltaTime);
      
      // Inverse kinematics to position legs
      this.applyIK(state.leftLeg, state.centerX, state.centerY);
      this.applyIK(state.rightLeg, state.centerX, state.centerY);
    }
    
    // Arms swing opposite to legs
    if (state.leftArm && state.rightArm) {
      const armSwing = state.currentStep === 'left' ? 1 : -1;
      state.leftArm.targetX = state.centerX - 15 + armSwing * 10;
      state.leftArm.targetY = state.centerY + 5;
      state.rightArm.targetX = state.centerX + 15 - armSwing * 10;
      state.rightArm.targetY = state.centerY + 5;
      
      this.applySpringPhysics(state.leftArm, deltaTime);
      this.applySpringPhysics(state.rightArm, deltaTime);
      this.applyIK(state.leftArm, state.centerX, state.centerY);
      this.applyIK(state.rightArm, state.centerX, state.centerY);
    }
    
    // Body bob
    if (state.body) {
      const bobOffset = Math.abs(Math.sin(state.stepTimer / this.STEP_DURATION * Math.PI * 2)) * 3;
      state.body.y = -bobOffset;
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
    deltaTime: number
  ): void {
    const state = this.ragdollStates.get(monsterId);
    if (!state) return;
    
    // Hands reach for blocks
    if (state.leftArm && state.rightArm) {
      if (isReaching) {
        // Alternate hand reaching
        const reachingArm = state.currentStep === 'left' ? state.leftArm : state.rightArm;
        const otherArm = state.currentStep === 'left' ? state.rightArm : state.leftArm;
        
        // Reaching hand goes to block
        const relativeX = blockX - state.centerX;
        const relativeY = blockY - state.centerY;
        
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
      
      this.applySpringPhysics(state.leftArm, deltaTime);
      this.applySpringPhysics(state.rightArm, deltaTime);
      this.applyIK(state.leftArm, state.centerX, state.centerY);
      this.applyIK(state.rightArm, state.centerX, state.centerY);
    }
    
    // Legs tuck up when climbing
    if (state.leftLeg && state.rightLeg) {
      state.leftLeg.targetX = state.centerX - 8;
      state.leftLeg.targetY = state.centerY + 10;
      state.rightLeg.targetX = state.centerX + 8;
      state.rightLeg.targetY = state.centerY + 10;
      
      this.applySpringPhysics(state.leftLeg, deltaTime);
      this.applySpringPhysics(state.rightLeg, deltaTime);
      this.applyIK(state.leftLeg, state.centerX, state.centerY);
      this.applyIK(state.rightLeg, state.centerX, state.centerY);
    }
  }
  
  /**
   * Update ragdoll physics for mining
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
    
    // Right arm swings at block
    if (state.rightArm) {
      const relativeX = targetBlockX - state.centerX;
      const relativeY = targetBlockY - state.centerY;
      
      // Swing motion: back -> forward -> back
      const swingAngle = (swingProgress < 0.5 ? swingProgress : 1 - swingProgress) * 2; // 0->1->0
      const swingX = relativeX + Math.sin(swingAngle * Math.PI) * 20;
      const swingY = relativeY - Math.cos(swingAngle * Math.PI) * 15;
      
      state.rightArm.targetX = swingX;
      state.rightArm.targetY = swingY;
      state.rightArm.isGrabbing = swingProgress > 0.4 && swingProgress < 0.6; // "Impact" moment
      
      this.applySpringPhysics(state.rightArm, deltaTime);
      this.applyIK(state.rightArm, state.centerX, state.centerY);
    }
    
    // Left arm braces
    if (state.leftArm) {
      state.leftArm.targetX = state.centerX - 20;
      state.leftArm.targetY = state.centerY;
      this.applySpringPhysics(state.leftArm, deltaTime);
      this.applyIK(state.leftArm, state.centerX, state.centerY);
    }
    
    // Body leans into swing
    if (state.body) {
      const lean = Math.sin(swingProgress * Math.PI) * 0.2;
      state.body.rotation = lean;
    }
  }
  
  /**
   * Apply spring physics to move limb toward target
   */
  private applySpringPhysics(limb: Limb, deltaTime: number): void {
    if (!limb) return;
    
    // Spring force toward target
    const forceX = (limb.targetX - limb.currentX) * this.LIMB_SPRING;
    const forceY = (limb.targetY - limb.currentY) * this.LIMB_SPRING;
    
    // Update velocity
    limb.velocityX += forceX;
    limb.velocityY += forceY;
    
    // Apply damping
    limb.velocityX *= this.LIMB_DAMPING;
    limb.velocityY *= this.LIMB_DAMPING;
    
    // Update position
    limb.currentX += limb.velocityX;
    limb.currentY += limb.velocityY;
  }
  
  /**
   * Apply inverse kinematics to position limb sprite
   * Two-bone IK solver (shoulder/hip -> elbow/knee -> hand/foot)
   */
  private applyIK(limb: Limb, centerX: number, centerY: number): void {
    if (!limb || !limb.sprite) return;
    
    // Calculate angle from center to current position
    const dx = limb.currentX - centerX;
    const dy = limb.currentY - centerY;
    const distance = Math.hypot(dx, dy);
    
    // Clamp distance to limb length
    const maxReach = limb.length * 1.5; // Allow some stretch
    const clampedDist = Math.min(distance, maxReach);
    
    // Calculate rotation angle
    let angle = Math.atan2(dy, dx);
    
    // Position limb sprite
    limb.sprite.x = centerX + (dx / distance) * clampedDist * 0.5; // Midpoint
    limb.sprite.y = centerY + (dy / distance) * clampedDist * 0.5;
    limb.sprite.rotation = angle;
    
    // Visual feedback for grabbing
    if (limb.isGrabbing) {
      limb.sprite.setTint(0xffff00); // Yellow when grabbing
    } else {
      limb.sprite.clearTint();
    }
  }
  
  /**
   * Reset limb to idle position
   */
  public resetToIdle(monsterId: string): void {
    const state = this.ragdollStates.get(monsterId);
    if (!state) return;
    
    if (state.leftLeg) {
      state.leftLeg.targetX = state.leftLeg.restX;
      state.leftLeg.targetY = state.leftLeg.restY;
    }
    if (state.rightLeg) {
      state.rightLeg.targetX = state.rightLeg.restX;
      state.rightLeg.targetY = state.rightLeg.restY;
    }
    if (state.leftArm) {
      state.leftArm.targetX = state.leftArm.restX;
      state.leftArm.targetY = state.leftArm.restY;
    }
    if (state.rightArm) {
      state.rightArm.targetX = state.rightArm.restX;
      state.rightArm.targetY = state.rightArm.restY;
    }
    if (state.body) {
      state.body.rotation = 0;
      state.body.y = 0;
    }
    if (state.head) {
      state.head.rotation = 0;
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
