import Phaser from 'phaser';
import { Monster } from '../entities/Monster';
import { BabyMonster } from '../entities/BabyMonster';
import { GeneticsEngine } from '../genetics/GeneticsEngine';
import { MonsterGenetics } from '../genetics/GeneticsTypes';

export interface BreedingPair {
  parent1: Monster;
  parent2: Monster;
  breedingStartTime: number;
  breedingDuration: number;
  isBreeding: boolean;
}

export class BreedingSystem {
  private scene: Phaser.Scene;
  private breeders: Monster[] = [];
  private babies: BabyMonster[] = [];
  private activePairs: BreedingPair[] = [];
  private hivePosition: { x: number; y: number };

  constructor(scene: Phaser.Scene, hiveX: number, hiveY: number) {
    this.scene = scene;
    this.hivePosition = { x: hiveX, y: hiveY };
  }

  /**
   * Set a monster as breeder or remove breeder status
   */
  toggleBreeder(monster: Monster): void {
    if (monster.isBreeder) {
      // Remove breeder status
      monster.isBreeder = false;
      monster.isAtHive = false;
      const index = this.breeders.findIndex(b => b.id === monster.id);
      if (index !== -1) {
        this.breeders.splice(index, 1);
      }
      console.log(`${monster.id} is no longer a breeder`);
    } else {
      // Set as breeder
      monster.isBreeder = true;
      this.breeders.push(monster);
      console.log(`${monster.id} is now a breeder`);
    }
  }

  /**
   * Update breeding system each frame
   */
  update(deltaTime: number): void {
    this.updateBreeders(deltaTime);
    this.updateBreedingPairs(deltaTime);
    this.updateBabies(deltaTime);
  }

  /**
   * Update breeder behavior - move to hive
   */
  private updateBreeders(deltaTime: number): void {
    this.breeders.forEach(breeder => {
      if (!breeder.isAtHive) {
        // Move breeder to hive
        const dx = this.hivePosition.x - breeder.position.x;
        const dy = this.hivePosition.y - breeder.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) {
          // Arrived at hive
          breeder.isAtHive = true;
          breeder.position.x = this.hivePosition.x + (Math.random() - 0.5) * 40;
          breeder.position.y = this.hivePosition.y + (Math.random() - 0.5) * 40;
          console.log(`${breeder.id} arrived at hive for breeding`);
        } else {
          // Move toward hive
          const speed = 50 * deltaTime;
          breeder.position.vx = (dx / distance) * speed;
          breeder.position.vy = (dy / distance) * speed;
          breeder.target = this.hivePosition;
        }
      }
    });

    // Check for potential breeding pairs
    this.checkForBreedingOpportunities();
  }

  /**
   * Check if two breeders can start breeding
   */
  private checkForBreedingOpportunities(): void {
    const availableBreeders = this.breeders.filter(b => 
      b.isAtHive && 
      b.breedingCooldown <= 0 && 
      !this.activePairs.some(pair => pair.parent1 === b || pair.parent2 === b)
    );

    // Need at least 2 available breeders
    if (availableBreeders.length >= 2) {
      for (let i = 0; i < availableBreeders.length - 1; i++) {
        for (let j = i + 1; j < availableBreeders.length; j++) {
          const parent1 = availableBreeders[i];
          const parent2 = availableBreeders[j];
          
          // Check compatibility and distance
          const distance = Math.sqrt(
            Math.pow(parent1.position.x - parent2.position.x, 2) +
            Math.pow(parent1.position.y - parent2.position.y, 2)
          );
          
          if (distance < 50 && this.canBreed(parent1, parent2)) {
            this.startBreeding(parent1, parent2);
            return; // Only one pair at a time
          }
        }
      }
    }
  }

  /**
   * Check if two monsters can breed together
   */
  private canBreed(monster1: Monster, monster2: Monster): boolean {
    // Basic breeding rules
    if (monster1.id === monster2.id) return false; // Can't breed with self
    if (monster1.breedingCooldown > 0 || monster2.breedingCooldown > 0) return false;
    if (monster1.age < 10 || monster2.age < 10) return false; // Must be mature
    
    // Could add more complex rules like genetic diversity checks
    return true;
  }

  /**
   * Start breeding between two monsters
   */
  private startBreeding(parent1: Monster, parent2: Monster): void {
    const fertilityAvg = (parent1.stats.fertility + parent2.stats.fertility) / 2;
    const breedingDuration = 8 + Math.random() * 4; // 8-12 seconds
    
    const pair: BreedingPair = {
      parent1,
      parent2,
      breedingStartTime: Date.now(),
      breedingDuration: breedingDuration * 1000, // Convert to milliseconds
      isBreeding: true
    };
    
    this.activePairs.push(pair);
    
    // Set breeding partners
    parent1.breedingPartner = parent2;
    parent2.breedingPartner = parent1;
    
    console.log(`${parent1.id} and ${parent2.id} started breeding!`);
    
    // Create breeding animation
    this.createBreedingAnimation(parent1, parent2);
  }

  /**
   * Create visual breeding animation
   */
  private createBreedingAnimation(parent1: Monster, parent2: Monster): void {
    // Hearts animation above the breeding pair
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const heart = this.scene.add.graphics();
        const heartX = (parent1.position.x + parent2.position.x) / 2;
        const heartY = (parent1.position.y + parent2.position.y) / 2 - 20;
        
        heart.fillStyle(0xFF69B4, 0.8); // Pink hearts
        heart.fillCircle(heartX - 3, heartY, 4);
        heart.fillCircle(heartX + 3, heartY, 4);
        heart.fillTriangle(heartX - 6, heartY + 2, heartX + 6, heartY + 2, heartX, heartY + 8);
        
        // Animate heart floating up
        this.scene.tweens.add({
          targets: heart,
          y: heartY - 30,
          alpha: 0,
          duration: 2000,
          ease: 'Power2',
          onComplete: () => heart.destroy()
        });
      }, i * 500);
    }
  }

  /**
   * Update active breeding pairs
   */
  private updateBreedingPairs(deltaTime: number): void {
    this.activePairs = this.activePairs.filter(pair => {
      const elapsed = Date.now() - pair.breedingStartTime;
      
      if (elapsed >= pair.breedingDuration) {
        // Breeding complete - create babies!
        this.completeBreeeding(pair);
        return false; // Remove from active pairs
      }
      
      return true; // Keep breeding
    });
  }

  /**
   * Complete breeding and create babies
   */
  private completeBreeeding(pair: BreedingPair): void {
    const { parent1, parent2 } = pair;
    
    // Calculate number of babies based on genetics
    const fertilityScore = (parent1.stats.fertility + parent2.stats.fertility) / 2;
    const baseChance = fertilityScore / 255;
    
    let babyCount = 1; // At least 1 baby
    if (Math.random() < baseChance * 0.8) babyCount++; // Second baby
    if (Math.random() < baseChance * 0.4) babyCount++; // Third baby (rare)
    
    console.log(`${parent1.id} and ${parent2.id} had ${babyCount} babies!`);
    
    // Create babies with combined genetics
    for (let i = 0; i < babyCount; i++) {
      const babyGenetics = GeneticsEngine.combineGenetics(parent1.genetics, parent2.genetics);
      const babyX = this.hivePosition.x + (Math.random() - 0.5) * 60;
      const babyY = this.hivePosition.y + (Math.random() - 0.5) * 60;
      
      const baby = new BabyMonster(babyGenetics, babyX, babyY, true);
      baby.createSprite(this.scene);
      this.babies.push(baby);
    }
    
    // Set breeding cooldown for parents
    parent1.breedingCooldown = 60 + Math.random() * 30; // 60-90 seconds
    parent2.breedingCooldown = 60 + Math.random() * 30;
    parent1.breedingPartner = null;
    parent2.breedingPartner = null;
    
    // Create birth celebration effect
    this.createBirthEffect();
  }

  /**
   * Create celebration effect for new births
   */
  private createBirthEffect(): void {
    // Sparkle effect at hive
    for (let i = 0; i < 10; i++) {
      const sparkle = this.scene.add.graphics();
      const sparkleX = this.hivePosition.x + (Math.random() - 0.5) * 80;
      const sparkleY = this.hivePosition.y + (Math.random() - 0.5) * 80;
      
      sparkle.fillStyle(0xFFD700, 0.8); // Golden sparkles
      sparkle.fillCircle(sparkleX, sparkleY, 2);
      
      this.scene.tweens.add({
        targets: sparkle,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 1500,
        delay: i * 100,
        ease: 'Power2',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  /**
   * Update babies - check for growth
   */
  private updateBabies(deltaTime: number): void {
    this.babies = this.babies.filter(baby => {
      baby.update(deltaTime);
      baby.updateSprite();
      
      if (baby.isReadyToGrowUp()) {
        // Baby becomes adult!
        this.graduateBaby(baby);
        return false; // Remove from babies array
      }
      
      return true; // Keep as baby
    });
  }

  /**
   * Graduate baby to adult monster
   */
  private graduateBaby(baby: BabyMonster): Monster {
    console.log(`Baby ${baby.id} grew up into an adult!`);
    
    // Create adult monster from baby
    const adult = new Monster(baby.genetics, baby.position.x, baby.position.y, baby.isPlayerOwned);
    
    // Clean up baby sprite
    baby.destroy();
    
    // Create growth animation
    this.createGrowthEffect(adult.position.x, adult.position.y);
    
    return adult;
  }

  /**
   * Create growth effect when baby becomes adult
   */
  private createGrowthEffect(x: number, y: number): void {
    // Growth sparkle ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkleX = x + Math.cos(angle) * 20;
      const sparkleY = y + Math.sin(angle) * 20;
      
      const sparkle = this.scene.add.graphics();
      sparkle.fillStyle(0x32CD32, 0.9); // Lime green for growth
      sparkle.fillCircle(sparkleX, sparkleY, 3);
      
      this.scene.tweens.add({
        targets: sparkle,
        x: x,
        y: y,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  /**
   * Get all current babies
   */
  getBabies(): BabyMonster[] {
    return [...this.babies];
  }

  /**
   * Get all current breeders
   */
  getBreeders(): Monster[] {
    return [...this.breeders];
  }

  /**
   * Get breeding pairs count
   */
  getActiveBreedingPairs(): number {
    return this.activePairs.length;
  }
}
