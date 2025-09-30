/**
 * Simplified genetics system for the monster hive miner
 * Focus on core stats that affect gameplay directly
 */

export interface MonsterGene {
  value: number;      // 0-255 raw genetic value
  dominance: number;  // 0-1, how strongly this gene expresses
  mutation: number;   // 0-1, chance of mutation when breeding
}

export interface MonsterGenetics {
  // Physical Stats
  strength: MonsterGene;    // Affects attack damage and carrying capacity
  speed: MonsterGene;       // Movement speed and attack speed
  size: MonsterGene;        // Health pool and presence in combat
  
  // Skills
  mining: MonsterGene;      // How fast they dig through rock
  attack: MonsterGene;      // Combat effectiveness 
  defense: MonsterGene;     // Damage resistance
  
  // Behavioral
  aggression: MonsterGene;  // How likely to engage in combat
  curiosity: MonsterGene;   // Exploration and mining initiative
  social: MonsterGene;      // Group coordination and breeding
  
  // Biological
  fertility: MonsterGene;   // Breeding success rate and offspring count
  metabolism: MonsterGene;  // Energy efficiency and lifespan
  adaptability: MonsterGene; // Environmental resistance
  
  // Visual Genetics (sprite-based)
  headGene: MonsterGene;       // Determines head shape type
  bodyGene: MonsterGene;       // Determines body shape type
  limbGene: MonsterGene;       // Determines number of limbs
  colorGene1: MonsterGene;     // Primary color genetics
  colorGene2: MonsterGene;     // Secondary color genetics
  colorGene3: MonsterGene;     // Pattern/accent color genetics
  mutationGene: MonsterGene;   // Chance for special mutations
  
  // Lineage tracking
  generation: number;
  parentIds: [string?, string?];
  birthTime: number;
  uniqueId: string;
  
  // Age and lifecycle
  age: number;              // Age in seconds
  maturityAge: number;      // Age when monster becomes adult (60 seconds)
  breedingCooldown: number; // Time until can breed again
  isAtHive: boolean;        // Whether monster is at hive for breeding
  wantsToBreed: boolean;    // Whether player has set to breed
}

export interface MonsterStats {
  // Calculated phenotype stats from genetics
  maxHealth: number;
  currentHealth: number;
  attackPower: number;
  defense: number;
  miningSpeed: number;
  moveSpeed: number;
  aggressionLevel: number;
  breedingRate: number;
  energyEfficiency: number;
  
  // Visual properties
  color: string;
  size: number;
  
  // Sprite-based visual genetics
  appearance: MonsterAppearance;
}

import { MovementType } from '../systems/ProceduralMovementSystem';

export interface MonsterAppearance {
  headType: string;
  bodyType: string;
  limbCount: number;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  patternColor?: string; // Optional pattern overlay color
  scale: number;
  mutations: string[];
  movementType?: MovementType; // Procedural movement style
  hasWings?: boolean; // For wing-based movement
}

export enum MonsterType {
  BASIC = 'basic',
  ENEMY = 'enemy'
}

export interface BreedingResult {
  success: boolean;
  offspring: MonsterGenetics[];
  energyCost: number;
  timeRequired: number;
}

// Genetic combinations and mutations
export const MUTATION_RATE = 0.01; // 1% chance as requested
export const DOMINANT_THRESHOLD = 0.6;
export const MAX_OFFSPRING = 3;
export const MIN_BREEDING_AGE = 60; // 1 minute to mature
export const BREEDING_COOLDOWN = 60; // 1 minute between breeding
export const AUTOMATIC_BREEDING_INTERVAL = 60000; // 1 minute for automatic breeding

// ALL available monster parts for procedural generation - Spore-like system
export const AVAILABLE_PARTS = {
  heads: ['monster_04', 'monster_05', 'monster_06'],
  bodies: ['monster_04', 'monster_05', 'monster_06'],
  faces: ['Face 01', 'Face 02', 'Face 03'],
  leftHands: ['Left Hand'],
  rightHands: ['Right Hand'],
  leftLegs: ['Left Leg'],
  rightLegs: ['Right Leg'],
  leftArms: ['Left Upper Arm'],
  rightArms: ['Right Upper Arm'],
  weapons: ['Weapon'],
  effects: ['Smoke 00', 'Smoke 01', 'Smoke 02', 'Smoke 03', 'Smoke 04']
};

// Procedural generation ranges - for random monster creation
export const PROCEDURAL_RANGES = {
  headScale: { min: 0.8, max: 1.3 },
  bodyScale: { min: 0.9, max: 1.4 },
  limbScale: { min: 0.7, max: 1.2 },
  limbCount: { min: 2, max: 6 },
  colorHue: { min: 0, max: 360 },
  colorSaturation: { min: 20, max: 80 },
  colorLightness: { min: 30, max: 70 }
};

// No species! Just random combinations
export const MUTATION_TYPES = ['extra_limbs', 'giant_head', 'tiny_body', 'color_shift', 'double_face', 'weapon_arm'];

export enum MonsterLifeStage {
  BABY = 'baby',
  JUVENILE = 'juvenile', 
  ADULT = 'adult'
}

export enum BreedingStatus {
  NOT_READY = 'not_ready',
  READY = 'ready',
  BREEDING = 'breeding',
  COOLDOWN = 'cooldown'
}
