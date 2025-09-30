/**
 * Evolutionary Gene Pool System
 * 
 * A clever dynamic loading system that starts with a random subset of monster parts
 * and progressively unlocks more genetic variety as monsters breed and evolve.
 * 
 * This ensures true randomness across all 22,000+ parts while maintaining performance.
 */

import { 
  MONSTER_PARTS_STATS,
  SPINE_MONSTER_FOLDERS,
  DIRECT_MONSTER_FOLDERS
} from '../config/MonsterPartsOptimized';

interface PartChunk {
  id: string;
  folders: string[];
  parts: string[];
  unlockGeneration: number;
  loaded: boolean;
}

interface EvolutionMilestone {
  generation: number;
  name: string;
  description: string;
  chunksToUnlock: number;
}

export class EvolutionaryPartPool {
  private scene: Phaser.Scene;
  
  // All available part chunks (lazily loaded from file system)
  private allAvailableChunks: PartChunk[] = [];
  private loadedChunks: Set<string> = new Set();
  private currentGeneration: number = 0;
  
  // Starting gene pool size
  private readonly INITIAL_CHUNKS = 5; // Start with 5 random chunks
  private readonly CHUNK_SIZE = 20; // Each chunk has ~20 monster types
  private readonly PARTS_PER_BABY = 2; // Load 2 new chunks every X babies
  private readonly BABIES_PER_EVOLUTION = 10; // Evolve gene pool every 10 babies
  
  // Track breeding progress
  private babiesBorn: number = 0;
  private totalMonsterTypesAvailable: number = 0;
  
  // Evolution milestones
  private milestones: EvolutionMilestone[] = [
    { generation: 0, name: "Primordial Soup", description: "Basic genetic material", chunksToUnlock: 5 },
    { generation: 1, name: "Cambrian Explosion", description: "Rapid diversification", chunksToUnlock: 10 },
    { generation: 2, name: "Mesozoic Era", description: "Age of giants", chunksToUnlock: 15 },
    { generation: 3, name: "Genetic Revolution", description: "Mutation acceleration", chunksToUnlock: 20 },
    { generation: 5, name: "Cosmic Evolution", description: "Alien genetics unlocked", chunksToUnlock: 30 },
    { generation: 10, name: "Singularity", description: "All genetics available", chunksToUnlock: 100 }
  ];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Don't initialize chunks in constructor - wait for preload to complete
  }
  
  /**
   * Initialize all available chunks by scanning the file system
   */
  private initializeChunks(): void {
    console.log('🧬 Initializing Evolutionary Gene Pool...');
    
    // Dynamically get all available monster folders
    const allFolders = this.getAllMonsterFolders();
    
    // Divide into chunks
    const chunkCount = Math.ceil(allFolders.length / this.CHUNK_SIZE);
    
    for (let i = 0; i < chunkCount; i++) {
      const startIdx = i * this.CHUNK_SIZE;
      const endIdx = Math.min(startIdx + this.CHUNK_SIZE, allFolders.length);
      const chunkFolders = allFolders.slice(startIdx, endIdx);
      
      this.allAvailableChunks.push({
        id: `chunk_${i}`,
        folders: chunkFolders,
        parts: [], // Will be populated when loaded
        unlockGeneration: Math.floor(i / 10), // Distribute across generations
        loaded: false
      });
    }
    
    console.log(`📊 Created ${this.allAvailableChunks.length} gene pool chunks from ${allFolders.length} monster types`);
    console.log(`🎲 Total potential variety: ${MONSTER_PARTS_STATS.totalFiles} parts`);
  }
  
  /**
   * Start a new game session with random initial gene pool
   */
  startNewSession(): void {
    console.log('🎮 Starting new evolutionary session...');
    
    // Re-initialize chunks each time for true randomization
    this.allAvailableChunks = []; // Clear old chunks
    this.initializeChunks();
    
    // Clear previous session
    this.loadedChunks.clear();
    this.currentGeneration = 0;
    this.babiesBorn = 0;
    
    // Select random starting chunks - truly random each time
    const availableChunks = this.shuffleArray([...this.allAvailableChunks]);
    const selectedChunks: PartChunk[] = [];
    
    for (let i = 0; i < this.INITIAL_CHUNKS && availableChunks.length > 0; i++) {
      selectedChunks.push(availableChunks[i]);
    }
    
    // Load the initial chunks
    selectedChunks.forEach(chunk => {
      this.loadChunk(chunk);
    });
    
    const milestone = this.milestones[0];
    console.log(`🌟 Era: ${milestone.name} - ${milestone.description}`);
    console.log(`🧬 Initial gene pool: ${this.totalMonsterTypesAvailable} monster types available`);
    
    // Show UI notification
    this.showEvolutionNotification(milestone.name, milestone.description);
  }
  
  /**
   * Called when a baby is born - potentially unlock new genetics
   */
  onBabyBorn(): void {
    this.babiesBorn++;
    
    // Check if it's time to evolve
    if (this.babiesBorn % this.BABIES_PER_EVOLUTION === 0) {
      this.evolveGenePool();
    }
    
    // Randomly unlock bonus chunks occasionally (1% chance per birth)
    if (Math.random() < 0.01) {
      this.unlockBonusChunk("Spontaneous Mutation!");
    }
  }
  
  /**
   * Evolve the gene pool by unlocking new chunks
   */
  private evolveGenePool(): void {
    this.currentGeneration++;
    
    // Find applicable milestone
    const milestone = this.getMilestoneForGeneration(this.currentGeneration);
    
    if (!milestone) return;
    
    console.log(`\n🔬 EVOLUTION! Generation ${this.currentGeneration}`);
    console.log(`🌟 Entering: ${milestone.name}`);
    
    // Calculate how many new chunks to unlock
    const chunksToAdd = Math.min(
      this.PARTS_PER_BABY,
      this.allAvailableChunks.length - this.loadedChunks.size
    );
    
    // Select random unloaded chunks
    const unloadedChunks = this.allAvailableChunks.filter(
      chunk => !this.loadedChunks.has(chunk.id)
    );
    
    for (let i = 0; i < chunksToAdd && unloadedChunks.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * unloadedChunks.length);
      const chunk = unloadedChunks.splice(randomIndex, 1)[0];
      this.loadChunk(chunk);
    }
    
    // Show evolution message
    this.showEvolutionNotification(
      `Generation ${this.currentGeneration}: ${milestone.name}`,
      `${this.totalMonsterTypesAvailable} monster types now available!`
    );
  }
  
  /**
   * Unlock a bonus chunk (rare random event)
   */
  private unlockBonusChunk(reason: string): void {
    const unloadedChunks = this.allAvailableChunks.filter(
      chunk => !this.loadedChunks.has(chunk.id)
    );
    
    if (unloadedChunks.length === 0) return;
    
    const randomChunk = unloadedChunks[Math.floor(Math.random() * unloadedChunks.length)];
    this.loadChunk(randomChunk);
    
    console.log(`\n💎 RARE EVENT: ${reason}`);
    console.log(`🎁 Unlocked bonus genetics: ${randomChunk.folders.length} new monster types!`);
    
    this.showEvolutionNotification(
      "💎 Rare Mutation!",
      `${randomChunk.folders.length} new monster types discovered!`
    );
  }
  
  /**
   * Load a specific chunk of monster parts
   */
  private loadChunk(chunk: PartChunk): void {
    if (chunk.loaded) return;
    
    console.log(`📦 Loading gene chunk ${chunk.id} with ${chunk.folders.length} monster types...`);
    
    // Load each folder in the chunk
    chunk.folders.forEach(folderPath => {
      this.loadMonsterFolder(folderPath);
    });
    
    chunk.loaded = true;
    this.loadedChunks.add(chunk.id);
    this.totalMonsterTypesAvailable += chunk.folders.length;
  }
  
  /**
   * Load parts from a specific monster folder
   */
  private loadMonsterFolder(folderPath: string): void {
    const basePath = `monster-parts/${folderPath}`;
    const folderKey = this.getFolderKey(folderPath);
    
    // Only try to load parts if we're dealing with Spine/Images folders or known direct folders
    if (!folderPath.includes('Spine/') && !DIRECT_MONSTER_FOLDERS.includes(folderPath)) {
      return; // Skip unknown folders
    }
    
    // Common parts to try loading - these are the most common across all monsters
    const partsToLoad = [
      'Body', 'Head', 'Mouth', 'Eye',
      'Hand_F', 'Hand_B', 'Leg_F', 'Leg_B'
    ];
    
    // Additional parts that some monsters might have
    const optionalParts = [
      'Eye1', 'Eye2', 'Wing', 'Wing_F', 'Wing_B', 'Tail', 'Neck',
      'Arm_F', 'Arm_B', 'Claw', 'Claw1', 'Claw2'
    ];
    
    // Load essential parts
    partsToLoad.forEach(part => {
      const key = `${folderKey}_${part.toLowerCase()}`;
      const path = `${basePath}/${part}.png`;
      
      if (!this.scene.textures.exists(key)) {
        // Only try to load if we're in an active loading state
        if (this.scene.load.isLoading() || this.scene.load.isReady()) {
          this.scene.load.image(key, path);
        }
      }
    });
    
    // Try optional parts but don't worry if they fail
    optionalParts.forEach(part => {
      const key = `${folderKey}_${part.toLowerCase()}`;
      const path = `${basePath}/${part}.png`;
      
      if (!this.scene.textures.exists(key)) {
        // Only try to load if we're in an active loading state
        if (this.scene.load.isLoading() || this.scene.load.isReady()) {
          this.scene.load.image(key, path);
        }
      }
    });
  }
  
  /**
   * Get all available monster folders
   */
  private getAllMonsterFolders(): string[] {
    // Use the actual folder names from MonsterPartsOptimized
    const folders: string[] = [];
    
    // Import the actual folders we know exist
    folders.push(...SPINE_MONSTER_FOLDERS);
    folders.push(...DIRECT_MONSTER_FOLDERS);
    
    // Shuffle for true randomization
    return this.shuffleArray(folders);
  }
  
  /**
   * Extract folder key from path
   */
  private getFolderKey(path: string): string {
    // Simple key extraction
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
    return lastPart.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  
  /**
   * Get milestone for current generation
   */
  private getMilestoneForGeneration(generation: number): EvolutionMilestone | null {
    // Find the highest milestone at or below current generation
    let applicable: EvolutionMilestone | null = null;
    
    for (const milestone of this.milestones) {
      if (milestone.generation <= generation) {
        applicable = milestone;
      }
    }
    
    return applicable;
  }
  
  /**
   * Show evolution notification in game
   */
  private showEvolutionNotification(title: string, message: string): void {
    // Create a fancy notification
    const notification = this.scene.add.group();
    
    const bg = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      100,
      400,
      80,
      0x000000,
      0.8
    );
    
    const titleText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      85,
      title,
      { fontSize: '20px', color: '#00ff00', fontStyle: 'bold' }
    ).setOrigin(0.5);
    
    const messageText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      110,
      message,
      { fontSize: '14px', color: '#ffffff' }
    ).setOrigin(0.5);
    
    notification.add(bg);
    notification.add(titleText);
    notification.add(messageText);
    
    // Fade in
    notification.setAlpha(0);
    this.scene.tweens.add({
      targets: notification.getChildren(),
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });
    
    // Fade out after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: notification.getChildren(),
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          notification.destroy(true);
        }
      });
    });
  }
  
  /**
   * Get current statistics
   */
  getStats(): {
    generation: number;
    babiesBorn: number;
    chunksLoaded: number;
    totalChunks: number;
    monsterTypesAvailable: number;
    percentUnlocked: number;
  } {
    const percentUnlocked = (this.loadedChunks.size / this.allAvailableChunks.length) * 100;
    
    return {
      generation: this.currentGeneration,
      babiesBorn: this.babiesBorn,
      chunksLoaded: this.loadedChunks.size,
      totalChunks: this.allAvailableChunks.length,
      monsterTypesAvailable: this.totalMonsterTypesAvailable,
      percentUnlocked: Math.round(percentUnlocked)
    };
  }
  
  /**
   * Get list of currently available monster types for procedural generation
   */
  getAvailableMonsterTypes(): string[] {
    const types: string[] = [];
    
    this.allAvailableChunks.forEach(chunk => {
      if (chunk.loaded) {
        chunk.folders.forEach(folder => {
          types.push(this.getFolderKey(folder));
        });
      }
    });
    
    return types;
  }
  
  /**
   * Shuffle array for true randomization
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
