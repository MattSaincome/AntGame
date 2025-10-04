import Phaser from 'phaser';
import { WorldGenerator } from '../world/WorldGenerator';
import { Tile, TileType, TILE_PROPERTIES, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../world/TileTypes';
import { Monster, MonsterState, MonsterAction } from '../entities/Monster';
import { MonsterSprite } from '../entities/MonsterSprite';
import { GeneticsEngine } from '../genetics/GeneticsEngine';
import { ResourceChunkManager } from '../entities/ResourceChunk';
import { ColonyHive } from '../entities/ColonyHive';
import { MiningEffects } from '../effects/MiningEffects';
import { ResourceTracker } from '../ui/ResourceTracker';
import { PheromoneSystem, PheromoneType } from '../systems/PheromoneSystem';
import { SeedBasedPartLoader } from '../loaders/SeedBasedPartLoader';
import { DynamicPartLoader } from '../loaders/DynamicPartLoader';
import { TrueProceduralPartsRenderer } from '../systems/TrueProceduralPartsRenderer';
import { MonsterSelectionUI } from '../ui/MonsterSelectionUI';
import { BreedingManager } from '../systems/BreedingManager';
import { MonsterLifeStage } from '../genetics/GeneticsTypes';
import { MonsterType } from '../genetics/GeneticsTypes';
import { TerrariaTileRenderer } from '../systems/TerrariaTileRenderer';
import { ProceduralMovementSystem } from '../systems/ProceduralMovementSystem';
import { bugMonitor } from '../systems/BugMonitor';
import { RagdollPhysicsSystem } from '../systems/RagdollPhysicsSystem';

export class GameScene extends Phaser.Scene {
  private world!: Tile[][];
  private monsterSprites: Map<string, MonsterSprite>;
  private worldGraphics!: Phaser.GameObjects.Graphics;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private keys: any;
  private lastWaveTime: number;
  private totalResources: number = 0;
  private monsters: Monster[] = [];
  private gameSpeed: number = 1;
  private currentWave: number = 1;
  private resourceTracker!: ResourceTracker;
  // Colony systems
  private colonyHive!: ColonyHive;
  private resourceChunkManager!: ResourceChunkManager;
  private miningEffects!: MiningEffects;
  private pheromoneSystem!: PheromoneSystem;
  private selectedPheromone: PheromoneType | 'ERASER' | 'CLEAR_ALL' = PheromoneType.MINE_HERE;
  private selectedBuildItem: string | null = null;
  // UI moved to UIScene
  
  // New genetics and breeding systems
  private monsterSpriteRenderer!: TrueProceduralPartsRenderer;
  private monsterSelectionUI!: MonsterSelectionUI;
  private breedingManager!: BreedingManager;
  private selectedMonster: Monster | null = null;
  
  // Terraria-style tile renderer with edge detection
  private tileRenderer!: TerrariaTileRenderer;
  
  // Procedural movement system for animations
  private movementSystem!: ProceduralMovementSystem;
  private seedPartLoader!: SeedBasedPartLoader;
  
  // Ragdoll physics system for realistic limb animations
  private ragdollPhysics!: RagdollPhysicsSystem;
  
  constructor() {
    super({ key: 'GameScene' });
    this.monsters = [];
    this.monsterSprites = new Map();
    this.lastWaveTime = Date.now();
    this.currentWave = 0;
    this.gameSpeed = 1.5; // Start at 1.5x speed for better pacing
  }
  
  preload() {
    console.log('GameScene: Initializing Seed-based Gene Pool...');
    
    // UI icons removed - files don't exist, causing 404s
    
    // Initialize Terraria-style tile renderer and preload assets
    this.tileRenderer = new TerrariaTileRenderer(this);
    this.tileRenderer.preloadTiles();
    
    // Initialize dynamic loader for ALL parts
    console.log('GameScene: Initializing Dynamic Part Loader for ALL monster parts...');
    
    // Use dynamic loader to load ALL parts with correct handling of spaces
    const dynamicLoader = new DynamicPartLoader(this);
    dynamicLoader.loadAllMonsterParts();
    
    // Still create seed loader for compatibility
    this.seedPartLoader = new SeedBasedPartLoader(this);
    // Don't load parts twice - dynamic loader handles it
    
    // All 684 monster parts from 91 monsters are now loaded via DynamicPartLoader
    // No need for separate spine image loading - they're part of the main batch
  }

  private createMonsterTexture() {
    // Create simple monster texture using Phaser Graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0x8B4513); // Brown color for monsters
    graphics.fillRect(0, 0, 8, 8);
    graphics.fillStyle(0x654321); // Darker brown for details  
    graphics.fillRect(1, 1, 6, 6);
    graphics.fillStyle(0xFF0000); // Red eyes
    
    // Generate texture from graphics
    graphics.generateTexture('monster', 8, 8);
    graphics.destroy(); // Clean up graphics object
  }
  create() {
    console.log('Creating game scene...');
    
    // Launch UI Scene in parallel (separate fixed camera for HUD)
    this.scene.launch('UIScene');
    
    // Initialize bug monitoring system
    bugMonitor.init();
    
    // Display which seeds were selected (now loading TWO!)
    const seedInfo = this.seedPartLoader.getCurrentSeeds();
    console.log(`🌱 Active Gene Pools: ${seedInfo[0].name} + ${seedInfo[1].name}`);
    
    // Create beautiful background using procedural tile renderer
    this.tileRenderer.createBackground(WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE);
    
    // Generate the world
    const worldGen = new WorldGenerator();
    this.world = worldGen.generateWorld();
    
    // Create the simple gray background for dugout areas
    this.tileRenderer.createBackground(WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE);
    
    // Setup graphics
    this.worldGraphics = this.add.graphics();
    
    // Camera setup (will follow hive after it's created)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE);
    this.cameras.main.setZoom(2.3); // Slightly zoomed in (was 2)
    
    // Add mouse wheel zoom controls
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const currentZoom = this.cameras.main.zoom;
      const zoomDelta = deltaY > 0 ? -0.1 : 0.1; // Scroll up = zoom in, scroll down = zoom out
      const newZoom = Phaser.Math.Clamp(currentZoom + zoomDelta, 0.5, 4); // Zoom range: 0.5x to 4x
      this.cameras.main.setZoom(newZoom);
    });
    
    // Setup input
    this.keys = this.input.keyboard?.addKeys('W,S,A,D,SPACE,B,MINUS,PLUS,EQUALS,ONE,J');
    this.input.on('pointerdown', this.handleClick, this);
    
    // Jump debugging toggle (J key)
    this.input.keyboard?.on('keydown-J', () => {
      // Toggle debug on nearest monster to camera center
      const centerX = this.cameras.main.scrollX + this.cameras.main.width / 2;
      const centerY = this.cameras.main.scrollY + this.cameras.main.height / 2;
      
      let nearestMonster: Monster | null = null;
      let nearestDist = Infinity;
      
      for (const monster of this.monsters) {
        const dx = monster.position.x - centerX;
        const dy = monster.position.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestMonster = monster;
        }
      }
      
      if (nearestMonster) {
        const wasEnabled = (nearestMonster as any).debugJumps;
        (nearestMonster as any).debugJumps = !wasEnabled;
        console.log(`🦘 Jump debugging ${wasEnabled ? 'DISABLED' : 'ENABLED'} for monster ${nearestMonster.id.substring(0, 20)}`);
        
        // Add visual indicator
        if ((nearestMonster as any).debugJumps) {
          this.add.text(10, 150, '🦘 JUMP DEBUG: ON (Press J to toggle)', {
            fontSize: '16px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
          }).setScrollFactor(0).setDepth(10000).setName('jumpDebugText');
        } else {
          const debugText = this.children.getByName('jumpDebugText');
          if (debugText) debugText.destroy();
        }
      }
    });
    
    // Initialize colony systems - place hive in the chamber
    const hiveX = (WORLD_WIDTH * TILE_SIZE) / 2 + 16; // 1 block to the right
    const hiveY = 37 * TILE_SIZE - 71; // 2 blocks higher (5 blocks above ground)
    this.colonyHive = new ColonyHive(this, hiveX, hiveY);
    
    // Center camera on hive
    this.cameras.main.centerOn(hiveX, hiveY);
    this.resourceChunkManager = new ResourceChunkManager(this);
    this.miningEffects = new MiningEffects(this);
    this.resourceTracker = new ResourceTracker(this);
    this.pheromoneSystem = new PheromoneSystem(this);
    
    // Initialize sprite renderer and breeding systems
    this.monsterSpriteRenderer = new TrueProceduralPartsRenderer(this);
    // Pass available monster types from seed to the renderer
    this.monsterSpriteRenderer.setSeedMonsterTypes(this.seedPartLoader.getAvailableMonsterTypes());
    this.monsterSelectionUI = new MonsterSelectionUI(this);
    this.breedingManager = new BreedingManager(this, {
      hiveX,
      hiveY,
      onMonsterBred: (offspring) => this.onMonstersBred(offspring),
      onMonsterSentToHive: (monster) => this.onMonsterSentToHive(monster)
    });
    
    // Initialize movement system
    this.movementSystem = new ProceduralMovementSystem(this);
    
    // Initialize ragdoll physics system for realistic limb animations
    this.ragdollPhysics = new RagdollPhysicsSystem(this);
    
    // Add initial pheromones to guide mining behavior
    this.addInitialMiningPheromones();
    
    // Set up monster selection UI callback
    this.monsterSelectionUI.setBreedCallback((monster) => {
      this.breedingManager.sendMonsterToHive(monster);
    });
    
    // Set up RTS HUD event handlers
    this.events.on('gameSpeedChanged', (speed: number) => {
      this.gameSpeed = speed;
      // Emit to UIScene
      this.events.emit('updateSpeed', speed);
      console.log(`Game speed changed to: ${speed}x`);
    });
    
    // Speed buttons from UIScene
    this.events.on('setSpeed', (speed: number) => {
      this.gameSpeed = speed;
      this.events.emit('updateSpeed', speed);
      console.log(`Speed set to: ${speed}x`);
    });
    
    // Pheromone selection from UIScene
    this.events.on('pheromoneSelected', (type: PheromoneType | 'ERASER' | 'CLEAR_ALL') => {
      this.selectedPheromone = type;
      this.selectedBuildItem = null; // Clear build selection
      console.log(`Selected pheromone: ${type}`);
      
      // If CLEAR_ALL selected, clear immediately
      if (type === 'CLEAR_ALL') {
        this.pheromoneSystem.clearAllPheromones();
        console.log('🧹 Cleared all pheromones from map!');
      }
    });
    
    // Build item selection from UIScene
    this.events.on('buildItemSelected', (itemId: string) => {
      this.selectedBuildItem = itemId;
      this.selectedPheromone = PheromoneType.MINE_HERE; // Reset pheromone when building
      console.log(`Selected build item: ${itemId}`);
    });
    
    // Give starting resources (RTS style)
    this.resourceTracker.addResources(TileType.DIRT, 10);
    this.resourceTracker.addResources(TileType.STONE, 3);
    
    // Send initial UI updates to UIScene
    this.events.emit('updateSpeed', this.gameSpeed);
    this.events.emit('updateResources', this.resourceTracker.getResources());
    this.events.emit('updatePopulation', 0, this.resourceTracker.maxPopulation);
    
    // REMOVED: No longer protecting hive with "do not mine" pheromones
    // this.pheromoneSystem.protectHivePlatform(hiveX, hiveY);
    
    // Create starting monsters (First Family)
    this.createFirstFamily();
    
    // Setup UI
    this.createUI();
    
    // Render initial world
    this.renderWorld();
    
  }

  update(time: number, deltaTime: number) {
    const dt = (deltaTime / 1000) * this.gameSpeed; // Convert to seconds and apply game speed
    
    // Update HUDs to follow camera and respond to zoom
    this.resourceTracker.update();
    
    // Monitor frame performance for crash prevention
    bugMonitor.monitorFramePerformance();
    
    // Monitor memory usage
    bugMonitor.monitorMemoryUsage(this.monsters.length, 'monsters');
    bugMonitor.monitorMemoryUsage(this.resourceChunkManager.getAllChunks().length, 'resource_chunks');
    
    // ═══════════════════════════════════════════════════════════
    // 🐛 FOCUSED DEBUG SYSTEM - Issues We're Tracking
    // ═══════════════════════════════════════════════════════════
    if (time % 5000 < 50) { // Every 5 seconds
      console.log('\n\n📊 ═══════════ MONSTER STATUS REPORT ═══════════');
      
      // Count different monster states
      let flying = 0, grounded = 0, mining = 0, carrying = 0, stuck = 0;
      let leadMiners = 0;
      let insideBlocks = 0;
      let walkingOnAir = 0;
      
      for (const m of this.monsters) {
        const canFly = (m as any).genes?.canFly || false;
        
        if (canFly) flying++;
        if (m.position.onGround) grounded++;
        if (m.state === MonsterState.MINING) mining++;
        if (m.carryingChunkId || m.helpingCarryChunkId) carrying++;
        if (Math.abs(m.position.vx) < 1 && Math.abs(m.position.vy) < 1) stuck++;
        
        // Check if lead miner
        if ((m as any).isLeadMiner && (m as any).leadMinerUntil && Date.now() < (m as any).leadMinerUntil) {
          leadMiners++;
        }
        
        // Check inside blocks
        const tileX = Math.floor(m.position.x / TILE_SIZE);
        const tileY = Math.floor(m.position.y / TILE_SIZE);
        if (tileX >= 0 && tileX < WORLD_WIDTH && tileY >= 0 && tileY < WORLD_HEIGHT) {
          const tile = this.world[tileX][tileY];
          if (tile && TILE_PROPERTIES[tile.type].solid) {
            insideBlocks++;
          }
        }
        
        // Check walking on air
        if (m.position.onGround && !canFly) {
          const feetY = Math.floor((m.position.y + 20) / TILE_SIZE);
          let hasGround = false;
          for (let checkY = feetY; checkY <= feetY + 1; checkY++) {
            if (checkY >= 0 && checkY < WORLD_HEIGHT) {
              const tile = this.world[tileX][checkY];
              if (tile && TILE_PROPERTIES[tile.type].solid) {
                hasGround = true;
                break;
              }
            }
          }
          if (!hasGround) walkingOnAir++;
        }
      }
      
      console.log(`👥 Total Monsters: ${this.monsters.length}`);
      
      // Update HUD population counter
      this.resourceTracker.updatePopulation(this.monsters.length, 200);
      console.log(`✈️  Flying: ${flying}`);
      console.log(`🦶 Grounded: ${grounded}`);
      console.log(`⛏️  Mining: ${mining}`);
      console.log(`📦 Carrying: ${carrying}`);
      console.log(`🐌 Stuck/Slow: ${stuck}`);
      console.log(`\n🎯 ISSUES:`);
      console.log(`   ⛏️  Lead Miners Active: ${leadMiners} ${leadMiners === 0 ? '❌ NONE!' : '✅'}`);
      console.log(`   🧱 Inside Blocks: ${insideBlocks} ${insideBlocks > 0 ? '❌ BUG!' : '✅'}`);
      console.log(`   🌊 Walking on Air: ${walkingOnAir} ${walkingOnAir > 0 ? '❌ BUG!' : '✅'}`);
      console.log('═══════════════════════════════════════════════\n\n');
    }
    
    // Check for stuck monsters and apply recovery
    if (time % 2000 === 0) { // Check every 2 seconds
      this.checkAndRecoverStuckMonsters(time);
    }
    
    // Handle input
    this.handleInput(dt);
    
    // Update monsters
    this.updateMonsters(dt);
    
    // Update colony systems
    this.updateColonySystems(dt);
    
    // Update pheromone system
    this.pheromoneSystem.update(dt);
    
    // Update breeding system
    this.breedingManager.update(deltaTime, this.monsters);
    
    // Update monster selection UI
    this.monsterSelectionUI.update();
    
    // DISABLED - this was overriding scales and breaking visibility!
    // this.updateMonsterSprites();
    
    // Check for enemy waves
    this.checkEnemyWaves();
    
    // Update UI
    this.updateUI();
    
    // Re-render world if needed (only visible area for performance)
    if (time % 100 === 0) { // Every 100ms
      this.renderVisibleWorld();
    }
  }

  private createFirstFamily(): void {
    const hiveX = (WORLD_WIDTH * TILE_SIZE) / 2;
    const hiveTileY = Math.floor(this.colonyHive.y / TILE_SIZE);
    
    const firstFamilyGenetics = GeneticsEngine.createFirstFamily();
    
    firstFamilyGenetics.forEach((genetics, index) => {
      // SAFE SPAWN: Find a safe air tile above the floor
      // Spawn 7 blocks to the right of hive center
      const spawnTileX = Math.floor(hiveX / TILE_SIZE) + 7 + index;
      const floorTileY = hiveTileY + 5;
      
      // Find the first AIR tile above the floor
      let safeTileY = floorTileY - 1; // Start 1 tile above floor
      while (safeTileY > 0) {
        const tile = this.world[spawnTileX]?.[safeTileY];
        if (!tile || tile.type === TileType.AIR) {
          // Found safe air tile
          break;
        }
        safeTileY--; // Move up
      }
      
      const x = spawnTileX * TILE_SIZE + (index * 4); // Slight sub-tile offset
      const y = safeTileY * TILE_SIZE + TILE_SIZE / 2; // Center of air tile, will fall to ground
      
      const monster = new Monster(genetics, x, y, true);
      
      // Determine movement type based on genetics
      const appearance = monster.stats.appearance;
      appearance.movementType = this.movementSystem.determineMovementType(
        appearance.limbCount,
        appearance.hasWings || false,
        appearance.bodyType,
        appearance.mutations
      );
      
      // Create sprite using procedural renderer
      const spriteContainer = this.monsterSpriteRenderer.createProceduralMonster(
        x, 
        y, 
        monster.stats.appearance, 
        monster.lifeStage
      );
      
      // Ensure monsters appear above background tiles
      spriteContainer.setDepth(10);
      spriteContainer.name = monster.id; // Set name for animation tracking
      
      monster.setSpriteContainer(spriteContainer);
      
      // Initialize ragdoll physics for this monster
      this.ragdollPhysics.initializeRagdoll(monster.id, spriteContainer, 0, 0);
      
      // Make sprite interactive for clicking
      spriteContainer.setInteractive(monster.getClickBounds(), Phaser.Geom.Rectangle.Contains);
      spriteContainer.on('pointerdown', () => this.selectMonster(monster));
      
      // Set initial ground state based on monster type
      const isFlyer = appearance.hasWings || false;
      if (isFlyer) {
        // Flying monsters start AIRBORNE
        monster.position.onGround = false;
        monster.position.vy = -150; // Launch upward
        monster.position.y = y - 30; // Start 30px above ground
      } else {
        // Walking monsters start FIRMLY grounded
        monster.position.onGround = true;
        monster.position.vy = 0; // Zero vertical velocity
        monster.position.vx = 0; // Zero horizontal velocity to prevent immediate movement
        monster.position.y = y; // On ground surface
      }
      
      this.monsters.push(monster);
      // Keep compatibility with existing MonsterSprite system for now
      this.monsterSprites.set(monster.id, monster as any);
      
      // Spawn complete - no debug needed
    });
    
    console.log(`Created first family: ${firstFamilyGenetics.length} monsters spawned 7 blocks right of hive`);
  }

  private createUI(): void {
    // UI moved to UIScene - nothing to create here
  }

  // UI moved to UIScene
  
  // UI moved to UIScene

  // UI moved to UIScene
  
  /**
   * Add initial pheromones to guide mining behavior
   */
  private addInitialMiningPheromones(): void {
    // Find the starting chamber location
    const chamberCenterX = Math.floor(WORLD_WIDTH / 2);
    // Use actual hive position to find floor (hive is 5 blocks above ground)
    const chamberY = Math.floor(this.colonyHive.y / TILE_SIZE) + 5; // Floor is 5 blocks below hive
    const chamberHalfWidth = 15; // Chamber is about 30 blocks wide
    
    // DO_NOT_MINE pheromones removed - monsters can mine the floor if needed
    
    // Place "MINE HERE" pheromones on the walls, 2 blocks up from the floor
    const wallY = chamberY - 2; // 2 blocks above the floor
    
    // Left wall mining pheromone
    const leftWallX = chamberCenterX - chamberHalfWidth - 1; // Just outside the chamber
    this.pheromoneSystem.addPheromone(
      leftWallX,
      wallY,
      PheromoneType.MINE_HERE,
      100, // Max strength
      0,   // No decay
      true  // Player-placed
    );
    
    // Add a few more mining pheromones vertically on the left wall
    for (let i = 0; i < 3; i++) {
      this.pheromoneSystem.addPheromone(
        leftWallX,
        wallY - i,
        PheromoneType.MINE_HERE,
        100,
        0,
        true
      );
    }
    
    // Right wall mining pheromone  
    const rightWallX = chamberCenterX + chamberHalfWidth + 1; // Just outside the chamber
    this.pheromoneSystem.addPheromone(
      rightWallX,
      wallY,
      PheromoneType.MINE_HERE,
      100, // Max strength
      0,   // No decay
      true  // Player-placed
    );
    
    // Add a few more mining pheromones vertically on the right wall
    for (let i = 0; i < 3; i++) {
      this.pheromoneSystem.addPheromone(
        rightWallX,
        wallY - i,
        PheromoneType.MINE_HERE,
        100,
        0,
        true
      );
    }
    
    console.log('Initial mining pheromones placed:');
    console.log(`- MINE HERE on left wall at X=${leftWallX}, Y=${wallY}`);
    console.log(`- MINE HERE on right wall at X=${rightWallX}, Y=${wallY}`);
  }

  private handleInput(deltaTime: number): void {
    const cameraSpeed = 200 * deltaTime;
    
    // Camera movement
    if (this.keys.W.isDown) {
      this.cameras.main.scrollY -= cameraSpeed;
    }
    if (this.keys.S.isDown) {
      this.cameras.main.scrollY += cameraSpeed;
    }
    if (this.keys.A.isDown) {
      this.cameras.main.scrollX -= cameraSpeed;
    }
    if (this.keys.D.isDown) {
      this.cameras.main.scrollX += cameraSpeed;
    }
    
    // Speed controls
    if (Phaser.Input.Keyboard.JustDown(this.keys.MINUS)) {
      this.gameSpeed = Math.max(0.25, this.gameSpeed - 0.25);
      this.events.emit('updateSpeed', this.gameSpeed);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.PLUS) || Phaser.Input.Keyboard.JustDown(this.keys.EQUALS)) {
      this.gameSpeed = Math.min(5.0, this.gameSpeed + 0.25);
      this.events.emit('updateSpeed', this.gameSpeed);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
      this.gameSpeed = 1.0;
      this.events.emit('updateSpeed', this.gameSpeed);
    }
    
    // Pause/unpause
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.gameSpeed = this.gameSpeed === 0 ? 1 : 0;
      this.events.emit('updateSpeed', this.gameSpeed);
    }
    
    // Breeding interface (placeholder)
    if (Phaser.Input.Keyboard.JustDown(this.keys.B)) {
      console.log('Breeding interface - not implemented yet');
    }
  }

  private updateMonsters(deltaTime: number): void {
    this.monsters = this.monsters.filter(monster => {
      monster.update(deltaTime);
      
      // Remove dead monsters
      if (monster.state === MonsterState.DEAD) {
        const sprite = this.monsterSprites.get(monster.id);
        if (sprite) {
          sprite.destroy();
          this.monsterSprites.delete(monster.id);
        }
        return false;
      }
      
      // Energy system removed - monsters always have energy!
      // Ensure energy is always at 100%
      monster.energy = 100;
      
      // Normal activities
      if (!monster.isResting()) {
        // Update exploration behavior first - primary activity!
        monster.updateExploration(deltaTime);
        
        // Handle exploration movement
        this.handleMonsterExploration(monster, deltaTime);
        
        // Handle resource carrying behavior (higher priority than mining)
        this.handleResourceCarrying(monster, deltaTime);
        
        // Handle mining ONLY occasionally and when not carrying/exploring
        if (!monster.carryingChunkId && !monster.helpingCarryChunkId && monster.shouldMineAutonomously()) {
          this.handleMonsterMining(monster, deltaTime);
        }
      }
      // Skip updates if monster is stunned
      if (monster.isStunned) {
        // Only apply gravity while stunned
        monster.position.vy += 500 * deltaTime; // Gravity
        monster.position.y += monster.position.vy * deltaTime;
        
        // Check ground collision
        const newY = monster.position.y;
        if (this.checkTileCollision(monster.position.x, newY)) {
          monster.position.y = Math.floor(monster.position.y / TILE_SIZE) * TILE_SIZE;
          monster.position.vy = 0;
          monster.position.onGround = true;
        }
        return true; // Keep the stunned monster in the array
      }
      
      // Pass pheromone system to monster for AI decisions
      monster.update(deltaTime, this.pheromoneSystem, this.world);
      
      // AGGRESSIVE PYRAMID CLIMBING - Check BEFORE physics!
      this.handlePyramidClimbing(monster);
      
      this.applyPhysics(monster, deltaTime);
      
      // PUSH STUCK MONSTERS - Help them get unstuck via collision
      this.handleMonsterPushing(monster, deltaTime);
      
      // Update sprite and animate walking
      const sprite = this.monsterSprites.get(monster.id);
      if (sprite) {
        sprite.update();
      }
      
      // Update sprite position to match monster position - NO OFFSET at tiny scale!
      if (monster.sprite) {
        monster.sprite.x = monster.position.x;
        // Add small visual offset when on ground so feet appear to touch surface
        const groundVisualOffset = monster.position.onGround ? 3 : 0;
        monster.sprite.y = monster.position.y + groundVisualOffset;
        
        // 🐛 JUMP DEBUG: Visual indicator above monster
        if ((monster as any).debugJumps) {
          // Remove old debug sprite if exists
          const oldDebugSprite = monster.sprite.getByName('jumpDebugIndicator');
          if (oldDebugSprite) oldDebugSprite.destroy();
          
          // Add visual jump debug indicator above monster
          const container = monster.sprite as Phaser.GameObjects.Container;
          const indicator = this.add.graphics();
          indicator.fillStyle(0x00ff00, 0.8);
          indicator.fillCircle(0, -40, 8); // Green circle above monster
          indicator.lineStyle(2, 0x00ff00, 1);
          indicator.strokeCircle(0, -40, 12); // Outer ring
          indicator.setName('jumpDebugIndicator');
          container.add(indicator);
        } else {
          // Remove debug indicator if debugging disabled
          const debugSprite = monster.sprite.getByName('jumpDebugIndicator');
          if (debugSprite) debugSprite.destroy();
        }
        
        // SAFETY CHECK: Prevent monster sprites from becoming giant due to animation bugs
        const currentScaleX = monster.sprite.scaleX;
        const currentScaleY = monster.sprite.scaleY;
        const maxScale = 0.3; // Increased to allow our new bigger monsters
        const normalScale = 0.2; // New normal scale for adult monsters
        
        // If monster sprite has become too large, reset it
        if (Math.abs(currentScaleX) > maxScale || Math.abs(currentScaleY) > maxScale) {
          console.warn(`Monster ${monster.id} scale out of bounds: ${currentScaleX}, ${currentScaleY} - resetting to normal`);
          // Reset based on life stage
          switch (monster.lifeStage) {
            case MonsterLifeStage.BABY:
              monster.sprite.setScale(normalScale * 0.5);
              break;
            case MonsterLifeStage.JUVENILE:
              monster.sprite.setScale(normalScale * 0.75);
              break;
            default:
              monster.sprite.setScale(normalScale);
              break;
          }
        }
        
        // TEMPORARILY DISABLED: Apply procedural movement animations
        // The ProceduralMovementSystem file is corrupted and causing giant monster bugs
        // TODO: Fix ProceduralMovementSystem.ts and re-enable this
        /*
        const movementType = monster.stats.appearance.movementType;
        if (movementType && monster.sprite instanceof Phaser.GameObjects.Container) {
          this.movementSystem.applyMovementAnimation(
            monster.sprite as Phaser.GameObjects.Container,
            movementType,
            { x: monster.position.vx, y: monster.position.vy },
            deltaTime
          );
        }
        */
        
        // === RAGDOLL PHYSICS ANIMATIONS ===
        if (monster.sprite instanceof Phaser.GameObjects.Container) {
          const container = monster.sprite as Phaser.GameObjects.Container;
          
          // CRITICAL: Store original scale to prevent compounding
          if (!(container as any).originalScale) {
            (container as any).originalScale = Math.abs(container.scaleX);
          }
          const baseScale = (container as any).originalScale;
          
          // Flip sprite based on movement direction (use ORIGINAL scale only)
          if (monster.position.vx < -5) {
            container.setScale(-baseScale, baseScale);
          } else if (monster.position.vx > 5) {
            container.setScale(baseScale, baseScale);
          }
          
          // Check limb status FIRST
          const hasWings = this.ragdollPhysics.hasWings(monster.id);
          const hasLegs = this.ragdollPhysics.hasLegs(monster.id);
          const canFly = hasWings; // Wings = flying, regardless of legs!
          
          // FIXED: Allow walking animation when descending (onGround OR slowly falling)
          const isDescending = monster.position.vy > -50 && monster.position.vy < 100; // Not jumping, possibly descending stairs
          const isWalking = Math.abs(monster.position.vx) > 5 && (monster.position.onGround || isDescending);
          const isClimbing = monster.isClimbing || false;
          const isMining = monster.state === MonsterState.MINING;
          const isCarrying = monster.carryingChunkId !== null || monster.carryingResources > 0;
          
          // Animation logging disabled for performance
          // if (Math.random() < 0.005) { // 0.5% chance
          //   console.log(` ${monster.id.substring(0, 20)}: walking=${isWalking}, vx=${monster.position.vx.toFixed(1)}, onGround=${monster.position.onGround}, hasLegs=${hasLegs}, hasWings=${hasWings}`);
          // }
          
          // Get ground Y position for foot placement
          const groundY = this.ragdollPhysics.getGroundY(
            monster.position.x,
            monster.position.y,
            this.world,
            TILE_SIZE
          );
          
          if (canFly) {
            // ALWAYS animate wings for flying monsters!
            this.ragdollPhysics.updateFlying(
              monster.id,
              monster.position.vx,
              monster.position.vy,
              deltaTime
            );
          }
          
          // PRIORITY: Carrying overrides other animations!
          if (isCarrying && monster.carryingChunkId) {
            // Arms STICK to the carried resource block - glue-like grip!
            const carriedChunk = this.resourceChunkManager.chunks.get(monster.carryingChunkId);
            if (carriedChunk) {
              this.ragdollPhysics.updateCarrying(
                monster.id,
                container,
                carriedChunk.x,
                carriedChunk.y,
                deltaTime,
                monster.position.vx, // Pass velocity for leg animation
                monster.position.vy,
                monster.position.onGround // Pass ground state
              );
            }
          } else if (isWalking && hasLegs) {
            // Realistic walking with feet stepping
            // Walking animation debug disabled for performance
            // if (Math.random() < 0.001) {
            //   console.log(`🚶 ${monster.id.substring(0, 15)}: WALKING (vx=${monster.position.vx.toFixed(1)})`);
            // }
            this.ragdollPhysics.updateWalking(
              monster.id,
              container,
              monster.position.vx,
              monster.position.vy,
              groundY - monster.position.y,
              deltaTime
            );
          } else if (isClimbing) {
            // Hands reach and grab blocks, legs walk if moving horizontally
            const targetBlock = this.findNearestClimbableBlock(monster);
            if (targetBlock) {
              this.ragdollPhysics.updateClimbing(
                monster.id,
                container,
                targetBlock.x * TILE_SIZE,
                targetBlock.y * TILE_SIZE,
                true,
                deltaTime,
                monster.position.vx // Pass velocity for leg walking
              );
            }
          } else if (isMining) {
            // METHODICAL LUNGE/BASH at mining target - slower, more violent
            const swingProgress = (this.time.now % 1500) / 1500; // 1.5 second cycle - SLOWER for impact
            const targetX = monster.position.x + (monster.position.vx > 0 ? 30 : -30);
            const targetY = monster.position.y;
            this.ragdollPhysics.updateMining(
              monster.id,
              container,
              targetX,
              targetY,
              swingProgress,
              deltaTime
            );
          } else {
            // Idle - return to rest position
            this.ragdollPhysics.resetToIdle(monster.id);
          }
        }
      }
      
      return true;
    });
    
    // DEBUG: Detect stuck monsters (run frequently to catch issues quickly)
    if (Math.random() < 0.5) { // Run 50% of the time for faster detection
      this.detectStuckMonsters();
    }
  }

  /**
   * Debug system to detect and log stuck monsters
   */
  private detectStuckMonsters(): void {
    for (const monster of this.monsters) {
      // Track movement history
      if (!(monster as any).positionHistory) {
        (monster as any).positionHistory = [];
      }
      
      const history = (monster as any).positionHistory;
      history.push({ x: monster.position.x, y: monster.position.y, time: Date.now() });
      
      // Keep only last 2 seconds of history (at 60fps = ~120 entries)
      if (history.length > 120) {
        history.shift();
      }
      
      // Only analyze if we have enough history (1 second)
      if (history.length < 60) continue;
      
      const recent = history[history.length - 1];
      const old = history[0];
      const timeDiff = (recent.time - old.time) / 1000; // seconds
      const distMoved = Math.sqrt(
        Math.pow(recent.x - old.x, 2) + 
        Math.pow(recent.y - old.y, 2)
      );
      
      // STUCK DETECTION #1: Not moving but has velocity
      const isStuckMoving = distMoved < 5 && (Math.abs(monster.position.vx) > 10 || Math.abs(monster.position.vy) > 50);
      
      // STUCK DETECTION #2: Inside solid blocks
      const monsterTileX = Math.floor(monster.position.x / TILE_SIZE);
      const monsterTileY = Math.floor(monster.position.y / TILE_SIZE);
      let isInsideBlock = false;
      
      if (monsterTileX >= 0 && monsterTileX < WORLD_WIDTH && monsterTileY >= 0 && monsterTileY < WORLD_HEIGHT) {
        const tile = this.world[monsterTileX][monsterTileY];
        if (tile && TILE_PROPERTIES[tile.type].solid) {
          isInsideBlock = true;
        }
      }
      
      // STUCK DETECTION #3: Monsters clustered together
      let nearbyMonsters = 0;
      let nearbyCarriers = 0;
      let standingOnOthers = false;
      
      for (const other of this.monsters) {
        if (other.id === monster.id) continue;
        const dist = Math.sqrt(
          Math.pow(other.position.x - monster.position.x, 2) + 
          Math.pow(other.position.y - monster.position.y, 2)
        );
        if (dist < TILE_SIZE * 2) { // Within 2 tiles
          nearbyMonsters++;
          if (other.carryingChunkId || other.helpingCarryChunkId) {
            nearbyCarriers++;
          }
          
          // Check if standing directly on another monster (within 8 pixels horizontally, above them)
          const horizontalDist = Math.abs(monster.position.x - other.position.x);
          const verticalDist = monster.position.y - other.position.y;
          if (horizontalDist < 8 && verticalDist < -10 && verticalDist > -TILE_SIZE * 2) {
            standingOnOthers = true;
          }
        }
      }
      
      // LOG STUCK MONSTERS
      const isCarrying = monster.carryingChunkId || monster.helpingCarryChunkId;
      
      if (isStuckMoving) {
        console.log(`⚠️ STUCK MONSTER (velocity but no movement):`);
        console.log(`   ID: ${monster.id.substring(0, 25)}`);
        console.log(`   Pos: (${monster.position.x.toFixed(0)}, ${monster.position.y.toFixed(0)}) Tile:[${monsterTileX},${monsterTileY}]`);
        console.log(`   Velocity: vx=${monster.position.vx.toFixed(1)}, vy=${monster.position.vy.toFixed(1)}`);
        console.log(`   Moved: ${distMoved.toFixed(1)}px in ${timeDiff.toFixed(1)}s`);
        console.log(`   Carrying: ${isCarrying ? 'YES (chunkId=' + (monster.carryingChunkId || monster.helpingCarryChunkId) + ')' : 'NO'}`);
        console.log(`   Nearby monsters: ${nearbyMonsters} (${nearbyCarriers} carrying)`);
        console.log(`   OnGround: ${monster.position.onGround}`);
        
        // AUTO-RECOVERY: If stuck for more than 2 seconds, make them panic!
        if (timeDiff > 2) {
          // CRITICAL: Prevent panic jump spam that causes wall climbing glitch
          const currentTime = Date.now();
          const lastPanicJump = (monster as any).lastPanicJumpTime || 0;
          const timeSincePanicJump = currentTime - lastPanicJump;
          
          console.log(`   🔧 AUTO-RECOVERY: Monster PANIC MODE!`);
          
          // PANIC MODE - Multiple safe recovery strategies
          const panicType = Math.random();
          
          if (panicType < 0.25 && timeSincePanicJump > 5000) { // 5 second cooldown on panic jumps
            // SAFE JUMP - max 3.5 blocks in any direction (56px = 3.5 * 16)
            // BUT ONLY if not against a wall (prevents wall climbing glitch)
            const facingDir = Math.sign(monster.position.vx || 1);
            const checkX = monsterTileX + facingDir;
            const isAgainstWall = checkX >= 0 && checkX < WORLD_WIDTH &&
                                  this.world[checkX][monsterTileY] &&
                                  TILE_PROPERTIES[this.world[checkX][monsterTileY].type].solid;
            
            if (!isAgainstWall) {
              monster.position.onGround = false;
              const maxJumpVelocity = 280; // Results in ~3.5 block jump
              monster.position.vy = -200 - Math.random() * 80; // -200 to -280 (2-3.5 blocks up)
              monster.position.vx = (Math.random() - 0.5) * maxJumpVelocity; // Max 3.5 blocks sideways
              (monster as any).lastPanicJumpTime = currentTime;
              console.log(`   💥 Panic: Safe jump (max 3.5 blocks)!`);
            } else {
              console.log(`   🚫 Panic: Skip jump - against wall! Will try other recovery.`);
            }
          } else if (panicType < 0.5) {
            // PANIC SHAKE - Break the block they're stuck against!
            console.log(`   🔨 Panic: SHAKE & BREAK!`);
            
            // Determine which direction they're stuck (based on velocity)
            let breakX = monsterTileX * TILE_SIZE;
            let breakY = monsterTileY * TILE_SIZE;
            let direction: 'horizontal' | 'down' = 'horizontal';
            
            if (Math.abs(monster.position.vx) > Math.abs(monster.position.vy)) {
              // Stuck horizontally - break block in front
              breakX = monster.position.vx > 0 ? (monsterTileX + 1) * TILE_SIZE : (monsterTileX - 1) * TILE_SIZE;
              direction = 'horizontal';
            } else {
              // Stuck vertically - break block above/below
              breakY = monster.position.vy > 0 ? (monsterTileY + 1) * TILE_SIZE : (monsterTileY - 1) * TILE_SIZE;
              direction = 'down';
            }
            
            // Break the blocking tile (if it exists and is mineable)
            const checkTileX = Math.floor(breakX / TILE_SIZE);
            const checkTileY = Math.floor(breakY / TILE_SIZE);
            if (checkTileX >= 0 && checkTileX < WORLD_WIDTH && checkTileY >= 0 && checkTileY < WORLD_HEIGHT) {
              const blockingTile = this.world[checkTileX][checkTileY];
              if (blockingTile && blockingTile.type !== TileType.AIR && blockingTile.type !== TileType.BEDROCK) {
                console.log(`   💥 Breaking ${blockingTile.type} at [${checkTileX},${checkTileY}]!`);
                this.tryMineBlock(monster, breakX, breakY, direction);
                
                // Violent shake animation
                monster.position.vx += (Math.random() - 0.5) * 100;
                monster.position.vy += (Math.random() - 0.5) * 100;
              }
            }
            
            // Small push away from stuck position
            monster.position.onGround = false;
            monster.position.vy = -150;
          } else if (panicType < 0.75) {
            // DIRECTION CHANGE - Try walking opposite direction
            console.log(`   🔄 Panic: Reverse direction!`);
            
            // Flip horizontal velocity
            monster.position.vx = -monster.position.vx;
            if (Math.abs(monster.position.vx) < 50) {
              // If barely moving, give strong push
              monster.position.vx = (Math.random() < 0.5 ? -1 : 1) * 200;
            }
            
            // Small hop to change state
            monster.position.onGround = false;
            monster.position.vy = -100;
            
            // Clear target to allow free roaming
            monster.target = null;
          } else {
            // RANDOM WANDER - New exploration direction
            console.log(`   🎯 Panic: Random wander!`);
            
            const randomDir = Math.random() < 0.5 ? -1 : 1;
            const randomDist = 2 + Math.random() * 3; // 2-5 tiles away (safe distance)
            monster.target = {
              x: monster.position.x + (randomDir * randomDist * TILE_SIZE),
              y: monster.position.y - TILE_SIZE // Aim slightly upward
            };
            monster.position.onGround = false;
            monster.position.vy = -80; // Gentle hop
            monster.position.vx = randomDir * 150; // Walk in chosen direction
          }
          
          // Clear stuck history so we don't spam recovery
          (monster as any).positionHistory = [];
        }
      }
      
      if (isInsideBlock) {
        console.log(`🔴 MONSTER INSIDE BLOCK:`);
        console.log(`   ID: ${monster.id.substring(0, 25)}`);
        console.log(`   Pos: (${monster.position.x.toFixed(0)}, ${monster.position.y.toFixed(0)}) Tile:[${monsterTileX},${monsterTileY}]`);
        console.log(`   Block type: ${this.world[monsterTileX][monsterTileY].type}`);
        
        // If carrying something, DROP IT first so we can mine!
        const wasCarrying = monster.carryingChunkId || monster.helpingCarryChunkId;
        if (wasCarrying) {
          console.log(`   📦 Dropping carried item to mine out!`);
          monster.carryingChunkId = null;
          monster.helpingCarryChunkId = null;
        }
        
        // SMART ESCAPE: Mine toward the hive (safest direction)!
        const stuckTile = this.world[monsterTileX][monsterTileY];
        
        // Can't mine bedrock - teleport UP to surface!
        if (stuckTile && stuckTile.type === TileType.BEDROCK) {
          console.log(`   🚫 Stuck in BEDROCK at Y=${monsterTileY}! Teleporting UP to surface...`);
          
          // ALWAYS search UPWARD to find surface air, never stay in bedrock areas
          let surfaceAir: {x: number, y: number} | null = null;
          
          // Search upward from current position to find safe surface air
          for (let checkY = monsterTileY - 1; checkY >= 0; checkY--) {
            // Bounds check before accessing
            if (monsterTileX < 0 || monsterTileX >= WORLD_WIDTH) break;
            
            const checkTile = this.world[monsterTileX][checkY];
            // Find first air block that's NOT surrounded by bedrock
            if (checkTile && checkTile.type === TileType.AIR) {
              // Check if this air is safe (not in bedrock layer)
              const tileBelow = checkY < WORLD_HEIGHT - 1 ? this.world[monsterTileX][checkY + 1] : null;
              if (!tileBelow || tileBelow.type !== TileType.BEDROCK) {
                surfaceAir = {x: monsterTileX, y: checkY};
                break; // Found safe air above bedrock
              }
            }
          }
          
          if (surfaceAir) {
            monster.position.x = surfaceAir.x * TILE_SIZE + TILE_SIZE / 2;
            monster.position.y = surfaceAir.y * TILE_SIZE + TILE_SIZE / 2;
            monster.position.vx = 0;
            monster.position.vy = 0;
            console.log(`   ✅ RESCUED from bedrock! Teleported UP to safe air at [${surfaceAir.x},${surfaceAir.y}] (was at Y=${monsterTileY})`);
          } else {
            // Failsafe: teleport to hive if can't find surface
            const hivePos = this.colonyHive.getDepositPosition();
            monster.position.x = hivePos.x;
            monster.position.y = hivePos.y - 50;
            monster.position.vx = 0;
            monster.position.vy = 0;
            console.log(`   🏠 EMERGENCY: Teleported to hive (couldn't find surface)`);
          }
          return; // Exit early - can't mine bedrock
        }
        
        if (stuckTile && stuckTile.type !== TileType.AIR && stuckTile.type !== TileType.BEDROCK) {
          console.log(`   ⛏️ MINING OUT: Breaking ${stuckTile.type} at [${monsterTileX},${monsterTileY}]`);
          
          // Drop resources if tile had any
          if (stuckTile.resources > 0) {
            this.resourceChunkManager.createChunksFromTile(
              stuckTile.type,
              monsterTileX,
              monsterTileY,
              stuckTile.resources
            );
          }
          
          // Turn tile into air - instant escape!
          stuckTile.type = TileType.AIR;
          stuckTile.integrity = 0;
          stuckTile.resources = 0;
          stuckTile.discovered = true;
          
          // Calculate direction TO HIVE (safest area)
          const hivePos = this.colonyHive.getDepositPosition();
          const dx = hivePos.x - monster.position.x;
          const dy = hivePos.y - monster.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Normalize direction
          const dirX = dx / distance;
          const dirY = dy / distance;
          
          console.log(`   🏠 Escaping TOWARD HIVE: direction=(${dirX.toFixed(2)}, ${dirY.toFixed(2)})`);
          
          // Jump toward hive with force
          monster.position.onGround = false;
          monster.position.vx = dirX * 200; // Strong horizontal push toward hive
          monster.position.vy = dirY * 150 - 100; // Vertical component + upward bias
          
          // Mine blocks in the direction of hive for next 2 blocks
          for (let step = 1; step <= 2; step++) {
            const mineX = Math.floor((monster.position.x + dirX * TILE_SIZE * step) / TILE_SIZE);
            const mineY = Math.floor((monster.position.y + dirY * TILE_SIZE * step) / TILE_SIZE);
            
            if (mineX >= 0 && mineX < WORLD_WIDTH && mineY >= 0 && mineY < WORLD_HEIGHT) {
              const blockingTile = this.world[mineX][mineY];
              if (blockingTile && blockingTile.type !== TileType.AIR && blockingTile.type !== TileType.BEDROCK) {
                console.log(`   💥 Clearing path to hive: Breaking ${blockingTile.type} at [${mineX},${mineY}]`);
                
                // Drop resources
                if (blockingTile.resources > 0) {
                  this.resourceChunkManager.createChunksFromTile(
                    blockingTile.type,
                    mineX,
                    mineY,
                    blockingTile.resources
                  );
                }
                
                // Clear the tile
                blockingTile.type = TileType.AIR;
                blockingTile.integrity = 0;
                blockingTile.resources = 0;
                blockingTile.discovered = true;
              }
            }
          }
          
          console.log(`   ✅ Escape tunnel created toward hive!`);
        }
      }
      
      // COOPERATIVE CLIMBING: Check if in a deep pit and should stack
      const inDeepPit = this.checkIfInDeepPit(monster, monsterTileX, monsterTileY);
      
      if (inDeepPit && nearbyMonsters > 0 && timeDiff > 1.5) {
        // In a pit with other monsters - try cooperative climbing!
        this.attemptCooperativeClimbing(monster, monsterTileX, monsterTileY);
      } else if (standingOnOthers && monster.position.onGround && !inDeepPit) {
        // STANDING ON ANOTHER MONSTER'S HEAD - allow it!
        // Monsters can use each other as stepping stones/platforms
        // No separation needed - this is a feature, not a bug!
        (monster as any).positionHistory = []; // Reset history
      }
      
      // NO HORIZONTAL COLLISION - Monsters can walk through each other
      // Only head-standing (vertical) is supported
      
      if (isCarrying && nearbyMonsters >= 2 && distMoved < 10) {
        console.log(`📦 CARRIER STUCK WITH OTHERS:`);
        console.log(`   ID: ${monster.id.substring(0, 25)}`);
        console.log(`   Pos: (${monster.position.x.toFixed(0)}, ${monster.position.y.toFixed(0)})`);
        console.log(`   Chunk: ${monster.carryingChunkId || monster.helpingCarryChunkId}`);
        console.log(`   Nearby monsters: ${nearbyMonsters} (${nearbyCarriers} also carrying)`);
        console.log(`   Moved: ${distMoved.toFixed(1)}px in ${timeDiff.toFixed(1)}s`);
        
        // Check if resource is being thrown back and forth
        if (monster.carryingChunkId) {
          const chunk = this.resourceChunkManager.chunks.get(monster.carryingChunkId);
          if (chunk) {
            console.log(`   Resource pos: (${chunk.x.toFixed(0)}, ${chunk.y.toFixed(0)})`);
          }
        }
        
        // AUTO-RECOVERY for stuck carriers
        if (timeDiff > 3) {
          console.log(`   🔧 Dropping resource and escaping...`);
          // Drop the resource
          if (monster.carryingChunkId) {
            const chunk = this.resourceChunkManager.chunks.get(monster.carryingChunkId);
            if (chunk) {
              chunk.isBeingCarried = false;
              chunk.currentCarriers = [];
            }
            monster.carryingChunkId = null;
          }
          monster.helpingCarryChunkId = null;
          
          // Escape with a jump
          monster.position.onGround = false;
          monster.position.vy = -300;
          monster.position.vx = (Math.random() - 0.5) * 500;
          (monster as any).positionHistory = [];
        }
      }
    }
  }

  /**
   * Check if a monster is in a deep pit (2+ blocks deep with walls on sides)
   */
  private checkIfInDeepPit(monster: Monster, tileX: number, tileY: number): boolean {
    // Check walls on left and right
    const hasLeftWall = this.world[tileX - 1]?.[tileY] && TILE_PROPERTIES[this.world[tileX - 1][tileY].type].solid;
    const hasRightWall = this.world[tileX + 1]?.[tileY] && TILE_PROPERTIES[this.world[tileX + 1][tileY].type].solid;
    
    if (!hasLeftWall && !hasRightWall) {
      return false; // Not in a pit, can walk out
    }
    
    // Check pit depth - count air tiles above until we hit solid or open space
    let airTilesAbove = 0;
    for (let checkY = tileY - 1; checkY >= 0 && airTilesAbove < 5; checkY--) {
      const tile = this.world[tileX]?.[checkY];
      if (!tile || tile.type === TileType.AIR) {
        airTilesAbove++;
        
        // Check if this level has an exit (no walls)
        const hasLeftWallAtLevel = this.world[tileX - 1]?.[checkY] && TILE_PROPERTIES[this.world[tileX - 1][checkY].type].solid;
        const hasRightWallAtLevel = this.world[tileX + 1]?.[checkY] && TILE_PROPERTIES[this.world[tileX + 1][checkY].type].solid;
        
        if (!hasLeftWallAtLevel || !hasRightWallAtLevel) {
          // Found an exit at this level
          break;
        }
      } else {
        // Hit ceiling
        break;
      }
    }
    
    return airTilesAbove >= 2; // Pit is 2+ blocks deep
  }

  /**
   * Attempt cooperative climbing - monsters stack on each other to escape pits
   */
  private attemptCooperativeClimbing(monster: Monster, tileX: number, tileY: number): void {
    // Find other monsters in the same pit
    const monstersInPit: Monster[] = [];
    
    for (const other of this.monsters) {
      if (other.id === monster.id) continue;
      
      const otherTileX = Math.floor(other.position.x / TILE_SIZE);
      const otherTileY = Math.floor(other.position.y / TILE_SIZE);
      
      // Check if in same X column and close vertically
      const horizontalDist = Math.abs(other.position.x - monster.position.x);
      const verticalDist = Math.abs(other.position.y - monster.position.y);
      
      if (horizontalDist < TILE_SIZE * 1.5 && verticalDist < TILE_SIZE * 3) {
        // Check if this monster is also in a pit
        if (this.checkIfInDeepPit(other, otherTileX, otherTileY)) {
          monstersInPit.push(other);
        }
      }
    }
    
    if (monstersInPit.length === 0) {
      return; // No one to climb with
    }
    
    // Check if already in a climb formation
    if ((monster as any).isClimbingBase || (monster as any).isClimbingTop) {
      // Already climbing - check if top monster should jump out
      if ((monster as any).isClimbingTop) {
        const pitExit = this.findPitExit(tileX, tileY);
        if (pitExit) {
          console.log(`🧗 Top monster escaping pit!`);
          monster.position.onGround = false;
          monster.position.vy = -200; // Jump up
          monster.position.vx = (pitExit.x - monster.position.x) * 2; // Jump toward exit
          (monster as any).isClimbingTop = false;
          (monster as any).climbingOnId = null;
          (monster as any).positionHistory = [];
        }
      }
      return;
    }
    
    // Sort by Y position - lowest becomes base
    const allInPit = [monster, ...monstersInPit].sort((a, b) => b.position.y - a.position.y);
    
    // First monster becomes base, second climbs on top
    if (allInPit[0].id === monster.id && monstersInPit.length > 0) {
      // This monster is the base
      console.log(`🧗 BASE: ${monster.id.substring(0, 15)} - holding still for climbing`);
      (monster as any).isClimbingBase = true;
      (monster as any).baseStartTime = this.time.now;
      monster.position.vx = 0; // Stay still
      monster.position.vy = 0;
      monster.position.onGround = true;
      
      // Set climber on top
      const climber = monstersInPit[0];
      if (!(climber as any).isClimbingTop && !(climber as any).isClimbingBase) {
        console.log(`🧗 CLIMBER: ${climber.id.substring(0, 15)} - climbing on ${monster.id.substring(0, 15)}`);
        (climber as any).isClimbingTop = true;
        (climber as any).climbingOnId = monster.id;
        (climber as any).climbStartTime = this.time.now;
      }
    } else if ((monster as any).climbingOnId) {
      // This monster is climbing on someone
      const base = this.monsters.find(m => m.id === (monster as any).climbingOnId);
      if (base) {
        // Position on top of base monster
        monster.position.x = base.position.x;
        monster.position.y = base.position.y - TILE_SIZE * 1.5; // Stand 1.5 blocks above
        monster.position.onGround = false;
        
        // Animate climbing legs
        if (monster.sprite instanceof Phaser.GameObjects.Container) {
          const container = monster.sprite as Phaser.GameObjects.Container;
          this.ragdollPhysics.updateClimbing(
            monster.id,
            container,
            base.position.x,
            base.position.y - TILE_SIZE,
            true,
            0.016, // ~60fps
            0 // No horizontal movement
          );
        }
        
        // After 2 seconds, try to escape
        const climbDuration = (this.time.now - (monster as any).climbStartTime) / 1000;
        if (climbDuration > 2) {
          const pitExit = this.findPitExit(tileX, tileY);
          if (pitExit) {
            console.log(`🧗 ESCAPE: ${monster.id.substring(0, 15)} jumping out of pit!`);
            monster.position.onGround = false;
            monster.position.vy = -250; // Strong jump up
            monster.position.vx = (pitExit.x - monster.position.x) * 3; // Jump toward exit
            (monster as any).isClimbingTop = false;
            (monster as any).climbingOnId = null;
            (monster as any).positionHistory = [];
            
            // Base can stop being base after climber escapes
            if (base) {
              setTimeout(() => {
                (base as any).isClimbingBase = false;
              }, 500);
            }
          }
        }
      }
    }
  }

  /**
   * Find the exit direction from a pit
   */
  private findPitExit(tileX: number, tileY: number): { x: number; y: number } | null {
    // Check upward for first level with an opening
    for (let checkY = tileY - 1; checkY >= 0 && checkY > tileY - 5; checkY--) {
      const leftTile = this.world[tileX - 1]?.[checkY];
      const rightTile = this.world[tileX + 1]?.[checkY];
      
      const leftBlocked = leftTile && TILE_PROPERTIES[leftTile.type].solid;
      const rightBlocked = rightTile && TILE_PROPERTIES[rightTile.type].solid;
      
      if (!leftBlocked) {
        // Exit on left
        return { x: (tileX - 1) * TILE_SIZE, y: checkY * TILE_SIZE };
      }
      if (!rightBlocked) {
        // Exit on right
        return { x: (tileX + 1) * TILE_SIZE, y: checkY * TILE_SIZE };
      }
    }
    
    return null; // No exit found
  }

  /**
   * Handle monster rest and energy management - TOP PRIORITY
   */
  private handleMonsterRest(monster: Monster, deltaTime: number): void {
    // Always update rest if monster is currently resting
    monster.updateRest(deltaTime);
    
    // Check if monster needs to seek rest
    if (monster.shouldSeekRest() && !monster.isResting()) {
      console.log(`${monster.id} is tired (${Math.floor(monster.energy)}% energy) - seeking rest`);
      
      // Calculate distance to hive
      const hivePos = this.colonyHive.getDepositPosition();
      const distanceToHive = Math.sqrt(
        Math.pow(monster.position.x - hivePos.x, 2) + 
        Math.pow(monster.position.y - hivePos.y, 2)
      );
      
      // Decide where to rest based on distance and urgency
      const criticalEnergy = monster.energy < 10; // Very low energy
      const hiveReachable = distanceToHive < 200; // Within reasonable distance
      
      if (hiveReachable && (criticalEnergy || Math.random() < 0.7)) {
        // Try to reach hive for super fast recovery
        monster.target = hivePos;
        
        // If close enough to hive, start resting there
        if (distanceToHive < 40) {
          monster.startResting(true); // Rest at hive = 10x faster recovery
          console.log(`${monster.id} resting at hive (10x recovery speed)`);
        } else {
          // Move toward hive with urgency (but check for walls!)
          const urgencyBoost = criticalEnergy ? 1.5 : 1.0;
          const dx = (hivePos.x - monster.position.x) / distanceToHive;
          const dy = (hivePos.y - monster.position.y) / distanceToHive;
          
          // Check if path toward hive is clear
          const speed = 150 * urgencyBoost * deltaTime; // 2x faster
          const checkX = monster.position.x + dx * speed * 30; // Look ahead
          const checkY = monster.position.y + dy * speed * 30;
          
          if (!this.checkTileCollision(checkX, checkY)) {
            // Path clear - move toward hive
            monster.position.vx = dx * speed;
            monster.position.vy = dy * speed;
          } else {
            // Path blocked - stop and rest in place
            monster.position.vx = 0;
            monster.position.vy = 0;
            monster.startResting(false); // Sleep where you are if hive unreachable
          }
        }
      } else {
        // Too far from hive or not worth the trip - sleep on ground
        monster.startResting(false); // Sleep on ground = normal recovery
        console.log(`${monster.id} sleeping on ground (normal recovery)`);
      }
    }
    
    // If monster is resting, drain energy much slower (they're not working)
    if (monster.isResting()) {
      // Resting monsters barely lose energy
      const restEnergyDrain = 0.1 * deltaTime; // Very slow drain while resting
      monster.energy = Math.max(0, monster.energy - restEnergyDrain);
      
      // Stop all movement while resting
      monster.position.vx = 0;
      monster.position.vy = 0;
    }
  }

  /**
   * Handle monster exploration behavior - primary activity for autonomous monsters
   */
  private handleMonsterExploration(monster: Monster, deltaTime: number): void {
    // Debug slow/stuck monsters - DISABLED to reduce spam
    const isSlowMonster = false; // Was: Math.abs(monster.position.vx) < 2 && Math.abs(monster.position.vy) < 2;
    
    // Skip exploration if monster is carrying resources or at rest
    if (monster.carryingChunkId || monster.helpingCarryChunkId || monster.isResting()) {
      if (isSlowMonster) {
        console.log(`🚫 ${monster.id.substring(0, 20)}: Skipping exploration - carrying=${!!monster.carryingChunkId}, helping=${!!monster.helpingCarryChunkId}, resting=${monster.isResting()}`);
      }
      return;
    }

    // Set initial exploration target if monster doesn't have one
    if (!monster.getExplorationTarget()) {
      monster.setExplorationTarget();
      if (isSlowMonster) {
        console.log(`🎯 ${monster.id.substring(0, 20)}: Set NEW exploration target`);
      }
    }

    const explorationTarget = monster.getExplorationTarget();
    if (!explorationTarget) {
      if (isSlowMonster) {
        console.log(`❌ ${monster.id.substring(0, 20)}: NO exploration target after setting!`);
      }
      return;
    }

    // Check if monster should move toward exploration target
    const distanceToTarget = Math.sqrt(
      Math.pow(explorationTarget.x - monster.position.x, 2) + 
      Math.pow(explorationTarget.y - monster.position.y, 2)
    );

    if (isSlowMonster) {
      console.log(`📐 ${monster.id.substring(0, 20)}: Target=(${explorationTarget.x.toFixed(0)}, ${explorationTarget.y.toFixed(0)}), Distance=${distanceToTarget.toFixed(1)}`);
    }

    // Move toward exploration target if far enough away
    if (distanceToTarget > 25) {
      const speed = 60 * deltaTime; // Faster exploration speed
      const dx = (explorationTarget.x - monster.position.x) / distanceToTarget;
      const dy = (explorationTarget.y - monster.position.y) / distanceToTarget;

      // Check if the path toward target is clear before moving
      // FIXED: Check only 20 pixels ahead instead of 60 (was too far)
      const potentialX = monster.position.x + dx * 20;
      const potentialY = monster.position.y + dy * 20;
      
      if (!this.checkTileCollision(potentialX, potentialY)) {
        // Path is clear - set movement toward exploration target
        const vx = dx * speed;
        const vy = dy * speed;
        monster.position.vx = vx;
        monster.position.vy = vy;
        monster.target = explorationTarget;
        monster.state = MonsterState.MOVING;
        
        if (isSlowMonster) {
          console.log(`✅ ${monster.id.substring(0, 20)}: SET VELOCITY vx=${vx.toFixed(2)}, vy=${vy.toFixed(2)}, speed=${speed.toFixed(3)}, dt=${deltaTime.toFixed(3)}`);
        }
      } else {
        // Path blocked - DON'T spam new targets every frame
        // Add cooldown: only change target once per second
        const lastRetargetTime = (monster as any).lastRetargetTime || 0;
        const now = Date.now();
        
        if (now - lastRetargetTime > 1000) { // 1 second cooldown
          monster.setExplorationTarget();
          (monster as any).lastRetargetTime = now;
          
          if (isSlowMonster) {
            console.log(`🚧 ${monster.id.substring(0, 20)}: PATH BLOCKED at (${potentialX.toFixed(0)}, ${potentialY.toFixed(0)}), setting NEW target`);
          }
        }
        
        // Try to move around obstacle instead of stopping
        monster.position.vx = dx * speed * 0.3; // Move slowly toward target
        monster.position.vy = dy * speed * 0.3;
      }
    } else {
      // Reached exploration target - set new one
      monster.setExplorationTarget();
      if (isSlowMonster) {
        console.log(`🎯 ${monster.id.substring(0, 20)}: REACHED target, setting NEW one`);
      }
    }
  }

  private handleMonsterMining(monster: Monster, deltaTime: number): void {
    // CANNOT mine while carrying resources - hands are full!
    if (monster.carryingChunkId || monster.helpingCarryChunkId) {
      return; // Must deliver resources first
    }

    // Skip if monster has a user-generated mining task (from pheromone)
    if (monster.currentTask && monster.currentTask.userGenerated && 
        monster.currentTask.type === MonsterAction.MINE_NEARBY) {
      return; // Let the monster's own AI handle pheromone-based mining
    }

    // Check if monster should start mining (autonomous behavior)
    const tileX = Math.floor(monster.position.x / TILE_SIZE);
    const tileY = Math.floor(monster.position.y / TILE_SIZE);
    
    // Find the best tile to mine using ant-inspired tunneling logic
    const bestTile = this.findOptimalDiggingTile(monster, tileX, tileY);
    
    if (!bestTile) {
      monster.state = MonsterState.IDLE;
      return; // Nothing to mine
    }

    // Check pheromones - NEVER mine if "do not mine" pheromone is present!
    if (this.pheromoneSystem.isMiningForbidden(bestTile.x, bestTile.y)) {
      monster.state = MonsterState.IDLE;
      console.log(`Monster ${monster.id} respecting "do not mine" pheromone at (${bestTile.x}, ${bestTile.y})`);
      return; // Respect the pheromones!
    }
    
    if (bestTile) {
      const tile = this.world[bestTile.x][bestTile.y];
      const miningPower = monster.stats.miningSpeed / 255;
      
      // AGGRESSIVE MINING - Each "hit" does massive damage
      // Dirt (integrity 10-30) breaks in 1 hit
      // Stone (integrity 30-50) breaks in 2 hits
      const baseDamage = miningPower * 25; // INCREASED: Each hit does 25 damage (was 15)
      
      // Add some randomness for excitement - monsters hit harder more often!
      const criticalHit = Math.random() < 0.3; // 30% chance of critical hit (was 20%)
      const superCrit = Math.random() < 0.1; // 10% chance of SUPER critical hit (was 5%)
      
      let damage = baseDamage;
      if (superCrit) {
        damage = baseDamage * 3; // SUPER CRIT - instant break most blocks!
      } else if (criticalHit) {
        damage = baseDamage * 1.5; // Regular crit
      }
      
      // Show mining effort - monsters work hard!
      monster.state = MonsterState.MINING;
      
      // Create mining animation on EVERY hit for satisfying feedback
      // But only apply damage at intervals to simulate "hits"
      const now = Date.now();
      if (!monster.lastMiningHit || now - monster.lastMiningHit > 200) { // FASTER: Hit every 0.2 seconds (was 0.3)
        monster.lastMiningHit = now;
        
        // Visual feedback for the hit
        this.miningEffects.createMiningAnimation(
          monster.position.x, monster.position.y,
          bestTile.x, bestTile.y
        );
        
        // Show monster is working hard on every hit
        this.miningEffects.createEffortEffect(monster.position.x, monster.position.y);
        
        // Apply the damage
        tile.integrity -= damage;
        
        // DEBUG: Log mining progress
        if (Math.random() < 0.1) { // 10% of hits
          const tileProps = TILE_PROPERTIES[tile.type];
          console.log(`⛏️ Mining: ${tile.type} integrity ${tile.integrity.toFixed(1)}/${(tileProps.hardness * 10).toFixed(0)} (damage: ${damage.toFixed(1)})`);
        }
        
        // Show spark effect for critical hits - more subtle and satisfying
        if (criticalHit || superCrit) {
          const sparkX = bestTile.x * TILE_SIZE + TILE_SIZE / 2;
          const sparkY = bestTile.y * TILE_SIZE + TILE_SIZE / 2;
          
          // Create spark particles
          const sparkCount = superCrit ? 8 : 4; // More sparks for super crit
          const sparkColor = superCrit ? 0xFFFF00 : 0xFFAA00; // Yellow for super, orange for regular
          
          for (let i = 0; i < sparkCount; i++) {
            const spark = this.add.graphics();
            spark.fillStyle(sparkColor, 1);
            spark.fillCircle(0, 0, superCrit ? 3 : 2);
            spark.x = sparkX;
            spark.y = sparkY;
            
            // Random direction and speed for each spark
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Animate the spark flying outward
            this.tweens.add({
              targets: spark,
              x: spark.x + vx * 0.5,
              y: spark.y + vy * 0.5,
              alpha: 0,
              duration: 300 + Math.random() * 200,
              ease: 'Power2',
              onComplete: () => {
                spark.destroy();
              }
            });
          }
        }
      }
        
      // Show block damage visually as it weakens
      if (tile.integrity > 0) {
        // Block is getting damaged - show cracks or damage
        this.showBlockDamage(bestTile.x, bestTile.y, tile);
      } else {
        // BLOCK BREAKS! - This is the satisfying moment!
        
        // Create amazing break effect
        this.miningEffects.createBlockBreakEffect(bestTile.x, bestTile.y, tile.type);
        
        // Calculate resources with some randomness for excitement
        let actualResources = tile.resources;
        
        // Chance for bonus resources - make mining rewarding!
        if (tile.resources > 0) {
          const bonusChance = Math.random();
          if (bonusChance < 0.1) {
            // 10% chance for double resources!
            actualResources *= 2;
          } else if (bonusChance < 0.25) {
            // 15% chance for 50% bonus
            actualResources = Math.floor(actualResources * 1.5);
          }
        }
        
        // Even dirt and stone have a small chance of hidden resources
        if (actualResources === 0 && Math.random() < 0.05) {
          actualResources = 1 + Math.floor(Math.random() * 3); // 1-3 surprise resources
        }
        
        // Create resource chunks with celebration if valuable
        if (actualResources > 0) {
          this.resourceChunkManager.createChunksFromTile(tile.type, bestTile.x, bestTile.y, actualResources);
          this.miningEffects.createResourceDiscoveryEffect(
            bestTile.x * TILE_SIZE + 8, 
            bestTile.y * TILE_SIZE + 8, 
            actualResources
          );
          
          // Record this as a successful mining spot in monster's memory!
          monster.rememberSuccessfulMining(bestTile.x, bestTile.y, actualResources);
        }
        
        // Convert to air - this creates the tunnel system!
        tile.type = TileType.AIR;
        tile.integrity = 0;
        tile.resources = 0;
        tile.discovered = true;
        
        // Mark for re-render and update adjacent tiles for edge updates
        this.renderTile(bestTile.x, bestTile.y);
        this.tileRenderer.updateAdjacentTiles(bestTile.x, bestTile.y, this.world, TILE_SIZE);
        
        // CREATE 2-BLOCK-HIGH TUNNEL when mining horizontally TOWARD A PHEROMONE!
        // Tunnels based on monster height (2 blocks) - only expand when there's a mining goal
        if (monster.miningTarget && (monster.miningTarget.direction === 'left' || monster.miningTarget.direction === 'right')) {
          // Check if there's a pheromone in the mining direction (mining toward goal)
          const dirMultiplier = monster.miningTarget.direction === 'left' ? -1 : 1;
          let foundPheromone = false;
          for (let dist = 1; dist <= 3; dist++) {
            const checkX = bestTile.x + (dist * dirMultiplier);
            if (checkX >= 0 && checkX < WORLD_WIDTH) {
              const pheromone = this.pheromoneSystem?.getPheromoneAt(checkX, bestTile.y);
              if (pheromone && pheromone.type === PheromoneType.MINE_HERE && pheromone.strength > 10) {
                foundPheromone = true;
                break;
              }
            }
          }
          
          // Only create 2-high tunnel if mining toward pheromone (based on monster height)
          if (foundPheromone) {
            this.expandTunnelVertically(bestTile.x, bestTile.y, monster);
          }
        }
        
        // Monster feels accomplished after breaking a block
        // Energy always at 100% - no need to boost
        
        // Brief pause to admire their work
        setTimeout(() => {
          if (monster.state === MonsterState.MINING) {
            monster.state = MonsterState.IDLE;
          }
        }, 300);
      }
    } else {
      // No mining target - return to idle
      if (monster.state === MonsterState.MINING) {
        monster.state = MonsterState.IDLE;
      }
    }
  }

  /**
   * Expand tunnel vertically to create 2-block-high tunnels (based on monster height)
   * Clears 1 block above when mining horizontally - monsters only need 2 blocks high
   */
  private expandTunnelVertically(tileX: number, tileY: number, monster: Monster): void {
    const blocksToExpand: Array<{x: number, y: number}> = [];
    
    // Only expand UPWARD - monsters are 2 blocks tall, don't need floor cleared
    // Check block above
    if (tileY > 0) {
      const tileAbove = this.world[tileY - 1][tileX];
      if (tileAbove && TILE_PROPERTIES[tileAbove.type].diggable && tileAbove.type !== TileType.AIR) {
        blocksToExpand.push({x: tileX, y: tileY - 1});
      }
    }
    
    // Clear the additional blocks instantly (no mining time)
    blocksToExpand.forEach(pos => {
      const tile = this.world[pos.y][pos.x];
      const properties = TILE_PROPERTIES[tile.type];
      
      // Small chance for resources from expanded blocks
      let resources = 0;
      if (tile.resources > 0 && Math.random() < 0.5) {
        resources = Math.max(1, Math.floor(tile.resources * 0.5)); // 50% of normal resources
        this.resourceChunkManager.createChunksFromTile(tile.type, pos.x, pos.y, resources);
      }
      
      // Break effect for visual feedback
      this.miningEffects.createBlockBreakEffect(pos.x, pos.y, tile.type);
      
      // Convert to air
      tile.type = TileType.AIR;
      tile.integrity = 0;
      tile.resources = 0;
      tile.discovered = true;
      
      // Render updates
      this.renderTile(pos.x, pos.y);
      this.tileRenderer.updateAdjacentTiles(pos.x, pos.y, this.world, TILE_SIZE);
    });
    
    if (blocksToExpand.length > 0) {
      console.log(`   🏗️ TUNNEL EXPANSION: Cleared ${blocksToExpand.length} block above for 2-high tunnel (monster height)`);
    }
  }

  /**
   * Show visual damage on blocks as they're being mined
   */
  private showBlockDamage(tileX: number, tileY: number, tile: Tile): void {
    const properties = TILE_PROPERTIES[tile.type];
    const maxIntegrity = properties.hardness * 10;
    const damagePercent = 1 - (tile.integrity / maxIntegrity);
    
    // Add visual cracks or damage overlay
    if (damagePercent > 0.3) {
      // Show damage effects
      const x = tileX * TILE_SIZE;
      const y = tileY * TILE_SIZE;
      
      // Create temporary damage overlay
      if (Math.random() < 0.1) { // Only occasionally to avoid spam
        const damage = this.add.graphics();
        damage.x = x;
        damage.y = y;
        
        // Draw damage lines/cracks
        damage.lineStyle(1, 0x000000, damagePercent);
        for (let i = 0; i < 3; i++) {
          damage.lineBetween(
            Math.random() * TILE_SIZE, Math.random() * TILE_SIZE,
            Math.random() * TILE_SIZE, Math.random() * TILE_SIZE
          );
        }
        
        // Fade out damage indicator
        this.tweens.add({
          targets: damage,
          alpha: 0,
          duration: 500,
          onComplete: () => damage.destroy()
        });
      }
    }
  }
  
  private findOptimalDiggingTile(monster: Monster, tileX: number, tileY: number): { x: number; y: number; priority: number } | null {
    let bestTile: { x: number; y: number; priority: number } | null = null;
    
    // SMART PATHFINDING: Check if there's a nearby pheromone we can WALK to without mining
    const nearbyPheromone = this.findNearestPheromone(tileX, tileY, 8);
    if (nearbyPheromone) {
      // Check if there's a clear path (or mostly clear) - walk close first!
      const canWalkCloser = this.canWalkToward(tileX, tileY, nearbyPheromone.x, nearbyPheromone.y);
      if (canWalkCloser) {
        // Don't mine yet - walk closer first!
        return null;
      }
      // If we can't walk, proceed to mine blocking tiles
    }
    
    // Check if monster should return to a successful mining area first
    if (monster.shouldReturnToMining && monster.getBestMiningMemory()) {
      const memory = monster.getBestMiningMemory();
      if (memory) {
        const memoryDistance = Math.sqrt(
          Math.pow(memory.x - tileX, 2) + Math.pow(memory.y - tileY, 2)
        );
        
        if (memoryDistance < 3) {
          // Near the successful area - clear the return flag and continue mining
          monster.clearReturnToMining();
        } else if (memoryDistance < 15) {
          // Close to successful area - prioritize mining here
          // Continue with normal digging patterns but boosted priority
        }
      }
    }

    // Define BALANCED digging patterns - horizontal preference but allow downward mining
    const diggingPatterns = [
      // MASSIVE horizontal preference - exploration and chamber creation
      { dx: -1, dy: 0, priority: 500, type: 'horizontal_left' },
      { dx: 1, dy: 0, priority: 500, type: 'horizontal_right' },
      
      // Upward diagonal - monsters prefer going up
      { dx: -1, dy: -1, priority: 80, type: 'stair_up_left' },
      { dx: 1, dy: -1, priority: 80, type: 'stair_up_right' },
      
      // Downward diagonal - moderate priority for proper mining
      { dx: -1, dy: 1, priority: 60, type: 'stair_down_left' },
      { dx: 1, dy: 1, priority: 60, type: 'stair_down_right' },
      
      // Straight down - lower priority but still available for deep mining
      { dx: 0, dy: 1, priority: 40, type: 'straight_down' },
    ];
    
    for (const pattern of diggingPatterns) {
      const x = tileX + pattern.dx;
      const y = tileY + pattern.dy;
      
      if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        const tile = this.world[x][y];
        
        if (TILE_PROPERTIES[tile.type].diggable && tile.integrity > 0) {
          let priority = pattern.priority;
          
          // Bonus for ore tiles
          if (tile.resources > 0) {
            priority += tile.resources * 20;
          }
          
          // Ant-inspired tunnel logic
          priority += this.calculateAntTunnelPriority(x, y, pattern.type, monster);
          
          // MASSIVE bonus for mining while standing on solid ground!
          if (monster.position.onGround && !monster.isWallCrawling) {
            priority *= 3.0; // Triple priority when on solid ground!
          }
          
          // Heavy penalty for mining while wall-crawling
          if (monster.isWallCrawling) {
            priority *= 0.1; // Monsters avoid mining while wall-crawling
          }
          
          // Check pheromone influence on mining priority - ULTRA MASSIVE BOOST!
          if (this.pheromoneSystem.isMiningForbidden(x, y)) {
            priority = 0; // Completely forbidden by pheromones
          } else if (this.pheromoneSystem.isMiningEncouraged(x, y)) {
            priority *= 50.0; // ULTRA MASSIVE boost for "mine here" pheromones - EXTREMELY determined to reach!
          }
          
          // AGGRESSIVE PATHFINDING: Check if this tile is blocking path to a pheromone
          const blockingPathToPheromone = this.isBlockingPathToPheromone(x, y, tileX, tileY);
          if (blockingPathToPheromone) {
            priority *= 20.0; // Mine through blocks to reach deep pheromones!
          }
          
          // Apply genetic preferences
          const curiosity = monster.genetics.curiosity.value / 255;
          const strength = monster.genetics.strength.value / 255;
          
          if (pattern.type.includes('horizontal')) {
            priority *= (1.2 + strength * 0.8); // Strong monsters LOVE horizontal mining
          } else if (pattern.type.includes('stair_down')) {
            priority *= (0.8 + curiosity * 0.4); // Curious monsters dig downward ramps
          } else if (pattern.type.includes('stair_up')) {
            priority *= (0.3 + curiosity * 0.3); // Discourage upward mining unless curious
          }
          
          if (!bestTile || priority > bestTile.priority) {
            bestTile = { x, y, priority };
          }
        }
      }
    }
    
    return bestTile;
  }

  /**
   * Check if monster can walk toward a position without mining
   */
  private canWalkToward(fromX: number, fromY: number, toX: number, toY: number): boolean {
    // Simple check: can we move 1-2 tiles closer without hitting solid blocks?
    const dx = Math.sign(toX - fromX);
    const dy = Math.sign(toY - fromY);
    
    // Check next tile in that direction
    const nextX = fromX + dx;
    const nextY = fromY;
    
    if (nextX >= 0 && nextX < WORLD_WIDTH && nextY >= 0 && nextY < WORLD_HEIGHT) {
      const nextTile = this.world[nextY][nextX];
      if (nextTile && nextTile.type === TileType.AIR) {
        return true; // Can walk horizontally
      }
    }
    
    return false; // Blocked - need to mine
  }

  /**
   * Find nearest MINE_HERE pheromone
   */
  private findNearestPheromone(tileX: number, tileY: number, radius: number): {x: number, y: number} | null {
    let nearest: {x: number, y: number, distance: number} | null = null;
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const checkX = tileX + dx;
        const checkY = tileY + dy;
        
        if (checkX >= 0 && checkX < WORLD_WIDTH && checkY >= 0 && checkY < WORLD_HEIGHT) {
          const pheromone = this.pheromoneSystem?.getPheromoneAt(checkX, checkY);
          if (pheromone && pheromone.type === PheromoneType.MINE_HERE && pheromone.strength > 10) {
            const distance = Math.abs(dx) + Math.abs(dy);
            if (!nearest || distance < nearest.distance) {
              nearest = {x: checkX, y: checkY, distance};
            }
          }
        }
      }
    }
    
    return nearest;
  }

  /**
   * Check if this tile is blocking the path to a pheromone
   * Makes monsters aggressively mine toward deep pheromones
   */
  private isBlockingPathToPheromone(tileX: number, tileY: number, monsterTileX: number, monsterTileY: number): boolean {
    // Look for pheromones in a large area
    const pheromone = this.findNearestPheromone(monsterTileX, monsterTileY, 25);
    if (!pheromone) return false;
    
    // Check if this tile is roughly in the direction of the pheromone
    const dx = pheromone.x - monsterTileX;
    const dy = pheromone.y - monsterTileY;
    const tileDx = tileX - monsterTileX;
    const tileDy = tileY - monsterTileY;
    
    // Tile is blocking if it's in the same direction as the pheromone
    const sameXDirection = (dx > 0 && tileDx > 0) || (dx < 0 && tileDx < 0) || dx === 0;
    const sameYDirection = (dy > 0 && tileDy > 0) || (dy < 0 && tileDy < 0) || dy === 0;
    
    return sameXDirection && sameYDirection;
  }

  /**
   * Calculate priority based on ant colony tunneling principles
   */
  private calculateAntTunnelPriority(x: number, y: number, digType: string, monster: Monster): number {
    let bonus = 0;
    
    // Check surrounding tiles for tunnel connectivity
    let connectedToTunnel = 0;
    let hasGoodSupport = false;
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const adjTile = this.world[x + dx]?.[y + dy];
        if (adjTile) {
          if (adjTile.type === TileType.AIR) {
            connectedToTunnel++;
          }
          
          // Check for structural support (like ants do)
          if (dy === 1 && TILE_PROPERTIES[adjTile.type].solid) {
            hasGoodSupport = true;
          }
        }
      }
    }
    
    // Prefer tiles that connect to existing tunnels (ant networks)
    bonus += connectedToTunnel * 15;
    
    // Ant-like structural awareness
    if (hasGoodSupport) {
      bonus += 25;
    }
    
    // Encourage chamber-like spaces (ants create rooms)
    if (digType === 'horizontal' && connectedToTunnel > 2) {
      bonus += 30; // Creating a chamber
    }
    
    // Discourage creating isolated pockets
    if (connectedToTunnel === 0) {
      bonus -= 50;
    }
    
    return bonus;
  }

  /**
   * Check if digging straight down would create a dangerous vertical drop
   */
  private wouldCreateVerticalDrop(x: number, y: number): boolean {
    // Check if there are more than 2 consecutive air spaces below
    let consecutiveAir = 0;
    for (let checkY = y + 1; checkY < Math.min(y + 4, WORLD_HEIGHT); checkY++) {
      const tileBelow = this.world[x][checkY];
      if (tileBelow && tileBelow.type === TileType.AIR) {
        consecutiveAir++;
      } else {
        break;
      }
    }
    
    return consecutiveAir > 2; // More than 2 air tiles below = dangerous drop
  }

  /**
   * Handle ant-like resource carrying behavior
   */
  private handleResourceCarrying(monster: Monster, deltaTime: number): void {
    // If monster is already carrying something, move toward hive
    if (monster.carryingChunkId) {
      this.moveChunkTowardHive(monster);
      return;
    }

    // If monster is helping carry something, coordinate with team
    if (monster.helpingCarryChunkId) {
      this.helpCarryChunk(monster);
      return;
    }

    // LEAD MINER CHECK: Don't pick up resources if currently lead mining
    const isLeadMiner = (monster as any).isLeadMiner && 
                        (monster as any).leadMinerUntil && 
                        Date.now() < (monster as any).leadMinerUntil;
    
    if (isLeadMiner) {
      // Lead miners focus on digging, not carrying
      return;
    }
    
    // Look for available chunks to carry
    const nearbyChunk = this.resourceChunkManager.getClosestAvailableChunk(
      monster.position.x, monster.position.y
    );

    if (nearbyChunk) {
      const distance = Math.sqrt(
        Math.pow(nearbyChunk.x - monster.position.x, 2) + 
        Math.pow(nearbyChunk.y - monster.position.y, 2)
      );

      // If close enough to chunk, try to pick it up
      if (distance < 25) { // Increased range for bigger chunks
        if (nearbyChunk.carriersNeeded === 1) {
          // Light chunk - carry alone (rare now!)
          if (this.resourceChunkManager.addCarrier(nearbyChunk.id, monster.id)) {
            monster.carryingChunkId = nearbyChunk.id;
            monster.currentAction = monster.currentAction;
          }
        } else if (nearbyChunk.currentCarriers.length === 0) {
          // Heavy chunk - start carrying and desperately call for help!
          if (this.resourceChunkManager.addCarrier(nearbyChunk.id, monster.id)) {
            monster.carryingChunkId = nearbyChunk.id;
            monster.currentAction = monster.currentAction;
            
            // Heavy chunks are much harder to move alone
            if (nearbyChunk.carriersNeeded >= 3) {
              // Super heavy - monster can barely budge it alone
              // Energy system removed - no energy cost
            }
          }
        } else if (nearbyChunk.currentCarriers.length < nearbyChunk.carriersNeeded) {
          // Join existing carrying team - BUT check compatibility!
          const canFly = this.ragdollPhysics.hasWings(monster.id);
          
          // Check if existing carriers are compatible
          let teamHasFlyers = false;
          let teamHasGroundMonsters = false;
          for (const carrierId of nearbyChunk.currentCarriers) {
            const carrier = this.monsters.find(m => m.id === carrierId);
            if (carrier) {
              if (this.ragdollPhysics.hasWings(carrier.id)) {
                teamHasFlyers = true;
              } else {
                teamHasGroundMonsters = true;
              }
            }
          }
          
          // RULE: Flyers only co-carry with other flyers on HEAVY objects (3+ carriers needed)
          // RULE: Ground monsters can't mix with flyers
          const canJoinTeam = (canFly && teamHasFlyers && !teamHasGroundMonsters && nearbyChunk.carriersNeeded >= 3) ||
                              (!canFly && !teamHasFlyers && teamHasGroundMonsters);
          
          if (canJoinTeam && this.resourceChunkManager.addCarrier(nearbyChunk.id, monster.id)) {
            monster.helpingCarryChunkId = nearbyChunk.id;
            monster.currentAction = monster.currentAction;
          }
        }
      } else {
        // Move toward the chunk with urgency if it needs help
        monster.target = { x: nearbyChunk.x, y: nearbyChunk.y };
        
        // Higher priority for chunks that need more help
        if (nearbyChunk.currentCarriers.length > 0 && 
            nearbyChunk.currentCarriers.length < nearbyChunk.carriersNeeded) {
          // Boost movement speed toward chunks that need help
          const helpUrgency = (nearbyChunk.carriersNeeded - nearbyChunk.currentCarriers.length) / nearbyChunk.carriersNeeded;
          monster.position.vx *= (1 + helpUrgency * 0.5);
          monster.position.vy *= (1 + helpUrgency * 0.5);
        }
      }
    }
  }

  /**
   * Move a carried chunk toward the hive
   */
  private moveChunkTowardHive(monster: Monster): void {
    if (!monster.carryingChunkId) return;

    const hivePos = this.colonyHive.getDepositPosition();
    const chunkId = monster.carryingChunkId;

    // Track horizontal progress to detect stuck carriers
    if (!(monster as any).carryStartTime) {
      (monster as any).carryStartTime = Date.now();
      (monster as any).carryStartX = monster.position.x;
      (monster as any).lastCarryX = monster.position.x;
      (monster as any).lastCarryCheckTime = Date.now();
    }

    // Check if stuck (not making horizontal progress toward hive)
    const now = Date.now();
    const timeSinceLastCheck = (now - (monster as any).lastCarryCheckTime) / 1000;
    
    if (timeSinceLastCheck >= 2) { // Check every 2 seconds
      const horizontalProgress = Math.abs(monster.position.x - (monster as any).lastCarryX);
      const distanceToHive = Math.abs(monster.position.x - hivePos.x);
      
      // If moved less than 10px horizontally in 2 seconds while far from hive = STUCK
      if (horizontalProgress < 10 && distanceToHive > 50) {
        console.log(`🎯 ${monster.id.substring(0, 20)}: STUCK while carrying! Throwing block toward hive!`);
        console.log(`   Progress: ${horizontalProgress.toFixed(1)}px in ${timeSinceLastCheck.toFixed(1)}s`);
        console.log(`   Distance to hive: ${distanceToHive.toFixed(0)}px`);
        
        // Throw the chunk toward the hive!
        const chunks = this.resourceChunkManager.getAllChunks();
        const chunk = chunks.find(c => c.id === chunkId);
        
        if (chunk) {
          // Calculate throw direction toward hive
          const dx = hivePos.x - monster.position.x;
          const throwDistance = Math.min(100, distanceToHive * 0.3); // Throw 30% of distance, max 100px
          const throwX = monster.position.x + Math.sign(dx) * throwDistance;
          const throwY = monster.position.y - 20; // Slight upward throw
          
          // Move chunk to thrown position
          this.resourceChunkManager.moveChunk(chunkId, throwX, throwY);
          console.log(`   📦 Threw chunk from (${monster.position.x.toFixed(0)}, ${monster.position.y.toFixed(0)}) to (${throwX.toFixed(0)}, ${throwY.toFixed(0)})`);
        }
        
        // Drop the chunk and clear carrier state
        this.resourceChunkManager.removeCarrier(chunkId, monster.id);
        monster.carryingChunkId = null;
        (monster as any).carryStartTime = null;
        (monster as any).carryStartX = null;
        (monster as any).lastCarryX = null;
        (monster as any).lastCarryCheckTime = null;
        
        // Reset to exploration/mining
        monster.target = null;
        monster.state = MonsterState.IDLE;
        monster.currentAction = MonsterAction.EXPLORE;
        
        console.log(`   ✅ Monster freed to continue other work`);
        return;
      }
      
      // Update tracking for next check
      (monster as any).lastCarryX = monster.position.x;
      (monster as any).lastCarryCheckTime = now;
    }

    // Move toward hive - but much slower with heavy chunks!
    monster.target = hivePos;
    
    // Calculate and store weight slowdown multiplier on monster
    const chunks = this.resourceChunkManager.getAllChunks();
    const chunk = chunks.find(c => c.id === chunkId);
    if (chunk) {
      // Weight-based slowdown: Dirt (8-12) = 0.88-0.92x, Stone (25-40) = 0.60-0.75x, Copper (50-70) = 0.30-0.50x
      (monster as any).carryingWeightMultiplier = Math.max(0.3, 1.0 - (chunk.weight * 0.01));
    } else {
      (monster as any).carryingWeightMultiplier = 1.0; // No slowdown if no chunk found
    }

    // Update chunk position
    this.resourceChunkManager.moveChunk(chunkId, monster.position.x, monster.position.y - 8);

    // Check if at hive
    if (this.colonyHive.isWithinCollectionRadius(monster.position.x, monster.position.y)) {
      // Deposit the chunk
      const chunk = this.resourceChunkManager.removeChunk(chunkId);
      if (chunk) {
        // Add resources to the proper category in RTS-style tracker!
        this.resourceTracker.addResources(chunk.tileType, chunk.resourceValue);
        
        // Show Age of Empires-style resource gain notification
        this.resourceTracker.showResourceGain(chunk.tileType, chunk.resourceValue, 
          monster.position.x, monster.position.y);
        
        this.totalResources += chunk.resourceValue; // Keep for backwards compatibility
        this.colonyHive.createDepositEffect(chunk);
        monster.carryingChunkId = null;
        (monster as any).carryingWeightMultiplier = 1.0; // Clear weight slowdown
        monster.target = null;

        // REWARD! Monster delivered resources - now wants to return to that mining area
        const bestMemory = monster.getBestMiningMemory();
        if (bestMemory) {
          monster.shouldReturnToMining = true;
          // Set target to return to successful mining area
          monster.target = { 
            x: bestMemory.x * TILE_SIZE + TILE_SIZE/2, 
            y: bestMemory.y * TILE_SIZE + TILE_SIZE/2 
          };
        }
      }
    }
  }

  /**
   * Help other monsters carry heavy chunks
   */
  private helpCarryChunk(monster: Monster): void {
    if (!monster.helpingCarryChunkId) return;

    const chunks = this.resourceChunkManager.getAllChunks();
    const chunk = chunks.find(c => c.id === monster.helpingCarryChunkId);
    
    if (!chunk || !chunk.isBeingCarried) {
      // Chunk is gone or not being carried
      monster.helpingCarryChunkId = null;
      return;
    }

    // Move toward chunk
    monster.target = { x: chunk.x, y: chunk.y };

    // Stay close to chunk
    const distance = Math.sqrt(
      Math.pow(chunk.x - monster.position.x, 2) + 
      Math.pow(chunk.y - monster.position.y, 2)
    );

    if (distance < 25) {
      // Help move chunk toward hive
      const hivePos = this.colonyHive.getDepositPosition();
      const direction = {
        x: (hivePos.x - chunk.x) / Math.sqrt(Math.pow(hivePos.x - chunk.x, 2) + Math.pow(hivePos.y - chunk.y, 2)),
        y: (hivePos.y - chunk.y) / Math.sqrt(Math.pow(hivePos.x - chunk.x, 2) + Math.pow(hivePos.y - chunk.y, 2))
      };

      // Move chunk slowly toward hive
      this.resourceChunkManager.moveChunk(
        chunk.id,
        chunk.x + direction.x * 10,
        chunk.y + direction.y * 10
      );

      // Check if chunk reached hive
      if (this.colonyHive.canDepositChunk(chunk)) {
        const removedChunk = this.resourceChunkManager.removeChunk(chunk.id);
        if (removedChunk) {
          // Add resources to the proper category in RTS-style tracker!
          this.resourceTracker.addResources(removedChunk.tileType, removedChunk.resourceValue);
          
          // Show Age of Empires-style resource gain notification
          this.resourceTracker.showResourceGain(removedChunk.tileType, removedChunk.resourceValue, 
            chunk.x, chunk.y);
          
          this.totalResources += removedChunk.resourceValue; // Keep for backwards compatibility
          this.colonyHive.createDepositEffect(removedChunk);
          
          // Clear all carriers and give them return-to-mining instincts
          for (const carrierId of chunk.currentCarriers) {
            const carrier = this.monsters.find(m => m.id === carrierId);
            if (carrier) {
              carrier.carryingChunkId = null;
              carrier.helpingCarryChunkId = null;
              carrier.target = null;

              // Each carrier gets the reward instinct to return
              const bestMemory = carrier.getBestMiningMemory();
              if (bestMemory) {
                carrier.shouldReturnToMining = true;
                carrier.target = { 
                  x: bestMemory.x * TILE_SIZE + TILE_SIZE/2, 
                  y: bestMemory.y * TILE_SIZE + TILE_SIZE/2 
                };
              }
            }
          }
        }
      }
    }
  }

  /**
   * Update colony systems
   */
  private updateColonySystems(deltaTime: number): void {
    // Update hive
    this.colonyHive.update(deltaTime);
    
    // Update resource chunks
    this.resourceChunkManager.update();
  }

  /**
   * Handle monsters pushing each other - moving monsters push stuck ones
   */
  private handleMonsterPushing(monster: Monster, deltaTime: number): void {
    // Track horizontal movement for stuck detection
    if (!(monster as any).movementTracker) {
      (monster as any).movementTracker = {
        lastX: monster.position.x,
        lastCheckTime: Date.now(),
        totalHorizontalMovement: 0,
        isStuck: false
      };
    }
    
    const tracker = (monster as any).movementTracker;
    const now = Date.now();
    const timeSinceCheck = (now - tracker.lastCheckTime) / 1000;
    
    // Update movement tracking every second
    if (timeSinceCheck >= 1) {
      const horizontalMovement = Math.abs(monster.position.x - tracker.lastX);
      tracker.totalHorizontalMovement += horizontalMovement;
      tracker.lastX = monster.position.x;
      tracker.lastCheckTime = now;
      
      // Check if stuck (less than 20px total horizontal movement in 4 seconds)
      if (timeSinceCheck >= 4 && tracker.totalHorizontalMovement < 20) {
        tracker.isStuck = true;
      } else if (tracker.totalHorizontalMovement > 20) {
        tracker.isStuck = false;
        tracker.totalHorizontalMovement = 0; // Reset counter when moving
      }
    }
    
    // If this monster is stuck, it can be pushed by others
    if (tracker.isStuck) {
      (monster as any).canBePushed = true;
    }
    
    // If this monster is moving, check for pushing stuck monsters
    const isMoving = Math.abs(monster.position.vx) > 15 || Math.abs(monster.position.vy) > 15;
    
    if (isMoving) {
      // Check for collisions with stuck monsters
      for (const other of this.monsters) {
        if (other.id === monster.id) continue;
        if (!(other as any).canBePushed) continue; // Only push stuck monsters
        
        // Calculate distance between monsters
        const dx = other.position.x - monster.position.x;
        const dy = other.position.y - monster.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Collision threshold - about 1 tile
        if (distance < TILE_SIZE * 1.5) {
          // PUSH THE STUCK MONSTER!
          const pushStrength = 150; // Strong push
          const pushAngle = Math.atan2(dy, dx);
          
          // Apply push force in direction away from moving monster
          other.position.vx = Math.cos(pushAngle) * pushStrength;
          other.position.vy = Math.sin(pushAngle) * pushStrength * 0.5; // Less vertical push
          
          // Make them fall over for dramatic effect
          (other as any).facePlanted = true;
          (other as any).recoverTime = 0.5; // 0.5 second recovery
          other.position.onGround = false; // Knock them off ground
          
          // Mark as no longer stuck after being pushed
          (other as any).canBePushed = false;
          if ((other as any).movementTracker) {
            (other as any).movementTracker.isStuck = false;
            (other as any).movementTracker.totalHorizontalMovement = 100; // Reset with high value
          }
          
          console.log(`💥 ${monster.id.substring(0, 15)} PUSHED stuck monster ${other.id.substring(0, 15)}!`);
          console.log(`   Push force: vx=${other.position.vx.toFixed(1)}, vy=${other.position.vy.toFixed(1)}`);
          
          // Slight recoil for pusher too
          monster.position.vx *= 0.9;
        }
      }
    }
  }

  private applyPhysics(monster: Monster, deltaTime: number): void {
    // 🐛 DEBUG: Track if monster has low velocity
    const isMovingSlowly = Math.abs(monster.position.vx) < 5 && Math.abs(monster.position.vy) < 5;
    if (isMovingSlowly && Math.random() < 0.05) { // 5% chance to log slow monsters
      // DISABLED spam log
      // console.log(`🐌 SLOW MONSTER: ${monster.id.substring(0, 20)}`);
      console.log(`   Position: (${monster.position.x.toFixed(1)}, ${monster.position.y.toFixed(1)})`);
      console.log(`   Velocity: vx=${monster.position.vx.toFixed(1)}, vy=${monster.position.vy.toFixed(1)}`);
      console.log(`   OnGround: ${monster.position.onGround}`);
      console.log(`   FacePlanted: ${(monster as any).facePlanted || false}`);
      console.log(`   RecoverTime: ${(monster as any).recoverTime || 0}`);
      console.log(`   Target: ${monster.target ? `(${monster.target.x.toFixed(0)}, ${monster.target.y.toFixed(0)})` : 'none'}`);
      console.log(`   Carrying: ${monster.carryingChunkId || 'none'}`);
    }
    
    // PYRAMID CLIMBING RESOURCE THROW LOGIC
    const pyramidCenter = WORLD_WIDTH * TILE_SIZE / 2;
    
    // Detect repeated jumping without progress
    this.detectJumpingStuck(monster);
    
    // Check if we should throw resource to climb
    if (monster.shouldThrowResourceForClimbing(this.world, pyramidCenter)) {
      monster.throwResourceUp(this.resourceChunkManager);
    }
    
    // Try to pick up thrown resource if climbing
    if (monster.isClimbing) {
      monster.tryPickUpThrownResource(this.resourceChunkManager);
    }
    
    // Check if monster can fly - use WINGS, not movementType!
    const canFly = this.ragdollPhysics.hasWings(monster.id); // All winged monsters fly!
    const canHop = monster.sprite && (monster.sprite as any).movementType === 'hop';
    
    // STRONG GRAVITY - non-flyers FALL HARD
    const gravity = canFly ? 0 : 3000; // INCREASED: Much heavier gravity for faster falling
    const terminalVelocity = canFly ? 0 : 1200; // INCREASED: Faster terminal velocity
    const airResistance = 0.95; // Less air resistance = faster fall
    const groundFriction = 0.75; // More friction - less sliding
    const wallCrawlSpeed = 0.05; // EXTREMELY slow wall-crawling (was 0.1)
    // Energy system removed - no energy drain for wall climbing
    
    // ====== MARIO-STYLE PLATFORM PHYSICS ======
    // Multi-point collision detection for smooth platforming
    
    const currentTileX = Math.floor(monster.position.x / TILE_SIZE);
    const currentTileY = Math.floor(monster.position.y / TILE_SIZE);
    
    // MONSTER DIMENSIONS - Get REAL bounds from sprite container
    // Monster position represents the CENTER of the sprite container
    // We need to calculate actual feet position from container bounds
    
    let monsterHeight = 16; // Default fallback
    let monsterWidth = 12; // Default fallback
    
    if (monster.sprite && monster.sprite.getBounds) {
      const bounds = monster.sprite.getBounds();
      monsterHeight = bounds.height || 16;
      monsterWidth = bounds.width || 12;
    }
    
    const halfHeight = monsterHeight / 2;
    const halfWidth = monsterWidth / 2;
    
    // FEET = bottom of sprite container
    const feetY = monster.position.y + halfHeight;
    const leftFootX = monster.position.x - halfWidth;
    const rightFootX = monster.position.x + halfWidth;
    
    // VISUAL DEBUG: Disabled (hitboxes confirmed working)
    // Uncomment to re-enable hitbox visualization
    /*
    if (monster.sprite && !monster.sprite.getData('debugGraphics')) {
      const graphics = this.add.graphics();
      graphics.setDepth(10000);
      monster.sprite.setData('debugGraphics', graphics);
    }
    const debugGraphics = monster.sprite?.getData('debugGraphics') as Phaser.GameObjects.Graphics;
    if (debugGraphics) {
      debugGraphics.clear();
      debugGraphics.lineStyle(1, 0x00ff00, 1);
      debugGraphics.strokeRect(
        monster.position.x - halfWidth,
        monster.position.y - halfHeight,
        monsterWidth,
        monsterHeight
      );
      debugGraphics.fillStyle(0xff0000, 1);
      debugGraphics.fillCircle(leftFootX, feetY, 2);
      debugGraphics.fillCircle(monster.position.x, feetY, 2);
      debugGraphics.fillCircle(rightFootX, feetY, 2);
    }
    */
    
    // DEBUG: Wall collision debugging (horizontal vibration)
    const ENABLE_WALL_DEBUG = true;
    const DEBUG_SAMPLE_RATE = 0.03; // 3% sample rate
    const debugThis = ENABLE_WALL_DEBUG && Math.random() < DEBUG_SAMPLE_RATE;
    
    // ANOMALY DETECTION: Track before/after state for this monster
    const monsterDebugKey = `debug_${monster.id}`;
    if (!(monster as any)[monsterDebugKey]) {
      (monster as any)[monsterDebugKey] = {
        lastPos: { x: monster.position.x, y: monster.position.y },
        lastState: { onGround: monster.position.onGround, insideBlock: false },
        frameCount: 0
      };
    }
    const debugState = (monster as any)[monsterDebugKey];
    
    // Store BEFORE state
    const beforePos = { x: monster.position.x, y: monster.position.y };
    const beforeOnGround = monster.position.onGround;
    
    // MARIO-STYLE GROUND DETECTION
    // Check 3 points: left foot, center, right foot
    // Need at least ONE point on solid ground to be grounded
    let hasGroundSupport = false;
    let groundSurfaceY = 0;
    
    const checkPoints = [
      { x: leftFootX, label: 'left foot' },
      { x: monster.position.x, label: 'center' },
      { x: rightFootX, label: 'right foot' }
    ];
    
    // Debug logging removed - only wall collision debugging now
    
    for (const point of checkPoints) {
      const checkTileX = Math.floor(point.x / TILE_SIZE);
      const feetTileY = Math.floor(feetY / TILE_SIZE);
      
      // Check BOTH current tile AND tile below for ground support
      const tilesToCheck = [feetTileY, feetTileY + 1];
      
      for (const checkTileY of tilesToCheck) {
        if (checkTileX >= 0 && checkTileX < WORLD_WIDTH && checkTileY >= 0 && checkTileY < WORLD_HEIGHT) {
          const tileBelow = this.world[checkTileX][checkTileY];
          
          if (tileBelow && TILE_PROPERTIES[tileBelow.type].solid) {
            const tileSurfaceY = checkTileY * TILE_SIZE; // Top of tile
            const distanceAboveSurface = tileSurfaceY - feetY; // Positive = monster above tile
            
            // CRITICAL: Check that we're actually ABOVE the tile, not beside it
            // Monster's horizontal center must be within the tile bounds horizontally
            const tileLeftEdge = checkTileX * TILE_SIZE;
            const tileRightEdge = (checkTileX + 1) * TILE_SIZE;
            const isHorizontallyAligned = point.x >= tileLeftEdge - 2 && point.x <= tileRightEdge + 2;
            
            // PLATFORM COLLISION: Detect ground within reasonable range, then snap precisely
            // Monster must be above the tile (not inside it) and within half a tile
            if (distanceAboveSurface >= 0 && distanceAboveSurface <= 8 && isHorizontallyAligned) {
              hasGroundSupport = true;
              // PIXEL-PERFECT: Feet should be EXACTLY at the tile surface
              groundSurfaceY = tileSurfaceY;
              break; // Found ground, exit tile checking loop
            }
          }
        }
      }
      
      if (hasGroundSupport) break; // Found ground, exit point checking loop
    }
    
    // Cliff/ground detection logging removed

    // Wall crawling disabled
    const canWallCrawl = false;
    
    // STANDARD 2D PLATFORMER PHYSICS
    if (!canFly) {
      if (hasGroundSupport) {
        // GROUND COLLISION: Only snap if falling or not yet grounded
        const correctCenterY = groundSurfaceY - halfHeight;
        const distanceFromCorrect = Math.abs(monster.position.y - correctCenterY);
        
        // Ground distance tracking removed
        
        // ANTI-VIBRATION: Gentle snapping to prevent shaking
        // - Large errors (>4px): Always snap
        // - Landing (not grounded yet): Snap if >1px off
        // - Already grounded: Only snap if drifting significantly (>2px)
        const needsSnap = distanceFromCorrect > 4 || 
                         (!monster.position.onGround && distanceFromCorrect > 1) ||
                         (monster.position.onGround && distanceFromCorrect > 2);
        if (needsSnap) {
          // Smooth interpolation instead of hard snap (prevents jitter)
          const snapAmount = 0.3; // 30% towards correct position per frame
          monster.position.y += (correctCenterY - monster.position.y) * snapAmount;
        }
        
        monster.position.vy = 0;
        monster.position.onGround = true;
        
        // Reset jump states when landing
        monster.hasJumped = false;
        monster.canDoubleJump = false;
        (monster as any).justJumped = false;
        (monster as any).attemptingSingleBlockJump = false; // Clear jump attempt flag
        
        // Apply ground physics
        monster.isWallCrawling = false;
        monster.facingBackward = false;
        monster.position.vx *= groundFriction;
      } else {
        // NO GROUND: Fall with gravity
        monster.position.onGround = false;
        monster.isWallCrawling = false;
        monster.facingBackward = false;
        
        // Apply gravity - MARIO-STYLE: Quick fall, slightly floaty rise
        const gravityMultiplier = monster.position.vy > 0 ? 1.0 : 0.85; // Normal fall, slightly floaty rise
        monster.position.vy += gravity * deltaTime * gravityMultiplier;
        monster.position.vy = Math.min(monster.position.vy, terminalVelocity);
        
        // Air resistance
        monster.position.vx *= airResistance;
        
        // Track falling for damage
        if (monster.position.vy > 50) {
          if (!(monster as any).isFalling) {
            (monster as any).isFalling = true;
            (monster as any).fallStartY = monster.position.y;
          }
          (monster as any).fallHeight = monster.position.y - (monster as any).fallStartY;
        }
        
        // 🐛 JUMP DEBUG
        if ((monster as any).debugJumps) {
          console.log(`   ⬇️ FALLING: vy=${monster.position.vy.toFixed(1)}`);
        }
      }
    } else {
      // FLYING MONSTERS: Different physics
      monster.position.onGround = false;
      monster.isWallCrawling = false;
      monster.facingBackward = false;
      (monster as any).isFalling = false;
      (monster as any).fallHeight = 0;
      
      // Flying monsters use their own movement system
      // Handled elsewhere in the code
    }
      
      // Check fall damage based on fall height (measured from FEET, 16px = 1 block)
      // FLYING MONSTERS DON'T TAKE FALL DAMAGE!
      if (!canFly && (monster as any).isFalling && (monster as any).fallHeight > 0) {
        const fallBlocks = (monster as any).fallHeight / TILE_SIZE; // Convert to blocks
        
        // 1.5 BLOCKS OR LESS - No reaction (normal walking down)
        if (fallBlocks <= 1.5) {
          // Just landed normally - no special animation needed
        }
        // 2-3 BLOCKS - Soft landing (crouch recovery)
        else if (fallBlocks < 3.5) {
          // Soft landing - brief crouch
          (monster as any).softLanding = true;
          (monster as any).recoverTime = 0.5; // Half second pause
          monster.position.vx *= 0.3; // Slow down significantly
        }
        // 3.5+ BLOCKS - Face plant (hard landing with damage)
        else {
          // HARD STOP - complete momentum kill
          monster.position.vx = 0;
          monster.position.vy = 0;
          
          // DAMAGE from hard falls
          const fallDamage = Math.min(80, (monster as any).fallHeight / 2);
          monster.energy -= fallDamage;
          
          // CHECK FOR DEATH
          if (monster.energy <= 0) {
            // MONSTER DIED FROM FALL!
            console.log(`Monster ${monster.id} DIED from fall! Height: ${fallBlocks.toFixed(1)} blocks`);
            
            // Turn monster into a corpse resource
            this.createCorpseResource(monster);
            
            // Remove from active monsters
            const index = this.monsters.indexOf(monster);
            if (index > -1) {
              this.monsters.splice(index, 1);
            }
            
            // Destroy sprite
            if (monster.sprite) {
              monster.sprite.destroy();
            }
          } else {
            // SURVIVED - face plant with recovery animation
            (monster as any).facePlanted = true;
            (monster as any).recoverTime = 0.75; // 0.75 seconds to recover
            
            console.log(`Monster ${monster.id} face-planted from ${fallBlocks.toFixed(1)} blocks! Damage: ${fallDamage.toFixed(1)}`);
          }
        }
      }
      
      // Reset fall tracking
      (monster as any).fallTime = 0;
      (monster as any).fallHeight = 0;
      (monster as any).isFalling = false;
      
      // Handle recovery from soft landing (crouch animation)
      if ((monster as any).softLanding) {
        (monster as any).recoverTime -= deltaTime;
        if ((monster as any).recoverTime <= 0) {
          (monster as any).softLanding = false; // Recovered!
        } else {
          // Crouch briefly - slow movement
          monster.position.vx *= 0.5;
          
          // Crouch visual (body lower, legs bent)
          if (monster.sprite) {
            const crouchProgress = 1.0 - ((monster as any).recoverTime / 0.5);
            const crouchOffset = Math.sin(crouchProgress * Math.PI) * -8; // Crouch down 8 pixels
            monster.sprite.y = monster.position.y + crouchOffset;
          }
        }
      }
      
      // Handle recovery from face plant
      if ((monster as any).facePlanted) {
        (monster as any).recoverTime -= deltaTime;
        
        // DEBUG: Log recovery progress
        if (Math.random() < 0.01) { // 1% chance to log (avoid spam)
          console.log(`🔄 ${monster.id.substring(0, 20)} recovering: ${((monster as any).recoverTime).toFixed(2)}s remaining`);
        }
        
        if ((monster as any).recoverTime <= 0) {
          (monster as any).facePlanted = false; // Recovered!
          console.log(`✅ ${monster.id.substring(0, 20)} RECOVERED from face plant!`);
          
          // Reset rotation and eyes
          if (monster.sprite) {
            monster.sprite.rotation = 0;
            monster.sprite.y = monster.position.y; // Reset Y position
            // Find and reopen eyes
            const container = monster.sprite as Phaser.GameObjects.Container;
            if (container.list) {
              container.list.forEach((child: any) => {
                if (child.name && child.name.includes('eye')) {
                  child.setScale(child.scaleX, child.scaleX); // Restore Y scale
                }
                // Reset arms to rest position
                if (child.name && (child.name.includes('leftArm') || child.name.includes('rightArm'))) {
                  child.y = child.restY || 15;
                  child.rotation = 0;
                }
              });
            }
          }
        } else {
          // Still recovering - can't move, lying horizontal
          monster.position.vx = 0;
          monster.position.vy = 0;
          
          // Face plant visual with ARMS PUSHING UP
          if (monster.sprite) {
            const recoverProgress = 1.0 - ((monster as any).recoverTime / 0.75);
            const container = monster.sprite as Phaser.GameObjects.Container;
            
            // Use stored facePlantDirection to rotate in correct direction
            const facePlantDir = (monster as any).facePlantDirection || 1;
            const rotationDirection = facePlantDir; // 1 = right (clockwise), -1 = left (counter-clockwise)
            
            if (recoverProgress < 0.4) {
              // Phase 1: Lying flat, eyes closed (first 40%)
              container.rotation = (Math.PI / 2) * rotationDirection; // 90 degrees in jump direction
              container.y = monster.position.y + 6; // Lying on ground
              
              // Close eyes
              if (container.list) {
                container.list.forEach((child: any) => {
                  if (child.name && child.name.includes('eye')) {
                    child.setScale(child.scaleX, 0); // Closed!
                  }
                  // Arms lying flat
                  if (child.name && (child.name.includes('leftArm') || child.name.includes('rightArm'))) {
                    child.y = 20; // Arms down
                  }
                });
              }
            } else if (recoverProgress < 0.7) {
              // Phase 2: Arms pushing up (40-70%)
              const pushProgress = (recoverProgress - 0.4) / 0.3; // 0 to 1
              container.rotation = (Math.PI / 2) * (1 - pushProgress * 0.5) * rotationDirection; // Start rotating up in correct direction
              container.y = monster.position.y + 6 * (1 - pushProgress * 0.3); // Lifting slightly
              
              // Arms PUSHING animation
              if (container.list) {
                container.list.forEach((child: any) => {
                  if (child.name && (child.name.includes('leftArm') || child.name.includes('rightArm'))) {
                    child.y = 20 - pushProgress * 25; // Arms extending down to push
                    child.rotation = pushProgress * 0.3; // Slight bend
                  }
                  // Eyes still closed
                  if (child.name && child.name.includes('eye')) {
                    child.setScale(child.scaleX, child.scaleX * pushProgress * 0.3); // Starting to open
                  }
                });
              }
            } else {
              // Phase 3: Standing up (70-100%)
              const standProgress = (recoverProgress - 0.7) / 0.3; // 0 to 1
              container.rotation = (Math.PI / 2) * 0.5 * (1 - standProgress) * rotationDirection; // Finish rotation in correct direction
              container.y = monster.position.y; // Back to normal height
              
              // Arms returning to rest, eyes opening
              if (container.list) {
                container.list.forEach((child: any) => {
                  if (child.name && (child.name.includes('leftArm') || child.name.includes('rightArm'))) {
                    child.y = -5 + (1 - standProgress) * 20; // Arms retracting
                    child.rotation = (1 - standProgress) * 0.3;
                  }
                  if (child.name && child.name.includes('eye')) {
                    child.setScale(child.scaleX, child.scaleX * (0.3 + standProgress * 0.7)); // Fully opening
                  }
                });
              }
            }
          }
          return; // Skip normal movement during recovery
        }
      }
      
      // OLD PHYSICS CODE DISABLED - USING NEW SIMPLE PHYSICS ABOVE
      /*
      if (canHop && Math.abs(monster.position.vx) > 0.1) {
        // Hopping movement - periodic jumps
        const hopTime = this.time.now * 0.003;
        if (Math.sin(hopTime) > 0.9 && monster.position.vy === 0) {
          // Check if near pyramid for stronger hops
          const nearPyramid = Math.abs(monster.position.x - (WORLD_WIDTH * TILE_SIZE / 2)) < TILE_SIZE * 15;
          monster.position.vy = nearPyramid ? -380 : -350; // Smooth hop forces
          // Energy system removed - no energy cost
        }
      } else if (canFly) {
        // Flying creatures NEVER stay on ground - immediate takeoff
        monster.position.vy = -200; // Gentle lift-off
        monster.position.onGround = false; // Never grounded
        // Energy system removed - no flying cost
      }
      
      // Apply ground friction always when on ground
      monster.position.vx *= groundFriction;
      
      // Prevent bouncing
      if (monster.position.vy > 0) {
        monster.position.vy = 0;
      }
    } else if (!hasGroundSupport && !canFly) {
      // NO GROUND SUPPORT - FALLING!
      monster.isWallCrawling = false;
      monster.facingBackward = false;
      
      // COYOTE TIME: Brief grace period after walking off edge
      // Allows jump input for ~100ms after leaving ground (like Mario!)
      if (monster.position.onGround) {
        (monster as any).coyoteTime = 0.1; // 100ms grace period
        if (debugThis) {
          console.log(`   🕐 COYOTE TIME activated (100ms grace)`);
        }
      }
      
      const wasGrounded = monster.position.onGround;
      monster.position.onGround = false;
      
      if (debugThis && wasGrounded) {
        console.log(`   ❌ NO LONGER GROUNDED: Starting to fall\n`);
      }
      
      // MARIO-STYLE GRAVITY: Smooth, floaty feel
      if (!canFly) {
        // SMOOTHER: Lower gravity multiplier for graceful arcs
        const gravityMultiplier = monster.position.vy > 0 ? 1.2 : 0.9; // Gentler fall, floaty rise
        monster.position.vy += gravity * deltaTime * gravityMultiplier;
        monster.position.vy = Math.min(monster.position.vy, terminalVelocity);
        
        // 🐛 JUMP DEBUG
        if ((monster as any).debugJumps) {
          console.log(`   ⬇️ GRAVITY: vy=${monster.position.vy.toFixed(1)} (multiplier=${gravityMultiplier})`);
        }
      }
      
      // Track fall for damage
      if (!canFly && monster.position.vy > 50) {
        if (!(monster as any).isFalling) {
          (monster as any).isFalling = true;
          (monster as any).fallStartY = monster.position.y;
        }
        (monster as any).fallHeight = monster.position.y - (monster as any).fallStartY;
      }
      
      // Air control - slight air resistance
      monster.position.vx *= airResistance;
      
    } else if (canWallCrawl && !hasGroundSupport) {
      // WALL CRAWLING MODE - extremely difficult!
      monster.isWallCrawling = true;
      monster.facingBackward = true; // Show monster's back (facing wall)
      monster.position.onGround = false;
      
      // Energy system removed - monsters can wall crawl indefinitely
      {
        // EXTREMELY slow movement when wall crawling
        monster.position.vx *= wallCrawlSpeed;
        monster.position.vy *= wallCrawlSpeed;
        
        // Still affected by gravity - wall crawling is hard work
        monster.position.vy += gravity * deltaTime * 0.8; // Still pulled down
        monster.position.vy = Math.min(monster.position.vy, terminalVelocity * 0.3);
      }
      
    } else {
      // FLYING or other special cases
      monster.isWallCrawling = false;
      monster.facingBackward = false;
      monster.position.onGround = false;
      
      if (canFly) {
        // FLYING - ZERO GRAVITY FREEDOM!
        (monster as any).isFalling = false; // Flying creatures NEVER fall
        (monster as any).fallHeight = 0; // No fall damage ever
        
        // ANIMATE FLYING - wing flapping and body bobbing!
        this.ragdollPhysics.updateFlying(
          monster.id,
          monster.position.vx,
          monster.position.vy,
          deltaTime
        );
        
        const isCarrying = monster.carryingChunkId !== null || monster.carryingResources > 0;
        
        if (isCarrying) {
          // STRUGGLING TO FLY WITH LOAD - but must reach hive!
          
          // If carrying resources, FLY DIRECTLY TO HIVE (both X and Y!)
          if (monster.target) {
            const dx = monster.target.x - monster.position.x;
            const dy = monster.target.y - monster.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 20) { // Not at hive yet
              // Fly directly toward target with reduced speed (carrying is hard)
              const carrySpeed = 60; // Slower when carrying (normal is 80)
              monster.position.vx = (dx / distance) * carrySpeed;
              monster.position.vy = (dy / distance) * carrySpeed;
              
              // Light damping for smooth movement
              monster.position.vx *= 0.95;
              monster.position.vy *= 0.95;
            } else {
              // Close to hive - slow down
              monster.position.vx *= 0.8;
              monster.position.vy *= 0.8;
            }
          } else {
            // No target - just struggle to stay airborne
            monster.position.vy *= 0.95; // Slight damping when loaded
            
            // Struggle to maintain altitude
            if (monster.position.vy > 30 || Math.random() < 0.1) {
              monster.position.vy = -80; // Weak flap
            }
            
            // Poor air control when loaded
            monster.position.vx *= 0.9;
            monster.position.vy = Math.min(monster.position.vy, terminalVelocity * 0.7);
          }
        } else {
          // TRUE FLYING - NO GRAVITY AT ALL!
          // Flying creatures move freely in any direction
          
          // BOUNDARY CONSTRAINTS - Keep flyers within chamber walls
          const worldPixelWidth = WORLD_WIDTH * TILE_SIZE;
          const worldPixelHeight = WORLD_HEIGHT * TILE_SIZE;
          const boundaryMargin = TILE_SIZE * 5; // INCREASED: 5 tiles from edge (was 3)
          
          // Check boundaries and push back toward center - STRONGER
          let needsRedirect = false;
          
          // Near LEFT wall
          if (monster.position.x < boundaryMargin) {
            monster.position.vx = Math.abs(monster.position.vx) + 100; // STRONGER: Push right (was +50)
            monster.position.x = boundaryMargin; // Hard clamp
            needsRedirect = true;
          }
          // Near RIGHT wall
          else if (monster.position.x > worldPixelWidth - boundaryMargin) {
            monster.position.vx = -Math.abs(monster.position.vx) - 100; // STRONGER: Push left (was -50)
            monster.position.x = worldPixelWidth - boundaryMargin; // Hard clamp
            needsRedirect = true;
          }
          
          // Near TOP (ceiling)
          if (monster.position.y < boundaryMargin) {
            monster.position.vy = Math.abs(monster.position.vy) + 100; // STRONGER: Push down (was +50)
            monster.position.y = boundaryMargin; // Hard clamp
            needsRedirect = true;
          }
          // Near BOTTOM (floor)
          else if (monster.position.y > worldPixelHeight - boundaryMargin) {
            monster.position.vy = -Math.abs(monster.position.vy) - 100; // STRONGER: Push up (was -50)
            monster.position.y = worldPixelHeight - boundaryMargin; // Hard clamp
            needsRedirect = true;
          }
          
          // CHECK FOR PHEROMONES - Flying monsters respond to mine commands!
          if (this.pheromoneSystem && !needsRedirect) {
            // Look for mining pheromones
            const senseRadius = 5; // 5 tile radius
            const monsterTileX = Math.floor(monster.position.x / TILE_SIZE);
            const monsterTileY = Math.floor(monster.position.y / TILE_SIZE);
            
            let strongestPheromone: { x: number, y: number, strength: number } | null = null;
            
            for (let dx = -senseRadius; dx <= senseRadius; dx++) {
              for (let dy = -senseRadius; dy <= senseRadius; dy++) {
                const checkX = monsterTileX + dx;
                const checkY = monsterTileY + dy;
                const pheromone = this.pheromoneSystem.getPheromoneAt(checkX, checkY);
                
                if (pheromone && pheromone.type === PheromoneType.MINE_HERE && pheromone.strength > 10) {
                  if (!strongestPheromone || pheromone.strength > strongestPheromone.strength) {
                    strongestPheromone = { x: checkX * TILE_SIZE, y: checkY * TILE_SIZE, strength: pheromone.strength };
                  }
                }
              }
            }
            
            // Fly toward strongest pheromone
            if (strongestPheromone) {
              const dx = strongestPheromone.x - monster.position.x;
              const dy = strongestPheromone.y - monster.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 20) {
                const speed = 80; // Moderate flying speed toward target
                monster.position.vx = (dx / distance) * speed;
                monster.position.vy = (dy / distance) * speed;
              }
            } else {
              // Normal flying behavior (only when not redirecting and no pheromones)
              // Random flight pattern - but stay in bounds
              if (Math.random() < 0.08) { // REDUCED: 8% chance to change direction (was 15%)
                // Fly in any direction, but moderate speeds
                monster.position.vy = (Math.random() - 0.5) * 200; // REDUCED: -100 to +100 vertical (was 300)
                monster.position.vx = (Math.random() - 0.5) * 200; // REDUCED: -100 to +100 horizontal (was 250)
              }
              
              // Very gentle upward tendency
              if (Math.random() < 0.05 && monster.position.vy > -30) {
                monster.position.vy = -60 - Math.random() * 60; // Gentle upward drift
              }
            }
          }
          
          // PERFECT control - no air resistance
          monster.position.vx *= 1.0; // No slowdown
          monster.position.vy *= 0.98; // Tiny bit of vertical damping for control
          
          // Cap maximum velocity to prevent flying off too fast
          const maxFlySpeed = 200;
          if (Math.abs(monster.position.vx) > maxFlySpeed) {
            monster.position.vx = Math.sign(monster.position.vx) * maxFlySpeed;
          }
          if (Math.abs(monster.position.vy) > maxFlySpeed) {
            monster.position.vy = Math.sign(monster.position.vy) * maxFlySpeed;
          }
        }
      } else {
        // NON-FLYING FALLING - DROP LIKE A ROCK!
        const fallTime = (monster as any).fallTime || 0;
        (monster as any).fallTime = fallTime + deltaTime;
        
        // DOUBLE-JUMP CHECK - Mario-style mid-air recovery!
        // Only if falling and hasn't used double-jump yet
        if (monster.canDoubleJump && monster.position.vy > 100) {
          // Check if there's a block ahead they're trying to reach
          const direction = Math.sign(monster.position.vx) || 1;
          const tileX = Math.floor(monster.position.x / TILE_SIZE);
          const feetY = Math.floor((monster.position.y + 1) / TILE_SIZE);
          const blockAhead = this.world[tileX + direction]?.[feetY - 1];
          
          // If falling toward a platform, double-jump to reach it!
          if (blockAhead && blockAhead.type !== TileType.AIR) {
            monster.position.vy = -350; // Smooth double-jump
            monster.canDoubleJump = false; // Used up double-jump
            console.log(`🦘 Monster ${monster.id} DOUBLE-JUMP to reach platform!`);
          }
        }
        
        // SMOOTH gravity - gentle for graceful Mario arc
        const fallAcceleration = 1 + fallTime * 1.2; // Gentle acceleration
        monster.position.vy += gravity * deltaTime * fallAcceleration * 0.6; // 60% gravity for floaty arc
        monster.position.vy *= airResistance; // Minimal air drag
        monster.position.vy = Math.min(monster.position.vy, terminalVelocity);
        
        // SLOW horizontal movement in air - graceful arc
        monster.position.vx *= 0.75; // Moderate damping - keeps forward momentum
        
        // Mark as falling for animation
        (monster as any).isFalling = true;
        (monster as any).fallHeight = (monster as any).fallHeight || 0;
        (monster as any).fallHeight += Math.abs(monster.position.vy * deltaTime);
      }
    }
    */
    // END OF OLD DISABLED PHYSICS CODE
    
    // ==== MARIO-STYLE ANTICIPATORY JUMP ====
    // MUST happen BEFORE velocity application to take effect this frame!
    // Look ahead 1-2 tiles to jump BEFORE hitting wall (for running arc)
    const currentFeetY = feetY; // Already calculated above
    const currentFeetTileY = Math.floor(currentFeetY / TILE_SIZE);
    const timeSinceLastJump = (monster as any).lastJumpTime || 0;
    const currentTime = this.time.now;
    const jumpCooldown = 800; // 800ms cooldown - ONE smooth jump, no spam
    const canJump = (currentTime - timeSinceLastJump) > jumpCooldown;
    const movingHorizontally = Math.abs(monster.position.vx) > 10;
    const closeToGround = Math.abs(monster.position.vy) < 50;
    
    if (canJump && (monster.position.onGround || closeToGround) && movingHorizontally) {
      // Determine look-ahead direction
      const lookAheadDir = monster.position.vx > 0 ? 1 : -1;
      const lookAheadDistance = 0.80; // 0.80 blocks ahead
      const lookAheadTile1 = Math.floor((monster.position.x + lookAheadDir * TILE_SIZE * lookAheadDistance) / TILE_SIZE);
      
      // Check if wall exists 0.80 tiles ahead at feet level
      let wallAhead = false;
      let wallHeight = 0;
      
      for (let checkTile of [lookAheadTile1]) {
        if (checkTile >= 0 && checkTile < WORLD_WIDTH && currentFeetTileY >= 0 && currentFeetTileY < WORLD_HEIGHT) {
          const tile = this.world[checkTile][currentFeetTileY];
          if (tile && TILE_PROPERTIES[tile.type].solid) {
            wallAhead = true;
            // Check if there's ground on top of wall (1 block up)
            if (currentFeetTileY - 1 >= 0) {
              const tileAbove = this.world[checkTile][currentFeetTileY - 1];
              if (!tileAbove || !TILE_PROPERTIES[tileAbove.type].solid) {
                wallHeight = 1; // Can jump up one block
              }
            }
            break;
          }
        }
      }
      
      // ANTICIPATORY JUMP: Jump before hitting wall to arc over it
      if (wallAhead && wallHeight === 1) {
        // HORIZONTAL-FOCUSED: Maximum power jump with extreme forward momentum
        const jumpPower = -900; // Maximum upward power
        monster.position.vy = jumpPower;
        monster.position.onGround = false;
        monster.hasJumped = true;
        (monster as any).lastJumpTime = currentTime;
        (monster as any).justJumpedThisFrame = true;
        
        // BETTER ANGLE: Maximum forward momentum boost for horizontal arc
        const direction = Math.sign(monster.position.vx) || 1;
        const forwardBoost = 200; // Maximum horizontal momentum - extremely forward-focused
        monster.position.vx += direction * forwardBoost;
        
        // Track that this is a single-block jump attempt
        (monster as any).attemptingSingleBlockJump = true;
        (monster as any).jumpTargetBlockX = lookAheadTile1;
        
        // 🐛 JUMP DEBUG
        if ((monster as any).debugJumps) {
          console.log(`      🏃 ANTICIPATORY JUMP! power=${jumpPower}, boost=+${forwardBoost}`);
        }
        
        if (debugThis) {
          console.log(`      🏃 ANTICIPATORY JUMP! Detected wall ${lookAheadTile1}, jumping early with arc!`);
        }
      }
    }
    
    // ====== CLIFF TUMBLING & MONSTER BUMPING ======
    // Make monsters on cliff edges faceplant down to prevent traffic jams (RARE)
    // Make fast monsters knock over slow/stationary ones
    
    // CLIFF DETECTION: Only for STUCK monsters (barely moving or stationary)
    const lastTumbleTime = (monster as any).lastTumbleTime || 0;
    const tumbleCooldown = 5000; // 5 second cooldown between tumbles
    const canTumble = (this.time.now - lastTumbleTime) > tumbleCooldown;
    
    if (monster.position.onGround && !canFly && canTumble && !(monster as any).facePlanted) {
      const movementSpeed = Math.abs(monster.position.vx);
      const direction = Math.sign(monster.position.vx) || 1;
      const tileAhead = currentTileX + direction;
      const tileBelowAhead = currentFeetTileY + 1;
      
      // Check if there's a cliff ahead (no ground below next tile)
      let isCliff = false;
      if (tileAhead >= 0 && tileAhead < WORLD_WIDTH && tileBelowAhead >= 0 && tileBelowAhead < WORLD_HEIGHT) {
        const groundAhead = this.world[tileAhead][tileBelowAhead];
        if (!groundAhead || !TILE_PROPERTIES[groundAhead.type].solid) {
          isCliff = true;
        }
      }
      
      // Only tumble if SUPER SLOW (truly stuck/stationary) on cliff edge
      // Normal walking should NOT trigger this - only stuck monsters
      if (isCliff && movementSpeed > 0.5 && movementSpeed < 5 && Math.random() < 0.01) {
        // FACEPLANT off cliff to clear traffic (VERY RARE - 1% chance per frame)
        (monster as any).facePlanted = true;
        (monster as any).recoverTime = 0.75;
        (monster as any).lastTumbleTime = this.time.now;
        monster.position.onGround = false;
        monster.position.vx = direction * 80; // Push forward
        monster.position.vy = 50; // Push down
        console.log(`🤸 Monster tumbling off cliff! (stuck, clearing traffic)`);
      }
    }
    
    // MONSTER BUMPING: Fast monsters knock over slow/stopped ones (RARE)
    const lastBumpTime = (monster as any).lastBumpTime || 0;
    const bumpCooldown = 2000; // 2 second cooldown between bumps
    const canBump = (this.time.now - lastBumpTime) > bumpCooldown;
    
    if (canBump && Math.abs(monster.position.vx) > 80) { // Only very fast monsters
      for (const other of this.monsters) {
        if (other.id === monster.id) continue;
        if ((other as any).facePlanted) continue; // Already down
        
        const dx = other.position.x - monster.position.x;
        const dy = other.position.y - monster.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // If close and other is stopped/very slow
        if (dist < TILE_SIZE * 1.2 && monster.position.onGround && other.position.onGround) {
          const otherSpeed = Math.abs(other.position.vx);
          
          // Fast monster hits stopped one (RARE - 5% chance)
          if (otherSpeed < 5 && Math.random() < 0.05) {
            // KNOCK OVER the slow monster!
            (other as any).facePlanted = true;
            (other as any).recoverTime = 0.75;
            (monster as any).lastBumpTime = this.time.now;
            other.position.onGround = false;
            other.position.vx = Math.sign(dx) * 100; // Push them over
            other.position.vy = -50; // Slight bounce
            console.log(`💥 Fast monster knocked over stopped one!`);
            break; // Only knock one per frame
          }
        }
      }
    }
    
    // ====== SMOOTH PREEMPTIVE BLOCK COLLISION ======
    // PREVENT monsters from EVER getting inside blocks with smooth correction
    
    // Calculate new position
    let newX = monster.position.x + monster.position.vx * deltaTime;
    let newY = monster.position.y + monster.position.vy * deltaTime;
    
    // PREEMPTIVE COLLISION: Check if approaching a block and smoothly slide to edge
    const monsterRadius = monsterWidth * 0.4; // Collision radius
    const checkTileX = Math.floor(newX / TILE_SIZE);
    const checkTileY = Math.floor(newY / TILE_SIZE);
    
    // Check all surrounding tiles for smooth collision
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tileX = checkTileX + dx;
        const tileY = checkTileY + dy;
        
        if (tileX >= 0 && tileX < WORLD_WIDTH && tileY >= 0 && tileY < WORLD_HEIGHT) {
          const tile = this.world[tileX][tileY];
          if (tile && TILE_PROPERTIES[tile.type].solid) {
            // Calculate block boundaries
            const blockLeft = tileX * TILE_SIZE;
            const blockRight = (tileX + 1) * TILE_SIZE;
            const blockTop = tileY * TILE_SIZE;
            const blockBottom = (tileY + 1) * TILE_SIZE;
            
            // Check if monster overlaps this block
            const overlapX = Math.max(0, Math.min(newX + monsterRadius, blockRight) - Math.max(newX - monsterRadius, blockLeft));
            const overlapY = Math.max(0, Math.min(newY + halfHeight, blockBottom) - Math.max(newY - halfHeight, blockTop));
            
            if (overlapX > 0 && overlapY > 0) {
              // TRIPPED FACEPLANT: When jumping UP and hitting WALL of block
              const isJumping = !monster.position.onGround;
              const isMovingHorizontally = Math.abs(monster.position.vx) > 15;
              
              if (isJumping && isMovingHorizontally) {
                const feetY = monster.position.y + halfHeight; // Bottom of monster
                const bodyTop = monster.position.y - halfHeight; // Top of monster
                const monsterCenterX = monster.position.x;
                const totalHeight = halfHeight * 2;
                const jumpDirection = Math.sign(monster.position.vx); // Direction of jump
                
                // CRITICAL: Must be hitting the WALL (left or right side) of block
                const monsterLeft = newX - monsterRadius;
                const monsterRight = newX + monsterRadius;
                // Wider wall detection - check if horizontally overlapping the wall (within 10px)
                const hittingLeftWall = jumpDirection > 0 && monsterRight > blockLeft - 2 && monsterRight <= blockLeft + 10; // Moving right, hitting left wall
                const hittingRightWall = jumpDirection < 0 && monsterLeft < blockRight + 2 && monsterLeft >= blockRight - 10; // Moving left, hitting right wall
                const hittingWall = hittingLeftWall || hittingRightWall;
                
                // TIPPING MECHANISM: 70% or more of height cleared = tip over!
                const heightAboveBlock = blockTop - bodyTop; // How much of body is above block
                const percentCleared = heightAboveBlock / totalHeight; // What % of height cleared
                const mostlyCleared = percentCleared >= 0.7; // 70% or more cleared
                const hasMomentum = Math.abs(monster.position.vx) > 20; // Forward momentum
                const feetNearTopEdge = feetY >= blockTop - 10 && feetY <= blockTop + 25; // Feet near top edge
                
                // DEBUG: Show detection attempts
                const debugTrip = false; // Set to true to debug
                if (debugTrip && feetNearTopEdge && percentCleared > 0.5) {
                  console.log(`🔍 TRIP CHECK: Monster ${monster.id.substring(0,15)}`);
                  console.log(`   Height cleared: ${heightAboveBlock.toFixed(1)}px / ${totalHeight.toFixed(1)}px = ${(percentCleared * 100).toFixed(1)}%`);
                  console.log(`   Direction: ${jumpDirection > 0 ? 'RIGHT' : 'LEFT'}, HittingWall: ${hittingWall} (L:${hittingLeftWall}, R:${hittingRightWall})`);
                  console.log(`   vy: ${monster.position.vy.toFixed(1)}, vx: ${monster.position.vx.toFixed(1)}`);
                  console.log(`   MostlyCleared: ${mostlyCleared}, FeetNear: ${feetNearTopEdge}, Momentum: ${hasMomentum}`);
                }
                
                // TRIGGER: Hit wall + 70%+ cleared + momentum = TIP OVER!
                if (hittingWall && feetNearTopEdge && mostlyCleared && hasMomentum) {
                  const direction = jumpDirection; // Faceplant in jump direction
                  const wasCarrying = monster.carryingChunkId;
                  const distanceFromTop = feetY - blockTop;
                  
                  console.log(`🤕 TRIPPED! Monster ${monster.id.substring(0,15)} caught feet trying to jump UP - FACEPLANT onto block!`);
                  console.log(`   Feet: ${feetY.toFixed(1)}, BlockTop: ${blockTop}, Gap: ${distanceFromTop.toFixed(1)}px, vy: ${monster.position.vy.toFixed(1)}`);
                  
                  // SMOOTH LANDING: Position them ON TOP with slight forward momentum
                  newY = blockTop - halfHeight - 0.5; // On top of block
                  
                  // Place them FORWARD on the block in jump direction
                  if (direction > 0) {
                    newX = blockRight - monsterRadius * 0.6; // Near right edge
                  } else {
                    newX = blockLeft + monsterRadius * 0.6; // Near left edge
                  }
                  
                  // REALISTIC PHYSICS: Small bounce/settle instead of instant stop
                  monster.position.x = newX;
                  monster.position.y = newY;
                  monster.position.vx = direction * 15; // Small forward slide
                  monster.position.vy = -30; // Tiny bounce as they tip over
                  monster.position.onGround = true; // GROUNDED on higher block
                  
                  // Faceplant state
                  (monster as any).facePlanted = true;
                  (monster as any).facePlantDirection = direction; // Face forward
                  (monster as any).facePlantStartTime = this.time.now; // Track when it started
                  (monster as any).recoverTime = 0.7; // Recovery time
                  (monster as any).attemptingSingleBlockJump = false;
                  
                  // Drop what they're carrying FORWARD with realistic physics
                  if (wasCarrying) {
                    const chunk = this.resourceChunkManager.chunks.get(wasCarrying);
                    if (chunk) {
                      chunk.x = newX + (direction * 25); // Drop ahead
                      chunk.y = newY - 8;
                      chunk.velocityX = direction * 50; // Forward tumble
                      chunk.velocityY = -100; // Pop up
                      chunk.isBeingCarried = false;
                      chunk.currentCarriers = [];
                      monster.carryingChunkId = null;
                      console.log(`   📦 Dropped ${chunk.id} FORWARD from tripping!`);
                    }
                  }
                  
                  console.log(`   ✅ Monster TRIPPED onto block at Y=${newY.toFixed(1)}! Will settle and recover.`);
                  
                  // Skip normal collision - already positioned
                  continue;
                }
              }
              
              // SMOOTH SLIDE: Push monster to edge of block with damping
              if (overlapX < overlapY) {
                // Horizontal collision - push left or right
                if (newX < (blockLeft + blockRight) / 2) {
                  newX = blockLeft - monsterRadius - 0.5; // Push left (slight gap)
                  const moveDistance = Math.abs(newX - monster.position.x);
                  // ANTI-VIBRATION: Strong damping when touching walls
                  if (moveDistance < 1) {
                    monster.position.vx *= 0.1; // Heavy damping
                  } else {
                    monster.position.vx = Math.min(0, monster.position.vx * 0.5); // Kill + damp rightward velocity
                  }
                } else {
                  newX = blockRight + monsterRadius + 0.5; // Push right (slight gap)
                  const moveDistance = Math.abs(newX - monster.position.x);
                  // ANTI-VIBRATION: Strong damping when touching walls
                  if (moveDistance < 1) {
                    monster.position.vx *= 0.1; // Heavy damping
                  } else {
                    monster.position.vx = Math.max(0, monster.position.vx * 0.5); // Kill + damp leftward velocity
                  }
                }
              } else {
                // Vertical collision - push up or down
                if (newY < (blockTop + blockBottom) / 2) {
                  // Pushing UP from ceiling - only if moving up significantly
                  if (monster.position.vy < -10) {
                    newY = blockTop - halfHeight - 0.5; // Push up
                    monster.position.vy = 0; // Stop upward velocity
                  }
                } else {
                  // Pushing DOWN - only if falling down AND significantly overlapping
                  if (monster.position.vy > 10 && overlapY > 3) {
                    newY = blockBottom + halfHeight + 0.5; // Push down
                    monster.position.vy = Math.max(0, monster.position.vy * 0.3); // Damp downward velocity
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Apply smooth corrected movement WITH BOUNDS CHECKING
    // Prevent monsters from leaving the playable area
    const WORLD_PIXEL_WIDTH = WORLD_WIDTH * TILE_SIZE;
    const WORLD_PIXEL_HEIGHT = WORLD_HEIGHT * TILE_SIZE;
    const BOUNDARY_MARGIN = TILE_SIZE * 2; // Stay 2 blocks from edge
    
    // Clamp to world bounds
    newX = Math.max(BOUNDARY_MARGIN, Math.min(newX, WORLD_PIXEL_WIDTH - BOUNDARY_MARGIN));
    newY = Math.max(BOUNDARY_MARGIN, Math.min(newY, WORLD_PIXEL_HEIGHT - BOUNDARY_MARGIN));
    
    // If hitting bounds, zero velocity in that direction
    if (newX <= BOUNDARY_MARGIN || newX >= WORLD_PIXEL_WIDTH - BOUNDARY_MARGIN) {
      monster.position.vx = 0;
      if (newX <= BOUNDARY_MARGIN) newX = BOUNDARY_MARGIN + 1;
      if (newX >= WORLD_PIXEL_WIDTH - BOUNDARY_MARGIN) newX = WORLD_PIXEL_WIDTH - BOUNDARY_MARGIN - 1;
    }
    if (newY <= BOUNDARY_MARGIN || newY >= WORLD_PIXEL_HEIGHT - BOUNDARY_MARGIN) {
      monster.position.vy = 0;
      if (newY <= BOUNDARY_MARGIN) newY = BOUNDARY_MARGIN + 1;
      if (newY >= WORLD_PIXEL_HEIGHT - BOUNDARY_MARGIN) newY = WORLD_PIXEL_HEIGHT - BOUNDARY_MARGIN - 1;
    }
    
    monster.position.x = newX;
    monster.position.y = newY;
    
    // ====== ANOMALY DETECTION & AFTER-STATE LOGGING ======
    debugState.frameCount++;
    
    // Check if monster is inside a block
    const afterMonsterTileX = Math.floor(monster.position.x / TILE_SIZE);
    const afterMonsterTileY = Math.floor(monster.position.y / TILE_SIZE);
    let insideBlock = false;
    let blockType = 'none';
    
    if (afterMonsterTileX >= 0 && afterMonsterTileX < WORLD_WIDTH && 
        afterMonsterTileY >= 0 && afterMonsterTileY < WORLD_HEIGHT) {
      const currentTile = this.world[afterMonsterTileX][afterMonsterTileY];
      if (currentTile && TILE_PROPERTIES[currentTile.type].solid) {
        insideBlock = true;
        blockType = currentTile.type;
      }
    }
    
    // Check if walking on air (onGround but no solid below)
    // With 1px fix, feet can be in air tile just above solid block - this is CORRECT!
    // Check BOTH feetTile AND tile below for solid ground
    let walkingOnAir = false;
    if (monster.position.onGround) {
      const afterFeetY = monster.position.y + (monsterHeight / 2);
      const feetTileY = Math.floor(afterFeetY / TILE_SIZE);
      
      // Check feet tile and tile below (classic platformer: feet in air, ground below)
      let hasGroundSupport = false;
      for (const checkY of [feetTileY, feetTileY + 1]) {
        if (checkY < WORLD_HEIGHT) {
          const tile = this.world[afterMonsterTileX][checkY];
          if (tile && TILE_PROPERTIES[tile.type].solid) {
            hasGroundSupport = true;
            break;
          }
        }
      }
      walkingOnAir = !hasGroundSupport;
    }
    
    // ANOMALY DETECTION: Log significant issues - DISABLED for cleaner logs
    const hasAnomaly = false; // Was: insideBlock || walkingOnAir || (Math.abs(monster.position.y - beforePos.y) > 10 && debugState.frameCount > 10);
    
    if (hasAnomaly || debugThis) {
      const posChange = {
        x: (monster.position.x - beforePos.x).toFixed(1),
        y: (monster.position.y - beforePos.y).toFixed(1)
      };
      
      console.log(`\n🐛 MONSTER ANOMALY: ${monster.id.substring(0, 20)}`);
      console.log(`   📍 BEFORE: (${beforePos.x.toFixed(1)}, ${beforePos.y.toFixed(1)}) tile [${Math.floor(beforePos.x/TILE_SIZE)}, ${Math.floor(beforePos.y/TILE_SIZE)}]`);
      console.log(`   📍 AFTER:  (${monster.position.x.toFixed(1)}, ${monster.position.y.toFixed(1)}) tile [${afterMonsterTileX}, ${afterMonsterTileY}]`);
      console.log(`   📏 DELTA: (${posChange.x}, ${posChange.y})`);
      console.log(`   🎮 STATE: onGround ${beforeOnGround} → ${monster.position.onGround}`);
      console.log(`   ⚡ VELOCITY: (${monster.position.vx.toFixed(1)}, ${monster.position.vy.toFixed(1)})`);
      
      if (insideBlock) {
        console.log(`   🚨 INSIDE BLOCK: ${blockType} at tile [${afterMonsterTileX}, ${afterMonsterTileY}]`);
      }
      if (walkingOnAir) {
        console.log(`   🌊 WALKING ON AIR: onGround=true but no solid below!`);
      }
      if (Math.abs(parseFloat(posChange.y)) > 10) {
        console.log(`   ⚡ LARGE Y JUMP: Moved ${posChange.y}px in one frame!`);
      }
      console.log('');
    }
    
    // Update debug state for next frame
    debugState.lastPos = { x: monster.position.x, y: monster.position.y };
    debugState.lastState = { onGround: monster.position.onGround, insideBlock };
    
    // Clear jump flag at end of frame
    (monster as any).justJumpedThisFrame = false;
  }
  
  /**
   * ENHANCED CLIMBING - Can climb 2 blocks, fails at 3 blocks
   */
  private handlePyramidClimbing(monster: Monster): void {
    const pyramidCenter = WORLD_WIDTH * TILE_SIZE / 2;
    const nearPyramid = Math.abs(monster.position.x - pyramidCenter) < TILE_SIZE * 20;
    
    // Always allow climbing attempts (not just near pyramid)
    const shouldClimb = true; // Allow all monsters to try climbing
    
    if (!shouldClimb) return;
    
    // Check for blocks directly ahead
    const tileX = Math.floor(monster.position.x / TILE_SIZE);
    const tileY = Math.floor(monster.position.y / TILE_SIZE);
    
    // Use same feet offset as ground detection (monster position IS feet position)
    const feetOffset = 0;
    const feetY = Math.floor((monster.position.y + feetOffset) / TILE_SIZE); // Monster feet position
    const direction = monster.position.vx !== 0 ? Math.sign(monster.position.vx) : 
                      (this.colonyHive.x > monster.position.x ? 1 : -1);
    
    // Check wall height ahead
    const blockAhead1 = this.world[tileX + direction]?.[feetY];     // Block at feet level
    const blockAhead2 = this.world[tileX + direction]?.[feetY - 1]; // Block at body level  
    const blockAhead3 = this.world[tileX + direction]?.[feetY - 2]; // Block at head level
    const blockAbove3 = this.world[tileX + direction]?.[feetY - 3]; // Space above 3 blocks
    
    // Determine wall height
    let wallHeight = 0;
    if (blockAhead1 && blockAhead1.type !== TileType.AIR) wallHeight = 1;
    if (blockAhead2 && blockAhead2.type !== TileType.AIR) wallHeight = 2;
    if (blockAhead3 && blockAhead3.type !== TileType.AIR) wallHeight = 3;
    
    // ATTEMPT TO CLIMB 3 BLOCKS - WILL FAIL!
    if (wallHeight >= 3 && (!blockAbove3 || blockAbove3.type === TileType.AIR)) {
      // Check if monster is attempting to climb (moving toward wall)
      const movingTowardWall = Math.abs(monster.position.vx) > 10;
      
      if (movingTowardWall && !monster.isFalling) {
        console.log(`Monster ${monster.id} attempting to climb 3-block wall - TOO HIGH!`);
        
        // Start climbing animation briefly
        monster.position.vy = -200; // Small jump
        monster.position.y -= 5; // Lift slightly
        
        // Then FAIL and fall!
        setTimeout(() => {
          // Face plant!
          monster.position.vy = 300; // Fall down hard
          monster.position.vx = -direction * 50; // Bounce backward
          monster.isFalling = true;
          
          // Take damage
          const damage = 15;
          monster.health = Math.max(0, monster.health - damage);
          console.log(`Monster ${monster.id} face planted! Took ${damage} damage. Health: ${monster.health}`);
          
          // DROP CARRIED RESOURCES!
          if (monster.carryingChunkId) {
            const chunk = this.resourceChunkManager.chunks.get(monster.carryingChunkId);
            if (chunk) {
              // Drop the chunk
              chunk.isBeingCarried = false;
              chunk.currentCarriers = [];
              chunk.x = monster.position.x;
              chunk.y = monster.position.y - 10;
              
              // Give it some physics to scatter
              chunk.velocityX = (Math.random() - 0.5) * 100;
              chunk.velocityY = -50;
              chunk.onGround = false;
              
              console.log(`Monster ${monster.id} dropped resource ${monster.carryingChunkId} after face planting!`);
            }
            
            monster.carryingChunkId = null;
          }
          
          // Stun the monster briefly
          monster.isStunned = true;
          setTimeout(() => {
            monster.isStunned = false;
            monster.isFalling = false;
          }, 2000); // Stunned for 2 seconds
        }, 300); // Fail after 300ms of trying
      }
    }
    // DISABLE AUTO-CLIMB - Let tryJumpOverSingleBlock handle it instead
    // This was causing conflicts with the jump system
    else if (wallHeight >= 1 && wallHeight <= 2) {
      // Do nothing - let the main jump system handle it
      // This prevents double-triggering and velocity cancellation
    }
    // If stuck inside a block, push out
    else if (this.world[tileX]?.[feetY] && this.world[tileX][feetY].type !== TileType.AIR) {
      monster.position.y -= 1.8;
      monster.position.vy = -120;
      monster.position.vx = direction * 20;
      monster.position.onGround = true;
    }
  }

  /**
   * Detect if monster is jumping repeatedly without making progress
   */
  private detectJumpingStuck(monster: Monster): void {
    const currentTime = Date.now();
    
    // Check if monster is jumping (negative vertical velocity)
    if (monster.position.vy < -200) {
      // Track jump start position
      if (monster.jumpCount === 0) {
        monster.positionBeforeJumps = { 
          x: monster.position.x, 
          y: monster.position.y 
        };
        monster.jumpCount = 1;
        monster.lastJumpTime = currentTime;
      } else if (currentTime - monster.lastJumpTime > 500) { // New jump detected
        monster.jumpCount++;
        monster.lastJumpTime = currentTime;
        
        // Check if we've jumped 3+ times without moving much
        if (monster.jumpCount >= 3 && monster.positionBeforeJumps) {
          const distanceMoved = Math.sqrt(
            Math.pow(monster.position.x - monster.positionBeforeJumps.x, 2) +
            Math.pow(monster.position.y - monster.positionBeforeJumps.y, 2)
          );
          
          // If we haven't moved more than 2 blocks after 3 jumps, we're stuck
          if (distanceMoved < TILE_SIZE * 2) {
            console.log(`Monster ${monster.id} stuck jumping! Moved only ${distanceMoved.toFixed(0)} pixels in ${monster.jumpCount} jumps`);
            
            // DROP RESOURCES!
            if (monster.carryingChunkId) {
              const chunk = this.resourceChunkManager.chunks.get(monster.carryingChunkId);
              if (chunk) {
                // Drop the chunk
                chunk.isBeingCarried = false;
                chunk.currentCarriers = [];
                chunk.x = monster.position.x;
                chunk.y = monster.position.y - 10;
                
                // Give it physics to scatter
                chunk.velocityX = (Math.random() - 0.5) * 100;
                chunk.velocityY = -100;
                chunk.onGround = false;
                
                console.log(`Monster ${monster.id} dropped resource ${monster.carryingChunkId} due to jump stuck!`);
              }
              
              monster.carryingChunkId = null;
            }
            
            // Also drop helping resources
            if (monster.helpingCarryChunkId) {
              monster.helpingCarryChunkId = null;
            }
            
            // Change direction - walk the other way
            monster.position.vx = -monster.position.vx * 2; // Reverse and boost
            
            // Clear target to find a new path
            monster.target = null;
            monster.wanderTarget = null;
            
            // Reset jump tracking
            monster.jumpCount = 0;
            monster.positionBeforeJumps = null;
            monster.jumpStuckCounter++;
            
            // If repeatedly getting stuck, take a longer break
            if (monster.jumpStuckCounter > 2) {
              monster.state = MonsterState.RESTING;
              setTimeout(() => {
                monster.state = MonsterState.IDLE;
                monster.jumpStuckCounter = 0;
              }, 5000); // Rest for 5 seconds
            }
          }
        }
      }
    } else if (monster.position.onGround && currentTime - monster.lastJumpTime > 2000) {
      // Reset jump tracking if on ground for 2 seconds
      monster.jumpCount = 0;
      monster.positionBeforeJumps = null;
    }
  }

  /**
   * Check and recover stuck monsters with advanced pathfinding
   */
  private checkAndRecoverStuckMonsters(currentTime: number): void {
    for (const monster of this.monsters) {
      // Skip if recently checked
      if (currentTime - monster.lastStuckCheck < 3000) continue;
      
      monster.lastStuckCheck = currentTime;
      
      // Track movement history
      const currentPos = { x: monster.position.x, y: monster.position.y, time: currentTime };
      monster.movementHistory.push(currentPos);
      
      // Keep only last 5 positions (about 10 seconds of history)
      if (monster.movementHistory.length > 5) {
        monster.movementHistory.shift();
      }
      
      // Check if stuck (hasn't moved much in last 3 checks)
      if (monster.movementHistory.length >= 3) {
        const oldPos = monster.movementHistory[0];
        const distanceMoved = Math.sqrt(
          Math.pow(currentPos.x - oldPos.x, 2) + 
          Math.pow(currentPos.y - oldPos.y, 2)
        );
        
        // If moved less than 2 tiles in 6+ seconds, probably stuck
        if (distanceMoved < TILE_SIZE * 2) {
          monster.consecutiveStuckCount++;
          
          // Apply recovery based on how stuck they are
          if (monster.consecutiveStuckCount >= 2) {
            this.recoverStuckMonster(monster, currentTime);
          }
        } else {
          // Reset if moving normally
          monster.consecutiveStuckCount = 0;
        }
      }
    }
  }
  
  /**
   * Apply recovery actions for stuck monster
   */
  private recoverStuckMonster(monster: Monster, currentTime: number): void {
    // Don't super jump too often
    if (currentTime - monster.lastSuperJump < 5000) return;
    
    const isCarrying = monster.carryingChunkId || monster.helpingCarryChunkId;
    
    console.log(`Monster ${monster.id} is STUCK! Count: ${monster.consecutiveStuckCount}. Applying recovery...`);
    
    // Level 1 recovery: Try different direction
    if (monster.consecutiveStuckCount === 2) {
      // Change direction randomly
      monster.position.vx = (Math.random() - 0.5) * 100;
      monster.position.vy = -300; // Small hop
      console.log(`Monster ${monster.id} trying different direction`);
    }
    
    // Level 2 recovery: Super jump (2 blocks high)
    else if (monster.consecutiveStuckCount >= 3) {
      monster.lastSuperJump = currentTime;
      
      // SUPER JUMP - 2 blocks high!
      monster.position.vy = -550; // Much stronger jump
      
      // Add forward momentum toward hive if carrying
      if (isCarrying) {
        const hiveDir = this.colonyHive.x > monster.position.x ? 1 : -1;
        monster.position.vx = hiveDir * 120; // Strong forward push
        console.log(`Monster ${monster.id} SUPER JUMPING toward hive!`);
      } else {
        // Random direction if not carrying
        monster.position.vx = (Math.random() - 0.5) * 150;
        console.log(`Monster ${monster.id} SUPER JUMPING to escape!`);
      }
      
      // Reset stuck count after super jump
      monster.consecutiveStuckCount = 0;
      monster.movementHistory = [];
    }
  }

  /**
   * Check if monster should jump to reach hive when carrying resources
   */
  private shouldJumpTowardsHive(monster: Monster): boolean {
    // Only when carrying resources
    if (!monster.carryingChunkId && !monster.helpingCarryChunkId) {
      return false;
    }
    
    // Check if hive is above us
    const hiveY = this.colonyHive.y;
    const monsterY = monster.position.y;
    
    // If hive is significantly above (more than 1 block), should jump
    return hiveY < monsterY - TILE_SIZE;
  }

  /**
   * Check if a monster is stuck in a hole (surrounded by walls on both sides)
   */
  private isMonsterInHole(monster: Monster): boolean {
    const tileX = Math.floor(monster.position.x / TILE_SIZE);
    const tileY = Math.floor(monster.position.y / TILE_SIZE);
    
    // Check walls to the left and right at the monster's level
    let leftWall = false;
    let rightWall = false;
    
    // Check 1-2 blocks to left
    for (let x = tileX - 1; x >= tileX - 2 && x >= 0; x--) {
      if (this.world[x] && this.world[x][tileY]) {
        if (TILE_PROPERTIES[this.world[x][tileY].type].solid) {
          leftWall = true;
          break;
        }
      }
    }
    
    // Check 1-2 blocks to right  
    for (let x = tileX + 1; x <= tileX + 2 && x < WORLD_WIDTH; x++) {
      if (this.world[x] && this.world[x][tileY]) {
        if (TILE_PROPERTIES[this.world[x][tileY].type].solid) {
          rightWall = true;
          break;
        }
      }
    }
    
    // If walls on both sides, check if there's an opening above
    if (leftWall && rightWall) {
      const aboveY = tileY - 1;
      if (aboveY >= 0) {
        const tileAbove = this.world[tileX][aboveY];
        // If space above is clear, we're in a hole that needs jumping
        return !TILE_PROPERTIES[tileAbove.type].solid;
      }
    }
    
    return false;
  }

  /**
   * Try to jump over a single block if possible
   */
  private tryJumpOverSingleBlock(monster: Monster, targetX: number, targetY: number): boolean {
    
    // Always allow jumping when carrying resources to hive!
    const isCarrying = monster.carryingChunkId || monster.helpingCarryChunkId;
    
    // MARIO-STYLE: Simple anti-spam check
    const isJumpingUp = monster.position.vy < -30; // Moving up fast
    const lastJumpTime = monster.lastJumpTime || 0;
    const timeSinceJump = Date.now() - lastJumpTime;
    
    // Block if actively jumping up OR just jumped very recently (prevents spam)
    if (isJumpingUp) {
      return false; // Don't interrupt existing upward jump
    }
    
    // Prevent jump spam: minimum 300ms between jumps (increased to prevent wall climbing)
    if (timeSinceJump < 300) {
      return false; // Too soon after last jump
    }
    
    // ANTI-WALL-CLIMB: If jumping repeatedly while against a wall, increase cooldown
    const consecutiveJumps = (monster as any).consecutiveJumps || 0;
    if (consecutiveJumps >= 2 && timeSinceJump < 1000) {
      return false; // 1 second cooldown after 2+ consecutive jumps
    }
    
    // Clear jump flag when attempting new jump
    (monster as any).justJumped = false;
    
    // Energy system removed - monsters always have energy to jump

    // If no valid target (stuck), use direction of movement velocity
    const hasValidTarget = Math.abs(targetX - monster.position.x) > TILE_SIZE * 0.5;
    const direction = hasValidTarget ? 
      (targetX > monster.position.x ? 1 : -1) : 
      (monster.position.vx >= 0 ? 1 : -1); // Use velocity direction as fallback
    
    const monsterTileX = Math.floor(monster.position.x / TILE_SIZE);
    const monsterTileY = Math.floor(monster.position.y / TILE_SIZE);
    
    // MARIO-STYLE: Check multiple distances - close AND far!
    // Include VERY close detection for when stuck against wall
    const checkDistances = [0.3, 0.6, 1.0, 1.5]; // 0.3 = right at wall!
    
    for (const checkDist of checkDistances) {
      const targetTileX = Math.floor((monster.position.x + direction * TILE_SIZE * checkDist) / TILE_SIZE);
      const targetTileY = monsterTileY;

      // Check if there's a block in the way at our level
      if (targetTileX >= 0 && targetTileX < WORLD_WIDTH && 
          targetTileY >= 0 && targetTileY < WORLD_HEIGHT) {
        
        const blockingTile = this.world[targetTileX][targetTileY];
        
        // If there's a block at our level
        if (TILE_PROPERTIES[blockingTile.type].solid) {
          // Check if this is a steel pyramid block (bedrock) - special handling
          const isPyramidStep = blockingTile.type === TileType.BEDROCK;
          
          // Check if the space above the block is free
          const aboveTileY = targetTileY - 1;
          const aboveTileY2 = targetTileY - 2; // Check 2nd block up too
          const aboveTileY3 = targetTileY - 3; // Even higher for big jumps!
          
          if (aboveTileY >= 0) {
            const tileAbove = this.world[targetTileX][aboveTileY];
            const tileAbove2 = aboveTileY2 >= 0 ? this.world[targetTileX][aboveTileY2] : null;
            const tileAbove3 = aboveTileY3 >= 0 ? this.world[targetTileX][aboveTileY3] : null;
            
            // Need clearance - at least 1 block, preferably 2-3 for big jumps
            const hasClearance = !TILE_PROPERTIES[tileAbove.type].solid &&
                                (!tileAbove2 || !TILE_PROPERTIES[tileAbove2.type].solid) &&
                                (!tileAbove3 || !TILE_PROPERTIES[tileAbove3.type].solid);
            
            if (hasClearance) {
              // Space above is clear - ALWAYS ALLOW JUMP (no cooldown for obstacle clearing)
              const currentTime = this.time.now;
              monster.lastJumpTime = currentTime;
              
              // Track consecutive jumps to detect wall climbing spam
              const timeSinceLastJump = currentTime - lastJumpTime;
              if (timeSinceLastJump < 500) {
                (monster as any).consecutiveJumps = ((monster as any).consecutiveJumps || 0) + 1;
              } else {
                (monster as any).consecutiveJumps = 0; // Reset if enough time passed
              }
              
              // MARIO-STYLE SMART JUMP - Always clears obstacles!
              const currentFeetTileY = Math.floor((monster.position.y + 1) / TILE_SIZE);
              const jumpHeight = Math.max(currentFeetTileY - targetTileY, 2); // Always jump at least 2 blocks!
              
              // SUPER JUMP POWER - guaranteed to clear 2 blocks minimum
              const GRAVITY = 800;
              const pixelHeight = jumpHeight * TILE_SIZE + 16; // Extra clearance
              const baseVelocity = -Math.sqrt(2 * GRAVITY * pixelHeight) * 2.0; // 100% EXTRA POWER!
              
              // ULTRA JUMP - Guaranteed to clear obstacles!
              const jumpPower = Math.min(baseVelocity, -600); // Minimum -600!
              monster.position.vy = jumpPower;
              
              // SMART HORIZONTAL MOMENTUM: Reduce when close to wall, full when anticipating
              // When touching/very close (< 0.3 blocks): More vertical, less horizontal
              // When anticipating (> 0.3 blocks): More horizontal for arc
              let horizontalMultiplier = 1.0;
              if (checkDist <= 0.3) {
                // Very close or touching - reduce horizontal to 40% for more vertical jump
                horizontalMultiplier = 0.4;
              } else if (checkDist <= 0.6) {
                // Close - reduce horizontal to 70%
                horizontalMultiplier = 0.7;
              }
              // Else: Full horizontal momentum (1.0)
              
              if (isPyramidStep) {
                // MEGA power for pyramid steps
                monster.position.vx = direction * 180 * horizontalMultiplier;
                // Energy system removed - no energy cost
              } else if (isCarrying) {
                // Full power when carrying
                monster.position.vx = direction * 150 * horizontalMultiplier;
                // Energy system removed - no energy cost
              } else {
                // Normal jump
                monster.position.vx = direction * 130 * horizontalMultiplier;
                // Energy system removed - no energy cost
              }
              
              // Enable double-jump and mark jump time
              monster.hasJumped = true;
              monster.canDoubleJump = true;
              monster.position.onGround = false;
              monster.lastJumpTime = Date.now(); // Track when jump started
              
              // CRITICAL: Mark that we JUST jumped this frame - prevent immediate re-grounding
              (monster as any).justJumped = true;
              
              // MASSIVE INSTANT BOOST - Immediately lift them up!
              // This creates the initial jump arc
              const oldY = monster.position.y;
              monster.position.y -= 24; // HUGE instant 24px boost!
              monster.position.x += direction * 12; // Forward momentum
              
              // Debug jump initiation for ANY jumping monster
              const monsterDebugKey = `debug_${monster.id}`;
              const monsterDebug = (monster as any)[monsterDebugKey];
              if (monsterDebug?.slowMonster === monster.id) {
                console.log(`\n🚀 JUMP INITIATED!`);
                console.log(`   Position: ${oldY.toFixed(1)} → ${monster.position.y.toFixed(1)} (moved ${-24}px)`);
                console.log(`   Distance to wall: ${checkDist} blocks (multiplier: ${horizontalMultiplier}x)`);
                console.log(`   Velocity: vy=${monster.position.vy.toFixed(1)}, vx=${monster.position.vx.toFixed(1)}`);
                console.log(`   Flags: justJumped=true, onGround=false`);
              }
              
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Try to mine a blocking tile - ONLY when explicitly directed by player
   */
  private tryMineBlock(monster: Monster, x: number, y: number, direction: 'horizontal' | 'down'): void {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    // Check bounds
    if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) {
      return;
    }
    
    // NEVER mine down unless there's a pheromone on that specific block
    if (direction === 'down') {
      const pheromone = this.pheromoneSystem.getPheromoneAt(tileX, tileY);
      if (!pheromone || pheromone.type !== PheromoneType.MINE_HERE || pheromone.strength < 10) {
        return; // No mining down without explicit MINE_HERE pheromone!
      }
    }
    
    const tile = this.world[tileX][tileY];
    const properties = TILE_PROPERTIES[tile.type];
    
    // Can't mine non-solid or undiggable blocks
    if (!properties.solid || !properties.diggable) {
      return;
    }
    
    // Check if monster has mining capability
    const miningPower = monster.stats.miningSpeed || 10; // Use mining speed as power
    
    // AGGRESSIVE MINING - SUPER FAST!
    const damage = miningPower * 12.0; // TRIPLED mining speed - blocks break FAST!
    tile.integrity = Math.max(0, tile.integrity - damage);
    
    // Visual impact effect for AGGRESSIVE mining
    if (this.miningEffects && Math.random() < 0.5) { // 50% chance for particles
      // Create impact particles on every other hit
      this.miningEffects.createBlockBreakEffect(
        tileX * TILE_SIZE + 8,
        tileY * TILE_SIZE + 8,
        tile.type
      );
    }
    
    // If tile is destroyed, turn it into air and create resources
    if (tile.integrity <= 0) {
      // Check if this monster is the LEAD MINER (furthest from hive while mining)
      const hivePos = this.colonyHive.getDepositPosition();
      const distanceToHive = Math.sqrt(
        Math.pow(monster.position.x - hivePos.x, 2) + 
        Math.pow(monster.position.y - hivePos.y, 2)
      );
      
      // LEAD MINER MUST BE NON-FLYING! Flying monsters can't be lead miners
      const canFly = this.ragdollPhysics.hasWings(monster.id);
      let isLeadMiner = !canFly; // Flying monsters are automatically disqualified
      
      // Check if any other NON-FLYING mining monster is further away
      if (isLeadMiner) {
        for (const other of this.monsters) {
          if (other.id === monster.id) continue;
          if (other.state !== MonsterState.MINING) continue;
          
          // Skip flying monsters in comparison (they can't be lead miners)
          const otherCanFly = this.ragdollPhysics.hasWings(other.id);
          if (otherCanFly) continue;
          
          const otherDistance = Math.sqrt(
            Math.pow(other.position.x - hivePos.x, 2) + 
            Math.pow(other.position.y - hivePos.y, 2)
          );
          
          if (otherDistance > distanceToHive + 50) { // 50px margin
            isLeadMiner = false;
            break;
          }
        }
      }
      
      // LEAD MINER: Mark status BEFORE resources (so it works even with 0 resources)
      if (isLeadMiner) {
        (monster as any).isLeadMiner = true;
        (monster as any).leadMinerUntil = Date.now() + 5000; // Stay lead miner for 5 seconds
        console.log(`⛏️ LEAD MINER ACTIVATED: ${monster.id.substring(0, 15)} at distance ${distanceToHive.toFixed(0)}px from hive`);
      }
      
      // Drop resources if tile had any
      if (tile.resources > 0) {
        const chunks = this.resourceChunkManager.createChunksFromTile(
          tile.type,
          tileX,
          tileY,
          tile.resources
        );
        
        // LEAD MINER BEHAVIOR: Immediately throw resources toward hive
        if (isLeadMiner && chunks && chunks.length > 0) {
          console.log(`⛏️ LEAD MINER ${monster.id.substring(0, 15)}: Throwing resources back to hive!`);
          
          // Calculate throw direction toward hive
          const dx = hivePos.x - monster.position.x;
          const dy = hivePos.y - monster.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const throwPower = Math.min(150, distance * 0.3); // 30% of distance, max 150px
          
          // Throw each chunk toward hive
          for (const chunk of chunks) {
            const throwX = chunk.x + (dx / distance) * throwPower;
            const throwY = chunk.y + (dy / distance) * throwPower * 0.7 - 30; // Arc upward
            
            this.resourceChunkManager.moveChunk(chunk.id, throwX, throwY);
          }
          
          console.log(`   📦 Threw ${chunks.length} chunk(s) ${throwPower.toFixed(0)}px toward hive`);
        }
      }
      
      // Turn tile into air
      tile.type = TileType.AIR;
      tile.integrity = 0;
      tile.resources = 0;
      tile.discovered = true;
      
      console.log(`Monster ${monster.id} mined through ${properties.spriteName} at (${tileX}, ${tileY})`);
      
      // LEAD MINER: Keep mining toward pheromones!
      if (isLeadMiner) {
        // Look for more pheromones in the current direction
        let nextTarget = null;
        const searchRadius = 3; // Look 3 tiles in mining direction
        
        // Determine search direction based on current mining direction
        if (monster.miningTarget) {
          const dir = monster.miningTarget.direction;
          
          for (let dist = 1; dist <= searchRadius; dist++) {
            let checkX = tileX;
            let checkY = tileY;
            
            if (dir === 'left') checkX -= dist;
            else if (dir === 'right') checkX += dist;
            else if (dir === 'down') checkY += dist;
            else if (dir === 'up') checkY -= dist;
            
            // Check if there's a pheromone at this location
            if (checkX >= 0 && checkX < WORLD_WIDTH && checkY >= 0 && checkY < WORLD_HEIGHT) {
              const pheromone = this.pheromoneSystem?.getPheromoneAt(checkX, checkY);
              if (pheromone && pheromone.type === PheromoneType.MINE_HERE && pheromone.strength > 10) {
                nextTarget = {
                  x: checkX * TILE_SIZE + TILE_SIZE / 2,
                  y: checkY * TILE_SIZE + TILE_SIZE / 2,
                  direction: dir
                };
                console.log(`   🎯 LEAD MINER: Found next pheromone at [${checkX},${checkY}], continuing mining!`);
                break;
              }
            }
          }
        }
        
        // Set new mining target if found, otherwise update position in same direction
        if (nextTarget) {
          monster.miningTarget = nextTarget;
          monster.state = MonsterState.MINING;
        } else if (monster.miningTarget) {
          monster.miningDepth++;
          // Continue mining in the same direction by updating target
          if (monster.miningTarget.direction === 'left') {
            monster.miningTarget.x = (tileX - 1) * TILE_SIZE + TILE_SIZE / 2;
          } else if (monster.miningTarget.direction === 'right') {
            monster.miningTarget.x = (tileX + 1) * TILE_SIZE + TILE_SIZE / 2;
          } else if (monster.miningTarget.direction === 'down') {
            monster.miningTarget.y = (tileY + 1) * TILE_SIZE + TILE_SIZE / 2;
          } else if (monster.miningTarget.direction === 'up') {
            monster.miningTarget.y = (tileY - 1) * TILE_SIZE + TILE_SIZE / 2;
          }
          console.log(`   ⛏️ LEAD MINER: No pheromones ahead, continuing in ${monster.miningTarget.direction} direction`);
        }
      } else {
        // NON-LEAD MINERS: Normal behavior - continue in same direction
        if (monster.miningTarget) {
          monster.miningDepth++;
          // Continue mining in the same direction by updating target
          if (monster.miningTarget.direction === 'left') {
            monster.miningTarget.x = (tileX - 1) * TILE_SIZE + TILE_SIZE / 2;
          } else if (monster.miningTarget.direction === 'right') {
            monster.miningTarget.x = (tileX + 1) * TILE_SIZE + TILE_SIZE / 2;
          } else if (monster.miningTarget.direction === 'down') {
            monster.miningTarget.y = (tileY + 1) * TILE_SIZE + TILE_SIZE / 2;
          }
        }
      }
      
      // Add mining effects
      this.miningEffects.createBlockBreakEffect(tileX, tileY, properties.spriteName as any);
    }
    
    // Set monster to mining state
    monster.state = MonsterState.MINING;
  }

  /**
   * Check if monster can wall-crawl - LEMMING BEHAVIOR: Almost never!
   */
  private checkForWallCrawling(monster: Monster, tileX: number, tileY: number): boolean {
    // Flying creatures NEVER need to wall crawl!
    const canFly = this.ragdollPhysics.hasWings(monster.id);
    if (canFly) {
      return false;
    }
    
    // COOLDOWN SYSTEM: Prevent spam attempts (5 second cooldown)
    if (monster.wallCrawlCooldown > 0) {
      return false; // Still on cooldown from last attempt
    }
    
    // Energy system removed - monsters can always attempt wall crawling
    
    // LEMMINGS PREFER GROUND: Only 1% chance to even attempt wall crawling!
    if (Math.random() > 0.01) {
      return false; // 99% of time, monsters refuse to wall crawl
    }
    
    // Set cooldown regardless of success - prevents rapid retries
    monster.wallCrawlCooldown = 5.0; // 5 second cooldown
    monster.lastWallCrawlAttempt = Date.now();
    
    // Check for solid blocks adjacent to monster (walls to crawl on)
    const adjacentPositions = [
      { x: tileX - 1, y: tileY },     // Left wall
      { x: tileX + 1, y: tileY },     // Right wall
      { x: tileX, y: tileY - 1 },     // Ceiling
    ];
    
    for (const pos of adjacentPositions) {
      if (pos.x >= 0 && pos.x < WORLD_WIDTH && pos.y >= 0 && pos.y < WORLD_HEIGHT) {
        const tile = this.world[pos.x][pos.y];
        if (tile && TILE_PROPERTIES[tile.type].solid) {
          console.log(`Monster ${monster.id} attempting VERY RARE wall crawl (1% chance + 5s cooldown)`);
          return true; // Found a wall to crawl on - extremely rarely!
        }
      }
    }
    
    return false; // No walls nearby - monster will fall like a proper lemming
  }

  private checkCollision(x: number, y: number): { x: boolean; y: boolean } {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    let collisionX = false;
    let collisionY = false;
    
    // Check if position is in solid tile
    if (tileX >= 0 && tileX < WORLD_WIDTH && tileY >= 0 && tileY < WORLD_HEIGHT) {
      const tile = this.world[tileX][tileY];
      if (TILE_PROPERTIES[tile.type].solid) {
        collisionX = true;
        collisionY = true;
      }
    } else if (tileX < 0 || tileX >= WORLD_WIDTH || tileY >= WORLD_HEIGHT) {
      // World boundaries
      collisionX = true;
      collisionY = true;
    }
    
    return { x: collisionX, y: collisionY };
  }

  private checkTileCollision(x: number, y: number): boolean {
    // Check multiple points for proper collision (monster has width/height)
    const monsterHalfSize = 6; // Half of monster size in pixels
    
    // Check 4 corners of the monster's bounding box
    const points = [
      { x: x - monsterHalfSize, y: y - monsterHalfSize }, // Top-left
      { x: x + monsterHalfSize, y: y - monsterHalfSize }, // Top-right
      { x: x - monsterHalfSize, y: y + monsterHalfSize }, // Bottom-left
      { x: x + monsterHalfSize, y: y + monsterHalfSize }, // Bottom-right
      { x: x, y: y } // Center
    ];
    
    for (const point of points) {
      const tileX = Math.floor(point.x / TILE_SIZE);
      const tileY = Math.floor(point.y / TILE_SIZE);
      
      // Check world boundaries
      if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) {
        return true;
      }
      
      // Check if tile is solid
      const tile = this.world[tileX][tileY];
      if (TILE_PROPERTIES[tile.type].solid) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Find nearest climbable block for ragdoll hand grabbing
   */
  private findNearestClimbableBlock(monster: Monster): { x: number; y: number } | null {
    const monsterTileX = Math.floor(monster.position.x / TILE_SIZE);
    const monsterTileY = Math.floor(monster.position.y / TILE_SIZE);
    
    // Search around monster for solid blocks
    for (let radius = 1; radius <= 3; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const tileX = monsterTileX + dx;
          const tileY = monsterTileY + dy;
          
          if (this.world[tileY] && this.world[tileY][tileX]) {
            const tile = this.world[tileY][tileX];
            const tileType = typeof tile.type === 'string' ? parseInt(tile.type) : tile.type;
            if (tileType > 0 && TILE_PROPERTIES[tile.type].solid) {
              return { x: tileX, y: tileY };
            }
          }
        }
      }
    }
    
    return null;
  }

  private checkEnemyWaves(): void {
    const waveInterval = 120000; // 2 minutes in milliseconds
    const now = Date.now();
    
    if (now - this.lastWaveTime >= waveInterval) {
      this.spawnEnemyWave();
      this.lastWaveTime = now;
    }
  }

  private spawnEnemyWave(): void {
    console.log('Enemy wave incoming!');
    
    // Spawn enemies from the edges of the world
    const waveSize = 3 + Math.floor(this.monsters.length / 2); // Scale with player monsters
    
    for (let i = 0; i < waveSize; i++) {
      const genetics = GeneticsEngine.createRandomGenetics(MonsterType.ENEMY);
      
      // Spawn from edges
      let x, y;
      if (Math.random() < 0.5) {
        // From sides
        x = Math.random() < 0.5 ? 0 : WORLD_WIDTH * TILE_SIZE;
        y = (20 + Math.random() * 80) * TILE_SIZE;
      } else {
        // From top/bottom
        x = Math.random() * WORLD_WIDTH * TILE_SIZE;
        y = Math.random() < 0.5 ? 0 : WORLD_HEIGHT * TILE_SIZE;
      }
      
      const enemy = new Monster(genetics, x, y, false);
      const enemySprite = new MonsterSprite(this, x, y, enemy);
      // Enemies will be distinguished by their red-tinted genetics colors
      
      this.monsters.push(enemy);
      this.monsterSprites.set(enemy.id, enemySprite);
    }
  }

  private updateUI(): void {
    // Update population - count ALL monsters for now
    const aliveMonsters = this.monsters.filter(m => m.state !== MonsterState.DEAD);
    this.events.emit('updatePopulation', aliveMonsters.length, this.resourceTracker.maxPopulation);
    
    // Wave timer - proper countdown
    const waveInterval = 120000; // 2 minutes
    const timeSinceWave = Date.now() - this.lastWaveTime;
    const timeUntilWave = Math.max(0, waveInterval - timeSinceWave);
    const minutes = Math.floor(timeUntilWave / 60000);
    const seconds = Math.floor((timeUntilWave % 60000) / 1000);
    const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    this.events.emit('updateWaveTimer', timerText);
    
    // Update resources
    const resources = this.resourceTracker.getResources();
    this.events.emit('updateResources', resources);
  }

  private handleClick(pointer: Phaser.Input.Pointer): void {
    // Convert screen coordinates to world coordinates
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    
    // Check if clicking on a monster first
    let clickedMonster = null;
    for (const monster of this.monsters) {
      if (monster.isSelectable()) {
        const bounds = monster.getClickBounds();
        if (bounds.contains(worldX, worldY)) {
          clickedMonster = monster;
          break;
        }
      }
    }
    
    if (clickedMonster) {
      // Monster clicked - show genetics UI
      this.selectMonster(clickedMonster);
      return;
    }
    
    // No monster clicked - handle build or pheromone action
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    
    // Check if we're in build mode
    if (this.selectedBuildItem) {
      this.placeBuildItem(tileX, tileY, this.selectedBuildItem);
      return;
    }
    
    // Handle pheromone actions
    if (this.selectedPheromone === 'ERASER') {
      // Erase pheromone at this location
      const pheromone = this.pheromoneSystem.getPheromoneAt(tileX, tileY);
      if (pheromone) {
        this.pheromoneSystem.removePheromone(pheromone.id);
        console.log(`🧹 Erased pheromone at tile (${tileX}, ${tileY})`);
      }
    } else if (this.selectedPheromone === 'CLEAR_ALL') {
      // Already handled in pheromoneSelected event
    } else {
      // Place pheromone
      this.pheromoneSystem.addPheromone(tileX, tileY, this.selectedPheromone as PheromoneType, 50);
      console.log(`Placed ${this.selectedPheromone} pheromone at tile (${tileX}, ${tileY})`);
    }
  }
  
  private placeBuildItem(tileX: number, tileY: number, itemId: string): void {
    // Check if tile is valid (should be AIR)
    if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) {
      console.log('Cannot build - out of bounds');
      return;
    }
    
    const tile = this.world[tileX][tileY];
    if (tile.type !== TileType.AIR) {
      console.log('Cannot build - tile is not empty');
      return;
    }
    
    // Check cost and deduct resources
    let cost = 0;
    let tileType: TileType | null = null;
    
    if (itemId === 'RAMP_UP_RIGHT') {
      cost = 2;
      tileType = TileType.RAMP_UP_RIGHT;
    } else if (itemId === 'RAMP_UP_LEFT') {
      cost = 2;
      tileType = TileType.RAMP_UP_LEFT;
    }
    
    if (!tileType) {
      console.log('Unknown build item');
      return;
    }
    
    // Check if player has enough dirt
    const resources = this.resourceTracker.getResources();
    if (resources.dirt < cost) {
      console.log(`Not enough dirt! Need ${cost}, have ${resources.dirt}`);
      return;
    }
    
    // Deduct resources
    this.resourceTracker.addResources(TileType.DIRT, -cost);
    this.events.emit('updateResources', this.resourceTracker.getResources());
    
    // Place the ramp tile
    tile.type = tileType;
    tile.integrity = 100;
    this.renderTile(tileX, tileY);
    
    console.log(`🏗️ Built ${itemId} at (${tileX}, ${tileY}) for ${cost} dirt`);
  }

  private renderWorld(): void {
    this.worldGraphics.clear();
    
    for (let x = 0; x < WORLD_WIDTH; x++) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        this.renderTile(x, y);
      }
    }
  }

  private renderVisibleWorld(): void {
    // Only render tiles visible on screen for better performance
    const cameraBounds = this.cameras.main.worldView;
    const startX = Math.max(0, Math.floor(cameraBounds.left / TILE_SIZE));
    const endX = Math.min(WORLD_WIDTH, Math.ceil(cameraBounds.right / TILE_SIZE));
    const startY = Math.max(0, Math.floor(cameraBounds.top / TILE_SIZE));
    const endY = Math.min(WORLD_HEIGHT, Math.ceil(cameraBounds.bottom / TILE_SIZE));
    
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        // Always render all tiles - let the TerrariaTileRenderer handle fog of war layers
        this.renderTile(x, y);
      }
    }
  }

  private renderTile(x: number, y: number): void {
    const tile = this.world[x][y];
    const properties = TILE_PROPERTIES[tile.type];
    
    // Use Terraria-style tile renderer (handles fog of war with progressive layers internally)
    const tileContainer = this.tileRenderer.renderTile(x, y, tile, TILE_SIZE, this.world);
    if (tileContainer) {
      tileContainer.setScrollFactor(1);
      return; // Tile rendered successfully (either as tile or fog)
    }
    
    // If tile wasn't rendered by Terraria renderer, it's empty/air
    // No fallback needed - we handle all textures through the dynamic loader
    const spriteCanvas = null;
    
    if (spriteCanvas) {
      // Use sprite texture if available
      const tileKey = `tile_${properties.spriteName}_${x}_${y}`;
      
      // Create Phaser texture from canvas if not already exists
      if (!this.textures.exists(tileKey)) {
        this.textures.addCanvas(tileKey, spriteCanvas);
      }
      
      // Remove any existing sprite at this position
      const existingSprite = this.children.getByName(`sprite_${x}_${y}`);
      if (existingSprite) {
        existingSprite.destroy();
      }
      
      // Create new sprite
      const sprite = this.add.image(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, tileKey);
      sprite.setName(`sprite_${x}_${y}`);
      sprite.setOrigin(0.5, 0.5);
      sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
      
      // Add brightness variation for ore tiles
      if (tile.resources > 0) {
        const brightness = 1 + (tile.resources / 10) * 0.5;
        sprite.setTint(0xffffff * brightness);
      }
      
      // Show damaged tiles with transparency
      if (tile.integrity > 0 && tile.integrity < TILE_PROPERTIES[tile.type].hardness * 10) {
        const damage = 1 - (tile.integrity / (TILE_PROPERTIES[tile.type].hardness * 10));
        sprite.setAlpha(1 - damage * 0.3);
      }
    } else {
      // Fallback to color fills if sprite not available
      let color = 0x000000;
      if (properties.color.startsWith('#')) {
        color = parseInt(properties.color.replace('#', '0x'));
      }
      
      this.worldGraphics.fillStyle(color);
      this.worldGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      
      // Add brightness variation for ore tiles
      if (tile.resources > 0) {
        const brightness = 1 + (tile.resources / 10) * 0.5;
        this.worldGraphics.fillStyle(color, brightness);
        this.worldGraphics.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      }
      
      // Show damaged tiles with reduced opacity
      if (tile.integrity > 0 && tile.integrity < TILE_PROPERTIES[tile.type].hardness * 10) {
        const damage = 1 - (tile.integrity / (TILE_PROPERTIES[tile.type].hardness * 10));
        this.worldGraphics.fillStyle(0xffffff, damage * 0.3);
        this.worldGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  
  /**
   * Callback when new monsters are bred
   */
  private onMonstersBred(offspring: any[]): void {
    console.log(`New offspring created: ${offspring.length} babies`);
    
    // Update baby counter
    if ((this as any).generationCounter) {
      offspring.forEach(() => {
        (this as any).generationCounter.babiesBorn++;
      });
    }
    
    const hiveX = (WORLD_WIDTH * TILE_SIZE) / 2;
    const hiveY = (20 + 12 + 6 - 1) * TILE_SIZE;
    
    // Create Monster entities for offspring
    offspring.forEach((genetics, index) => {
      // Place babies near the hive with some spacing
      const offsetX = (index - offspring.length / 2) * 20;
      const baby = new Monster(genetics, hiveX + offsetX, hiveY - 20, true);
      
      // Determine movement type based on genetics
      const appearance = baby.stats.appearance;
      appearance.movementType = this.movementSystem.determineMovementType(
        appearance.limbCount,
        appearance.hasWings || false,
        appearance.bodyType,
        appearance.mutations
      );
      
      // Create sprite using procedural renderer
      const spriteContainer = this.monsterSpriteRenderer.createProceduralMonster(
        hiveX + offsetX, 
        hiveY - 20, 
        baby.stats.appearance, 
        baby.lifeStage
      );
      
      // Ensure monsters appear above background tiles
      spriteContainer.setDepth(10);
      spriteContainer.name = baby.id; // Set name for animation tracking
      
      baby.setSpriteContainer(spriteContainer);
      
      // Initialize ragdoll physics for baby monster
      this.ragdollPhysics.initializeRagdoll(baby.id, spriteContainer, 0, 0);
      
      // Make sprite interactive for clicking
      spriteContainer.setInteractive(baby.getClickBounds(), Phaser.Geom.Rectangle.Contains);
      spriteContainer.on('pointerdown', () => this.selectMonster(baby));
      
      this.monsters.push(baby);
      this.monsterSprites.set(baby.id, baby as any); // Compatibility with existing sprite system
      
      console.log(`Created baby monster ${baby.id} at hive`);
    });
  }
  
  /**
   * Callback when monster is sent to hive
   */
  private onMonsterSentToHive(monster: any): void {
    console.log(`Monster ${monster.genetics.uniqueId} sent to hive for breeding`);
    // Monster position will be updated by breeding manager
  }
  
  /**
   * Handle monster selection
   */
  private selectMonster(monster: Monster): void {
    if (!monster.isSelectable()) return;
    
    this.selectedMonster = monster;
    this.monsterSelectionUI.showMonsterGenetics(monster);
    console.log(`Selected monster: ${monster.id}, Life stage: ${monster.lifeStage}`);
  }
  
  /**
   * Create a corpse resource from a dead monster
   */
  private createCorpseResource(monster: Monster): void {
    // Create a bloody corpse sprite
    const corpseSprite = this.add.container(monster.position.x, monster.position.y);
    
    // Add large blood splat
    const blood1 = this.add.circle(0, 8, 25, 0x660000, 0.9);
    const blood2 = this.add.circle(-5, 12, 15, 0x990000, 0.7);
    const blood3 = this.add.circle(8, 10, 18, 0x880000, 0.8);
    corpseSprite.add([blood1, blood2, blood3]);
    
    // Keep the monster sprite but make it look dead
    if (monster.sprite) {
      // Apply death effects to all sprites in container
      if (monster.sprite instanceof Phaser.GameObjects.Container) {
        monster.sprite.list.forEach(child => {
          if (child instanceof Phaser.GameObjects.Sprite || child instanceof Phaser.GameObjects.Graphics) {
            (child as any).setTint?.(0x555555); // Dark gray tint for death
          }
        });
      }
      monster.sprite.rotation = 1.57; // Rotate 90 degrees (lying down)
      monster.sprite.setAlpha(0.6);
      corpseSprite.add(monster.sprite);
    }
    
    // Create corpse as special "organic" resource that monsters can carry
    // Use dirt as the base type (will override sprite anyway)
    const chunks = this.resourceChunkManager.createChunksFromTile(
      TileType.DIRT, // Use dirt as base, will override sprite
      Math.floor(monster.position.x / TILE_SIZE),
      Math.floor(monster.position.y / TILE_SIZE),
      20 // Heavy resource value
    );
    
    // Make corpses extra heavy and replace sprites
    chunks.forEach(chunk => {
      chunk.weight = 3.0; // 3x heavier than normal
      chunk.carriersNeeded = 2; // Needs 2 monsters to carry efficiently
      // Replace the default sprite with our corpse sprite
      if (chunk.sprite) {
        chunk.sprite.destroy();
      }
      chunk.sprite = corpseSprite as any; // Cast to any to avoid type issues
    });
    
    console.log(`Monster ${monster.id} DIED and became a heavy corpse resource!`);
  }

  /**
   * Update monster sprites with current genetics-based appearance
   */
  private updateMonsterSprites(): void {
    // With procedural renderer, sprites are recreated when needed
    // This method is kept for compatibility but may not be needed
    this.monsters.forEach(monster => {
      if (monster.sprite) {
        // Update sprite scale based on life stage - TINY for block size!
        const scale = 0.05; // OVERRIDE to be tiny!
        switch (monster.lifeStage) {
          case MonsterLifeStage.BABY:
            monster.sprite.setScale(scale * 0.5);
            break;
          case MonsterLifeStage.JUVENILE:
            monster.sprite.setScale(scale * 0.75);
            break;
          default:
            monster.sprite.setScale(scale);
            break;
        }
      }
    });
  }
}
