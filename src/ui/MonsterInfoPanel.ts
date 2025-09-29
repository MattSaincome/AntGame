import Phaser from 'phaser';
import { Monster } from '../entities/Monster';
import { MonsterGenetics } from '../genetics/GeneticsTypes';

export class MonsterInfoPanel {
  private scene: Phaser.Scene;
  private panel!: Phaser.GameObjects.Graphics;
  private selectedMonster: Monster | null = null;
  private panelVisible: boolean = false;
  
  // UI Elements
  private nameText!: Phaser.GameObjects.Text;
  private ageText!: Phaser.GameObjects.Text;
  private energyText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  
  // Stats display
  private strengthText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private miningText!: Phaser.GameObjects.Text;
  private attackText!: Phaser.GameObjects.Text;
  private defenseText!: Phaser.GameObjects.Text;
  private fertilityText!: Phaser.GameObjects.Text;
  
  // Genetics display
  private geneticsTexts: Phaser.GameObjects.Text[] = [];
  
  // Buttons
  private breedButton!: Phaser.GameObjects.Graphics;
  private breedButtonText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Graphics;
  
  private onBreedCallback?: (monster: Monster) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createPanel();
  }

  /**
   * Show info panel for selected monster
   */
  showMonster(monster: Monster, onBreedCallback?: (monster: Monster) => void): void {
    this.selectedMonster = monster;
    this.onBreedCallback = onBreedCallback;
    this.panelVisible = true;
    this.updateDisplay();
    this.panel.setVisible(true);
  }

  /**
   * Hide the info panel
   */
  hide(): void {
    this.panelVisible = false;
    this.selectedMonster = null;
    this.panel.setVisible(false);
  }

  /**
   * Check if panel is currently visible
   */
  isVisible(): boolean {
    return this.panelVisible;
  }

  /**
   * Create the monster info panel UI
   */
  private createPanel(): void {
    // Main panel background
    this.panel = this.scene.add.graphics();
    this.panel.setScrollFactor(0);
    this.panel.setDepth(3000);
    this.panel.setVisible(false);

    // Panel background - right side of screen
    const panelX = this.scene.scale.width - 320;
    const panelY = 100;
    const panelWidth = 300;
    const panelHeight = 600;

    this.panel.fillStyle(0x2C1810, 0.95); // Dark brown
    this.panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    
    // Panel border
    this.panel.lineStyle(3, 0x8B4513, 1);
    this.panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);

    // Title
    const titleText = this.scene.add.text(panelX + 150, panelY + 20, 'MONSTER INFO', {
      fontSize: '18px',
      color: '#FFD700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    titleText.setOrigin(0.5);
    titleText.setScrollFactor(0);
    titleText.setDepth(3001);
    this.panel.add(titleText);

    // Create text elements
    this.createTextElements(panelX, panelY);
    this.createButtons(panelX, panelY, panelWidth);
  }

  /**
   * Create all text elements for the panel
   */
  private createTextElements(panelX: number, panelY: number): void {
    const textStyle = {
      fontSize: '14px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 1
    };

    let yOffset = 50;

    // Basic info
    this.nameText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Name: ???', textStyle);
    this.nameText.setScrollFactor(0).setDepth(3001);
    yOffset += 25;

    this.ageText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Age: 0', textStyle);
    this.ageText.setScrollFactor(0).setDepth(3001);
    yOffset += 25;

    this.energyText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Energy: 100%', textStyle);
    this.energyText.setScrollFactor(0).setDepth(3001);
    yOffset += 25;

    this.healthText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Health: 100%', textStyle);
    this.healthText.setScrollFactor(0).setDepth(3001);
    yOffset += 25;

    this.statusText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Status: IDLE', textStyle);
    this.statusText.setScrollFactor(0).setDepth(3001);
    yOffset += 35;

    // Stats header
    const statsHeader = this.scene.add.text(panelX + 20, panelY + yOffset, 'STATS:', {
      ...textStyle,
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold'
    });
    statsHeader.setScrollFactor(0).setDepth(3001);
    yOffset += 30;

    // Stats
    this.strengthText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Strength: 0', textStyle);
    this.strengthText.setScrollFactor(0).setDepth(3001);
    yOffset += 20;

    this.speedText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Speed: 0', textStyle);
    this.speedText.setScrollFactor(0).setDepth(3001);
    yOffset += 20;

    this.miningText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Mining: 0', textStyle);
    this.miningText.setScrollFactor(0).setDepth(3001);
    yOffset += 20;

    this.attackText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Attack: 0', textStyle);
    this.attackText.setScrollFactor(0).setDepth(3001);
    yOffset += 20;

    this.defenseText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Defense: 0', textStyle);
    this.defenseText.setScrollFactor(0).setDepth(3001);
    yOffset += 20;

    this.fertilityText = this.scene.add.text(panelX + 20, panelY + yOffset, 'Fertility: 0', textStyle);
    this.fertilityText.setScrollFactor(0).setDepth(3001);
    yOffset += 35;

    // DNA/Genetics header
    const dnaHeader = this.scene.add.text(panelX + 20, panelY + yOffset, 'DNA PROFILE:', {
      ...textStyle,
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold'
    });
    dnaHeader.setScrollFactor(0).setDepth(3001);
    yOffset += 30;

    // Create genetics display texts (will be populated dynamically)
    for (let i = 0; i < 10; i++) {
      const geneticText = this.scene.add.text(panelX + 20, panelY + yOffset + (i * 18), '', {
        fontSize: '12px',
        color: '#CCCCCC',
        fontFamily: 'Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1
      });
      geneticText.setScrollFactor(0).setDepth(3001);
      this.geneticsTexts.push(geneticText);
    }
  }

  /**
   * Create buttons for the panel
   */
  private createButtons(panelX: number, panelY: number, panelWidth: number): void {
    // Breed button
    this.breedButton = this.scene.add.graphics();
    this.breedButton.setScrollFactor(0);
    this.breedButton.setDepth(3001);
    this.breedButton.setInteractive();

    const buttonY = panelY + 520;
    this.breedButton.fillStyle(0x228B22, 0.8); // Forest green
    this.breedButton.fillRoundedRect(panelX + 20, buttonY, 120, 40, 8);
    this.breedButton.lineStyle(2, 0x32CD32, 1);
    this.breedButton.strokeRoundedRect(panelX + 20, buttonY, 120, 40, 8);

    this.breedButtonText = this.scene.add.text(panelX + 80, buttonY + 20, 'SET BREEDER', {
      fontSize: '14px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.breedButtonText.setOrigin(0.5);
    this.breedButtonText.setScrollFactor(0);
    this.breedButtonText.setDepth(3002);

    // Close button
    this.closeButton = this.scene.add.graphics();
    this.closeButton.setScrollFactor(0);
    this.closeButton.setDepth(3001);
    this.closeButton.setInteractive();

    this.closeButton.fillStyle(0xDC143C, 0.8); // Crimson
    this.closeButton.fillRoundedRect(panelX + 160, buttonY, 120, 40, 8);
    this.closeButton.lineStyle(2, 0xFF6347, 1);
    this.closeButton.strokeRoundedRect(panelX + 160, buttonY, 120, 40, 8);

    const closeButtonText = this.scene.add.text(panelX + 220, buttonY + 20, 'CLOSE', {
      fontSize: '14px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    closeButtonText.setOrigin(0.5);
    closeButtonText.setScrollFactor(0);
    closeButtonText.setDepth(3002);

    // Button interactions
    this.breedButton.on('pointerdown', () => {
      if (this.selectedMonster && this.onBreedCallback) {
        this.onBreedCallback(this.selectedMonster);
      }
    });

    this.closeButton.on('pointerdown', () => {
      this.hide();
    });
  }

  /**
   * Update display with current monster data
   */
  private updateDisplay(): void {
    if (!this.selectedMonster) return;

    const monster = this.selectedMonster;
    
    // Basic info
    this.nameText.setText(`Name: ${monster.genetics.uniqueId.substring(0, 8)}`);
    this.ageText.setText(`Age: ${Math.floor(monster.age)} seconds`);
    this.energyText.setText(`Energy: ${Math.floor(monster.energy)}%`);
    this.healthText.setText(`Health: ${Math.floor((monster.stats.currentHealth / monster.stats.maxHealth) * 100)}%`);
    this.statusText.setText(`Status: ${monster.state}`);

    // Stats
    this.strengthText.setText(`Strength: ${monster.stats.strength}`);
    this.speedText.setText(`Speed: ${monster.stats.speed}`);
    this.miningText.setText(`Mining: ${monster.stats.miningSpeed}`);
    this.attackText.setText(`Attack: ${monster.stats.attackPower}`);
    this.defenseText.setText(`Defense: ${monster.stats.defense}`);
    this.fertilityText.setText(`Fertility: ${monster.stats.fertility}`);

    // Update breed button based on current status
    if (monster.isBreeder) {
      this.breedButtonText.setText('REMOVE BREEDER');
      this.breedButton.clear();
      this.breedButton.fillStyle(0xDC143C, 0.8); // Red when active breeder
      this.breedButton.fillRoundedRect(this.scene.scale.width - 300, 620, 120, 40, 8);
      this.breedButton.lineStyle(2, 0xFF6347, 1);
      this.breedButton.strokeRoundedRect(this.scene.scale.width - 300, 620, 120, 40, 8);
    } else {
      this.breedButtonText.setText('SET BREEDER');
      this.breedButton.clear();
      this.breedButton.fillStyle(0x228B22, 0.8); // Green when not breeder
      this.breedButton.fillRoundedRect(this.scene.scale.width - 300, 620, 120, 40, 8);
      this.breedButton.lineStyle(2, 0x32CD32, 1);
      this.breedButton.strokeRoundedRect(this.scene.scale.width - 300, 620, 120, 40, 8);
    }

    // Genetics display
    const genetics = monster.genetics;
    let yIndex = 0;
    
    // Show key genetic traits
    this.geneticsTexts[yIndex++].setText(`Strength: ${genetics.strength.value} (${genetics.strength.dominance})`);
    this.geneticsTexts[yIndex++].setText(`Speed: ${genetics.speed.value} (${genetics.speed.dominance})`);
    this.geneticsTexts[yIndex++].setText(`Mining: ${genetics.miningSpeed.value} (${genetics.miningSpeed.dominance})`);
    this.geneticsTexts[yIndex++].setText(`Attack: ${genetics.attackPower.value} (${genetics.attackPower.dominance})`);
    this.geneticsTexts[yIndex++].setText(`Defense: ${genetics.defense.value} (${genetics.defense.dominance})`);
    this.geneticsTexts[yIndex++].setText(`Fertility: ${genetics.fertility.value} (${genetics.fertility.dominance})`);
    this.geneticsTexts[yIndex++].setText(`Curiosity: ${genetics.curiosity.value} (${genetics.curiosity.dominance})`);
    this.geneticsTexts[yIndex++].setText(`Aggression: ${genetics.aggression.value} (${genetics.aggression.dominance})`);
    this.geneticsTexts[yIndex++].setText(`Type: ${genetics.type}`);
    this.geneticsTexts[yIndex++].setText(`Generation: ${genetics.generation}`);
  }

  /**
   * Cleanup when destroyed
   */
  destroy(): void {
    this.panel?.destroy();
    this.geneticsTexts.forEach(text => text.destroy());
  }
}
