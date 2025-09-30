/**
 * Optimized monster parts configuration
 * Instead of loading 22,000+ files at once, we'll focus on the most useful parts
 */

// Stats from the full scan
export const MONSTER_PARTS_STATS = {
  totalFolders: 1698,
  totalFiles: 22032,
  uniquePartTypes: 4418
};

// Core Spine folders with individual body parts (the most useful for procedural generation)
// NOTE: These "additional sprites" paths don't exist in the public folder - commenting out
export const SPINE_MONSTER_FOLDERS = [
  // These paths would need to be copied to public/monster-parts first
  /*
  // V1 Series (5 monsters)
  'additional sprites/craftpix-net-167954-monster-v1-character-sprites/Spine/Monster 1/Images',
  'additional sprites/craftpix-net-167954-monster-v1-character-sprites/Spine/Monster 2/Images',
  'additional sprites/craftpix-net-167954-monster-v1-character-sprites/Spine/Monster 3/Images',
  'additional sprites/craftpix-net-167954-monster-v1-character-sprites/Spine/Monster 4/Images',
  'additional sprites/craftpix-net-167954-monster-v1-character-sprites/Spine/Monster 5/Images',
  
  // V2 Series (5 monsters)
  'additional sprites/craftpix-net-154190-monster-v2-character-sprites/Spine/Monster 1/Images',
  'additional sprites/craftpix-net-154190-monster-v2-character-sprites/Spine/Monster 2/Images',
  'additional sprites/craftpix-net-154190-monster-v2-character-sprites/Spine/Monster 3/Images',
  'additional sprites/craftpix-net-154190-monster-v2-character-sprites/Spine/Monster 4/Images',
  'additional sprites/craftpix-net-154190-monster-v2-character-sprites/Spine/Monster 5/Images',
  
  // V3 Series (5 monsters)
  'additional sprites/craftpix-net-205925-monster-v3-character-sprites/Spine/Monster 1/Images',
  'additional sprites/craftpix-net-205925-monster-v3-character-sprites/Spine/Monster 2/Images',
  'additional sprites/craftpix-net-205925-monster-v3-character-sprites/Spine/Monster 3/Images',
  'additional sprites/craftpix-net-205925-monster-v3-character-sprites/Spine/Monster 4/Images',
  'additional sprites/craftpix-net-205925-monster-v3-character-sprites/Spine/Monster 5/Images',
  
  // V4 Series (5 monsters)
  'additional sprites/craftpix-net-894353-monster-v4-character-sprites/Spine/Monster 1/Images',
  'additional sprites/craftpix-net-894353-monster-v4-character-sprites/Spine/Monster 2/Images',
  'additional sprites/craftpix-net-894353-monster-v4-character-sprites/Spine/Monster 3/Images',
  'additional sprites/craftpix-net-894353-monster-v4-character-sprites/Spine/Monster 4/Images',
  'additional sprites/craftpix-net-894353-monster-v4-character-sprites/Spine/Monster 5/Images',
  
  // V5 Series (3 monsters)
  'additional sprites/craftpix-net-919876-monster-v5-character-sprites/Spine/Char01/Images',
  'additional sprites/craftpix-net-919876-monster-v5-character-sprites/Spine/Char02/Images',
  'additional sprites/craftpix-net-919876-monster-v5-character-sprites/Spine/Char03/Images',
  
  // V6 Series (5 monsters)
  'additional sprites/craftpix-net-534332-monster-v6-sprite-set/Spine/Monster1/Images',
  'additional sprites/craftpix-net-534332-monster-v6-sprite-set/Spine/Monster2/Images',
  'additional sprites/craftpix-net-534332-monster-v6-sprite-set/Spine/Monster3/Images',
  'additional sprites/craftpix-net-534332-monster-v6-sprite-set/Spine/Monster4/Images',
  'additional sprites/craftpix-net-534332-monster-v6-sprite-set/Spine/Monster5/Images',
  
  // V7 Series (2 monsters)
  'additional sprites/craftpix-net-925935-monster-v7-sprite-pack/Spine/Monster 1/Images',
  'additional sprites/craftpix-net-925935-monster-v7-sprite-pack/Spine/Monster 2/Images',
  
  // V8 Series (5 monsters)
  'additional sprites/craftpix-net-155833-monster-v8-sprites/Spine/Monster1/Images',
  'additional sprites/craftpix-net-155833-monster-v8-sprites/Spine/Monster2/Images',
  'additional sprites/craftpix-net-155833-monster-v8-sprites/Spine/Monster3/Images',
  'additional sprites/craftpix-net-155833-monster-v8-sprites/Spine/Monster4/Images',
  'additional sprites/craftpix-net-155833-monster-v8-sprites/Spine/Monster5/Images',
  
  // V9 Series (5 monsters)
  'additional sprites/craftpix-net-376573-monster-v9-character-sprites/Spine/Monster1/Images',
  'additional sprites/craftpix-net-376573-monster-v9-character-sprites/Spine/Monster2/Images',
  'additional sprites/craftpix-net-376573-monster-v9-character-sprites/Spine/Monster3/Images',
  'additional sprites/craftpix-net-376573-monster-v9-character-sprites/Spine/Monster4/Images',
  'additional sprites/craftpix-net-376573-monster-v9-character-sprites/Spine/Monster5/Images',
  
  // V10 Series (5 monsters)
  'additional sprites/craftpix-net-810746-monster-v10-enemy-sprite-set/Spine/Monster1/Images',
  'additional sprites/craftpix-net-810746-monster-v10-enemy-sprite-set/Spine/Monster2/Images',
  'additional sprites/craftpix-net-810746-monster-v10-enemy-sprite-set/Spine/Monster3/Images',
  'additional sprites/craftpix-net-810746-monster-v10-enemy-sprite-set/Spine/Monster4/Images',
  'additional sprites/craftpix-net-810746-monster-v10-enemy-sprite-set/Spine/Monster5/Images',
  
  // V11 Series (5 monsters)
  'additional sprites/craftpix-net-923854-monster-v11-enemy-sprite-set/Spine/Monster1/Images',
  'additional sprites/craftpix-net-923854-monster-v11-enemy-sprite-set/Spine/Monster2/Images',
  'additional sprites/craftpix-net-923854-monster-v11-enemy-sprite-set/Spine/Monster3/Images',
  'additional sprites/craftpix-net-923854-monster-v11-enemy-sprite-set/Spine/Monster4/Images',
  'additional sprites/craftpix-net-923854-monster-v11-enemy-sprite-set/Spine/Monster5/Images',
  
  // Enemy Series (5 monsters)
  'additional sprites/craftpix-net-101043-monster-enemy-character-pack/Spine/Monster 1/Images',
  'additional sprites/craftpix-net-101043-monster-enemy-character-pack/Spine/Monster 2/Images',
  'additional sprites/craftpix-net-101043-monster-enemy-character-pack/Spine/Monster 3/Images',
  'additional sprites/craftpix-net-101043-monster-enemy-character-pack/Spine/Monster 4/Images',
  'additional sprites/craftpix-net-101043-monster-enemy-character-pack/Spine/Monster 5/Images',
  
  // Cute Chibi Series (5 monsters)
  'additional sprites/craftpix-net-239726-cute-chibi-monsters-asset-pack/Spine/Monster1/Images',
  'additional sprites/craftpix-net-239726-cute-chibi-monsters-asset-pack/Spine/Monster2/Images',
  'additional sprites/craftpix-net-239726-cute-chibi-monsters-asset-pack/Spine/Monster3/Images',
  'additional sprites/craftpix-net-239726-cute-chibi-monsters-asset-pack/Spine/Monster4/Images',
  'additional sprites/craftpix-net-239726-cute-chibi-monsters-asset-pack/Spine/Monster5/Images',
  
  // Chibi Monsters 2D (5 monsters)
  'additional sprites/craftpix-net-482844-chibi-monsters-2d-asset-pack/Spine/Monster1/Images',
  'additional sprites/craftpix-net-482844-chibi-monsters-2d-asset-pack/Spine/Monster2/Images',
  'additional sprites/craftpix-net-482844-chibi-monsters-2d-asset-pack/Spine/Monster3/Images',
  'additional sprites/craftpix-net-482844-chibi-monsters-2d-asset-pack/Spine/Monster4/Images',
  'additional sprites/craftpix-net-482844-chibi-monsters-2d-asset-pack/Spine/Monster5/Images',
  
  // Cartoon Monsters (5 monsters)
  'additional sprites/craftpix-net-548470-cartoon-monsters-animated-asset-pack/Spine/Monster 1/Images',
  'additional sprites/craftpix-net-548470-cartoon-monsters-animated-asset-pack/Spine/Monster 2/Images',
  'additional sprites/craftpix-net-548470-cartoon-monsters-animated-asset-pack/Spine/Monster 3/Images',
  'additional sprites/craftpix-net-548470-cartoon-monsters-animated-asset-pack/Spine/Monster 4/Images',
  'additional sprites/craftpix-net-548470-cartoon-monsters-animated-asset-pack/Spine/Monster 5/Images',
  
  // V17 Funny Monsters (5 monsters)
  'additional sprites/craftpix-net-625577-5-funny-monsters-sprite-pack-v17/Spine/Monster1/Images',
  'additional sprites/craftpix-net-625577-5-funny-monsters-sprite-pack-v17/Spine/Monster2/Images',
  'additional sprites/craftpix-net-625577-5-funny-monsters-sprite-pack-v17/Spine/Monster3/Images',
  'additional sprites/craftpix-net-625577-5-funny-monsters-sprite-pack-v17/Spine/Monster4/Images',
  'additional sprites/craftpix-net-625577-5-funny-monsters-sprite-pack-v17/Spine/Monster5/Images',
  
  // Mini Monsters (3 monsters)
  'additional sprites/craftpix-net-659195-mini-monster-6-character-sprites/Spine/Char01/Images',
  'additional sprites/craftpix-net-659195-mini-monster-6-character-sprites/Spine/Char02/Images',
  'additional sprites/craftpix-net-659195-mini-monster-6-character-sprites/Spine/Char03/Images',
  
  // V18 Funny Monsters (5 monsters)
  'additional sprites/craftpix-net-683179-5-funny-monsters-game-asset-pack-v18/Spine/Monster1/Images',
  'additional sprites/craftpix-net-683179-5-funny-monsters-game-asset-pack-v18/Spine/Monster2/Images',
  'additional sprites/craftpix-net-683179-5-funny-monsters-game-asset-pack-v18/Spine/Monster3/Images',
  'additional sprites/craftpix-net-683179-5-funny-monsters-game-asset-pack-v18/Spine/Monster4/Images',
  'additional sprites/craftpix-net-683179-5-funny-monsters-game-asset-pack-v18/Spine/Monster5/Images',
  
  // V19 Quirky Monsters (5 monsters)
  'additional sprites/craftpix-net-731843-quirky-monsters-game-asset-pack-v19/Spine/Monster1/Images',
  'additional sprites/craftpix-net-731843-quirky-monsters-game-asset-pack-v19/Spine/Monster2/Images',
  'additional sprites/craftpix-net-731843-quirky-monsters-game-asset-pack-v19/Spine/Monster3/Images',
  'additional sprites/craftpix-net-731843-quirky-monsters-game-asset-pack-v19/Spine/Monster4/Images',
  'additional sprites/craftpix-net-731843-quirky-monsters-game-asset-pack-v19/Spine/Monster5/Images',
  
  // Cartoon Enemy Pack (5 monsters)
  'additional sprites/craftpix-net-839471-cartoon-enemy-sprites-pack-12/Spine/Monster1/Images',
  'additional sprites/craftpix-net-839471-cartoon-enemy-sprites-pack-12/Spine/Monster2/Images',
  'additional sprites/craftpix-net-839471-cartoon-enemy-sprites-pack-12/Spine/Monster3/Images',
  'additional sprites/craftpix-net-839471-cartoon-enemy-sprites-pack-12/Spine/Monster4/Images',
  'additional sprites/craftpix-net-839471-cartoon-enemy-sprites-pack-12/Spine/Monster5/Images',
  
  // Special Characters
  'additional sprites/craftpix-net-166787-free-chibi-skeleton-crusader-character-sprites/Spine/skeleton1/Images',
  'additional sprites/craftpix-net-166787-free-chibi-skeleton-crusader-character-sprites/Spine/skeleton2/Images',
  'additional sprites/craftpix-net-166787-free-chibi-skeleton-crusader-character-sprites/Spine/skeleton3/Images',
  'additional sprites/craftpix-net-257577-chibi-skeleton-death-knight-character-sprites/Spine/Skeleton/Images',
  'additional sprites/craftpix-net-563568-free-wraith-tiny-style-2d-sprites/Spine/Char/Images',
  'additional sprites/craftpix-net-986833-chibi-blood-demon-character-sprites/Spine/Demon/Images',
  'additional sprites/craftpix-781165-fire-monster-game-sprites-pixel-art/Spine/Char/Images',
  'additional sprites/craftpix-891164-mummy-tiny-style-2d-character-sprites/Spine/Char/Images',
  'additional sprites/craftpix-941777-egyptian-mummy-anubis-sentry-chibi-2d-game-sprites/Spine/Anubis/Images',
  'additional sprites/craftpix-941777-egyptian-mummy-anubis-sentry-chibi-2d-game-sprites/Spine/Mummy/Images',
  'additional sprites/craftpix-664210-halloween-character-chibi-2d-game-sprites/Spine/character/Images',
  */
  // Empty array since these paths don't exist
];

// Common part types found in Spine folders
export const COMMON_PART_TYPES = [
  'Body', 'Head', 'Box', 'Mouth', 
  'Eye', 'Eye1', 'Eye2', 'Eye_F', 'Eye_B',
  'Hand_F', 'Hand_B', 'HandF', 'HandB',
  'Leg_F', 'Leg_B', 'LegF', 'LegB', 
  'Leg', 'Leg1', 'Leg2', 'Leg3', 'Leg4',
  'Arm_F', 'Arm_B', 'UpperArm_F', 'UpperArm_B',
  'Wing', 'Wing_F', 'Wing_B', 'Wing1', 'Wing2',
  'Tail', 'Tails', 'Neck', 'Tongue',
  'Claw', 'Claw1', 'Claw2',
  'Antena1', 'Antena2', 'Antena3',
  'Hat', 'Hair', 'Hair1', 'Hair2',
  'Weapon', 'Shield', 'Sword', 'Staff',
  'Shadow', 'Smoke', 'Effects'
];

// Direct folders with parts (not in additional sprites)
export const DIRECT_MONSTER_FOLDERS = [
  'v1_monster1', 'v1_monster2', 'v1_monster3', 'v1_monster4', 'v1_monster5',
  'v2_monster1', 'v2_monster2', 'v2_monster3', 'v2_monster4', 'v2_monster5',
  'v3_monster1', 'v3_monster2', 'v3_monster3', 'v3_monster4', 'v3_monster5',
  'v4_monster1', 'v4_monster2', 'v4_monster3', 'v4_monster4', 'v4_monster5',
  'v5_monster1', 'v5_monster2', 'v5_monster3',
  'v6_monster1', 'v6_monster2', 'v6_monster3', 'v6_monster4', 'v6_monster5',
  'v7_monster1', 'v7_monster2',
  'v8_monster1', 'v8_monster2', 'v8_monster3', 'v8_monster4', 'v8_monster5',
  'v9_monster1', 'v9_monster2', 'v9_monster3', 'v9_monster4', 'v9_monster5',
  // v10 and v11 DO NOT EXIST - REMOVED
  'enemy_monster1', 'enemy_monster2', 'enemy_monster3', 'enemy_monster4', 'enemy_monster5',
  'monster04', 'monster05', 'monster06', 'flying01',
  'morev1_m1', 'morev1_m2', 'morev1_m3', 'morev1_m4', 'morev1_m5',
  'morev2_m1', 'morev2_m2', 'morev2_m3', 'morev2_m4', 'morev2_m5',
  'morev3_m1', 'morev3_m2', 'morev3_m3', 'morev3_m4', 'morev3_m5',
  'anubis', 'pumpkin_head', 'skeleton_crusader1', 'skeleton_crusader2', 'skeleton_crusader3', 
  'skull_knight', 'vampire'
];
