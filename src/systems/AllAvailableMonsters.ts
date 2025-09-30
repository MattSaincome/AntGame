// Import actual monster types from scanned data
import { ACTUAL_MONSTER_PARTS } from './ActualMonsterParts';

/**
 * Complete list of ALL available monster types in the game
 * Automatically populated from actual scanned directories!
 */
export const ALL_AVAILABLE_MONSTERS = Object.keys(ACTUAL_MONSTER_PARTS);

// Old manual list (for reference)
const OLD_MANUAL_LIST = [
  // Classic monsters
  'monster04',
  'monster05', 
  'monster06',
  'flying01',
  
  // Enemy monsters
  'enemy_monster1',
  'enemy_monster2',
  'enemy_monster3',
  'enemy_monster4',
  'enemy_monster5',
  
  // V1 series
  'v1_monster1',
  'v1_monster2',
  'v1_monster3',
  'v1_monster4',
  'v1_monster5',
  
  // V2 series
  'v2_monster1',
  'v2_monster2',
  'v2_monster3',
  'v2_monster4',
  'v2_monster5',
  
  // V3 series
  'v3_monster1',
  'v3_monster2',
  'v3_monster3',
  'v3_monster4',
  'v3_monster5',
  
  // V4 series
  'v4_monster1',
  'v4_monster2',
  'v4_monster3',
  'v4_monster4',
  'v4_monster5',
  
  // V5 series
  'v5_monster1',
  'v5_monster2',
  'v5_monster3',
  
  // V6 series
  'v6_monster1',
  'v6_monster2',
  'v6_monster3',
  'v6_monster4',
  'v6_monster5',
  
  // V7 series
  'v7_monster1',
  'v7_monster2',
  
  // V8 series
  'v8_monster1',
  'v8_monster2',
  'v8_monster3',
  'v8_monster4',
  'v8_monster5',
  
  // V9 series
  'v9_monster1',
  'v9_monster2',
  'v9_monster3',
  'v9_monster4',
  'v9_monster5',
  
  // V10 series (they exist!)
  'v10_monster1',
  'v10_monster2',
  'v10_monster3',
  'v10_monster4',
  'v10_monster5',
  
  // V11 series (they exist!)
  'v11_monster1',
  'v11_monster2',
  'v11_monster3',
  'v11_monster4',
  'v11_monster5',
  
  // More v1 monsters
  'morev1_m1',
  'morev1_m2',
  'morev1_m3',
  'morev1_m4',
  'morev1_m5',
  
  // More v2 monsters
  'morev2_m1',
  'morev2_m2',
  'morev2_m3',
  'morev2_m4',
  'morev2_m5',
  
  // More v3 monsters
  'morev3_m1',
  'morev3_m2',
  'morev3_m3',
  'morev3_m4',
  'morev3_m5',
  
  // Special characters
  'anubis',
  'pumpkin_head',
  'skeleton_crusader1',
  'skeleton_crusader2',
  'skeleton_crusader3',
  'skull_knight',
];
