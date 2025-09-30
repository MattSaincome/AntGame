// Monster Structure Map - Understanding what each monster ACTUALLY is
// Some monsters are complete with just a body, others with just a head

export interface MonsterStructure {
  type: 'head-only' | 'body-only' | 'head-and-body' | 'complete-creature';
  mainPart: string; // The primary sprite that represents this monster
  attachments?: {
    eyes?: string[];
    mouth?: string[];
    limbs?: string[];
    wings?: string[];
    extras?: string[];
  };
}

export const MONSTER_STRUCTURE_MAP: Record<string, MonsterStructure> = {
  // HEAD-ONLY monsters (the head IS the complete creature)
  'monster04': {
    type: 'head-only',
    mainPart: 'Head',
    attachments: {
      eyes: ['Face 01', 'Face 02'],
      limbs: ['Left Hand', 'Right Hand', 'Left Leg', 'Right Leg']
    }
  },
  'monster05': {
    type: 'head-and-body',
    mainPart: 'Body',
    attachments: {
      eyes: ['Face 01', 'Face 02', 'Face 03'],
      limbs: ['Left Hand', 'Right Hand', 'Left Leg', 'Right Leg', 'Left Upper Arm', 'Right Upper Arm'],
      extras: ['Weapon']
    }
  },
  'monster06': {
    type: 'head-and-body',
    mainPart: 'Body',
    attachments: {
      eyes: ['Face 01', 'Face 02', 'Face 03'],
      limbs: ['Left Hand', 'Right Hand', 'Left Leg', 'Right Leg', 'Left Upper Arm', 'Right Upper Arm'],
      extras: ['Weapon']
    }
  },
  'flying01': {
    type: 'head-only',
    mainPart: 'Head',
    attachments: {
      eyes: ['Face 01', 'Face 02'],
      wings: ['Left Wing', 'Right Wing']
    }
  },
  
  // BODY-ONLY monsters (the body IS the complete creature)
  'v1_monster1': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      limbs: ['Leg_F', 'Leg_B']
    }
  },
  'v1_monster2': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth'],
      limbs: ['Hand_F', 'Hand_B', 'Leg_F', 'Leg_B']
    }
  },
  'v1_monster3': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth'],
      wings: ['Wing_F', 'Wing_B']
    }
  },
  'v1_monster4': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth', 'Tongue'],
      limbs: ['Leg_F', 'Leg_B']
    }
  },
  'v1_monster5': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth'],
      limbs: ['Hand_F', 'Hand_B', 'Leg_F', 'Leg_B']
    }
  },
  
  // V2 series - mostly body-only
  'v2_monster1': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      eyes: ['eye'],
      mouth: ['Mouth'],
      limbs: ['Hand_F', 'Hand_B', 'Leg_F', 'Leg_B']
    }
  },
  'v2_monster2': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      eyes: ['Eye', 'Eye2'],
      mouth: ['Mouth'],
      limbs: ['Hand_F', 'Hand_B', 'Leg_F', 'Leg_B']
    }
  },
  'v2_monster3': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth'],
      limbs: ['Leg_F', 'Leg_B']
    }
  },
  'v2_monster4': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      eyes: ['Eye'],
      mouth: ['Mouth'],
      wings: ['Wing1', 'Wing2']
    }
  },
  'v2_monster5': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      eyes: ['Eye_F', 'Eye_B'],
      mouth: ['Mouth'],
      limbs: ['Leg_F', 'Leg_B']
    }
  },
  
  // V3 series
  'v3_monster1': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth'],
      limbs: ['Leg_F', 'Leg_B']
    }
  },
  'v3_monster2': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      eyes: ['Eye_F', 'Eye_B'],
      limbs: ['Claw1', 'Claw2', 'Hand_F', 'Leg_F', 'Leg_B']
    }
  },
  'v3_monster3': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      eyes: ['Eye1', 'Eye2'],
      limbs: ['Leg1', 'Leg2']
    }
  },
  'v3_monster4': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth'],
      limbs: ['Leg_F', 'Leg_B'],
      extras: ['Antena1', 'Antena2', 'Antena3']
    }
  },
  'v3_monster5': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      limbs: ['Hand_F', 'Hand_B', 'Leg_F', 'Leg_B']
    }
  },
  
  // V8 series - special cases
  'v8_monster1': {
    type: 'head-only',
    mainPart: 'Head',
    attachments: {
      mouth: ['Mouth'],
      limbs: ['HandF', 'HandB'],
      extras: ['Bomb']
    }
  },
  'v8_monster2': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth'],
      limbs: ['Hand_F', 'Hand_B', 'Leg_F', 'Leg_B'],
      extras: ['Hat']
    }
  },
  'v8_monster3': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      limbs: ['Leg_B1', 'Leg_B2', 'Leg_F1', 'Leg_F2'],
      extras: ['Head', 'Head2', 'Neck', 'Tails']
    }
  },
  
  // V9 series - some without body!
  'v9_monster1': {
    type: 'complete-creature',
    mainPart: 'Mouth', // This monster IS just a mouth!
    attachments: {
      eyes: ['Eye1', 'Eye2'],
      extras: ['P1', 'P2', 'P3']
    }
  },
  'v9_monster2': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      eyes: ['Eye', 'Eye1'],
      mouth: ['Mouth'],
      limbs: ['Hand_F', 'Hand_B', 'Leg_F', 'Leg_B']
    }
  },
  
  // V10 and V11 series DO NOT EXIST - REMOVED
  
  // Enemy monsters
  'enemy_monster1': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      eyes: ['Eye'],
      limbs: ['Leg'], // Single leg sprite
      extras: ['Hat', 'Head', 'Tails']
    }
  },
  'enemy_monster2': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth'],
      limbs: ['Hand_F', 'Hand_B', 'Leg_F', 'Leg_B']
    }
  },
  'enemy_monster3': {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      mouth: ['Mouth'],
      limbs: ['HandF', 'HandB', 'LegF', 'LegB'] // No underscores!
    }
  },
  
  // Special characters
  'anubis': {
    type: 'head-and-body',
    mainPart: 'Body',
    attachments: {
      limbs: ['Left Hand', 'Right Hand', 'Left Leg', 'Right Leg']
    }
  },
  'pumpkin_head': {
    type: 'head-and-body',
    mainPart: 'Body',
    attachments: {
      limbs: ['Left Arm', 'Left Hand', 'Left Leg', 'Right Arm', 'Right Hand', 'Right Leg']
    }
  },
  'vampire': {
    type: 'head-and-body',
    mainPart: 'Body',
    attachments: {
      eyes: ['Face 01', 'Face 02', 'Face 03'],
      limbs: ['Left Arm', 'Left Hand', 'Left Leg', 'Right Arm', 'Right Hand', 'Right Leg'],
      extras: ['Sword', 'SlashFX']
    }
  },
  
  // Default structure for unmapped monsters
  default: {
    type: 'body-only',
    mainPart: 'Body',
    attachments: {
      limbs: ['Leg_F', 'Leg_B']
    }
  }
};

export function getMonsterStructure(monsterType: string): MonsterStructure {
  return MONSTER_STRUCTURE_MAP[monsterType] || MONSTER_STRUCTURE_MAP.default;
}

export function canMonstersBeMixed(monster1: string, monster2: string): boolean {
  const struct1 = getMonsterStructure(monster1);
  const struct2 = getMonsterStructure(monster2);
  
  // Don't mix complete creatures with anything
  if (struct1.type === 'complete-creature' || struct2.type === 'complete-creature') {
    return false;
  }
  
  // Don't mix head-only with head-only (would have no body)
  if (struct1.type === 'head-only' && struct2.type === 'head-only') {
    return false;
  }
  
  // Don't mix body-only with body-only (would have no distinct head)
  // Actually this is OK since body can act as the whole creature
  
  return true;
}
