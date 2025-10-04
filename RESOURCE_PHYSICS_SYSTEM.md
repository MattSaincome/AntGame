# ⚖️ Resource Block Physics & Weight System

## **Weight Hierarchy: Dirt < Stone < Copper**

### **Material Properties:**

| Material | Weight Range | Gravity Multiplier | Monster Speed |
|----------|-------------|-------------------|---------------|
| **Dirt** | 8-12 | 1.0x (floats gently) | 85-90% speed |
| **Stone** | 25-40 | 1.4x (drops noticeably) | 50-65% speed |
| **Copper** | 50-70 | 2.0x (drops fast!) | 30-50% speed |
| Rock | 35-55 | 1.6x | 35-65% speed |
| Iron | 80+ | 2.2x | 20-30% speed |
| Gold | 100+ | 2.5x | <25% speed |

---

## **Physics System:**

### **1. Gravity & Falling**
All resource blocks have **physics** - they fall when in the air!

```typescript
// Gravity is applied based on material density
const gravityMultiplier = this.getGravityMultiplier(chunk.tileType);
const materialGravity = gravity * gravityMultiplier;

// Heavier materials fall faster!
if (!chunk.onGround) {
  chunk.velocityY += materialGravity * deltaTime;
}
```

**Falling Speed:**
- **Dirt:** Floats down gently (1.0x gravity)
- **Stone:** Noticeable drop (1.4x gravity)
- **Copper:** Drops like a rock! (2.0x gravity)

---

### **2. Monster Slowdown**
Monsters are **slowed down** when carrying heavy chunks!

```typescript
// Weight-based slowdown calculation
// Light (dirt 8-12): 0.85x speed (barely slowed)
// Medium (stone 25-40): 0.50x speed (noticeable slowdown)
// Heavy (copper 50-70): 0.30x speed (very slow)
const weightPenalty = Math.max(0.25, 1.0 - (chunk.weight * 0.01));

monster.position.vx *= weightPenalty;
monster.position.vy *= weightPenalty;
```

**Slowdown Examples:**
- **Dirt (weight 10):** Monster at 90% speed - barely slowed
- **Stone (weight 30):** Monster at 70% speed - clearly slower
- **Copper (weight 60):** Monster at 40% speed - struggling!

---

## **Key Features:**

### **✅ Realistic Physics:**
- Blocks **fall when dropped** - affected by gravity
- Heavier materials **fall faster** (copper drops quicker than dirt)
- Blocks **bounce less** when heavy (no crazy bouncing)
- Blocks **settle on ground** after falling

### **✅ Weight Affects Gameplay:**
- Lighter materials = **faster** to transport (dirt)
- Medium materials = **noticeable** slowdown (stone)
- Heavy materials = **significant** slowdown (copper)
- Monsters **visibly struggle** with heavy loads

### **✅ Material Density:**
The weight hierarchy follows **real-world density:**
- **Dirt:** Loose, light soil
- **Stone:** Solid rock (heavier than dirt)
- **Copper:** Dense metal ore (heaviest of basics)
- **Iron/Gold:** Even denser metals

---

## **Code Implementation:**

### **Weight Definition:**
**File:** `ResourceChunk.ts` lines 101-148

```typescript
case TileType.DIRT:
  weight: 8-12  // LIGHTEST

case TileType.STONE:
  weight: 25-40  // MEDIUM

case TileType.ORE_COPPER:
  weight: 50-70  // HEAVIEST
```

### **Gravity System:**
**File:** `ResourceChunk.ts` lines 383-412

```typescript
getGravityMultiplier(tileType: TileType): number {
  DIRT:   1.0x  // Floats gently
  STONE:  1.4x  // Noticeable drop
  COPPER: 2.0x  // Drops fast!
}
```

### **Monster Slowdown:**
**File:** `GameScene.ts` lines 2333-2346

```typescript
const weightPenalty = Math.max(0.25, 1.0 - (chunk.weight * 0.01));
monster.position.vx *= weightPenalty;
monster.position.vy *= weightPenalty;
```

---

## **Visual Feedback:**

### **Block Appearance:**
- **Small chunks** (dirt): 8x8 pixels
- **Large chunks** (stone/copper): 12x12 pixels
- Heavy chunks have **weight indicator lines**

### **Block Colors:**
- Dirt: Brown (0x8B4513)
- Stone: Gray (0x708090)
- Copper: Copper/Bronze (0xB87333)

### **Tint Effects:**
- **Yellow tint:** Being carried
- **Green tint:** Flying through air
- **No tint:** Resting on ground

---

## **Gameplay Impact:**

### **Strategic Decisions:**
1. **Dirt mining** is **efficient** - easy to transport
2. **Stone mining** requires **planning** - slower transport
3. **Copper mining** needs **teamwork** - very slow solo

### **Teamwork Benefits:**
- Multiple monsters can carry one heavy chunk
- Weight divided among carriers = faster transport
- Copper chunks often need 2-3 monsters working together

---

## **Example Scenarios:**

**Scenario 1: Dirt Transport**
- Weight: 10
- Monster speed: 90%
- Falls gently when dropped
- Easy solo transport

**Scenario 2: Stone Transport**
- Weight: 30
- Monster speed: 70%
- Falls noticeably fast
- Doable solo but slow

**Scenario 3: Copper Transport**
- Weight: 60
- Monster speed: 40%
- Drops like a rock!
- Very slow solo - teamwork recommended

---

## **Benefits:**

✅ **Realistic physics** - blocks fall and settle naturally  
✅ **Strategic depth** - material choice matters  
✅ **Visual feedback** - see monsters struggle with weight  
✅ **Teamwork encouraged** - heavy materials benefit from cooperation  
✅ **Weight hierarchy** - Dirt < Stone < Copper is clear  
✅ **Smooth gameplay** - no crazy bouncing or glitches  
