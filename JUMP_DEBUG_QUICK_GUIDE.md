# Jump Debug Quick Reference

## 🎮 How to Use

### Step 1: Enable Debugging
1. Pan camera to a monster you want to track
2. Press **J** key
3. Look for green circle ⭕ above the monster
4. Check top-left for "🦘 JUMP DEBUG: ON" message

### Step 2: Watch the Monster Move
- Open browser console (F12)
- Watch for color-coded debug messages:
  - 🎯 **Blue**: State tracking
  - ⬆️ **Green**: Jump/airborne states  
  - 📍 **Yellow**: Position snapping
  - ⬇️ **Red**: Falling/gravity
  - 🏃 **Purple**: Jump triggers
  - 🔄 **Gray**: State resets

### Step 3: Analyze the Data
Look for these patterns:

#### Smooth Jump ✅
```
🏃 ANTICIPATORY JUMP! power=-600
⬆️ KEEPING AIRBORNE (jumping up)
⬇️ FALLING: vy 125.3 → 145.8
📍 SNAP CHECK: needsSnap=true
🔧 SNAPPED: y 348.5 → 344.0 (moved -4.5px)
🔄 RESET JUMP FLAGS (150ms since jump)
```

#### Jerky/Snapping Jump ❌
```
🏃 ANTICIPATORY JUMP! power=-600
⬆️ KEEPING AIRBORNE
🔧 SNAPPED: moved -25.0px  ← TOO MUCH SNAP!
🔧 SNAPPED: moved -18.0px  ← REPEATED SNAPS!
```

### Step 4: Disable Debugging
- Press **J** again
- Green circle disappears
- Console output stops

## 🔍 What to Look For

### Good Signs ✅
- Snap movements < 10px
- Gradual velocity changes
- 100ms+ between state resets
- Smooth vy curves (no sudden jumps)

### Bad Signs ❌
- Snap movements > 20px
- Instant vy changes (0 → 300)
- Rapid state flipping
- Walking on air / inside blocks

## 📊 Key Metrics

| Metric | Good | Concerning |
|--------|------|------------|
| Snap distance | < 5px | > 15px |
| Velocity change | < 30/frame | > 100/frame |
| Jump power | -600 | < -700 |
| Fall multiplier | 1.3 | > 1.5 |

## 🐛 Common Issues & Fixes

### Issue: Monster teleports/snaps badly
**Look for**: Large snap distances (>20px)
**Fix**: Adjust `needsSnap` threshold in code

### Issue: Monster bounces on ground
**Look for**: Rapid onGround flipping
**Fix**: Increase grace period duration

### Issue: Jump too weak/strong
**Look for**: Jump power values in logs
**Fix**: Adjust `jumpPower` constant

### Issue: Falls too fast
**Look for**: High vy acceleration
**Fix**: Reduce `gravityMultiplier`

## 💡 Pro Tips

1. **Track multiple monsters**: Press J repeatedly while panning to different monsters
2. **Compare movement types**: Test different leg counts (0, 2, 4, 6, 8 legs)
3. **Test edge cases**: Force monsters into pits, onto pyramids, against walls
4. **Record issues**: Screenshot the console when you see jerkiness
5. **Time-based analysis**: Watch how movement changes over long periods

## 🎯 Testing Scenarios

### Basic Movement
- ✅ Walking on flat ground
- ✅ Jumping over 1-block obstacles
- ✅ Falling from 2-3 block heights
- ✅ Landing on slopes

### Edge Cases
- ⚠️ Jumping near ceiling
- ⚠️ Falling into narrow gaps
- ⚠️ Climbing steep pyramids
- ⚠️ Wall collision while jumping

### Performance
- ⏱️ Check frame rate with debug on
- ⏱️ Ensure < 5% performance impact
- ⏱️ Test with 50+ monsters

---
**Quick Toggle**: J key
**Visual**: Green circle above monster
**Output**: Browser console (F12)
