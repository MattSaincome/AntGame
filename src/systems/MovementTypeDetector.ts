/**
 * Movement Type Detector for Procedural Monsters
 * Determines movement type based on limb configuration
 */

export enum MovementType {
  // No Legs (0)
  SERPENTINE = 'serpentine',
  SLUG = 'slug',
  ROLL = 'roll',
  BOUNCE = 'bounce',
  LEVITATE = 'levitate',
  ROOT = 'root',
  
  // Mono-pedal (1 leg)
  HOP = 'hop',
  PIVOT = 'pivot',
  VAULT = 'vault',
  
  // Bi-pedal (2 legs)
  WALK = 'walk',
  SPRINT = 'sprint',
  LEAP = 'leap',
  WADDLE = 'waddle',
  STALK = 'stalk',
  
  // Tri-pedal (3 legs)
  TRIPOD = 'tripod',
  HOBBLE = 'hobble',
  CARTWHEEL = 'cartwheel',
  
  // Quadruped (4 legs)
  GALLOP = 'gallop',
  PROWL = 'prowl',
  SCAMPER = 'scamper',
  LUMBER = 'lumber',
  BOUND = 'bound',
  
  // Hexapod (6 legs)
  SCUTTLE = 'scuttle',
  SWARM = 'swarm',
  CLIMB = 'climb',
  
  // Octopod (8+ legs)
  SKITTER = 'skitter',
  FLOW = 'flow',
  RADIAL = 'radial',
  
  // Wing-based
  FLY = 'fly',
  HOVER = 'hover',
  DIVE = 'dive',
  SOAR = 'soar',
  
  // Wing + Leg Combos
  FLUTTER_HOP = 'flutter_hop',
  GLIDE_WALK = 'glide_walk',
  PERCH = 'perch',
  SWOOP_RUN = 'swoop_run',
  
  // Tentacle-based
  TENTACLE_WALK = 'tentacle_walk',
  GRAPPLE = 'grapple',
  CONSTRICT_PULL = 'constrict_pull',
  
  // Tail-propelled
  TAIL_SPRING = 'tail_spring',
  TAIL_WHIP = 'tail_whip',
  TAIL_DRAG = 'tail_drag',
  
  // Body-morphing
  STRETCH = 'stretch',
  COMPRESS = 'compress',
  PHASE = 'phase',
  SPLIT = 'split'
}

export class MovementTypeDetector {
  /**
   * Detect movement type based on monster configuration
   */
  static detectMovementType(config: {
    legCount: number;
    hasWings: boolean;
    hasTentacles: boolean;
    hasTail: boolean;
    hasBody: boolean;
    appearance: any;
  }): MovementType {
    const { legCount, hasWings, hasTentacles, hasTail, hasBody, appearance } = config;
    
    // Special cases first
    if (hasTentacles) {
      const tentacleTypes = [
        MovementType.TENTACLE_WALK,
        MovementType.GRAPPLE,
        MovementType.CONSTRICT_PULL
      ];
      return tentacleTypes[Math.floor(Math.random() * tentacleTypes.length)];
    }
    
    // Wings override most ground movement
    if (hasWings) {
      if (legCount === 0) {
        // Pure flying creatures
        const flyTypes = [MovementType.FLY, MovementType.HOVER, MovementType.DIVE, MovementType.SOAR];
        return flyTypes[Math.floor(Math.random() * flyTypes.length)];
      } else if (legCount <= 2) {
        // Hybrid movement
        const hybridTypes = [
          MovementType.FLUTTER_HOP,
          MovementType.GLIDE_WALK,
          MovementType.PERCH,
          MovementType.SWOOP_RUN
        ];
        return hybridTypes[Math.floor(Math.random() * hybridTypes.length)];
      }
    }
    
    // Tail-based movement (for creatures with prominent tails)
    if (hasTail && legCount <= 2) {
      const tailTypes = [
        MovementType.TAIL_SPRING,
        MovementType.TAIL_WHIP,
        MovementType.TAIL_DRAG
      ];
      if (Math.random() < 0.3) { // 30% chance for tail movement
        return tailTypes[Math.floor(Math.random() * tailTypes.length)];
      }
    }
    
    // Leg-based movement
    switch (legCount) {
      case 0:
        // No legs - various alternative movements
        const noLegTypes = [
          MovementType.SERPENTINE,
          MovementType.SLUG,
          MovementType.ROLL,
          MovementType.BOUNCE,
          MovementType.LEVITATE,
          MovementType.ROOT
        ];
        // Check appearance for hints
        if (appearance?.mutations?.includes('glow')) {
          return MovementType.LEVITATE; // Glowing creatures levitate
        }
        if (appearance?.bodyType?.includes('blob')) {
          return MovementType.BOUNCE; // Blob creatures bounce
        }
        if (appearance?.bodyType?.includes('segmented')) {
          return MovementType.SERPENTINE; // Segmented creatures slither
        }
        return noLegTypes[Math.floor(Math.random() * noLegTypes.length)];
        
      case 1:
        // Mono-pedal
        const monoPedalTypes = [MovementType.HOP, MovementType.PIVOT, MovementType.VAULT];
        return monoPedalTypes[Math.floor(Math.random() * monoPedalTypes.length)];
        
      case 2:
        // Bi-pedal
        const biPedalTypes = [
          MovementType.WALK,
          MovementType.SPRINT,
          MovementType.LEAP,
          MovementType.WADDLE,
          MovementType.STALK
        ];
        // Check for special traits
        if (appearance?.mutations?.includes('armor')) {
          return MovementType.WADDLE; // Armored creatures waddle
        }
        if (appearance?.stats?.speed > 50) {
          return MovementType.SPRINT; // Fast creatures sprint
        }
        if (appearance?.stats?.aggression > 70) {
          return MovementType.STALK; // Aggressive creatures stalk
        }
        return biPedalTypes[Math.floor(Math.random() * biPedalTypes.length)];
        
      case 3:
        // Tri-pedal
        const triPedalTypes = [MovementType.TRIPOD, MovementType.HOBBLE, MovementType.CARTWHEEL];
        return triPedalTypes[Math.floor(Math.random() * triPedalTypes.length)];
        
      case 4:
        // Quadruped
        const quadTypes = [
          MovementType.GALLOP,
          MovementType.PROWL,
          MovementType.SCAMPER,
          MovementType.LUMBER,
          MovementType.BOUND
        ];
        // Check size/weight for movement style
        if (appearance?.scale > 0.5) {
          return MovementType.LUMBER; // Large creatures lumber
        }
        if (appearance?.scale < 0.3) {
          return MovementType.SCAMPER; // Small creatures scamper
        }
        if (appearance?.stats?.speed > 60) {
          return MovementType.GALLOP; // Fast quadrupeds gallop
        }
        return quadTypes[Math.floor(Math.random() * quadTypes.length)];
        
      case 5:
      case 6:
        // Hexapod
        const hexTypes = [MovementType.SCUTTLE, MovementType.SWARM, MovementType.CLIMB];
        return hexTypes[Math.floor(Math.random() * hexTypes.length)];
        
      case 7:
      case 8:
      default:
        // Octopod or more
        const octoTypes = [MovementType.SKITTER, MovementType.FLOW, MovementType.RADIAL];
        if (legCount >= 10) {
          return MovementType.FLOW; // Many legs = centipede-like flow
        }
        return octoTypes[Math.floor(Math.random() * octoTypes.length)];
    }
  }
  
  /**
   * Get movement speed modifier based on movement type
   */
  static getMovementSpeedModifier(type: MovementType): number {
    const speedModifiers: Partial<Record<MovementType, number>> = {
      // Fast movements
      [MovementType.SPRINT]: 1.5,
      [MovementType.GALLOP]: 1.4,
      [MovementType.FLY]: 1.3,
      [MovementType.DIVE]: 1.6,
      [MovementType.SWARM]: 1.3,
      [MovementType.SCAMPER]: 1.2,
      
      // Normal speed
      [MovementType.WALK]: 1.0,
      [MovementType.HOP]: 1.0,
      [MovementType.SCUTTLE]: 1.0,
      [MovementType.PROWL]: 1.0,
      
      // Slow movements
      [MovementType.WADDLE]: 0.7,
      [MovementType.LUMBER]: 0.6,
      [MovementType.SLUG]: 0.5,
      [MovementType.ROOT]: 0.2,
      [MovementType.CONSTRICT_PULL]: 0.8,
      [MovementType.STALK]: 0.8,
      
      // Variable speed
      [MovementType.HOVER]: 0.9,
      [MovementType.LEVITATE]: 0.8,
      [MovementType.BOUNCE]: 1.1,
      [MovementType.SERPENTINE]: 0.9
    };
    
    return speedModifiers[type] || 1.0;
  }
  
  /**
   * Check if movement type can traverse walls
   */
  static canClimbWalls(type: MovementType): boolean {
    const climbingTypes = [
      MovementType.CLIMB,
      MovementType.SKITTER,
      MovementType.TENTACLE_WALK,
      MovementType.GRAPPLE,
      MovementType.PHASE
    ];
    return climbingTypes.includes(type);
  }
  
  /**
   * Check if movement type can fly/hover
   */
  static canFly(type: MovementType): boolean {
    const flyingTypes = [
      MovementType.FLY,
      MovementType.HOVER,
      MovementType.DIVE,
      MovementType.SOAR,
      MovementType.FLUTTER_HOP,
      MovementType.GLIDE_WALK,
      MovementType.PERCH,
      MovementType.SWOOP_RUN,
      MovementType.LEVITATE
    ];
    return flyingTypes.includes(type);
  }
}
