import Phaser from 'phaser';
import { TileType } from '../world/TileTypes';

export interface ResourceInventory {
  dirt: number;
  stone: number;
  rock: number;
  copper: number;
  iron: number;
  gold: number;
  crystal: number;
  total: number;
}

export class ResourceTracker {
  private scene: Phaser.Scene;
  private resources: ResourceInventory;
  
  // UI Elements - Clean RTS Style
  private hudBar!: Phaser.GameObjects.Graphics;
  private resourceTexts: Map<string, Phaser.GameObjects.Text>;
  private populationText!: Phaser.GameObjects.Text;
  private allUIElements: Phaser.GameObjects.GameObject[] = [];
  
  // Track population
  public population: number = 0;
  public maxPopulation: number = 200;
  
  // Track last camera state to avoid unnecessary redraws
  private lastCameraWidth: number = -1;
  private lastCameraHeight: number = -1;
  private lastCameraZoom: number = -1;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.resources = {
      dirt: 0,
      stone: 0,
      rock: 0,
      copper: 0,
      iron: 0,
      gold: 0,
      crystal: 0,
      total: 0
    };
    
    this.resourceTexts = new Map();
    console.log('ResourceTracker: Initializing RTS resource interface...');
    this.createModernRTSUI();
    console.log('ResourceTracker: RTS interface created successfully!');
    
    // Listen for window resize only
    this.scene.scale.on('resize', this.handleResize, this);
  }

  /**
   * Add resources based on tile type and value
   */
  addResources(tileType: TileType, amount: number): void {
    console.log(`ResourceTracker: Adding ${amount} resources of type ${tileType}`);
    if (amount <= 0) {
      console.log('ResourceTracker: Amount is 0 or negative, skipping...');
      return;
    }

    switch (tileType) {
      case TileType.DIRT:
        this.resources.dirt += amount;
        break;
      case TileType.STONE:
        this.resources.stone += amount;
        break;
      case TileType.ROCK:
        this.resources.rock += amount;
        break;
      case TileType.ORE_COPPER:
        this.resources.copper += amount;
        break;
      case TileType.ORE_IRON:
        this.resources.iron += amount;
        break;
      case TileType.ORE_GOLD:
        this.resources.gold += amount;
        break;
      case TileType.CRYSTAL:
        this.resources.crystal += amount;
        break;
    }
    
    this.resources.total += amount;
    this.updateResourceDisplay();
  }

  /**
   * Get current resource amounts
   */
  getResources(): ResourceInventory {
    return { ...this.resources };
  }

  /**
   * Create modern RTS-style HUD - sleek bottom bar FIXED to screen
   */
  private createModernRTSUI(): void {
    // Main HUD bar - FIXED to screen, doesn't scroll with camera
    this.hudBar = this.scene.add.graphics();
    this.hudBar.setScrollFactor(0); // FIXED to screen
    this.hudBar.setDepth(10000);
    this.allUIElements.push(this.hudBar);
    
    // Sleek Helvetica-style font configuration
    const fontStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px',
      color: '#FFFFFF',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontStyle: '300',  // Light weight for modern look
    };
    
    // Create resource displays
    const resources = [
      { key: 'dirt', icon: '🪨' },
      { key: 'stone', icon: '🪨' },
      { key: 'copper', icon: '🪙' },
      { key: 'iron', icon: '⛓️' },
      { key: 'gold', icon: '🪙' },
      { key: 'crystal', icon: '💎' }
    ];
    
    resources.forEach(resource => {
      const text = this.scene.add.text(0, 0, `${resource.icon} 0`, fontStyle);
      text.setScrollFactor(0); // FIXED to screen
      text.setDepth(10001);
      this.allUIElements.push(text);
      this.resourceTexts.set(resource.key, text);
    });
    
    // Population display
    this.populationText = this.scene.add.text(0, 0, '👥 0/200', fontStyle);
    this.populationText.setScrollFactor(0); // FIXED to screen
    this.populationText.setDepth(10001);
    this.allUIElements.push(this.populationText);
    
    // Initial draw
    this.drawModernHUD();
    this.positionModernUI();
  }

  /**
   * Draw modern, sleek HUD bar - FIXED to bottom of SCREEN
   */
  private drawModernHUD(): void {
    const camera = this.scene.cameras.main;
    const screenWidth = camera.width;
    const screenHeight = camera.height;
    
    // HUD bar dimensions (fixed size)
    const barHeight = 40;
    // Position in SCREEN SPACE (setScrollFactor(0) already makes this screen-relative)
    const barX = 0;
    const barY = screenHeight - barHeight;
    
    console.log(`🎨 HUD DEBUG: screenW=${screenWidth}, screenH=${screenHeight}, barY=${barY}, zoom=${camera.zoom.toFixed(2)}`);
    
    this.hudBar.clear();
    
    // BRIGHT RED for debugging
    this.hudBar.fillStyle(0xFF0000, 0.9);
    this.hudBar.fillRect(barX, barY, screenWidth, barHeight);
    
    // Bright GREEN border
    this.hudBar.lineStyle(4, 0x00FF00, 1.0);
    this.hudBar.lineBetween(barX, barY, barX + screenWidth, barY);
  }

  /**
   * Position modern UI elements - FIXED to SCREEN
   */
  private positionModernUI(): void {
    const camera = this.scene.cameras.main;
    const screenWidth = camera.width;
    const screenHeight = camera.height;
    const cameraZoom = camera.zoom;
    
    // HUD bar dimensions (fixed size)
    const barHeight = 40;
    const barY = screenHeight - barHeight;
    const centerY = barY + barHeight / 2;
    
    // Scale font size inversely to zoom so it appears constant size
    const scaleFactor = Phaser.Math.Clamp(1 / cameraZoom, 0.5, 2.0);
    const fontSize = Math.round(16 * scaleFactor);
    
    const fontStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${fontSize}px`,
      color: '#FFFFFF',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontStyle: '300',
    };
    
    // Position resource icons from left (in SCREEN SPACE)
    let currentX = 20;
    const spacing = 100;
    
    const resources = ['dirt', 'stone', 'copper', 'iron', 'gold', 'crystal'];
    resources.forEach(key => {
      const text = this.resourceTexts.get(key);
      if (text) {
        text.setPosition(currentX, centerY);
        currentX += spacing;
        text.setStyle(fontStyle);
        text.setOrigin(0, 0.5);
      }
    });
    
    // Population on the right side of screen (in SCREEN SPACE)
    const popX = screenWidth - 150;
    this.populationText.setStyle(fontStyle);
    this.populationText.setPosition(popX, centerY);
    this.populationText.setOrigin(0, 0.5);
  }

  private handleResize(): void {
    // Redraw the HUD bar
    this.drawModernHUD();
    
    // Reposition all UI elements
    this.positionModernUI();
  }
  
  /**
   * Update HUD position EVERY FRAME - sticks to camera no matter what
   */
  update(): void {
    // ALWAYS redraw and reposition - stick to camera viewport!
    this.drawModernHUD();
    this.positionModernUI();
  }

  /**
   * Update the resource display with current values
   */
  private updateResourceDisplay(): void {
    // Update with emoji icons for clean look
    this.resourceTexts.get('dirt')?.setText(`🪨 ${this.resources.dirt}`);
    this.resourceTexts.get('stone')?.setText(`🪨 ${this.resources.stone}`);
    this.resourceTexts.get('copper')?.setText(`🪙 ${this.resources.copper}`);
    this.resourceTexts.get('iron')?.setText(`⛓️ ${this.resources.iron}`);
    this.resourceTexts.get('gold')?.setText(`🪙 ${this.resources.gold}`);
    this.resourceTexts.get('crystal')?.setText(`💎 ${this.resources.crystal}`);
    
    // Update population
    this.populationText?.setText(`👥 ${this.population}/${this.maxPopulation}`);
  }

  /**
   * Update population display
   */
  updatePopulation(current: number, max?: number): void {
    this.population = current;
    if (max !== undefined) {
      this.maxPopulation = max;
    }
    this.updateResourceDisplay();
  }

  /**
   * Show resource gain notification (Age of Empires style)
   */
  showResourceGain(tileType: TileType, amount: number, x: number, y: number): void {
    const resourceNames: Record<TileType, string> = {
      [TileType.AIR]: 'Air',
      [TileType.DIRT]: 'Dirt',
      [TileType.STONE]: 'Stone', 
      [TileType.ROCK]: 'Rock',
      [TileType.ORE_COPPER]: 'Copper',
      [TileType.ORE_IRON]: 'Iron',
      [TileType.ORE_GOLD]: 'Gold',
      [TileType.CRYSTAL]: 'Crystal',
      [TileType.WATER]: 'Water',
      [TileType.LAVA]: 'Lava',
      [TileType.BEDROCK]: 'Bedrock'
    };

    const resourceColors: Record<TileType, string> = {
      [TileType.AIR]: '#FFFFFF',
      [TileType.DIRT]: '#8B4513',
      [TileType.STONE]: '#708090', 
      [TileType.ROCK]: '#2F4F4F',
      [TileType.ORE_COPPER]: '#B87333',
      [TileType.ORE_IRON]: '#464451',
      [TileType.ORE_GOLD]: '#FFD700',
      [TileType.CRYSTAL]: '#FF69B4',
      [TileType.WATER]: '#4169E1',
      [TileType.LAVA]: '#FF4500',
      [TileType.BEDROCK]: '#000000'
    };

    const resourceName = resourceNames[tileType] || 'Resources';
    const resourceColor = resourceColors[tileType] || '#FFFFFF';

    // Create floating notification
    const notification = this.scene.add.text(x, y, `+${amount} ${resourceName}`, {
      fontSize: '16px',
      color: resourceColor,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    
    notification.setOrigin(0.5);
    notification.setDepth(2000);

    // Animate notification floating up and fading
    this.scene.tweens.add({
      targets: notification,
      y: y - 50,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        notification.destroy();
      }
    });

    // Add screen edge notification for off-screen deposits
    this.showScreenEdgeNotification(resourceName, amount, resourceColor);
  }

  /**
   * Show notification at screen edge (Age of Empires style)
   */
  private showScreenEdgeNotification(resourceName: string, amount: number, color: string): void {
    const edgeNotification = this.scene.add.text(400, 100, `+${amount} ${resourceName}`, {
      fontSize: '18px',
      color: color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    
    edgeNotification.setOrigin(0.5);
    edgeNotification.setScrollFactor(0);
    edgeNotification.setDepth(2000);
    edgeNotification.setAlpha(0);

    // Quick fade in and out
    this.scene.tweens.add({
      targets: edgeNotification,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.scene.tweens.add({
          targets: edgeNotification,
          alpha: 0,
          duration: 1500,
          delay: 1000,
          ease: 'Power2',
          onComplete: () => {
            edgeNotification.destroy();
          }
        });
      }
    });
  }

  /**
   * Cleanup when scene is destroyed
   */
  destroy(): void {
    // Remove event listeners
    this.scene.scale.off('resize', this.handleResize, this);
    
    // Destroy all UI elements
    this.allUIElements.forEach(element => element.destroy());
    this.resourceTexts.clear();
  }
}
