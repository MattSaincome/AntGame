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
  
  // Track population
  public population: number = 0;
  public maxPopulation: number = 200;
  
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
    
    // HUD moved to UIScene - no longer creating UI elements here
  }

  /**
   * Add resources based on tile type and value
   */
  addResources(tileType: TileType, amount: number): void {
    if (amount <= 0) {
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
   * Update HUD - no longer needed, UI is in UIScene
   */
  update(): void {
    // UI moved to separate UIScene
  }

  /**
   * Update the resource display with current values
   */
  private updateResourceDisplay(): void {
    // No display elements - removed
  }

  /**
   * Update population display
   */
  updatePopulation(current: number, max?: number): void {
    this.population = current;
    if (max !== undefined) {
      this.maxPopulation = max;
    }
    // No display to update
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
    // UI moved to separate UIScene - nothing to clean up here
  }
}
