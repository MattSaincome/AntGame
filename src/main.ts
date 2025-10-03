import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1400,
  height: 800,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scene: [GameScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // We'll handle gravity manually for more control
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: true,
    antialias: false,
    mipmapFilter: 'LINEAR'
  }
};

class Game extends Phaser.Game {
  constructor() {
    super(config);
    console.log('Monster Hive Miner - Starting Game');
  }
}

// Initialize the game when DOM is ready
window.addEventListener('load', () => {
  new Game();
});

// Also expose for debugging
(window as any).PhaserGame = Game;
