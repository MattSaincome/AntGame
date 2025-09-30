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
import { RTSHud } from '../ui/RTSHud';
import { MonsterType } from '../genetics/GeneticsTypes';
import { TerrariaTileRenderer } from '../systems/TerrariaTileRenderer';
import { ProceduralMovementSystem } from '../systems/ProceduralMovementSystem';
import { bugMonitor } from '../systems/BugMonitor';

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
  private selectedPheromone: PheromoneType = PheromoneType.MINE_HERE;
  private speedText!: Phaser.GameObjects.Text;
  private populationText!: Phaser.GameObjects.Text;
  private waveTimerText!: Phaser.GameObjects.Text;
  
  // New genetics and breeding systems
  private monsterSpriteRenderer!: TrueProceduralPartsRenderer;
  private monsterSelectionUI!: MonsterSelectionUI;
  private breedingManager!: BreedingManager;
  private selectedMonster: Monster | null = null;
  private rtsHud!: RTSHud;
  
  // Terraria-style tile renderer with edge detection
  private tileRenderer!: TerrariaTileRenderer;
  
  // Procedural movement system for animations
  private movementSystem!: ProceduralMovementSystem;
  private seedPartLoader!: SeedBasedPartLoader;
  
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
    this.cameras.main.setZoom(2);
    
    // Add mouse wheel zoom controls
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const currentZoom = this.cameras.main.zoom;
      const zoomDelta = deltaY > 0 ? -0.1 : 0.1; // Scroll up = zoom in, scroll down = zoom out
      const newZoom = Phaser.Math.Clamp(currentZoom + zoomDelta, 0.5, 4); // Zoom range: 0.5x to 4x
      this.cameras.main.setZoom(newZoom);
    });
    
    // Setup input
    this.keys = this.input.keyboard?.addKeys('W,S,A,D,SPACE,B,MINUS,PLUS,EQUALS,ONE');
    this.input.on('pointerdown', this.handleClick, this);
    
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
    
    // Initialize RTS HUD with pheromone and speed controls
    this.rtsHud = new RTSHud(this, this.pheromoneSystem);
    
    // Add initial pheromones to guide mining behavior
    this.addInitialMiningPheromones();
    
    // Set up monster selection UI callback
    this.monsterSelectionUI.setBreedCallback((monster) => {
      this.breedingManager.sendMonsterToHive(monster);
    });
    
    // Set up RTS HUD event handlers
    this.events.on('gameSpeedChanged', (speed: number) => {
      this.gameSpeed = speed;
      this.speedText.setText(`Speed: ${speed.toFixed(1)}x`);
      console.log(`Game speed changed to: ${speed}x`);
    });
    
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
    
    // Monitor frame performance for crash prevention
    bugMonitor.monitorFramePerformance();
    
    // Monitor memory usage
    bugMonitor.monitorMemoryUsage(this.monsters.length, 'monsters');
    bugMonitor.monitorMemoryUsage(this.resourceChunkManager.getAllChunks().length, 'resource_chunks');
    
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
    
    // Update RTS HUD with current game speed
    this.rtsHud.updateGameSpeed(this.gameSpeed);
    
    // Re-render world if needed (only visible area for performance)
    if (time % 100 === 0) { // Every 100ms
      this.renderVisibleWorld();
    }
  }

  private createFirstFamily(): void {
    const hiveX = (WORLD_WIDTH * TILE_SIZE) / 2;
    const hiveY = 37 * TILE_SIZE - 23; // Spawn 1 block lower - on the actual ground
    
    const firstFamilyGenetics = GeneticsEngine.createFirstFamily();
    
    firstFamilyGenetics.forEach((genetics, index) => {
      // Place monsters on ground on left and right sides of hive
      const isLeftSide = index % 2 === 0; // Alternate left/right placement
      const monsterNumber = Math.floor(index / 2); // 0, 0, 1, 1, 2 for 5 monsters
      
      // Distance from hive center (40-80 pixels to each side)
      const baseDistance = 40 + (monsterNumber * 20); 
      const x = isLeftSide ? hiveX - baseDistance : hiveX + baseDistance;
      
      // Place directly on the ground level (same Y as hive)
      const y = hiveY;
      
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
      
      // Make sprite interactive for clicking
      spriteContainer.setInteractive(monster.getClickBounds(), Phaser.Geom.Rectangle.Contains);
      spriteContainer.on('pointerdown', () => this.selectMonster(monster));
      
      // Ensure monsters start on solid ground - no falling!
      monster.position.onGround = true;
      monster.position.vy = 0; // No falling velocity
      monster.position.y = hiveY; // Ensure exact Y position on chamber floor
      
      this.monsters.push(monster);
      // Keep compatibility with existing MonsterSprite system for now
      this.monsterSprites.set(monster.id, monster as any);
      
      console.log(`Monster ${monster.id} (${monster.stats.appearance.headType}/${monster.stats.appearance.bodyType}) placed at (${Math.round(x)}, ${Math.round(y)})`);
    });
    
    console.log(`Created first family: ${firstFamilyGenetics.length} monsters on ground beside hive`);
  }

  private createUI(): void {
    // Note: RTSHud now handles pheromone and speed controls
    // We still need these temporary text elements for population and wave timer
    // until they're integrated into the RTSHud
    
    // TOP LEFT - Population counter
    this.populationText = this.add.text(20, 120, 'Population: 0', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.populationText.setScrollFactor(0);
    this.populationText.setDepth(2000);

    // Wave timer
    this.waveTimerText = this.add.text(20, 50, 'Next Wave: 2:00', {
      fontSize: '16px',
      color: '#ff4444',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.waveTimerText.setScrollFactor(0);
    this.waveTimerText.setDepth(2000);

    // Create speed control text
    this.speedText = this.add.text(this.cameras.main.width - 100, 50, 'Speed: 1.5x', {
      fontSize: '16px',
      color: '#00ff00'
    });
    this.speedText.setScrollFactor(0);
    this.speedText.setDepth(100000);
    
    // Create evolution stats display
    this.createEvolutionStatsDisplay();
    
    // TOP RIGHT - Resource display (detailed)
    this.createResourceDisplay();

    // Bottom HUD panel
    this.createBottomHUD();
  }

  private createEvolutionStatsDisplay(): void {
    // Create gene pool stats display
    const seedInfo = this.seedPartLoader.getCurrentSeeds();
    const totalMonsters = seedInfo[0].monsterSets.length + seedInfo[1].monsterSets.length;
    
    this.add.text(20, 80, 'Gene Pools (2 Mixed)', {
      fontSize: '14px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(2000);
    
    const evolutionText = this.add.text(20, 100, [
      `Pools: ${seedInfo[0].name} + ${seedInfo[1].name}`,
      `Monster Types: ${totalMonsters}`,
      `Parts Loaded: ~${totalMonsters * 7}` // Estimate ~7 parts per monster
    ], {
      fontSize: '12px',
      color: '#ffffff'
    });
    evolutionText.setScrollFactor(0);
    evolutionText.setDepth(2000);
    
    // Add generation counter
    let generation = 0;
    let babiesBorn = 0;
    // HUD/debug display for gene pools
    const seedDebugText = this.add.text(10, 350, '', { 
      fontSize: '10px', 
      color: '#00ff00' 
    });
    
    if (this.seedPartLoader && this.seedPartLoader.getCurrentSeeds) {
      const seeds = this.seedPartLoader.getCurrentSeeds();
      seedDebugText.setText([
        `Gene Pools: ${seeds[0].name} + ${seeds[1].name}`,
        `Monsters: ${seeds[0].monsterSets.length + seeds[1].monsterSets.length} types`
      ]);
    }
    // Store references for updating
    (this as any).generationCounter = { generation, babiesBorn, increment: () => babiesBorn++ };
  }
  
  private createResourceDisplay(): void {
    const startX = this.scale.width - 200;
    const startY = 20;
    
    // Background for resources
    const resourceBG = this.add.rectangle(startX + 80, startY + 60, 160, 120, 0x000000, 0.8);
    resourceBG.setScrollFactor(0);
    resourceBG.setDepth(1999);
    
    // Resource title
    this.add.text(startX, startY, 'RESOURCES', {
      fontSize: '14px',
      color: '#00ffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    }).setScrollFactor(0).setDepth(2000);

    // Individual resource counters
    const resources = [
      { name: 'Dirt', color: '#8B4513' },
      { name: 'Stone', color: '#696969' },
      { name: 'Copper', color: '#CD853F' },
      { name: 'Iron', color: '#4682B4' },
      { name: 'Gold', color: '#FFD700' },
      { name: 'Crystal', color: '#9370DB' }
    ];

    resources.forEach((resource, index) => {
      this.add.text(startX, startY + 25 + (index * 15), `${resource.name}: 0`, {
        fontSize: '12px',
        color: resource.color,
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }).setScrollFactor(0).setDepth(2000);
    });
  }

  private createBottomHUD(): void {
    // RTSHud now handles all bottom HUD functionality including pheromone and speed controls
    // This method is kept for backward compatibility but is now empty
    // The RTSHud was initialized in create() and provides:
    // - Pheromone command panel with 4 pheromone types
    // - Speed control panel with speed buttons and pause
    // - Professional StarCraft-style interface
  }
  
  /**
   * Add initial pheromones to guide mining behavior
   */
  private addInitialMiningPheromones(): void {
    // Find the starting chamber location
    const chamberCenterX = Math.floor(WORLD_WIDTH / 2);
    const chamberY = 40; // Floor of the starting chamber (approximation based on hive position)
    const chamberHalfWidth = 15; // Chamber is about 30 blocks wide
    
    // Place "DO NOT MINE" pheromones on the entire floor of the starting chamber
    for (let x = chamberCenterX - chamberHalfWidth; x <= chamberCenterX + chamberHalfWidth; x++) {
      // Place strong DO_NOT_MINE pheromones on the floor
      this.pheromoneSystem.addPheromone(
        x,  // tile X
        chamberY, // tile Y
        PheromoneType.DO_NOT_MINE,
        100, // Max strength
        0,   // No decay
        true  // Player-placed (stronger effect)
      );
    }
    
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
    console.log(`- DO NOT MINE on floor at Y=${chamberY}`);
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
      this.speedText.setText(`Speed: ${this.gameSpeed.toFixed(1)}x`);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.PLUS) || Phaser.Input.Keyboard.JustDown(this.keys.EQUALS)) {
      this.gameSpeed = Math.min(5.0, this.gameSpeed + 0.25);
      this.speedText.setText(`Speed: ${this.gameSpeed.toFixed(1)}x`);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
      this.gameSpeed = 1.0;
      this.speedText.setText(`Speed: ${this.gameSpeed.toFixed(1)}x`);
    }
    
    // Pause/unpause
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.gameSpeed = this.gameSpeed === 0 ? 1 : 0;
      this.speedText.setText(`Speed: ${this.gameSpeed.toFixed(1)}x`);
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
      
      // Handle rest and energy management FIRST - highest priority!
      this.handleMonsterRest(monster, deltaTime);
      
      // Only do other activities if not resting
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
      
      // Update sprite and animate walking
      const sprite = this.monsterSprites.get(monster.id);
      if (sprite) {
        sprite.update();
      }
      
      // Update sprite position to match monster position - NO OFFSET at tiny scale!
      if (monster.sprite) {
        monster.sprite.x = monster.position.x;
        monster.sprite.y = monster.position.y; // No offset - at 0.064 scale, 6 pixels is huge!
        
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
        
        // === INDIVIDUAL BODY PART ANIMATIONS ===
        if (monster.sprite instanceof Phaser.GameObjects.Container) {
          const container = monster.sprite as Phaser.GameObjects.Container;
          
          // Get individual body parts
          const leftLeg = container.getByName('leftLeg') as Phaser.GameObjects.Sprite;
          const rightLeg = container.getByName('rightLeg') as Phaser.GameObjects.Sprite;
          const leftArm = container.getByName('leftArm') as Phaser.GameObjects.Sprite;
          const rightArm = container.getByName('rightArm') as Phaser.GameObjects.Sprite;
          const body = container.getByName('body') as Phaser.GameObjects.Sprite;
          const head = container.getByName('head') as Phaser.GameObjects.Sprite;
          
          const isWalking = Math.abs(monster.position.vx) > 20 && monster.position.onGround;
          const isJumping = monster.position.vy < -100;
          const isFalling = monster.position.vy > 100;
          const isMining = monster.state === MonsterState.MINING;
          const isCarrying = monster.carryingChunkId !== null || monster.carryingResources > 0;
          
          // WALKING ANIMATION - alternating leg swing
          if (isWalking && leftLeg && rightLeg) {
            const walkSpeed = Math.abs(monster.position.vx) * 0.015;
            const walkCycle = Math.sin(this.time.now * walkSpeed);
            
            // Legs swing back and forth (opposite)
            leftLeg.rotation = walkCycle * 0.3; // -0.3 to 0.3 radians
            rightLeg.rotation = -walkCycle * 0.3;
            
            // Arms swing opposite to legs
            if (leftArm) leftArm.rotation = -walkCycle * 0.2;
            if (rightArm) rightArm.rotation = walkCycle * 0.2;
            
            // Body bobs up and down
            if (body) {
              const bob = Math.abs(Math.sin(this.time.now * walkSpeed * 2)) * 2;
              body.y = bob - 1;
            }
            
            // Head tilts slightly
            if (head) head.rotation = walkCycle * 0.05;
          }
          // JUMPING - legs tuck up
          else if (isJumping && leftLeg && rightLeg) {
            leftLeg.rotation = -0.5; // Tuck up
            rightLeg.rotation = -0.5;
            if (leftArm) leftArm.rotation = -0.3; // Arms up
            if (rightArm) rightArm.rotation = -0.3;
            if (head) head.rotation = 0;
            if (body) body.y = 0;
          }
          // FALLING - legs dangle
          else if (isFalling && leftLeg && rightLeg) {
            leftLeg.rotation = 0.3; // Dangle down
            rightLeg.rotation = 0.3;
            if (leftArm) leftArm.rotation = 0.4; // Arms flail
            if (rightArm) rightArm.rotation = 0.4;
            if (head) head.rotation = 0;
            if (body) body.y = 0;
          }
          // MINING - arm swing
          else if (isMining) {
            const swingSpeed = 0.01;
            const swing = Math.sin(this.time.now * swingSpeed);
            if (rightArm) rightArm.rotation = swing * 0.8 - 0.4; // Big swing
            if (leftArm) leftArm.rotation = swing * 0.2;
            if (body) {
              body.rotation = swing * 0.1;
              body.y = 0;
            }
            if (leftLeg) leftLeg.rotation = 0;
            if (rightLeg) rightLeg.rotation = 0;
            if (head) head.rotation = swing * 0.05;
          }
          // CARRYING - lean forward
          else if (isCarrying) {
            if (leftArm) leftArm.rotation = -0.3; // Hold resource
            if (rightArm) rightArm.rotation = -0.3;
            if (body) {
              body.rotation = 0.1; // Lean forward
              body.y = 1; // Lower from weight
            }
            if (leftLeg) leftLeg.rotation = 0.1;
            if (rightLeg) rightLeg.rotation = 0.1;
            if (head) head.rotation = -0.1; // Look down at resource
          }
          // IDLE - reset to neutral
          else {
            if (leftLeg) leftLeg.rotation = 0;
            if (rightLeg) rightLeg.rotation = 0;
            if (leftArm) leftArm.rotation = 0;
            if (rightArm) rightArm.rotation = 0;
            if (body) {
              body.rotation = 0;
              body.y = 0;
            }
            if (head) head.rotation = 0;
          }
          
          // Flip container based on movement direction
          if (monster.position.vx < -5) {
            container.scaleX = -Math.abs(container.scaleX);
          } else if (monster.position.vx > 5) {
            container.scaleX = Math.abs(container.scaleX);
          }
        }
      }
      
      return true;
    });
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
    // Skip exploration if monster is carrying resources or at rest
    if (monster.carryingChunkId || monster.helpingCarryChunkId || monster.isResting()) {
      return;
    }

    // Set initial exploration target if monster doesn't have one
    if (!monster.getExplorationTarget()) {
      monster.setExplorationTarget();
    }

    const explorationTarget = monster.getExplorationTarget();
    if (!explorationTarget) return;

    // Check if monster should move toward exploration target
    const distanceToTarget = Math.sqrt(
      Math.pow(explorationTarget.x - monster.position.x, 2) + 
      Math.pow(explorationTarget.y - monster.position.y, 2)
    );

    // Move toward exploration target if far enough away
    if (distanceToTarget > 25) {
      const speed = 60 * deltaTime; // Faster exploration speed
      const dx = (explorationTarget.x - monster.position.x) / distanceToTarget;
      const dy = (explorationTarget.y - monster.position.y) / distanceToTarget;

      // Check if the path toward target is clear before moving
      const potentialX = monster.position.x + dx * speed * 60; // Check a bit ahead
      const potentialY = monster.position.y + dy * speed * 60;
      
      if (!this.checkTileCollision(potentialX, potentialY)) {
        // Path is clear - set movement toward exploration target
        monster.position.vx = dx * speed;
        monster.position.vy = dy * speed;
        monster.target = explorationTarget;
        monster.state = MonsterState.MOVING;
      } else {
        // Path blocked - set new exploration target in different direction
        monster.setExplorationTarget();
        monster.position.vx = 0;
        monster.position.vy = 0;
      }
    } else {
      // Reached exploration target - set new one
      monster.setExplorationTarget();
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
      
      // ULTRA FAST MINING - Each "hit" does massive damage
      // Dirt (integrity 10-30) breaks in 1-2 hits
      // Stone (integrity 30-50) breaks in 3-4 hits
      const baseDamage = miningPower * 15; // Each hit does 15 damage at max mining speed
      
      // Add some randomness for excitement - sometimes monsters hit harder!
      const criticalHit = Math.random() < 0.2; // 20% chance of critical hit
      const superCrit = Math.random() < 0.05; // 5% chance of SUPER critical hit
      
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
      if (!monster.lastMiningHit || now - monster.lastMiningHit > 300) { // Hit every 0.3 seconds for faster, satisfying mining
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
      } else {
        // Between hits, just show working animation without damage
        return;
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
        
        // Monster feels accomplished after breaking a block
        monster.energy = Math.min(100, monster.energy + 2); // Small energy boost from satisfaction
        
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
          
          // Check pheromone influence on mining priority
          if (this.pheromoneSystem.isMiningForbidden(x, y)) {
            priority = 0; // Completely forbidden by pheromones
          } else if (this.pheromoneSystem.isMiningEncouraged(x, y)) {
            priority *= 5.0; // HUGE boost for "mine here" pheromones
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
              monster.energy -= 5; // Immediate energy cost for trying to lift heavy chunks
            }
          }
        } else if (nearbyChunk.currentCarriers.length < nearbyChunk.carriersNeeded) {
          // Join existing carrying team - monsters love helping!
          if (this.resourceChunkManager.addCarrier(nearbyChunk.id, monster.id)) {
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

    // Move toward hive - but much slower with heavy chunks!
    monster.target = hivePos;
    
    // Get chunk to check weight
    const chunks = this.resourceChunkManager.getAllChunks();
    const chunk = chunks.find(c => c.id === chunkId);
    
    // Heavy chunks slow down the monster significantly
    if (chunk && chunk.carriersNeeded >= 2) {
      const weightPenalty = 0.3 / chunk.carriersNeeded; // Heavier = much slower
      monster.position.vx *= weightPenalty;
      monster.position.vy *= weightPenalty;
      
      // Drain more energy when carrying heavy loads alone
      if (chunk.currentCarriers.length < chunk.carriersNeeded) {
        monster.energy -= 2.0 * (chunk.carriersNeeded - chunk.currentCarriers.length) * 0.016;
      }
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

  private applyPhysics(monster: Monster, deltaTime: number): void {
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
    
    // Check if monster can fly
    const canFly = monster.sprite && (monster.sprite as any).movementType === 'fly';
    const canHop = monster.sprite && (monster.sprite as any).movementType === 'hop';
    
    // HEAVY LEMMINGS-STYLE GRAVITY (but flying creatures IGNORE gravity)
    const gravity = canFly ? 0 : 1600; // NO gravity for flyers, heavy for walkers
    const terminalVelocity = canFly ? 0 : 800; // Flyers don't fall, walkers fall FAST
    const groundFriction = 0.85; // Less friction - more sliding
    const wallCrawlSpeed = 0.05; // EXTREMELY slow wall-crawling (was 0.1)
    const wallCrawlEnergyDrain = 8.0 * deltaTime; // MASSIVE energy cost for wall climbing
    
    const currentTileX = Math.floor(monster.position.x / TILE_SIZE);
    const currentTileY = Math.floor(monster.position.y / TILE_SIZE);
    const belowTileY = currentTileY + 1;
    
    // Check if there's solid ground directly below
    let hasGroundSupport = false;
    if (belowTileY < WORLD_HEIGHT && currentTileX >= 0 && currentTileX < WORLD_WIDTH) {
      const tileBelow = this.world[currentTileX][belowTileY];
      if (tileBelow && TILE_PROPERTIES[tileBelow.type].solid) {
        hasGroundSupport = true;
      }
    }

    // Check for nearby walls to crawl on
    const canWallCrawl = this.checkForWallCrawling(monster, currentTileX, currentTileY);
    
    if (hasGroundSupport) {
      // WALKING/HOPPING ON SOLID GROUND
      monster.isWallCrawling = false;
      monster.facingBackward = false;
      monster.position.onGround = true;
      
      // Check if monster just face-planted from a fall - BRUTAL LEMMINGS IMPACT!
      if ((monster as any).isFalling && (monster as any).fallHeight > 15) { // LOWER threshold - hurts easier!
        // HARD STOP - complete momentum kill
        monster.position.vx = 0;
        monster.position.vy = 0;
        (monster as any).isFalling = false;
        
        // HEAVY DAMAGE from falls
        const fallDamage = Math.min(80, (monster as any).fallHeight / 2); // MORE damage!
        monster.energy -= fallDamage;
        
        // CHECK FOR DEATH
        if (monster.energy <= 0) {
          // MONSTER DIED FROM FALL!
          console.log(`Monster ${monster.id} DIED from fall! Height: ${(monster as any).fallHeight}`);
          
          // Create blood splat effect
          if (this.cameras?.main) {
            this.cameras.main.shake(200, 0.02);
          }
          
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
          // SURVIVED - face plant with FASTER recovery
          (monster as any).facePlanted = true;
          (monster as any).recoverTime = 1.0; // FASTER recovery - only 1 second
          
          // SCREEN SHAKE for big falls
          if ((monster as any).fallHeight > 40 && this.cameras?.main) {
            this.cameras.main.shake(150, 0.01 * ((monster as any).fallHeight / 40));
          }
          
          console.log(`Monster ${monster.id} face-planted from height ${(monster as any).fallHeight}! Damage: ${fallDamage}`);
        }
      }
      
      // Reset fall tracking
      (monster as any).fallTime = 0;
      (monster as any).fallHeight = 0;
      (monster as any).isFalling = false;
      
      // Handle recovery from face plant
      if ((monster as any).facePlanted) {
        (monster as any).recoverTime -= deltaTime;
        if ((monster as any).recoverTime <= 0) {
          (monster as any).facePlanted = false; // Recovered!
        } else {
          // Still recovering - can't move
          monster.position.vx = 0;
          monster.position.vy = 0;
          return; // Skip normal movement
        }
      }
      
      if (canHop && Math.abs(monster.position.vx) > 0.1) {
        // Hopping movement - periodic jumps
        const hopTime = this.time.now * 0.003;
        if (Math.sin(hopTime) > 0.9 && monster.position.vy === 0) {
          // Check if near pyramid for stronger hops
          const nearPyramid = Math.abs(monster.position.x - (WORLD_WIDTH * TILE_SIZE / 2)) < TILE_SIZE * 15;
          monster.position.vy = nearPyramid ? -475 : -425; // Stronger hop near pyramid!
          monster.energy -= 1; // Small energy cost
        }
      } else if (canFly && monster.energy > 10) {
        // Flying creatures can take off from ground
        if (Math.abs(monster.position.vx) > 0.1 || Math.abs(monster.position.vy) < -0.1) {
          monster.position.vy = -150; // Gentle lift-off
          monster.energy -= 0.5 * deltaTime; // Flying costs energy
        }
      }
      
      if (monster.position.vy > 0) {
        monster.position.vy = 0;
        monster.position.vx *= groundFriction;
      }
    } else if (canWallCrawl && !hasGroundSupport) {
      // WALL CRAWLING MODE - extremely difficult and tiring!
      monster.isWallCrawling = true;
      monster.facingBackward = true; // Show monster's back (facing wall)
      monster.position.onGround = false;
      
      // MASSIVE energy drain from wall crawling - monsters hate this!
      monster.energy = Math.max(0, monster.energy - wallCrawlEnergyDrain);
      
      // If energy gets too low, monsters can't wall crawl anymore
      if (monster.energy < 20) {
        // Too tired to wall crawl - fall down!
        monster.isWallCrawling = false;
        monster.position.vy += gravity * deltaTime * 1.5; // Fall faster when exhausted
        monster.position.vx *= 0.5; // Lose horizontal momentum
      } else {
        // EXTREMELY slow movement when wall crawling
        monster.position.vx *= wallCrawlSpeed;
        monster.position.vy *= wallCrawlSpeed;
        
        // Still affected by gravity - wall crawling is hard work
        monster.position.vy += gravity * deltaTime * 0.8; // Still pulled down
        monster.position.vy = Math.min(monster.position.vy, terminalVelocity * 0.3);
      }
      
    } else {
      // FALLING or FLYING
      monster.isWallCrawling = false;
      monster.facingBackward = false;
      monster.position.onGround = false;
      
      if (canFly && monster.energy > 5) {
        // FLYING - ZERO GRAVITY FREEDOM!
        (monster as any).isFalling = false; // Flying creatures NEVER fall
        (monster as any).fallHeight = 0; // No fall damage ever
        
        const isCarrying = monster.carryingChunkId !== null || monster.carryingResources > 0;
        
        if (isCarrying) {
          // STRUGGLING TO FLY WITH LOAD (but still no gravity!)
          // Just harder to fly up when carrying
          monster.position.vy *= 0.95; // Slight damping when loaded
          
          // Struggle to maintain altitude
          if (monster.position.vy > 30 || Math.random() < 0.1) {
            monster.position.vy = -80; // Weak flap
            monster.energy -= 4; // Double energy cost when carrying
          }
          
          // Poor air control when loaded
          monster.position.vx *= 0.9;
          monster.position.vy = Math.min(monster.position.vy, terminalVelocity * 0.7);
        } else {
          // TRUE FLYING - NO GRAVITY AT ALL!
          // Flying creatures move freely in any direction
          
          // Random flight pattern - up, down, sideways as they please
          if (Math.random() < 0.15) { // 15% chance to change direction
            // Fly in any direction
            monster.position.vy = (Math.random() - 0.5) * 400; // -200 to +200 vertical
            monster.position.vx = (Math.random() - 0.5) * 300; // -150 to +150 horizontal
          }
          
          // Tend to fly upward more often
          if (Math.random() < 0.2 && monster.position.vy > -100) {
            monster.position.vy = -200 - Math.random() * 200; // Fly UP freely
          }
          
          // PERFECT control - no air resistance
          monster.position.vx *= 1.0; // No slowdown
          monster.position.vy *= 0.98; // Tiny bit of vertical damping for control
          
          // NO LIMITS on altitude - fly to the sky!
          // monster.position.vy can be anything - no terminal velocity
        }
      } else {
        // NON-FLYING FALLING - HEAVY LEMMINGS PLUMMET!
        const fallTime = (monster as any).fallTime || 0;
        (monster as any).fallTime = fallTime + deltaTime;
        
        // SUPER HEAVY acceleration - instant drop like lemmings!
        const fallAcceleration = 1 + fallTime * 4; // DOUBLED acceleration!
        monster.position.vy += gravity * deltaTime * fallAcceleration;
        monster.position.vy = Math.min(monster.position.vy, terminalVelocity * 2); // Fall MUCH faster!
        
        // Almost NO air control - helpless plummet
        monster.position.vx *= 0.8; // Much less control!
        
        // Mark as falling for animation
        (monster as any).isFalling = true;
        (monster as any).fallHeight = (monster as any).fallHeight || 0;
        (monster as any).fallHeight += Math.abs(monster.position.vy * deltaTime);
      }
    }
    
    // Calculate new positions
    const newX = monster.position.x + monster.position.vx * deltaTime;
    const newY = monster.position.y + monster.position.vy * deltaTime;
    
    // Normal collision detection - DON'T ignore pyramid blocks (causes sinking)
    const collisionX = this.checkTileCollision(newX, monster.position.y);
    const collisionY = this.checkTileCollision(monster.position.x, newY);
    
    // Apply horizontal velocity with collision check
    if (!collisionX) {
      monster.position.x = newX;
    } else {
      // Hit a wall - try single-block jumping first!
      const jumpAttempted = this.tryJumpOverSingleBlock(monster, newX, monster.position.y);
      
      if (!jumpAttempted) {
        // Re-declare variables for jump logic
        const isCarrying = monster.carryingChunkId || monster.helpingCarryChunkId || monster.isClimbing;
        const nearPyramid = Math.abs(monster.position.x - pyramidCenter) < TILE_SIZE * 15;
        
        // Check if monster is stuck in a hole or needs to jump (especially when carrying!)
        const shouldAutoJump = this.isMonsterInHole(monster) || 
            (isCarrying && this.shouldJumpTowardsHive(monster)) ||
            (nearPyramid && monster.position.onGround) ||
            (monster.isClimbing && monster.position.onGround); // Jump when climbing after throwing resource
        
        if (monster.position.onGround && shouldAutoJump) {
          // Auto-jump to escape hole or climb towards hive when carrying
          // ULTRA STRONG jumps for pyramid!
          const jumpForce = monster.isClimbing ? -950 : // ULTRA jump when climbing without load
                           nearPyramid && isCarrying ? -900 : // SUPER strong for carrying up pyramid
                           nearPyramid ? -800 : // Strong pyramid jump
                           (isCarrying ? -650 : -600); // Stronger normal jumps
          monster.position.vy = jumpForce;
          
          // Direct toward hive center when near pyramid
          if (nearPyramid) {
            const hiveDir = this.colonyHive.x > monster.position.x ? 1 : -1;
            monster.position.vx = hiveDir * 200; // Very strong forward momentum
            console.log(`Monster ${monster.id} PYRAMID CLIMBING - powerful jump towards hive!`);
          } else {
            monster.position.vx = monster.position.vx > 0 ? 160 : -160; // Strong forward momentum
            console.log(`Monster ${monster.id} ${isCarrying ? 'CARRYING - jumping towards hive' : 'auto-jumping out of hole'}`);
          }
        } else {
          // Only mine if monster has EXPLICIT mining task from player pheromone
          // AND is actively trying to reach a mining target
          if (monster.currentTask && 
              monster.currentTask.type === MonsterAction.MINE_NEARBY && 
              monster.currentTask.userGenerated &&
              monster.miningTarget) {
            // Only mine horizontally when directed
            this.tryMineBlock(monster, newX, monster.position.y, 'horizontal');
          }
          monster.position.vx = 0;
        }
      }
    }
    
    if (!collisionY) {
      monster.position.y = newY;
    } else {
      // Hit floor/ceiling - NEVER mine downward unless explicitly directed
      if (monster.currentTask && 
          monster.currentTask.type === MonsterAction.MINE_NEARBY && 
          monster.currentTask.userGenerated &&
          monster.miningTarget &&
          monster.miningTarget.direction === 'down' &&
          newY > monster.position.y) { // Only if moving downward
        // Only mine down if explicitly directed to mine down
        this.tryMineBlock(monster, monster.position.x, newY, 'down');
      }
      monster.position.vy = 0;
    }
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
    const feetY = Math.floor((monster.position.y + 8) / TILE_SIZE); // Monster feet position
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
    // CAN CLIMB 2 BLOCKS!
    else if (wallHeight === 2 && (!blockAhead3 || blockAhead3.type === TileType.AIR)) {
      // 2-block climbing - ENHANCED
      const targetY = (feetY - 2) * TILE_SIZE; // Top of 2 blocks
      const currentY = monster.position.y;
      
      if (currentY > targetY - 8) {
        // Fast climbing for 2 blocks
        const climbSpeed = 3; // Faster for 2-block climb
        
        monster.position.y -= climbSpeed;
        monster.position.x += direction * 0.8; // Move forward while climbing
        monster.position.vy = -150; // Strong upward velocity
        monster.position.vx = direction * 40;
        monster.position.onGround = true;
        
        if (Math.random() < 0.15) {
          console.log(`Monster ${monster.id} climbing 2-block wall!`);
        }
      }
    }
    // CAN CLIMB 1 BLOCK (original pyramid climbing)
    else if (wallHeight === 1 && (!blockAhead2 || blockAhead2.type === TileType.AIR)) {
      // 1-block climbing - smooth as before
      const targetY = (feetY - 1) * TILE_SIZE;
      const currentY = monster.position.y;
      
      if (currentY > targetY - 8) {
        const distanceToTarget = currentY - (targetY - 8);
        const climbSpeed = Math.min(1.5, distanceToTarget * 0.15);
        
        monster.position.y -= climbSpeed;
        monster.position.x += direction * 0.5;
        monster.position.vy = -50 - (climbSpeed * 20);
        monster.position.vx = direction * 30;
        monster.position.onGround = true;
      }
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
    
    // Only check ground and energy if NOT carrying (carriers always jump)
    if (!isCarrying) {
      if (!monster.position.onGround || monster.energy < 10) {
        return false;
      }
    } else if (!monster.position.onGround) {
      return false; // Still need to be on ground even when carrying
    }

    const direction = targetX > monster.position.x ? 1 : -1;
    const monsterTileX = Math.floor(monster.position.x / TILE_SIZE);
    const monsterTileY = Math.floor(monster.position.y / TILE_SIZE);
    
    // Check multiple blocks ahead for better pathfinding
    const checkDistances = isCarrying ? [0.6, 1.0, 1.5] : [0.6]; // Check further when carrying
    
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
          if (aboveTileY >= 0) {
            const tileAbove = this.world[targetTileX][aboveTileY];
            if (!TILE_PROPERTIES[tileAbove.type].solid) {
              // Space above is clear - JUMP!
              if (isPyramidStep) {
                // VERY strong jump for pyramid climbing - must clear full blocks!
                monster.position.vy = -500; // Strong enough to clear full block height
                monster.position.vx = direction * 120; // Good forward momentum
                monster.energy -= 0.5; // Minimal energy cost for pyramid
                console.log(`Monster ${monster.id} PYRAMID STEP - powerful jump at (${targetTileX}, ${targetTileY})`);
              } else if (isCarrying) {
                // Strong jump when carrying resources
                monster.position.vy = -475; // Strong jump for carrying
                monster.position.vx = direction * 100; // Good momentum when carrying
                monster.energy -= 0; // Free energy when carrying to hive!
                console.log(`Monster ${monster.id} CARRYING - jumping at (${targetTileX}, ${targetTileY})`);
              } else {
                // Normal jump for regular obstacles
                monster.position.vy = -450; // Strong jump to clear blocks reliably
                monster.position.vx = direction * 70; // Normal forward momentum
                monster.energy -= 2; // Normal energy cost
                console.log(`Monster ${monster.id} jumping over block at (${targetTileX}, ${targetTileY})`);
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
      // Drop resources if tile had any
      if (tile.resources > 0) {
        this.resourceChunkManager.createChunksFromTile(
          tile.type,
          tileX,
          tileY,
          tile.resources
        );
      }
      
      // Turn tile into air
      tile.type = TileType.AIR;
      tile.integrity = 0;
      tile.resources = 0;
      tile.discovered = true;
      
      console.log(`Monster ${monster.id} mined through ${properties.spriteName} at (${tileX}, ${tileY})`);
      
      // Update monster's mining depth to track progress
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
    const canFly = monster.sprite && (monster.sprite as any).movementType === 'fly';
    if (canFly) {
      return false;
    }
    
    // COOLDOWN SYSTEM: Prevent spam attempts (5 second cooldown)
    if (monster.wallCrawlCooldown > 0) {
      return false; // Still on cooldown from last attempt
    }
    
    // Must have high energy to wall crawl - it's exhausting!
    if (monster.energy < 70) {
      return false; // Too tired to attempt dangerous wall crawling
    }
    
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
    this.populationText.setText(`Population: ${aliveMonsters.length}`);
    
    // Wave timer - proper countdown
    const waveInterval = 120000; // 2 minutes
    const timeSinceWave = Date.now() - this.lastWaveTime;
    const timeUntilWave = Math.max(0, waveInterval - timeSinceWave);
    const minutes = Math.floor(timeUntilWave / 60000);
    const seconds = Math.floor((timeUntilWave % 60000) / 1000);
    this.waveTimerText.setText(`Next Wave: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    
    // TODO: Update individual resource counters when resource system is working
    // Removed console.log spam that was crashing the game
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
    
    // No monster clicked - place pheromone
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    this.pheromoneSystem.addPheromone(tileX, tileY, this.selectedPheromone, 50);
    console.log(`Placed ${this.selectedPheromone} pheromone at tile (${tileX}, ${tileY})`);
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
        if (this.world[x][y].discovered || Math.random() < 0.01) {
          this.renderTile(x, y);
        }
      }
    }
  }

  private renderTile(x: number, y: number): void {
    const tile = this.world[x][y];
    const properties = TILE_PROPERTIES[tile.type];
    
    // Use Terraria-style tile renderer (handles fog of war internally)
    const tileContainer = this.tileRenderer.renderTile(x, y, tile, TILE_SIZE, this.world);
    if (tileContainer) {
      tileContainer.setScrollFactor(1);
      return; // Tile rendered successfully with edge system
    }
    
    // If tile wasn't rendered by Terraria renderer, it's either fog or empty
    if (!tile.discovered && tile.type !== TileType.AIR) {
      return; // Fog of war is handled by TerrariaTileRenderer
    }
    
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
