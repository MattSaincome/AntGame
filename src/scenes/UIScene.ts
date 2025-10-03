import Phaser from 'phaser';
import { PheromoneType } from '../systems/PheromoneSystem';

/**
 * UIScene - Separate scene for HUD that's immune to camera zoom/scroll
 * StarCraft 2 inspired design with Helvetica font
 * Runs in parallel with GameScene
 */
export class UIScene extends Phaser.Scene {
  // HUD Elements
  private hudBar!: Phaser.GameObjects.Rectangle;
  private hudBorder!: Phaser.GameObjects.Rectangle;
  
  // Resource displays
  private dirtText!: Phaser.GameObjects.Text;
  private stoneText!: Phaser.GameObjects.Text;
  private copperText!: Phaser.GameObjects.Text;
  private ironText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private crystalText!: Phaser.GameObjects.Text;
  
  // Info displays
  private populationText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private waveTimerText!: Phaser.GameObjects.Text;
  
  // Pheromone control
  private pheromoneMenuOpen: boolean = false;
  private pheromoneButton!: Phaser.GameObjects.Rectangle;
  private pheromoneButtonText!: Phaser.GameObjects.Text;
  private pheromoneOptions: Phaser.GameObjects.Container[] = [];
  private selectedPheromone: PheromoneType | 'ERASER' | 'CLEAR_ALL' = PheromoneType.MINE_HERE;
  
  // Build control
  private buildMenuOpen: boolean = false;
  private buildButton!: Phaser.GameObjects.Rectangle;
  private buildButtonText!: Phaser.GameObjects.Text;
  private buildOptions: Phaser.GameObjects.Container[] = [];
  private selectedBuildItem: string | null = null;
  
  // StarCraft 2 style colors
  private readonly SC2_DARK_BG = 0x0a0e14;
  private readonly SC2_PANEL = 0x1a1f2e;
  private readonly SC2_CYAN = 0x00d9ff;
  private readonly SC2_GREEN = 0x00ff88;
  private readonly SC2_GOLD = 0xffcc00;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    
    // Create dark HUD bar - bottom 1/8th of screen
    const barHeight = screenHeight / 8;  // 100px for 800px screen
    const barY = screenHeight - (barHeight / 2);
    
    // Main HUD panel (dark background)
    this.hudBar = this.add.rectangle(
      screenWidth / 2,
      barY,
      screenWidth,
      barHeight,
      this.SC2_DARK_BG,
      0.95
    );
    this.hudBar.setOrigin(0.5, 0.5);
    
    // Top border (cyan accent)
    this.hudBorder = this.add.rectangle(
      screenWidth / 2,
      barY - (barHeight / 2),
      screenWidth,
      2,
      this.SC2_CYAN,
      1.0
    );
    this.hudBorder.setOrigin(0.5, 0.5);
    
    // Corner accents (SC2 style)
    const cornerSize = 20;
    const cornerThickness = 3;
    const cornerY = barY - (barHeight / 2);
    
    // Top-left corner
    const tl1 = this.add.rectangle(cornerSize / 2, cornerY, cornerSize, cornerThickness, this.SC2_CYAN, 1);
    const tl2 = this.add.rectangle(0, cornerY + cornerSize / 2, cornerThickness, cornerSize, this.SC2_CYAN, 1);
    
    // Top-right corner
    const tr1 = this.add.rectangle(screenWidth - cornerSize / 2, cornerY, cornerSize, cornerThickness, this.SC2_CYAN, 1);
    const tr2 = this.add.rectangle(screenWidth, cornerY + cornerSize / 2, cornerThickness, cornerSize, this.SC2_CYAN, 1);
    
    // Font style - Helvetica Neue (SC2 style) - Compact but readable
    const fontStyle = {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    };
    
    const labelStyle = {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '11px',
      color: '#6b8299',
      fontStyle: '300'  // Light weight
    };
    
    // Calculate positions - MORE COMPACT
    const hudTop = barY - (barHeight / 2) + 8;
    const hudBottom = barY + (barHeight / 2) - 15;
    const leftStart = 15;
    const spacing = 70;  // Much tighter spacing for resources
    
    // LEFT SIDE - Resources
    let currentX = leftStart;
    
    // Dirt (brown/earth) with icon
    const dirtIcon = this.add.rectangle(currentX, hudTop + 18, 8, 8, 0x8B7355, 1);
    this.add.text(currentX + 12, hudTop, 'DIRT', labelStyle);
    this.dirtText = this.add.text(currentX + 12, hudTop + 13, '0', {
      ...fontStyle,
      color: '#8B7355'
    });
    currentX += spacing;
    
    // Stone (gray) with icon
    const stoneIcon = this.add.rectangle(currentX, hudTop + 18, 8, 8, 0x9EA5B0, 1);
    this.add.text(currentX + 12, hudTop, 'STONE', labelStyle);
    this.stoneText = this.add.text(currentX + 12, hudTop + 13, '0', {
      ...fontStyle,
      color: '#9EA5B0'
    });
    currentX += spacing;
    
    // Copper (copper/orange) with icon
    const copperIcon = this.add.rectangle(currentX, hudTop + 18, 8, 8, 0xCD7F32, 1);
    this.add.text(currentX + 12, hudTop, 'COPPER', labelStyle);
    this.copperText = this.add.text(currentX + 12, hudTop + 13, '0', {
      ...fontStyle,
      color: '#CD7F32'
    });
    currentX += spacing;
    
    // Iron (metallic) with icon
    const ironIcon = this.add.rectangle(currentX, hudTop + 18, 8, 8, 0xC0C0C0, 1);
    this.add.text(currentX + 12, hudTop, 'IRON', labelStyle);
    this.ironText = this.add.text(currentX + 12, hudTop + 13, '0', {
      ...fontStyle,
      color: '#C0C0C0'
    });
    currentX += spacing;
    
    // Gold (golden) with icon
    const goldIcon = this.add.rectangle(currentX, hudTop + 18, 8, 8, 0xFFD700, 1);
    this.add.text(currentX + 12, hudTop, 'GOLD', labelStyle);
    this.goldText = this.add.text(currentX + 12, hudTop + 13, '0', {
      ...fontStyle,
      color: '#FFD700'
    });
    currentX += spacing;
    
    // Crystal (cyan/blue) with icon - diamond shape
    const crystalIcon = this.add.rectangle(currentX, hudTop + 18, 8, 8, 0x00D9FF, 1);
    crystalIcon.setRotation(Math.PI / 4); // Rotate 45 degrees for diamond
    this.add.text(currentX + 12, hudTop, 'CRYSTAL', labelStyle);
    this.crystalText = this.add.text(currentX + 12, hudTop + 13, '0', {
      ...fontStyle,
      color: '#00D9FF'
    });
    
    // Add separators for visual organization
    const separatorX1 = currentX + 50;
    this.add.rectangle(separatorX1, barY, 2, barHeight - 10, 0x2a3544, 0.6);
    
    // PHEROMONE CONTROL BUTTON
    const pheromoneX = separatorX1 + 30;
    this.createPheromoneControl(pheromoneX, hudTop, barY, barHeight);
    
    // Separator after pheromone
    this.add.rectangle(pheromoneX + 120, barY, 2, barHeight - 10, 0x2a3544, 0.6);
    
    // BUILD CONTROL BUTTON
    const buildX = pheromoneX + 150;
    this.createBuildControl(buildX, hudTop, barY, barHeight);
    
    // Separator after build
    this.add.rectangle(buildX + 120, barY, 2, barHeight - 10, 0x2a3544, 0.6);
    
    // RIGHT SIDE - Info (repositioned for clarity)
    const rightX = screenWidth - 450;
    
    // Population with icon
    const popIcon = this.add.circle(rightX, hudTop + 18, 5, 0x00FF88, 1);
    this.add.text(rightX + 12, hudTop, 'POPULATION', labelStyle);
    this.populationText = this.add.text(rightX + 12, hudTop + 13, '0 / 200', {
      ...fontStyle,
      fontSize: '16px',
      color: '#00FF88'
    });
    
    // Vertical separator
    this.add.rectangle(rightX + 130, barY, 2, barHeight - 10, 0x2a3544, 0.6);
    
    // Speed control section
    const speedControlX = rightX + 150;
    const speedControlY = hudTop + 30;
    
    this.add.text(speedControlX, hudTop, 'SPEED', labelStyle);
    this.speedText = this.add.text(speedControlX + 55, hudTop, '1.5x', {
      ...fontStyle,
      fontSize: '16px',
      color: '#FFCC00'
    });
    
    // Speed control buttons (SC2 style) - below speed text
    const buttonY = speedControlY;
    const buttonSize = 20;
    const buttonSpacing = 25;
    let btnX = speedControlX;
    
    // Pause button
    const pauseBtn = this.add.rectangle(btnX, buttonY, buttonSize, buttonSize, 0x2a3544, 0.9);
    pauseBtn.setStrokeStyle(1, 0x00d9ff);
    pauseBtn.setInteractive({ useHandCursor: true });
    const pauseText = this.add.text(btnX, buttonY, '||', {
      fontSize: '12px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    pauseBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      gameScene?.events.emit('setSpeed', 0);
    });
    pauseBtn.on('pointerover', () => pauseBtn.setFillStyle(0x3a4554));
    pauseBtn.on('pointerout', () => pauseBtn.setFillStyle(0x2a3544));
    btnX += buttonSpacing;
    
    // 1x button
    const normalBtn = this.add.rectangle(btnX, buttonY, buttonSize, buttonSize, 0x2a3544, 0.9);
    normalBtn.setStrokeStyle(1, 0x00ff88);
    normalBtn.setInteractive({ useHandCursor: true });
    const normalText = this.add.text(btnX, buttonY, '1x', {
      fontSize: '11px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    normalBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      gameScene?.events.emit('setSpeed', 1);
    });
    normalBtn.on('pointerover', () => normalBtn.setFillStyle(0x3a4554));
    normalBtn.on('pointerout', () => normalBtn.setFillStyle(0x2a3544));
    btnX += buttonSpacing;
    
    // 2x button
    const fastBtn = this.add.rectangle(btnX, buttonY, buttonSize, buttonSize, 0x2a3544, 0.9);
    fastBtn.setStrokeStyle(1, 0xffcc00);
    fastBtn.setInteractive({ useHandCursor: true });
    const fastText = this.add.text(btnX, buttonY, '2x', {
      fontSize: '11px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    fastBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      gameScene?.events.emit('setSpeed', 2);
    });
    fastBtn.on('pointerover', () => fastBtn.setFillStyle(0x3a4554));
    fastBtn.on('pointerout', () => fastBtn.setFillStyle(0x2a3544));
    btnX += buttonSpacing;
    
    // 3x button
    const fasterBtn = this.add.rectangle(btnX, buttonY, buttonSize, buttonSize, 0x2a3544, 0.9);
    fasterBtn.setStrokeStyle(1, 0xff9900);
    fasterBtn.setInteractive({ useHandCursor: true });
    const fasterText = this.add.text(btnX, buttonY, '3x', {
      fontSize: '11px',
      color: '#ff9900',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    fasterBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      gameScene?.events.emit('setSpeed', 3);
    });
    fasterBtn.on('pointerover', () => fasterBtn.setFillStyle(0x3a4554));
    fasterBtn.on('pointerout', () => fasterBtn.setFillStyle(0x2a3544));
    
    // Separator before wave timer
    this.add.rectangle(screenWidth - 150, barY, 2, barHeight - 10, 0x2a3544, 0.6);
    
    // Wave timer (far right) with alarm icon
    const waveX = screenWidth - 135;
    const alarmIcon = this.add.circle(waveX, hudTop + 18, 5, 0xFF4466, 1);
    this.add.text(waveX + 12, hudTop, 'NEXT WAVE', labelStyle);
    this.waveTimerText = this.add.text(waveX + 12, hudTop + 13, '2:00', {
      ...fontStyle,
      fontSize: '16px',
      color: '#FF4466'
    });
    
    // Listen for updates from GameScene
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.on('updateResources', this.updateResources, this);
      gameScene.events.on('updatePopulation', this.updatePopulation, this);
      gameScene.events.on('updateSpeed', this.updateSpeed, this);
      gameScene.events.on('updateWaveTimer', this.updateWaveTimer, this);
    }
  }

  private createPheromoneControl(x: number, hudTop: number, barY: number, barHeight: number): void {
    const labelStyle = {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '11px',
      color: '#6b8299',
      fontStyle: '300'
    };
    
    // Pheromone label
    this.add.text(x, hudTop, 'PHEROMONE', labelStyle);
    
    // Main pheromone button
    this.pheromoneButton = this.add.rectangle(x + 50, hudTop + 25, 80, 30, 0x2a3544, 0.9);
    this.pheromoneButton.setStrokeStyle(2, this.SC2_CYAN);
    this.pheromoneButton.setInteractive({ useHandCursor: true });
    
    this.pheromoneButtonText = this.add.text(x + 50, hudTop + 25, '⛏', {
      fontSize: '18px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Button click handler - toggle menu
    this.pheromoneButton.on('pointerdown', () => {
      this.pheromoneMenuOpen = !this.pheromoneMenuOpen;
      this.updatePheromoneMenu(x, hudTop, barY);
    });
    
    this.pheromoneButton.on('pointerover', () => this.pheromoneButton.setFillStyle(0x3a4554));
    this.pheromoneButton.on('pointerout', () => this.pheromoneButton.setFillStyle(0x2a3544));
  }
  
  private updatePheromoneMenu(x: number, hudTop: number, barY: number): void {
    // Clear existing options
    this.pheromoneOptions.forEach(opt => opt.destroy());
    this.pheromoneOptions = [];
    
    if (!this.pheromoneMenuOpen) return;
    
    // Create dropdown menu with options
    const options = [
      { type: PheromoneType.MINE_HERE, label: 'Mine Here', icon: '⛏', color: 0x00ff88 },
      { type: PheromoneType.DO_NOT_MINE, label: 'Don\'t Mine', icon: '🚫', color: 0xff4444 },
      { type: PheromoneType.ATTACK_DEFEND, label: 'Attack/Defend', icon: '⚔️', color: 0xff9900 },
      { type: 'ERASER' as any, label: 'Erase One', icon: '🧹', color: 0xffcc00 },
      { type: 'CLEAR_ALL' as any, label: 'Clear All', icon: '💥', color: 0xff0000 }
    ];
    
    options.forEach((opt, index) => {
      const container = this.add.container(0, 0);
      const optY = barY - (options.length - index) * 40 - 10;
      
      // Option background
      const bg = this.add.rectangle(x + 50, optY, 100, 35, 0x1a1f2e, 0.95);
      bg.setStrokeStyle(1, opt.color);
      bg.setInteractive({ useHandCursor: true });
      
      // Option icon
      const icon = this.add.text(x + 15, optY, opt.icon, {
        fontSize: '16px',
        color: `#${opt.color.toString(16).padStart(6, '0')}`
      }).setOrigin(0.5);
      
      // Option label
      const label = this.add.text(x + 45, optY, opt.label, {
        fontSize: '11px',
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
      }).setOrigin(0, 0.5);
      
      // Click handler
      bg.on('pointerdown', () => {
        this.selectedPheromone = opt.type;
        this.pheromoneButtonText.setText(opt.icon);
        this.pheromoneMenuOpen = false;
        this.updatePheromoneMenu(x, hudTop, barY);
        
        // Emit to GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene?.events.emit('pheromoneSelected', this.selectedPheromone);
      });
      
      bg.on('pointerover', () => bg.setFillStyle(0x2a3544));
      bg.on('pointerout', () => bg.setFillStyle(0x1a1f2e));
      
      container.add([bg, icon, label]);
      this.pheromoneOptions.push(container);
    });
  }
  
  private createBuildControl(x: number, hudTop: number, barY: number, barHeight: number): void {
    const labelStyle = {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '11px',
      color: '#6b8299',
      fontStyle: '300'
    };
    
    // Build label
    this.add.text(x, hudTop, 'BUILD', labelStyle);
    
    // Main build button
    this.buildButton = this.add.rectangle(x + 50, hudTop + 25, 80, 30, 0x2a3544, 0.9);
    this.buildButton.setStrokeStyle(2, this.SC2_GOLD);
    this.buildButton.setInteractive({ useHandCursor: true });
    
    this.buildButtonText = this.add.text(x + 50, hudTop + 25, '🏗️', {
      fontSize: '18px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Button click handler - toggle menu
    this.buildButton.on('pointerdown', () => {
      this.buildMenuOpen = !this.buildMenuOpen;
      this.updateBuildMenu(x, hudTop, barY);
    });
    
    this.buildButton.on('pointerover', () => this.buildButton.setFillStyle(0x3a4554));
    this.buildButton.on('pointerout', () => this.buildButton.setFillStyle(0x2a3544));
  }
  
  private updateBuildMenu(x: number, hudTop: number, barY: number): void {
    // Clear existing options
    this.buildOptions.forEach(opt => opt.destroy());
    this.buildOptions = [];
    
    if (!this.buildMenuOpen) return;
    
    // Create grid-based build menu (RTS style)
    const buildItems = [
      { id: 'RAMP_UP_RIGHT', label: 'Ramp /', icon: '/', color: 0x9B6B3F, cost: { dirt: 2 } },
      { id: 'RAMP_UP_LEFT', label: 'Ramp \\', icon: '\\', color: 0x9B6B3F, cost: { dirt: 2 } }
    ];
    
    // Grid layout - 2 columns
    const gridCols = 2;
    const gridItemSize = 50;
    const gridSpacing = 5;
    const gridStartX = x - 20;
    const gridStartY = barY - 120;
    
    buildItems.forEach((item, index) => {
      const container = this.add.container(0, 0);
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      const itemX = gridStartX + col * (gridItemSize + gridSpacing);
      const itemY = gridStartY + row * (gridItemSize + gridSpacing);
      
      // Item background
      const bg = this.add.rectangle(itemX, itemY, gridItemSize, gridItemSize, 0x1a1f2e, 0.95);
      bg.setStrokeStyle(2, item.color);
      bg.setInteractive({ useHandCursor: true });
      
      // Item icon
      const icon = this.add.text(itemX, itemY - 8, item.icon, {
        fontSize: '24px',
        color: `#${item.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Item label
      const label = this.add.text(itemX, itemY + 15, item.label, {
        fontSize: '9px',
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
      }).setOrigin(0.5);
      
      // Cost display
      const costText = `${item.cost.dirt}🪨`;
      const cost = this.add.text(itemX, itemY + 8, costText, {
        fontSize: '10px',
        color: '#8B7355',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
      }).setOrigin(0.5);
      
      // Click handler
      bg.on('pointerdown', () => {
        this.selectedBuildItem = item.id;
        this.buildButtonText.setText(item.icon);
        this.buildMenuOpen = false;
        this.updateBuildMenu(x, hudTop, barY);
        
        // Emit to GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene?.events.emit('buildItemSelected', this.selectedBuildItem);
      });
      
      bg.on('pointerover', () => {
        bg.setFillStyle(0x2a3544);
        bg.setStrokeStyle(3, item.color);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x1a1f2e);
        bg.setStrokeStyle(2, item.color);
      });
      
      container.add([bg, icon, label, cost]);
      this.buildOptions.push(container);
    });
  }

  private updateResources(resources: any): void {
    this.dirtText.setText(resources.dirt.toString());
    this.stoneText.setText(resources.stone.toString());
    this.copperText.setText(resources.copper.toString());
    this.ironText.setText(resources.iron.toString());
    this.goldText.setText(resources.gold.toString());
    this.crystalText.setText(resources.crystal.toString());
  }

  private updatePopulation(current: number, max: number): void {
    this.populationText.setText(`${current} / ${max}`);
  }

  private updateSpeed(speed: number): void {
    this.speedText.setText(`Speed: ${speed.toFixed(1)}x`);
  }

  private updateWaveTimer(timeText: string): void {
    this.waveTimerText.setText(timeText);
  }

  update(): void {
    // UI updates here if needed
  }
}
