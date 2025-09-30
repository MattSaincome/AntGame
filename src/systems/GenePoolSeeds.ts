/**
 * Gene Pool Seed System
 * 
 * Pre-defined collections of verified monster parts that actually exist.
 * Each seed contains ~5% of total parts for variety without overwhelming the system.
 * Seeds are randomly selected at game start for different experiences.
 */

export interface GenePoolSeed {
  id: string;
  name: string;
  description: string;
  monsterSets: string[];
}

import { ALL_AVAILABLE_MONSTERS } from './AllAvailableMonsters';

// Now ALL monsters have a chance to appear!
export const GENE_POOL_SEEDS: GenePoolSeed[] = [
  {
    id: 'complete',
    name: 'Complete Collection',
    description: 'ALL monster types available',
    monsterSets: ALL_AVAILABLE_MONSTERS
  },
  {
    id: 'classic',
    name: 'Classic & Enemy',
    description: 'Classic and enemy monster types',
    monsterSets: [
      'monster04', 'monster05', 'monster06', 'flying01',
      'enemy_monster1', 'enemy_monster2', 'enemy_monster3', 'enemy_monster4', 'enemy_monster5'
    ]
  },
  {
    id: 'generations',
    name: 'All Generations',
    description: 'V1 through V11 monsters',
    monsterSets: [
      'v1_monster1', 'v1_monster2', 'v1_monster3', 'v1_monster4', 'v1_monster5',
      'v2_monster1', 'v2_monster2', 'v2_monster3', 'v2_monster4', 'v2_monster5',
      'v3_monster1', 'v3_monster2', 'v3_monster3', 'v3_monster4', 'v3_monster5',
      'v4_monster1', 'v4_monster2', 'v4_monster3', 'v4_monster4', 'v4_monster5',
      'v5_monster1', 'v5_monster2', 'v5_monster3',
      'v6_monster1', 'v6_monster2', 'v6_monster3', 'v6_monster4', 'v6_monster5',
      'v7_monster1', 'v7_monster2',
      'v8_monster1', 'v8_monster2', 'v8_monster3', 'v8_monster4', 'v8_monster5',
      'v9_monster1', 'v9_monster2', 'v9_monster3', 'v9_monster4', 'v9_monster5',
      'v10_monster1', 'v10_monster2', 'v10_monster3', 'v10_monster4', 'v10_monster5',
      'v11_monster1', 'v11_monster2', 'v11_monster3', 'v11_monster4', 'v11_monster5'
    ]
  },
  {
    id: 'special',
    name: 'Special Characters',
    description: 'Unique and special monsters',
    monsterSets: [
      'anubis', 'pumpkin_head', 'skeleton_crusader1', 'skeleton_crusader2', 'skeleton_crusader3', 'skull_knight',
      'morev1_m1', 'morev1_m2', 'morev1_m3', 'morev1_m4', 'morev1_m5',
      'morev2_m1', 'morev2_m2', 'morev2_m3', 'morev2_m4', 'morev2_m5',
      'morev3_m1', 'morev3_m2', 'morev3_m3', 'morev3_m4', 'morev3_m5'
    ]
  }
];

// Import comprehensive parts list
import { COMPREHENSIVE_VERIFIED_PARTS } from './ComprehensiveMonsterParts';

// Use the comprehensive list that includes EVERY PNG file found
export const VERIFIED_PARTS: Record<string, string[]> = COMPREHENSIVE_VERIFIED_PARTS;

// Old restrictive list (keeping for reference, but not using)
const OLD_VERIFIED_PARTS: Record<string, string[]> = {
  // Original monsters - with spaces in names!
  'monster04': ['Head', 'Face 01', 'Face 02', 'Left Hand', 'Right Hand', 'Left Leg', 'Right Leg'],
  'monster05': ['Head', 'Body', 'Face 01', 'Face 02', 'Face 03', 'Left Hand', 'Right Hand', 'Left Leg', 'Right Leg', 'Left Upper Arm', 'Right Upper Arm', 'Weapon'],
  'monster06': ['Head', 'Body', 'Face 01', 'Face 02', 'Face 03', 'Left Hand', 'Right Hand', 'Left Leg', 'Right Leg', 'Left Upper Arm', 'Right Upper Arm', 'Weapon'],
  'flying01': ['Head', 'Face 01', 'Face 02', 'Left Wing', 'Right Wing'],
  
  // v1 monsters - only have body and legs (checked filesystem)
  'v1_monster1': ['Body', 'Leg_F', 'Leg_B'],
  'v1_monster2': ['Body', 'Leg_F', 'Leg_B'],
  'v1_monster3': ['Body'],  // v1_monster3 only has Body.png
  'v1_monster4': ['Body', 'Leg_F', 'Leg_B', 'Mouth', 'Tongue'],  // This one has mouth/tongue
  'v1_monster5': ['Body', 'Leg_F', 'Leg_B'],
  
  'v2_monster1': ['Body', 'Leg_F', 'Leg_B', 'Hand_F', 'Hand_B', 'eye', 'Mouth'],
  'v2_monster2': ['Body', 'Leg_F', 'Leg_B', 'Hand_F', 'Hand_B', 'eye', 'Mouth'],
  'v2_monster3': ['Body', 'Leg_F', 'Leg_B', 'Hand_F', 'Hand_B', 'eye', 'Mouth'],
  'v2_monster4': ['Body', 'Leg_F', 'Leg_B', 'Hand_F', 'Hand_B', 'eye', 'Mouth'],
  'v2_monster5': ['Body', 'Leg_F', 'Leg_B', 'Hand_F', 'Hand_B', 'eye', 'Mouth'],
  
  // v8 monsters - different structure
  'v8_monster1': ['Head', 'Mouth', 'HandB', 'HandF', 'Box'],
  'v8_monster2': ['Body'],
  'v8_monster4': ['Body'],
  'v8_monster5': ['Body'],
  
  // v9 monsters
  'v9_monster1': ['Box', 'Eye1', 'Eye2', 'Mouth'],
  'v9_monster2': ['Body'],
  'v9_monster3': ['Body'],
  'v9_monster4': ['Body'],
  'v9_monster5': ['Body'],
  
  // enemy monsters
  'enemy_monster1': ['Body'],
  'enemy_monster2': ['Body'],
  'enemy_monster3': ['Body'],
  'enemy_monster4': ['Body'],
  'enemy_monster5': ['Body'],
  
  // For other monsters, only try Body as it's most common
  default: ['Body']
};

// Get verified parts for a monster type
export function getVerifiedParts(monsterType: string): string[] {
  return VERIFIED_PARTS[monsterType] || VERIFIED_PARTS.default;
}
