// Dynamically generated monster structure map based on actual parts
import { ACTUAL_MONSTER_PARTS } from './ActualMonsterParts';

export interface MonsterStructure {
  type: 'head-only' | 'body-only' | 'head-and-body' | 'complete-creature';
  mainPart?: string;
  head?: string;
  attachments: {
    eyes?: string[];
    mouth?: string[];
    limbs?: string[];
    wings?: string[];
    extras?: string[];
  };
}

/**
 * Dynamically builds monster structure based on available parts
 */
export function buildMonsterStructure(monsterType: string): MonsterStructure | undefined {
  const parts = ACTUAL_MONSTER_PARTS[monsterType];
  if (!parts || parts.length === 0) return undefined;

  // Check what main parts exist
  const hasBody = parts.some(p => 
    p.toLowerCase() === 'body' || 
    p.toLowerCase().includes('body')
  );
  
  const hasHead = parts.some(p => 
    p.toLowerCase() === 'head' || 
    p.toLowerCase().includes('head')
  );

  // Determine structure type
  let type: MonsterStructure['type'];
  if (hasBody && hasHead) {
    type = 'head-and-body';
  } else if (hasBody) {
    type = 'body-only';
  } else if (hasHead) {
    type = 'head-only';
  } else {
    type = 'complete-creature';
  }

  // Categorize parts
  const structure: MonsterStructure = {
    type,
    attachments: {}
  };

  // Set main parts
  if (hasBody) {
    structure.mainPart = parts.find(p => p.toLowerCase() === 'body') || 'Body';
  }
  if (hasHead) {
    structure.head = parts.find(p => p.toLowerCase() === 'head') || 'Head';
  }
  
  // If no body or head, use the first part as main
  if (!hasBody && !hasHead && parts.length > 0) {
    structure.mainPart = parts[0];
  }

  // Categorize attachments
  const eyes: string[] = [];
  const mouth: string[] = [];
  const limbs: string[] = [];
  const wings: string[] = [];
  const extras: string[] = [];

  for (const part of parts) {
    const lower = part.toLowerCase();
    
    // Skip body and head as they're main parts
    if (lower === 'body' || lower === 'head') continue;
    
    // Eyes
    if (lower.includes('eye')) {
      eyes.push(part);
    }
    // Mouth
    else if (lower.includes('mouth') || lower.includes('jaw') || lower.includes('tongue')) {
      mouth.push(part);
    }
    // Wings
    else if (lower.includes('wing')) {
      wings.push(part);
    }
    // Limbs (arms, legs, hands, feet)
    else if (
      lower.includes('arm') || 
      lower.includes('leg') || 
      lower.includes('hand') || 
      lower.includes('foot') ||
      lower.includes('feet') ||
      lower === 'leg_f' || 
      lower === 'leg_b' ||
      lower === 'legf' || 
      lower === 'legb' ||
      lower === 'hand_f' || 
      lower === 'hand_b' ||
      lower === 'handf' || 
      lower === 'handb'
    ) {
      limbs.push(part);
    }
    // Face parts (special handling)
    else if (lower.includes('face')) {
      eyes.push(part); // Faces often contain eyes
    }
    // Everything else is extras
    else {
      extras.push(part);
    }
  }

  // Add categorized parts to structure
  if (eyes.length > 0) structure.attachments.eyes = eyes;
  if (mouth.length > 0) structure.attachments.mouth = mouth;
  if (limbs.length > 0) structure.attachments.limbs = limbs;
  if (wings.length > 0) structure.attachments.wings = wings;
  if (extras.length > 0) structure.attachments.extras = extras;

  return structure;
}

// Export a function to get all structures
export function getAllMonsterStructures(): Record<string, MonsterStructure> {
  const structures: Record<string, MonsterStructure> = {};
  
  for (const monsterType of Object.keys(ACTUAL_MONSTER_PARTS)) {
    const structure = buildMonsterStructure(monsterType);
    if (structure) {
      structures[monsterType] = structure;
    }
  }
  
  return structures;
}

// Create a static map for compatibility
export const MONSTER_STRUCTURES = getAllMonsterStructures();
