# Normalization Method Investigation Report

## 1. Executive Summary

- **Current method**: Z-score normalization (mean/stdDev, centered at 50)
- **Proposed method**: Range-based normalization (min-max scaling to 0-100)
- **Recommendation**: **Switch to range-based normalization** -- it is better suited for this app's relative ranking use case.

## 2. Current Implementation (Z-Score)

**File**: `src/composables/useScoring.js`, lines 82-102

**Formula**:
```
normalizedScore = clamp(0, 100, ((rawScore - mean) / stdDev) * 20 + 50)
```

- **Input**: Array of raw scores (quantity and quality) for all friends
- **mean**: Arithmetic mean of non-zero scores (population mean)
- **stdDev**: Population standard deviation, floored at 1 to avoid division by zero
- **SCALE = 20, OFFSET = 50**: Centers distribution at 50, with ~68% of friends in [30, 70]
- **Output range**: Clamped to [0, 100], but in practice rarely reaches either bound

**Example** (raw scores: [10, 20, 30, 40, 100]):
```
mean = 40, stdDev = 31.62
Friend A (10):  ((10-40)/31.62)*20 + 50 = 31.0
Friend B (20):  ((20-40)/31.62)*20 + 50 = 37.3
Friend C (30):  ((30-40)/31.62)*20 + 50 = 43.7
Friend D (40):  ((40-40)/31.62)*20 + 50 = 50.0
Friend E (100): ((100-40)/31.62)*20 + 50 = 87.9
```
Max is 87.9 (not 100). Min is 31.0 (not 0). Not intuitive.

**Edge cases**:
- `stdDev = 0` (all identical): floored to 1, all scores cluster near 50
- `stdDev < 1`: floored to 1 to prevent wild scaling
- All zero: returns 0 for all

## 3. Proposed Change (Range-Based)

**Formula**:
```
normalizedScore = round(((rawScore - min) / (max - min)) * 100)
```

**Example** (same raw scores: [10, 20, 30, 40, 100]):
```
min = 10, max = 100, range = 90
Friend A (10):  ((10-10)/90)*100 = 0
Friend B (20):  ((20-10)/90)*100 = 11.1
Friend C (30):  ((30-10)/90)*100 = 22.2
Friend D (40):  ((40-10)/90)*100 = 33.3
Friend E (100): ((100-10)/90)*100 = 100
```
Max is 100. Min is 0. Intuitive percentage scale.

**Edge cases handled**:
- All scores identical (`range = 0`): returns 50 for all
- Only one non-zero friend: returns 50 (single point, no range)
- All scores zero: returns 0 for all
- Mix of zero and non-zero: zero stays 0, others normalized among non-zero range

**Code diff**:
```diff
-/**
- * Z-score normalization: places the population mean at (50, 50) with a scale
- * such that ~68% of friends fall between 30 and 70. Stable as data grows.
- */
+/**
+ * Range-based normalization: scales scores so the top friend = 100 and the
+ * bottom friend = 0, making scores intuitive percentages of the observed range.
+ * Better than Z-score for relative ranking ("who to hang out with more").
+ */
 function normalizeScores(rawScores) {
   const nonZeroQ = rawScores.filter(s => s.rawQ > 0).map(s => s.rawQ)
   const nonZeroY = rawScores.filter(s => s.rawY > 0).map(s => s.rawY)

-  const meanQ = ...
-  const stdQ = ...
-  // Z-score formula with SCALE=20, OFFSET=50
+  const minQ = Math.min(...nonZeroQ)
+  const maxQ = Math.max(...nonZeroQ)
+  const rangeQ = maxQ - minQ
+  // Range formula: ((raw - min) / range) * 100
```

## 4. Pros/Cons Comparison

| Criterion | Z-Score | Range-Based |
|-----------|---------|-------------|
| Top friend always = 100 | No (e.g. 87.9) | **Yes** |
| Bottom friend always = 0 | No (e.g. 31.0) | **Yes** |
| Intuitive meaning | No ("50 = mean") | **Yes** ("75 = 75% of range") |
| Robust to outliers | **Better** (dampened by stdDev) | Worse (outlier stretches range) |
| Stable when adding friends | **Better** (mean/std shift slowly) | Worse (new min/max shifts all) |
| Simple to understand | No (requires stats knowledge) | **Yes** |
| Guaranteed [0, 100] output | Only with clamping | **Natural** |
| Good for relative ranking | Adequate | **Ideal** |

## 5. Recommendation

**Switch to range-based normalization.** Rationale:

1. **Use case is relative ranking**: The app answers "who should I hang out with more?" -- a relative question. Range-based normalization is purpose-built for relative comparison.

2. **Intuitive scatter plot**: On the scatter plot, 100 means "best among your friends" and 0 means "least among your friends." With Z-score, the top friend might show as 87.9 and the bottom as 31.0, which is confusing.

3. **Outlier sensitivity is acceptable**: In a friend group (typically 5-30 people), one outlier shifting the scale is actually *desired behavior* -- it correctly shows that one friend dominates a dimension.

4. **Stability trade-off is fine**: Scores shifting when adding friends is expected -- the app recalculates in real-time anyway. Users don't memorize their friends' scores.

5. **Gap calculation (quality - quantity) works better**: With range normalization, a gap of +30 means "quality is 30 percentage points above quantity relative to your friend group." With Z-score, the same gap has no intuitive interpretation.

The Z-score advantages (outlier robustness, stability) matter more for large populations and scientific measurements, not for a small-group social app.
