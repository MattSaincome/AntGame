# Monster Hive Miner

A genetics-based underground mining RTS where you control a hive of autonomous monsters with evolving traits.

## 🎮 Game Features

### ✅ **Core Systems Implemented:**
- **Wider Game Screen** - 1400x800 for better gameplay experience
- **Advanced Monster Genetics** - 12 core traits affecting behavior and appearance
- **Detailed Monster Visuals** - Genetics-based appearance with tentacles, limbs, patterns, colors
- **Circular Starting Chamber** - Acts as protective walls that monsters must dig through
- **Intelligent Mining System** - Monsters autonomously prioritize ores and tunnel expansion
- **Terraria-style Physics** - Gravity, collision detection, tile-based world
- **Enemy Wave System** - Attacks every 2 minutes for natural selection pressure

### 🧬 **Genetics System:**
Each monster has 12 core traits that affect both behavior and appearance:
- **Physical**: `strength`, `speed`, `size` 
- **Skills**: `mining`, `attack`, `defense`
- **Behavioral**: `aggression`, `curiosity`, `social`
- **Biological**: `fertility`, `metabolism`, `adaptability`

### 🎯 **Gameplay Loop:**
1. **Start** with 5 specialized monsters in circular chamber
2. **Monsters autonomously mine** based on genetics (curious ones explore, strong ones mine faster)
3. **Enemy waves attack** every 2 minutes from world edges
4. **Survival of the fittest** - weak monsters die, strong ones breed
5. **Genetic evolution** - breed survivors to create stronger offspring

## 🕹️ **Controls:**
- **WASD** - Move camera
- **Mouse Scroll** - Zoom (if implemented)
- **Space** - Pause/unpause game
- **B** - Breeding interface (coming soon)
- **Left Click** - Select monsters / Place commands (coming soon)

## 🔧 **Technical Stack:**
- **TypeScript** + **Phaser 3** for game engine
- **Vite** for development and building
- **Genetics Engine** with breeding, mutations, and trait expression
- **Tile-based world** with procedural generation

## 🚀 **Current Status:**

### **Working Features:**
- ✅ Monster genetics and visual representation
- ✅ Autonomous mining behavior
- ✅ Terraria-style 2D physics
- ✅ Enemy spawning system
- ✅ Resource collection
- ✅ Age-based growth (babies to adults)
- ✅ Circular starting chamber design

### **Next Priorities:**
1. **Combat System** - Monster vs monster battles with genetic stats
2. **Breeding Interface** - Player selects monsters to breed
3. **Pheromone Commands** - Player influence through scent trails
4. **Advanced AI** - Better pathfinding and group behaviors

## 🧪 **Monster Genetics Examples:**

**The Miner Specialist:**
- High `mining` + `curiosity` = Digs faster and explores more
- Visual: Sturdy build, earth-toned colors, strong limbs

**The Fighter Specialist:**
- High `attack` + `aggression` = First to engage enemies
- Visual: Spikes, horns, red/dark colors, intimidating size

**The Breeder Specialist:**
- High `fertility` + `social` = Breeds often and coordinates well
- Visual: Bright colors, tentacles, larger size, complex patterns

## 🎬 **How to Run:**

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and watch your monster hive evolve!

## 🌟 **Unique Features:**

- **No Direct Unit Control** - Like Majesty, you influence rather than command
- **Visual Genetics** - See evolution in monster appearance and behavior
- **Emergent Tunneling** - Monsters create natural tunnel networks based on genetics
- **Genetic Pressure** - Enemy waves create natural selection for stronger traits
- **Multi-generational Strategy** - Plan breeding across generations for optimal colony

## 🐛 **Known Issues:**
- Breeding system needs UI implementation
- Combat system needs balancing
- Performance optimization needed for large populations

---
**Created with Windsurf AI - A genetics-driven monster breeding RTS**
