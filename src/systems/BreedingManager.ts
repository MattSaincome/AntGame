import { Scene } from 'phaser';
import { GeneticsEngine } from '../genetics/GeneticsEngine';
import { MonsterGenetics, BreedingStatus, MonsterLifeStage, AUTOMATIC_BREEDING_INTERVAL, BREEDING_COOLDOWN } from '../genetics/GeneticsTypes';

export interface BreedingManagerConfig {
  hiveX: number;
  hiveY: number;
  onMonsterBred?: (offspring: MonsterGenetics[]) => void;
  onMonsterSentToHive?: (monster: any) => void;
}

/**
 * Manages monster breeding system including automatic and manual breeding
 */
export class BreedingManager {
  private scene: Scene;
  private config: BreedingManagerConfig;
  private hiveMonsters: any[] = []; // Monsters waiting at hive to breed
  private breedingQueue: any[] = []; // Monsters actively breeding
  private lastAutomaticBreeding: number = 0;
  private breedingCooldowns: Map<string, number> = new Map();
  
  constructor(scene: Scene, config: BreedingManagerConfig) {
    this.scene = scene;
    this.config = config;
  }
  
  /**
   * Update breeding system
   */
  update(deltaTime: number, monsters: any[]): void {
    // Update all monster ages and breeding cooldowns
    monsters.forEach(monster => {
      if (monster.genetics) {
        const lifeStage = GeneticsEngine.updateAge(monster.genetics, deltaTime / 1000);
        monster.lifeStage = lifeStage;
        
        // Update breeding cooldown tracking
        const monsterId = monster.genetics.uniqueId;
        const cooldown = this.breedingCooldowns.get(monsterId);
        if (cooldown !== undefined) {
          const newCooldown = Math.max(0, cooldown - deltaTime);
          this.breedingCooldowns.set(monsterId, newCooldown);
          
          if (newCooldown === 0) {
            this.breedingCooldowns.delete(monsterId);
          }
        }
      }
    });
    
    // Check for automatic breeding opportunities
    this.checkAutomaticBreeding(monsters);
    
    // Process breeding queue
    this.processBreedingQueue(deltaTime);
    
    // Process hive breeding
    this.processHiveBreeding();
  }
  
  /**
   * Send a monster to the hive for breeding
   */
  sendMonsterToHive(monster: any): void {
    if (!monster.genetics) return;
    
    const breedingStatus = GeneticsEngine.getBreedingStatus(monster.genetics);
    if (breedingStatus !== BreedingStatus.READY) {
      console.log('Monster is not ready for breeding:', breedingStatus);
      return;
    }
    
    // Mark monster as wanting to breed and at hive
    monster.genetics.wantsToBreed = true;
    monster.genetics.isAtHive = true;
    
    // Move monster to hive location
    monster.x = this.config.hiveX;
    monster.y = this.config.hiveY;
    
    // Add to hive collection
    if (!this.hiveMonsters.includes(monster)) {
      this.hiveMonsters.push(monster);
      console.log(`Monster ${monster.genetics.uniqueId} sent to hive for breeding`);
      
      if (this.config.onMonsterSentToHive) {
        this.config.onMonsterSentToHive(monster);
      }
    }
  }
  
  /**
   * Remove monster from hive (if player cancels breeding)
   */
  removeMonsterFromHive(monster: any): void {
    const index = this.hiveMonsters.findIndex(m => m.genetics.uniqueId === monster.genetics.uniqueId);
    if (index >= 0) {
      this.hiveMonsters.splice(index, 1);
      monster.genetics.wantsToBreed = false;
      monster.genetics.isAtHive = false;
      console.log(`Monster ${monster.genetics.uniqueId} removed from hive`);
    }
  }
  
  /**
   * Check for automatic breeding opportunities among monsters in the wild
   */
  private checkAutomaticBreeding(monsters: any[]): void {
    const now = Date.now();
    
    // Only check once per minute for automatic breeding
    if (now - this.lastAutomaticBreeding < AUTOMATIC_BREEDING_INTERVAL) {
      return;
    }
    
    // Find adult monsters not at hive and ready to breed
    const readyMonsters = monsters.filter(monster => {
      if (!monster.genetics) return false;
      
      const status = GeneticsEngine.getBreedingStatus(monster.genetics);
      const isInBreedingQueue = this.breedingQueue.some(b => 
        b.parent1.genetics.uniqueId === monster.genetics.uniqueId ||
        b.parent2.genetics.uniqueId === monster.genetics.uniqueId
      );
      
      return status === BreedingStatus.READY && 
             !monster.genetics.isAtHive && 
             !isInBreedingQueue &&
             monster.genetics.age >= monster.genetics.maturityAge;
    });
    
    // Random chance for automatic breeding to occur
    if (readyMonsters.length >= 2 && Math.random() < 0.1) { // 10% chance per check
      // Select two random monsters for breeding
      const parent1 = readyMonsters[Math.floor(Math.random() * readyMonsters.length)];
      let parent2;
      
      do {
        parent2 = readyMonsters[Math.floor(Math.random() * readyMonsters.length)];
      } while (parent2 === parent1 && readyMonsters.length > 1);
      
      if (parent1 !== parent2) {
        this.startBreeding(parent1, parent2, false); // Not forced breeding
        console.log(`Automatic breeding started between ${parent1.genetics.uniqueId} and ${parent2.genetics.uniqueId}`);
      }
    }
    
    this.lastAutomaticBreeding = now;
  }
  
  /**
   * Process hive breeding (manual breeding)
   */
  private processHiveBreeding(): void {
    // Find pairs of monsters at hive that want to breed
    const breedingReady = this.hiveMonsters.filter(monster => {
      if (!monster.genetics) return false;
      
      const status = GeneticsEngine.getBreedingStatus(monster.genetics);
      const isAlreadyBreeding = this.breedingQueue.some(b => 
        b.parent1.genetics.uniqueId === monster.genetics.uniqueId ||
        b.parent2.genetics.uniqueId === monster.genetics.uniqueId
      );
      
      return status === BreedingStatus.BREEDING && !isAlreadyBreeding;
    });
    
    // Pair up monsters for breeding
    while (breedingReady.length >= 2) {
      const parent1 = breedingReady.shift();
      const parent2 = breedingReady.shift();
      
      if (parent1 && parent2) {
        this.startBreeding(parent1, parent2, true); // Forced breeding at hive
        console.log(`Hive breeding started between ${parent1.genetics.uniqueId} and ${parent2.genetics.uniqueId}`);
      }
    }
  }
  
  /**
   * Start breeding process between two monsters
   */
  private startBreeding(parent1: any, parent2: any, isHiveBreeding: boolean): void {
    const breedingTime = isHiveBreeding ? 5000 : 10000; // 5s at hive, 10s in wild
    
    const breedingProcess = {
      parent1,
      parent2,
      startTime: Date.now(),
      breedingTime,
      isHiveBreeding
    };
    
    this.breedingQueue.push(breedingProcess);
    
    // Set breeding cooldowns
    this.breedingCooldowns.set(parent1.genetics.uniqueId, BREEDING_COOLDOWN * 1000);
    this.breedingCooldowns.set(parent2.genetics.uniqueId, BREEDING_COOLDOWN * 1000);
  }
  
  /**
   * Process active breeding queue
   */
  private processBreedingQueue(deltaTime: number): void {
    const now = Date.now();
    
    this.breedingQueue = this.breedingQueue.filter(breeding => {
      const elapsed = now - breeding.startTime;
      
      if (elapsed >= breeding.breedingTime) {
        // Breeding complete - create offspring
        this.completeBreeding(breeding);
        return false; // Remove from queue
      }
      
      return true; // Keep in queue
    });
  }
  
  /**
   * Complete breeding and create offspring
   */
  private completeBreeding(breeding: any): void {
    const { parent1, parent2, isHiveBreeding } = breeding;
    
    try {
      // Attempt breeding
      const result = GeneticsEngine.breed(parent1.genetics, parent2.genetics);
      
      if (result.success && result.offspring.length > 0) {
        console.log(`Breeding successful! Created ${result.offspring.length} offspring`);
        
        // Set breeding cooldowns for parents
        GeneticsEngine.setBreedingCooldown(parent1.genetics);
        GeneticsEngine.setBreedingCooldown(parent2.genetics);
        
        // If this was hive breeding, remove parents from hive
        if (isHiveBreeding) {
          parent1.genetics.wantsToBreed = false;
          parent1.genetics.isAtHive = false;
          parent2.genetics.wantsToBreed = false;
          parent2.genetics.isAtHive = false;
          
          this.removeMonsterFromHive(parent1);
          this.removeMonsterFromHive(parent2);
        }
        
        // Notify about new offspring
        if (this.config.onMonsterBred) {
          this.config.onMonsterBred(result.offspring);
        }
        
      } else {
        console.log('Breeding failed for parents:', parent1.genetics.uniqueId, parent2.genetics.uniqueId);
        
        // If hive breeding failed, keep monsters at hive to try again
        if (!isHiveBreeding) {
          // For wild breeding, set a shorter cooldown on failure
          this.breedingCooldowns.set(parent1.genetics.uniqueId, (BREEDING_COOLDOWN * 0.5) * 1000);
          this.breedingCooldowns.set(parent2.genetics.uniqueId, (BREEDING_COOLDOWN * 0.5) * 1000);
        }
      }
      
    } catch (error) {
      console.error('Error during breeding:', error);
    }
  }
  
  /**
   * Get breeding status for a monster
   */
  getMonsterBreedingStatus(monster: any): BreedingStatus {
    if (!monster.genetics) return BreedingStatus.NOT_READY;
    
    return GeneticsEngine.getBreedingStatus(monster.genetics);
  }
  
  /**
   * Get monsters currently at hive
   */
  getHiveMonsters(): any[] {
    return [...this.hiveMonsters];
  }
  
  /**
   * Get active breeding pairs
   */
  getActiveBreeding(): any[] {
    return [...this.breedingQueue];
  }
  
  /**
   * Check if monster is in breeding cooldown
   */
  isInBreedingCooldown(monsterId: string): boolean {
    return this.breedingCooldowns.has(monsterId);
  }
  
  /**
   * Get remaining breeding cooldown time
   */
  getBreedingCooldownTime(monsterId: string): number {
    return this.breedingCooldowns.get(monsterId) || 0;
  }
  
  /**
   * Get breeding statistics
   */
  getBreedingStats(): any {
    return {
      hiveMonsters: this.hiveMonsters.length,
      activeBreeding: this.breedingQueue.length,
      totalCooldowns: this.breedingCooldowns.size
    };
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.hiveMonsters.length = 0;
    this.breedingQueue.length = 0;
    this.breedingCooldowns.clear();
  }
}
