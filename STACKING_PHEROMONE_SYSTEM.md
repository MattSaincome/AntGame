# 🔥 Stacking Pheromone System - Click to Intensify!

## **New Feature: Urgency Stacking**

Clicking the same block multiple times now **STACKS** the pheromone strength and **GROWS** the visual radius!

---

## **How It Works:**

### **1. Strength Stacking**
Each click on the same tile **adds 100 strength** (capped at 500):

```typescript
// First click: Strength = 100 (1x)
// Second click: Strength = 200 (2x) 🔥
// Third click: Strength = 300 (3x) 🔥🔥
// Fourth click: Strength = 400 (4x) 🔥🔥🔥
// Fifth click: Strength = 500 (5x MAX) 🔥🔥🔥🔥
```

**Result:** Monsters prioritize higher-strength pheromones MUCH more strongly!

---

### **2. Visual Radius Growth**
The pheromone marker **GROWS** with each click:

| Clicks | Strength | Radius Multiplier | Visual Size |
|--------|----------|-------------------|-------------|
| 1 click | 100 | 1.0x | Normal (8px) |
| 2 clicks | 200 | 1.5x | Bigger (12px) |
| 3 clicks | 300 | 2.0x | Large (16px) + Ring! |
| 4 clicks | 400 | 2.5x | Very Large (20px) |
| 5 clicks | 500 (MAX) | 3.0x | Huge (24px) |

**Formula:**
```typescript
radiusMultiplier = 1 + (strengthMultiplier - 1) * 0.5
// Strength 100 = 1.0x radius
// Strength 200 = 1.5x radius
// Strength 300 = 2.0x radius
// Strength 400 = 2.5x radius
// Strength 500 = 3.0x radius
```

---

### **3. Increased Visibility**
Stronger pheromones are **MORE VISIBLE**:

- **Alpha (opacity):** Increases from 30% to 90%
- **Line thickness:** Doubles for 5x strength
- **Special effects:** Pulsing ring appears at 3x+ strength!

```typescript
alpha = Math.min(0.9, strengthMultiplier * 0.3)
lineThickness = baseThickness * radiusMultiplier
```

---

## **Visual Examples:**

### **MINE_HERE Pheromone:**

**1 Click (100 strength):**
- Small green pick icon
- Subtle green highlight
- Normal size (8px)

**3 Clicks (300 strength):**
- Larger green pick icon
- Bright green highlight (2x size)
- **Pulsing green ring appears!** 🌟
- Radius: 16px

**5 Clicks (500 strength):**
- HUGE green pick icon
- Very bright highlight (3x size)
- Thick pulsing ring
- Radius: 24px
- **MONSTERS GO HERE FIRST!** 🎯

---

### **DO_NOT_MINE Pheromone:**

**1 Click (100 strength):**
- Red X pattern
- Thin red border
- Normal size

**5 Clicks (500 strength):**
- HUGE red X (3x size)
- Thick red border expanding 3 tiles
- **ABSOLUTE NO-GO ZONE!** 🚫

---

## **Gameplay Impact:**

### **Priority System:**
Monsters use pheromone strength in their AI calculations:

```typescript
// In findOptimalDiggingTile:
if (this.pheromoneSystem.isMiningEncouraged(x, y)) {
  priority *= 50.0 * (pheromoneStrength / 100);
  // 1 click = 50x priority
  // 3 clicks = 150x priority!
  // 5 clicks = 250x priority!! ULTRA URGENT!
}
```

---

## **Use Cases:**

### **1. Emergency Mining:**
- Click 5 times on critical ore
- **500 strength = TOP PRIORITY**
- All monsters rush there immediately!

### **2. Gentle Suggestions:**
- Single click = normal priority
- Lets monsters decide based on distance

### **3. Protected Areas:**
- 5 clicks "DO NOT MINE"
- Creates absolute no-go zone
- Monsters will NEVER mine there

---

## **Code Implementation:**

### **Stacking Logic:**
**File:** `PheromoneSystem.ts` lines 37-58

```typescript
addPheromone(tileX: number, tileY: number, type: PheromoneType, strength: number = 100) {
  const existing = this.getPheromoneAt(tileX, tileY);
  
  if (existing && existing.type === type) {
    // STACK THE STRENGTH!
    const oldStrength = existing.strength;
    existing.strength = Math.min(500, existing.strength + strength);
    existing.timestamp = Date.now(); // Reset age
    
    console.log(`🔥 STACKED pheromone: ${oldStrength} → ${existing.strength} (${Math.floor(existing.strength/100)}x urgency!)`);
    return existing.id;
  }
  
  // Create new pheromone...
}
```

### **Visual Scaling:**
**File:** `PheromoneSystem.ts` lines 228-235

```typescript
// Strength affects size and visibility
const strengthMultiplier = Math.min(5, pheromone.strength / 100); // 1x to 5x
const alpha = Math.min(0.9, strengthMultiplier * 0.3); // More visible

// Radius grows with strength
const baseRadius = TILE_SIZE / 2;
const radiusMultiplier = 1 + (strengthMultiplier - 1) * 0.5; // 1x to 3x
const radius = baseRadius * radiusMultiplier;
```

### **Special Effects:**
**File:** `PheromoneSystem.ts` lines 265-269

```typescript
// Add pulsing ring for high urgency (3x+)
if (strengthMultiplier >= 3) {
  visual.lineStyle(3, 0x44FF44, alpha * 0.8);
  visual.strokeCircle(0, 0, radius * 1.2);
}
```

---

## **Benefits:**

✅ **Intuitive control** - More clicks = more urgent  
✅ **Visual feedback** - See urgency at a glance  
✅ **Fine control** - Choose exact priority level  
✅ **Emergency overrides** - 5 clicks for critical commands  
✅ **Clear communication** - Visual size matches importance  
✅ **No confusion** - Single tile, multiple urgency levels  

---

## **Player Experience:**

**Before:**
- Single click = fixed priority
- All pheromones equal strength
- Hard to show urgency

**After:**
- Click once = "consider this"
- Click 3 times = "priority target!" 🎯
- Click 5 times = "DO THIS NOW!!!" 🔥🔥🔥
- Visual grows with urgency
- Monsters respond accordingly

**It's like shouting louder to get attention!** 📢
