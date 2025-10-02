import { MonsterGenetics, MonsterType, MonsterStats, MonsterLifeStage, BreedingStatus } from '../genetics/GeneticsTypes';
import { GeneticsEngine } from '../genetics/GeneticsEngine';
import { Tile, TILE_SIZE, TileType } from '../world/TileTypes';
import { bugMonitor } from '../systems/BugMonitor';
import { PheromoneSystem, PheromoneType } from '../systems/PheromoneSystem';

// Task Priority System
export enum TaskPriority {
  CRITICAL = 5,    // Emergency/survival (low energy, danger)
  HIGH = 4,        // USER PHEROMONE COMMANDS (highest user priority)
  MEDIUM = 3,      // Important autonomous tasks (breeding, returning home)
  LOW = 2,         // Normal activities (exploration, idle mining)
  BACKGROUND = 1   // Passive behaviors (wandering)
}

export interface Task {
  id: string;
  priority: TaskPriority;
  type: MonsterAction;
  target?: { x: number; y: number };
  description: string;
  createdAt: number;
  expiresAt?: number;
  userGenerated: boolean; // True if task comes from user pheromone
}

export enum MonsterState {
  IDLE = 'idle',
  MOVING = 'moving',
  MINING = 'mining',
  CARRYING = 'CARRYING',
  FIGHTING = 'FIGHTING',
  FLEEING = 'FLEEING',
  RESTING = 'RESTING',
  SLEEPING = 'SLEEPING',
  BREEDING = 'breeding',
  DEAD = 'DEAD'
}

export enum MonsterAction {
  WANDER = 'wander',
  MINE_NEARBY = 'mine_nearby',
  EXPLORE = 'explore',
  ATTACK_ENEMY = 'attack_enemy',
  FLEE_DANGER = 'flee_danger',
  SEEK_MATE = 'seek_mate',
  RETURN_HOME = 'return_home',
  CARRY_RESOURCE = 'carry_resource',
  HELP_CARRY = 'help_carry'
}

export interface MonsterPosition {
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  onGround: boolean;
}
export class Monster {
  public id: string;
  public genetics: MonsterGenetics;
  public stats: MonsterStats;
  public position: { x: number; y: number; vx: number; vy: number; onGround: boolean };
  public energy: number = 100;
  public maxEnergy: number = 100;
  public health: number = 100;
  public maxHealth: number = 100;
  public age: number = 0;
  public generation: number = 1;
  public carryingResources: number;
  public actionTimer: number;
  public aiCooldown: number;
  public homePosition: { x: number; y: number };
  public isPlayerOwned: boolean;

  // Resource carrying properties
  public carryingChunkId: string | null;
  public carryingStrength: number; // How much weight this monster can help carry
  public helpingCarryChunkId: string | null; // When helping another monster

  // Ant-like memory and trail system
  public lastSuccessfulMiningSpot: { x: number; y: number } | null;
  public successfulMiningMemory: Array<{ x: number; y: number; reward: number; timestamp: number }>;
  public shouldReturnToMining: boolean;

  // Wall-crawling system
  public isWallCrawling: boolean;
  public crawlingDirection: { x: number; y: number } | null;
  public facingBackward: boolean; // For sprite rendering

  // Breeding system
  public isBreeder: boolean;
  public isAtHive: boolean;
  public breedingCooldown: number;
  public breedingPartner: Monster | null;

  // Rest and energy system
  public needsRest: boolean;
  public restTimer: number;
  public isRestingAtHive: boolean;
  public explorationTarget: { x: number; y: number } | null;
  public explorationTimer: number;
  public preferredDirection: 'left' | 'right';
  public autonomousMiningChance: number;

  // Priority Task System - TO-DO LIST
  public currentTask: Task | null;
  public taskQueue: Task[];
  private lastPheromoneCheck: number;
  
  // Mining memory for returning to mining spots
  public miningTarget: { x: number; y: number; direction: 'left' | 'right' | 'down' } | null;
  public miningDepth: number; // How deep we've mined in current shaft
  public energyThreshold: number; // When to start seeking rest

  // Additional wall crawling properties
  public lastWallCrawlAttempt: number;
  
  // Mining hit tracking for satisfying mining feedback
  public lastMiningHit: number = 0;
  
  // Resource throwing for pyramid climbing
  public thrownResourceId: string | null = null;
  public isClimbing: boolean = false;
  public climbTarget: { x: number; y: number } | null = null;
  
  // AI state management
  public state: MonsterState = MonsterState.IDLE;
  public currentAction: MonsterAction = MonsterAction.EXPLORE;
  public target: { x: number; y: number } | null = null;
  public lastBreedTime: number = 0;
  public wanderTarget: { x: number; y: number } | null = null;
  public wallCrawlCooldown: number = 0;
  
  // Advanced stuck detection for pathfinding
  public lastStuckCheck: number = 0;
  public consecutiveStuckCount: number = 0;
  public lastSuperJump: number = 0;

  // Fall damage and stuck detection system
  // Physics state
  public isFalling: boolean = false;
  public fallHeight: number = 0;
  public fallStartY: number = 0;
  public isStunned: boolean = false;
  public lastPosition: { x: number; y: number };
  public stuckTimer: number;
  public stuckCheckInterval: number;
  public spawnTime: number; // Track when monster was created
  public lastStuckDetection: number; // Prevent spam detection
  
  // Mario-style jump system
  public hasJumped: boolean = false; // Currently in a jump
  public canDoubleJump: boolean = false; // Can perform double-jump
  
  // Movement history for stuck detection
  public movementHistory: { x: number; y: number; time: number }[] = [];
  
  // Jumping stuck detection
  public jumpCount: number = 0;
  public lastJumpTime: number = 0;
  public positionBeforeJumps: { x: number; y: number } | null = null;
  public jumpStuckCounter: number = 0;

  // Visual properties
  public sprite: Phaser.GameObjects.Container | null = null; // Now a container for multi-part sprites
  public healthBar: Phaser.GameObjects.Graphics | null = null;
  public lifeStage: MonsterLifeStage = MonsterLifeStage.ADULT;
  public lastBreedingStatusCheck: number = 0;

  constructor(genetics: MonsterGenetics, startX: number, startY: number, isPlayerOwned: boolean = true) {
    this.id = genetics.uniqueId;
    this.genetics = genetics;
    this.stats = GeneticsEngine.calculateStats(genetics);
    this.isPlayerOwned = isPlayerOwned;
    
    // Initialize life stage based on age
    this.lifeStage = this.genetics.age === 0 ? MonsterLifeStage.BABY : 
                     this.genetics.age < this.genetics.maturityAge ? MonsterLifeStage.JUVENILE : 
                     MonsterLifeStage.ADULT;
    
    this.position = {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      onGround: false
    };

    this.state = MonsterState.MOVING;
    this.currentAction = MonsterAction.EXPLORE; // Start exploring immediately
    this.target = null;
    this.energy = 100; // Start with full energy
    this.age = 0;
    this.lastBreedTime = 0;
    this.carryingResources = 0;
    this.actionTimer = 0;
    this.aiCooldown = 0;
    this.homePosition = { x: startX, y: startY };
    
    // Initialize carrying properties
    this.carryingChunkId = null;
    this.helpingCarryChunkId = null;
    this.carryingStrength = Math.floor(this.genetics.strength.value / 255 * 50) + 10; // 10-60 carrying strength

    // Initialize ant-like memory system
    this.lastSuccessfulMiningSpot = null;
    this.successfulMiningMemory = [];
    this.shouldReturnToMining = false;

    // Initialize wall-crawling system
    this.isWallCrawling = false;
    this.crawlingDirection = null;
    this.facingBackward = false;

    // Initialize breeding system  
    this.isBreeder = false;
    this.isAtHive = this.genetics.isAtHive;
    this.breedingCooldown = this.genetics.breedingCooldown;
    this.breedingPartner = null;
    this.lastBreedingStatusCheck = 0;

    // Initialize rest system
    this.needsRest = false;
    this.restTimer = 0;
    this.isRestingAtHive = false;
    this.energyThreshold = 10 + Math.random() * 10; // 10-20 energy threshold - much lower!

    // Initialize exploration system with immediate target
    this.explorationTarget = {
      x: startX + (Math.random() < 0.5 ? -300 : 300), // Move left or right away from hive
      y: startY + Math.random() * 200 - 100 // Slight vertical variation
    };
    this.explorationTimer = 0;
    this.preferredDirection = Math.random() < 0.5 ? 'left' : 'right';
    this.autonomousMiningChance = 0.02 + Math.random() * 0.08; // 2-10% chance to mine autonomously (much rarer)

    // Initialize wall-crawling cooldown system
    this.wallCrawlCooldown = 0;
    this.lastWallCrawlAttempt = 0;

    // Initialize Priority Task System
    this.currentTask = null;
    this.taskQueue = [];
    this.lastPheromoneCheck = 0;
    
    // Initialize mining memory
    this.miningTarget = null;
    this.miningDepth = 0;

    // Initialize fall damage and stuck detection
    this.isFalling = false;
    this.fallStartY = startY;
    this.lastPosition = { x: startX, y: startY };
    this.stuckTimer = 0;
    this.stuckCheckInterval = 10; // Check every 10 seconds (less frequent)
    this.spawnTime = Date.now();
    this.lastStuckDetection = 0;
  }

  /**
   * Update monster logic each frame
   */
  update(deltaTime: number, pheromoneSystem?: PheromoneSystem, world?: Tile[][]): void {
    this.age += deltaTime;
    this.actionTimer += deltaTime;
    this.aiCooldown = Math.max(0, this.aiCooldown - deltaTime);
    this.wallCrawlCooldown = Math.max(0, this.wallCrawlCooldown - deltaTime);
    
    // Update genetics age and life stage
    this.lifeStage = GeneticsEngine.updateAge(this.genetics, deltaTime);
    
    // Only adult monsters can do complex actions
    if (this.lifeStage !== MonsterLifeStage.ADULT) {
      this.restrictBehaviorForLifeStage();
    }

    // Update fall damage and stuck detection systems
    this.updateFallDamage(deltaTime);
    this.updateStuckDetection(deltaTime);

    // Update rest system
    this.updateRest(deltaTime);

    // Update energy consumption
    this.updateEnergy(deltaTime);

    // Die if no energy or too old
    if (this.energy <= 0 || this.shouldDieFromAge()) {
      this.state = MonsterState.DEAD;
      this.die();
      return;
    }

    // Update AI decisions periodically
    if (this.aiCooldown <= 0) {
      this.updateAI();
      this.aiCooldown = 1 + Math.random() * 2; // 1-3 second AI update interval
    }

    // Execute current action
    this.executeCurrentAction(deltaTime);

    // Update visual representation
    this.updateVisuals();
  }

  /**
   * Update fall damage system - monsters take damage when falling while carrying
   */
  private updateFallDamage(deltaTime: number): void {
    const fallingVelocity = this.position.vy;
    const isCarrying = this.carryingResources > 0 || this.carryingChunkId !== null;

    // Detect if falling
    if (fallingVelocity > 50 && !this.position.onGround) {
      if (!this.isFalling) {
        this.isFalling = true;
        this.fallStartY = this.position.y;
      }

      // If carrying something, can't wall crawl - must fall
      if (isCarrying && this.isWallCrawling) {
        console.log(`${this.id} can't wall crawl while carrying - forced to fall!`);
        this.isWallCrawling = false;
        this.facingBackward = false;
      }
    } else if (this.position.onGround && this.isFalling) {
      // Just landed - check for fall damage
      const fallDistance = this.position.y - this.fallStartY;
      
      if (fallDistance > 100 && isCarrying) { // Significant fall while carrying
        const damage = Math.floor(fallDistance / 50); // 1 damage per 50 pixels
        this.stats.currentHealth -= damage;
        this.energy -= damage * 5; // Also lose energy
        
        console.log(`${this.id} took ${damage} fall damage! (fell ${Math.floor(fallDistance)} pixels while carrying)`);
        
        // Drop what they're carrying from the impact
        if (this.carryingChunkId) {
          console.log(`${this.id} dropped carried item from fall damage!`);
          this.dropCarriedItem();
        }
      }
      
      this.isFalling = false;
    }
  }

  /**
   * Update stuck detection system - IMPROVED to prevent false positives and crashes
   */
  private updateStuckDetection(deltaTime: number): void {
    // Check if bug monitor has disabled stuck detection due to overload
    if (bugMonitor.isStuckDetectionDisabled()) {
      this.stuckTimer = 0; // Reset to prevent buildup
      return;
    }
    
    this.stuckTimer += deltaTime;
    
    // Check if stuck every interval
    if (this.stuckTimer >= this.stuckCheckInterval) {
      const currentTime = Date.now();
      const currentPos = { x: this.position.x, y: this.position.y };
      const distanceMoved = Math.sqrt(
        Math.pow(currentPos.x - this.lastPosition.x, 2) + 
        Math.pow(currentPos.y - this.lastPosition.y, 2)
      );
      
      // GRACE PERIOD: Don't check stuck detection for first 30 seconds after spawn
      const timeSinceSpawn = currentTime - this.spawnTime;
      if (timeSinceSpawn < 30000) {
        this.lastPosition = { ...currentPos };
        this.stuckTimer = 0;
        return;
      }
      
      // SPAM PREVENTION: Don't detect stuck more than once per minute
      if (currentTime - this.lastStuckDetection < 60000) {
        this.lastPosition = { ...currentPos };
        this.stuckTimer = 0;
        return;
      }
      
      // IMPROVED CONDITIONS: Only consider stuck if:
      // 1. Moved very little (< 10 pixels in 10 seconds)
      // 2. Not in a resting/idle state 
      // 3. Actually trying to move (has velocity or target)
      // 4. Surrounded by walls (new check)
      const isActivelyMoving = this.target !== null || Math.abs(this.position.vx) > 5 || Math.abs(this.position.vy) > 5;
      const isRestingOrIdle = this.state === MonsterState.RESTING || 
                             this.state === MonsterState.SLEEPING || 
                             this.state === MonsterState.IDLE;
      
      if (distanceMoved < 10 && 
          !isRestingOrIdle && 
          isActivelyMoving && 
          this.isActuallySurroundedByWalls()) {
        
        // Check with bug monitor before marking as stuck
        if (bugMonitor.monitorStuckMonster(this.id, true)) {
          console.log(`${this.id} appears genuinely stuck! Moved ${Math.floor(distanceMoved)} pixels in ${this.stuckCheckInterval}s, surrounded by walls`);
          this.handleStuckSituation();
          this.lastStuckDetection = currentTime;
        } else {
          console.log(`${this.id} stuck detection blocked by bug monitor (too many stuck monsters)`);
        }
      } else {
        // Monster is not stuck - notify bug monitor
        bugMonitor.monitorStuckMonster(this.id, false);
      }
      
      // Reset timer and position
      this.lastPosition = { ...currentPos };
      this.stuckTimer = 0;
    }
  }

  /**
   * Check if monster is actually surrounded by walls (proper stuck detection)
   */
  private isActuallySurroundedByWalls(): boolean {
    // This should be implemented by the GameScene to check surrounding tiles
    // For now, we'll be more conservative and return false to prevent false positives
    
    // TODO: This method should check the 8 surrounding tiles around the monster
    // and return true only if most/all directions are blocked by solid tiles
    
    // Conservative approach: assume monsters are rarely actually stuck
    // This prevents the infinite loop issue while we implement proper wall detection
    return false;
  }

  /**
   * Handle when monster is detected as stuck - MUCH LESS AGGRESSIVE
   */
  private handleStuckSituation(): void {
    // First, drop anything being carried to free up movement options
    if (this.carryingChunkId || this.carryingResources > 0) {
      console.log(`${this.id} dropping carried items to escape being stuck`);
      this.dropCarriedItem();
      this.carryingResources = 0;
    }

    // Add high-priority escape task
    this.addTask({
      id: `escape_stuck_${Date.now()}`,
      priority: TaskPriority.HIGH,
      type: MonsterAction.WANDER,
      description: 'Escape from stuck position',
      createdAt: Date.now(),
      expiresAt: Date.now() + 15000, // 15 second timeout
      userGenerated: false
    });

    // Enable wall crawling to help escape
    this.wallCrawlCooldown = 0; // Reset cooldown
    this.isWallCrawling = true;
    console.log(`${this.id} attempting wall crawl escape from stuck position`);
  }

  /**
   * Drop carried item (placeholder - should be implemented by GameScene)
   */
  private dropCarriedItem(): void {
    // TODO: This should notify GameScene to actually drop the resource chunk
    this.carryingChunkId = null;
    this.helpingCarryChunkId = null;
  }

  /**
   * Handle monster death
   */
  private die(): void {
    console.log(`Monster ${this.id} has died (age: ${Math.floor(this.age)}s, energy: ${Math.floor(this.energy)}%)`);
    
    // Drop any carried items
    this.dropCarriedItem();
    
    // Clear all tasks
    this.taskQueue = [];
    this.currentTask = null;
    
    // Set final state
    this.state = MonsterState.DEAD;
  }

  /**
   * Update energy based on activity and genetics
   */
  private updateEnergy(deltaTime: number): void {
    const baseConsumption = 0.1; // MUCH lower energy consumption
    const metabolismEfficiency = (this.stats.energyEfficiency / 255) * 0.3 + 0.7; // 70-100% efficiency
    
    let activityMultiplier = 1;
    switch (this.state) {
      case MonsterState.MINING:
        activityMultiplier = 1.2; // Reduced from 2
        break;
      case MonsterState.FIGHTING:
        activityMultiplier = 1.5; // Reduced from 3
        break;
      case MonsterState.MOVING:
        activityMultiplier = 1.1; // Reduced from 1.5
        break;
      case MonsterState.IDLE:
        activityMultiplier = 0.1; // Very low idle consumption
        break;
      case MonsterState.RESTING:
        activityMultiplier = -0.5; // Actually RECOVER energy while resting
        break;
    }

    const energyChange = baseConsumption * activityMultiplier * (2 - metabolismEfficiency) * deltaTime;
    this.energy = Math.max(0, Math.min(100, this.energy - energyChange));

    // Always recover energy when resting or idle
    if (this.state === MonsterState.RESTING || this.state === MonsterState.IDLE) {
      this.energy = Math.min(100, this.energy + 5 * deltaTime); // Fast recovery
    }
  }

  /**
   * Check if monster should die from age
   */
  private shouldDieFromAge(): boolean {
    const baseLifespan = 300; // 5 minutes base lifespan
    const geneticLifespan = (this.stats.energyEfficiency / 255) * 200; // Up to 3+ minutes bonus
    const totalLifespan = baseLifespan + geneticLifespan;
    
    if (this.age > totalLifespan * 0.8) {
      const deathChance = (this.age - totalLifespan * 0.8) / (totalLifespan * 0.2);
      return Math.random() < deathChance * 0.01; // 1% chance per frame when old
    }
    
    return false;
  }

  /**
   * NEW PRIORITY-BASED AI SYSTEM WITH TO-DO LIST
   */
  private updateAI(pheromoneSystem?: PheromoneSystem, world?: Tile[][]): void {
    if (this.state === MonsterState.DEAD) return;

    // 1. CRITICAL PRIORITY: Immediate survival threats
    if (this.detectNearbyEnemies()) {
      this.addTask({
        id: `combat_${Date.now()}`,
        priority: TaskPriority.CRITICAL,
        type: MonsterAction.FLEE_DANGER,
        description: 'Enemy detected - flee!',
        createdAt: Date.now(),
        userGenerated: false
      });
    }

    // 2. CRITICAL PRIORITY: Energy emergency
    if (this.energy < 15) {
      this.addTask({
        id: `energy_emergency_${Date.now()}`,
        priority: TaskPriority.CRITICAL,
        type: MonsterAction.RETURN_HOME,
        description: 'Energy critical - return to hive',
        createdAt: Date.now(),
        userGenerated: false
      });
    }

    // 3. Check for USER PHEROMONE COMMANDS (HIGH PRIORITY)
    if (pheromoneSystem) {
      this.checkForUserPheromones(pheromoneSystem, world);
    }

    // 4. MEDIUM PRIORITY: Breeding
    if (this.canBreed()) {
      this.addTask({
        id: `breeding_${Date.now()}`,
        priority: TaskPriority.MEDIUM,
        type: MonsterAction.SEEK_MATE,
        description: 'Ready to breed',
        createdAt: Date.now(),
        userGenerated: false
      });
    }

    // 5. Execute highest priority task
    this.executeHighestPriorityTask();
  }

  /**
   * Check for user-placed pheromones nearby (HIGH PRIORITY)
   */
  private checkForUserPheromones(pheromoneSystem: PheromoneSystem, world?: Tile[][]): void {
    // Check every 2 seconds to avoid spam
    const now = Date.now();
    if (now - this.lastPheromoneCheck < 2000) return;
    this.lastPheromoneCheck = now;

    // Get current tile position
    const tileX = Math.floor(this.position.x / TILE_SIZE);
    const tileY = Math.floor(this.position.y / TILE_SIZE);
    
    // Look for MINE_HERE pheromones in a wider area (5x5)
    let closestMineTarget: {x: number, y: number, distance: number} | null = null;
    
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const checkTileX = tileX + dx;
        const checkTileY = tileY + dy;
        
        // Check if there's a MINE_HERE pheromone at this location
        if (pheromoneSystem.hasPheromone(checkTileX, checkTileY, PheromoneType.MINE_HERE)) {
          const distance = Math.abs(dx) + Math.abs(dy);
          if (!closestMineTarget || distance < closestMineTarget.distance) {
            closestMineTarget = {x: checkTileX, y: checkTileY, distance};
          }
        }
      }
    }
    
    // If we found a MINE_HERE pheromone, create a high-priority mining task
    if (closestMineTarget) {
      const worldX = closestMineTarget.x * TILE_SIZE + TILE_SIZE / 2;
      const worldY = closestMineTarget.y * TILE_SIZE + TILE_SIZE / 2;
      
      // Determine mining direction based on which side of the target we're on
      const direction = worldX < this.position.x ? 'left' : 'right';
      
      // Set mining target for memory
      this.miningTarget = {
        x: worldX,
        y: worldY,
        direction
      };
      this.miningDepth = 0;
      
      // Add high-priority mining task
      this.addTask({
        id: `user_mine_${closestMineTarget.x}_${closestMineTarget.y}`,
        priority: TaskPriority.HIGH,
        type: MonsterAction.MINE_NEARBY,
        target: { x: worldX, y: worldY },
        description: `USER COMMAND: Mine at (${closestMineTarget.x}, ${closestMineTarget.y})`,
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000, // 60 second timeout
        userGenerated: true
      });
    }
  }

  /**
   * Check for specific pheromone at coordinates and create task
   */
  private checkPheromoneAt(tileX: number, tileY: number): void {
    // TODO: This will be connected to GameScene's pheromone system
    // const pheromone = gameScene.pheromoneSystem.getPheromoneAt(tileX, tileY);
    // if (pheromone && pheromone.userGenerated) {
    //   this.createTaskFromPheromone(pheromone, tileX, tileY);
    // }
  }

  /**
   * Create high-priority task from user pheromone
   */
  public createTaskFromPheromone(pheromoneType: string, tileX: number, tileY: number): void {
    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;

    switch (pheromoneType) {
      case 'MINE_HERE':
        this.addTask({
          id: `user_mine_${tileX}_${tileY}`,
          priority: TaskPriority.HIGH,
          type: MonsterAction.MINE_NEARBY,
          target: { x: worldX, y: worldY },
          description: `USER COMMAND: Mine at (${tileX}, ${tileY})`,
          createdAt: Date.now(),
          expiresAt: Date.now() + 30000, // 30 second timeout
          userGenerated: true
        });
        break;
      
      case 'SAFE_ZONE':
        this.addTask({
          id: `user_safe_${tileX}_${tileY}`,
          priority: TaskPriority.HIGH,
          type: MonsterAction.WANDER,
          target: { x: worldX, y: worldY },
          description: `USER COMMAND: Go to safe zone (${tileX}, ${tileY})`,
          createdAt: Date.now(),
          expiresAt: Date.now() + 20000,
          userGenerated: true
        });
        break;
      
      case 'DANGER_ZONE':
        // Create flee task away from danger zone
        const fleeX = this.position.x + (this.position.x - worldX) * 2; // Flee in opposite direction
        const fleeY = this.position.y + (this.position.y - worldY) * 2;
        
        this.addTask({
          id: `user_flee_${tileX}_${tileY}`,
          priority: TaskPriority.HIGH,
          type: MonsterAction.FLEE_DANGER,
          target: { x: fleeX, y: fleeY },
          description: `USER COMMAND: Avoid danger at (${tileX}, ${tileY})`,
          createdAt: Date.now(),
          expiresAt: Date.now() + 15000,
          userGenerated: true
        });
        break;
    }
  }

  /**
   * Add a task to the priority queue
   */
  private addTask(task: Task): void {
    // Remove duplicate tasks of the same type
    this.taskQueue = this.taskQueue.filter(t => t.type !== task.type || t.priority < task.priority);
    
    // Add new task and sort by priority (highest first)
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    console.log(`Monster ${this.id} added task: ${task.description} (Priority: ${task.priority})`);
  }

  /**
   * Execute the highest priority task
   */
  private executeHighestPriorityTask(): void {
    // Clean up expired tasks
    const now = Date.now();
    this.taskQueue = this.taskQueue.filter(task => !task.expiresAt || task.expiresAt > now);

    // Get highest priority task
    const nextTask = this.taskQueue[0];
    
    if (nextTask && (!this.currentTask || nextTask.priority > this.currentTask.priority)) {
      this.currentTask = nextTask;
      this.currentAction = nextTask.type;
      this.target = nextTask.target || null;
      
      console.log(`Monster ${this.id} executing: ${nextTask.description}`);
      
      // Remove completed task from queue
      this.taskQueue = this.taskQueue.filter(t => t.id !== nextTask.id);
    } else if (!this.currentTask) {
      // No tasks - use default autonomous behavior
      this.chooseDefaultAction();
    }
  }

  /**
   * Handle combat decisions based on genetics
   */
  private handleCombatDecision(): void {
    const aggressionThreshold = 150;
    const fleeThreshold = 80;

    if (this.stats.aggressionLevel > aggressionThreshold) {
      this.currentAction = MonsterAction.ATTACK_ENEMY;
      this.state = MonsterState.FIGHTING;
    } else if (this.stats.aggressionLevel < fleeThreshold || this.energy < 50) {
      this.currentAction = MonsterAction.FLEE_DANGER;
      this.state = MonsterState.FLEEING;
    } else {
      // Moderate aggression - defensive behavior
      this.currentAction = MonsterAction.RETURN_HOME;
    }
  }

  /**
   * Choose default action based on genetics and situation
   */
  private chooseDefaultAction(): void {
    const curiosity = this.genetics.curiosity.value;
    const mining = this.genetics.mining.value;
    const social = this.genetics.social.value;

    // TODO: Check for MINE_HERE pheromones first - high priority!
    // if (nearbyMineHerePheromone) { this.currentAction = MonsterAction.MINE_NEARBY; return; }

    // Weight actions to favor exploration and wandering over mining
    const actions = [
      { action: MonsterAction.MINE_NEARBY, weight: mining + 20 }, // REDUCED from 50
      { action: MonsterAction.EXPLORE, weight: curiosity + 80 }, // INCREASED from 30
      { action: MonsterAction.WANDER, weight: social + 60 }      // INCREASED from 20
    ];

    // Choose weighted random action
    const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const action of actions) {
      random -= action.weight;
      if (random <= 0) {
        this.currentAction = action.action;
        break;
      }
    }
  }

  /**
   * Execute the current action
   */
  private executeCurrentAction(deltaTime: number): void {
    switch (this.currentAction) {
      case MonsterAction.MINE_NEARBY:
        this.executeMining(deltaTime);
        break;
      case MonsterAction.EXPLORE:
        this.executeExploration(deltaTime);
        break;
      case MonsterAction.WANDER:
        this.executeWandering(deltaTime);
        break;
      case MonsterAction.ATTACK_ENEMY:
        this.executeAttack(deltaTime);
        break;
      case MonsterAction.FLEE_DANGER:
        this.executeFlee(deltaTime);
        break;
      case MonsterAction.SEEK_MATE:
        this.executeSeekMate(deltaTime);
        break;
      case MonsterAction.RETURN_HOME:
        this.executeReturnHome(deltaTime);
        break;
    }
  }

  /**
   * Execute mining behavior - move to mining target
   */
  private executeMining(deltaTime: number): void {
    // If we have a mining target from pheromone, move towards it
    if (this.miningTarget) {
      const dx = this.miningTarget.x - this.position.x;
      const dy = this.miningTarget.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If we're close to the mining target, set state to mining
      if (distance < TILE_SIZE) {
        this.state = MonsterState.MINING;
        // Keep moving in the mining direction to continue digging
        // Each time we break a block, update our mining depth
        if (this.miningTarget.direction === 'left') {
          this.position.vx = -30;
          // Update target to continue mining in same direction
          if (this.miningDepth > 0) {
            this.miningTarget.x -= TILE_SIZE;
          }
        } else if (this.miningTarget.direction === 'right') {
          this.position.vx = 30;
          // Update target to continue mining in same direction
          if (this.miningDepth > 0) {
            this.miningTarget.x += TILE_SIZE;
          }
        } else if (this.miningTarget.direction === 'down') {
          this.position.vy = 30;
          // Update target to continue mining in same direction
          if (this.miningDepth > 0) {
            this.miningTarget.y += TILE_SIZE;
          }
        }
      } else {
        // Move towards the mining target
        this.state = MonsterState.MOVING;
        this.target = this.miningTarget;
        this.moveTowardsTarget(deltaTime);
      }
    } else {
      // No specific target, just set to mining state
      this.state = MonsterState.MINING;
    }
  }

  /**
   * Execute exploration behavior
   */
  private executeExploration(deltaTime: number): void {
    this.state = MonsterState.MOVING;
    
    // Find unexplored area to move towards
    if (!this.target || this.isAtTarget()) {
      this.target = this.findExplorationTarget();
    }
    
    if (this.target) {
      this.moveTowardsTarget(deltaTime);
    }
  }

  /**
   * Execute wandering behavior
   */
  private executeWandering(deltaTime: number): void {
    this.state = MonsterState.MOVING;
    
    // Pick random nearby target
    if (!this.target || this.isAtTarget() || Math.random() < 0.01) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 40;
      this.target = {
        x: this.homePosition.x + Math.cos(angle) * distance,
        y: this.homePosition.y + Math.sin(angle) * distance
      };
    }
    
    this.moveTowardsTarget(deltaTime);
  }

  /**
   * Execute attack behavior
   */
  private executeAttack(deltaTime: number): void {
    this.state = MonsterState.FIGHTING;
    // Combat logic will be implemented in combat system
  }

  /**
   * Execute flee behavior
   */
  private executeFlee(deltaTime: number): void {
    this.state = MonsterState.FLEEING;
    
    // Move towards home or away from threats
    this.target = this.homePosition;
    this.moveTowardsTarget(deltaTime, this.stats.moveSpeed * 1.5); // Flee faster
  }

  /**
   * Execute mate seeking behavior
   */
  private executeSeekMate(deltaTime: number): void {
    this.state = MonsterState.MOVING;
    // Breeding logic will be implemented in breeding system
  }

  /**
   * Execute return home behavior
   */
  private executeReturnHome(deltaTime: number): void {
    this.state = MonsterState.MOVING;
    this.target = this.homePosition;
    this.moveTowardsTarget(deltaTime);
    
    if (this.isNearHome()) {
      // If we were carrying resources and have a mining target, go back to mining
      if (this.miningTarget && this.carryingResources === 0) {
        // Add task to return to mining
        this.addTask({
          id: `return_to_mining_${Date.now()}`,
          priority: TaskPriority.HIGH,
          type: MonsterAction.MINE_NEARBY,
          target: this.miningTarget,
          description: 'Return to mining spot after depositing resources',
          createdAt: Date.now(),
          userGenerated: true // Keep it as user-generated since it came from pheromone
        });
      } else {
        this.state = MonsterState.IDLE;
        this.currentAction = MonsterAction.WANDER;
      }
    }
  }

  /**
   * Move towards current target by setting velocity (physics system handles position)
   */
  private moveTowardsTarget(deltaTime: number, speedMultiplier: number = 1): void {
    if (!this.target) return;

    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) {
      const speed = (this.stats.moveSpeed / 255) * 50 * speedMultiplier; // Convert to pixels per second
      
      // ONLY set velocity - let physics system handle position with collision detection
      this.position.vx = (dx / distance) * speed;
      this.position.vy = (dy / distance) * speed;
      
      // DO NOT directly modify position - physics system will handle that
    } else {
      // At target - stop moving
      this.position.vx = 0;
      this.position.vy = 0;
    }
  }

  /**
   * Utility functions
   */
  private isAtTarget(): boolean {
    if (!this.target) return true;
    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy) < 5;
  }

  private isNearHome(): boolean {
    const dx = this.homePosition.x - this.position.x;
    const dy = this.homePosition.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy) < 20;
  }

  private detectNearbyEnemies(): boolean {
    // This will be implemented when we add enemy detection
    return false;
  }

  private canBreed(): boolean {
    const status = GeneticsEngine.getBreedingStatus(this.genetics);
    // Monsters must be at least 30 seconds old before they can breed (explore first!)
    const age = Date.now() - this.genetics.birthTime;
    const minBreedingAge = 30000; // 30 seconds
    return status === BreedingStatus.READY && this.energy > 60 && age >= minBreedingAge;
  }
  
  /**
   * Restrict behavior for babies and juveniles
   */
  private restrictBehaviorForLifeStage(): void {
    switch (this.lifeStage) {
      case MonsterLifeStage.BABY:
        // Babies can only wander near home and rest
        if (this.currentAction !== MonsterAction.WANDER && this.currentAction !== MonsterAction.RETURN_HOME) {
          this.currentAction = MonsterAction.WANDER;
        }
        // Stay very close to hive
        const distanceFromHome = Math.sqrt(
          Math.pow(this.position.x - this.homePosition.x, 2) + 
          Math.pow(this.position.y - this.homePosition.y, 2)
        );
        if (distanceFromHome > 50) {
          this.currentAction = MonsterAction.RETURN_HOME;
        }
        break;
        
      case MonsterLifeStage.JUVENILE:
        // Juveniles can explore but not mine or breed
        if (this.currentAction === MonsterAction.MINE_NEARBY || this.currentAction === MonsterAction.SEEK_MATE) {
          this.currentAction = MonsterAction.EXPLORE;
        }
        break;
        
      case MonsterLifeStage.ADULT:
        // Adults can do everything
        break;
    }
  }
  
  /**
   * Get current breeding status
   */
  getBreedingStatus(): BreedingStatus {
    return GeneticsEngine.getBreedingStatus(this.genetics);
  }
  
  /**
   * Set monster to want breeding (called by UI)
   */
  setWantsToBreed(wantsToBreed: boolean): void {
    this.genetics.wantsToBreed = wantsToBreed;
  }
  
  /**
   * Check if monster can be clicked (not dead, visible)
   */
  isSelectable(): boolean {
    return this.state !== MonsterState.DEAD && this.sprite !== null;
  }
  
  /**
   * Get genetics summary for UI display
   */
  getGeneticsSummary(): any {
    return GeneticsEngine.getGeneticsSummary(this.genetics);
  }

  private findExplorationTarget(): { x: number; y: number } {
    // Simple exploration - pick a direction away from home
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    return {
      x: this.homePosition.x + Math.cos(angle) * distance,
      y: this.homePosition.y + Math.sin(angle) * distance
    };
  }

  private updateVisuals(): void {
    if (this.sprite) {
      this.sprite.x = this.position.x;
      this.sprite.y = this.position.y;
      // Sprite tinting will be handled by MonsterSpriteRenderer
    }

    if (this.healthBar) {
      const healthPercent = this.stats.currentHealth / this.stats.maxHealth;
      this.healthBar.clear();
      
      // Color based on health percentage
      let healthColor = 0x00ff00; // Green
      if (healthPercent < 0.3) healthColor = 0xff0000; // Red
      else if (healthPercent < 0.6) healthColor = 0xffaa00; // Orange
      
      this.healthBar.fillStyle(healthColor);
      this.healthBar.fillRect(this.position.x - 10, this.position.y - 15, 20 * healthPercent, 3);
      
      // Add life stage indicator
      if (this.lifeStage !== MonsterLifeStage.ADULT) {
        this.healthBar.fillStyle(0x00ffff); // Cyan for non-adults
        const stageText = this.lifeStage === MonsterLifeStage.BABY ? 'B' : 'J';
        // Note: This would need a text object, keeping simple for now
      }
    }
  }

  /**
   * Take damage in combat
   */
  takeDamage(damage: number): void {
    const actualDamage = Math.max(1, damage - (this.stats.defense * 0.5));
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - actualDamage);
    
    if (this.stats.currentHealth <= 0) {
      this.state = MonsterState.DEAD;
    }
  }

  /**
   * Get combat power for battle calculations
   */
  getCombatPower(): number {
    const healthRatio = this.stats.currentHealth / this.stats.maxHealth;
    const energyRatio = this.energy / 100;
    return this.stats.attackPower * healthRatio * energyRatio;
  }

  /**
   * Record a successful mining location in ant-like memory
   */
  rememberSuccessfulMining(x: number, y: number, rewardValue: number): void {
    this.lastSuccessfulMiningSpot = { x, y };
    
    // Add to memory with timestamp
    this.successfulMiningMemory.push({
      x, y, 
      reward: rewardValue,
      timestamp: Date.now()
    });
    
    // Keep only recent memories (last 5 successful spots)
    if (this.successfulMiningMemory.length > 5) {
      this.successfulMiningMemory.shift();
    }
    
    // Set flag to return to mining in this area
    this.shouldReturnToMining = true;
  }

  /**
   * Get the best remembered mining spot to return to
   */
  getBestMiningMemory(): { x: number; y: number } | null {
    if (this.successfulMiningMemory.length === 0) return null;
    
    // Find the most rewarding recent spot
    const now = Date.now();
    const recentMemories = this.successfulMiningMemory.filter(
      mem => now - mem.timestamp < 120000 // Within last 2 minutes
    );
    
    if (recentMemories.length === 0) return null;
    
    // Return the most rewarding spot
    const bestMemory = recentMemories.reduce((best, current) => 
      current.reward > best.reward ? current : best
    );
    
    return { x: bestMemory.x, y: bestMemory.y };
  }

  /**
   * Clear return-to-mining flag when monster reaches the area
   */
  clearReturnToMining(): void {
    this.shouldReturnToMining = false;
  }

  /**
   * Check if monster needs rest based on energy level
   */
  shouldSeekRest(): boolean {
    return this.energy <= this.energyThreshold;
  }

  /**
   * Start resting - either at hive or on ground
   */
  startResting(atHive: boolean = false): void {
    this.needsRest = true;
    this.isRestingAtHive = atHive;
    this.restTimer = 0;
    this.state = atHive ? MonsterState.RESTING : MonsterState.SLEEPING;
    
    // Stop all other activities when resting
    this.position.vx = 0;
    this.position.vy = 0;
    this.target = null;
  }

  /**
   * Update rest and energy recovery
   */
  updateRest(deltaTime: number): void {
    if (this.state === MonsterState.RESTING || this.state === MonsterState.SLEEPING) {
      this.restTimer += deltaTime;
      
      // Energy recovery rates
      const baseRecovery = 5 * deltaTime; // 5 energy per second base
      const hiveBonus = this.isRestingAtHive ? 10 : 1; // 10x faster at hive
      
      this.energy = Math.min(100, this.energy + (baseRecovery * hiveBonus));
      
      // Check if fully rested
      if (this.energy >= 80) { // Rest until 80% energy
        this.stopResting();
      }
    }
  }

  /**
   * Stop resting and return to normal activity
   */
  stopResting(): void {
    this.needsRest = false;
    this.isRestingAtHive = false;
    this.restTimer = 0;
    this.state = MonsterState.IDLE;
  }

  /**
   * Check if monster is currently resting
   */
  isResting(): boolean {
    return this.state === MonsterState.RESTING || this.state === MonsterState.SLEEPING;
  }

  /**
   * Check if monster should engage in autonomous mining
   */
  shouldMineAutonomously(): boolean {
    // VERY RARELY mine autonomously - player should direct mining
    if (this.lifeStage !== MonsterLifeStage.ADULT) return false;
    // Only 0.5% chance (was likely 5-10% before)
    return Math.random() < 0.005;
  }
  
  /**
   * Set monster sprite container (called by MonsterSpriteRenderer)
   */
  setSpriteContainer(container: Phaser.GameObjects.Container): void {
    this.sprite = container;
  }
  
  /**
   * Throw resource upward for pyramid climbing
   */
  throwResourceUp(resourceChunkManager: any): void {
    if (!this.carryingChunkId) return;
    
    // Get the resource chunk
    const chunk = resourceChunkManager.chunks.get(this.carryingChunkId);
    if (!chunk) return;
    
    // Calculate throw velocity (upward and forward)
    const throwForce = -600; // Strong upward force
    const forwardForce = this.position.vx > 0 ? 150 : -150; // Throw in movement direction
    
    // Apply physics to the chunk
    chunk.vy = throwForce;
    chunk.vx = forwardForce;
    chunk.isBeingCarried = false;
    
    // Mark resource as thrown (we'll pick it up later)
    this.thrownResourceId = this.carryingChunkId;
    this.carryingChunkId = null;
    
    // Start climbing mode
    this.isClimbing = true;
    // console.log(`Monster ${this.id} threw resource ${this.thrownResourceId} upward for climbing`); // Disabled - too spammy
  }
  
  /**
   * Check if we should throw resource to climb pyramid
   */
  shouldThrowResourceForClimbing(world: any, pyramidCenterX: number): boolean {
    // Only throw if carrying resources
    if (!this.carryingChunkId) return false;
    
    // Check if we're near the pyramid
    const nearPyramid = Math.abs(this.position.x - pyramidCenterX) < 15 * TILE_SIZE;
    if (!nearPyramid) return false;
    
    // Check if there's a wall ahead and above
    const tileX = Math.floor(this.position.x / TILE_SIZE);
    const tileY = Math.floor(this.position.y / TILE_SIZE);
    const direction = this.position.vx > 0 ? 1 : -1;
    
    // Check for wall ahead (world is a 2D array)
    const wallAheadTile = world[tileX + direction]?.[tileY];
    const wallAboveTile = world[tileX + direction]?.[tileY - 1];
    
    const wallAhead = wallAheadTile && wallAheadTile.type && wallAheadTile.type !== TileType.AIR;
    const wallAbove = wallAboveTile && wallAboveTile.type && wallAboveTile.type !== TileType.AIR;
    
    // If wall ahead but space above, throw resource
    return wallAhead && !wallAbove;
  }
  
  /**
   * Try to pick up thrown resource
   */
  tryPickUpThrownResource(resourceChunkManager: any): boolean {
    if (!this.thrownResourceId) return false;
    
    const chunk = resourceChunkManager.chunks.get(this.thrownResourceId);
    if (!chunk) {
      this.thrownResourceId = null;
      this.isClimbing = false;
      return false;
    }
    
    // Check distance to thrown resource
    const distance = Math.sqrt(
      Math.pow(chunk.x - this.position.x, 2) + 
      Math.pow(chunk.y - this.position.y, 2)
    );
    
    // Move towards thrown resource if climbing
    if (this.isClimbing && distance > TILE_SIZE * 1.5) {
      // Set target to the thrown resource location
      this.target = { x: chunk.x, y: chunk.y };
    }
    
    // If close enough, pick it up
    if (distance < TILE_SIZE * 1.5) {
      this.carryingChunkId = this.thrownResourceId;
      this.thrownResourceId = null;
      this.isClimbing = false;
      chunk.isBeingCarried = true;
      chunk.currentCarriers = [this.id];
      // console.log(`Monster ${this.id} picked up thrown resource ${this.carryingChunkId} after climbing`); // Disabled - too spammy
      return true;
    }
    
    return false;
  }
  
  /**
   * Get click bounds for selection
   */
  getClickBounds(): Phaser.Geom.Rectangle {
    const size = this.stats.size * 16; // Base size of 16 pixels scaled by genetics
    return new Phaser.Geom.Rectangle(
      this.position.x - size/2,
      this.position.y - size/2,
      size,
      size
    );
  }
  
  /**
   * Force monster to return to hive for breeding
   */
  sendToHiveForBreeding(): void {
    this.genetics.wantsToBreed = true;
    this.genetics.isAtHive = false; // Will be set true when arrives
    
    // Clear current tasks and add high priority hive return
    this.taskQueue = [];
    this.addTask({
      id: `breeding_return_${Date.now()}`,
      priority: TaskPriority.HIGH,
      type: MonsterAction.RETURN_HOME,
      description: 'Return to hive for breeding',
      createdAt: Date.now(),
      userGenerated: true
    });
  }

  /**
   * Set exploration target based on preferred direction and current position
   */
  setExplorationTarget(): void {
    const currentX = this.position.x;
    const currentY = this.position.y;
    
    // LEMMING BEHAVIOR: Strongly prefer horizontal ground-based exploration
    const horizontalDistance = 120 + Math.random() * 80; // 120-200 pixels horizontal
    const verticalVariance = (Math.random() - 0.8) * 20; // Slightly downward bias (-16 to +4 pixels)
    
    const targetX = this.preferredDirection === 'left' 
      ? currentX - horizontalDistance 
      : currentX + horizontalDistance;
    const targetY = currentY + verticalVariance;
    
    this.explorationTarget = { x: targetX, y: targetY };
    this.explorationTimer = 0;
  }

  /**
   * Update exploration behavior
   */
  updateExploration(deltaTime: number): void {
    this.explorationTimer += deltaTime;
    
    // Change exploration target periodically or if reached current target
    if (this.explorationTimer > 10 || // Every 10 seconds
        (this.explorationTarget && Math.abs(this.position.x - this.explorationTarget.x) < 30)) {
      
      // Sometimes change direction for variety
      if (Math.random() < 0.3) {
        this.preferredDirection = this.preferredDirection === 'left' ? 'right' : 'left';
      }
      
      this.setExplorationTarget();
    }
  }

  /**
   * Get exploration target position
   */
  getExplorationTarget(): { x: number; y: number } | null {
    return this.explorationTarget;
  }
}
