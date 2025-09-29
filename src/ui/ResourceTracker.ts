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
  
  // UI Elements
  private resourcePanel!: Phaser.GameObjects.Graphics;
  private resourceIcons: Map<string, Phaser.GameObjects.Graphics>;
  private resourceTexts: Map<string, Phaser.GameObjects.Text>;
  private resourceLabels: Map<string, Phaser.GameObjects.Text>;
  private totalBg!: Phaser.GameObjects.Graphics;
  private totalLabel!: Phaser.GameObjects.Text;
  private allUIElements: Phaser.GameObjects.GameObject[] = [];
  
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
    
    this.resourceIcons = new Map();
    this.resourceTexts = new Map();
    this.resourceLabels = new Map();
    console.log('ResourceTracker: Initializing RTS resource interface...');
    this.createResourceUI();
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
   * Create Age of Empires 2-style resource UI
   */
  private createResourceUI(): void {
    // Main resource panel background
    this.resourcePanel = this.scene.add.graphics();
    this.resourcePanel.setScrollFactor(0); // Keep UI fixed on screen
    this.resourcePanel.setDepth(2000); // Higher depth to ensure visibility
    this.allUIElements.push(this.resourcePanel);
    
    // Draw initial panel
    this.drawResourcePanel();

    // Create resource type displays
    const resourceTypes = [
      { key: 'dirt', name: 'Dirt', color: 0x8B4513, x: 30 },
      { key: 'stone', name: 'Stone', color: 0x708090, x: 110 },
      { key: 'rock', name: 'Rock', color: 0x2F4F4F, x: 190 },
      { key: 'copper', name: 'Copper', color: 0xB87333, x: 270 },
      { key: 'iron', name: 'Iron', color: 0x464451, x: 350 },
      { key: 'gold', name: 'Gold', color: 0xFFD700, x: 430 },
      { key: 'crystal', name: 'Crystal', color: 0xFF69B4, x: 510 }
    ];

    resourceTypes.forEach(resource => {
      // Create resource icon
      const icon = this.scene.add.graphics();
      icon.setScrollFactor(0);
      icon.setDepth(2001);
      this.allUIElements.push(icon);
      
      // Store icon for later drawing
      this.resourceIcons.set(resource.key, icon);

      // Create resource text
      const text = this.scene.add.text(0, 0, '0', {
        fontSize: '14px',
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      });
      text.setOrigin(0.5);
      text.setScrollFactor(0);
      text.setDepth(2001);
      this.allUIElements.push(text);
      
      this.resourceTexts.set(resource.key, text);

      // Resource type label
      const label = this.scene.add.text(0, 0, resource.name.charAt(0).toUpperCase(), {
        fontSize: '12px',
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      });
      label.setOrigin(0.5);
      label.setScrollFactor(0);
      label.setDepth(2002);
      this.allUIElements.push(label);
      
      this.resourceLabels.set(resource.key, label);
    });

    // Total resources display
    this.totalBg = this.scene.add.graphics();
    this.totalBg.setScrollFactor(0);
    this.totalBg.setDepth(2001);
    this.allUIElements.push(this.totalBg);

    this.totalLabel = this.scene.add.text(0, 0, 'TOTAL', {
      fontSize: '12px',
      color: '#FFD700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.totalLabel.setOrigin(0.5);
    this.totalLabel.setScrollFactor(0);
    this.totalLabel.setDepth(2002);
    this.allUIElements.push(this.totalLabel);

    const totalText = this.scene.add.text(0, 0, '0', {
      fontSize: '16px',
      color: '#FFD700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    totalText.setOrigin(0.5);
    totalText.setScrollFactor(0);
    totalText.setDepth(2002);
    this.allUIElements.push(totalText);
    
    this.resourceTexts.set('total', totalText);
    
    // Position everything initially
    this.positionUIElements();
  }

  private drawResourcePanel(): void {
    const screenHeight = this.scene.scale.height;
    const hudHeight = Math.floor(screenHeight / 8);
    const panelY = screenHeight - hudHeight + 10;
    const panelWidth = 600;
    const panelHeight = 50;
    
    // Clear and redraw panel
    this.resourcePanel.clear();
    this.resourcePanel.fillStyle(0x2C1810, 0.95); // Dark brown
    this.resourcePanel.fillRoundedRect(10, panelY, panelWidth, panelHeight, 8);
    
    // Panel border
    this.resourcePanel.lineStyle(2, 0x8B4513, 1);
    this.resourcePanel.strokeRoundedRect(10, panelY, panelWidth, panelHeight, 8);
    
    // Draw resource icons
    const resourceTypes = [
      { key: 'dirt', color: 0x8B4513, x: 30 },
      { key: 'stone', color: 0x708090, x: 110 },
      { key: 'rock', color: 0x2F4F4F, x: 190 },
      { key: 'copper', color: 0xB87333, x: 270 },
      { key: 'iron', color: 0x464451, x: 350 },
      { key: 'gold', color: 0xFFD700, x: 430 },
      { key: 'crystal', color: 0xFF69B4, x: 510 }
    ];
    
    resourceTypes.forEach(resource => {
      const icon = this.resourceIcons.get(resource.key);
      if (icon) {
        const iconY = panelY + 25;
        icon.clear();
        // Icon background
        icon.fillStyle(0x000000, 0.5);
        icon.fillCircle(resource.x, iconY, 18);
        // Icon color
        icon.fillStyle(resource.color, 0.9);
        icon.fillCircle(resource.x, iconY, 15);
        // Icon inner detail
        icon.fillStyle(resource.color, 0.7);
        icon.fillCircle(resource.x, iconY, 10);
      }
    });
    
    // Draw total background
    if (this.totalBg) {
      this.totalBg.clear();
      this.totalBg.fillStyle(0x1A1A1A, 0.8);
      this.totalBg.fillRoundedRect(620, panelY, 100, panelHeight, 4);
      this.totalBg.lineStyle(2, 0xFFD700, 1);
      this.totalBg.strokeRoundedRect(620, panelY, 100, panelHeight, 4);
    }
  }

  private positionUIElements(): void {
    const screenHeight = this.scene.scale.height;
    const hudHeight = Math.floor(screenHeight / 8);
    const panelY = screenHeight - hudHeight + 10;
    
    // Position resource texts and labels
    const resourceTypes = [
      { key: 'dirt', x: 30 },
      { key: 'stone', x: 110 },
      { key: 'rock', x: 190 },
      { key: 'copper', x: 270 },
      { key: 'iron', x: 350 },
      { key: 'gold', x: 430 },
      { key: 'crystal', x: 510 }
    ];
    
    resourceTypes.forEach(resource => {
      const text = this.resourceTexts.get(resource.key);
      const label = this.resourceLabels.get(resource.key);
      
      if (text) {
        text.setPosition(resource.x, panelY + 40);
      }
      if (label) {
        label.setPosition(resource.x, panelY + 13);
      }
    });
    
    // Position total elements
    const totalText = this.resourceTexts.get('total');
    if (totalText) {
      totalText.setPosition(670, panelY + 40);
    }
    if (this.totalLabel) {
      this.totalLabel.setPosition(670, panelY + 15);
    }
  }

  private handleResize(): void {
    // Redraw the panel at new position
    this.drawResourcePanel();
    
    // Reposition all UI elements
    this.positionUIElements();
  }

  /**
   * Update the resource display with current values
   */
  private updateResourceDisplay(): void {
    // Update individual resource counters
    this.resourceTexts.get('dirt')?.setText(this.resources.dirt.toString());
    this.resourceTexts.get('stone')?.setText(this.resources.stone.toString());
    this.resourceTexts.get('rock')?.setText(this.resources.rock.toString());
    this.resourceTexts.get('copper')?.setText(this.resources.copper.toString());
    this.resourceTexts.get('iron')?.setText(this.resources.iron.toString());
    this.resourceTexts.get('gold')?.setText(this.resources.gold.toString());
    this.resourceTexts.get('crystal')?.setText(this.resources.crystal.toString());
    this.resourceTexts.get('total')?.setText(this.resources.total.toString());

    // Add pulsing effect to icons when resources increase
    this.pulseUpdatedResources();
  }

  /**
   * Create pulsing effect on resource icons when they're updated
   */
  private pulseUpdatedResources(): void {
    const resourceKeys = ['dirt', 'stone', 'rock', 'copper', 'iron', 'gold', 'crystal'];
    
    resourceKeys.forEach(key => {
      const icon = this.resourceIcons.get(key);
      const text = this.resourceTexts.get(key);
      
      if (icon && text) {
        // Quick pulse animation
        this.scene.tweens.add({
          targets: [icon, text],
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 150,
          yoyo: true,
          ease: 'Power2'
        });
      }
    });
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
    this.resourceIcons.clear();
    this.resourceTexts.clear();
    this.resourceLabels.clear();
  }
}
