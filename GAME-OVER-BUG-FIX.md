# Game Over Bug Fix - UI/Logic Synchronization

## The Bug

**Symptoms:**
- UI showed "Game Over - No possible words found"
- UI showed "# Remaining Words: 0"
- BUT the "Top Suggestions" list was populated with valid words (e.g., "MUGGY", "PUDGY")

**Root Cause:**
The fallback mechanism (switching to `allowed-guesses` when `possible-answers` is empty) successfully found candidates, but the UI was displaying the count from the strict `possible-answers` list instead of the actual candidates found.

## The Problem in Detail

### Before the Fix

1. **Game State Logic** (`useGameState.ts`):
   - When `possible-answers` filtered to 0 results, it fell back to `allowed-guesses` ✅
   - `gameState.remainingWords` correctly contained the fallback words ✅

2. **Suggestion Logic** (`useWordleSolver.ts`):
   - Checked `gameState.remainingWords.length === 0` and cleared suggestions ❌
   - Also checked `gameState.isComplete` which was incorrectly set ❌

3. **UI Display** (`app/page.tsx`):
   - Displayed `solver.gameState.remainingWords.length` which could be out of sync ❌
   - Showed "Game Over" when there were actually valid suggestions available ❌

### The Core Issue

The "Game Over" state was determined by intermediate filtering steps rather than the **final suggestion results**. This created a disconnect where:
- Internal state said: "0 words remaining" (from strict filter)
- Actual reality: Worker found valid candidates via fallback
- UI showed: Conflicting information

## The Fix

### 1. Updated Suggestion Logic (`hooks/useWordleSolver.ts`)

**Changed from:**
```typescript
if (gameState.remainingWords.length === 0 ||
    gameState.isComplete ||
    !shouldCalculateEntropy(gameState.remainingWords.length)) {
  setSuggestions([]);
  return;
}
```

**Changed to:**
```typescript
// Don't calculate if game is won
if (gameStateHook.isWon) {
  setSuggestions([]);
  return;
}

// Continue calculations even if remainingWords is low
// This allows fallback words to be suggested
```

**Key improvements:**
- Removed the check for `gameState.isComplete` (which was based on strict filtering)
- Only stop calculating if game is **actually won**
- Allow suggestions to be generated even at attempt 6 if words remain
- Handle small word sets gracefully (return them directly without entropy calc)

### 2. Added Actual Remaining Words Count

**New computed property:**
```typescript
const actualRemainingWords = useMemo(() => {
  // If we have suggestions, use the count from the first suggestion
  // This reflects the actual candidate pool after fallback
  if (suggestions.length > 0 && suggestions[0].remainingWords !== undefined) {
    return suggestions[0].remainingWords;
  }

  // Otherwise use the gameState count
  return gameState.remainingWords.length;
}, [suggestions, gameState.remainingWords.length, showingOptimalOpeners]);
```

**Why this works:**
- Suggestions come from the Worker, which sees the **actual filtered list**
- The Worker calculates `remainingWords` based on the real candidate pool
- This count reflects fallback results, not just the strict dictionary

### 3. Updated UI to Use Actual Count (`app/page.tsx`)

**Changed from:**
```typescript
<PerformanceStats
  remainingWords={solver.gameState.remainingWords.length}
  ...
/>

{solver.gameState.remainingWords.length > 0 ? ... : 'No possible words found'}
```

**Changed to:**
```typescript
<PerformanceStats
  remainingWords={solver.actualRemainingWords}
  ...
/>

{solver.actualRemainingWords > 0 ? ... : 'No possible words found'}
```

## Result

### After the Fix

✅ **UI shows correct count:** Displays the actual number of candidates found (including fallback)

✅ **Game Over logic correct:** Only shows "Game Over" when there are truly 0 suggestions

✅ **Fallback works seamlessly:** Users see all valid candidates regardless of which dictionary they came from

✅ **No false negatives:** Never shows "No words found" when suggestions exist

## Testing

To verify the fix works:

1. **Test with "muggy"** (now in expanded dictionary):
   - Should show "muggy" in suggestions
   - Should show correct remaining word count
   - Should NOT show "Game Over" prematurely

2. **Test with an obscure word** (only in `allowed-guesses`, not in `possible-answers`):
   - Enter clues that narrow down to that word
   - Verify word appears in suggestions
   - Verify correct count is displayed
   - Check console for fallback warning

3. **Test at attempt 6**:
   - Make 6 guesses without winning
   - Verify suggestions still appear if words remain
   - Verify "Game Over" only shows if no suggestions

## Technical Decisions

### Why base count on suggestions, not gameState?

**gameState.remainingWords** = Result of strict filtering on `possible-answers`
**suggestions** = Final results after Worker calculation (includes fallback)

The suggestions represent the **ground truth** of what candidates exist. The UI should reflect this reality, not intermediate filtering steps.

### Why remove isComplete check?

`isComplete` was being set too early, before the Worker had a chance to try the fallback. By basing the flow on:
- `isWon` (definitive)
- `suggestions.length` (actual results)

We ensure the UI reflects reality.

## Files Modified

1. `hooks/useWordleSolver.ts` - Updated suggestion logic, added `actualRemainingWords`
2. `app/page.tsx` - Updated UI to use `actualRemainingWords`

## Performance Impact

- No measurable performance degradation
- Suggestions may calculate slightly more often (at attempt 6)
- This is acceptable for better accuracy

## Future Improvements

1. **Better isComplete logic**: Decouple from dictionary filtering
2. **Worker-driven state**: Let Worker determine "game over" status
3. **Unified count**: Single source of truth for remaining words
