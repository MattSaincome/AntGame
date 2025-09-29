import { Scene } from 'phaser';
import { GeneticsEngine } from '../genetics/GeneticsEngine';
import { MonsterGenetics, BreedingStatus, MonsterLifeStage } from '../genetics/GeneticsTypes';

/**
 * UI for selecting monsters and viewing their genetics/DNA
 */
export class MonsterSelectionUI {
  private scene: Scene;
  private popup: Phaser.GameObjects.Container | null = null;
  private isVisible: boolean = false;
  private currentMonster: any | null = null;
  private onBreedCallback?: (monster: any) => void;
  
  constructor(scene: Scene) {
    this.scene = scene;
  }
  
  /**
   * Set callback for when player clicks "Breed" button
   */
  setBreedCallback(callback: (monster: any) => void): void {
    this.onBreedCallback = callback;
  }
  
  /**
   * Show monster genetics popup
   */
  showMonsterGenetics(monster: any): void {
    this.currentMonster = monster;
    this.createPopup();
  }
  
  /**
   * Hide the genetics popup
   */
  hide(): void {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    this.isVisible = false;
    this.currentMonster = null;
  }
  
  /**
   * Create the genetics popup UI
   */
  private createPopup(): void {
    // Close existing popup
    this.hide();
    
    if (!this.currentMonster || !this.currentMonster.genetics) {
      return;
    }
    
    const genetics = this.currentMonster.genetics as MonsterGenetics;
    const summary = GeneticsEngine.getGeneticsSummary(genetics);
    
    // Create popup container
    const width = 450;
    const height = 600;
    const x = this.scene.cameras.main.width - width - 20; // Right side of screen
    const y = 20; // Top of screen
    
    this.popup = this.scene.add.container(x, y);
    this.popup.setScrollFactor(0); // Don't scroll with camera
    this.popup.setDepth(1000); // Above everything else
    
    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.lineStyle(2, 0x16213e);
    bg.fillRoundedRect(0, 0, width, height, 10);
    bg.strokeRoundedRect(0, 0, width, height, 10);
    this.popup.add(bg);
    
    // Title
    const title = this.scene.add.text(width / 2, 25, 'MONSTER GENETICS', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#00ffff',
      align: 'center'
    });
    title.setOrigin(0.5, 0);
    this.popup.add(title);
    
    // Close button
    const closeBtn = this.scene.add.text(width - 30, 25, '×', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ff6b6b',
      align: 'center'
    });
    closeBtn.setOrigin(0.5, 0);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.popup.add(closeBtn);
    
    let yPos = 70;
    
    // Basic info section
    yPos = this.addSection(this.popup, 'BASIC INFO', yPos, width);
    yPos = this.addInfoLine(this.popup, `ID: ${summary.id}`, yPos);
    yPos = this.addInfoLine(this.popup, `Generation: ${summary.generation}`, yPos);
    yPos = this.addInfoLine(this.popup, `Age: ${summary.age}s / ${summary.maturityAge}s`, yPos);
    yPos = this.addInfoLine(this.popup, `Life Stage: ${summary.lifeStage.toUpperCase()}`, yPos);
    yPos = this.addInfoLine(this.popup, `Breeding: ${summary.breedingStatus.toUpperCase()}`, yPos);
    
    if (summary.parents[0] || summary.parents[1]) {
      yPos = this.addInfoLine(this.popup, `Parents: ${summary.parents[0] || 'Unknown'} x ${summary.parents[1] || 'Unknown'}`, yPos);
    }
    
    yPos += 10;
    
    // Physical traits section
    yPos = this.addSection(this.popup, 'PHYSICAL TRAITS', yPos, width);
    yPos = this.addStatBar(this.popup, 'Strength', summary.traits.strength, yPos, width);
    yPos = this.addStatBar(this.popup, 'Speed', summary.traits.speed, yPos, width);
    yPos = this.addStatBar(this.popup, 'Size', summary.traits.size, yPos, width);
    yPos = this.addStatBar(this.popup, 'Mining', summary.traits.mining, yPos, width);
    yPos = this.addStatBar(this.popup, 'Attack', summary.traits.attack, yPos, width);
    yPos = this.addStatBar(this.popup, 'Defense', summary.traits.defense, yPos, width);
    
    yPos += 10;
    
    // Behavioral traits section
    yPos = this.addSection(this.popup, 'BEHAVIOR', yPos, width);
    yPos = this.addStatBar(this.popup, 'Aggression', summary.behavior.aggression, yPos, width);
    yPos = this.addStatBar(this.popup, 'Curiosity', summary.behavior.curiosity, yPos, width);
    yPos = this.addStatBar(this.popup, 'Social', summary.behavior.social, yPos, width);
    yPos = this.addStatBar(this.popup, 'Fertility', summary.behavior.fertility, yPos, width);
    
    yPos += 10;
    
    // Appearance section
    yPos = this.addSection(this.popup, 'APPEARANCE', yPos, width);
    yPos = this.addInfoLine(this.popup, `Head: ${summary.appearance.headType}`, yPos);
    yPos = this.addInfoLine(this.popup, `Body: ${summary.appearance.bodyType}`, yPos);
    yPos = this.addInfoLine(this.popup, `Limbs: ${summary.appearance.limbCount}`, yPos);
    yPos = this.addInfoLine(this.popup, `Scale: ${summary.appearance.scale.toFixed(2)}x`, yPos);
    
    if (summary.appearance.mutations.length > 0) {
      yPos = this.addInfoLine(this.popup, `Mutations: ${summary.appearance.mutations.join(', ')}`, yPos);
    }
    
    yPos += 20;
    
    // Breeding button (only show if monster is adult and ready)
    if (summary.breedingStatus === BreedingStatus.READY || summary.breedingStatus === BreedingStatus.COOLDOWN) {
      const breedBtn = this.createBreedButton(width / 2 - 75, yPos, summary.breedingStatus === BreedingStatus.READY);
      this.popup.add(breedBtn);
    }
    
    this.isVisible = true;
  }
  
  /**
   * Add a section header
   */
  private addSection(container: Phaser.GameObjects.Container, title: string, yPos: number, width: number): number {
    const header = this.scene.add.text(20, yPos, title, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    container.add(header);
    
    // Add underline
    const line = this.scene.add.graphics();
    line.lineStyle(1, 0xffd700);
    line.lineBetween(20, yPos + 20, width - 20, yPos + 20);
    container.add(line);
    
    return yPos + 35;
  }
  
  /**
   * Add an info line
   */
  private addInfoLine(container: Phaser.GameObjects.Container, text: string, yPos: number): number {
    const info = this.scene.add.text(30, yPos, text, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff'
    });
    container.add(info);
    
    return yPos + 18;
  }
  
  /**
   * Add a stat bar with value visualization
   */
  private addStatBar(container: Phaser.GameObjects.Container, label: string, value: number, yPos: number, width: number): number {
    // Label
    const labelText = this.scene.add.text(30, yPos, label, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff'
    });
    container.add(labelText);
    
    // Value text
    const valueText = this.scene.add.text(width - 50, yPos, value.toString(), {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#00ffff'
    });
    valueText.setOrigin(1, 0);
    container.add(valueText);
    
    // Background bar
    const barBg = this.scene.add.graphics();
    barBg.fillStyle(0x333333);
    barBg.fillRect(30, yPos + 15, width - 80, 6);
    container.add(barBg);
    
    // Stat bar
    const barWidth = ((value / 255) * (width - 80));
    const bar = this.scene.add.graphics();
    
    // Color based on value
    let color = 0x666666;
    if (value > 200) color = 0x00ff00; // Green for high
    else if (value > 150) color = 0xffff00; // Yellow for medium-high
    else if (value > 100) color = 0xff9900; // Orange for medium
    else if (value > 50) color = 0xff6600; // Red-orange for low
    else color = 0xff0000; // Red for very low
    
    bar.fillStyle(color);
    bar.fillRect(30, yPos + 15, barWidth, 6);
    container.add(bar);
    
    return yPos + 30;
  }
  
  /**
   * Create the breed button
   */
  private createBreedButton(x: number, y: number, enabled: boolean): Phaser.GameObjects.Container {
    const btnContainer = this.scene.add.container(x, y);
    
    // Button background
    const btnBg = this.scene.add.graphics();
    if (enabled) {
      btnBg.fillStyle(0x00aa00, 0.8);
      btnBg.lineStyle(2, 0x00ff00);
    } else {
      btnBg.fillStyle(0x666666, 0.8);
      btnBg.lineStyle(2, 0x888888);
    }
    btnBg.fillRoundedRect(0, 0, 150, 40, 5);
    btnBg.strokeRoundedRect(0, 0, 150, 40, 5);
    btnContainer.add(btnBg);
    
    // Button text
    const btnText = this.scene.add.text(75, 20, enabled ? 'SEND TO BREED' : 'BREEDING COOLDOWN', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: enabled ? '#ffffff' : '#aaaaaa',
      fontStyle: 'bold',
      align: 'center'
    });
    btnText.setOrigin(0.5, 0.5);
    btnContainer.add(btnText);
    
    if (enabled) {
      btnContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 150, 40), Phaser.Geom.Rectangle.Contains);
      btnContainer.on('pointerdown', () => {
        if (this.onBreedCallback && this.currentMonster) {
          this.onBreedCallback(this.currentMonster);
          this.hide();
        }
      });
      
      btnContainer.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0x00cc00, 0.9);
        btnBg.lineStyle(2, 0x00ff00);
        btnBg.fillRoundedRect(0, 0, 150, 40, 5);
        btnBg.strokeRoundedRect(0, 0, 150, 40, 5);
      });
      
      btnContainer.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x00aa00, 0.8);
        btnBg.lineStyle(2, 0x00ff00);
        btnBg.fillRoundedRect(0, 0, 150, 40, 5);
        btnBg.strokeRoundedRect(0, 0, 150, 40, 5);
      });
    }
    
    return btnContainer;
  }
  
  /**
   * Check if the popup is currently visible
   */
  isPopupVisible(): boolean {
    return this.isVisible;
  }
  
  /**
   * Update the popup if it's visible and monster data has changed
   */
  update(): void {
    if (this.isVisible && this.currentMonster) {
      // Refresh the popup with updated data
      this.showMonsterGenetics(this.currentMonster);
    }
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.hide();
  }
}
