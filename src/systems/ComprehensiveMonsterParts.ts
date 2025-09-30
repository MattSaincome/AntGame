// Comprehensive list of ALL actual monster parts found in public/monster-parts
// Now using ACTUAL scanned parts to avoid 404s!
import { ACTUAL_MONSTER_PARTS } from './ActualMonsterParts';

export const COMPREHENSIVE_VERIFIED_PARTS: Record<string, string[]> = ACTUAL_MONSTER_PARTS;

// Old manual list (kept for reference but not used)
const OLD_MANUAL_PARTS = {
  // Additional sprites folders
  'anubis': ['Body', 'Head', 'Left Hand', 'Left Leg', 'Right Hand', 'Right Leg'],
  'enemy_monster1': ['Body', 'Box', 'Eye', 'Hat', 'Head', 'Leg', 'Tails'],
  'enemy_monster2': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'enemy_monster3': ['Body', 'Box', 'HandB', 'HandF', 'LegB', 'LegF', 'Mouth'],
  'enemy_monster4': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F'],
  'enemy_monster5': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'flying01': ['Face 01', 'Face 02', 'Head', 'Left Wing', 'Right Wing'],
  'monster04': ['Face 01', 'Face 02', 'Head', 'Left Hand', 'Left Leg', 'Right Hand', 'Right Leg', 'Smoke 00', 'Smoke 01', 'Smoke 02', 'Smoke 03', 'Smoke 04'], // No Body!
  'monster05': ['Body', 'Face 01', 'Face 02', 'Face 03', 'Head', 'Left Hand', 'Left Leg', 'Left Upper Arm', 'Right Hand', 'Right Leg', 'Right Upper Arm', 'Weapon'],
  'monster06': ['Body', 'Face 01', 'Face 02', 'Face 03', 'Head', 'Left Hand', 'Left Leg', 'Left Upper Arm', 'Right Hand', 'Right Leg', 'Right Upper Arm', 'Weapon'],
  
  // More v1 monsters - ACTUAL FILES THAT EXIST
  'morev1_m1': ['Body', 'Leg_B', 'Leg_F'], // Only has body and legs!
  'morev1_m2': ['Body', 'Eye', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'morev1_m3': ['Body', 'Eye', 'Hand_B', 'Hand_F', 'Mouth', 'Tails'],
  'morev1_m4': ['Body', 'Eye_B', 'Eye_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'morev1_m5': ['Body', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  
  // More v2 monsters - ACTUAL FILES THAT EXIST
  'morev2_m1': ['Body', 'Eye01', 'Eye02', 'EyeBrow01', 'EyeBrow02', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'morev2_m2': ['Body', 'Eye', 'Eye2', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'], // Eye and Eye2, not Eye01/02
  'morev2_m3': ['Body', 'Eye01', 'Eye02', 'EyeBrow01', 'EyeBrow02', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'morev2_m4': ['Body', 'Box', 'Head', 'Head2', 'Leg_B1', 'Leg_B2', 'Leg_F1', 'Leg_F2', 'Neck', 'S_Attack', 'S_Idle', 'S_Walk', 'Tails'],
  'morev2_m5': ['Body', 'Bomb', 'Box', 'Eye', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  
  // More v3 monsters - ACTUAL FILES THAT EXIST
  'morev3_m1': ['Body', 'Boomerang', 'Box', 'Hair', 'Hand_B1', 'Hand_B2', 'Hand_F', 'Leg_B', 'Leg_F'],
  'morev3_m2': ['Body', 'Box', 'Eye1', 'Eye2', 'Mouth', 'Wing_B', 'Wing_F'],
  'morev3_m3': ['Body', 'Eye1', 'Eye2', 'Leg1', 'Leg2'], // Eye1/2 and Leg1/2, no hands or mouth!
  'morev3_m4': ['Body', 'Box', 'Head', 'Leg1', 'Leg2', 'Neck', 'Wing'],
  'morev3_m5': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F'],
  
  // Special characters
  'pumpkin_head': ['Body', 'Head', 'Left Arm', 'Left Hand', 'Left Leg', 'Right Arm', 'Right Hand', 'Right Leg'],
  'skeleton_crusader1': ['Body', 'Head', 'Left Arm', 'Left Hand', 'Left Leg', 'Right Arm', 'Right Hand', 'Right Leg'],
  'skeleton_crusader2': ['Body', 'Head', 'Left Arm', 'Left Hand', 'Left Leg', 'Right Arm', 'Right Hand', 'Right Leg'],
  'skeleton_crusader3': ['Body', 'Head', 'Left Arm', 'Left Hand', 'Left Leg', 'Right Arm', 'Right Hand', 'Right Leg'],
  'skull_knight': ['Body', 'Head', 'Left Arm', 'Left Hand', 'Left Leg', 'Right Arm', 'Right Hand', 'Right Leg'],
  'vampire': ['Body', 'Face 01', 'Face 02', 'Face 03', 'Head', 'Left Arm', 'Left Hand', 'Left Leg', 'Right Arm', 'Right Hand', 'Right Leg', 'SlashFX', 'Sword'],
  
  // V10 series - they DO exist!
  'v10_monster1': ['Box', 'Mouth1', 'Mouth2', 'P1', 'P2', 'P3'],  // No body but has box
  'v10_monster2': ['Body', 'Box', 'Eye', 'Eye1', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v10_monster3': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F'],
  'v10_monster4': ['Body', 'Box', 'Eye', 'Eyebrow', 'Mouth'],  
  'v10_monster5': ['Body', 'Box', 'Eye', 'Eye1', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  
  // V11 series - they DO exist!
  'v11_monster1': ['Box', 'Eye1', 'Eye2', 'Mouth', 'P1', 'P2', 'P3'], // No body but has box
  'v11_monster2': ['Body', 'Box', 'HandB', 'HandF', 'Mouth', 'Splash', 'Tails'],
  'v11_monster3': ['Body', 'Box', 'Eye1', 'Eye2', 'Mouth'],
  'v11_monster4': ['Body', 'Box', 'Eye', 'Eyebrow', 'Mouth'],
  'v11_monster5': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F'],
  
  // V1 series
  'v1_monster1': ['Body', 'Leg_B', 'Leg_F'],
  'v1_monster2': ['Body', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v1_monster3': ['Body', 'Mouth', 'Wing_B', 'Wing_F'],
  'v1_monster4': ['Body', 'Leg_B', 'Leg_F', 'Mouth', 'Tongue'],
  'v1_monster5': ['Body', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  
  // V2 series
  'v2_monster1': ['Body', 'eye', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v2_monster2': ['Body', 'Eye', 'Eye2', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v2_monster3': ['Body', 'Leg_B', 'Leg_F', 'Mouth'],
  'v2_monster4': ['Body', 'Eye', 'Mouth', 'Wing1', 'Wing2'],
  'v2_monster5': ['Body', 'Eye_B', 'Eye_F', 'Leg_B', 'Leg_F', 'Mouth'],
  
  // V3 series
  'v3_monster1': ['Body', 'Leg_B', 'Leg_F', 'Mouth'],
  'v3_monster2': ['Body', 'Claw1', 'Claw2', 'Eye_B', 'Eye_F', 'Hand_F', 'Leg_B', 'Leg_F'],
  'v3_monster3': ['Body', 'Eye1', 'Eye2', 'Leg1', 'Leg2'],
  'v3_monster4': ['Antena1', 'Antena2', 'Antena3', 'Body', 'Leg_B', 'Leg_F', 'Mouth'],
  'v3_monster5': ['Body', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F'],
  
  // V4 series (both v4_m and v4_monster formats)
  'v4_m1': ['Body', 'Eye1', 'Eye2', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v4_m2': ['Body', 'Eye', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v4_m3': ['Body', 'Eye', 'Hand_B', 'Hand_F', 'Mouth', 'Tails'],
  'v4_m4': ['Body', 'Eye_B', 'Eye_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v4_m5': ['Body', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v4_monster1': ['Body', 'Eye1', 'Eye2', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v4_monster2': ['Body', 'Eye', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v4_monster3': ['Body', 'Eye', 'Hand_B', 'Hand_F', 'Mouth', 'Tails'],
  'v4_monster4': ['Body', 'Eye_B', 'Eye_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v4_monster5': ['Body', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  
  // V5 series
  'v5_monster1': ['Body', 'Eye01', 'Eye02', 'EyeBrow01', 'EyeBrow02', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v5_monster2': ['Body', 'Eye01', 'Eye02', 'EyeBrow01', 'EyeBrow02', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v5_monster3': ['Body', 'Eye01', 'Eye02', 'EyeBrow01', 'EyeBrow02', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  
  // V6 series
  'v6_monster1': ['Body', 'Box', 'Head', 'Head2', 'Leg_B1', 'Leg_B2', 'Leg_F1', 'Leg_F2', 'Neck', 'S_Attack', 'S_Idle', 'S_Walk', 'Tails'],
  'v6_monster2': ['Body', 'Bomb', 'Box', 'Eye', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v6_monster3': ['Body', 'Boomerang', 'Box', 'Hair', 'Hand_B1', 'Hand_B2', 'Hand_F', 'Leg_B', 'Leg_F'],
  'v6_monster4': ['Body', 'Box', 'Eye1', 'Eye2', 'Mouth', 'Wing_B', 'Wing_F'],
  'v6_monster5': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  
  // V7 series (both v7_m and v7_monster formats)
  'v7_m1': ['Body', 'Box', 'Head', 'Leg1', 'Leg2', 'Neck', 'Wing'],
  'v7_m2': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F'],
  'v7_m3': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Head', 'Leg_B', 'Leg_F'],
  'v7_m4': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v7_m5': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth', 'Tongue'],
  'v7_monster1': ['Body', 'Box', 'Head', 'Leg1', 'Leg2', 'Neck', 'Wing'],
  'v7_monster2': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F'],
  
  // V8 series
  'v8_monster1': ['Bomb', 'Box', 'HandB', 'HandF', 'Head', 'Mouth'],
  'v8_monster2': ['Body', 'Box', 'Hand_B', 'Hand_F', 'Hat', 'Leg_B', 'Leg_F', 'Mouth'],
  'v8_monster3': ['Body', 'Box', 'Head', 'Head2', 'Leg_B1', 'Leg_B2', 'Leg_F1', 'Leg_F2', 'Neck', 'S_Attack', 'S_Idle', 'S_Walk', 'Tails'],
  'v8_monster4': ['Body', 'Box', 'Eye1', 'Eye2', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F'],
  'v8_monster5': ['Body', 'Box', 'HandB', 'HandF', 'LegB', 'LegF'],
  
  // V9 series
  'v9_monster1': ['Box', 'Eye1', 'Eye2', 'Mouth', 'P1', 'P2', 'P3'],
  'v9_monster2': ['Body', 'Box', 'Eye', 'Eye1', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  'v9_monster3': ['Body', 'BotMouth', 'Box', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'TopMouth'],
  'v9_monster4': ['Body', 'Box', 'Eye', 'Mouth'],
  'v9_monster5': ['Body', 'Bomb', 'Box', 'Eye', 'Eye2', 'Hand_B', 'Hand_F', 'Leg_B', 'Leg_F', 'Mouth'],
  
  // Default fallback - use Body as most monsters have it
  default: ['Body']
};
