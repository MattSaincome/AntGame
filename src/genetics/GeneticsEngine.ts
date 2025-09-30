import { MonsterGenetics, MonsterGene, MonsterStats, BreedingResult, MUTATION_RATE, DOMINANT_THRESHOLD, MAX_OFFSPRING, MonsterType, MonsterAppearance, AVAILABLE_PARTS, PROCEDURAL_RANGES, MUTATION_TYPES, MonsterLifeStage, BreedingStatus, MIN_BREEDING_AGE, BREEDING_COOLDOWN, PatternType, ColorScheme } from './GeneticsTypes';

export class GeneticsEngine {
  private static geneIdCounter = 0;

  /**
   * Create random genetics for initial population or enemies
   */
  static createRandomGenetics(type: MonsterType = MonsterType.BASIC, generation: number = 0): MonsterGenetics {
    const genetics: MonsterGenetics = {
      strength: this.createRandomGene(),
      speed: this.createRandomGene(),
      size: this.createRandomGene(),
      mining: this.createRandomGene(),
      attack: this.createRandomGene(),
      defense: this.createRandomGene(),
      aggression: this.createRandomGene(),
      curiosity: this.createRandomGene(),
      social: this.createRandomGene(),
      fertility: this.createRandomGene(),
      metabolism: this.createRandomGene(),
      adaptability: this.createRandomGene(),
      
      // Visual genetics
      headGene: this.createRandomGene(),
      bodyGene: this.createRandomGene(), 
      limbGene: this.createRandomGene(),
      colorGene1: this.createRandomGene(),
      colorGene2: this.createRandomGene(),
      colorGene3: this.createRandomGene(),
      patternGene: this.createRandomGene(),
      patternIntensityGene: this.createRandomGene(),
      mutationGene: this.createRandomGene(),
      
      generation,
      parentIds: [undefined, undefined],
      birthTime: Date.now(),
      uniqueId: `monster_${++this.geneIdCounter}`,
      
      // Age and lifecycle
      age: 0,
      maturityAge: MIN_BREEDING_AGE,
      breedingCooldown: 0,
      isAtHive: false,
      wantsToBreed: false
    };

    // Enemy monsters have different genetic tendencies
    if (type === MonsterType.ENEMY) {
      genetics.aggression.value = Math.max(genetics.aggression.value, 180 + Math.random() * 75); // More aggressive
      genetics.attack.value = Math.max(genetics.attack.value, 150 + Math.random() * 105); // Stronger attack
      genetics.speed.value = Math.max(genetics.speed.value, 120 + Math.random() * 135); // Faster
      genetics.curiosity.value = Math.min(genetics.curiosity.value, 100); // Less curious (focused)
      genetics.social.value = Math.min(genetics.social.value, 80); // Less social
    }

    return genetics;
  }

  /**
   * Create a random gene with normal distribution favoring middle values
   */
  private static createRandomGene(): MonsterGene {
    // Use normal distribution to favor middle values (100-150 range)
    let value = 0;
    for (let i = 0; i < 6; i++) {
      value += Math.random() * 255;
    }
    value = value / 6; // Average of 6 random numbers creates normal distribution

    return {
      value: Math.floor(value),
      dominance: Math.random(),
      mutation: 0.05 + Math.random() * 0.15 // 5-20% mutation chance
    };
  }

  /**
   * Calculate phenotype stats from genetics
   */
  static calculateStats(genetics: MonsterGenetics): MonsterStats {
    const stats: MonsterStats = {
      maxHealth: this.expressGene(genetics.size) * 2 + this.expressGene(genetics.strength) * 0.5 + 50,
      currentHealth: 0, // Will be set below
      attackPower: this.expressGene(genetics.attack) * 0.8 + this.expressGene(genetics.strength) * 0.4,
      defense: this.expressGene(genetics.defense) * 0.6 + this.expressGene(genetics.size) * 0.2,
      miningSpeed: this.expressGene(genetics.mining) * 0.7 + this.expressGene(genetics.strength) * 0.3,
      moveSpeed: this.expressGene(genetics.speed) * 0.8 + (255 - this.expressGene(genetics.size)) * 0.2,
      aggressionLevel: this.expressGene(genetics.aggression),
      breedingRate: this.expressGene(genetics.fertility) / 255 * 0.1,
      energyEfficiency: 0.5 + (this.expressGene(genetics.fertility) / 255) * 0.5, // Using fertility as proxy for energy efficiency
      color: this.calculateColor(genetics),
      size: this.expressGene(genetics.size) / 255 * 2,
      
      // Sprite-based appearance
      appearance: this.calculateAppearance(genetics)
    };
    stats.currentHealth = stats.maxHealth;
    return stats;
  }

  /**
   * Express a gene's value considering dominance
   */
  private static expressGene(gene: MonsterGene): number {
    // Simple expression - just return the value for now
    // Could add dominance calculations here for more complex genetics later
    return Math.max(0, Math.min(255, gene.value));
  }

  /**
   * Calculate color based on genetics
   */
  private static calculateColor(genetics: MonsterGenetics): string {
    const r = Math.floor((genetics.strength.value + genetics.attack.value) / 2);
    const g = Math.floor((genetics.speed.value + genetics.curiosity.value) / 2);
    const b = Math.floor((genetics.defense.value + genetics.social.value) / 2);
    
    // Ensure colors are visible and distinct
    const minColor = 80;
    const adjustedR = Math.max(minColor, Math.min(255, r));
    const adjustedG = Math.max(minColor, Math.min(255, g));
    const adjustedB = Math.max(minColor, Math.min(255, b));
    
    return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
  }

  /**
   * Calculate PROCEDURAL appearance from genetics - Spore-like system
   */
  static calculateAppearance(genetics: MonsterGenetics): MonsterAppearance {
    // Use GENETIC values to determine head type - full range for 91 monsters!
    // Instead of limiting to 0-2, use the full genetic value
    const headType = `head_${genetics.headGene.value}`;
    
    // Use GENETIC values to determine body type - full range for variety!
    const bodyType = `body_${genetics.bodyGene.value}`;
    
    // Use GENETIC values for limb count (2-6)
    const limbCount = 2 + Math.floor((genetics.limbGene.value / 255) * 4);
    
    // Use GENETIC values for scale variations
    const scale = 0.5 + (genetics.size.value / 255) * 1.0;
    
    // Determine color scheme based on genetics
    const colorScheme = this.determineColorScheme(genetics);
    
    // Calculate colors from color genes with COLOR HARMONY
    const { primaryColor, secondaryColor, tertiaryColor, patternColor } = this.generateColorScheme(genetics, colorScheme);
    
    // Determine pattern type from pattern gene
    const patternType = this.determinePatternType(genetics.patternGene);
    
    // Pattern intensity (0-1 opacity)
    const patternIntensity = (genetics.patternIntensityGene.value / 255) * 0.7 + 0.1; // 0.1-0.8 range for subtle to bold
    
    // Determine mutations
    const mutations: string[] = [];
    
    // 1% base chance for mutations, increased by mutationGene
    const mutationChance = MUTATION_RATE + (genetics.mutationGene.value / 255) * 0.1;
    
    // Check for wings mutation - important for movement
    const hasWings = mutations.includes('wings') || Math.random() < mutationChance * 2;
    if (hasWings && !mutations.includes('wings')) {
      mutations.push('wings');
    }
    
    for (const mutationType of MUTATION_TYPES) {
      if (!mutations.includes(mutationType) && Math.random() < mutationChance) {
        mutations.push(mutationType);
      }
    }
    
    return {
      headType,
      bodyType,
      limbCount,
      scale,
      mutations,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      patternColor,
      patternType,
      patternIntensity,
      colorScheme,
      hasWings
      // movementType will be determined when monster is created
    };
  }
  
  /**
   * Determine color scheme type from genetics
   */
  private static determineColorScheme(genetics: MonsterGenetics): ColorScheme {
    const schemes = Object.values(ColorScheme);
    const index = Math.floor((genetics.colorGene1.dominance * genetics.colorGene2.dominance * genetics.colorGene3.dominance) * schemes.length);
    return schemes[Math.min(index, schemes.length - 1)];
  }
  
  /**
   * Generate coordinated color scheme based on type
   */
  private static generateColorScheme(genetics: MonsterGenetics, scheme: ColorScheme): {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
    patternColor: string;
  } {
    const baseHue = (genetics.colorGene1.value / 255) * 360;
    
    switch (scheme) {
      case ColorScheme.MONOCHROME:
        // Single hue with lightness variations
        const baseSat = 60;
        return {
          primaryColor: this.hslToHex(baseHue, baseSat, 50),
          secondaryColor: this.hslToHex(baseHue, baseSat, 35),
          tertiaryColor: this.hslToHex(baseHue, baseSat, 65),
          patternColor: this.hslToHex(baseHue, baseSat, 20)
        };
        
      case ColorScheme.ANALOGOUS:
        // Close colors on wheel (±30°)
        return {
          primaryColor: this.geneToHexColor(genetics.colorGene1),
          secondaryColor: this.geneToHexColor(genetics.colorGene2, baseHue, 'analogous'),
          tertiaryColor: this.hslToHex((baseHue + 60) % 360, 65, 50),
          patternColor: this.hslToHex((baseHue - 30 + 360) % 360, 70, 40)
        };
        
      case ColorScheme.COMPLEMENTARY:
        // Opposite colors
        return {
          primaryColor: this.geneToHexColor(genetics.colorGene1),
          secondaryColor: this.geneToHexColor(genetics.colorGene2, baseHue, 'complementary'),
          tertiaryColor: this.hslToHex((baseHue + 15) % 360, 65, 55),
          patternColor: this.hslToHex((baseHue + 180) % 360, 75, 35)
        };
        
      case ColorScheme.TRIADIC:
        // 120° apart
        return {
          primaryColor: this.geneToHexColor(genetics.colorGene1),
          secondaryColor: this.geneToHexColor(genetics.colorGene2, baseHue, 'triadic'),
          tertiaryColor: this.hslToHex((baseHue + 240) % 360, 65, 50),
          patternColor: this.hslToHex((baseHue + 120) % 360, 70, 40)
        };
        
      case ColorScheme.NATURAL:
        // Earth tones
        const earthHues = [30, 25, 35, 40, 20]; // Browns, tans
        return {
          primaryColor: this.hslToHex(earthHues[Math.floor(genetics.colorGene1.value / 51)], 45, 45),
          secondaryColor: this.hslToHex(earthHues[Math.floor(genetics.colorGene2.value / 51)], 35, 35),
          tertiaryColor: this.hslToHex(earthHues[Math.floor(genetics.colorGene3.value / 51)], 40, 55),
          patternColor: this.hslToHex(30, 50, 25)
        };
        
      case ColorScheme.VIBRANT:
        // High saturation
        return {
          primaryColor: this.hslToHex(baseHue, 95, 55),
          secondaryColor: this.hslToHex((baseHue + 45) % 360, 90, 50),
          tertiaryColor: this.hslToHex((baseHue + 90) % 360, 85, 60),
          patternColor: this.hslToHex((baseHue + 180) % 360, 100, 45)
        };
        
      case ColorScheme.MUTED:
        // Low saturation
        return {
          primaryColor: this.hslToHex(baseHue, 35, 50),
          secondaryColor: this.hslToHex((baseHue + 30) % 360, 30, 45),
          tertiaryColor: this.hslToHex((baseHue + 60) % 360, 25, 55),
          patternColor: this.hslToHex(baseHue, 40, 35)
        };
        
      case ColorScheme.DARK:
        // Dark colors
        return {
          primaryColor: this.hslToHex(baseHue, 60, 25),
          secondaryColor: this.hslToHex((baseHue + 30) % 360, 55, 20),
          tertiaryColor: this.hslToHex((baseHue + 60) % 360, 50, 30),
          patternColor: this.hslToHex(baseHue, 70, 15)
        };
        
      case ColorScheme.LIGHT:
        // Light colors
        return {
          primaryColor: this.hslToHex(baseHue, 60, 75),
          secondaryColor: this.hslToHex((baseHue + 30) % 360, 55, 70),
          tertiaryColor: this.hslToHex((baseHue + 60) % 360, 50, 80),
          patternColor: this.hslToHex(baseHue, 65, 60)
        };
        
      default:
        // Default analogous
        return {
          primaryColor: this.geneToHexColor(genetics.colorGene1),
          secondaryColor: this.geneToHexColor(genetics.colorGene2, baseHue, 'analogous'),
          tertiaryColor: this.geneToHexColor(genetics.colorGene3, baseHue, 'triadic'),
          patternColor: this.hslToHex(baseHue, 70, 35)
        };
    }
  }
  
  /**
   * Determine pattern type from pattern gene
   */
  private static determinePatternType(patternGene: MonsterGene): PatternType {
    const patterns = Object.values(PatternType);
    const index = Math.floor((patternGene.value / 255) * patterns.length);
    return patterns[Math.min(index, patterns.length - 1)];
  }
  
  /**
   * Convert a gene to a hex color with color harmony
   * Uses color theory to create pleasing color schemes
   */
  private static geneToHexColor(gene: MonsterGene, baseHue?: number, harmonyType?: 'analogous' | 'complementary' | 'triadic'): string {
    let hue: number;
    
    if (baseHue !== undefined && harmonyType) {
      // Create harmonious colors based on color theory
      switch (harmonyType) {
        case 'analogous':
          // Colors adjacent on color wheel (±30 degrees)
          hue = (baseHue + ((gene.value / 255) * 60 - 30) + 360) % 360;
          break;
        case 'complementary':
          // Opposite on color wheel (180 degrees)
          hue = (baseHue + 180 + ((gene.value / 255) * 40 - 20) + 360) % 360;
          break;
        case 'triadic':
          // 120 degrees apart on color wheel
          hue = (baseHue + 120 + ((gene.value / 255) * 30 - 15) + 360) % 360;
          break;
        default:
          hue = (gene.value / 255) * 360;
      }
    } else {
      hue = (gene.value / 255) * 360;
    }
    
    // Ensure good saturation and lightness for visibility
    const saturation = 65 + (gene.dominance * 25); // 65-90% (vibrant but not oversaturated)
    const lightness = 45 + (gene.mutation * 25); // 45-70% (visible, not too dark or light)
    
    return this.hslToHex(hue, saturation, lightness);
  }
  
  /**
   * Convert HSL to hex color
   */
  private static hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  /**
   * Breed two monsters to create offspring
   */
  static breed(parent1: MonsterGenetics, parent2: MonsterGenetics): BreedingResult {
    const parent1Stats = this.calculateStats(parent1);
    const parent2Stats = this.calculateStats(parent2);
    
    // Check fertility rates
    const breedingChance = (parent1Stats.breedingRate + parent2Stats.breedingRate) / 510; // 0-1 scale
    
    if (Math.random() > breedingChance) {
      return {
        success: false,
        offspring: [],
        energyCost: 20,
        timeRequired: 10
      };
    }

    // Determine number of offspring (1-3 based on fertility)
    const fertilityAvg = (parent1Stats.breedingRate + parent2Stats.breedingRate) / 2;
    const offspringCount = Math.min(MAX_OFFSPRING, 
      1 + Math.floor((fertilityAvg / 255) * 2) + (Math.random() < 0.3 ? 1 : 0)
    );

    const offspring: MonsterGenetics[] = [];
    const newGeneration = Math.max(parent1.generation, parent2.generation) + 1;

    for (let i = 0; i < offspringCount; i++) {
      const child = this.combineGenetics(parent1, parent2, newGeneration);
      offspring.push(child);
    }

    return {
      success: true,
      offspring,
      energyCost: 30 + offspringCount * 15,
      timeRequired: 20 + offspringCount * 10
    };
  }

  /**
   * Combine genetics from two parents
   */
  private static combineGenetics(parent1: MonsterGenetics, parent2: MonsterGenetics, generation: number): MonsterGenetics {
    const child: MonsterGenetics = {
      strength: this.combineGenes(parent1.strength, parent2.strength),
      speed: this.combineGenes(parent1.speed, parent2.speed),
      size: this.combineGenes(parent1.size, parent2.size),
      mining: this.combineGenes(parent1.mining, parent2.mining),
      attack: this.combineGenes(parent1.attack, parent2.attack),
      defense: this.combineGenes(parent1.defense, parent2.defense),
      aggression: this.combineGenes(parent1.aggression, parent2.aggression),
      curiosity: this.combineGenes(parent1.curiosity, parent2.curiosity),
      social: this.combineGenes(parent1.social, parent2.social),
      fertility: this.combineGenes(parent1.fertility, parent2.fertility),
      metabolism: this.combineGenes(parent1.metabolism, parent2.metabolism),
      adaptability: this.combineGenes(parent1.adaptability, parent2.adaptability),
      
      // Visual genetics
      headGene: this.combineGenes(parent1.headGene, parent2.headGene),
      bodyGene: this.combineGenes(parent1.bodyGene, parent2.bodyGene),
      limbGene: this.combineGenes(parent1.limbGene, parent2.limbGene),
      colorGene1: this.combineGenes(parent1.colorGene1, parent2.colorGene1),
      colorGene2: this.combineGenes(parent1.colorGene2, parent2.colorGene2),
      colorGene3: this.combineGenes(parent1.colorGene3, parent2.colorGene3),
      patternGene: this.combineGenes(parent1.patternGene, parent2.patternGene),
      patternIntensityGene: this.combineGenes(parent1.patternIntensityGene, parent2.patternIntensityGene),
      mutationGene: this.combineGenes(parent1.mutationGene, parent2.mutationGene),
      
      generation,
      parentIds: [parent1.uniqueId, parent2.uniqueId],
      birthTime: Date.now(),
      uniqueId: `monster_${++this.geneIdCounter}`,
      
      // Start as baby
      age: 0,
      maturityAge: MIN_BREEDING_AGE,
      breedingCooldown: 0,
      isAtHive: false,
      wantsToBreed: false
    };

    return child;
  }

  /**
   * Combine two genes with potential mutations
   */
  private static combineGenes(gene1: MonsterGene, gene2: MonsterGene): MonsterGene {
    // Determine which parent's gene is more dominant
    const useGene1 = Math.random() < 0.5;
    const dominantGene = useGene1 ? gene1 : gene2;
    const recessiveGene = useGene1 ? gene2 : gene1;

    let newValue = dominantGene.value;

    // Blend genes based on dominance
    if (dominantGene.dominance < DOMINANT_THRESHOLD) {
      const blendFactor = 0.3;
      newValue = dominantGene.value * (1 - blendFactor) + recessiveGene.value * blendFactor;
    }

    // Apply mutations
    const mutationChance = (gene1.mutation + gene2.mutation) / 2;
    if (Math.random() < mutationChance) {
      const mutationStrength = (Math.random() - 0.5) * 60; // -30 to +30 change
      newValue += mutationStrength;
    }

    // Ensure value stays in valid range
    newValue = Math.max(0, Math.min(255, newValue));

    return {
      value: Math.floor(newValue),
      dominance: (gene1.dominance + gene2.dominance) / 2 + (Math.random() - 0.5) * 0.1,
      mutation: Math.max(0.01, Math.min(0.3, (gene1.mutation + gene2.mutation) / 2 + (Math.random() - 0.5) * 0.05))
    };
  }

  /**
   * Create TRULY RANDOM PROCEDURAL monsters - Spore-like generation
   * Every game starts with completely unique, never-seen-before monsters!
   */
  static createFirstFamily(): MonsterGenetics[] {
    const family: MonsterGenetics[] = [];
    
    // Create 5 COMPLETELY RANDOM monsters - no pre-defined types!
    for (let i = 0; i < 5; i++) {
      const genetics = this.createRandomGenetics(MonsterType.BASIC, 0);
      
      // Randomize ALL visual genes for true procedural generation
      // Ensure each monster gets very different values for variety
      genetics.headGene.value = Math.floor(Math.random() * 255);
      genetics.bodyGene.value = Math.floor(Math.random() * 255);
      genetics.limbGene.value = Math.floor(Math.random() * 255);
      genetics.colorGene1.value = Math.floor(Math.random() * 255);
      genetics.colorGene2.value = Math.floor(Math.random() * 255);
      genetics.colorGene3.value = Math.floor(Math.random() * 255);
      genetics.mutationGene.value = Math.floor(Math.random() * 255);
      genetics.size.value = 50 + Math.floor(Math.random() * 155); // Size 50-205
      
      // Force unique appearance for initial monsters
      genetics.uniqueId = `monster_${i + 1}_${Date.now()}_${Math.random()}`;
      
      // Make initial monsters adults for better visibility
      genetics.age = genetics.maturityAge; // Start as adults!
      
      console.log(`Created UNIQUE PROCEDURAL monster ${genetics.uniqueId}: ALL parts random!`);
      family.push(genetics);
    }
    
    return family;
  }

  /**
   * Update monster age and lifecycle status
   */
  static updateAge(genetics: MonsterGenetics, deltaTime: number): MonsterLifeStage {
    genetics.age += deltaTime;
    genetics.breedingCooldown = Math.max(0, genetics.breedingCooldown - deltaTime);
    
    if (genetics.age < genetics.maturityAge * 0.3) {
      return MonsterLifeStage.BABY;
    } else if (genetics.age < genetics.maturityAge) {
      return MonsterLifeStage.JUVENILE;
    } else {
      return MonsterLifeStage.ADULT;
    }
  }
  
  /**
   * Check if monster is ready for breeding
   */
  static getBreedingStatus(genetics: MonsterGenetics): BreedingStatus {
    if (genetics.age < genetics.maturityAge) {
      return BreedingStatus.NOT_READY;
    }
    
    if (genetics.breedingCooldown > 0) {
      return BreedingStatus.COOLDOWN;
    }
    
    if (genetics.isAtHive && genetics.wantsToBreed) {
      return BreedingStatus.BREEDING;
    }
    
    return BreedingStatus.READY;
  }
  
  /**
   * Set breeding cooldown after successful breeding
   */
  static setBreedingCooldown(genetics: MonsterGenetics): void {
    genetics.breedingCooldown = BREEDING_COOLDOWN;
  }
  
  /**
   * Generate a readable genetics summary for UI display
   */
  static getGeneticsSummary(genetics: MonsterGenetics): any {
    const stats = this.calculateStats(genetics);
    
    return {
      // Basic info
      id: genetics.uniqueId,
      generation: genetics.generation,
      age: Math.floor(genetics.age),
      maturityAge: genetics.maturityAge,
      lifeStage: this.updateAge(genetics, 0),
      breedingStatus: this.getBreedingStatus(genetics),
      
      // Parents
      parents: genetics.parentIds,
      
      // Physical traits
      traits: {
        strength: Math.floor(genetics.strength.value),
        speed: Math.floor(genetics.speed.value),
        size: Math.floor(genetics.size.value),
        mining: Math.floor(genetics.mining.value),
        attack: Math.floor(genetics.attack.value),
        defense: Math.floor(genetics.defense.value)
      },
      
      // Behavioral traits  
      behavior: {
        aggression: Math.floor(genetics.aggression.value),
        curiosity: Math.floor(genetics.curiosity.value),
        social: Math.floor(genetics.social.value),
        fertility: Math.floor(genetics.fertility.value)
      },
      
      // Visual traits
      appearance: stats.appearance,
      
      // Calculated stats
      calculatedStats: {
        maxHealth: Math.floor(stats.maxHealth),
        attackPower: Math.floor(stats.attackPower),
        defense: Math.floor(stats.defense),
        miningSpeed: Math.floor(stats.miningSpeed),
        moveSpeed: Math.floor(stats.moveSpeed),
        breedingRate: Math.floor(stats.breedingRate)
      }
    };
  }
}
