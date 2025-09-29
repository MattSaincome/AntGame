import Phaser from 'phaser';
import { PheromoneSystem, PheromoneType } from '../systems/PheromoneSystem';

export class RTSHud {
  private scene: Phaser.Scene;
  private pheromoneSystem: PheromoneSystem;
  
  // UI Elements
  private hudContainer!: Phaser.GameObjects.Container;
  private speedDisplay!: Phaser.GameObjects.Text;
  private selectedPheromone: PheromoneType = PheromoneType.MINE_HERE;
  private pheromoneButtons: Map<PheromoneType, Phaser.GameObjects.Rectangle> = new Map();
  private pheromoneIcons: Map<PheromoneType, Phaser.GameObjects.Text> = new Map();
  
  // Game speed reference
  private gameSpeed: number = 1.0;
  
  // Store all UI elements for repositioning
  private allUIElements: Phaser.GameObjects.GameObject[] = [];
  private mainPanel!: Phaser.GameObjects.Rectangle;
  private borderTop!: Phaser.GameObjects.Rectangle;
  private pheromoneTitle!: Phaser.GameObjects.Text;
  private pheromoneInstructions!: Phaser.GameObjects.Text;
  private speedTitle!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Rectangle;
  private pauseLabel!: Phaser.GameObjects.Text;
  private speedButtons: { button: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];
  private pheromoneLabels: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, pheromoneSystem: PheromoneSystem) {
    this.scene = scene;
    this.pheromoneSystem = pheromoneSystem;
    this.createHUD();
    
    // Listen for window resize only
    this.scene.scale.on('resize', this.handleResize, this);
  }

  private createHUD(): void {
    // Create main HUD container - positioned at bottom of screen
    this.hudContainer = this.scene.add.container(0, 0);
    this.hudContainer.setScrollFactor(0);
    this.hudContainer.setDepth(2000);

    // Create the main HUD panel (StarCraft 2 style bottom panel)
    this.createMainPanel();
    
    // Create pheromone command panel
    this.createPheromonePanel();
    
    // Create speed control panel
    this.createSpeedPanel();
    
    // Create resource panel integration point
    this.createResourcePanelSpace();
  }

  private createMainPanel(): void {
    // Use game canvas dimensions for fixed UI sizing
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    
    // Main HUD background - bottom 1/8th of screen
    const hudHeight = Math.floor(screenHeight / 8);
    const hudY = screenHeight - hudHeight;
    
    this.mainPanel = this.scene.add.rectangle(
      screenWidth / 2, hudY + hudHeight / 2,
      screenWidth, hudHeight,
      0x1a1a1a, 0.9
    );
    this.mainPanel.setScrollFactor(0);
    this.mainPanel.setDepth(1900);
    this.allUIElements.push(this.mainPanel);
    
    // Add border styling like StarCraft
    this.borderTop = this.scene.add.rectangle(
      screenWidth / 2, hudY,
      screenWidth, 3,
      0x00ffff, 0.8
    );
    this.borderTop.setScrollFactor(0);
    this.borderTop.setDepth(1901);
    this.allUIElements.push(this.borderTop);
  }

  private createPheromonePanel(): void {
    const screenHeight = this.scene.scale.height;
    const hudHeight = Math.floor(screenHeight / 8);
    const panelY = screenHeight - hudHeight + 20;
    
    // Pheromone command title
    this.pheromoneTitle = this.scene.add.text(20, panelY - 30, 'PHEROMONE COMMANDS', {
      fontSize: '14px',
      color: '#00ffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    this.pheromoneTitle.setScrollFactor(0);
    this.pheromoneTitle.setDepth(2000);
    this.allUIElements.push(this.pheromoneTitle);

    // Create pheromone command buttons
    const pheromoneTypes = [
      { type: PheromoneType.MINE_HERE, icon: '⛏️', name: 'MINE', color: '#ffff00' },
      { type: PheromoneType.SAFE_ZONE, icon: '🛡️', name: 'SAFE', color: '#00ff00' },
      { type: PheromoneType.DANGER_ZONE, icon: '⚠️', name: 'DANGER', color: '#ff4444' },
      { type: PheromoneType.DO_NOT_MINE, icon: '🚫', name: 'NO MINE', color: '#ff8800' }
    ];

    pheromoneTypes.forEach((pheromone, index) => {
      const buttonX = 20 + (index * 90);
      const buttonY = panelY;
      
      // Button background
      const button = this.scene.add.rectangle(buttonX, buttonY, 80, 35, 0x333333, 0.8);
      button.setScrollFactor(0);
      button.setDepth(2000);
      button.setInteractive();
      
      // Button icon and text
      const icon = this.scene.add.text(buttonX - 25, buttonY - 8, pheromone.icon, {
        fontSize: '16px'
      });
      icon.setScrollFactor(0);
      icon.setDepth(2001);
      
      const label = this.scene.add.text(buttonX - 5, buttonY - 5, pheromone.name, {
        fontSize: '10px',
        color: pheromone.color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      });
      label.setScrollFactor(0);
      label.setDepth(2001);
      
      // Store references
      this.pheromoneButtons.set(pheromone.type, button);
      this.pheromoneIcons.set(pheromone.type, icon);
      this.pheromoneLabels.push(label);
      this.allUIElements.push(button, icon, label);
      
      // Button click handler
      button.on('pointerdown', () => {
        this.selectPheromone(pheromone.type);
      });
      
      // Hover effects
      button.on('pointerover', () => {
        button.setFillStyle(0x555555, 0.9);
      });
      
      button.on('pointerout', () => {
        const isSelected = this.selectedPheromone === pheromone.type;
        button.setFillStyle(isSelected ? 0x666666 : 0x333333, 0.8);
      });
    });

    // Select first pheromone by default
    this.selectPheromone(PheromoneType.MINE_HERE);
    
    // Add instructions
    this.pheromoneInstructions = this.scene.add.text(20, panelY + 25, 'Click buttons to select pheromone, then click on world to place', {
      fontSize: '11px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif'
    });
    this.pheromoneInstructions.setScrollFactor(0);
    this.pheromoneInstructions.setDepth(2000);
    this.allUIElements.push(this.pheromoneInstructions);
  }

  private createSpeedPanel(): void {
    const screenHeight = this.scene.scale.height;
    const hudHeight = Math.floor(screenHeight / 8);
    const panelX = 400;
    const panelY = screenHeight - hudHeight + 40;
    
    // Speed control title
    this.speedTitle = this.scene.add.text(panelX, panelY - 30, 'GAME SPEED', {
      fontSize: '14px',
      color: '#00ffff',
      fontStyle: 'bold'
    });
    this.speedTitle.setScrollFactor(0);
    this.speedTitle.setDepth(2000);
    this.allUIElements.push(this.speedTitle);

    // Speed display
    this.speedDisplay = this.scene.add.text(panelX, panelY - 10, `${this.gameSpeed.toFixed(2)}x`, {
      fontSize: '20px',
      color: '#00ff00',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    this.speedDisplay.setScrollFactor(0);
    this.speedDisplay.setDepth(2000);
    this.allUIElements.push(this.speedDisplay);

    // Speed control buttons
    const speedButtons = [
      { text: '0.25x', speed: 0.25, x: panelX - 60 },
      { text: '0.5x', speed: 0.5, x: panelX - 30 },
      { text: '1x', speed: 1.0, x: panelX },
      { text: '2x', speed: 2.0, x: panelX + 30 },
      { text: '4x', speed: 4.0, x: panelX + 60 }
    ];

    speedButtons.forEach(btn => {
      const button = this.scene.add.rectangle(btn.x, panelY + 15, 25, 20, 0x444444, 0.8);
      button.setScrollFactor(0);
      button.setDepth(2000);
      button.setInteractive();
      
      const label = this.scene.add.text(btn.x, panelY + 15, btn.text, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      });
      label.setScrollFactor(0);
      label.setDepth(2001);
      label.setOrigin(0.5);
      
      button.on('pointerdown', () => {
        this.setGameSpeed(btn.speed);
      });
      
      button.on('pointerover', () => {
        button.setFillStyle(0x666666, 0.9);
      });
      
      button.on('pointerout', () => {
        button.setFillStyle(0x444444, 0.8);
      });
      
      this.speedButtons.push({ button, label });
      this.allUIElements.push(button, label);
    });

    // Pause button
    this.pauseButton = this.scene.add.rectangle(panelX, panelY + 40, 60, 20, 0x660000, 0.8);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setDepth(2000);
    this.pauseButton.setInteractive();
    
    this.pauseLabel = this.scene.add.text(panelX, panelY + 40, 'PAUSE', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    this.pauseLabel.setScrollFactor(0);
    this.pauseLabel.setDepth(2001);
    this.pauseLabel.setOrigin(0.5);
    
    this.pauseButton.on('pointerdown', () => {
      this.togglePause();
    });
    
    this.allUIElements.push(this.pauseButton, this.pauseLabel);
  }

  private createResourcePanelSpace(): void {
    // Leave space for the existing ResourceTracker
    // This method serves as a placeholder for future integration
  }

  private selectPheromone(type: PheromoneType): void {
    // Update visual selection
    this.pheromoneButtons.forEach((button, pheromoneType) => {
      const isSelected = pheromoneType === type;
      button.setFillStyle(isSelected ? 0x666666 : 0x333333, 0.8);
    });
    
    this.selectedPheromone = type;
    console.log(`Selected pheromone: ${type}`);
  }

  public getSelectedPheromone(): PheromoneType {
    return this.selectedPheromone;
  }

  public setGameSpeed(speed: number): void {
    this.gameSpeed = speed;
    this.speedDisplay.setText(`${speed.toFixed(2)}x`);
    
    // Emit event for GameScene to handle
    this.scene.events.emit('gameSpeedChanged', speed);
  }

  public updateGameSpeed(speed: number): void {
    this.gameSpeed = speed;
    this.speedDisplay.setText(`${speed.toFixed(2)}x`);
  }

  private togglePause(): void {
    const newSpeed = this.gameSpeed === 0 ? 1.0 : 0;
    this.setGameSpeed(newSpeed);
  }

  public placePheromone(worldX: number, worldY: number): void {
    // Convert world coordinates to tile coordinates
    const tileX = Math.floor(worldX / 16);
    const tileY = Math.floor(worldY / 16);
    
    // Place the pheromone using the pheromone system
    this.pheromoneSystem.addPheromone(tileX, tileY, this.selectedPheromone, 50);
    
    console.log(`Placed ${this.selectedPheromone} pheromone at tile (${tileX}, ${tileY})`);
  }

  private handleResize(): void {
    // Only handle actual window resizes, not zoom changes
    // Recreate the HUD at new dimensions if needed
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    
    // Recalculate HUD dimensions
    const hudHeight = Math.floor(screenHeight / 8);
    const hudY = screenHeight - hudHeight;
    
    // Reposition main panel
    if (this.mainPanel) {
      this.mainPanel.setPosition(screenWidth / 2, hudY + hudHeight / 2);
      this.mainPanel.setSize(screenWidth, hudHeight);
    }
    
    if (this.borderTop) {
      this.borderTop.setPosition(screenWidth / 2, hudY);
      this.borderTop.setSize(screenWidth, 3);
    }
    
    // Reposition pheromone panel elements
    const panelY = screenHeight - hudHeight + 20;
    if (this.pheromoneTitle) {
      this.pheromoneTitle.setPosition(20, panelY - 30);
    }
    
    // Reposition pheromone buttons
    const pheromoneTypes = [
      { type: PheromoneType.MINE_HERE },
      { type: PheromoneType.SAFE_ZONE },
      { type: PheromoneType.DANGER_ZONE },
      { type: PheromoneType.DO_NOT_MINE }
    ];
    
    pheromoneTypes.forEach((pheromone, index) => {
      const buttonX = 20 + (index * 90);
      const buttonY = panelY;
      
      const button = this.pheromoneButtons.get(pheromone.type);
      const icon = this.pheromoneIcons.get(pheromone.type);
      const label = this.pheromoneLabels[index];
      
      if (button) button.setPosition(buttonX, buttonY);
      if (icon) icon.setPosition(buttonX - 25, buttonY - 8);
      if (label) label.setPosition(buttonX - 5, buttonY - 5);
    });
    
    if (this.pheromoneInstructions) {
      this.pheromoneInstructions.setPosition(20, panelY + 25);
    }
    
    // Reposition speed panel
    const speedPanelX = 400;
    const speedPanelY = screenHeight - hudHeight + 40;
    
    if (this.speedTitle) {
      this.speedTitle.setPosition(speedPanelX, speedPanelY - 30);
    }
    
    if (this.speedDisplay) {
      this.speedDisplay.setPosition(speedPanelX, speedPanelY - 10);
    }
    
    // Reposition speed buttons
    const speedButtonConfigs = [
      { x: speedPanelX - 60 },
      { x: speedPanelX - 30 },
      { x: speedPanelX },
      { x: speedPanelX + 30 },
      { x: speedPanelX + 60 }
    ];
    
    this.speedButtons.forEach((btn, index) => {
      const config = speedButtonConfigs[index];
      if (config) {
        btn.button.setPosition(config.x, speedPanelY + 15);
        btn.label.setPosition(config.x, speedPanelY + 15);
      }
    });
    
    if (this.pauseButton) {
      this.pauseButton.setPosition(speedPanelX, speedPanelY + 40);
    }
    
    if (this.pauseLabel) {
      this.pauseLabel.setPosition(speedPanelX, speedPanelY + 40);
    }
  }
  
  public destroy(): void {
    // Remove event listeners
    this.scene.scale.off('resize', this.handleResize, this);
    
    // Destroy all UI elements
    this.allUIElements.forEach(element => element.destroy());
    this.hudContainer.destroy();
  }
}
