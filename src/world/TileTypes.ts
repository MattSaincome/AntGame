/**
 * Tile system for the underground mining world
 */

export enum TileType {
  AIR = 'air',
  DIRT = 'dirt',
  STONE = 'stone',  
  ROCK = 'rock',
  ORE_COPPER = 'ore_copper',
  ORE_IRON = 'ore_iron',
  ORE_GOLD = 'ore_gold',
  CRYSTAL = 'crystal',
  WATER = 'water',
  LAVA = 'lava',
  BEDROCK = 'bedrock'
}

export interface Tile {
  type: TileType;
  x: number;
  y: number;
  integrity: number; // 0-100, how much digging required
  resources: number; // 0-10, resource amount if ore
  discovered: boolean;
  lastUpdated: number;
}

export interface TileProperties {
  solid: boolean;
  diggable: boolean;
  hardness: number; // 1-10 scale
  color: string;
  resourceValue: number;
  dangerous: boolean;
  spriteName: string; // Reference to sprite in SpriteManager
}

export const TILE_PROPERTIES: Record<TileType, TileProperties> = {
  [TileType.AIR]: {
    solid: false,
    diggable: false,
    hardness: 0,
    color: '#000000',
    resourceValue: 0,
    dangerous: false,
    spriteName: 'cave_bg'
  },
  [TileType.DIRT]: {
    solid: true,
    diggable: true,
    hardness: 1,
    color: '#8B4513',
    resourceValue: 1,
    dangerous: false,
    spriteName: 'dirt'
  },
  [TileType.STONE]: {
    solid: true,
    diggable: true,
    hardness: 3,
    color: '#696969',
    resourceValue: 2,
    dangerous: false,
    spriteName: 'stone'
  },
  [TileType.ROCK]: {
    solid: true,
    diggable: true,
    hardness: 5,
    color: '#2F4F4F',
    resourceValue: 2,
    dangerous: false,
    spriteName: 'stone'
  },
  [TileType.ORE_COPPER]: {
    solid: true,
    diggable: true,
    hardness: 4,
    color: '#CD853F',
    resourceValue: 5,
    dangerous: false,
    spriteName: 'copper_ore'
  },
  [TileType.ORE_IRON]: {
    solid: true,
    diggable: true,
    hardness: 6,
    color: '#4682B4',
    resourceValue: 8,
    dangerous: false,
    spriteName: 'iron_ore'
  },
  [TileType.ORE_GOLD]: {
    solid: true,
    diggable: true,
    hardness: 7,
    color: '#FFD700',
    resourceValue: 15,
    dangerous: false,
    spriteName: 'gold_ore'
  },
  [TileType.CRYSTAL]: {
    solid: true,
    diggable: true,
    hardness: 8,
    color: '#9370DB',
    resourceValue: 25,
    dangerous: false,
    spriteName: 'crystal'
  },
  [TileType.WATER]: {
    solid: false,
    diggable: false,
    hardness: 0,
    color: '#0000FF',
    resourceValue: 0,
    dangerous: true,
    spriteName: 'water'
  },
  [TileType.LAVA]: {
    solid: false,
    diggable: false,
    hardness: 0,
    color: '#FF4500',
    resourceValue: 0,
    dangerous: true,
    spriteName: 'lava'
  },
  [TileType.BEDROCK]: {
    solid: true,
    diggable: false,
    hardness: 100,
    color: '#1C1C1C',
    resourceValue: 0,
    dangerous: false,
    spriteName: 'bedrock'
  }
};

export const TILE_SIZE = 16; // pixels
export const WORLD_WIDTH = 200; // tiles
export const WORLD_HEIGHT = 150; // tiles

// Generation constants
export const SURFACE_LEVEL = 20;
export const DIRT_DEPTH = 15;
export const STONE_DEPTH = 40;
export const DEEP_STONE_DEPTH = 80;
export const ORE_RARITY = 0.15;
export const CRYSTAL_RARITY = 0.05;
