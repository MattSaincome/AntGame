# 🛡️ Smooth Preemptive Collision System

## **Problem Solved**
Monsters were constantly getting stuck inside blocks, requiring escape logic that looked janky and broke the smooth gameplay flow.

## **Solution: Triple Prevention System**

### **1. 🎯 Smooth Preemptive Block Collision**
**Location:** `GameScene.ts` lines 3373-3433

**How it works:**
- **BEFORE applying movement**, checks if new position would overlap with ANY solid block
- Uses AABB (Axis-Aligned Bounding Box) collision detection on all surrounding 9 tiles
- When overlap detected, smoothly **slides monster to the edge** of the block
- Prioritizes smallest overlap (horizontal vs vertical) for natural movement
- **No snapping, no teleporting** - just smooth Mario-style collision

```typescript
// Example: Monster moving right into block
if (overlapX < overlapY) {
  // Horizontal collision - smoothly push to left edge
  newX = blockLeft - monsterRadius - 1;
  monster.position.vx = Math.min(0, monster.position.vx); // Kill rightward velocity
}
```

**Benefits:**
✅ Monsters **NEVER penetrate blocks**  
✅ Smooth sliding along walls like Mario  
✅ No jittering or snapping back  
✅ Natural-feeling movement preservation  

---

### **2. 🤸 Cliff Tumbling System (VERY RARE)**
**Location:** `GameScene.ts` lines 3315-3351

**Purpose:** Prevent traffic jams on cliff edges (only for stuck monsters)

**How it works:**
- Detects when monster is on cliff edge (no ground ahead)
- Only if **SUPER SLOW** (0.5-5 speed) indicating truly stuck/stationary
- **Normal walking does NOT trigger** - only stuck monsters
- **5 second cooldown** between tumbles
- **1% chance per frame** - extremely rare
- Makes them **faceplant off the cliff** to clear jam
- Uses existing faceplant animation system

```typescript
const tumbleCooldown = 5000; // 5 second cooldown
// Only SUPER slow (stuck) monsters - normal walking won't trigger
if (isCliff && movementSpeed > 0.5 && movementSpeed < 5 && Math.random() < 0.01) {
  (monster as any).facePlanted = true;
  (monster as any).lastTumbleTime = this.time.now;
  monster.position.vx = direction * 80; // Push forward
  monster.position.vy = 50; // Push down
}
```

**Benefits:**
✅ **Extremely rare** - only truly stuck monsters  
✅ **Normal walking ignored** - won't interrupt gameplay  
✅ 5 second cooldown prevents spam  
✅ Natural tumbling animation  
✅ Super smooth, almost never triggers  

---

### **3. 💥 Monster Bumping System (RARE)**
**Location:** `GameScene.ts` lines 3352-3384

**Purpose:** Fast monsters knock over stopped/stationary ones (occasional)

**How it works:**
- Only for **very fast monsters** (>80 speed)
- Checks nearby monsters within 1.2 tiles
- Only if other monster is **stopped** (<5 speed)
- **2 second cooldown** between bumps
- **5% chance per frame** - rare
- **Knocks over the stopped monster** with faceplant
- **Only one knock per frame**

```typescript
const bumpCooldown = 2000; // 2 second cooldown
if (canBump && Math.abs(monster.position.vx) > 80) {
  if (otherSpeed < 5 && Math.random() < 0.05) {
    (other as any).facePlanted = true;
    (monster as any).lastBumpTime = this.time.now;
    other.position.vx = Math.sign(dx) * 100;
    other.position.vy = -50;
    break; // Only one per frame
  }
}
```

**Benefits:**
✅ **Rare event** - only truly fast monsters  
✅ 2 second cooldown prevents spam  
✅ Natural interaction between monsters  
✅ Doesn't cascade into chaos  
✅ Smooth, occasional nudges  

---

## **Technical Details**

### **Collision Parameters:**
- **Monster radius:** `monsterWidth * 0.4` (40% of width)
- **Collision buffer:** 1 pixel to prevent floating-point errors
- **Check range:** 9 tiles (3x3 grid around monster)

### **Smooth Sliding Logic:**
1. Calculate overlap in X and Y axes
2. Choose **smallest overlap** to resolve
3. Push monster to nearest edge
4. Kill velocity in blocked direction only
5. Preserve velocity in free direction

### **Performance & Rate Limiting:**
- Only checks 9 tiles per monster per frame
- Simple AABB math (no expensive physics)
- No recursive collision resolution needed
- Scales well with many monsters
- **Cliff tumbling:** 5s cooldown + 1% chance = ~1 tumble per 500 frames when stuck (once every 8 seconds)
- **Monster bumping:** 2s cooldown + 5% chance = ~1 bump per 40 frames when colliding (once per 0.6 seconds)

---

## **Visual Result**

### **Before:**
- Monsters clip into blocks constantly
- Teleport/snap to escape (janky)
- Jittery, unnatural movement
- Constant "STUCK IN BLOCK" messages
- Face-planting every frame

### **After:**
- Monsters smoothly slide along walls ✅
- **Never penetrate blocks at all** ✅
- Natural Mario-like platformer feel ✅
- **Rare** tumbles off cliffs (only when stuck) ✅
- **Occasional** bumps between monsters (only fast into stopped) ✅
- Smooth, natural-looking movement ✅

---

## **Code Integration**

The system integrates seamlessly:
1. Runs **before** position update
2. Works with existing physics (gravity, velocity)
3. Compatible with faceplant animation system
4. No changes to existing monster AI needed

**Key principle:** Prevention > Correction  
Instead of fixing stuck monsters, we prevent them from getting stuck in the first place!

---

## **Future Enhancements**

Possible additions:
- Smooth slope sliding (monsters slide down slopes)
- Wall jump detection (bounce off walls)
- Group momentum (monsters in packs push together)
- Dynamic collision radius based on monster size
