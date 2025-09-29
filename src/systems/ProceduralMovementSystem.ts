import { Scene } from 'phaser';
import { MonsterAppearance } from '../genetics/GeneticsTypes';

export enum MovementType {
  // No legs
  SERPENTINE = 'serpentine',
  SLUG = 'slug',
  ROLL = 'roll',
  BOUNCE = 'bounce',
  ROOT = 'root',
  LEVITATE = 'levitate',
  
  // Mono-pedal
  HOP = 'hop',
  VAULT = 'vault',
  
  // Bi-pedal
  WALK = 'walk',
  LEAP = 'leap',
  WADDLE = 'waddle',
  STALK = 'stalk',
  
  // Tri-pedal
  TRIPOD = 'tripod',
  HOBBLE = 'hobble',
  CARTWHEEL = 'cartwheel',
  
  // Quadruped
  GALLOP = 'gallop',
  PROWL = 'prowl',
  SCAMPER = 'scamper',
  LUMBER = 'lumber',
  BOUND = 'bound',
  
  // Hexapod
  SCUTTLE = 'scuttle',
  SWARM = 'swarm',
  
  // Octopod
  SKITTER = 'skitter',
  FLOW = 'flow',
  RADIAL = 'radial',
  
  // Wing-based
  FLY = 'fly',
  FLUTTER_HOP = 'flutter-hop',
  GLIDE_WALK = 'glide-walk',
  PERCH = 'perch',
  
  // Special
  TENTACLE_WALK = 'tentacle-walk',
  CONSTRICT_PULL = 'constrict-pull',
  TAIL_SPRING = 'tail-spring',
  TAIL_DRAG = 'tail-drag',
  STRETCH = 'stretch',
  COMPRESS = 'compress',
  PHASE = 'phase',
  TELEPORT = 'teleport',
  BURROW = 'burrow'
}

export interface MovementStyle {
  type: MovementType;
  baseSpeed: number;
  jumpHeight: number;
  animationSpeed: number;
  energyEfficiency: number;
  terrainBonus: { [key: string]: number };
}

export interface MovementAnimation {
  bodyBob?: { amplitude: number; frequency: number };
  legCycle?: { speed: number; phaseOffset: number };
  wingFlap?: { speed: number; amplitude: number };
  rotation?: { speed: number; amplitude: number };
  stretch?: { x: number; y: number };
  special?: any;
}

export interface AnimationState {
  time: number;
  legPhase: number;
  wingPhase: number;
}

export class ProceduralMovementSystem {
  private scene: Scene;
  private movementStyles: Map<MovementType, MovementStyle> = new Map();
  private activeAnimations: Map<string, any> = new Map();
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeMovementStyles();
  }
  
  private initializeMovementStyles(): void {
    // No legs movements
    this.movementStyles.set(MovementType.SERPENTINE, {
      type: MovementType.SERPENTINE,
      baseSpeed: 100,
      jumpHeight: 0,
      animationSpeed: 2.0,
      energyEfficiency: 0.8,
      terrainBonus: { smooth: 1.2, rough: 0.6 }
    });
    
    this.movementStyles.set(MovementType.SLUG, {
      type: MovementType.SLUG,
      baseSpeed: 40,
      jumpHeight: 0,
      animationSpeed: 0.5,
      energyEfficiency: 0.9,
      terrainBonus: { wet: 1.5, dry: 0.7 }
    });
    
    this.movementStyles.set(MovementType.BOUNCE, {
      type: MovementType.BOUNCE,
      baseSpeed: 80,
      jumpHeight: 300,
      animationSpeed: 1.5,
      energyEfficiency: 0.7,
      terrainBonus: { soft: 1.3, hard: 0.8 }
    });
    
    this.movementStyles.set(MovementType.ROOT, {
      type: MovementType.ROOT,
      baseSpeed: 0,
      jumpHeight: 0,
      animationSpeed: 0.2,
      energyEfficiency: 1.0,
      terrainBonus: { soil: 2.0, rock: 0.1 }
    });
    
    // Mono-pedal movements
    this.movementStyles.set(MovementType.HOP, {
      type: MovementType.HOP,
      baseSpeed: 70,
      jumpHeight: 400,
      animationSpeed: 1.8,
      energyEfficiency: 0.6,
      terrainBonus: { flat: 1.2, steep: 0.5 }
    });
    
    // Bi-pedal movements
    this.movementStyles.set(MovementType.WALK, {
      type: MovementType.WALK,
      baseSpeed: 90,
      jumpHeight: 350,
      animationSpeed: 1.0,
      energyEfficiency: 0.8,
      terrainBonus: { all: 1.0 }
    });
    
    this.movementStyles.set(MovementType.LEAP, {
      type: MovementType.LEAP,
      baseSpeed: 60,
      jumpHeight: 500,
      animationSpeed: 2.0,
      energyEfficiency: 0.5,
      terrainBonus: { open: 1.4, confined: 0.6 }
    });
    
    this.movementStyles.set(MovementType.WADDLE, {
      type: MovementType.WADDLE,
      baseSpeed: 50,
      jumpHeight: 200,
      animationSpeed: 0.8,
      energyEfficiency: 0.7,
      terrainBonus: { ice: 1.3, sand: 0.7 }
    });
    
    // Quadruped movements
    this.movementStyles.set(MovementType.GALLOP, {
      type: MovementType.GALLOP,
      baseSpeed: 150,
      jumpHeight: 350,
      animationSpeed: 1.5,
      energyEfficiency: 0.6,
      terrainBonus: { open: 1.5, rough: 0.7 }
    });
    
    this.movementStyles.set(MovementType.PROWL, {
      type: MovementType.PROWL,
      baseSpeed: 80,
      jumpHeight: 400,
      animationSpeed: 0.7,
      energyEfficiency: 0.85,
      terrainBonus: { stealth: 1.3, exposed: 0.9 }
    });
    
    this.movementStyles.set(MovementType.SCAMPER, {
      type: MovementType.SCAMPER,
      baseSpeed: 120,
      jumpHeight: 300,
      animationSpeed: 2.5,
      energyEfficiency: 0.7,
      terrainBonus: { cluttered: 1.2, open: 0.9 }
    });
    
    this.movementStyles.set(MovementType.LUMBER, {
      type: MovementType.LUMBER,
      baseSpeed: 40,
      jumpHeight: 150,
      animationSpeed: 0.5,
      energyEfficiency: 0.95,
      terrainBonus: { all: 1.0 }
    });
    
    // Hexapod movements
    this.movementStyles.set(MovementType.SCUTTLE, {
      type: MovementType.SCUTTLE,
      baseSpeed: 100,
      jumpHeight: 200,
      animationSpeed: 3.0,
      energyEfficiency: 0.75,
      terrainBonus: { walls: 1.5, ceiling: 1.2 }
    });
    
    // Octopod movements
    this.movementStyles.set(MovementType.SKITTER, {
      type: MovementType.SKITTER,
      baseSpeed: 110,
      jumpHeight: 250,
      animationSpeed: 4.0,
      energyEfficiency: 0.7,
      terrainBonus: { complex: 1.4, simple: 0.8 }
    });
    
    // Flying movements
    this.movementStyles.set(MovementType.FLY, {
      type: MovementType.FLY,
      baseSpeed: 180,
      jumpHeight: 0, // Uses vertical velocity instead
      animationSpeed: 2.0,
      energyEfficiency: 0.4,
      terrainBonus: { air: 2.0, ground: 0.3 }
    });
    
    this.movementStyles.set(MovementType.FLUTTER_HOP, {
      type: MovementType.FLUTTER_HOP,
      baseSpeed: 100,
      jumpHeight: 450,
      animationSpeed: 1.5,
      energyEfficiency: 0.6,
      terrainBonus: { mixed: 1.3, pure: 0.9 }
    });
  }
  
  /**
   * Determine movement type based on creature anatomy
   */
  determineMovementType(
    limbCount: number, 
    hasWings: boolean, 
    bodyType: string,
    mutations: string[]
  ): MovementType {
    // Special overrides first
    if (mutations.includes('ethereal')) return MovementType.PHASE;
    if (mutations.includes('teleporter')) return MovementType.TELEPORT;
    if (mutations.includes('burrower')) return MovementType.BURROW;
    
    // Wing modifications
    if (hasWings) {
      if (limbCount === 0) return MovementType.FLY;
      if (limbCount <= 2) return MovementType.FLUTTER_HOP;
      return MovementType.GLIDE_WALK;
    }
    
    // Primary movement based on legs
    if (limbCount === 0) {
      if (bodyType.includes('snake')) return MovementType.SERPENTINE;
      if (bodyType.includes('blob')) return MovementType.BOUNCE;
      if (bodyType.includes('ghost')) return MovementType.LEVITATE;
      if (mutations.includes('tentacles')) return MovementType.TENTACLE_WALK;
      if (bodyType.includes('plant')) return MovementType.ROOT;
      return MovementType.SLUG;
    }
    
    if (limbCount === 1) {
      if (mutations.includes('spring')) return MovementType.VAULT;
      return MovementType.HOP;
    }
    
    if (limbCount === 2) {
      if (bodyType.includes('heavy')) return MovementType.WADDLE;
      if (bodyType.includes('predator')) return MovementType.STALK;
      if (mutations.includes('powerful_legs')) return MovementType.LEAP;
      return MovementType.WALK;
    }
    
    if (limbCount === 3) {
      return Math.random() < 0.3 ? MovementType.CARTWHEEL : MovementType.TRIPOD;
    }
    
    if (limbCount === 4) {
      if (bodyType.includes('feline')) return MovementType.PROWL;
      if (bodyType.includes('heavy')) return MovementType.LUMBER;
      if (bodyType.includes('small')) return MovementType.SCAMPER;
      if (mutations.includes('hopper')) return MovementType.BOUND;
      return MovementType.GALLOP;
    }
    
    if (limbCount === 6) {
      return Math.random() < 0.7 ? MovementType.SCUTTLE : MovementType.SWARM;
    }
    
    if (limbCount === 8) {
      return MovementType.SKITTER;
    }
    
    if (limbCount > 8) {
      return Math.random() < 0.5 ? MovementType.FLOW : MovementType.RADIAL;
    }
    
    // Default fallback
    return MovementType.WALK;
  }
  
  /**
   * Apply movement animation to sprite container
   */
  applyMovementAnimation(
    container: Phaser.GameObjects.Container,
    movementType: MovementType,
    velocity: { x: number, y: number },
    deltaTime: number
  ): void {
    const monsterId = container.name;
    const style = this.movementStyles.get(movementType);
    if (!style) return;
    
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const isMoving = speed > 10;
    
    if (!isMoving) {
      this.applyIdleAnimation(container, movementType, deltaTime);
      return;
    }
    
    // Get or create animation state
    let animState = this.activeAnimations.get(monsterId);
    if (!animState) {
      animState = { time: 0, legPhase: 0, wingPhase: 0 };
      this.activeAnimations.set(monsterId, animState);
    }
    
    animState.time += deltaTime * style.animationSpeed;
    
    // Apply movement-specific animations
    switch (movementType) {
      case MovementType.SERPENTINE:
        this.animateSerpentine(container, animState.time);
        break;
      case MovementType.BOUNCE:
        this.animateBounce(container, animState.time);
        break;
      case MovementType.HOP:
      case MovementType.VAULT:
        this.animateHop(container, animState.time);
        break;
      case MovementType.WALK:
      case MovementType.STALK:
        this.animateWalk(container, animState.time);
        break;
      case MovementType.WADDLE:
        this.animateWaddle(container, animState.time);
        break;
      case MovementType.GALLOP:
      case MovementType.BOUND:
        this.animateGallop(container, animState.time);
        break;
      case MovementType.SCUTTLE:
      case MovementType.SKITTER:
        this.animateMultiLeg(container, animState.time, limbCount(container));
        break;
      case MovementType.FLY:
      case MovementType.FLUTTER_HOP:
        this.animateFly(container, animState.time);
        break;
      default:
        this.animateDefault(container, animState.time);
    }
  }
  
  /**
   * Apply idle animation when monster is not moving
   */
  private applyIdleAnimation(
    container: Phaser.GameObjects.Container,
    movementType: MovementType,
    deltaTime: number
  ): void {
    const monsterId = container.name;
    
    // Get or create animation state
    let animState = this.activeAnimations.get(monsterId);
    if (!animState) {
      animState = { time: 0, legPhase: 0, wingPhase: 0 };
      this.activeAnimations.set(monsterId, animState);
    }
    
    animState.time += deltaTime * 0.5; // Slower animation when idle
    
    this.animateIdle(container, animState);
  }
  
  private animateIdle(container: Phaser.GameObjects.Container, animState: AnimationState): void {
    // Reset any rotation
    container.rotation = 0;
    
    // Store base scale if not stored
    const baseScale = container.getData('baseScale') || 1;
    
    // Gentle breathing/bobbing with proper base scale
    const breathAmount = Math.sin(animState.time * 2) * 0.02;
    container.setScale(
      baseScale * (1 + breathAmount), 
      baseScale * (1 - breathAmount * 0.5)
    );
    
    // Wing flutter if has wings
    const wings = container.list.filter(child => 
      child.name === 'leftWing' || child.name === 'rightWing'
    );
    wings.forEach((wing: any, i) => {
      wing.rotation = Math.sin(animState.time * 3 + i * Math.PI) * 0.05;
    });
  }
  
  private animateSerpentine(container: Phaser.GameObjects.Container, time: number): void {
    // Snake-like undulation
    const segments = container.list.filter(child => child.name?.includes('segment'));
    segments.forEach((segment: any, i) => {
      segment.x = Math.sin(time * 3 + i * 0.5) * 10;
      segment.rotation = Math.sin(time * 3 + i * 0.5) * 0.1;
    });
    
    // Body wave
    container.rotation = Math.sin(time * 2) * 0.05;
  }
  
  private animateBounce(container: Phaser.GameObjects.Container, time: number): void {
    // Store base scale if not stored
    const baseScale = container.getData('baseScale') || 1;
    
    // Bouncy slime movement
    const bounce = Math.abs(Math.sin(time * 4));
    
    // Squash on landing with limits to prevent giant monsters
    if (bounce < 0.1) {
      container.setScale(
        Math.min(baseScale * 1.3, baseScale * 1.5),  // Cap max width 
        Math.max(baseScale * 0.7, baseScale * 0.5)   // Cap min height
      );
    } else {
      container.setScale(
        Math.min(baseScale * (1 + bounce * 0.2), baseScale * 1.5),
        Math.max(baseScale * (1 - bounce * 0.3), baseScale * 0.5)
      );
    }
  }
  
  private animateHop(container: Phaser.GameObjects.Container, time: number): void {
    // Single leg hopping
    const hop = Math.abs(Math.sin(time * 3));
    const leg = container.list.find(child => child.name === 'leg');
    
    if (leg) {
      (leg as any).scaleY = 0.7 + hop * 0.3;
      (leg as any).y = 10 - hop * 5;
    }
    
    // Body lean
    container.rotation = Math.sin(time * 3) * 0.1;
  }
  
  private animateWalk(container: Phaser.GameObjects.Container, time: number): void {
    // Bipedal walking
    const leftLeg = container.list.find(child => child.name === 'leftLeg');
    const rightLeg = container.list.find(child => child.name === 'rightLeg');
    
    if (leftLeg && rightLeg) {
      const phase1 = Math.sin(time * 4);
      const phase2 = Math.sin(time * 4 + Math.PI);
      
      (leftLeg as any).rotation = phase1 * 0.3;
      (rightLeg as any).rotation = phase2 * 0.3;
      
      // Hip sway
      container.rotation = Math.sin(time * 2) * 0.02;
    }
    
    // Arm swing
    const leftArm = container.list.find(child => child.name === 'leftArm');
    const rightArm = container.list.find(child => child.name === 'rightArm');
    
    if (leftArm && rightArm) {
      (leftArm as any).rotation = Math.sin(time * 4 + Math.PI) * 0.2;
      (rightArm as any).rotation = Math.sin(time * 4) * 0.2;
    }
  }
  
  private animateWaddle(container: Phaser.GameObjects.Container, time: number): void {
    // Penguin-style waddle
    container.rotation = Math.sin(time * 3) * 0.15;
    
    const leftLeg = container.list.find(child => child.name === 'leftLeg');
    const rightLeg = container.list.find(child => child.name === 'rightLeg');
    
    if (leftLeg && rightLeg) {
      const waddle = Math.sin(time * 3);
      (leftLeg as any).x = -10 + waddle * 3;
      (rightLeg as any).x = 10 - waddle * 3;
    }
  }
  
  private animateGallop(container: Phaser.GameObjects.Container, time: number): void {
    // Four-legged gallop
    const legs = container.list.filter(child => child.name?.includes('leg'));
    const gallop = Math.abs(Math.sin(time * 5));
    
    legs.forEach((leg: any, i) => {
      const phase = (i % 2) === 0 ? gallop : 1 - gallop;
      leg.scaleY = 0.8 + phase * 0.2;
      leg.rotation = (phase - 0.5) * 0.4;
    });
    
    // Body bob
    container.y -= gallop * 5;
    container.rotation = Math.sin(time * 2.5) * 0.03;
  }
  
  private animateMultiLeg(container: Phaser.GameObjects.Container, time: number, legCount: number): void {
    // Insect/spider multi-leg movement
    const legs = container.list.filter(child => child.name?.includes('leg'));
    
    legs.forEach((leg: any, i) => {
      const phase = time * 6 + (i / legCount) * Math.PI * 2;
      const wave = Math.sin(phase);
      
      leg.rotation = wave * 0.3;
      leg.y = Math.abs(wave) * 3;
    });
    
    // Body sway
    container.rotation = Math.sin(time * 3) * 0.01;
  }
  
  private animateFly(container: Phaser.GameObjects.Container, time: number): void {
    // Wing flapping
    const leftWing = container.list.find(child => child.name === 'leftWing');
    const rightWing = container.list.find(child => child.name === 'rightWing');
    
    if (leftWing && rightWing) {
      const flap = Math.sin(time * 8);
      (leftWing as any).rotation = -0.3 + flap * 0.5;
      (rightWing as any).rotation = 0.3 - flap * 0.5;
    }
    
    // Body tilt
    container.rotation = Math.sin(time * 2) * 0.05;
  }
  
  private animateDefault(container: Phaser.GameObjects.Container, time: number): void {
    // Simple bobbing for unknown movement types
    container.y -= Math.abs(Math.sin(time * 3)) * 2;
    container.rotation = Math.sin(time * 2) * 0.02;
  }
  
  /**
   * Get movement modifiers for physics
   */
  getMovementModifiers(movementType: MovementType): {
    speedMultiplier: number;
    jumpMultiplier: number;
    energyMultiplier: number;
  } {
    const style = this.movementStyles.get(movementType);
    if (!style) {
      return { speedMultiplier: 1, jumpMultiplier: 1, energyMultiplier: 1 };
    }
    
    return {
      speedMultiplier: style.baseSpeed / 100, // Normalize to 1.0 = default
      jumpMultiplier: style.jumpHeight / 350,  // Normalize to standard jump
      energyMultiplier: style.energyEfficiency
    };
  }
  
  /**
   * Special movement abilities
   */
  canClimbWalls(movementType: MovementType): boolean {
    return [
      MovementType.SCUTTLE,
      MovementType.SKITTER,
      MovementType.TENTACLE_WALK,
      MovementType.FLOW
    ].includes(movementType);
  }
  
  canFly(movementType: MovementType): boolean {
    return [
      MovementType.FLY,
      MovementType.FLUTTER_HOP,
      MovementType.GLIDE_WALK,
      MovementType.LEVITATE,
      MovementType.PHASE
    ].includes(movementType);
  }
  
  canBurrow(movementType: MovementType): boolean {
    return [
      MovementType.BURROW,
      MovementType.SERPENTINE,
      MovementType.TENTACLE_WALK
    ].includes(movementType);
  }
  
  cleanup(): void {
    this.activeAnimations.clear();
  }
}

// Helper function to count limbs in container
function limbCount(container: Phaser.GameObjects.Container): number {
  return container.list.filter(child => 
    child.name?.includes('leg') || child.name?.includes('Leg')
  ).length;
}
