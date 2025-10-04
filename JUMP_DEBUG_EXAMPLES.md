# Jump Debug Console Examples

## 🎯 What Good Output Looks Like

### Perfect Smooth Jump Sequence
```
🏃 ANTICIPATORY JUMP! power=-600, pos=(512.3, 340.1)
🎯 JUMP STATE: vy=-600.0, isJumpingUp=true, justJumped=true, onGround=false
⬆️ KEEPING AIRBORNE (jumping up)
⬇️ FALLING: vy -580.5 → -560.2 (Δ20.3)
⬇️ FALLING: vy -560.2 → -538.7 (Δ21.5)
⬇️ FALLING: vy -538.7 → -515.9 (Δ22.8)
[... smooth velocity curve ...]
⬇️ FALLING: vy 98.3 → 120.5 (Δ22.2)
⬇️ FALLING: vy 120.5 → 144.2 (Δ23.7)
📍 SNAP CHECK: distFromSurface=3.2px, vy=144.2, needsSnap=true, fallingFast=true
🔧 SNAPPED: y 348.5 → 344.3 (moved -4.2px)
🔄 RESET JUMP FLAGS (155ms since jump)
```

**Analysis**: ✅ Perfect
- Smooth velocity curve
- Small snap distance (4.2px)
- Good grace period (155ms)
- No repeated snaps

---

## ⚠️ What Problem Output Looks Like

### Jerky Landing (BEFORE fixes)
```
🏃 ANTICIPATORY JUMP! power=-680, pos=(512.3, 340.1)
⬇️ FALLING: vy 180.3 → 250.8 (Δ70.5)  ← TOO FAST!
⬇️ FALLING: vy 250.8 → 335.2 (Δ84.4)  ← ACCELERATING TOO MUCH!
📍 SNAP CHECK: distFromSurface=18.5px, vy=335.2, needsSnap=true, fallingFast=true
🔧 SNAPPED: y 348.5 → 330.0 (moved -18.5px)  ← BIG SNAP!
📍 SNAP CHECK: distFromSurface=12.3px, vy=0.0, needsSnap=true, fallingFast=false
🔧 SNAPPED: y 330.0 → 317.7 (moved -12.3px)  ← REPEATED SNAP!
🔄 RESET JUMP FLAGS (45ms since jump)  ← TOO SOON!
```

**Analysis**: ❌ Problems
- Velocity accelerating too fast (70+ per frame)
- Large snap distance (18.5px = visible jerk)
- Repeated snaps (system fighting itself)
- Grace period too short (45ms)

---

## 🔍 Common Patterns

### 1. Normal Walking (No Issues)
```
🎯 JUMP STATE: vy=0.0, isJumpingUp=false, justJumped=false, onGround=true
📍 SNAP CHECK: distFromSurface=0.5px, vy=0.0, needsSnap=false, fallingFast=false
```
**Good**: No unnecessary snapping when already grounded

---

### 2. Gentle Landing from Small Fall
```
⬇️ FALLING: vy 45.3 → 58.8 (Δ13.5)
⬇️ FALLING: vy 58.8 → 73.2 (Δ14.4)
⬇️ FALLING: vy 73.2 → 88.5 (Δ15.3)
📍 SNAP CHECK: distFromSurface=2.8px, vy=88.5, needsSnap=true, fallingFast=false
🔧 SNAPPED: y 348.5 → 345.7 (moved -2.8px)
```
**Good**: Soft landing detection, small snap, gentle velocity

---

### 3. Hard Landing from Big Fall
```
⬇️ FALLING: vy 420.5 → 448.2 (Δ27.7)
⬇️ FALLING: vy 448.2 → 476.9 (Δ28.7)
📍 SNAP CHECK: distFromSurface=8.5px, vy=476.9, needsSnap=true, fallingFast=true
🔧 SNAPPED: y 520.3 → 511.8 (moved -8.5px)
```
**Acceptable**: Larger snap for high-speed landing (still < 10px)

---

### 4. Stuck in Block (BUG!)
```
🎯 JUMP STATE: vy=0.0, isJumpingUp=false, justJumped=false, onGround=true
📍 SNAP CHECK: distFromSurface=-5.2px, vy=0.0, needsSnap=true, fallingFast=false
🔧 SNAPPED: y 348.5 → 353.7 (moved 5.2px)  ← MOVING DOWN INTO GROUND!
📍 SNAP CHECK: distFromSurface=-3.8px, vy=0.0, needsSnap=true, fallingFast=false
🔧 SNAPPED: y 353.7 → 357.5 (moved 3.8px)  ← STILL SINKING!
```
**Problem**: Negative distance = monster inside block, system trying to push up

---

## 📊 Metrics to Track

### Snap Distance
- **0-2px**: Perfect (no visible snap)
- **2-5px**: Excellent (barely noticeable)
- **5-10px**: Good (slight jerk, acceptable)
- **10-20px**: Poor (visible snap)
- **20+px**: Bad (teleporting)

### Velocity Changes
- **< 20/frame**: Smooth
- **20-40/frame**: Acceptable
- **40-70/frame**: Jerky
- **70+/frame**: Too fast

### Grace Period
- **100ms+**: Good
- **50-100ms**: Acceptable
- **< 50ms**: Too short (causes re-snapping)

### Jump Power
- **-500 to -600**: Good arc
- **-600 to -700**: Strong but smooth
- **-700+**: Too aggressive

---

## 🎮 Real-Time Debugging Tips

### Watch for These Red Flags
1. **Repeated snaps** within 100ms
2. **Large velocity jumps** (Δ > 50)
3. **Negative distances** (inside blocks)
4. **Rapid state flips** (onGround toggling)
5. **Zero grace period** (immediate resets)

### Good Signs
1. **Smooth velocity curves** (gradual changes)
2. **Single snap per landing**
3. **Consistent distances** (not fighting gravity)
4. **100ms+ between resets**
5. **Small corrections** (< 5px snaps)

---

## 🔧 Tuning Guide

If you see problems, adjust these values in `GameScene.ts`:

```typescript
// Jump power (line ~3287)
const jumpPower = -600; // Increase for higher jumps

// Gravity multiplier (line ~3010)
const gravityMultiplier = 1.3; // Reduce for slower falls

// Snap threshold (line ~2723)
const needsSnap = Math.abs(distanceFromSurface) > 2; // Increase to 3 or 4 to reduce snapping

// Grace period (line ~2762)
if (timeSinceJump > 100) { // Increase to 150 for more tolerance

// Soft landing (line ~2745)
monster.position.vy *= 0.3; // Reduce to 0.2 for softer landings
```

---

## 💡 Example Test Session

```bash
1. Start game
2. Press J on a monster
3. Watch it jump over obstacles
4. Check console for patterns
5. Adjust values if needed
6. Press J to disable
7. Repeat with different monsters
```

Look for the smoothest jumpers and compare their genetics/movement types!
